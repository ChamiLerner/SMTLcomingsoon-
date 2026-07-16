/* ============================================================
   קופה משותפת — חלוקת הוצאות בטיול
   נשמר ב-localStorage במכשיר. שיתוף סיכום דרך כפתור השיתוף.
   ============================================================ */
"use strict";
(function () {
  const KEY = "dolomites_expenses_v1";
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
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  let state = load();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.people && s.expenses) return s; } catch (e) {}
    return { people: [], expenses: [] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------- חישוב ---------- */
  function compute() {
    const paid = {}, owed = {};
    state.people.forEach(p => { paid[p] = 0; owed[p] = 0; });
    let total = 0;
    for (const e of state.expenses) {
      const cents = Math.round(e.amount * 100);
      total += cents;
      if (paid[e.payer] == null) paid[e.payer] = 0;
      paid[e.payer] += cents;
      const parts = e.parts.filter(p => state.people.includes(p));
      const n = parts.length || 1;
      const base = Math.floor(cents / n), rem = cents - base * n;
      parts.forEach((p, i) => { if (owed[p] == null) owed[p] = 0; owed[p] += base + (i < rem ? 1 : 0); });
    }
    const net = {};
    state.people.forEach(p => net[p] = (paid[p] || 0) - (owed[p] || 0));
    return { paid, owed, net, total };
  }
  function settlement(net) {
    const debt = [], cred = [];
    Object.keys(net).forEach(p => { if (net[p] < -0) debt.push({ p, a: -net[p] }); else if (net[p] > 0) cred.push({ p, a: net[p] }); });
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

  /* ---------- render ---------- */
  function render() {
    const el = document.getElementById("expensesBody"); if (!el) return;
    const c = compute();
    const peopleChips = state.people.map(p =>
      `<span class="exp-chip">${esc(p)}<button class="x" onclick="expRemovePerson('${esc(p)}')" aria-label="הסרה">×</button></span>`).join("");

    const tiles = `<div class="exp-tiles">
      <div class="exp-tile"><b>${eur(c.total)}</b><span>סה״כ הוצאות</span></div>
      <div class="exp-tile"><b>${state.expenses.length}</b><span>רישומים</span></div>
      <div class="exp-tile"><b>${state.people.length}</b><span>משתתפים</span></div>
    </div>`;

    let listHTML;
    if (!state.expenses.length) {
      listHTML = `<div class="exp-empty">אין עדיין הוצאות. הוסיפו את המשתתפים ואז הוצאה ראשונה 👆</div>`;
    } else {
      listHTML = state.expenses.slice().reverse().map(e => {
        const cat = catOf(e.cat);
        const cents = Math.round(e.amount * 100);
        const n = e.parts.length || 1;
        const per = Math.round(cents / n);
        return `<div class="exp-item">
          <div class="exp-ic">${cat.ic}</div>
          <div class="exp-main">
            <div class="exp-row1"><b>${esc(e.desc || cat.label)}</b><span class="exp-amt">${eur(cents)}</span></div>
            <p class="exp-sub">שילם/ה <b>${esc(e.payer)}</b> · חולק בין ${n} · ${eur(per)} לאחד</p>
            <p class="exp-parts">${e.parts.map(esc).join(" · ")}</p>
          </div>
          <div class="exp-actions">
            <button class="icon-btn" onclick="expEdit('${e.id}')">✎</button>
            <button class="icon-btn" onclick="expDelete('${e.id}')">🗑</button>
          </div>
        </div>`;
      }).join("");
    }

    let balHTML = "";
    if (state.expenses.length) {
      balHTML = `<div class="section"><div class="section-label">מאזן לכל אחד</div>` +
        state.people.map(p => {
          const v = c.net[p] || 0;
          const cls = v > 0 ? "up" : v < 0 ? "down" : "even";
          const txt = v > 0 ? `מקבל/ת ${eur(v)}` : v < 0 ? `משלם/ת ${eur(-v)}` : "מאוזן";
          return `<div class="exp-bal"><span>${esc(p)}</span><span class="exp-bal-v ${cls}">${txt}</span></div>`;
        }).join("") + `</div>`;

      const trans = settlement(c.net);
      const setHTML = trans.length
        ? trans.map(t => `<div class="exp-settle"><b>${esc(t.from)}</b> <span class="s-mid">משלם/ת ל־</span> <b>${esc(t.to)}</b><span class="exp-settle-a">${eur(t.a)}</span></div>`).join("")
        : `<div class="exp-empty">הכל מאוזן 🎉</div>`;
      balHTML += `<div class="section"><div class="section-label">מי מעביר למי</div>${setHTML}
        <p class="exp-hint">כך מסלקים את החוב במינימום העברות.</p></div>`;
    }

    el.innerHTML = `<div class="wrap">
      ${tiles}
      <div class="section"><div class="section-label">מי בקבוצה</div>
        <div class="exp-people">${peopleChips || `<span class="exp-hint">עדיין אין משתתפים</span>`}
          <button class="exp-addp" onclick="expAddPerson()">＋ משתתף</button></div>
      </div>
      <button class="go exp-newbtn" onclick="expOpenForm()">＋ הוצאה חדשה</button>
      <div id="expFormWrap"></div>
      <div class="section"><div class="section-label">ההוצאות</div><div class="exp-list">${listHTML}</div></div>
      ${balHTML}
      ${state.expenses.length ? `<div class="exp-foot">
        <button class="btn ghost" onclick="expShare()">📤 שיתוף סיכום</button>
        <button class="btn ghost danger" onclick="expReset()">איפוס</button></div>` : ""}
      <p class="exp-note">🔒 הנתונים נשמרים במכשיר הזה בלבד. כדי לעדכן את הקבוצה — ״שיתוף סיכום״ שולח את החישוב לוואטסאפ.</p>
    </div>`;
  }

  /* ---------- form ---------- */
  function formHTML(edit) {
    const e = edit || { desc: "", amount: "", cat: "food", payer: state.people[0] || "", parts: state.people.slice() };
    const cats = CATS.map(c => `<button type="button" class="exp-cat${c.id === e.cat ? " sel" : ""}" data-cat="${c.id}" onclick="expPickCat('${c.id}')">${c.ic} ${c.label}</button>`).join("");
    const payers = state.people.map(p => `<button type="button" class="exp-payer${p === e.payer ? " sel" : ""}" data-p="${esc(p)}" onclick="expPickPayer(this)">${esc(p)}</button>`).join("");
    const parts = state.people.map(p => `<button type="button" class="exp-part${e.parts.includes(p) ? " sel" : ""}" data-p="${esc(p)}" onclick="this.classList.toggle('sel')">${esc(p)}</button>`).join("");
    return `<div class="exp-form" id="expForm" data-edit="${edit ? edit.id : ""}">
      <input class="exp-input" id="expDesc" placeholder="על מה? (למשל: ארוחת ערב)" value="${esc(e.desc)}">
      <input class="exp-input" id="expAmount" type="number" inputmode="decimal" step="0.01" min="0" placeholder="סכום ב-€" value="${e.amount}">
      <div class="exp-flabel">קטגוריה</div><div class="exp-cats">${cats}</div>
      <div class="exp-flabel">מי שילם/ה</div><div class="exp-choose">${payers || `<span class="exp-hint">הוסיפו משתתפים קודם</span>`}</div>
      <div class="exp-flabel">מי השתתף/ה <button type="button" class="exp-mini" onclick="expAllParts(true)">הכל</button> <button type="button" class="exp-mini" onclick="expAllParts(false)">נקה</button></div>
      <div class="exp-choose" id="expParts">${parts}</div>
      <div class="exp-fbtns"><button class="go" onclick="expSave()">שמירה</button><button class="btn ghost" onclick="expCloseForm()">ביטול</button></div>
    </div>`;
  }
  window.expOpenForm = function (edit) {
    if (!state.people.length) { alert("קודם הוסיפו משתתפים לקבוצה 🙂"); return; }
    document.getElementById("expFormWrap").innerHTML = formHTML(edit || null);
    document.getElementById("expForm").scrollIntoView({ behavior: "smooth", block: "center" });
  };
  window.expCloseForm = function () { const w = document.getElementById("expFormWrap"); if (w) w.innerHTML = ""; };
  window.expPickCat = function (id) { document.querySelectorAll(".exp-cat").forEach(b => b.classList.toggle("sel", b.dataset.cat === id)); };
  window.expPickPayer = function (btn) { document.querySelectorAll(".exp-payer").forEach(b => b.classList.remove("sel")); btn.classList.add("sel"); };
  window.expAllParts = function (on) { document.querySelectorAll("#expParts .exp-part").forEach(b => b.classList.toggle("sel", on)); };

  window.expSave = function () {
    const desc = document.getElementById("expDesc").value.trim();
    const amount = parseFloat(document.getElementById("expAmount").value);
    const cat = (document.querySelector(".exp-cat.sel") || {}).dataset ? document.querySelector(".exp-cat.sel").dataset.cat : "other";
    const payerEl = document.querySelector(".exp-payer.sel");
    const parts = [...document.querySelectorAll("#expParts .exp-part.sel")].map(b => b.dataset.p);
    if (!(amount > 0)) { alert("נא להזין סכום תקין"); return; }
    if (!payerEl) { alert("מי שילם/ה?"); return; }
    if (!parts.length) { alert("בחרו מי השתתף/ה בהוצאה"); return; }
    const editId = document.getElementById("expForm").dataset.edit;
    const rec = { id: editId || uid(), desc, amount, cat, payer: payerEl.dataset.p, parts, ts: Date.now() };
    if (editId) { const i = state.expenses.findIndex(x => x.id === editId); if (i >= 0) state.expenses[i] = rec; }
    else state.expenses.push(rec);
    save(); expCloseForm(); render();
  };
  window.expEdit = function (id) { const e = state.expenses.find(x => x.id === id); if (e) expOpenForm(e); };
  window.expDelete = function (id) { if (!confirm("למחוק את ההוצאה?")) return; state.expenses = state.expenses.filter(x => x.id !== id); save(); render(); };

  window.expAddPerson = function () {
    const name = (prompt("שם המשתתף/ת (או משפחה/רכב):") || "").trim();
    if (!name) return;
    if (state.people.includes(name)) { alert("כבר קיים ברשימה"); return; }
    state.people.push(name); save(); render();
  };
  window.expRemovePerson = function (name) {
    const used = state.expenses.some(e => e.payer === name || e.parts.includes(name));
    if (used) { alert("אי אפשר להסיר — המשתתף/ת מופיע/ה בהוצאות קיימות."); return; }
    state.people = state.people.filter(p => p !== name); save(); render();
  };
  window.expReset = function () {
    if (!confirm("לאפס את כל ההוצאות? (המשתתפים יישארו)")) return;
    state.expenses = []; save(); render();
  };
  window.expShare = function () {
    const c = compute(), trans = settlement(c.net);
    let t = `💰 קופה משותפת — נפלאות הדולומיטים\nסה״כ: ${eur(c.total)} · ${state.expenses.length} הוצאות\n\nמי מעביר למי:\n`;
    t += trans.length ? trans.map(x => `• ${x.from} משלם/ת ל-${x.to}: ${eur(x.a)}`).join("\n") : "הכל מאוזן 🎉";
    t += `\n\nנכון ל-${new Date().toLocaleDateString("he-IL")}`;
    if (navigator.share) navigator.share({ text: t }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => alert("הסיכום הועתק — הדביקו בוואטסאפ 📋")).catch(() => prompt("העתיקו את הסיכום:", t));
    else prompt("העתיקו את הסיכום:", t);
  };

  // render once on load (the tab reveals the ready section)
  if (document.readyState !== "loading") render();
  else document.addEventListener("DOMContentLoaded", render);
})();
