/* ============================================================
   נפלאות הדולומיטים · יורוטריפ 2026
   15–22 ביולי · 10 מבוגרים + 7 ילדים
   ------------------------------------------------------------
   מבנה קריא לעריכה. כל יום = אובייקט אחד.
   schedule[]  לוח זמנים עם שעות (time). שעות המסומנות "משוער" ניתנות לעדכון.
   dining      אופציות לאכול (lunch = מספר אופציות, dinner = ההזמנה)
   stops[]     שווה עצירה: תצפית 👀 · קפה ☕ · גלידה 🍦
   know[]      מה חשוב לדעת
   status:     ok = ✓ מאושר · pending = ● ממתין · none
   q:          טקסט לחיפוש ב-Google Maps (כשאין קואורדינטות)
   ============================================================ */
window.TRIP = {
  title: "נפלאות הדולומיטים",
  subtitle: "יורוטריפ 2026",
  dates: "15–22 ביולי 2026",
  adults: 10, kids: 7, emergency: "112",
  lodging: [
    { name: "Ciasa de Munt Lifestyle Living", city: "קורוורה", nights: "15–19 ביולי",
      addr: "Str. Rütort 3, Corvara in Badia (BZ)", phone: "+39 0471 836213", coords: [46.5506, 11.8730] },
    { name: "Hotel Villa Argentina", city: "קורטינה · Pocol", nights: "19–22 ביולי",
      addr: "Loc. Pocol, Cortina d'Ampezzo (BL)", phone: "+39 0436 5641", coords: [46.5169, 12.1160] }
  ]
};

