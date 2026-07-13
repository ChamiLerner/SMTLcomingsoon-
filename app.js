/* ==========================================================
   נפלאות הדולומיטים 2026 — לוגיקת האפליקציה (עיצוב נקי)
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
const coordUrl = c => `https://www.google.com/maps/search/?api=1&query=${c[0]},${c[1]}`;
const queryUrl = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const navUrl = o => o && o.coords ? coordUrl(o.coords) : (o && o.q ? queryUrl(o.q) : null);
const dayNavUrl = d => d.coords ? coordUrl(d.coords) : queryUrl(d.place || d.title);
const voucherPath = date => `vouchers/${date}.pdf`;
const telUrl = p => "tel:" + String(p).replace(/[^\d+]/g, "");

function tripPhase() {
  const t = todayISO();
  if (t < DAYS[0].date) return "before";
  if (t > DAYS[DAYS.length - 1].date) return "after";
  return "during";
}
const daysUntilStart = () => {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((new Date(DAYS[0].date + "T00:00") - now) / 864e5);
};

const KIND_ICON = { drive:"🚗", cable:"🚠", hike:"🥾", walk:"🚶", activity:"🎯", food:"🍽️",
  kids:"🎢", checkin:"🏨", boat:"⚓", sight:"⛪", free:"✨", view:"👀" };
const STATUS = { ok:{d:"ok",t:"מאושר"}, pending:{d:"pending",t:"ממתין לאישור"}, none:{d:"none",t:""} };

let selected = DAYS.find(d => d.date === todayISO()) || DAYS[0];

/* ---------- מזג אוויר (Open-Meteo) ---------- */
function wcode(c){ if(c===0)return"☀️"; if(c<=2)return"🌤️"; if(c===3)return"☁️"; if(c<=48)return"🌫️";
  if(c<=67)return"🌧️"; if(c<=77)return"🌨️"; if(c<=82)return"🌦️"; if(c<=99)return"⛈️"; return"🌡️"; }
async function loadWeather(d, elId) {
  const el = document.getElementById(elId); if (!el) return;
  const [lat, lon] = d.coords, isToday = d.date === todayISO();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
      + `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code`
      + `&timezone=auto&start_date=${d.date}&end_date=${d.date}`;
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 7000);
    const w = await (await fetch(url, { signal: ctrl.signal })).json(); clearTimeout(to);
    const dd = w.daily, hi = Math.round(dd.temperature_2m_max[0]), lo = Math.round(dd.temperature_2m_min[0]);
    const rain = dd.precipitation_probability_max[0] ?? 0, emoji = wcode(dd.weather_code[0]);
    const now = (isToday && w.current) ? `${Math.round(w.current.temperature_2m)}° · ` : "";
    el.innerHTML = `${emoji} ${now}מקס׳ ${hi}° מינ׳ ${lo}° · גשם ${rain}%`;
  } catch (e) { el.textContent = "מזג אוויר יתעדכן עם קליטה"; }
}

/* ---------- מסך "היום" ---------- */
function scheduleItem(x) {
  const ic = KIND_ICON[x.kind] || "•";
  const kids = x.kids ? `<span class="badge-kids">נוער</span>` : "";
  const st = x.status && x.status !== "none" ? `<span class="sdot ${STATUS[x.status].d}"></span>` : "";
  const note = x.note ? `<p class="tl-note">${esc(x.note)}</p>` : "";
  const book = x.book ? `<div class="tl-book">ℹ︎ ${esc(x.book)}</div>` : "";
  const nav = navUrl(x);
  const acts = nav ? `<div class="tl-actions"><a class="chip-link" target="_blank" rel="noopener" href="${nav}">📍 ניווט</a>${x.url ? `<a class="chip-link" target="_blank" rel="noopener" href="${esc(x.url)}">🔗 אתר</a>` : ""}</div>` : "";
  return `<div class="tl-item">
    <div class="tl-time ${x.tsoft ? "soft" : ""}"><span class="tl-dot"></span>${esc(x.time)}</div>
    <div class="tl-body">
      <div class="tl-title"><span class="tl-ic">${ic}</span>${esc(x.title)}${kids}${st}</div>
      ${note}${book}${acts}
    </div>
  </div>`;
}
function diningSection(d) {
  const din = d.dining || {}; let html = "";
  if (din.dinner) {
    const dn = din.dinner, s = STATUS[dn.status] || STATUS.none;
    const stag = dn.status && dn.status !== "none" ? `<span class="sdot ${s.d}"></span>` : "";
    const label = dn.status === "ok" ? "✓ מאושר" : dn.status === "pending" ? "● ממתין לאישור" : (dn.note || "");
    const phone = dn.phone ? `<a class="icon-btn" href="${telUrl(dn.phone)}">📞</a>` : "";
    const nav = navUrl(dn) ? `<a class="icon-btn" target="_blank" rel="noopener" href="${navUrl(dn)}">📍</a>` : "";
    html += `<div class="dinner-row"><div class="row" style="border:0;padding:0">
      <div class="row-main"><div class="row-title">🍽️ ${esc(dn.name)}${dn.time ? ` · ${esc(dn.time)}` : ""}${stag}</div>
      <p class="row-note">${esc(label)}${dn.addr ? " · " + esc(dn.addr) : ""}</p></div>
      <div class="row-side">${nav}${phone}</div></div></div>`;
  }
  if ((din.lunch || []).length) {
    html += `<div class="section-label" style="margin-top:6px">אופציות לצהריים</div>`;
    html += din.lunch.map(l => `<div class="row"><div class="row-ic">🍝</div>
      <div class="row-main"><div class="row-title">${esc(l.name)}</div><p class="row-note">${esc(l.note || "")}</p></div>
      ${navUrl(l) ? `<div class="row-side"><a class="icon-btn" target="_blank" rel="noopener" href="${navUrl(l)}">📍</a></div>` : ""}
    </div>`).join("");
  }
  return html ? `<div class="section"><div class="section-label">איפה לאכול</div>${html}</div>` : "";
}
function stopsSection(d) {
  if (!(d.stops || []).length) return "";
  return `<div class="section"><div class="section-label">שווה עצירה בדרך</div>` +
    d.stops.map(s => `<div class="row"><div class="row-ic">${s.icon || "📍"}</div>
      <div class="row-main"><div class="row-title">${esc(s.name)}</div><p class="row-note">${esc(s.note || "")}</p></div>
      ${navUrl(s) ? `<div class="row-side"><a class="icon-btn" target="_blank" rel="noopener" href="${navUrl(s)}">📍</a></div>` : ""}
    </div>`).join("") + `</div>`;
}
function knowSection(d) {
  if (!(d.know || []).length) return "";
  return `<div class="section"><div class="section-label">טוב לדעת</div>
    <ul class="know">${d.know.map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>`;
}

