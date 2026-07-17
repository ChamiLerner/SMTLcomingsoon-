/* ============================================================
   ״מה הקשר?״ — משחק יומי על הפעילות של מחר + טבלת אלופים
   נתונים משותפים לכל הקבוצה דרך here.now Site Data.
   ============================================================ */
"use strict";
(function () {
  const DATA_BASE = location.origin + "/.herenow/data";
  const ME_KEY = "dolo_me";
  const DONE_KEY = "dolo_game_done";       // { "<pdate>": {solved,mistakes,points} }
  const MAXMISS = 4;
  const DIFF = { 1: "d1", 2: "d2", 3: "d3", 4: "d4" };

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const uid = () => "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const members = () => window.TRIP_MEMBERS || [];
  const RULES = `<ul class="game-rules">
    <li>מצאו <b>4 קבוצות של 4</b> אריחים שקשורים ביניהם.</li>
    <li>בחרו 4 אריחים ולחצו <b>אישור</b>.</li>
    <li>נכון → הקבוצה נפתחת ונצבעת. טעות → מפסידים ניסיון (עד <b>4 טעויות</b>).</li>
    <li>הצבעים לפי קושי: 🟨 קל · 🟩 · 🟦 · 🟪 קשה.</li>
    <li><b>ערבוב</b> מסדר מחדש · <b>נקה</b> מבטל בחירה.</li>
    <li>נקודה לכל קבוצה שנפתרה + בונוס <b>‎2‎</b> לפתרון מושלם ללא טעויות. השם שלכם עולה לטבלת האלופים 🏆</li>
  </ul>`;
  const nameOf = id => { const m = members().find(x => x.id === id); return m ? m.name : "משתתף/ת"; };

  /* ---------- תאריכים ---------- */
  function isoToday() { try { return window.todayISO ? todayISO() : new Date().toISOString().slice(0, 10); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  const PUZ = () => window.PUZZLES || {};
  function unlockedDates() { const t1 = addDays(isoToday(), 1); return Object.keys(PUZ()).filter(d => d <= t1).sort(); }
  function defaultDate() {
    const un = unlockedDates(); if (!un.length) return null;
    const t1 = addDays(isoToday(), 1);
    return PUZ()[t1] && un.includes(t1) ? t1 : un[un.length - 1];
  }
  function dayLabel(pdate) {
    const d = (window.TRIP_DATA || []).find(x => x.date === pdate);
    const p = PUZ()[pdate];
    return { n: d ? d.n : "", title: (p && p.title) || (d && d.title) || "", place: d && d.base || "" };
  }

  /* ---------- מצב ---------- */
  let me = null, pdate = null, puzzle = null;
  let tiles = [], selected = [], solved = [], mistakes = 0, phase = "play";
  let allScores = null;

  function loadDone() { try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; } catch (e) { return {}; } }
  function saveDone(map) { try { localStorage.setItem(DONE_KEY, JSON.stringify(map)); } catch (e) {} }
  function myDone(d) { return loadDone()[d]; }

  /* ---------- Site Data ---------- */
  async function fetchScores() {
    let out = [], cursor = "";
    for (let g = 0; g < 10; g++) {
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
        headers: { "content-type": "application/json", "Idempotency-Key": rec.player + ":" + rec.pdate },
        body: JSON.stringify(rec)
      });
    } catch (e) {}
  }

  /* ---------- בניית לוח ---------- */
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
  function buildBoard() {
    tiles = [];
    puzzle.groups.forEach((g, gi) => g.items.forEach(it => tiles.push({ item: it, gi })));
    shuffle(tiles);
    selected = []; solved = []; mistakes = 0; phase = "play";
  }

  /* ============================================================ */
  window.gamePick = function () { renderIdentity(); };
  window.gameSetMe = function (id) { me = id; try { localStorage.setItem(ME_KEY, id); } catch (e) {} start(defaultDate()); };
  window.gameGoto = function (d) { start(d); };
  window.gameShuffle = function () { if (phase !== "play") return; shuffle(tiles); render(); };
  window.gameClear = function () { selected = []; render(); };

  window.gameTap = function (idx) {
    if (phase !== "play") return;
    const pos = selected.indexOf(idx);
    if (pos >= 0) selected.splice(pos, 1);
    else if (selected.length < 4) selected.push(idx);
    render();
  };

  window.gameSubmit = function () {
    if (phase !== "play" || selected.length !== 4) return;
    const gis = selected.map(i => tiles[i].gi);
    const same = gis.every(g => g === gis[0]);
    if (same) {
      solved.push(gis[0]);
      // הסרת האריחים שנפתרו
      const rm = new Set(selected);
      tiles = tiles.filter((_, i) => !rm.has(i));
      selected = [];
      if (solved.length === 4) finish(true);
      else render();
      return;
    }
    // טעות — בדיקה אם ״כמעט״ (3 מתוך 4 מאותה קבוצה)
    const counts = {}; gis.forEach(g => counts[g] = (counts[g] || 0) + 1);
    const near = Math.max(...Object.values(counts)) === 3;
    mistakes++;
    selected = [];
    if (mistakes >= MAXMISS) finish(false);
    else { toast(near ? "כמעט! פספסתם באחת 😬" : "לא מדויק — נסו שוב"); render(); }
  };

  function finish(won) {
    const realSolved = solved.length;                 // כמה קבוצות נפתרו בפועל
    phase = won ? "won" : "lost";
    const points = realSolved + (won && mistakes === 0 ? 2 : 0);
    const result = { solved: won, mistakes, points };
    const map = loadDone(); map[pdate] = result; saveDone(map);
    if (!won) solved = puzzle.groups.map((_, i) => i); // חשיפת כל הקבוצות אחרי החישוב
    if (me) { postScore({ xid: uid(), player: me, pdate, solved: won, mistakes, points, ts: Date.now() }).then(refreshLeaderboard); }
    render();
  }

  function start(d) {
    pdate = d; puzzle = PUZ()[d];
    const done = myDone(d);
    if (puzzle) buildBoard();
    if (done) { phase = done.solved ? "won" : "lost"; solved = puzzle ? puzzle.groups.map((_, i) => i) : []; mistakes = done.mistakes; }
    render();
  }

  async function refreshLeaderboard() {
    try { allScores = await fetchScores(); } catch (e) { allScores = allScores || []; }
    // אם כבר שיחקת בחידה הזו (גם ממכשיר אחר) — שקף את התוצאה ומנע משחק כפול
    if (me && pdate && phase === "play") {
      const mine = (allScores || []).find(s => s.player === me && s.pdate === pdate);
      if (mine && !myDone(pdate)) {
        const map = loadDone(); map[pdate] = { solved: !!mine.solved, mistakes: mine.mistakes | 0, points: mine.points | 0 }; saveDone(map);
        if (puzzle) { phase = mine.solved ? "won" : "lost"; solved = puzzle.groups.map((_, i) => i); mistakes = mine.mistakes | 0; }
        render(); return;
      }
    }
    renderLeaderboardSlot();
  }

  /* ============================================================
     תצוגה
     ============================================================ */
  function toast(msg) {
    let t = document.getElementById("gameToast");
    if (!t) { t = document.createElement("div"); t.id = "gameToast"; t.className = "game-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1800);
  }

  function renderIdentity() {
    const el = document.getElementById("gameBody"); if (!el) return;
    el.innerHTML = `<div class="wrap">
      <div class="game-hero"><div class="game-hero-emoji">🧩</div>
        <h2>מה הקשר?</h2><p>חידה יומית על הפעילות של מחר — פתרו, צברו נקודות, ותהיו מוכנים למחר 😉</p></div>
      <div class="section"><div class="section-label">איך משחקים?</div>
        <div class="game-help-card">${RULES}</div></div>
      <div class="section"><div class="section-label">מי את/ה?</div>
        <div class="game-people">${members().map(m => `<button class="game-me" onclick="gameSetMe('${m.id}')">${esc(m.name)}</button>`).join("")}</div>
        <p class="exp-hint" style="margin-top:10px">הבחירה נשמרת במכשיר — כדי שהנקודות שלך יופיעו בטבלת האלופים.</p>
      </div></div>`;
  }

  function leaderboard() {
    const agg = {};
    (allScores || []).forEach(s => {
      const p = s.player; if (!p) return;
      if (!agg[p]) agg[p] = { player: p, points: 0, solved: 0, perfect: 0, played: 0 };
      agg[p].points += s.points | 0; agg[p].played++;
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

  function render() {
    const el = document.getElementById("gameBody"); if (!el) return;
    if (!me) { renderIdentity(); return; }
    if (!puzzle) {
      el.innerHTML = `<div class="wrap"><div class="game-hero"><div class="game-hero-emoji">🧩</div><h2>מה הקשר?</h2>
        <p>החידה הבאה תיפתח בקרוב — כל ערב על הפעילות של מחר.</p></div></div>`;
      return;
    }
    const dl = dayLabel(pdate);
    const un = unlockedDates();
    const done = myDone(pdate);

    // בורר ימים
    const chooser = `<div class="game-days">${un.map(d => {
      const l = dayLabel(d); const played = !!myDone(d);
      return `<button class="game-day${d === pdate ? " sel" : ""}${played ? " played" : ""}" onclick="gameGoto('${d}')">יום ${l.n}${played ? " ✓" : ""}</button>`;
    }).join("")}</div>`;

    // כותרת
    const head = `<div class="game-head">
      <div class="game-head-t"><span class="eyebrow">חידת היום · על יום ${dl.n}</span><h2>${esc(dl.title)}</h2></div>
      <button class="game-switch" onclick="gamePick()">${esc(nameOf(me))} ⇄</button>
    </div>`;

    // באנרים של קבוצות שנפתרו
    const banners = solved.map(gi => {
      const g = puzzle.groups[gi];
      return `<div class="game-group ${DIFF[g.diff]}"><b>${esc(g.cat)}</b><span>${g.items.map(esc).join(" · ")}</span></div>`;
    }).join("");

    let boardHTML = "";
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
      const won = phase === "won";
      const res = done || { solved: won, mistakes, points: (won ? 4 : 0) + (won && mistakes === 0 ? 2 : 0) };
      boardHTML = `<div class="game-result ${won ? "win" : "lose"}">
        <div class="game-result-emoji">${won ? (res.mistakes === 0 ? "🏆" : "🎉") : "😅"}</div>
        <b>${won ? (res.mistakes === 0 ? "מושלם! בלי טעויות" : "כל הכבוד, פתרת!") : "נגמרו הניסיונות"}</b>
        <span>${res.points} נקודות · ${res.mistakes} טעויות</span>
        ${nextUnplayed() ? `<button class="go" style="margin-top:12px" onclick="gameGoto('${nextUnplayed()}')">לחידה הבאה ›</button>` : ""}
      </div>`;
    }

    el.innerHTML = `<div class="wrap">
      ${head}
      ${un.length > 1 ? chooser : ""}
      ${phase === "play" ? `<details class="game-help"><summary>❓ איך משחקים?</summary>${RULES}</details>` : ""}
      <div class="game-board">${banners}${boardHTML}</div>
      <div class="section"><div class="section-label">🏆 טבלת האלופים</div>
        <div id="gameLeaderboard"><div class="exp-empty">טוען…</div></div>
        <p class="exp-hint" style="text-align:center">נקודה לכל קבוצה שנפתרה · בונוס ‎+2‎ לפתרון מושלם ללא טעויות.</p>
      </div>
    </div>`;
    renderLeaderboardSlot();
  }
  function nextUnplayed() {
    const un = unlockedDates();
    return un.find(d => d !== pdate && !myDone(d)) || null;
  }

  /* ---------- אתחול ---------- */
  function boot() {
    try { me = localStorage.getItem(ME_KEY) || null; } catch (e) {}
    pdate = defaultDate(); puzzle = pdate ? PUZ()[pdate] : null;
    if (puzzle) { buildBoard(); const done = myDone(pdate); if (done) { phase = done.solved ? "won" : "lost"; solved = puzzle.groups.map((_, i) => i); mistakes = done.mistakes; } }
    render();
    refreshLeaderboard();
    const tab = document.querySelector('.tabbar button[data-view="game"]');
    if (tab) tab.addEventListener("click", () => { refreshLeaderboard(); });
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