window.TRIP_DATA = [
  /* ===== יום 1 · רביעי 15.7 ===== */
  {
    date: "2026-07-15", day: "רביעי", n: 1,
    title: "מסע אל הדולומיטים", place: "גנואה → קורוורה", base: "קורוורה",
    image: "arrival.jpg", coords: [46.5506, 11.8730], hotel: 0,
    summary: "יום נסיעה · 485 ק״מ, רובו באוטוסטרדה, עם עצירת צהריים קסומה",
    schedule: [
      { time: "08:00", kind: "boat", title: "ארוחת בוקר וירידה בנמל גנואה", note: "עיר הולדתו של קולומבוס · יורדים מהאונייה לרכבים", tsoft: true },
      { time: "09:00", kind: "drive", title: "יציאה — חלק א׳: גנואה → בורגטו", note: "270 ק״מ · ~2:43", tsoft: true },
      { time: "12:30", kind: "food", title: "צהריים בבורגטו סול מינצ׳ו", note: "מסעדת San Marco, ~100 מ׳ מהחניה · כ־1–1.5 ש׳", q: "Ristorante San Marco, Borghetto sul Mincio", book: "רוני מטפל בהזמנה — לתזכר שבוע מראש", tsoft: true },
      { time: "14:00", kind: "drive", title: "חלק ב׳: בורגטו → קורוורה", note: "252 ק״מ · ~2:55 · נופי צפון איטליה", tsoft: true },
      { time: "17:30", kind: "checkin", title: "צ׳ק־אין בקורוורה", note: "Ciasa de Munt · 4 לילות", coords: [46.5506, 11.8730], tsoft: true },
      { time: "ערב", kind: "free", title: "ארוחת ערב חופשית / במלון", note: "יום ארוך — ערב רגוע להתאקלם" }
    ],
    dining: {
      lunch: [{ name: "San Marco, בורגטו", note: "עצירת הצהריים המתוכננת על נהר מינצ׳ו", q: "Ristorante San Marco, Borghetto sul Mincio" }],
      dinner: { name: "חופשי / במלון", status: "none" }
    },
    stops: [
      { icon: "📸", name: "בורגטו סול מינצ׳ו", note: "אחת העיירות היפות באיטליה — טחנות מים וגשר ויסקונטי מהמאה ה־14. שווה טיול קצר בסמטאות אחרי הצהריים.", q: "Borghetto sul Mincio" }
    ],
    know: [
      "יום נסיעה ארוך — למלא דלק לפני עליית ההרים ולתכנן עצירות קצרות.",
      "השעות משוערות ותלויות בשעת הירידה מהאונייה.",
      "דרכונים וחטיפים לדרך בהישג יד."
    ],
    pack: ["דרכונים", "מטענים לרכב", "מים וחטיפים לדרך"]
  },

  /* ===== יום 2 · חמישי 16.7 ===== */
  {
    date: "2026-07-16", day: "חמישי", n: 2,
    title: "רכבל Col Alt + פארק חבלים", place: "קורוורה", base: "קורוורה",
    image: "col-alt.jpg", coords: [46.5486, 11.8746], hotel: 0, difficulty: "קל",
    summary: "בוקר רגוע ברכבל מעל הכפר · אחה״צ אדרנלין לנוער",
    schedule: [
      { time: "09:30", kind: "cable", title: "רכבל Col Alt ממרכז הכפר", note: "עולים לאחו פתוח ותצפית על גוש הסֶלָה · כרטיס במקום · הליכה נינוחה", coords: [46.5486, 11.8746], place: "colalt" },
      { time: "12:30", kind: "food", title: "צהריים ברפוג׳ו בהר", note: "Rifugio Col Alt בתחנה העליונה או Piz Boé Alpine Lounge (נוף לסאסונגר)", q: "Rifugio Col Alt Corvara" },
      { time: "14:00", kind: "kids", title: "פארק חבלים · Colfosco", note: "אומגות, גשרים מתנדנדים ומכשולים בין העצים · פתוח 10:00–19:00 · ~10 דק׳ מהכפר", coords: [46.5583, 11.8869], book: "מומלץ להזמין כרטיסים מראש בקיץ", place: "colfosco", leg: { from: "קורוורה", km: 5, min: 10 }, kids: true },
      { time: "19:30", kind: "food", title: "ארוחת ערב · Adlerkeller", note: "Str. Col Alt 24 · ✓ מאושר", coords: [46.5490, 11.8770], status: "ok" }
    ],
    dining: {
      lunch: [
        { name: "Rifugio Col Alt", note: "בתחנה העליונה של הרכבל — נוח ועם נוף", q: "Rifugio Col Alt Corvara" },
        { name: "Piz Boé Alpine Lounge", note: "2,200 מ׳, חלונות ענק לסאסונגר (מומלץ להזמין)", q: "Piz Boe Alpine Lounge Corvara" }
      ],
      dinner: { name: "Adlerkeller", time: "19:30", status: "ok",
        addr: "Str. Col Alt 24, Corvara", phone: "+39 329 712 7354", coords: [46.5490, 11.8770] }
    },
    stops: [
      { icon: "🚵", name: "אופציה: פארקי Movimënt", note: "מעל 2,000 מ׳ — מסלולי אופניים, קיר טיפוס ומשחקי איזון. מבוגרים €38 · נוער €30.30. פתוח 08:30–17:30.", q: "Moviment Piz La Ila Alta Badia", kids: true },
      { icon: "🍦", name: "גלידה: Table Café / Da Ricky", note: "שתי כתובות אהובות בקורוורה לגלידה ומאפים ביתיים.", q: "Table Cafe Patisserie Gelateria Corvara" }
    ],
    know: [
      "רכבלים באזור פועלים בערך 08:30–16:45 — לתכנן לפי זה.",
      "פארק החבלים: נעליים סגורות נוחות, וכדאי להזמין מראש בקיץ.",
      "שתי אופציות לאחה״צ (חבלים / Movimënt) — לבחור לפי מצב הרוח של הילדים."
    ],
    pack: ["נעליים סגורות", "שכבה חמה לרכבל", "מים וכובע"]
  },

  /* ===== יום 3 · שישי 17.7 ===== */
  {
    date: "2026-07-17", day: "שישי", n: 3,
    title: "אגם ברייס + מגלשת סן קנדידו", place: "קורוורה → ברייס → סן קנדידו", base: "קורוורה",
    image: "braies.jpg", gallery: ["funbob.jpg"], coords: [46.6947, 12.0855], hotel: 0, difficulty: "קל",
    summary: "פנינת הטורקיז של הדולומיטים בבוקר · אקשן לנוער אחה״צ",
    schedule: [
      { time: "09:00", kind: "drive", title: "יציאה מהמלון", note: "יוצאים לכיוון אגם ברייס", coords: [46.5506, 11.8730], place: "ciasademunt" },
      { time: "10:15", kind: "boat", title: "אגם ברייס", note: "10:15–12:15 · שיט בסירות (אם התור סביר) + זמן להליכה קצרה סביב האגם למי שרוצה", coords: [46.6947, 12.0855], place: "braies", leg: { from: "המלון", km: 48, min: 65 } },
      { time: "12:45", kind: "kids", title: "FunBob בסן קנדידו", note: "רכבל Haunold ומגלשת הרים מהירה על מסילת מתכת · ירצו פעמיים!", coords: [46.7326, 12.2789], place: "funbob", leg: { from: "ברייס", km: 30, min: 35 }, kids: true },
      { time: "14:00", kind: "food", title: "ארוחת צהריים", note: "בסן קנדידו · מסעדות ובתי קפה במדרחוב", coords: [46.7326, 12.2789], place: "sancandido" },
      { time: "15:15", kind: "sight", title: "סיבוב קצר במרכז סן קנדידו", note: "מדרחוב צבעוני, כנסיית Stiftskirche והרים ברקע", coords: [46.7326, 12.2789], place: "sancandido" },
      { time: "16:00", kind: "food", title: "לואקר — קפה, קינוח וקניות", note: "בית הקפה והחנות של לואקר · כיף גדול לילדים 🍫", q: "Loacker Moserhof Café Heinfels", place: "loacker", leg: { from: "סן קנדידו", km: 10, min: 12 } },
      { time: "18:00", kind: "checkin", title: "חזרה למלון", note: "18:00–18:30 · זמן להתרענן", coords: [46.5506, 11.8730], place: "ciasademunt", leg: { from: "לואקר", km: 78, min: 85 }, tsoft: true }
    ],
    dining: {
      lunch: [
        { name: "Restaurant Pizzeria Haunold", note: "סן קנדידו · פיצה ומטבח מקומי", q: "Restaurant Pizzeria Haunold San Candido" },
        { name: "Central Theater Café", note: "סן קנדידו · בית קפה נעים במרכז", q: "Central Theater Cafe San Candido Innichen" }
      ]
    },
    stops: [
      { icon: "⛪", name: "כנסיית Stiftskirche", note: "כנסייה רומנסקית מרשימה משנת 1143 במרכז סן קנדידו.", q: "Stiftskirche San Candido" },
      { icon: "🍦", name: "גלידה במדרחוב סן קנדידו", note: "כמה גלאטריות ביתיות באזור ההולכי־רגל — עצירה מושלמת אחרי המגלשה.", q: "gelato San Candido Innichen" }
    ],
    know: [
      "⛽ מומלץ לתדלק לפני היציאה (בקורוורה) או בברוניקו בדרך — בעמקים יש פחות תחנות דלק.",
      "⚠️ אגם ברייס 2026: העמק סגור 09:00–16:00 (1.7–15.9). חובה הזמנת חניה מראש ב-prags.bz, או להגיע לפני 09:00.",
      "שייט הסירות בתור בלבד (אי אפשר להזמין) — ~20€ לאדם בסירה משותפת, ותורים של 1–2 ש׳ בשיא. להגיע מוקדם!",
      "רכבל Haunold ל-Funbob — אין צורך להזמין."
    ],
    pack: ["נעלי הליכה נוחות", "בקבוק מים", "כובע + משקפי שמש + קרם הגנה", "סווטשירט / שכבה קלה", "מטען נייד"],
    packKids: ["בגד ים", "בגדים להחלפה", "מגבת קטנה", "שקית לבגדים רטובים", "חטיף קטן לדרך"]
  },

  /* ===== יום 4 · שבת 18.7 ===== */
  {
    date: "2026-07-18", day: "שבת", n: 4,
    title: "Seceda + Alpe di Siusi", place: "קורוורה → אורטיזיי", base: "קורוורה",
    image: "corvara.jpg", coords: [46.5772, 11.6740], hotel: 0, difficulty: "קל",
    summary: "רכס המצוקים המצולם בדולומיטים + האחו האלפיני הגדול באירופה",
    schedule: [
      { time: "08:30", kind: "drive", title: "יציאה דרך מעבר Gardena", note: "~40 דק׳ · כביש מתפתל ומרהיב · עצירת תצפית בדרך", tsoft: true },
      { time: "09:30", kind: "cable", title: "רכבל Seceda (מאורטיזיי)", note: "הליכת רכס קצרה מול המצוקים המחודדים — הנוף המצולם בדולומיטים", coords: [46.5772, 11.6740], book: "אפשר להזמין כרטיס מראש", place: "seceda", leg: { from: "קורוורה", km: 28, min: 40 } },
      { time: "12:30", kind: "food", title: "צהריים ברפוג׳ו בהר", note: "Baita Curona (Seceda) או Gostner Schwaige (Alpe di Siusi)", q: "Baita Curona Seceda", book: "רפוג׳ואים מתמלאים ביולי — להזמין מראש" },
      { time: "14:00", kind: "activity", title: "Alpe di Siusi · Seiser Alm", note: "האחו האלפיני הגדול באירופה — כרי דשא, מרמיטות ופסגות מסביב", coords: [46.5416, 11.6209], place: "alpedisiusi" },
      { time: "16:30", kind: "kids", title: "אופציה: אורטיזיי — E-Bike / גילוף עץ", note: "אופני הרים חשמליים בתחנה העליונה, וגלריות גילוף עץ בעיירה", coords: [46.5766, 11.6710], kids: true },
      { time: "19:30", kind: "food", title: "ארוחת ערב · Ristorante Zirm", note: "Str. Col Alt 95 · ✓ מאושר (עם אנצו)", coords: [46.5470, 11.8790], leg: { from: "אורטיזיי", km: 28, min: 40 }, status: "ok" }
    ],
    dining: {
      lunch: [
        { name: "Baita Curona (Seceda)", note: "מגש הבית: גבינות, שפק וקמינוורצן מהחווה של המשפחה", q: "Baita Curona Seceda" },
        { name: "Gostner Schwaige (Alpe di Siusi)", note: "מפורסמת על מרק החציר, גבינות מקומיות ושטרודל תפוחים", q: "Gostner Schwaige Alpe di Siusi" }
      ],
      dinner: { name: "Ristorante Zirm", time: "19:30", status: "ok", note: "עם אנצו",
        addr: "Str. Col Alt 95, Corvara", phone: "+39 0471 833894", coords: [46.5470, 11.8790] }
    },
    stops: [
      { icon: "👀", name: "תצפית Ju de Frara / Dantercepies", note: "עצירת תצפית קלאסית במעבר Gardena — Sella, Sassolungo ופסגות Cir.", q: "Ju de Frara Passo Gardena" },
      { icon: "🎨", name: "גלריית גילוף עץ ART 52", note: "אורטיזיי — מסורת בת מאות שנים · כניסה חופשית 09:00–22:00.", q: "ART 52 Ortisei" },
      { icon: "🍦", name: "Pasticceria Langgartner", note: "אורטיזיי — גלידה, אפוגאטו, שטרודל ומאפים.", q: "Pasticceria Langgartner Ortisei" }
    ],
    know: [
      "⛽ תדלוק: כדאי למלא דלק בקורוורה לפני היציאה — במעברי ההרים יש מעט תחנות.",
      "יום עם שני רכבלים (Seceda ואז Alpe di Siusi) — לתכנן ולצאת בזמן.",
      "רפוג׳ואים לצהריים מתמלאים ביולי — כדאי להזמין מראש.",
      "המעבר Gardena מתפתל — למי שרגיש לסחרחורת."
    ],
    pack: ["נעליים נוחות", "שכבה חמה", "משקפי שמש וקרם הגנה"]
  },

  /* ===== יום 5 · ראשון 19.7 ===== */
  {
    date: "2026-07-19", day: "ראשון", n: 5,
    title: "מעבר פלצרגו + רכבל לאגאזוי", place: "קורוורה → קורטינה", base: "קורטינה",
    image: "lagazuoi.jpg", coords: [46.5192, 12.0093], hotel: 1, difficulty: "קל–בינוני",
    summary: "מעבר מלון לקורטינה · תצפית 360° ומנהרות מלחמת העולם הראשונה",
    schedule: [
      { time: "09:00", kind: "checkin", title: "צ׳ק־אאוט מקורוורה", note: "לארוז הכל — עוברים מלון", tsoft: true },
      { time: "09:30", kind: "drive", title: "נסיעה דרך מעבר פלצרגו", note: "31.5 ק״מ · ~46 דק׳ · המעבר בגובה 2,105 מ׳", tsoft: true },
      { time: "10:00", kind: "cable", title: "רכבל Lagazuoi", note: "ל-Piccolo Lagazuoi · תצפית 360°, מנהרות ועמדות מהמלחמה · כרטיס במקום", coords: [46.5187, 12.0000], book: "שכבה חמה — קר למעלה גם בקיץ!", place: "lagazuoi", leg: { from: "קורוורה", km: 32, min: 46 } },
      { time: "13:00", kind: "food", title: "צהריים ב-Rifugio Lagazuoi", note: "אחת מבקתות ההרים היפות בדולומיטים · אוכל איטלקי־אלפיני", q: "Rifugio Lagazuoi" },
      { time: "15:00", kind: "activity", title: "עיקוף אגם מיזורינה", note: "טיילת סביב אגם פוטוגני (~1 ש׳) · השתקפויות מושלמות", coords: [46.5817, 12.2536], place: "misurina", leg: { from: "לאגאזוי", km: 35, min: 50 } },
      { time: "16:30", kind: "checkin", title: "צ׳ק־אין בקורטינה", note: "Hotel Villa Argentina, Pocol", coords: [46.5169, 12.1160], leg: { from: "מיזורינה", km: 15, min: 25 }, tsoft: true },
      { time: "ערב", kind: "food", title: "ארוחת ערב · 5 Torri", note: "Largo delle Poste 13 · ● ממתין לאישור", coords: [46.5405, 12.1357], status: "pending" }
    ],
    dining: {
      lunch: [{ name: "Rifugio Lagazuoi", note: "בתחנה העליונה — נוף ואוכל הרים", q: "Rifugio Lagazuoi" }],
      dinner: { name: "5 Torri Ristorante Pizzeria", status: "pending", note: "ממתין לאישור",
        addr: "Largo delle Poste 13, Cortina", phone: "+39 0436 866301", coords: [46.5405, 12.1357] }
    },
    stops: [
      { icon: "👀", name: "עצירת תצפית במעבר פלצרגו", note: "אחד ממעברי ההרים היפים בדולומיטים (2,105 מ׳) — עוצרים לצילום.", q: "Passo Falzarego" },
      { icon: "💧", name: "אגם Limides (הליכה קצרה)", note: "למי שיש זמן — אגם קטן עם השתקפות פסגת Tofana, ממש ליד המעבר.", q: "Lago di Limides Falzarego" }
    ],
    know: [
      "יום מעבר בין מלונות — לארוז את החדר לפני היציאה.",
      "קר מאוד למעלה ברכבל גם בקיץ — שכבה חמה חובה.",
      "לאשר סופית את ההזמנה ב-5 Torri (ממתין)."
    ],
    pack: ["שכבה חמה", "נעליים נוחות", "מצלמה — יום של תצפיות"]
  },

  /* ===== יום 6 · שני 20.7 ===== */
  {
    date: "2026-07-20", day: "שני", n: 6,
    title: "טרק אגם סוראפיס", place: "קורטינה · Passo Tre Croci", base: "קורטינה",
    image: "sorapis.jpg", coords: [46.5289, 12.2178], hotel: 1, difficulty: "בינונית פלוס",
    summary: "האתגר הגדול — אגם בצבע תכלת־חלב מהפנט, מוסתר בין צוקים",
    schedule: [
      { time: "07:30", kind: "drive", title: "יציאה מוקדמת", note: "לחניית הפתיחה ב-Passo Tre Croci · המסלול מתמלא", coords: [46.5822, 12.1897], leg: { from: "קורטינה", km: 9, min: 15 }, tsoft: true },
      { time: "08:00", kind: "hike", title: "תחילת טרק Lago di Sorapis", note: "~12 ק״מ הלוך־חזור · 4–5 שעות · קטעים צרים עם כבלי מתכת לאחיזה", coords: [46.5822, 12.1897] },
      { time: "13:00", kind: "food", title: "צהריים ליד האגם", note: "מהתרמיל, או ב-Rifugio Vandelli ליד האגם", q: "Rifugio Vandelli Sorapis" },
      { time: "16:00", kind: "hike", title: "חזרה לחניה", note: "אותו מסלול חזרה" },
      { time: "19:30", kind: "food", title: "ארוחת ערב · Chalet Tofane", note: "Località Lacedel 1 · ✓ מאושר (עם פביו)", coords: [46.5330, 12.1170], status: "ok" }
    ],
    dining: {
      lunch: [{ name: "Rifugio Vandelli", note: "בקתה ליד האגם — או פשוט כריכים מהתרמיל בנוף", q: "Rifugio Vandelli Sorapis" }],
      dinner: { name: "Chalet Tofane — Restaurant · Pizzeria · Bar", time: "19:30", status: "ok", note: "עם פביו",
        addr: "Località Lacedel 1, Cortina", phone: "+39 0436 863026", coords: [46.5330, 12.1170] }
    },
    stops: [
      { icon: "🚡", name: "אלטרנטיבה למבוגרים: Freccia nel Cielo", note: "למי שמעדיף יום רגוע — רכבל מקורטינה לתצפיות, בלי הטרק המאתגר.", q: "Freccia nel Cielo Cortina" },
      { icon: "🍦", name: "Gelateria Al Soler", note: "בקורטינה — נחשבת מהגלידות הכי טובות בדולומיטים (טעמי עונה). מגיע אחרי הטרק!", q: "Gelateria Al Soler Cortina" }
    ],
    know: [
      "המסלול מאתגר — קטעים צרים עם כבלי מתכת. לא מומלץ למי שסובל מגובה/סחרחורת.",
      "לצאת מוקדם, לקחת הרבה מים לכל הקבוצה, כובע ונעליים טובות.",
      "מבוגרים שלא רוצים את הטרק — אלטרנטיבת Freccia nel Cielo."
    ],
    pack: ["נעליים לטרק", "הרבה מים", "כובע", "חטיפים", "קרם הגנה"]
  },

  /* ===== יום 7 · שלישי 21.7 · תכנון ראשוני ===== */
  {
    date: "2026-07-21", day: "שלישי", n: 7,
    title: "טרה צ׳ימה די לאוורדו", place: "קורטינה · Tre Cime", base: "קורטינה",
    image: "tre-cime.jpg", coords: [46.6186, 12.3050], hotel: 1, difficulty: "קל–בינוני", tentative: true,
    summary: "המסלול המעגלי המפורסם ביותר בדולומיטים — שלוש הפסגות",
    schedule: [
      { time: "08:00", kind: "drive", title: "יציאה דרך מיזורינה", note: "כביש אגרה לרפוג׳ו אאורונצו · שער האגרה צפונית לאגם Antorno", tsoft: true },
      { time: "09:00", kind: "hike", title: "מסלול מעגלי סביב טרה צ׳ימה", note: "~10 ק״מ · 3–4 שעות · קל–בינוני · רפוג׳ואים בדרך", coords: [46.6186, 12.3050], place: "trecime", leg: { from: "קורטינה", km: 25, min: 40 } },
      { time: "12:30", kind: "food", title: "צהריים ב-Rifugio Locatelli", note: "הבקתה עם הנוף הקלאסי לשלוש הפסגות", q: "Rifugio Locatelli Tre Cime" },
      { time: "ערב", kind: "food", title: "ארוחת ערב", note: "לעדכון", status: "none" }
    ],
    dining: {
      lunch: [
        { name: "Rifugio Locatelli (Dreizinnenhütte)", note: "הנוף הכי מפורסם לטרה צ׳ימה", q: "Rifugio Locatelli Tre Cime" },
        { name: "Rifugio Lavaredo", note: "קרוב לרפוג׳ו אאורונצו — עצירה נוחה בתחילת המסלול", q: "Rifugio Lavaredo" }
      ],
      dinner: { name: "לעדכון", status: "none", note: "טרם נקבע" }
    },
    stops: [
      { icon: "💧", name: "אגם מיזורינה", note: "בדרך — אגם אלפיני פוטוגני עם השתקפויות. שווה עצירה קצרה.", q: "Lago di Misurina" }
    ],
    know: [
      "✏️ יום בתכנון ראשוני — ניתן לעדכן.",
      "⚠️ כביש האגרה לרפוג׳ו אאורונצו: חובה הזמנה מראש (slot ל-12 ש׳) באתר auronzo.info · ~€40 לרכב. להזמין מוקדם — מתמלא.",
      "להגיע מוקדם — החניה (700 מקום) מתמלאת בשיא."
    ],
    pack: ["נעליים נוחות", "שכבה חמה", "מים וחטיפים"]
  },

  /* ===== יום 8 · רביעי 22.7 · תכנון ראשוני ===== */
  {
    date: "2026-07-22", day: "רביעי", n: 8,
    title: "פרידה מהדולומיטים · ונציה", place: "קורטינה → ונציה", base: "בדרך הביתה",
    image: "venice.jpg", coords: [45.4408, 12.3155], hotel: null, tentative: true,
    summary: "צ׳ק־אאוט ונסיעה חזרה · עצירה בעיר התעלות",
    schedule: [
      { time: "09:00", kind: "checkin", title: "צ׳ק־אאוט מהמלון", note: "לארוז הכל · דרכונים במקום נגיש", tsoft: true },
      { time: "09:30", kind: "drive", title: "נסיעה לונציה", note: "~162 ק״מ · ~2 שעות", tsoft: true },
      { time: "12:00", kind: "sight", title: "ונציה", note: "כיכר סן מרקו, גשר הריאלטו וסמטאות התעלות", coords: [45.4342, 12.3388], place: "venice", leg: { from: "קורטינה", km: 162, min: 120 }, tsoft: true },
      { time: "אחה״צ", kind: "drive", title: "המשך המסע חזרה", note: "לבדוק שעת הגעה נדרשת ליעד הסופי" }
    ],
    dining: {
      lunch: [{ name: "בקארו / טרטוריה בוונציה", note: "צ׳יקטי (טפאס ונציאני) ליד ריאלטו", q: "bacaro cicchetti Rialto Venice" }],
      dinner: { name: "לעדכון", status: "none", note: "טרם נקבע" }
    },
    stops: [
      { icon: "🍦", name: "גלידה בוונציה", note: "עצירת גלידה בסמטאות לפני המשך הדרך.", q: "gelato Venice San Marco" }
    ],
    know: [
      "✏️ יום בתכנון ראשוני — ניתן לעדכן.",
      "⛽ תדלוק: נסיעה ארוכה — למלא דלק לפני היציאה מקורטינה או בתחנת אוטוסטרדה בדרך.",
      "ברכב לוונציה: החניה בפריפריה (Tronchetto / Piazzale Roma) — העיר להולכי רגל בלבד.",
      "לבדוק שעת הגעה נדרשת ליעד הסופי / לטיסה."
    ],
    pack: ["לארוז הכל", "דרכונים", "מים ליום החם"]
  }
];
