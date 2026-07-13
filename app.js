/* ==========================================================
   נפלאות הדולומיטים 2026 — לוגיקת האפליקציה
   ========================================================== */
"use strict";
const DAYS = window.TRIP_DATA;
const TRIP = window.TRIP;

/* ---------- עזרים ---------- */
const $ = (s, r = document) => r.querySelector(s);
const pad = n => String(n).padStart(2, "0");
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const todayISO = () => { const n = new Date(); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`; };
const fmtDate = iso => new Date(iso + "T12:00").toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
const shortDate = iso => `${iso.slice(8)}/${iso.slice(5, 7)}`;
const mapsUrl = d => d.coords
  ? `https://www.google.com/maps/search/?api=1&query=${d.coords[0]},${d.coords[1]}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.place || d.title)}`;
const coordUrl = c => `https://www.google.com/maps/search/?api=1&query=${c[0]},${c[1]}`;
const voucherPath = date => `vouchers/${date}.pdf`;
const telUrl = p => "tel:" + String(p).replace(/[^\d+]/g, "");

/* מצב יחסי לתאריך של היום */
function tripState() {
  const t = todayISO();
  if (t < DAYS[0].date) return { phase: "before" };
  if (t > DAYS[DAYS.length - 1].date) return { phase: "after" };
  return { phase: "during" };
}
function daysUntilStart() {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const start = new Date(DAYS[0].date + "T00:00");
  return Math.round((start - now) / 864e5);
}

const STATUS_META = {
  confirmed: { cls: "ok", icon: "✓", label: "מאושר" },
  pending:   { cls: "warn", icon: "●", label: "ממתין לאישור" },
  none:      { cls: "muted", icon: "•", label: "" }
};

/* בחירת היום הנוכחי (או הראשון אם הטיול טרם התחיל) */
let selected = DAYS.find(d => d.date === todayISO()) || DAYS[0];

/* ---------- רכיבים משותפים ---------- */
function statusChip(dinner) {
  const m = STATUS_META[dinner.status] || STATUS_META.none;
  if (dinner.status === "none") return dinner.note ? `<span class="chip muted">${esc(dinner.note)}</span>` : "";
  return `<span class="chip ${m.cls}">${m.icon} ${esc(dinner.note || m.label)}</span>`;
}
function tagRow(day) {
  const t = (day.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join("");
  return t ? `<div class="tags">${t}</div>` : "";
}
function planBlock(p) {
  const meta = p.meta ? `<span class="pb-meta">${esc(p.meta)}</span>` : "";
  const kids = p.kids ? `<span class="kids-badge">👦 לנוער</span>` : "";
  const desc = p.desc ? `<p class="pb-desc">${esc(p.desc)}</p>` : "";
  const info = [];
  if (p.booking) info.push(`<div class="pb-note book">🎫 ${esc(p.booking)}</div>`);
  if (p.equip) info.push(`<div class="pb-note">🎒 ${esc(p.equip)}</div>`);
  const acts = [];
  if (p.coords) acts.push(`<a class="pill" target="_blank" rel="noopener" href="${coordUrl(p.coords)}">📍 ניווט</a>`);
  if (p.url) acts.push(`<a class="pill" target="_blank" rel="noopener" href="${esc(p.url)}">🔗 אתר</a>`);
  return `<div class="plan-block">
    <div class="pb-icon">${p.icon || "•"}</div>
    <div class="pb-body">
      <div class="pb-head"><b>${esc(p.name)}</b>${kids}</div>
      ${meta}${desc}${info.join("")}
      ${acts.length ? `<div class="pb-acts">${acts.join("")}</div>` : ""}
    </div>
  </div>`;
}
function driveCard(day) {
  if (!day.drive) return "";
  const dr = day.drive;
  const legs = (dr.legs || []).map(l => `<li><span>${esc(l.title)}</span><b>${esc(l.km)} ק״מ · ${esc(l.time)}</b></li>`).join("");
  return `<div class="card drive">
    <div class="label">מסלול נסיעה</div>
    <div class="drive-top"><div><b>${esc(dr.from)}</b> ← <b>${esc(dr.to)}</b></div>
      <div class="drive-metric"><span>${esc(dr.km)}</span> ק״מ · <span>${esc(dr.time)}</span> שעות</div></div>
    ${legs ? `<ul class="legs">${legs}</ul>` : ""}
  </div>`;
}
function dinnerCard(day) {
  const d = day.dinner; if (!d) return "";
  const phone = d.phone ? `<a class="pill" href="${telUrl(d.phone)}">📞 ${esc(d.phone)}</a>` : "";
  const nav = d.coords ? `<a class="pill" target="_blank" rel="noopener" href="${coordUrl(d.coords)}">📍 ניווט</a>` : "";
  const addr = d.addr ? `<p class="sub">${esc(d.addr)}</p>` : "";
  return `<div class="card">
    <div class="label">🍽️ ארוחת ערב${d.time ? " · " + esc(d.time) : ""}</div>
    <h2 class="dinner-name">${esc(d.name)}</h2>
    ${statusChip(d)}${addr}
    ${(phone || nav) ? `<div class="pb-acts">${nav}${phone}</div>` : ""}
  </div>`;
}
function lodgingCard(day) {
  if (day.lodging == null) return "";
  const h = TRIP.lodging[day.lodging]; if (!h) return "";
  return `<div class="card">
    <div class="label">🏨 לינה</div>
    <h2 class="dinner-name">${esc(h.name)}</h2>
    <p class="sub">${esc(h.city)} · ${esc(h.addr)}</p>
    <div class="pb-acts">
      <a class="pill" target="_blank" rel="noopener" href="${coordUrl(h.coords)}">📍 ניווט</a>
      <a class="pill" href="${telUrl(h.phone)}">📞 ${esc(h.phone)}</a>
    </div>
  </div>`;
}

/* ---------- מסך "היום" ---------- */
function renderToday() {
  const d = selected;
  const st = tripState();
  let banner = "";
  if (st.phase === "before") {
    const n = daysUntilStart();
    banner = `<div class="countdown">✈️ עוד <b>${n}</b> ${n === 1 ? "יום" : "ימים"} ליציאה!</div>`;
  } else if (st.phase === "during" && selected.date === todayISO()) {
    banner = `<div class="countdown live">🟢 היום · יום ${d.n} מתוך ${DAYS.length}</div>`;
  } else {
    banner = `<div class="countdown ghost">יום ${d.n} מתוך ${DAYS.length}</div>`;
  }
  const tent = d.tentative ? `<div class="notice">✏️ יום זה בתכנון ראשוני — לעדכון</div>` : "";
  const diff = d.difficulty ? `<span class="chip diff">🥾 ${esc(d.difficulty)}</span>` : "";

  $("#today").innerHTML = `
    <section class="hero" style="background-image:url('assets/${esc(d.image)}')">
      <div class="hero-shade"></div>
      <div class="hero-content">
        <div class="eyebrow">יום ${d.n} · ${esc(fmtDate(d.date))}</div>
        <h1>${esc(d.title)}</h1>
        <p>${esc(d.place)}</p>
      </div>
    </section>

    ${banner}

    <div id="weather" class="weather-strip"><div class="wskel" style="grid-column:1/-1">טוען מזג אוויר…</div></div>

    <div class="content">
      ${tent}
      <div class="quick">
        <a class="q-btn" target="_blank" rel="noopener" href="${mapsUrl(d)}"><span>📍</span>ניווט</a>
        <button class="q-btn" onclick="openDay('${d.date}')"><span>📋</span>כל הפרטים</button>
        <a class="q-btn" target="_blank" rel="noopener" href="${voucherPath(d.date)}"><span>🎟️</span>שובר</a>
      </div>

      <div class="card summary">
        <div class="sum-row"><div><div class="label">יציאה</div><b>${esc(d.departure || "—")}</b></div>${diff}</div>
        <p class="sum-line">${esc(d.summary || "")}</p>
        ${tagRow(d)}
      </div>

      <div class="section-head">התכנית של היום</div>
      ${(d.plan || []).map(planBlock).join("")}

      ${dinnerCard(d)}
      ${lodgingCard(d)}
      ${driveCard(d)}

      <div class="card">
        <div class="label">🎒 מה לקחת</div>
        <p>${esc(d.packing || "—")}</p>
        ${(d.tips || []).length ? `<ul class="tips">${d.tips.map(t => `<li>💡 ${esc(t)}</li>`).join("")}</ul>` : ""}
      </div>
    </div>`;
  loadWeather(d);
}

/* ---------- מזג אוויר (Open-Meteo, ללא מפתח) ---------- */
async function loadWeather(d) {
  const el = $("#weather");
  const [lat, lon] = d.coords;
  const isToday = d.date === todayISO();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
      + `&current=temperature_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code`
      + `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code`
      + `&timezone=auto&start_date=${d.date}&end_date=${d.date}`;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 7000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    const w = await r.json();
    const day = w.daily;
    const hi = Math.round(day.temperature_2m_max[0]);
    const lo = Math.round(day.temperature_2m_min[0]);
    const rain = day.precipitation_probability_max[0] ?? 0;
    const emoji = wcode(day.weather_code[0]);
    let cells;
    if (isToday && w.current) {
      const c = w.current;
      cells = [
        [`${Math.round(c.temperature_2m)}°`, "עכשיו"],
        [`${Math.round(c.apparent_temperature)}°`, "מרגיש כמו"],
        [`${Math.round(c.wind_speed_10m)}`, "קמ״ש רוח"],
        [`${rain}%`, "סיכוי גשם"]
      ];
    } else {
      cells = [
        [emoji, "תחזית"],
        [`${hi}°`, "מקסימום"],
        [`${lo}°`, "מינימום"],
        [`${rain}%`, "סיכוי גשם"]
      ];
    }
    el.innerHTML = cells.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join("");
  } catch (e) {
    el.innerHTML = `<div class="wskel" style="grid-column:1/-1"><b>מזג האוויר יתעדכן כשתהיה קליטה</b><span>שאר האפליקציה עובדת גם בלי אינטרנט</span></div>`;
  }
}
function wcode(c) {
  if (c === 0) return "☀️";
  if (c <= 2) return "🌤️";
  if (c === 3) return "☁️";
  if (c <= 48) return "🌫️";
  if (c <= 67) return "🌧️";
  if (c <= 77) return "🌨️";
  if (c <= 82) return "🌦️";
  if (c <= 99) return "⛈️";
  return "🌡️";
}

/* ---------- מסך "כל הימים" ---------- */
function renderDays() {
  const t = todayISO();
  $("#daysList").innerHTML = DAYS.map(d => {
    const now = d.date === t ? `<span class="today-dot">היום</span>` : "";
    const tent = d.tentative ? `<span class="mini-note">תכנון ראשוני</span>` : "";
    return `<article class="day-card${d.date === t ? " is-today" : ""}" onclick="selectDay('${d.date}')">
      <img src="assets/${esc(d.image)}" alt="" loading="lazy">
      <div class="dc-body">
        <div class="dc-top"><span class="date">יום ${d.n} · ${esc(shortDate(d.date))}</span>${now}</div>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.place)}</p>
        <p class="dc-sum">${esc(d.summary || "")} ${tent}</p>
      </div>
    </article>`;
  }).join("");
}

/* ---------- מסך "שוברים" ---------- */
function renderVouchers() {
  $("#voucherList").innerHTML = `
    <div class="notice info">🎟️ כל שובר נפתח בלחיצה. אם עדיין לא הועלה — יופיע כאן איך להוסיף אותו.</div>`
    + DAYS.map(d => `<div class="voucher-card">
      <div class="vc-row">
        <div><div class="date">יום ${d.n} · ${esc(shortDate(d.date))}</div><h3>${esc(d.title)}</h3></div>
        <a class="pill open" target="_blank" rel="noopener" href="${voucherPath(d.date)}">פתיחת שובר</a>
      </div>
      <p class="missing">להוספה: שמרו PDF בשם <code>${d.date}.pdf</code> בתיקיית <code>vouchers</code>.</p>
    </div>`).join("");
}

/* ---------- מסך "מידע" ---------- */
function renderInfo() {
  const lodging = TRIP.lodging.map(h => `<div class="info-block">
    <b>${esc(h.name)}</b>
    <p class="sub">${esc(h.nights)} · ${esc(h.city)}</p>
    <p class="sub">${esc(h.addr)}</p>
    <div class="pb-acts">
      <a class="pill" target="_blank" rel="noopener" href="${coordUrl(h.coords)}">📍 ניווט</a>
      <a class="pill" href="${telUrl(h.phone)}">📞 ${esc(h.phone)}</a>
    </div>
  </div>`).join("");

  const restos = DAYS.filter(d => d.dinner && d.dinner.phone).map(d =>
    `<div class="resto-row">
      <div><b>${esc(d.dinner.name)}</b><span class="sub">יום ${d.n} · ${esc(shortDate(d.date))}${d.dinner.time ? " · " + esc(d.dinner.time) : ""}</span></div>
      <div class="resto-side">${statusChip(d.dinner)}<a class="pill" href="${telUrl(d.dinner.phone)}">📞</a></div>
    </div>`).join("");

  $("#infoContent").innerHTML = `
    <div class="card danger-card">
      <div class="label">🚨 חירום</div>
      <a class="big-action danger" href="tel:112">חיוג ל־112</a>
      <p class="sub" style="text-align:center">מספר החירום האירופי — משטרה · אמבולנס · כיבוי אש</p>
    </div>

    <div class="card">
      <div class="label">🏨 בתי המלון</div>
      ${lodging}
    </div>

    <div class="card">
      <div class="label">🍽️ הזמנות למסעדות</div>
      ${restos}
    </div>

    <div class="card">
      <div class="label">👥 החבורה</div>
      <div class="crew"><div><b>${TRIP.adults}</b><span>מבוגרים</span></div><div><b>${TRIP.kids}</b><span>ילדים</span></div><div><b>${TRIP.adults + TRIP.kids}</b><span>סה״כ</span></div></div>
    </div>

    <div class="card">
      <div class="label">📲 שימוש פשוט</div>
      <p>פותחים את הקישור — המסך הראשון מציג אוטומטית את היום הנכון. אין הרשמה ואין סיסמה.</p>
      <p>להתקנה כמו אפליקציה: פותחים בדפדפן ובוחרים <b>"הוספה למסך הבית"</b>. לאחר מכן האפליקציה עובדת גם ללא אינטרנט.</p>
    </div>

    <p class="credits">תמונות הנופים מ־Wikimedia Commons (CC BY-SA) · <a href="CREDITS.md" target="_blank" rel="noopener">קרדיט מלא</a></p>`;
}

/* ---------- גיליון פרטים מלא ---------- */
function openDay(date) {
  const d = DAYS.find(x => x.date === date); if (!d) return;
  const tent = d.tentative ? `<div class="notice">✏️ יום זה בתכנון ראשוני — לעדכון</div>` : "";
  $("#sheetContent").innerHTML = `
    <img class="sheet-photo" src="assets/${esc(d.image)}" alt="">
    <div class="sheet-head">
      <div class="date">יום ${d.n} · ${esc(fmtDate(d.date))}</div>
      <h1>${esc(d.title)}</h1>
      <p class="sub">${esc(d.place)}</p>
      ${tagRow(d)}
    </div>
    ${tent}
    <div class="section-head">התכנית</div>
    ${(d.plan || []).map(planBlock).join("")}
    ${dinnerCard(d)}
    ${lodgingCard(d)}
    ${driveCard(d)}
    <div class="card">
      <div class="label">🎒 מה לקחת</div><p>${esc(d.packing || "—")}</p>
      ${(d.tips || []).length ? `<ul class="tips">${d.tips.map(t => `<li>💡 ${esc(t)}</li>`).join("")}</ul>` : ""}
    </div>
    <div class="quick sheet-quick">
      <a class="q-btn" target="_blank" rel="noopener" href="${mapsUrl(d)}"><span>📍</span>ניווט</a>
      <a class="q-btn" target="_blank" rel="noopener" href="${voucherPath(d.date)}"><span>🎟️</span>שובר</a>
    </div>`;
  const s = $("#sheet"); s.classList.add("open"); s.setAttribute("aria-hidden", "false");
  s.querySelector(".sheet-card").scrollTop = 0;
}
function closeSheet() {
  const s = $("#sheet"); s.classList.remove("open"); s.setAttribute("aria-hidden", "true");
}

/* ---------- ניווט בין מסכים ---------- */
function selectDay(date) {
  selected = DAYS.find(d => d.date === date) || selected;
  renderToday(); showView("today"); window.scrollTo(0, 0);
}
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
  document.querySelectorAll(".tabbar button").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  window.scrollTo(0, 0);
}
document.querySelectorAll(".tabbar button").forEach(b => b.onclick = () => showView(b.dataset.view));
$("#sheet").addEventListener("click", e => { if (e.target.id === "sheet") closeSheet(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

/* ---------- הוספה למסך הבית ---------- */
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferredPrompt = e;
  const b = $("#installBtn"); b.hidden = false;
  b.onclick = async () => { b.hidden = true; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; };
});

/* ---------- אתחול ---------- */
renderToday(); renderDays(); renderVouchers(); renderInfo();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
