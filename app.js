/* ==========================================================
   נפלאות הדולומיטים 2026 — Midnight Focus
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
const parseMin = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t)); return m ? +m[1] * 60 + +m[2] : null; };
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };

function tripPhase() { const t = todayISO(); if (t < DAYS[0].date) return "before"; if (t > DAYS[DAYS.length - 1].date) return "after"; return "during"; }
const daysUntilStart = () => { const now = new Date(); now.setHours(0, 0, 0, 0); return Math.round((new Date(DAYS[0].date + "T00:00") - now) / 864e5); };

const KIND_ICON = { drive:"🚗", cable:"🚠", hike:"🥾", walk:"🚶", activity:"🎯", food:"🍽️", kids:"🎢", checkin:"🏨", boat:"⚓", sight:"⛪", free:"✨", view:"👀" };
const STATUS = { ok:{d:"ok",t:"מאושר"}, pending:{d:"pending",t:"ממתין לאישור"}, none:{d:"none",t:""} };

let selected = DAYS.find(d => d.date === todayISO()) || DAYS[0];

/* ---------- מזג אוויר ---------- */
function wcode(c){ if(c===0)return"☀️"; if(c<=2)return"🌤️"; if(c===3)return"☁️"; if(c<=48)return"🌫️"; if(c<=67)return"🌧️"; if(c<=77)return"🌨️"; if(c<=82)return"🌦️"; if(c<=99)return"⛈️"; return"🌡️"; }
async function loadWeather(d) {
  const el = $("#wx"); if (!el) return;
  const [lat, lon] = d.coords, isToday = d.date === todayISO();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&start_date=${d.date}&end_date=${d.date}`;
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 7000);
    const w = await (await fetch(url, { signal: ctrl.signal })).json(); clearTimeout(to);
    const dd = w.daily, hi = Math.round(dd.temperature_2m_max[0]), rain = dd.precipitation_probability_max[0] ?? 0, emoji = wcode(dd.weather_code[0]);
    el.textContent = (isToday && w.current) ? `${emoji} ${Math.round(w.current.temperature_2m)}° · גשם ${rain}%` : `${emoji} מקס׳ ${hi}° · גשם ${rain}%`;
  } catch (e) { el.textContent = "מזג אוויר עם קליטה"; }
}

/* ---------- day chips ---------- */
function chipsHTML() {
  const t = todayISO();
  return `<div class="chips">` + DAYS.map(d =>
    `<button class="chip${d.date === selected.date ? " on" : ""}${d.date === t ? " today" : ""}" onclick="selectDay('${d.date}')">
      <b>${d.date.slice(8)}</b><span>יום ${d.n}</span></button>`).join("") + `</div>`;
}

/* ---------- focus (now / next / preview) ---------- */
function buildFocus(d) {
  const isToday = d.date === todayISO(), phase = tripPhase();
  const items = d.schedule || [];
  const timed = items.map((x) => ({ x, m: parseMin(x.time) })).filter(o => o.m != null);
  const icon = it => it && it.kind ? (KIND_ICON[it.kind] || "•") + " " : "";

  if (isToday && phase === "during" && timed.length) {
    const now = nowMin();
    let curr = null; for (const o of timed) if (o.m <= now) curr = o;
    const nxt = timed.find(o => o.m > now) || null;
    const head = curr ? curr.x : timed[0].x;
    return { img: d.image, label: curr ? "● עכשיו" : "● מתחילים", big: head.time,
      title: icon(head) + head.title, note: head.note || "", nav: navUrl(head) || dayNavUrl(d),
      next: (curr ? (nxt && nxt.x) : (timed[1] && timed[1].x)) || null, nextLabel: "הבא" };
  }
  if (phase === "before" && d.date === DAYS[0].date) {
    const n = daysUntilStart();
    return { img: d.image, label: "✈︎ ליציאה", big: String(n), suf: n === 1 ? "יום" : "ימים",
      title: `יום 1 · ${d.title}`, note: d.summary || "", nav: dayNavUrl(d),
      next: timed[0] && timed[0].x || items[0] || null, nextLabel: "מתחילים" };
  }
  const head = timed[0] ? timed[0].x : (items[0] || {});
  return { img: d.image, label: "התוכנית", big: head.time || `יום ${d.n}`,
    title: icon(head) + (head.title || d.title), note: head.note || d.summary || "", nav: navUrl(head) || dayNavUrl(d),
    next: (timed[1] && timed[1].x) || null, nextLabel: "אחר כך" };
}
function focusHTML(d) {
  const f = buildFocus(d);
  const suf = f.suf ? `<span class="suf">${esc(f.suf)}</span>` : "";
  const nx = f.next ? `<div class="next"><b>${esc(f.nextLabel)}${f.next.time ? " · " + esc(f.next.time) : ""}</b><span>${(f.next.kind ? (KIND_ICON[f.next.kind] || "") + " " : "")}${esc(f.next.title)}</span></div>` : "";
  return `<div class="focus">
    <div class="focus-bg" style="background-image:url('assets/${esc(f.img)}')"></div>
    <div class="focus-fg">
      <div class="focus-top"><span class="focus-label">${esc(f.label)}</span><span class="pace">${esc(d.base)}${d.difficulty ? " · " + esc(d.difficulty) : ""}</span></div>
      <div class="focus-big">${esc(f.big)}${suf}</div>
      <h2 class="focus-title">${esc(f.title)}</h2>
      ${f.note ? `<p class="focus-note">${esc(f.note)}</p>` : ""}
      <a class="go" target="_blank" rel="noopener" href="${f.nav}">📍 ניווט ליעד</a>
    </div>
  </div>${nx}`;
}

/* ---------- sections ---------- */
function scheduleItem(x) {
  const ic = KIND_ICON[x.kind] || "•";
  const kids = x.kids ? `<span class="badge-kids">נוער</span>` : "";
  const st = x.status && x.status !== "none" ? `<span class="sdot ${STATUS[x.status].d}"></span>` : "";
  const note = x.note ? `<p class="tl-note">${esc(x.note)}</p>` : "";
  const book = x.book ? `<div class="tl-book">ℹ︎ ${esc(x.book)}</div>` : "";
  const nav = navUrl(x);
  const acts = nav ? `<div class="tl-actions"><a class="chip-link" target="_blank" rel="noopener" href="${nav}">📍 ניווט</a>${x.url ? `<a class="chip-link" target="_blank" rel="noopener" href="${esc(x.url)}">🔗 אתר</a>` : ""}</div>` : "";
  return `<div class="tl-item"><div class="tl-time ${x.tsoft ? "soft" : ""}"><span class="tl-dot"></span>${esc(x.time)}</div>
    <div class="tl-body"><div class="tl-title"><span class="tl-ic">${ic}</span>${esc(x.title)}${kids}${st}</div>${note}${book}${acts}</div></div>`;
}
function diningSection(d) {
  const din = d.dining || {}; let html = "";
  if (din.dinner) {
    const dn = din.dinner, s = STATUS[dn.status] || STATUS.none;
    const stag = dn.status && dn.status !== "none" ? `<span class="sdot ${s.d}"></span>` : "";
    const label = dn.status === "ok" ? "✓ מאושר" : dn.status === "pending" ? "● ממתין לאישור" : (dn.note || "");
    const phone = dn.phone ? `<a class="icon-btn" href="${telUrl(dn.phone)}">📞</a>` : "";
    const nav = navUrl(dn) ? `<a class="icon-btn" target="_blank" rel="noopener" href="${navUrl(dn)}">📍</a>` : "";
    html += `<div class="dinner-row"><div class="row" style="border:0;padding:0"><div class="row-main"><div class="row-title">🍽️ ${esc(dn.name)}${dn.time ? " · " + esc(dn.time) : ""}${stag}</div><p class="row-note">${esc(label)}${dn.addr ? " · " + esc(dn.addr) : ""}</p></div><div class="row-side">${nav}${phone}</div></div></div>`;
  }
  if ((din.lunch || []).length) {
    html += `<div class="section-label" style="margin-top:6px">אופציות לצהריים</div>`;
    html += din.lunch.map(l => `<div class="row"><div class="row-ic">🍝</div><div class="row-main"><div class="row-title">${esc(l.name)}</div><p class="row-note">${esc(l.note || "")}</p></div>${navUrl(l) ? `<div class="row-side"><a class="icon-btn" target="_blank" rel="noopener" href="${navUrl(l)}">📍</a></div>` : ""}</div>`).join("");
  }
  return html ? `<div class="section"><div class="section-label">איפה לאכול</div>${html}</div>` : "";
}
function stopsSection(d) {
  if (!(d.stops || []).length) return "";
  return `<div class="section"><div class="section-label">שווה עצירה בדרך</div>` + d.stops.map(s => `<div class="row"><div class="row-ic">${s.icon || "📍"}</div><div class="row-main"><div class="row-title">${esc(s.name)}</div><p class="row-note">${esc(s.note || "")}</p></div>${navUrl(s) ? `<div class="row-side"><a class="icon-btn" target="_blank" rel="noopener" href="${navUrl(s)}">📍</a></div>` : ""}</div>`).join("") + `</div>`;
}
function knowSection(d) {
  if (!(d.know || []).length) return "";
  return `<div class="section"><div class="section-label">טוב לדעת</div><ul class="know">${d.know.map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>`;
}

/* ---------- Today ---------- */
function renderToday() {
  const d = selected;
  const tent = d.tentative ? `<div class="notice">✏️ יום בתכנון ראשוני — ניתן לעדכן</div>` : "";
  $("#today").innerHTML = `${chipsHTML()}<div class="wrap">
    <div class="daymeta"><span class="eyebrow">יום ${d.n} · ${esc(fmtDate(d.date))}</span><span class="wx" id="wx">מזג אוויר…</span></div>
    ${focusHTML(d)}
    ${tent}
    <div class="section"><div class="section-label">כל היום · לפי שעות</div><div class="timeline">${(d.schedule || []).map(scheduleItem).join("")}</div></div>
    ${diningSection(d)}
    ${stopsSection(d)}
    ${knowSection(d)}
    <div class="section" style="padding-bottom:6px"><div class="section-label">מה לקחת</div><p class="muted-p">${esc(d.pack || "—")}</p>
      <div class="tl-actions" style="margin-top:12px"><a class="chip-link" target="_blank" rel="noopener" href="${voucherPath(d.date)}">🎟 שובר היום</a></div></div>
  </div>`;
  loadWeather(d);
}

/* ---------- Days ---------- */
function renderDays() {
  const t = todayISO();
  $("#daysList").innerHTML = DAYS.map(d => {
    const today = d.date === t ? `<span class="today-tag">היום</span>` : "";
    const tent = d.tentative ? ` · <span class="tent">תכנון ראשוני</span>` : "";
    return `<div class="day-card${d.date === t ? " is-today" : ""}" onclick="selectDay('${d.date}')"><img src="assets/${esc(d.image)}" alt="" loading="lazy"><div class="dc"><div class="dc-top"><span class="day-n">יום ${d.n} · ${esc(shortDate(d.date))}</span>${today}</div><h3>${esc(d.title)}</h3><p>${esc(d.place)}</p><p class="sm">${esc(d.summary || "")}${tent}</p></div></div>`;
  }).join("");
}

/* ---------- Vouchers ---------- */
function renderVouchers() {
  $("#voucherList").innerHTML = `<div class="v-note">כל שובר נפתח בלחיצה. להוספה: שמרו PDF בשם התאריך (למשל <code>2026-07-17.pdf</code>) בתיקיית <code>vouchers</code>.</div>` +
    DAYS.map(d => `<div class="v-row"><div><span class="day-n">יום ${d.n} · ${esc(shortDate(d.date))}</span><h3>${esc(d.title)}</h3><p class="miss">קובץ: ${d.date}.pdf</p></div><a class="v-open" target="_blank" rel="noopener" href="${voucherPath(d.date)}">פתיחה</a></div>`).join("");
}

/* ---------- Info ---------- */
function renderInfo() {
  const hotels = TRIP.lodging.map(h => `<div class="hotel"><b>${esc(h.name)}</b><p class="row-note">${esc(h.nights)} · ${esc(h.city)} · ${esc(h.addr)}</p><div class="tl-actions"><a class="chip-link" target="_blank" rel="noopener" href="${coordUrl(h.coords)}">📍 ניווט</a><a class="chip-link" href="${telUrl(h.phone)}">📞 ${esc(h.phone)}</a></div></div>`).join("");
  const restos = DAYS.filter(d => d.dining && d.dining.dinner && d.dining.dinner.phone).map(d => {
    const dn = d.dining.dinner, s = STATUS[dn.status] || STATUS.none;
    const tag = dn.status && dn.status !== "none" ? `<span class="sdot ${s.d}"></span>` : "";
    return `<div class="row"><div class="row-main"><div class="row-title">${esc(dn.name)}${tag}</div><p class="row-note">יום ${d.n} · ${esc(shortDate(d.date))}${dn.time ? " · " + esc(dn.time) : ""} · ${esc(s.t || dn.note || "")}</p></div><div class="row-side"><a class="icon-btn" href="${telUrl(dn.phone)}">📞</a>${navUrl(dn) ? `<a class="icon-btn" target="_blank" rel="noopener" href="${navUrl(dn)}">📍</a>` : ""}</div></div>`;
  }).join("");
  $("#infoContent").innerHTML = `
    <div class="info-sec"><div class="section-label">חירום</div><a class="emergency" href="tel:112">🚨 חיוג ל־112</a><p class="subnote" style="text-align:center;margin-top:8px">מספר החירום האירופי · משטרה · אמבולנס · כיבוי אש</p></div>
    <div class="info-sec"><div class="section-label">בתי המלון</div>${hotels}</div>
    <div class="info-sec"><div class="section-label">הזמנות למסעדות</div>${restos}</div>
    <div class="info-sec"><div class="section-label">החבורה</div><div class="crew"><div><b>${TRIP.adults}</b><span>מבוגרים</span></div><div><b>${TRIP.kids}</b><span>ילדים</span></div><div><b>${TRIP.adults + TRIP.kids}</b><span>סה״כ</span></div></div></div>
    <div class="info-sec"><div class="section-label">שימוש פשוט</div><p class="muted-p">פותחים את הקישור — המסך הראשון מציג אוטומטית את היום הנכון, עם ״עכשיו״ ו״הבא״. אין הרשמה ואין סיסמה.</p><p class="muted-p">להתקנה כמו אפליקציה: בדפדפן בוחרים <b>"הוספה למסך הבית"</b>. לאחר מכן עובד גם ללא אינטרנט.</p></div>
    <p class="credits">תמונות הנופים מ־Wikimedia Commons (CC BY-SA) · <a href="CREDITS.md" target="_blank" rel="noopener">קרדיט מלא</a></p>`;
}

/* ---------- ניווט ---------- */
function selectDay(date) { selected = DAYS.find(d => d.date === date) || selected; renderToday(); showView("today"); }
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
  document.querySelectorAll(".tabbar button").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  window.scrollTo(0, 0);
}
function goToday() { selected = DAYS.find(d => d.date === todayISO()) || DAYS[0]; renderToday(); showView("today"); }
document.querySelectorAll(".tabbar button").forEach(b => b.onclick = () => { if (b.dataset.view === "today") goToday(); else showView(b.dataset.view); });

/* ---------- התקנה ---------- */
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; const b = $("#installBtn"); b.hidden = false; b.onclick = async () => { b.hidden = true; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }; });

/* ---------- אתחול ---------- */
renderToday(); renderDays(); renderVouchers(); renderInfo();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