function renderToday() {
  const d = selected, phase = tripPhase(), isRealToday = d.date === todayISO();
  let status = "";
  if (phase === "before" && isRealToday === false && d.n === 1) {
    const n = daysUntilStart();
    status = `<div class="status-line"><span>✈️ עוד <span class="live">${n}</span> ${n === 1 ? "יום" : "ימים"} ליציאה</span>${backBtn()}</div>`;
  } else if (phase === "during" && isRealToday) {
    status = `<div class="status-line"><span class="live">● היום</span><span>· יום ${d.n} מתוך ${DAYS.length}</span></div>`;
  } else {
    status = `<div class="status-line"><span>יום ${d.n} מתוך ${DAYS.length}</span>${backBtn()}</div>`;
  }
  const diff = d.difficulty ? `<span class="dot"></span><b>${esc(d.difficulty)}</b>` : "";
  const tent = d.tentative ? `<div class="notice">✏️ יום בתכנון ראשוני — ניתן לעדכן</div>` : "";

  $("#today").innerHTML = `
    <div class="hero" style="background-image:url('assets/${esc(d.image)}')">
      <div class="hero-in">
        <span class="eyebrow">יום ${d.n} · ${esc(fmtDate(d.date))}</span>
        <h1>${esc(d.title)}</h1>
        <p class="place">${esc(d.place)}</p>
      </div>
    </div>
    <div class="wrap">
      <div class="meta"><b>${esc(d.base)}</b>${diff}<span class="wx" id="wx">מזג אוויר…</span></div>
      ${status}
      ${tent}
      <div class="actions">
        <a class="btn primary" target="_blank" rel="noopener" href="${dayNavUrl(d)}">📍 ניווט ליעד</a>
        <a class="btn" target="_blank" rel="noopener" href="${voucherPath(d.date)}">🎟 שובר היום</a>
      </div>

      <div class="section">
        <div class="section-label">מסלול היום · לפי שעות</div>
        <div class="timeline">${(d.schedule || []).map(scheduleItem).join("")}</div>
      </div>

      ${diningSection(d)}
      ${stopsSection(d)}
      ${knowSection(d)}

      <div class="section" style="padding-bottom:6px">
        <div class="section-label">מה לקחת</div>
        <p class="muted-p">${esc(d.pack || "—")}</p>
      </div>
    </div>`;
  loadWeather(d, "wx");
}
function backBtn() {
  return DAYS.some(x => x.date === todayISO())
    ? `<button class="back-today" onclick="goToday()">↩︎ להיום</button>` : "";
}
function goToday() {
  selected = DAYS.find(d => d.date === todayISO()) || DAYS[0];
  renderToday(); showView("today");
}

