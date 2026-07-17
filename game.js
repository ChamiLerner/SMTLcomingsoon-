/* ============================================================
   אזור החידה — שני משחקים יומיים + טבלת אלופים משותפת
   1) ״מה הקשר?״ (Connections) על הפעילות של מחר
   2) ״חידון איטליה״ (טריוויה)
   נתונים משותפים לכל הקבוצה דרך here.now Site Data.
   ============================================================ */
"use strict";
(function () {
  const DATA_BASE = location.origin + "/.herenow/data";
  const ME_KEY = "dolo_me";
  const DONE_KEY = "dolo_done_v2";     // { "connect|<date>": {...}, "quiz|<date>": {...} }
  const MAXMISS = 4;
  const DIFF = { 1: "d1", 2: "d2", 3: "d3", 4: "d4" };

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const uid = () => "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const members = () => window.TRIP_MEMBERS || [];
  const nameOf = id => { const m = members().find(x => x.id === id); return m ? m.name : "משתתף/ת"; };
  const RULES = `<ul class="game-rules">
    <li>מצאו <b>4 קבוצות של 4</b> אריחים שקשורים ביניהם.</li>
    <li>בחרו 4 אריחים ולחצו <b>אישור</b>.</li>
    <li>נכון → הקבוצה נפתחת ונצבעת. טעות → מפסידים ניסיון (עד <b>4 טעויות</b>).</li>
    <li>הצבעים לפי קושי: 🟨 קל · 🟩 · 🟦 · 🟪 קשה.</li>
    <li><b>ערבוב</b> מסדר מחדש · <b>נקה</b> מבטל בחירה.</li>
    <li>נקודה לכל קבוצה + בונוס <b>‎2‎</b> לפתרון מושלם. עולים לטבלת האלופים 🏆</li>
  </ul>`;

  /* ---------- תאריכים ---------- */
  function isoToday() { try { return window.todayISO ? todayISO() : new Date().toISOString().slice(0, 10); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  const PUZ = () => window.PUZZLES || {};
  const QUIZ = () => window.ITALY_QUIZ || {};
  function unlockedDates() { const t1 = addDays(isoToday(), 1); const all = new Set([...Object.keys(PUZ()), ...Object.keys(QUIZ())]); return [...all].filter(d => d <= t1).sort(); }
  function defaultDate() {
    const un = unlockedDates(); if (!un.length) return null;
    const t1 = addDays(isoToday(), 1);
    return un.includes(t1) ? t1 : un[un.length - 1];
  }
  function dayLabel(pdate) {
    const d = (window.TRIP_DATA || []).find(x => x.date === pdate);
    const p = PUZ()[pdate];
    return { n: d ? d.n : "", title: (p && p.title) || (d && d.title) || "" };
  }

  /* ---------- מצב ---------- */
  let me = null, pdate = null, mode = "connect";
  // connect
  let puzzle = null, tiles = [], selected = [], solved = [], mistakes = 0, phase = "play";
  // quiz
  let quiz = null, qi = 0, qsel = [], qphase = "play";
  let allScores = null, pollTimer = null, flushing = false;

  function loadDone() { try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; } catch (e) { return {}; } }
  function myDone(game, d) { return loadDone()[game + "|" + d]; }
  function setDone(game, d, res) { const m = loadDone(); m[game + "|" + d] = res; try { localStorage.setItem(DONE_KEY, JSON.stringify(m)); } catch (e) {} }

  /* ---------- Site Data ---------- */
  async function fetchScores() {
    let out = [], cursor = "";
    for (let g = 0; g < 12; g++) {
      const r = await fetch(DATA_BASE + "/scores?limit=100" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : ""), { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error("scores " + r.status);
      const j = await r.json(); out = out.concat(j.records || []);
      if (!j.nextCursor) break; cursor = j.nextCursor;
    }
    return out.map(x => x.data || {});
  }
  async function postScore(rec) {
    try {
      await fetch(DATA_BASE + "/scores", {
        method: "POST",
        headers: { "content-type": "application/json", "Idempotency-Key": rec.player + ":" + rec.game + ":" + rec.pdate },
        body: JSON.stringify(rec)
      });
    } catch (e) {}
  }

  /* ============================================================
     ״מה הקשר?״
     ============================================================ */
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
  function buildBoard() {
    puzzle = PUZ()[pdate] || null;
    tiles = []; selected = []; solved = []; mistakes = 0; phase = "play";
    if (!puzzle) return;
    puzzle.groups.forEach((g, gi) => g.items.forEach(it => tiles.push({ item: it, gi })));
    shuffle(tiles);
    const done = myDone("connect", pdate);
    if (done) { phase = done.solved ? "won" : "lost"; solved = puzzle.groups.map((_, i) => i); mistakes = done.mistakes | 0; }
  }
  window.gameShuffle = function () { if (phase !== "play") return; shuffle(tiles); render(); };
  window.gameClear = function () { selected = []; render(); };
  window.gameTap = function (idx) {
    if (phase !== "play") return;
    const pos = selected.indexOf(idx);
    if (pos >= 0) selected.splice(pos, 1); else if (selected.length < 4) selected.push(idx);
    render();
  };
  window.gameSubmit = function () {
    if (phase !== "play" || selected.length !== 4) return;
    const gis = selected.map(i => tiles[i].gi);
    if (gis.every(g => g === gis[0])) {
      solved.push(gis[0]);
      const rm = new Set(selected); tiles = tiles.filter((_, i) => !rm.has(i)); selected = [];
      if (solved.length === 4) finishConnect(true); else render();
      return;
    }
    const counts = {}; gis.forEach(g => counts[g] = (counts[g] || 0) + 1);
    const near = Math.max(...Object.values(counts)) === 3;
    mistakes++; selected = [];
    if (mistakes >= MAXMISS) finishConnect(false);
    else { toast(near ? "כמעט! פספסתם באחת 😬" : "לא מדויק — נסו שוב"); render(); }
  };
  function finishConnect(won) {
    const realSolved = solved.length;
    phase = won ? "won" : "lost";
    const points = realSolved + (won && mistakes === 0 ? 2 : 0);
    setDone("connect", pdate, { solved: won, mistakes, points });
    if (!won) solved = puzzle.groups.map((_, i) => i);
    if (me) postScore({ xid: uid(), player: me, game: "connect", pdate, solved: won, mistakes, points, ts: Date.now() }).then(refreshLeaderboard);
    render();
  }

  function connectBodyHTML() {
    if (!puzzle) return `<div class="exp-empty">החידה הבאה תיפתח בקרוב — כל ערב על הפעילות של מחר.</div>`;
    const banners = solved.map(gi => {
      const g = puzzle.groups[gi];
      return `<div class="game-group ${DIFF[g.diff]}"><b>${esc(g.cat)}</b><span>${g.items.map(esc).join(" · ")}</span></div>`;
    }).join("");
    let boardHTML;
    if (phase === "play") {
      const grid = tiles.map((t, i) => `<button class="game-tile${selected.includes(i) ? " sel" : ""}" onclick="gameTap(${i})">${esc(t.item)}</button>`).join("");
      const dots = Array.from({ length: MAXMISS }, (_, k) => `<span class="miss-dot${k < mistakes ? " used" : ""}"></span>`).join("");
      boardHTML = `<div class="game-grid">${grid}</div>
        <div class="game-miss">טעויות: ${dots}</div>
        <div class="game-ctrls">
          <button class="game-btn" onclick="gameShuffle()">🔀 ערבוב</button>
          <button class="game-btn" onclick="gameClear()">נקה</button>
          <button class="game-btn go${selected.length === 4 ? "" : " off"}" onclick="gameSubmit()">אישור</button>
        </div>`;
    } else {
      const won = phase === "won"; const res = myDone("connect", pdate) || { mistakes, points: 0 };
      boardHTML = `<div class="game-result ${won ? "win" : "lose"}">
        <div class="game-result-emoji">${won ? (res.mistakes === 0 ? "🏆" : "🎉") : "😅"}</div>
        <b>${won ? (res.mistakes === 0 ? "מושלם! בלי טעויות" : "כל הכבוד, פתרת!") : "נגמרו הניסיונות"}</b>
        <span>${res.points} נקודות · ${res.mistakes} טעויות</span>
        ${nextUnplayed() ? `<button class="go" style="margin-top:12px" onclick="gameGoto('${nextUnplayed()}')">לחידה הבאה ›</button>` : ""}
      </div>`;
    }
    const help = phase === "play" ? `<details class="game-help"><summary>❓ איך משחקים?</summary>${RULES}</details>` : "";
    return `${help}<div class="game-board">${banners}${boardHTML}</div>`;
  }

  /* ============================================================
     ״חידון איטליה״
     ============================================================ */
  function buildQuiz() { quiz = QUIZ()[pdate] || null; qi = 0; qsel = []; qphase = quiz ? "play" : "none"; }
  window.gameQuizAns = function (idx) {
    if (qphase !== "play" || qsel[qi] != null) return;
    qsel[qi] = idx; render();
  };
  window.gameQuizNext = function () {
    if (qsel[qi] == null) return;
    if (qi < quiz.length - 1) { qi++; render(); } else finishQuiz();
  };
  function finishQuiz() {
    qphase = "done";
    const correct = quiz.reduce((n, q, i) => n + (qsel[i] === q.c ? 1 : 0), 0);
    const solvedAll = correct === quiz.length;
    const mistakesQ = quiz.length - correct;
    const points = correct + (solvedAll ? 2 : 0);
    setDone("quiz", pdate, { solved: solvedAll, mistakes: mistakesQ, points });
    if (me) postScore({ xid: uid(), player: me, game: "quiz", pdate, solved: solvedAll, mistakes: mistakesQ, points, ts: Date.now() }).then(refreshLeaderboard);
    render();
  }
  function quizBodyHTML() {
    if (!quiz) return `<div class="exp-empty">חידון היום ייפתח בקרוב 🇮🇹</div>`;
    const done = myDone("quiz", pdate);
    if (done || qphase === "done") {
      const total = quiz.length;
      const res = done || { mistakes: 0, points: 0, solved: false };
      const correct = total - (res.mistakes | 0);
      const perfect = res.solved && (res.mistakes | 0) === 0;
      return `<div class="game-result ${res.solved ? "win" : "lose"}">
        <div class="game-result-emoji">${perfect ? "🏆" : correct >= 3 ? "🎉" : "🇮🇹"}</div>
        <b>${correct} מתוך ${total} נכון</b>
        <span>${res.points} נקודות</span>
        ${nextUnplayed() ? `<button class="go" style="margin-top:12px" onclick="gameGoto('${nextUnplayed()}')">לחידון הבא ›</button>` : ""}
      </div>`;
    }
    const q = quiz[qi]; const answered = qsel[qi] != null;
    const opts = q.a.map((opt, idx) => {
      let cls = "quiz-opt";
      if (answered) { if (idx === q.c) cls += " correct"; else if (idx === qsel[qi]) cls += " wrong"; }
      return `<button class="${cls}"${answered ? " disabled" : ""} onclick="gameQuizAns(${idx})">${esc(opt)}</button>`;
    }).join("");
    const dots = quiz.map((_, k) => `<span class="qdot${qsel[k] != null ? (qsel[k] === quiz[k].c ? " ok" : " no") : ""}${k === qi ? " cur" : ""}"></span>`).join("");
    return `<div class="quiz-wrap">
      <div class="quiz-top"><span>שאלה ${qi + 1} מתוך ${quiz.length}</span><span class="qdots">${dots}</span></div>
      <div class="quiz-q">${esc(q.q)}</div>
      <div class="quiz-opts">${opts}</div>
      ${answered ? `<button class="go quiz-next" onclick="gameQuizNext()">${qi < quiz.length - 1 ? "הבא ›" : "סיום"}</button>` : ""}
    </div>`;
  }

  /* ============================================================
     טבלת אלופים (משותפת לשני המשחקים)
     ============================================================ */
  function leaderboard() {
    const agg = {};
    (allScores || []).forEach(s => {
      const p = s.player; if (!p) return;
      if (!agg[p]) agg[p] = { player: p, points: 0, solved: 0, perfect: 0 };
      agg[p].points += s.points | 0;
      if (s.solved) agg[p].solved++;
      if (s.solved && (s.mistakes | 0) === 0) agg[p].perfect++;
    });
    return Object.values(agg).sort((a, b) => b.points - a.points || b.solved - a.solved || a.player.localeCompare(b.player));
  }
  function renderLeaderboardSlot() {
    const el = document.getElementById("gameLeaderboard"); if (!el) return;
    const rows = leaderboard();
    if (!rows.length) { el.innerHTML = `<div class="exp-empty">עוד לא שיחקו — היו הראשונים! 🏆</div>`; return; }
    const medal = i => ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
    el.innerHTML = rows.map((r, i) => `<div class="lb-row${r.player === me ? " me" : ""}">
      <span class="lb-rank">${medal(i)}</span>
      <span class="lb-name">${esc(nameOf(r.player))}${r.perfect ? ` <span class="lb-perf">★${r.perfect}</span>` : ""}</span>
      <span class="lb-pts"><b>${r.points}</b> נק׳</span>
    </div>`).join("");
  }
  function nextUnplayed() { return unlockedDates().find(d => d !== pdate && !myDone(mode, d)) || null; }

  async function refreshLeaderboard() {
    try { allScores = await fetchScores(); } catch (e) { allScores = allScores || []; }
    // שיקוף ״כבר שיחקת״ (גם ממכשיר אחר) לשני המשחקים
    let changed = false;
    ["connect", "quiz"].forEach(g => {
      const mine = (allScores || []).find(s => s.player === me && (s.game || "connect") === g && s.pdate === pdate);
      if (mine && !myDone(g, pdate)) { setDone(g, pdate, { solved: !!mine.solved, mistakes: mine.mistakes | 0, points: mine.points | 0 }); changed = true; }
    });
    if (changed) { syncPhaseFromDone(); render(); } else renderLeaderboardSlot();
  }
  function syncPhaseFromDone() {
    const dc = myDone("connect", pdate);
    if (dc && puzzle && phase === "play") { phase = dc.solved ? "won" : "lost"; solved = puzzle.groups.map((_, i) => i); mistakes = dc.mistakes | 0; }
    const dq = myDone("quiz", pdate);
    if (dq && qphase === "play") qphase = "done";
  }

  /* ============================================================
     שלד + ניתוב
     ============================================================ */
  window.gamePick = function () { renderIdentity(); };
  window.gameSetMe = function (id) { me = id; try { localStorage.setItem(ME_KEY, id); } catch (e) {} setup(defaultDate()); refreshLeaderboard(); };
  window.gameMode = function (m) { mode = m; render(); };
  window.gameGoto = function (d) { setup(d); refreshLeaderboard(); };

  function setup(d) { pdate = d; buildBoard(); buildQuiz(); render(); }

  function renderIdentity() {
    const el = document.getElementById("gameBody"); if (!el) return;
    el.innerHTML = `<div class="wrap">
      <div class="game-hero"><div class="game-hero-emoji">🧩</div>
        <h2>אזור החידה</h2><p>שני משחקים יומיים — ״מה הקשר?״ על הפעילות של מחר, ו״חידון איטליה״.<br>פתרו, צברו נקודות, ותתחרו 😉</p></div>
      <div class="section"><div class="section-label">איך משחקים? (מה הקשר)</div>
        <div class="game-help-card">${RULES}</div></div>
      <div class="section"><div class="section-label">מי את/ה?</div>
        <div class="game-people">${members().map(m => `<button class="game-me" onclick="gameSetMe('${m.id}')">${esc(m.name)}</button>`).join("")}</div>
        <p class="exp-hint" style="margin-top:10px">הבחירה נשמרת במכשיר — כדי שהנקודות שלך יופיעו בטבלת האלופים.</p>
      </div></div>`;
  }

  function render() {
    const el = document.getElementById("gameBody"); if (!el) return;
    if (!me) { renderIdentity(); return; }
    if (!pdate) { el.innerHTML = `<div class="wrap"><div class="game-hero"><div class="game-hero-emoji">🧩</div><h2>אזור החידה</h2><p>המשחק הבא ייפתח בקרוב.</p></div></div>`; return; }
    const dl = dayLabel(pdate), un = unlockedDates();
    const eyebrow = mode === "quiz" ? `חידון איטליה · יום ${dl.n}` : `חידת היום · על יום ${dl.n}`;
    const title = mode === "quiz" ? "כמה אתם מכירים את איטליה? 🇮🇹" : dl.title;
    const chooser = un.length > 1 ? `<div class="game-days">${un.map(d => {
      const l = dayLabel(d), played = !!myDone(mode, d);
      return `<button class="game-day${d === pdate ? " sel" : ""}${played ? " played" : ""}" onclick="gameGoto('${d}')">יום ${l.n}${played ? " ✓" : ""}</button>`;
    }).join("")}</div>` : "";

    el.innerHTML = `<div class="wrap">
      <div class="game-head"><div class="game-head-t"><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2></div>
        <button class="game-switch" onclick="gamePick()">${esc(nameOf(me))} ⇄</button></div>
      <div class="game-modes">
        <button class="game-mode${mode === "connect" ? " sel" : ""}" onclick="gameMode('connect')">🧩 מה הקשר?</button>
        <button class="game-mode${mode === "quiz" ? " sel" : ""}" onclick="gameMode('quiz')">🇮🇹 חידון איטליה</button>
      </div>
      ${chooser}
      <div id="gameModeBody">${mode === "quiz" ? quizBodyHTML() : connectBodyHTML()}</div>
      <div class="section"><div class="section-label">🏆 טבלת האלופים</div>
        <div id="gameLeaderboard"><div class="exp-empty">טוען…</div></div>
        <p class="exp-hint" style="text-align:center">נקודות משני המשחקים נספרות יחד · בונוס ‎+2‎ לפתרון מושלם.</p>
      </div>
    </div>`;
    renderLeaderboardSlot();
  }

  function toast(msg) {
    let t = document.getElementById("gameToast");
    if (!t) { t = document.createElement("div"); t.id = "gameToast"; t.className = "game-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------- אתחול ---------- */
  function boot() {
    try { me = localStorage.getItem(ME_KEY) || null; } catch (e) {}
    pdate = defaultDate();
    if (pdate) { buildBoard(); buildQuiz(); }
    render();
    refreshLeaderboard();
    if (!pollTimer) pollTimer = setInterval(() => { if (document.visibilityState === "visible" && document.getElementById("gameLeaderboard")) refreshLeaderboard(); }, 20000);
    const tab = document.querySelector('.tabbar button[data-view="game"]');
    if (tab) tab.addEventListener("click", () => refreshLeaderboard());
  }
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
