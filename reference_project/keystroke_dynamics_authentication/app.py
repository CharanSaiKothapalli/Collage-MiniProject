import os, json, sqlite3, statistics
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(APP_DIR, "keystroke_auth.db")
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-this-development-secret")

FEATURE_NAMES = [
    "mean_hold", "std_hold", "median_hold", "mean_flight", "std_flight",
    "median_flight", "p90_flight", "chars_per_second", "pause_ratio",
    "hold_flight_ratio"
]

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            features TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS auth_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            result TEXT NOT NULL,
            score REAL,
            details TEXT,
            created_at TEXT NOT NULL
        )""")

def extract_features(payload):
    holds = np.asarray(payload.get("holds", []), dtype=float)
    flights = np.asarray(payload.get("flights", []), dtype=float)
    elapsed_ms = float(payload.get("elapsed_ms", 0))
    if len(holds) < 5 or len(flights) < 4 or elapsed_ms <= 0:
        raise ValueError("Please type at least a short sentence so the system has enough timing data.")
    # Reject obviously invalid or implausible browser measurements.
    holds = np.clip(holds, 1, 2000)
    flights = np.clip(flights, 1, 5000)
    mean_hold = float(np.mean(holds))
    mean_flight = float(np.mean(flights))
    return {
        "mean_hold": mean_hold,
        "std_hold": float(np.std(holds)),
        "median_hold": float(np.median(holds)),
        "mean_flight": mean_flight,
        "std_flight": float(np.std(flights)),
        "median_flight": float(np.median(flights)),
        "p90_flight": float(np.percentile(flights, 90)),
        "chars_per_second": float(len(holds) / (elapsed_ms / 1000.0)),
        "pause_ratio": float(np.mean(flights > 250)),
        "hold_flight_ratio": float(mean_hold / max(mean_flight, 1.0))
    }

def feature_vector(features):
    return [features[k] for k in FEATURE_NAMES]

def user_samples(user_id):
    with db() as conn:
        rows = conn.execute("SELECT features FROM samples WHERE user_id=?", (user_id,)).fetchall()
    return [json.loads(r["features"]) for r in rows]

def all_labeled_samples():
    with db() as conn:
        rows = conn.execute("""
            SELECT samples.features, users.username
            FROM samples JOIN users ON samples.user_id=users.id
        """).fetchall()
    return [(json.loads(r["features"]), r["username"]) for r in rows]

def score_against_profile(features, samples):
    """Return a transparent, personalized distance score; lower is more similar."""
    X = np.asarray([feature_vector(s) for s in samples], dtype=float)
    x = np.asarray(feature_vector(features), dtype=float)
    med = np.median(X, axis=0)
    mad = np.median(np.abs(X - med), axis=0)
    # MAD can be zero for small samples, so add a modest feature-scale floor.
    floor = np.maximum(np.abs(med) * 0.05, 1.0)
    scale = np.maximum(1.4826 * mad, floor)
    z = np.abs((x - med) / scale)
    score = float(np.mean(np.minimum(z, 10)))
    return score, z.tolist()

def authenticate(user, features):
    own = user_samples(user["id"])
    if len(own) < 5:
        return False, None, "Not enough enrollment samples. Save at least 5 typing sessions first."
    score, z = score_against_profile(features, own)
    # Threshold is a demo starting point; calibrate with real validation data.
    threshold = 2.8
    accepted = score <= threshold
    details = {
        "method": "personalized robust-distance profile",
        "score": round(score, 3),
        "threshold": threshold,
        "feature_deviations": {k: round(float(v), 2) for k, v in zip(FEATURE_NAMES, z)}
    }

    # When enough users and examples exist, train a supervised classifier for context.
    labeled = all_labeled_samples()
    names = {name for _, name in labeled}
    counts = {}
    for _, name in labeled:
        counts[name] = counts.get(name, 0) + 1
    if len(names) >= 2 and all(n >= 5 for n in counts.values()):
        X = np.asarray([feature_vector(f) for f, _ in labeled], dtype=float)
        y = np.asarray([name for _, name in labeled])
        model = make_pipeline(StandardScaler(), RandomForestClassifier(
            n_estimators=160, class_weight="balanced", random_state=42
        ))
        model.fit(X, y)
        predicted = str(model.predict([feature_vector(features)])[0])
        probabilities = model.predict_proba([feature_vector(features)])[0]
        confidence = float(max(probabilities))
        details["classifier_prediction"] = predicted
        details["classifier_confidence"] = round(confidence, 3)
        details["classifier_classes"] = list(model.classes_)
        # Use the classifier as an additional signal, not the only decision.
        accepted = accepted and predicted == user["username"]
        details["method"] = "profile distance + Random Forest cross-user classifier"
    return accepted, score, json.dumps(details)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        if len(username) < 3 or len(username) > 32:
            flash("Username must be 3–32 characters.", "error")
        elif len(password) < 8:
            flash("Use a password with at least 8 characters.", "error")
        else:
            try:
                with db() as conn:
                    conn.execute("INSERT INTO users(username,password_hash,created_at) VALUES(?,?,?)",
                                 (username, generate_password_hash(password), datetime.utcnow().isoformat()))
                flash("Account created. Sign in, then enroll at least 5 typing sessions.", "success")
                return redirect(url_for("login"))
            except sqlite3.IntegrityError:
                flash("That username already exists.", "error")
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        with db() as conn:
            user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        if user and check_password_hash(user["password_hash"], password):
            return render_template("workspace.html", user=dict(user), samples=len(user_samples(user["id"])))
        flash("Invalid username or password.", "error")
    return render_template("login.html")

@app.route("/api/enroll", methods=["POST"])
def enroll():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    with db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        return jsonify(ok=False, error="Please sign in again."), 401
    try:
        features = extract_features(data)
    except (ValueError, TypeError) as exc:
        return jsonify(ok=False, error=str(exc)), 400
    with db() as conn:
        conn.execute("INSERT INTO samples(user_id,features,created_at) VALUES(?,?,?)",
                     (user_id, json.dumps(features), datetime.utcnow().isoformat()))
        count = conn.execute("SELECT COUNT(*) AS n FROM samples WHERE user_id=?", (user_id,)).fetchone()["n"]
    return jsonify(ok=True, count=count, features=features)

@app.route("/api/verify", methods=["POST"])
def verify():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    with db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        return jsonify(ok=False, error="Please sign in again."), 401
    try:
        features = extract_features(data)
    except (ValueError, TypeError) as exc:
        return jsonify(ok=False, error=str(exc)), 400
    accepted, score, details = authenticate(user, features)
    result = "ACCEPTED" if accepted else "REVIEW"
    with db() as conn:
        conn.execute("INSERT INTO auth_events(user_id,result,score,details,created_at) VALUES(?,?,?,?,?)",
                     (user_id, result, score, details, datetime.utcnow().isoformat()))
    return jsonify(ok=True, accepted=accepted, result=result, score=score, details=json.loads(details))

@app.route("/api/status/<int:user_id>")
def status(user_id):
    with db() as conn:
        user = conn.execute("SELECT id,username FROM users WHERE id=?", (user_id,)).fetchone()
        events = conn.execute("SELECT result,score,created_at FROM auth_events WHERE user_id=? ORDER BY id DESC LIMIT 8",
                              (user_id,)).fetchall()
    if not user:
        return jsonify(ok=False), 404
    return jsonify(ok=True, username=user["username"], samples=len(user_samples(user_id)), events=[dict(e) for e in events])

@app.route("/health")
def health():
    return jsonify(status="ok", app="Keystroke Dynamics Authentication Demo")

if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="127.0.0.1", port=5000)
