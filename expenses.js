/* ============================================================
   קופה משותפת — חלוקת הוצאות בטיול
   משותף לכל הקבוצה דרך here.now Site Data.
   כל אחד מוסיף — כולם מתעדכנים. עובד גם אופליין (מסתנכרן כשחוזרים).
   ============================================================ */
"use strict";
(function () {
  /* ---------- רשימת החברים בטיול ---------- */
  /* מזהה קבוע (id) + שם לתצוגה. אפשר להוסיף עוד דרך הכפתור באפליקציה. */
  const MEMBERS = window.TRIP_MEMBERS || [];
  const KIDS = new Set(MEMBERS.filter(m => m.kid).map(m => m.id));   // ילדים — לא ברשימת המשלמים
  const isKid = id => KIDS.has(id);

  const CATS = [
    { id: "food", ic: "🍽️", label: "אוכל" },
    { id: "fuel", ic: "⛽", label: "דלק" },
    { id: "tickets", ic: "🎟️", label: "כרטיסים" },
    { id: "lodging", ic: "🏨", label: "לינה" },
    { id: "groceries", ic: "🛒", label: "קניות" },
    { id: "other", ic: "💶", label: "אחר" }
  ];
  const catOf = id => CATS.find(c => c.id === id) || CATS[CATS.length - 1];

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const eur = cents => "€" + (cents / 100).toFixed(2);
  const uid = () => "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const formOpen = () => !!document.getElementById("expForm");

  /* ---------- כתובת ה-Site Data (יחסית לאתר) ---------- */
  const DATA_BASE = location.origin + "/.herenow/data";
  const CACHE_KEY = "dolomites_exp_v2";

  /* ---------- מצב ---------- */
  // כל הוצאה: { xid, id?, title, cents, cat, payer, parts[], ts, rev, deleted, dirty }
  let expenses = [];          // מפתח לוגי = xid
  let remoteMembers = [];     // { id(xid), name, deleted, dirty }
  let sync = { state: "idle", pending: 0, lastOk: 0, err: "" };
  let pollTimer = null, flushing = false;

  loadCache();

  function loadCache() {
    try {
      const s = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (s && Array.isArray(s.expenses)) expenses = s.expenses;
      if (s && Array.isArray(s.members)) remoteMembers = s.members;
      if (s && s.sync) { sync.lastOk = s.sync.lastOk || 0; }
    } catch (e) {}
  }
  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ expenses, members: remoteMembers, sync: { lastOk: sync.lastOk } })); } catch (e) {}
  }

  /* ---------- רוסטר (חברים מקוד + חברים שנוספו בענן) ---------- */
  function roster() {
    const list = MEMBERS.map(m => ({ id: m.id, name: m.name }));
    const seen = new Set(list.map(m => m.id));
    remoteMembers.forEach(m => { if (!m.deleted && !seen.has(m.id)) { list.push({ id: m.id, name: m.name }); seen.add(m.id); } });
    return list;
  }
  function nameOf(id) { const m = roster().find(x => x.id === id); return m ? m.name : "—"; }
  function isCustom(id) { return !MEMBERS.some(m => m.id === id); }

  function activeExpenses() { return expenses.filter(e => !e.deleted); }
  function pendingCount() {
    return expenses.filter(e => e.dirty).length + remoteMembers.filter(m => m.dirty).length;
  }

  /* ============================================================
     סנכרון עם here.now Site Data
     ============================================================ */
  async function pull() {
    const [ex, mem] = await Promise.all([
      fetchAll("expenses"),
      fetchAll("members")
    ]);
    // חברים
    mem.forEach(rec => {
      const d = rec.data || {}; const xid = d.xid; if (!xid) return;
      const local = remoteMembers.find(m => m.id === xid);
      if (local && local.dirty) return; // יש שינוי מקומי שממתין
      const entry = { id: xid, name: d.name, deleted: !!d.deleted, recId: rec.id, dirty: false };
      if (local) Object.assign(local, entry); else remoteMembers.push(entry);
    });
    // הוצאות
    ex.forEach(rec => {
      const d = rec.data || {}; const xid = d.xid; if (!xid) return;
      const srv = {
        xid, id: rec.id,
        title: d.title || "", cents: d.cents | 0, cat: d.cat || "other",
        payer: d.payer || "", parts: Array.isArray(d.parts) ? d.parts : [],
        ts: d.ts || Date.parse(rec.createdAt) || 0, rev: d.rev | 0, deleted: !!d.deleted
      };
      const local = expenses.find(e => e.xid === xid);
      if (!local) { srv.dirty = false; expenses.push(srv); return; }
      // יש רשומה מקומית — פתרון קונפליקט לפי rev; שינוי מקומי שממתין מנצח בשוויון
      if (local.dirty) {
        if (srv.rev > local.rev) { Object.assign(local, srv, { dirty: false }); } // הצד השני עדכן אחרינו
        // אחרת: שומרים על המקומי (יידחף)
      } else {
        Object.assign(local, srv, { dirty: false });
      }
    });
    sync.lastOk = Date.now();
  }

  async function fetchAll(coll) {
    let out = [], cursor = "";
    for (let guard = 0; guard < 20; guard++) {
      const u = DATA_BASE + "/" + coll + "?limit=100" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : "");
      const r = await fetch(u, { headers: { "accept": "application/json" } });
      if (!r.ok) throw new Error(coll + " " + r.status);
      const j = await r.json();
      out = out.concat(j.records || []);
      if (!j.nextCursor) break;
      cursor = j.nextCursor;
    }
    return out;
  }

  async function push() {
    // חברים חדשים / שינויים
    for (const m of remoteMembers.filter(x => x.dirty)) {
      try {
        if (!m.recId) {
          const rec = await postRec("members", { xid: m.id, name: m.name, ts: Date.now(), deleted: !!m.deleted }, m.id);
          m.recId = rec.id; m.dirty = false;
        } else {
          await patchRec("members", m.recId, { name: m.name, deleted: !!m.deleted });
          m.dirty = false;
        }
      } catch (e) { throw e; }
    }
    // הוצאות
    for (const e of expenses.filter(x => x.dirty)) {
      const body = { xid: e.xid, title: e.title, cents: e.cents | 0, cat: e.cat, payer: e.payer, parts: e.parts, ts: e.ts || Date.now(), rev: e.rev | 0, deleted: !!e.deleted };
      if (!e.id) {
        const rec = await postRec("expenses", body, e.xid);
        e.id = rec.id; e.dirty = false;
      } else {
        await patchRec("expenses", e.id, { title: e.title, cents: e.cents | 0, cat: e.cat, payer: e.payer, parts: e.parts, rev: e.rev | 0, deleted: !!e.deleted });
        e.dirty = false;
      }
    }
    // ניקוי טומבסטונים שסונכרנו
    expenses = expenses.filter(e => !(e.deleted && !e.dirty && e.id));
    remoteMembers = remoteMembers.filter(m => !(m.deleted && !m.dirty));
  }

  async function postRec(coll, body, idem) {
    const r = await fetch(DATA_BASE + "/" + coll, {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": idem || uid() },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error("POST " + coll + " " + r.status);
    const j = await r.json();
    return j.record;
  }
  async function patchRec(coll, id, body) {
    const r = await fetch(DATA_BASE + "/" + coll + "/" + id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error("PATCH " + coll + " " + r.status);
    return (await r.json()).record;
  }

  async function syncNow(opts) {
    opts = opts || {};
    if (flushing) return;
    flushing = true;
    const had = pendingCount();
    sync.state = "sync";
    if (opts.render !== false) renderStatus();
    try {
      await push();      // דחיפת שינויים מקומיים קודם
      await pull();      // ואז משיכת המצב המעודכן
      await push();      // ודחיפת מה שאולי נוצר בינתיים
      sync.err = "";
      sync.state = "ok";
      saveCache();
      if (!formOpen()) render();   // לא לרנדר מחדש בזמן שהטופס פתוח — כדי שלא ייסגר
      else renderStatus();
    } catch (e) {
      sync.err = (e && e.message) || "network";
      sync.state = navigator.onLine ? "err" : "offline";
      saveCache();
      renderStatus();
    } finally {
      flushing = false;
      sync.pending = pendingCount();
      renderStatus();
      if (had && !pendingCount() && sync.state === "ok" && !formOpen()) render();
    }
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(() => { if (document.visibilityState === "visible") syncNow({ render: false }); }, 15000);
  }

  /* ============================================================
     חישוב מאזן וסליקה
     ============================================================ */
  function compute() {
    const ids = roster().map(m => m.id);
    const paid = {}, owed = {};
    ids.forEach(id => { paid[id] = 0; owed[id] = 0; });
    let total = 0;
    for (const e of activeExpenses()) {
      const cents = e.cents | 0;
      total += cents;
      if (paid[e.payer] == null) paid[e.payer] = 0;
      paid[e.payer] += cents;
      const parts = e.parts.filter(p => ids.includes(p));
      const n = parts.length || 1;
      const base = Math.floor(cents / n), rem = cents - base * n;
      parts.forEach((p, i) => { if (owed[p] == null) owed[p] = 0; owed[p] += base + (i < rem ? 1 : 0); });
    }
    const net = {};
    Object.keys(paid).forEach(id => net[id] = (paid[id] || 0) - (owed[id] || 0));
    return { paid, owed, net, total };
  }
  function settlement(net) {
    const debt = [], cred = [];
    Object.keys(net).forEach(p => { if (net[p] < 0) debt.push({ p, a: -net[p] }); else if (net[p] > 0) cred.push({ p, a: net[p] }); });
    debt.sort((x, y) => y.a - x.a); cred.sort((x, y) => y.a - x.a);
    const out = []; let i = 0, j = 0;
    while (i < debt.length && j < cred.length) {
      const x = Math.min(debt[i].a, cred[j].a);
      if (x > 0) out.push({ from: debt[i].p, to: cred[j].p, a: x });
      debt[i].a -= x; cred[j].a -= x;
      if (debt[i].a === 0) i++; if (cred[j].a === 0) j++;
    }
    return out;
  }

  /* ============================================================
     תצוגה
     ============================================================ */
  function statusChip() {
    const p = pendingCount();
    let cls = "ok", txt = "מסונכרן";
    if (sync.state === "sync") { cls = "sync"; txt = "מסנכרן…"; }
    else if (sync.state === "offline" || !navigator.onLine) { cls = "off"; txt = p ? `אופליין · ${p} ממתינים` : "אופליין"; }
    else if (sync.state === "err") { cls = "off"; txt = p ? `לא סונכרן · ${p} ממתינים` : "שגיאת רשת"; }
    else if (p) { cls = "sync"; txt = `${p} ממתינים לסנכרון`; }
    return `<button class="exp-sync ${cls}" onclick="expSync()" title="לחצו לסנכרון">${cls === "ok" ? "☁︎" : cls === "sync" ? "⟳" : "⚠︎"} ${txt}</button>`;
  }
  function renderStatus() {
    const el = document.getElementById("expSyncSlot"); if (el) el.innerHTML = statusChip();
  }

  function render() {
    const el = document.getElementById("expensesBody"); if (!el) return;
    const c = compute();
    const list = roster();
    const acts = activeExpenses();

    const tiles = `<div class="exp-tiles">
      <div class="exp-tile"><b>${eur(c.total)}</b><span>סה״כ הוצאות</span></div>
      <div class="exp-tile"><b>${acts.length}</b><span>רישומים</span></div>
      <div class="exp-tile"><b>${list.length}</b><span>משתתפים</span></div>
    </div>`;

    let listHTML;
    if (!acts.length) {
      listHTML = `<div class="exp-empty">אין עדיין הוצאות. הוסיפו הוצאה ראשונה 👆<br><span class="exp-hint">כל מי שמוסיף — כולם רואים.</span></div>`;
    } else {
      listHTML = acts.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).map(e => {
        const cat = catOf(e.cat);
        const n = e.parts.length || 1;
        const per = Math.round((e.cents | 0) / n);
        const names = e.parts.map(nameOf);
        const shown = names.slice(0, 6).join(" · ") + (names.length > 6 ? ` +${names.length - 6}` : "");
        return `<div class="exp-item${e.dirty ? " pend" : ""}">
          <div class="exp-ic">${cat.ic}</div>
          <div class="exp-main">
            <div class="exp-row1"><b>${esc(e.title || cat.label)}</b><span class="exp-amt">${eur(e.cents | 0)}</span></div>
            <p class="exp-sub">שילם/ה <b>${esc(nameOf(e.payer))}</b> · חולק בין ${n} · ${eur(per)} לאחד${e.dirty ? ' · <span class="exp-pendtag">ממתין</span>' : ""}</p>
            <p class="exp-parts">${esc(shown)}</p>
          </div>
          <div class="exp-actions">
            <button class="icon-btn" onclick="expEdit('${e.xid}')" aria-label="עריכה">✎</button>
            <button class="icon-btn" onclick="expDelete('${e.xid}')" aria-label="מחיקה">🗑</button>
          </div>
        </div>`;
      }).join("");
    }

    let balHTML = "";
    if (acts.length) {
      const rows = list.map(m => ({ m, v: c.net[m.id] || 0 })).filter(r => r.v !== 0 || c.paid[r.m.id] || c.owed[r.m.id]);
      balHTML = `<div class="section"><div class="section-label">מאזן לכל אחד</div>` +
        (rows.length ? rows.map(r => {
          const cls = r.v > 0 ? "up" : r.v < 0 ? "down" : "even";
          const txt = r.v > 0 ? `מקבל/ת ${eur(r.v)}` : r.v < 0 ? `משלם/ת ${eur(-r.v)}` : "מאוזן";
          return `<div class="exp-bal"><span>${esc(r.m.name)}</span><span class="exp-bal-v ${cls}">${txt}</span></div>`;
        }).join("") : `<div class="exp-empty">אין נתונים</div>`) + `</div>`;

      const trans = settlement(c.net);
      const setHTML = trans.length
        ? trans.map(t => `<div class="exp-settle"><b>${esc(nameOf(t.from))}</b> <span class="s-mid">משלם/ת ל־</span> <b>${esc(nameOf(t.to))}</b><span class="exp-settle-a">${eur(t.a)}</span></div>`).join("")
        : `<div class="exp-empty">הכל מאוזן 🎉</div>`;
      balHTML += `<div class="section"><div class="section-label">מי מעביר למי</div>${setHTML}
        <p class="exp-hint">כך מסלקים את החוב במינימום העברות.</p></div>`;
    }

    el.innerHTML = `<div class="wrap">
      <div class="exp-topbar"><div id="expSyncSlot">${statusChip()}</div></div>
      ${tiles}
      <button class="go exp-newbtn" onclick="expOpenForm()">＋ הוצאה חדשה</button>
      <div id="expFormWrap"></div>
      <div class="section"><div class="section-label">ההוצאות</div><div class="exp-list">${listHTML}</div></div>
      ${balHTML}
      ${acts.length ? `<div class="exp-foot">
        <button class="btn ghost" onclick="expShare()">📤 שיתוף סיכום</button></div>` : ""}
      <div class="section"><div class="section-label">מי בקבוצה (${list.length})</div>
        <div class="exp-people">${list.map(m => `<span class="exp-chip">${esc(m.name)}${isCustom(m.id) ? `<button class="x" onclick="expRemovePerson('${m.id}')" aria-label="הסרה">×</button>` : ""}</span>`).join("")}
          <button class="exp-addp" onclick="expAddPerson()">＋ משתתף</button></div>
      </div>
      <p class="exp-note">☁︎ משותף לכל הקבוצה — כל אחד מוסיף וכולם מתעדכנים. עובד גם בלי רשת, ומסתנכרן אוטומטית כשחוזרים לקליטה.</p>
    </div>`;
  }

  /* ============================================================
     טופס הוצאה
     ============================================================ */
  function formHTML(edit) {
    const list = roster();
    const payerList = list.filter(m => !isKid(m.id));   // ילדים לא משלמים
    const e = edit || { title: "", amount: "", cat: "food", payer: (payerList[0] && payerList[0].id) || "", parts: list.map(m => m.id) };
    const cats = CATS.map(c => `<button type="button" class="exp-cat${c.id === e.cat ? " sel" : ""}" data-cat="${c.id}" onclick="expPickCat('${c.id}')">${c.ic} ${c.label}</button>`).join("");
    const payers = payerList.map(m => `<button type="button" class="exp-payer${m.id === e.payer ? " sel" : ""}" data-p="${m.id}" onclick="expPickPayer(this)">${esc(m.name)}</button>`).join("");
    const parts = list.map(m => `<button type="button" class="exp-part${e.parts.includes(m.id) ? " sel" : ""}" data-p="${m.id}" onclick="this.classList.toggle('sel')">${esc(m.name)}</button>`).join("");
    return `<div class="exp-form" id="expForm" data-edit="${edit ? edit.xid : ""}">
      <input class="exp-input" id="expDesc" placeholder="על מה? (למשל: ארוחת ערב)" value="${esc(e.title)}">
      <input class="exp-input" id="expAmount" type="number" inputmode="decimal" step="0.01" min="0" placeholder="סכום ב-€" value="${e.amount}">
      <div class="exp-flabel">קטגוריה</div><div class="exp-cats">${cats}</div>
      <div class="exp-flabel">מי שילם/ה</div><div class="exp-choose">${payers}</div>
      <div class="exp-flabel">מי השתתף/ה <button type="button" class="exp-mini" onclick="expAllParts(true)">הכל</button> <button type="button" class="exp-mini" onclick="expAllParts(false)">נקה</button></div>
      <div class="exp-choose" id="expParts">${parts}</div>
      <div class="exp-fbtns"><button class="go" onclick="expSave()">שמירה</button><button class="btn ghost" onclick="expCloseForm()">ביטול</button></div>
    </div>`;
  }
  window.expOpenForm = function (edit) {
    document.getElementById("expFormWrap").innerHTML = formHTML(edit || null);
    document.getElementById("expForm").scrollIntoView({ behavior: "smooth", block: "center" });
  };
  window.expCloseForm = function () { const w = document.getElementById("expFormWrap"); if (w) w.innerHTML = ""; };
  window.expPickCat = function (id) { document.querySelectorAll(".exp-cat").forEach(b => b.classList.toggle("sel", b.dataset.cat === id)); };
  window.expPickPayer = function (btn) { document.querySelectorAll(".exp-payer").forEach(b => b.classList.remove("sel")); btn.classList.add("sel"); };
  window.expAllParts = function (on) { document.querySelectorAll("#expParts .exp-part").forEach(b => b.classList.toggle("sel", on)); };

  window.expSave = function () {
    const title = document.getElementById("expDesc").value.trim();
    const amount = parseFloat(document.getElementById("expAmount").value);
    const catEl = document.querySelector(".exp-cat.sel");
    const cat = catEl ? catEl.dataset.cat : "other";
    const payerEl = document.querySelector(".exp-payer.sel");
    const parts = [...document.querySelectorAll("#expParts .exp-part.sel")].map(b => b.dataset.p);
    if (!(amount > 0)) { alert("נא להזין סכום תקין"); return; }
    if (!payerEl) { alert("מי שילם/ה?"); return; }
    if (!parts.length) { alert("בחרו מי השתתף/ה בהוצאה"); return; }
    const cents = Math.round(amount * 100);
    const editXid = document.getElementById("expForm").dataset.edit;
    if (editXid) {
      const e = expenses.find(x => x.xid === editXid);
      if (e) { e.title = title; e.cents = cents; e.cat = cat; e.payer = payerEl.dataset.p; e.parts = parts; e.rev = (e.rev | 0) + 1; e.dirty = true; }
    } else {
      expenses.push({ xid: uid(), title, cents, cat, payer: payerEl.dataset.p, parts, ts: Date.now(), rev: 0, deleted: false, dirty: true });
    }
    saveCache(); expCloseForm(); render(); syncNow();
  };
  window.expEdit = function (xid) { const e = expenses.find(x => x.xid === xid); if (e) expOpenForm({ xid: e.xid, title: e.title, amount: (e.cents / 100), cat: e.cat, payer: e.payer, parts: e.parts.slice() }); };
  window.expDelete = function (xid) {
    if (!confirm("למחוק את ההוצאה? (יתעדכן לכולם)")) return;
    const e = expenses.find(x => x.xid === xid); if (!e) return;
    if (!e.id) { expenses = expenses.filter(x => x.xid !== xid); } // עוד לא נוצרה בשרת
    else { e.deleted = true; e.rev = (e.rev | 0) + 1; e.dirty = true; }
    saveCache(); render(); syncNow();
  };

  window.expAddPerson = function () {
    const name = (prompt("שם המשתתף/ת (או משפחה / רכב):") || "").trim();
    if (!name) return;
    if (roster().some(m => m.name === name)) { alert("כבר קיים ברשימה"); return; }
    remoteMembers.push({ id: uid(), name, deleted: false, dirty: true });
    saveCache(); render(); syncNow();
  };
  window.expRemovePerson = function (id) {
    if (!isCustom(id)) return;
    const used = activeExpenses().some(e => e.payer === id || e.parts.includes(id));
    if (used) { alert("אי אפשר להסיר — מופיע/ה בהוצאות קיימות."); return; }
    const m = remoteMembers.find(x => x.id === id); if (!m) return;
    m.deleted = true; m.dirty = true;
    saveCache(); render(); syncNow();
  };

  window.expSync = function () { syncNow(); };

  window.expShare = function () {
    const c = compute(), trans = settlement(c.net);
    let t = `💰 קופה משותפת — נפלאות הדולומיטים\nסה״כ: ${eur(c.total)} · ${activeExpenses().length} הוצאות\n\nמי מעביר למי:\n`;
    t += trans.length ? trans.map(x => `• ${nameOf(x.from)} משלם/ת ל-${nameOf(x.to)}: ${eur(x.a)}`).join("\n") : "הכל מאוזן 🎉";
    t += `\n\nהקופה המשותפת: ${location.origin}/\nנכון ל-${new Date().toLocaleDateString("he-IL")}`;
    if (navigator.share) navigator.share({ text: t }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => alert("הסיכום הועתק — הדביקו בוואטסאפ 📋")).catch(() => prompt("העתיקו את הסיכום:", t));
    else prompt("העתיקו את הסיכום:", t);
  };

  /* ---------- אתחול ---------- */
  function boot() {
    render();
    syncNow();
    startPolling();
    window.addEventListener("online", () => syncNow());
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") syncNow({ render: false }); });
  }
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
