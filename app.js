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
/* ---------- ניווט לפי שם מקום · Google Maps + Waze ---------- */
const encq = q => encodeURIComponent(q);
const gmapsUrl = q => `https://www.google.com/maps/search/?api=1&query=${encq(q)}`;
const wazeUrl = q => `https://www.waze.com/ul?q=${encq(q)}&navigate=yes`;
function navName(o, day) {
  if (!o) return null;
  if (o.noNav) return null;
  // ניווט רק ליעד עם שם מקום אמיתי — לא לפי כותרת הפעילות (שהיא משפט) או נ״צ
  if (o.q) return o.q;
  const p = o.place && window.PLACES && PLACES[o.place];
  if (p && (p.navq || p.q)) return p.navq || p.q;
  return null;
}
function navBig(q) { return q ? `<div class="nav-row"><a class="nav-btn gmaps" target="_blank" rel="noopener" href="${gmapsUrl(q)}">🗺️ Google Maps</a><a class="nav-btn waze" target="_blank" rel="noopener" href="${wazeUrl(q)}">Waze</a></div>` : ""; }
function navChips(q) { return q ? `<a class="chip-link" target="_blank" rel="noopener" href="${gmapsUrl(q)}">🗺️ Maps</a><a class="chip-link" target="_blank" rel="noopener" href="${wazeUrl(q)}">Waze</a>` : ""; }
function navMini(q) { return q ? `<a class="icon-btn" title="Google Maps" target="_blank" rel="noopener" href="${gmapsUrl(q)}">🗺️</a><a class="icon-btn waze-mini" title="Waze" target="_blank" rel="noopener" href="${wazeUrl(q)}">W</a>` : ""; }
const voucherPath = date => `vouchers/${date}.pdf`;
const telUrl = p => "tel:" + String(p).replace(/[^\d+]/g, "");
const parseMin = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t)); return m ? +m[1] * 60 + +m[2] : null; };
const fmtDur = m => m >= 60 ? `${Math.floor(m / 60)}:${pad(m % 60)} ש׳` : `${m} דק׳`;
const forecastUrl = c => `https://www.meteoblue.com/en/weather/week/${(+c[0]).toFixed(4)}N${(+c[1]).toFixed(4)}E`;
const weatherComUrl = c => `https://weather.com/weather/tenday/l/${(+c[0]).toFixed(3)},${(+c[1]).toFixed(3)}`;
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };

function tripPhase() { const t = todayISO(); if (t < DAYS[0].date) return "before"; if (t > DAYS[DAYS.length - 1].date) return "after"; return "during"; }
const daysUntilStart = () => { const now = new Date(); now.setHours(0, 0, 0, 0); return Math.round((new Date(DAYS[0].date + "T00:00") - now) / 864e5); };

const KIND_ICON = { drive:"🚗", cable:"🚠", hike:"🥾", walk:"🚶", activity:"🎯", food:"🍽️", kids:"🎢", checkin:"🏨", boat:"⚓", sight:"⛪", free:"✨", view:"👀", bar:"🍸", ice:"⛸️" };
const STATUS = { ok:{d:"ok",t:"מאושר"}, pending:{d:"pending",t:"ממתין לאישור"}, none:{d:"none",t:""} };

let selected = DAYS.find(d => d.date === todayISO()) || DAYS[0];

