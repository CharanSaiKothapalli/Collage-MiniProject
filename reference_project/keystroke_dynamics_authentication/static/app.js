function setupCapture(textarea) {
  const state = {down: new Map(), holds: [], flights: [], first: null, lastDown: null, start: null};
  textarea.addEventListener("keydown", (e) => {
    if (e.repeat || e.key.length !== 1) return;
    const now = performance.now();
    if (state.start === null) state.start = now;
    if (state.first === null) state.first = now;
    if (state.lastDown !== null) state.flights.push(Math.max(1, now - state.lastDown));
    state.lastDown = now;
    state.down.set(e.code, now);
  });
  textarea.addEventListener("keyup", (e) => {
    if (e.key.length !== 1) return;
    const now = performance.now();
    const start = state.down.get(e.code);
    if (start !== undefined) {
      state.holds.push(Math.max(1, now - start));
      state.down.delete(e.code);
    }
  });
  function snapshot() {
    const now = performance.now();
    const payload = {
      user_id: window.KEYTRACE_USER_ID,
      holds: state.holds.slice(),
      flights: state.flights.slice(),
      elapsed_ms: state.start === null ? 0 : now - state.start
    };
    // Reset session after each save/check; typed content is never sent to the server.
    state.down.clear(); state.holds = []; state.flights = [];
    state.first = null; state.lastDown = null; state.start = null;
    return payload;
  }
  textarea.addEventListener("input", () => {});
  return snapshot;
}
const enrollCapture = setupCapture(document.getElementById("enroll-text"));
const verifyCapture = setupCapture(document.getElementById("verify-text"));
async function send(url, payload) {
  const response = await fetch(url, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || "Request failed");
  return data;
}
function show(el, html, kind="") { el.className = "result " + kind; el.innerHTML = html; }
document.getElementById("enroll-btn").addEventListener("click", async () => {
  const box = document.getElementById("enroll-result");
  try {
    const data = await send("/api/enroll", enrollCapture());
    document.getElementById("sample-count").textContent = data.count;
    show(box, `<b>Sample saved.</b> You have ${data.count} enrollment sessions.`, "good");
    document.getElementById("enroll-text").value = "";
  } catch (e) { show(box, e.message, "bad"); }
});
document.getElementById("verify-btn").addEventListener("click", async () => {
  const box = document.getElementById("verify-result");
  try {
    const data = await send("/api/verify", verifyCapture());
    const status = data.accepted ? "PATTERN MATCHES" : "NEEDS REVIEW";
    const kind = data.accepted ? "good" : "bad";
    show(box, `<b>${status}</b><p>Profile distance: ${data.score === null ? "n/a" : data.score.toFixed(3)}</p><details><summary>Technical details</summary><pre>${escapeHtml(JSON.stringify(data.details, null, 2))}</pre></details>`, kind);
    document.getElementById("verify-text").value = "";
    loadEvents();
  } catch (e) { show(box, e.message, "bad"); }
});
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
async function loadEvents() {
  const el = document.getElementById("event-list");
  try {
    const r = await fetch(`/api/status/${window.KEYTRACE_USER_ID}`); const d = await r.json();
    el.innerHTML = d.events.length ? d.events.map(e => `<div class="event"><span class="pill ${e.result==="ACCEPTED"?"accepted":"review"}">${e.result}</span><span>${e.score===null?"—":Number(e.score).toFixed(3)}</span><time>${new Date(e.created_at+"Z").toLocaleString()}</time></div>`).join("") : "<p class='muted'>No verification attempts yet.</p>";
    document.getElementById("sample-count").textContent = d.samples;
  } catch { el.textContent = "Could not load session log."; }
}
document.getElementById("refresh-btn").addEventListener("click", loadEvents);
loadEvents();