/* ---------- מסך "כל הימים" ---------- */
function renderDays() {
  const t = todayISO();
  $("#daysList").innerHTML = DAYS.map(d => {
    const today = d.date === t ? `<span class="today-tag">היום</span>` : "";
    const tent = d.tentative ? ` · <span class="tent">תכנון ראשוני</span>` : "";
    return `<div class="day-card${d.date === t ? " is-today" : ""}" onclick="selectDay('${d.date}')">
      <img src="assets/${esc(d.image)}" alt="" loading="lazy">
      <div class="dc">
        <div class="dc-top"><span class="day-n">יום ${d.n} · ${esc(shortDate(d.date))}</span>${today}</div>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.place)}</p>
        <p class="sm">${esc(d.summary || "")}${tent}</p>
      </div>
    </div>`;
  }).join("");
}

/* ---------- מסך "שוברים" ---------- */
function renderVouchers() {
  $("#voucherList").innerHTML =
    `<div class="v-note">כל שובר נפתח בלחיצה. להוספה: שמרו PDF בשם התאריך (למשל <code>2026-07-17.pdf</code>) בתיקיית <code>vouchers</code>.</div>`
    + DAYS.map(d => `<div class="v-row">
        <div><span class="day-n">יום ${d.n} · ${esc(shortDate(d.date))}</span><h3>${esc(d.title)}</h3>
        <p class="miss">קובץ: ${d.date}.pdf</p></div>
        <a class="v-open" target="_blank" rel="noopener" href="${voucherPath(d.date)}">פתיחה</a>
      </div>`).join("");
}

/* ---------- מסך "מידע" ---------- */
function renderInfo() {
  const hotels = TRIP.lodging.map(h => `<div class="hotel">
    <b>${esc(h.name)}</b><p class="row-note">${esc(h.nights)} · ${esc(h.city)} · ${esc(h.addr)}</p>
    <div class="tl-actions"><a class="chip-link" target="_blank" rel="noopener" href="${coordUrl(h.coords)}">📍 ניווט</a>
    <a class="chip-link" href="${telUrl(h.phone)}">📞 ${esc(h.phone)}</a></div></div>`).join("");

  const restos = DAYS.filter(d => d.dining && d.dining.dinner && d.dining.dinner.phone).map(d => {
    const dn = d.dining.dinner, s = STATUS[dn.status] || STATUS.none;
    const tag = dn.status && dn.status !== "none" ? `<span class="sdot ${s.d}"></span>` : "";
    return `<div class="row"><div class="row-main"><div class="row-title">${esc(dn.name)}${tag}</div>
      <p class="row-note">יום ${d.n} · ${esc(shortDate(d.date))}${dn.time ? " · " + esc(dn.time) : ""} · ${esc(s.t || dn.note || "")}</p></div>
      <div class="row-side"><a class="icon-btn" href="${telUrl(dn.phone)}">📞</a>
      ${navUrl(dn) ? `<a class="icon-btn" target="_blank" rel="noopener" href="${navUrl(dn)}">📍</a>` : ""}</div></div>`;
  }).join("");

  $("#infoContent").innerHTML = `
    <div class="info-sec"><div class="section-label">חירום</div>
      <a class="emergency" href="tel:112">🚨 חיוג ל־112</a>
      <p class="subnote" style="text-align:center;margin-top:8px">מספר החירום האירופי · משטרה · אמבולנס · כיבוי אש</p></div>
    <div class="info-sec"><div class="section-label">בתי המלון</div>${hotels}</div>
    <div class="info-sec"><div class="section-label">הזמנות למסעדות</div>${restos}</div>
    <div class="info-sec"><div class="section-label">החבורה</div>
      <div class="crew"><div><b>${TRIP.adults}</b><span>מבוגרים</span></div><div><b>${TRIP.kids}</b><span>ילדים</span></div><div><b>${TRIP.adults + TRIP.kids}</b><span>סה״כ</span></div></div></div>
    <div class="info-sec"><div class="section-label">שימוש פשוט</div>
      <p class="muted-p">פותחים את הקישור — המסך הראשון מציג אוטומטית את היום הנכון. אין הרשמה ואין סיסמה.</p>
      <p class="muted-p">להתקנה כמו אפליקציה: בדפדפן בוחרים <b>"הוספה למסך הבית"</b>. לאחר מכן עובד גם ללא אינטרנט.</p></div>
    <p class="credits">תמונות הנופים מ־Wikimedia Commons (CC BY-SA) · <a href="CREDITS.md" target="_blank" rel="noopener">קרדיט מלא</a></p>`;
}

/* ---------- ניווט בין מסכים ---------- */
function selectDay(date) { selected = DAYS.find(d => d.date === date) || selected; renderToday(); showView("today"); }
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
  document.querySelectorAll(".tabbar button").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  window.scrollTo(0, 0);
}
document.querySelectorAll(".tabbar button").forEach(b => b.onclick = () => {
  if (b.dataset.view === "today") goToday(); else showView(b.dataset.view);
});

/* ---------- הוספה למסך הבית ---------- */
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferredPrompt = e;
  const b = $("#installBtn"); b.hidden = false;
  b.onclick = async () => { b.hidden = true; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; };
});

/* ---------- אתחול ---------- */
renderToday(); renderDays(); renderVouchers(); renderInfo();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
