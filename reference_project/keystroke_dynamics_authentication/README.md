# KeyTrace — Keystroke Dynamics Authentication

A student mini-project prototype for **“A Keystroke-Dynamics Classifier for Continuous Behavioural User Authentication.”**

## Features
- User registration and password-hashed login.
- Browser-side keystroke timing capture.
- Enrollment sessions stored as numeric timing features; the typed text itself is not sent to the backend.
- Personal profile-distance check for a new typing session.
- Optional cross-user Random Forest classifier once at least two users have enrolled at least five samples each.
- Verification event log and technical details panel.
- SQLite database created automatically.

## Requirements
- Python 3.10 or newer recommended.
- A modern desktop browser recommended for the best timing consistency.

## Run locally

### Windows
```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

### macOS / Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000` in your browser.

## Suggested demonstration
1. Create a demo account and sign in.
2. Enroll at least 5 short typing sessions using varied sentences.
3. Verify a fresh session and inspect the result and feature deviations.
4. Create a second consenting test account and collect at least 5 samples for each account.
5. Test both accounts with genuine and cross-user samples.
6. Record the results and discuss false accepts, false rejects, and limitations.

## Important technical notes
- The decision threshold (`2.8`) is a starting point, not a validated security threshold. Calibrate it using held-out genuine and impostor sessions.
- The feature profile is a lightweight baseline. Browser, keyboard, fatigue, language, and typing context can shift timing.
- The Random Forest is only activated when at least two users each have at least five recorded samples. Use separate train/test sessions; otherwise reported accuracy may be misleading.
- This app does not capture the actual text content, but timing patterns can still be sensitive behavioural biometric data.
- This is an academic prototype and is not suitable for production authentication or high-stakes access control.
- For a real deployment, add CSRF protection, rate limiting, secure session management, HTTPS, account recovery, data retention/deletion controls, privacy review, model validation, and security testing.

## Project structure
```text
keystroke_dynamics_authentication/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── workspace.html
└── static/
    ├── app.js
    └── style.css
```

## Database
`keystroke_auth.db` is created automatically when the app starts. Delete it only if you want to reset all demo accounts and samples.

## Troubleshooting
- If enrollment says there is not enough data, type a longer sentence; at least 5 hold durations and 4 flight times are required.
- Use the same browser and keyboard for repeatable tests.
- Avoid testing with only one sample. Enroll multiple sessions.
- If `pip` fails, upgrade it with `python -m pip install --upgrade pip`.