/* ---------- מזג אוויר ---------- */
function wcode(c){ if(c===0)return"☀️"; if(c<=2)return"🌤️"; if(c===3)return"☁️"; if(c<=48)return"🌫️"; if(c<=67)return"🌧️"; if(c<=77)return"🌨️"; if(c<=82)return"🌦️"; if(c<=99)return"⛈️"; return"🌡️"; }
async function loadWeather(d) {
  const el = $("#wx"); if (!el) return;
  const [lat, lon] = d.coords, isToday = d.date === todayISO();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code&timezone=auto&start_date=${d.date}&end_date=${d.date}`;
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 7000);
    const w = await (await fetch(url, { signal: ctrl.signal })).json(); clearTimeout(to);
    const dd = w.daily, hi = Math.round(dd.temperature_2m_max[0]), rain = dd.precipitation_probability_max[0] ?? 0, sum = dd.precipitation_sum?.[0] ?? 0, emoji = wcode(dd.weather_code[0]);
    const tstr = (isToday && w.current) ? `${Math.round(w.current.temperature_2m)}°` : `מקס׳ ${hi}°`;
    el.textContent = `${emoji} ${tstr} · ${dayVerdict(rain, sum)}`;
  } catch (e) { el.textContent = "מזג אוויר · הקישו לתחזית"; }
}

/* ---------- day chips ---------- */
function chipsHTML() {
  const t = todayISO();
  return `<div class="chips">` + DAYS.map(d =>
    `<button class="chip${d.date === selected.date ? " on" : ""}${d.date === t ? " today" : ""}" onclick="selectDay('${d.date}')">
      <b>${d.date.slice(8)}</b><span>יום ${d.n}</span></button>`).join("") + `</div>`;
}

/* ---------- focus (now / next / preview) ---------- */
// היעד הבא לניווט: הפעילות הקרובה הבאה עם מיקום אמיתי (לא ״איפה שאנחנו״)
function nextNavqAfter(d, timed, m0) { for (const o of timed) { if (o.m > m0) { const q = navName(o.x, d); if (q) return q; } } return null; }
function firstNavq(d, timed) { for (const o of timed) { const q = navName(o.x, d); if (q) return q; } return null; }
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
    // כפתור הניווט תמיד ליעד הבא, לא לנקודה שבה אנחנו נמצאים כרגע
    const navq = nextNavqAfter(d, timed, now) || firstNavq(d, timed);
    return { img: d.image, label: curr ? "● עכשיו" : "● מתחילים", big: head.time,
      title: icon(head) + head.title, note: head.note || "", navq,
      next: (curr ? (nxt && nxt.x) : (timed[1] && timed[1].x)) || null, nextLabel: "הבא" };
  }
  if (phase === "before" && d.date === DAYS[0].date) {
    const n = daysUntilStart();
    const head0 = timed[0] && timed[0].x || items[0];
    return { img: d.image, label: "✈︎ ליציאה", big: String(n), suf: n === 1 ? "יום" : "ימים",
      title: `יום 1 · ${d.title}`, note: d.summary || "", navq: firstNavq(d, timed),
      next: head0 || null, nextLabel: "מתחילים" };
  }
  const head = timed[0] ? timed[0].x : (items[0] || {});
  return { img: d.image, label: "התוכנית", big: head.time || `יום ${d.n}`,
    title: icon(head) + (head.title || d.title), note: head.note || d.summary || "", navq: firstNavq(d, timed),
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
      ${navBig(f.navq)}
    </div>
  </div>${nx}`;
}

/* ---------- sections ---------- */
function scheduleItem(x, i, dayDate) {
  const ic = KIND_ICON[x.kind] || "•";
  const kids = x.kids ? `<span class="badge-kids">נוער</span>` : "";
  const st = x.status && x.status !== "none" ? `<span class="sdot ${STATUS[x.status].d}"></span>` : "";
  const note = x.note ? `<p class="tl-note">${esc(x.note)}</p>` : "";
  const book = x.book ? `<div class="tl-book">ℹ︎ ${esc(x.book)}</div>` : "";
  const day = DAYS.find(dd => dd.date === dayDate);
  const acts = `<div class="tl-actions">
    <button class="chip-link primary" onclick="openDetail('${dayDate}',${i})">פרטים ותמונות ›</button>
    ${navChips(navName(x, day))}</div>`;
  return `<div class="tl-item"><div class="tl-time ${x.tsoft ? "soft" : ""}"><span class="tl-dot"></span>${esc(x.time)}</div>
    <div class="tl-body"><div class="tl-title"><span class="tl-ic">${ic}</span>${esc(x.title)}${kids}${st}</div>${note}${book}<div class="wx-slot" id="wa-${dayDate}-${i}"></div>${acts}</div></div>`;
}
function legConnector(x) {
  if (!x.leg) return "";
  return `<div class="tl-travel"><span class="tl-travel-track"></span><span class="tl-travel-txt">🚗 נסיעה · ~${esc(x.leg.km)} ק״מ · ${fmtDur(x.leg.min)}</span></div>`;
}

/* ---------- התראות מזג אוויר לכל פעילות (לפי שעה ומיקום) ---------- */
const OUTDOOR = ["hike", "boat", "cable", "kids", "activity", "sight", "view", "walk"];
const NOALERT = ["checkin", "free"];
// דירוג לפי הסתברות + כמות בפועל (מ״מ): 3=כנראה · 2=ייתכנו ממטרים · 1=סיכוי קטן
function rainLevel(pp, mm) {
  if (mm >= 1.5 || (pp >= 70 && mm >= 0.6)) return 3;
  if (pp >= 50 || mm >= 0.3) return 2;
  if (pp >= 25) return 1;
  return 0;
}
const LEVEL = {
  3: { cat: "probably", ic: "🌧️", label: "כנראה יירד גשם", tip: " — קחו מעיל", sev: "high" },
  2: { cat: "showers", ic: "🌦️", label: "ייתכנו ממטרים", tip: " — כדאי מעיל דק/שכבה", sev: "med" },
  1: { cat: "small", ic: "🌤️", label: "סיכוי קטן לגשם", tip: "", sev: "low" }
};
function dayVerdict(pp, sum) {
  if (sum >= 3 || (pp >= 70 && sum >= 1)) return "כנראה גשם";
  if (pp >= 50 || sum >= 0.5) return "ייתכנו ממטרים";
  if (pp >= 30) return "סיכוי קטן לגשם";
  return "יבש בעיקר";
}
function weatherAlert(kind, pp, mm, code, wind, time) {
  if (NOALERT.includes(kind)) return null;              // חזרה למלון / ערב חופשי — לא רלוונטי
  const storm = code >= 95, windy = wind >= 38, veryWindy = wind >= 50, outdoor = OUTDOOR.includes(kind);
  if (storm) return { sev: "high", cat: "storm", msg: `🌩️ ייתכנו רעמים בסביבות ${time}${kind === "cable" ? " — ייתכנו סגירות ברכבל" : ""}` };
  if (kind === "drive") return null;                    // נהיגה — רק סופה
  if (kind === "cable" && veryWindy) return { sev: "high", cat: "wind", msg: `💨 רוח חזקה מאוד (~${wind} קמ״ש) בסביבות ${time} — ייתכנו סגירות ברכבל` };
  const lv = rainLevel(pp, mm);
  if (lv && (outdoor || lv >= 3)) {
    const L = LEVEL[lv];
    const nums = `(${pp || 0}%${mm >= 0.1 ? ` · ~${mm < 1 ? mm.toFixed(1) : Math.round(mm)} מ״מ` : " · ללא כמות"})`;
    return { sev: L.sev, cat: L.cat, msg: `${L.ic} ${L.label} בסביבות ${time} ${nums}${L.tip}` };
  }
  if (kind === "cable" && windy) return { sev: "med", cat: "wind", msg: `💨 רוח חזקה (~${wind} קמ״ש) בסביבות ${time}` };
  return null;
}
function weatherSummary(byCat, coords) {
  const order = [["storm", "🌩️ רעמים"], ["probably", "🌧️ כנראה גשם"], ["showers", "🌦️ ייתכנו ממטרים"], ["small", "🌤️ סיכוי קטן"], ["wind", "💨 רוח"]];
  const parts = order.filter(([k]) => (byCat[k] || []).length).map(([k, lbl]) => `${lbl}: ${byCat[k].join(", ")}`);
  if (!parts.length) return "";
  const sev = ((byCat.storm || []).length || (byCat.probably || []).length) ? "high" : (byCat.showers || []).length ? "med" : "low";
  const link = coords ? ` · השוו: <a target="_blank" rel="noopener" href="${forecastUrl(coords)}">meteoblue</a> · <a target="_blank" rel="noopener" href="${weatherComUrl(coords)}">weather.com</a>` : "";
  return `<div class="wx-summary ${sev}"><b>מזג האוויר היום</b> · ${parts.join(" · ")}<span class="wx-src">מבוסס הסתברות + כמות גשם בפועל (Open-Meteo)${link}</span></div>`;
}
async function loadActivityWeather(d) {
  const items = (d.schedule || []).map((x, i) => ({ x, i, m: parseMin(x.time) })).filter(o => o.m != null);
  if (!items.length) return;
  const key = c => `${c[0].toFixed(3)},${c[1].toFixed(3)}`;
  const locs = [], locIndex = {};
  for (const o of items) { const c = o.x.coords || d.coords; o.coords = c; const k = key(c); if (!(k in locIndex)) { locIndex[k] = locs.length; locs.push(c); } o.loc = k; }
  try {
    const lat = locs.map(c => c[0]).join(","), lon = locs.map(c => c[1]).join(",");
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,precipitation,weather_code,wind_speed_10m&timezone=auto&start_date=${d.date}&end_date=${d.date}`;
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 8000);
    const w = await (await fetch(url, { signal: ctrl.signal })).json(); clearTimeout(to);
    const arr = Array.isArray(w) ? w : [w];
    const byCat = { storm: [], probably: [], showers: [], small: [], wind: [] };
    for (const o of items) {
      const res = arr[locIndex[o.loc]]; if (!res || !res.hourly) continue;
      const H = res.hourly, hr = Math.min(23, Math.round(o.m / 60));
      let idx = H.time.findIndex(t => t.endsWith(`T${pad(hr)}:00`)); if (idx < 0) idx = hr;
      const pp = (H.precipitation_probability || [])[idx] ?? 0, mm = (H.precipitation || [])[idx] ?? 0, code = (H.weather_code || [])[idx] ?? 0, wind = Math.round((H.wind_speed_10m || [])[idx] ?? 0);
      const al = weatherAlert(o.x.kind, pp, mm, code, wind, o.x.time);
      const el = document.getElementById(`wa-${d.date}-${o.i}`);
      if (el && al) el.innerHTML = `<a class="wx-alert ${al.sev}" target="_blank" rel="noopener" href="${forecastUrl(o.coords)}">${esc(al.msg)} <span class="wx-more">תחזית ›</span></a>`;
      if (al && byCat[al.cat] && !byCat[al.cat].includes(o.x.time)) byCat[al.cat].push(o.x.time);
    }
    const sumEl = document.getElementById("wxSummary");
    if (sumEl) sumEl.innerHTML = weatherSummary(byCat, d.coords);
  } catch (e) { /* אין קליטה — בלי התראות */ }
}

/* ---------- Place detail view ---------- */
function resolvePlace(item, day) {
  if (item.place && window.PLACES && PLACES[item.place]) return PLACES[item.place];
  return {
    title: item.title, sub: day.title,
    gallery: [day.image],
    about: [item.note || day.summary || ""],
    facts: [], tips: [],
    coords: item.coords, q: item.q, url: item.url, urlLabel: "עוד מידע"
  };
}
function openDetail(dayDate, idx) {
  const day = DAYS.find(d => d.date === dayDate); if (!day) return;
  const item = day.schedule[idx]; if (!item) return;
  const p = resolvePlace(item, day);
  const gallery = (p.gallery || []).filter(Boolean);
  const galleryHTML = gallery.length
    ? `<div class="dt-gallery">${gallery.map(g => `<img src="assets/${esc(g)}" alt="" loading="lazy">`).join("")}</div>`
    : `<div class="dt-noimg">${KIND_ICON[item.kind] || "📍"}</div>`;
  const q = p.navq || p.q || navName(item, day);
  const btns = `${navBig(q)}${p.url ? `<div class="dt-btns"><a class="btn-link" target="_blank" rel="noopener" href="${esc(p.url)}">🔗 ${esc(p.urlLabel || "אתר")}</a></div>` : ""}`;
  const about = (p.about || []).filter(Boolean).map(t => `<p>${esc(t)}</p>`).join("");
  const rec = (p.recommend || []).length ? `<div class="dt-rec"><div class="section-label">💡 מומלץ במקום</div><ul class="know">${p.recommend.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : "";
  const story = p.story ? `<div class="dt-story"><div class="dt-story-h">${esc(p.storyTitle || "📖 קצת רקע")}</div><p>${esc(p.story)}</p></div>` : "";
  const timing = (p.timing || []).length ? `<div class="dt-timing"><div class="section-label">⏱️ כמה זמן להקדיש</div><div class="dt-facts">${p.timing.map(f => `<div class="dt-fact"><span class="fk">${esc(f.k)}</span><span class="fv">${esc(f.v)}</span></div>`).join("")}</div></div>` : "";
  const facts = (p.facts || []).length ? `<div class="dt-facts">${p.facts.map(f => `<div class="dt-fact"><span class="fk">${esc(f.k)}</span><span class="fv">${esc(f.v)}</span></div>`).join("")}</div>` : "";
  const tips = (p.tips || []).length ? `<div class="dt-tips"><div class="section-label">טיפים</div><ul class="know">${p.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : "";
  $("#detailBody").innerHTML = `
    <div class="dt-head">
      <button class="dt-back" onclick="closeDetail()">‹ חזרה</button>
      <span class="dt-time">${esc(item.time)}</span>
    </div>
    ${galleryHTML}
    <div class="dt-content">
      <h1 class="dt-title">${esc(p.title)}</h1>
      ${p.sub ? `<p class="dt-sub">${esc(p.sub)}</p>` : ""}
      ${btns}
      <div class="dt-about">${about}</div>
      ${rec}
      ${timing}
      ${story}
      ${facts}${tips}
    </div>`;
  const el = $("#detail"); el.classList.add("open"); el.setAttribute("aria-hidden", "false");
  el.scrollTop = 0;
}
function closeDetail() { const el = $("#detail"); el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); }
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDetail(); });
function diningSection(d) {
  const din = d.dining || {}; let html = "";
  if (din.dinner) {
    const dn = din.dinner, s = STATUS[dn.status] || STATUS.none;
    const stag = dn.status && dn.status !== "none" ? `<span class="sdot ${s.d}"></span>` : "";
    const label = dn.status === "ok" ? "✓ מאושר" : dn.status === "pending" ? "● ממתין לאישור" : (dn.note || "");
    const phone = dn.phone ? `<a class="icon-btn" href="${telUrl(dn.phone)}">📞</a>` : "";
    const dq = dn.q || (dn.name ? `${dn.name}${dn.addr ? ", " + dn.addr : ""}` : null);
    html += `<div class="dinner-row"><div class="row" style="border:0;padding:0"><div class="row-main"><div class="row-title">🍽️ ${esc(dn.name)}${dn.time ? " · " + esc(dn.time) : ""}${stag}</div><p class="row-note">${esc(label)}${dn.addr ? " · " + esc(dn.addr) : ""}</p></div><div class="row-side">${navMini(dq)}${phone}</div></div></div>`;
  }
  if ((din.lunch || []).length) {
    html += `<div class="section-label" style="margin-top:6px">אופציות לצהריים</div>`;
    html += din.lunch.map(l => `<div class="row"><div class="row-ic">🍝</div><div class="row-main"><div class="row-title">${esc(l.name)}</div><p class="row-note">${esc(l.note || "")}</p></div>${navName(l) ? `<div class="row-side">${navMini(navName(l))}</div>` : ""}</div>`).join("");
  }
  return html ? `<div class="section"><div class="section-label">איפה לאכול</div>${html}</div>` : "";
}
function metaChips(parts) {
  const p = parts.filter(Boolean);
  return p.length ? `<p class="row-meta">${p.join(" · ")}</p>` : "";
}
function stopsSection(d) {
  if (!(d.stops || []).length) return "";
  return `<div class="section"><div class="section-label">שווה עצירה בדרך</div>` + d.stops.map(s => {
    const meta = metaChips([s.when ? `🕐 ${esc(s.when)}` : "", s.dur ? `⏱️ ${esc(s.dur)}` : "", s.adds ? `🚗 ${esc(s.adds)}` : ""]);
    return `<div class="row"><div class="row-ic">${s.icon || "📍"}</div><div class="row-main"><div class="row-title">${esc(s.name)}</div><p class="row-note">${esc(s.note || "")}</p>${meta}</div>${navName(s) ? `<div class="row-side">${navMini(navName(s))}</div>` : ""}</div>`;
  }).join("") + `</div>`;
}
function knowSection(d) {
  if (!(d.know || []).length) return "";
  return `<div class="section"><div class="section-label">טוב לדעת</div><ul class="know">${d.know.map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>`;
}
function rainRowsHTML(d) {
  return d.rainPlan.map(s => {
    const meta = metaChips([s.replaces ? `↔︎ במקום ${esc(s.replaces)}` : "", s.hours ? `🕐 ${esc(s.hours)}` : ""]);
    return `<div class="row"><div class="row-ic rain-ic">${s.icon || "☂️"}</div><div class="row-main"><div class="row-title">${esc(s.name)}</div><p class="row-note">${esc(s.note || "")}</p>${meta}</div>${navName(s) ? `<div class="row-side">${navMini(navName(s))}</div>` : ""}</div>`;
  }).join("");
}
function rainSection(d) {
  if (!(d.rainPlan || []).length) return "";
  return `<div class="section rain-sec"><div class="section-label">☔ תוכנית לגשם · חלופות (רק אם יורד)</div>${rainRowsHTML(d)}</div>`;
}
function checklist(items) { return `<ul class="checklist">${items.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`; }
function packSection(d) {
  if (!d.pack) return "";
  const main = Array.isArray(d.pack) ? checklist(d.pack) : `<p class="muted-p">${esc(d.pack)}</p>`;
  const kids = (d.packKids || []).length ? `<div class="section-label" style="margin-top:14px">להורים עם ילדים</div>${checklist(d.packKids)}` : "";
  return `<div class="section"><div class="section-label">מה להביא</div>${main}${kids}</div>`;
}

/* ---------- Today ---------- */
function renderToday() {
  const d = selected;
  const tent = d.tentative ? `<div class="notice">✏️ יום בתכנון ראשוני — ניתן לעדכן</div>` : "";
  $("#today").innerHTML = `${chipsHTML()}<div class="wrap">
    <div class="daymeta"><span class="eyebrow">יום ${d.n} · ${esc(fmtDate(d.date))}</span><a class="wx" id="wx" target="_blank" rel="noopener" href="${forecastUrl(d.coords)}">מזג אוויר…</a></div>
    ${focusHTML(d)}
    <div id="wxSummary"></div>
    ${tent}
    <div class="section"><div class="section-label">כל היום · לפי שעות</div><div class="timeline">${(d.schedule || []).map((x, i) => legConnector(x) + scheduleItem(x, i, d.date)).join("")}</div></div>
    ${diningSection(d)}
    ${stopsSection(d)}
    ${knowSection(d)}
    ${packSection(d)}
    <div class="section"><div class="tl-actions"><a class="chip-link" target="_blank" rel="noopener" href="${voucherPath(d.date)}">🎟 שובר היום</a></div></div>
    ${rainSection(d)}
  </div>`;
  loadWeather(d);
  loadActivityWeather(d);
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
  const hotels = TRIP.lodging.map(h => `<div class="hotel"><b>${esc(h.name)}</b><p class="row-note">${esc(h.nights)} · ${esc(h.city)} · ${esc(h.addr)}</p><div class="tl-actions">${navChips(`${h.name}, ${h.addr}`)}<a class="chip-link" href="${telUrl(h.phone)}">📞 ${esc(h.phone)}</a></div></div>`).join("");
  const restos = DAYS.filter(d => d.dining && d.dining.dinner && d.dining.dinner.phone).map(d => {
    const dn = d.dining.dinner, s = STATUS[dn.status] || STATUS.none;
    const tag = dn.status && dn.status !== "none" ? `<span class="sdot ${s.d}"></span>` : "";
    const rq = dn.q || `${dn.name}${dn.addr ? ", " + dn.addr : ""}`;
    return `<div class="row"><div class="row-main"><div class="row-title">${esc(dn.name)}${tag}</div><p class="row-note">יום ${d.n} · ${esc(shortDate(d.date))}${dn.time ? " · " + esc(dn.time) : ""} · ${esc(s.t || dn.note || "")}</p></div><div class="row-side"><a class="icon-btn" href="${telUrl(dn.phone)}">📞</a>${navMini(rq)}</div></div>`;
  }).join("");
  const waLink = TRIP.whatsappGroup;
  const waBtn = waLink
    ? `<a class="emergency wa-btn" target="_blank" rel="noopener" href="${esc(waLink)}">💬 פתיחת קבוצת הוואטסאפ</a>`
    : `<a class="emergency wa-btn" target="_blank" rel="noopener" href="https://wa.me/">💬 פתיחת וואטסאפ</a>`;
  $("#infoContent").innerHTML = `
    <div class="info-sec"><div class="section-label">📍 מיקום הקבוצה (Live)</div>
      ${waBtn}
      <ol class="wa-steps">
        <li>נכנסים לקבוצת הוואטסאפ של הטיול.</li>
        <li>מקישים על 📎 (או +) → <b>מיקום</b> → <b>שיתוף מיקום חי</b>.</li>
        <li>בוחרים משך — 15 דק׳ / שעה / 8 שעות — וכולם רואים אתכם על מפה אחת.</li>
      </ol>
      <p class="subnote">רץ ברקע, חוסך בטרייה, וכל אחד שולט מתי לעצור 🔒</p></div>
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
