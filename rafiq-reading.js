/* ============================================================
   رفيق المسلم — خطة القراءة السنوية ودرجاتها
   ------------------------------------------------------------
   - رياض الصالحين، قصص الأنبياء، السيرة النبوية: ورد يومي محدد
     ومقسّم على مدار السنة، ولكل كتاب درجاته الخاصة.
   - ورد الختمة: يقرأ خطة الختمة من المصحف (khatmaPlan) ويحسب
     صفحات اليوم ويمنح درجاته.
   - كل الدرجات تُضاف إلى S فتُحسب تلقائيًا في:
     عداد الرئيسية + إجمالي النقاط + الإحصائيات + التقرير.
   ============================================================ */
(function () {
  'use strict';

  var LS_KEY = 'rfq_reading_plan_v2';
  var DAY = 864e5;
  var KH_PAGES = 604;
  var KH_POINTS = 50;
  var YEAR_DAYS = 365;

  var BOOKS = [
    { id: 'riyad',  label: 'رياض الصالحين', icon: '📚', total: 372, cycle: 365, points: 30, unit: 'باب', open: 'openRiyadApp',  color: '#2dd4bf' },
    { id: 'qasas',  label: 'قصص الأنبياء',  icon: '📕', total: 84,  cycle: 84,  points: 20, unit: 'باب', open: 'openQasasApp',  color: '#f59e0b' },
    { id: 'seerah', label: 'السيرة النبوية', icon: '🕌', total: 31,  cycle: 31,  points: 25, unit: 'فصل', open: 'openSeerahApp', color: '#a78bfa' }
  ];

  var state = loadState();

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (raw && raw.version === 2 && raw.books) return raw;
    } catch (e) {}
    return { version: 2, books: {}, khatma: { done: {} } };
  }
  function saveState() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function ensureBook(id) {
    if (!state.books[id]) state.books[id] = { start: todayStr(), done: {} };
    if (!state.books[id].done) state.books[id].done = {};
    return state.books[id];
  }
  BOOKS.forEach(function (b) { ensureBook(b.id); });
  if (!state.khatma) state.khatma = { done: {} };
  if (!state.khatma.done) state.khatma.done = {};
  saveState();

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function toast(msg) {
    if (typeof window.athToast === 'function') { try { window.athToast(msg, false); return; } catch (e) {} }
    if (typeof window.showToast === 'function') { try { window.showToast(msg); return; } catch (e) {} }
    var el = document.getElementById('rfqRpToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rfqRpToast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  /* ---------- الحسابات ---------- */
  function dayIndexFor(book, dateStr) {
    var st = ensureBook(book.id);
    var a = new Date(st.start + 'T00:00:00');
    var b = new Date(dateStr + 'T00:00:00');
    var diff = Math.round((b - a) / DAY);
    return diff > 0 ? diff : 0;
  }
  function section(book, idx) {
    if (book.id === 'riyad') {
      var from = Math.floor((idx % YEAR_DAYS) * book.total / YEAR_DAYS) + 1;
      var to = Math.max(from, Math.floor(((idx % YEAR_DAYS) + 1) * book.total / YEAR_DAYS));
      return { from: from, to: to, cycle: YEAR_DAYS, pos: idx % YEAR_DAYS };
    }
    var pos = idx % book.cycle;
    return { from: pos + 1, to: pos + 1, cycle: book.cycle, pos: pos };
  }
  function bookProgress(book) {
    var st = ensureBook(book.id);
    var doneCount = Object.keys(st.done).length;
    var idx = dayIndexFor(book, todayStr());
    var cycles = book.id === 'riyad' ? 1 : Math.floor(idx / book.cycle) + 1;
    return { doneCount: doneCount, idx: idx, cycles: cycles };
  }
  function khatmaPlan() {
    try { return JSON.parse(localStorage.getItem('khatmaPlan') || 'null'); } catch (e) { return null; }
  }
  function khatmaInfo() {
    var plan = khatmaPlan();
    if (!plan) return null;
    var days = parseInt(plan.days, 10) || 30;
    var ppd = parseInt(plan.pagesPerDay, 10) || Math.ceil(KH_PAGES / days);
    var start = new Date((plan.startDate || todayStr()) + 'T00:00:00');
    var now = new Date(todayStr() + 'T00:00:00');
    var passed = Math.max(0, Math.floor((now - start) / DAY));
    var from = Math.min(KH_PAGES, 1 + passed * ppd);
    var to = Math.min(KH_PAGES, from + ppd - 1);
    return {
      plan: plan, days: days, ppd: ppd, passed: passed, from: from, to: to,
      left: Math.max(0, days - passed),
      done: !!(plan.doneDates && plan.doneDates[todayStr()]),
      finished: passed >= days
    };
  }
  function createKhatma(days) {
    days = Math.max(1, Math.min(365, days | 0));
    var last = 1;
    try { last = parseInt(localStorage.getItem('rm_quran_last') || '1', 10) || 1; } catch (e) {}
    last = Math.max(1, Math.min(KH_PAGES, last));
    var start = new Date();
    var end = new Date();
    end.setDate(end.getDate() + days);
    var plan = {
      days: days,
      pagesPerDay: Math.ceil(KH_PAGES / days),
      startDate: todayStr(),
      endDate: end.toISOString().slice(0, 10),
      startPage: last,
      lastPage: last,
      bookmark: { page: last, surah: '', date: todayStr() },
      doneDates: {},
      createdBy: 'rafiq-reading'
    };
    try { localStorage.setItem('khatmaPlan', JSON.stringify(plan)); } catch (e) {}
    return plan;
  }
  function markKhatma(done) {
    var plan = khatmaPlan();
    if (!plan) { toast('ابدأ ختمة أولًا'); return; }
    var today = todayStr();
    if (!plan.doneDates) plan.doneDates = {};
    plan.doneDates[today] = !!done;
    try { localStorage.setItem('khatmaPlan', JSON.stringify(plan)); } catch (e) {}
    applyPoints('wird', done ? KH_POINTS : 0);
    if (done) toast('✅ تم ورد الختمة +' + KH_POINTS + ' نقطة');
    render();
  }

  /* ---------- النقاط ---------- */
  function applyPoints(key, pts) {
    try {
      if (typeof S !== 'undefined' && S) {
        S[key] = { v: pts > 0 ? 1 : null, p: pts || 0 };
      }
      if (typeof window.svD === 'function') window.svD();
      else if (typeof svD === 'function') svD();
    } catch (e) { console.warn('[RafiqReading] save failed', e); }
    try {
      if (typeof upScr === 'function') upScr();
      if (typeof upAn === 'function') upAn();
    } catch (e) {}
  }
  function toggleBook(id) {
    var book = findBook(id);
    if (!book) return;
    var st = ensureBook(id);
    var today = todayStr();
    var done = !!st.done[today];
    if (done) {
      delete st.done[today];
      applyPoints(id, 0);
      toast('أُلغي تسجيل الورد — لا تُحتسب درجاته');
    } else {
      var sec = section(book, dayIndexFor(book, today));
      st.done[today] = { from: sec.from, to: sec.to, at: Date.now() };
      applyPoints(id, book.points);
      toast('✅ ' + book.label + ' +' + book.points + ' نقطة');
    }
    saveState();
    render();
  }
  function findBook(id) {
    for (var i = 0; i < BOOKS.length; i++) if (BOOKS[i].id === id) return BOOKS[i];
    return null;
  }

  /* ---------- الواجهة ---------- */
  var CSS = ''
    + '#rfqReadingPlan{margin:0 0 16px;border:1px solid rgba(45,212,191,.26);border-radius:18px;padding:14px;background:linear-gradient(150deg,rgba(45,212,191,.10),rgba(15,23,42,.72))}'
    + '#rfqReadingPlan .rp-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}'
    + '#rfqReadingPlan .rp-title{font:800 1rem Tajawal,sans-serif;color:#e7f7f4;display:flex;align-items:center;gap:7px}'
    + '#rfqReadingPlan .rp-total{margin-inline-start:auto;font:800 .8rem Tajawal,sans-serif;color:#fbbf24;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.35);padding:4px 10px;border-radius:999px;white-space:nowrap}'
    + '#rfqReadingPlan .rp-contest{font:700 .74rem Tajawal,sans-serif;color:#a5b4fc;border:1px solid rgba(165,180,252,.35);background:rgba(99,102,241,.12);padding:4px 10px;border-radius:999px;text-decoration:none;white-space:nowrap}'
    + '#rfqReadingPlan .rp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:10px}'
    + '.rp-card{background:rgba(9,16,30,.72);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:11px 12px;display:flex;flex-direction:column;gap:8px}'
    + '.rp-card.is-done{border-color:rgba(52,211,153,.6);box-shadow:0 0 0 1px rgba(52,211,153,.25) inset,0 8px 22px -14px rgba(52,211,153,.7)}'
    + '.rp-card .rpc-top{display:flex;align-items:center;gap:8px}'
    + '.rp-card .rpc-icon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:.95rem;background:rgba(255,255,255,.06);flex:none}'
    + '.rp-card .rpc-name{font:800 .86rem Tajawal,sans-serif;color:#eef6ff;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.rp-card .rpc-pts{font:900 .72rem Tajawal,sans-serif;color:#34d399;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);padding:2px 7px;border-radius:999px;white-space:nowrap}'
    + '.rp-card .rpc-portion{font:800 .9rem Tajawal,sans-serif;color:#fbbf24;line-height:1.5}'
    + '.rp-card .rpc-portion small{color:#8fa3b8;font-weight:600;font-size:.72rem}'
    + '.rp-card .rpc-bar{height:5px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden}'
    + '.rp-card .rpc-bar i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#0d9488,#34d399);transition:width .4s}'
    + '.rp-card .rpc-meta{display:flex;justify-content:space-between;gap:6px;font:600 .68rem Tajawal,sans-serif;color:#93a4b8}'
    + '.rp-card .rpc-acts{display:flex;gap:6px;margin-top:auto}'
    + '.rp-card .rpc-btn{flex:1;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#dbe6f3;font:700 .74rem Tajawal,sans-serif;border-radius:9px;padding:7px 6px;cursor:pointer;transition:.18s}'
    + '.rp-card .rpc-btn:hover{border-color:rgba(45,212,191,.55);color:#eafffb}'
    + '.rp-card .rpc-btn.main{background:linear-gradient(135deg,rgba(45,212,191,.24),rgba(16,185,129,.15));border-color:rgba(45,212,191,.5);color:#d8fff8}'
    + '.rp-card .rpc-btn.on{background:linear-gradient(135deg,rgba(52,211,153,.3),rgba(16,185,129,.2));border-color:rgba(52,211,153,.7);color:#eafff7}'
    + '.rp-card.rp-khatma{border-color:rgba(251,191,36,.4);background:rgba(30,24,10,.6)}'
    + '.rp-card.rp-khatma .rpc-pts{color:#fbbf24;background:rgba(251,191,36,.14);border-color:rgba(251,191,36,.4)}'
    + '.rp-card.rp-khatma .rpc-bar i{background:linear-gradient(90deg,#b45309,#fbbf24)}'
    + '.rp-khatma-empty{font:700 .8rem Tajawal,sans-serif;color:#c8d5df;line-height:1.7}'
    + '.rp-presets{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}'
    + '.rp-presets button{flex:1;min-width:56px;border:1px solid rgba(251,191,36,.3);background:rgba(251,191,36,.1);color:#fcd34d;font:700 .72rem Tajawal,sans-serif;border-radius:8px;padding:6px 4px;cursor:pointer}'
    + '.rp-presets button:hover{background:rgba(251,191,36,.2)}'
    + '.rfq-competition-summary{margin:14px 15px;padding:14px;border-radius:16px;background:linear-gradient(145deg,rgba(251,191,36,.10),rgba(255,255,255,.025));border:1px solid rgba(251,191,36,.26)}'
    + '.rfq-competition-summary .rfq-comp-title{font:900 .98rem Tajawal,sans-serif;color:var(--accent-gold);margin-bottom:10px}'
    + '.rfq-competition-summary .rfq-comp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px}'
    + '.rfq-competition-summary .rfq-comp-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:12px;background:rgba(30,41,59,.42);border:1px solid rgba(251,191,36,.14);font:700 .8rem Tajawal,sans-serif;color:var(--text-secondary)}'
    + '.rfq-competition-summary .rfq-comp-item b{min-width:42px;text-align:center;padding:5px 9px;border-radius:9px;background:rgba(251,191,36,.13);color:var(--accent-gold);font:900 1rem Tajawal,sans-serif}'
    + '#stats .rfq-plan-summary{margin-top:14px;padding-top:12px;border-top:1px solid rgba(251,191,36,.2)}'
    + '#stats .rfq-plan-title{font:800 .86rem Tajawal,sans-serif;color:var(--text-primary);margin-bottom:9px}'
    + '#stats .rfq-plan-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}'
    + '#stats .rfq-plan-item{padding:10px;border-radius:12px;background:rgba(30,41,59,.38);border:1px solid rgba(255,255,255,.07)}'
    + '#stats .rfq-plan-item>div:first-child{display:flex;flex-direction:column;gap:4px;min-height:38px}'
    + '#stats .rfq-plan-item span{font:700 .72rem Tajawal,sans-serif;color:var(--text-secondary)}'
    + '#stats .rfq-plan-item b{font:800 .78rem Tajawal,sans-serif;color:var(--accent-gold)}'
    + '#stats .rfq-plan-bar{height:5px;margin-top:8px;background:rgba(148,163,184,.18);border-radius:9px;overflow:hidden;direction:ltr}'
    + '#stats .rfq-plan-bar i{display:block;width:0;height:100%;border-radius:9px;background:linear-gradient(90deg,#b45309,#fbbf24);transition:width .35s}'
    + '#stats #dList,#report #dayListReport{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:8px;padding:10px 15px 16px}'
    + '.rfq-day-stat{min-width:0;padding:11px 12px;border-radius:13px;background:rgba(30,41,59,.38);border:1px solid rgba(148,163,184,.15)}'
    + '.rfq-day-stat.has-score{border-color:rgba(16,185,129,.27)}'
    + '.rfq-day-top,.rfq-day-detail{display:flex;align-items:center;justify-content:space-between;gap:8px}'
    + '.rfq-day-date{min-width:0;font:800 .8rem Tajawal,sans-serif;color:var(--text-primary);overflow-wrap:anywhere}'
    + '.rfq-day-percent{flex:none;font:900 .82rem Tajawal,sans-serif;color:#34d399;background:rgba(16,185,129,.12);padding:4px 8px;border-radius:999px}'
    + '.rfq-day-edit{flex:none;border:1px solid rgba(201,162,39,.35);border-radius:9px;background:rgba(201,162,39,.10);color:var(--accent-gold);padding:5px 8px;font:800 .7rem Tajawal,sans-serif;white-space:nowrap;cursor:pointer;transition:background .18s,border-color .18s}'
    + '.rfq-day-edit:hover,.rfq-day-edit:focus-visible{background:rgba(201,162,39,.2);border-color:rgba(201,162,39,.65);outline:none}'
    + 'html[data-rafiq-theme="light"] .rfq-day-edit{color:#805f09;background:rgba(201,162,39,.11);border-color:rgba(163,120,19,.32)}'
    + '.rfq-day-stat.no-score .rfq-day-percent{color:#94a3b8;background:rgba(148,163,184,.1)}'
    + '.rfq-day-detail{margin-top:6px;font:600 .7rem Tajawal,sans-serif;color:var(--text-secondary)}'
    + '.rfq-day-progress{height:6px;margin-top:9px;border-radius:9px;background:rgba(148,163,184,.17);overflow:hidden;direction:ltr}'
    + '.rfq-day-progress i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#0d9488,#34d399);transition:width .35s}'
    + '.rfq-day-stat.no-score .rfq-day-progress i{background:#94a3b8}'
    + 'html[data-rafiq-theme="light"] .rfq-competition-summary .rfq-comp-item,html[data-rafiq-theme="light"] #stats .rfq-plan-item,html[data-rafiq-theme="light"] .rfq-day-stat{background:rgba(255,255,255,.9);border-color:rgba(163,120,19,.18)}'
    + 'html[data-rafiq-theme="light"] .rfq-competition-summary .rfq-comp-item{color:#675638}'
    + 'html[data-rafiq-theme="light"] #stats .rfq-plan-item span,html[data-rafiq-theme="light"] .rfq-day-detail{color:#7b6a4f}'
    + 'html[data-rafiq-theme="light"] .rfq-day-date{color:#352a1b}'
    + '#rfqRpToast{position:fixed;left:50%;bottom:96px;transform:translate(-50%,16px);z-index:12000;background:#0f4a37;color:#eafff7;border:1px solid rgba(52,211,153,.5);padding:9px 18px;border-radius:999px;font:800 .8rem Tajawal,sans-serif;opacity:0;pointer-events:none;transition:.28s;max-width:90vw;text-align:center}'
    + '#rfqRpToast.show{opacity:1;transform:translate(-50%,0)}'
    /* ---------- الوضع النهاري: نفس لوحة ألوان التطبيق (كريمي/ذهبي) ---------- */
    + 'html[data-rafiq-theme="light"] #rfqReadingPlan{background:linear-gradient(150deg,rgba(201,162,39,.13),rgba(255,253,248,.93));border-color:rgba(163,120,19,.30)}'
    + 'html[data-rafiq-theme="light"] #rfqReadingPlan .rp-title{color:#8a6408}'
    + 'html[data-rafiq-theme="light"] #rfqReadingPlan .rp-total{color:#8a6408;background:rgba(201,162,39,.14);border-color:rgba(163,120,19,.35)}'
    + 'html[data-rafiq-theme="light"] #rfqReadingPlan .rp-contest{color:#4338ca;border-color:rgba(99,102,241,.35);background:rgba(99,102,241,.08)}'
    + 'html[data-rafiq-theme="light"] .rp-card{background:rgba(255,255,255,.92);border-color:rgba(163,120,19,.20);box-shadow:0 4px 14px rgba(120,88,23,.06)}'
    + 'html[data-rafiq-theme="light"] .rp-card.is-done{border-color:rgba(15,125,91,.5);box-shadow:0 0 0 1px rgba(15,125,91,.18) inset,0 8px 22px -14px rgba(15,125,91,.55)}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-icon{background:rgba(201,162,39,.14);border:1px solid rgba(163,120,19,.22)}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-name{color:#33281a}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-pts{color:#0c6f50;background:rgba(15,125,91,.10);border-color:rgba(15,125,91,.30)}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-portion{color:#8a6408}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-portion small{color:#7b6a4f}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-bar{background:rgba(163,120,19,.14)}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-meta{color:#7b6a4f}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-btn{background:rgba(163,120,19,.06);color:#3a2f1e;border-color:rgba(163,120,19,.22)}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-btn:hover{border-color:rgba(163,120,19,.45);color:#2b2115;background:rgba(163,120,19,.10)}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-btn.main{background:linear-gradient(135deg,rgba(15,125,91,.14),rgba(15,125,91,.07));border-color:rgba(15,125,91,.42);color:#0c6f50}'
    + 'html[data-rafiq-theme="light"] .rp-card .rpc-btn.on{background:linear-gradient(135deg,rgba(15,125,91,.22),rgba(15,125,91,.12));border-color:rgba(15,125,91,.6);color:#0a5c44}'
    + 'html[data-rafiq-theme="light"] .rp-card.rp-khatma{border-color:rgba(163,120,19,.35);background:rgba(255,247,224,.92)}'
    + 'html[data-rafiq-theme="light"] .rp-card.rp-khatma .rpc-pts{color:#8a6408;background:rgba(201,162,39,.15);border-color:rgba(163,120,19,.35)}'
    + 'html[data-rafiq-theme="light"] .rp-card.rp-khatma .rpc-bar i{background:linear-gradient(90deg,#b45309,#c9a227)}'
    + 'html[data-rafiq-theme="light"] .rp-khatma-empty{color:#5d4c33}'
    + 'html[data-rafiq-theme="light"] .rp-presets button{border-color:rgba(163,120,19,.35);background:rgba(201,162,39,.12);color:#8a6408}'
    + 'html[data-rafiq-theme="light"] .rp-presets button:hover{background:rgba(201,162,39,.2)}'
    + '@media(max-width:620px){#rfqReadingPlan{padding:11px}.rp-card .rpc-name{font-size:.8rem}.rp-card .rpc-portion{font-size:.82rem}#stats .rfq-plan-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}'
    + '@media(max-width:380px){#stats .rfq-plan-grid{grid-template-columns:1fr}.rfq-competition-summary .rfq-comp-grid{grid-template-columns:1fr}}';

  function injectStyle() {
    if (document.getElementById('rfq-reading-style')) return;
    var st = document.createElement('style');
    st.id = 'rfq-reading-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function cardHtml(book) {
    var st = ensureBook(book.id);
    var today = todayStr();
    var idx = dayIndexFor(book, today);
    var sec = section(book, idx);
    var done = !!st.done[today];
    var prog = bookProgress(book);
    var label = sec.from === sec.to
      ? ('ال' + book.unit + ' ' + sec.from)
      : ('ال' + book.unit + ' ' + sec.from + ' – ' + sec.to);
    var pct = Math.round((sec.pos + 1) / sec.cycle * 100);
    var streakText = done ? 'تم اليوم ✓' : 'لم يُسجّل بعد';
    return ''
      + '<div class="rp-card' + (done ? ' is-done' : '') + '" data-book="' + book.id + '">'
      + '  <div class="rpc-top"><span class="rpc-icon">' + book.icon + '</span><b class="rpc-name">' + esc(book.label) + '</b><span class="rpc-pts">+' + book.points + '</span></div>'
      + '  <div class="rpc-portion">' + esc(label) + ' <small>من ' + book.total + ' ' + book.unit + 'ًا</small></div>'
      + '  <div class="rpc-bar"><i style="width:' + pct + '%"></i></div>'
      + '  <div class="rpc-meta"><span>اليوم ' + (sec.pos + 1) + ' / ' + sec.cycle + '</span><span>' + (done ? '✓ ' : '') + prog.doneCount + ' يومًا مسجّلًا</span></div>'
      + '  <div class="rpc-acts">'
      + '    <button type="button" class="rpc-btn main' + (done ? ' on' : '') + '" data-rp-done="' + book.id + '">' + (done ? '✓ تم القراءة' : 'أتممت اليوم') + '</button>'
      + '    <button type="button" class="rpc-btn" data-rp-open="' + book.id + '">افتح الكتاب</button>'
      + '  </div>'
      + '</div>';
  }

  function khatmaHtml() {
    var info = khatmaInfo();
    if (!info) {
      return ''
        + '<div class="rp-card rp-khatma">'
        + '  <div class="rpc-top"><span class="rpc-icon">📖</span><b class="rpc-name">ورد الختمة</b><span class="rpc-pts">+' + KH_POINTS + '</span></div>'
        + '  <div class="rp-khatma-empty">لم تبدأ ختمة بعد. اختر مدة الختمة وسنحسب لك صفحات كل يوم تلقائيًا.</div>'
        + '  <div class="rp-presets"><button type="button" data-rp-khatma="30">شهر (21 ص/يوم)</button><button type="button" data-rp-khatma="60">شهران (11)</button><button type="button" data-rp-khatma="90">3 أشهر (7)</button></div>'
        + '  <div class="rpc-acts"><button type="button" class="rpc-btn main" data-rp-open="quran">ابدأ من المصحف</button></div>'
        + '</div>';
    }
    var pct = Math.min(100, Math.round(info.passed / info.days * 100));
    return ''
      + '<div class="rp-card rp-khatma' + (info.done ? ' is-done' : '') + '">'
      + '  <div class="rpc-top"><span class="rpc-icon">📖</span><b class="rpc-name">ورد الختمة اليوم</b><span class="rpc-pts">+' + KH_POINTS + '</span></div>'
      + '  <div class="rpc-portion">صفحة ' + info.from + ' ← ' + info.to + ' <small>(' + info.ppd + ' صفحة في اليوم)</small></div>'
      + '  <div class="rpc-bar"><i style="width:' + pct + '%"></i></div>'
      + '  <div class="rpc-meta"><span>يوم ' + Math.min(info.passed + 1, info.days) + ' / ' + info.days + '</span><span>' + (info.left ? info.left + ' يومًا متبقيًا' : 'آخر يوم') + '</span></div>'
      + '  <div class="rpc-acts">'
      + '    <button type="button" class="rpc-btn main' + (info.done ? ' on' : '') + '" data-rp-khatma-done="1">' + (info.done ? '✓ تم ورد اليوم' : 'أتممت ورد اليوم') + '</button>'
      + '    <button type="button" class="rpc-btn" data-rp-open="quran">افتح المصحف</button>'
      + '  </div>'
      + '</div>';
  }

  function sectionHtml() {
    var earned = 0;
    BOOKS.forEach(function (b) {
      var st = ensureBook(b.id);
      if (st.done[todayStr()]) earned += b.points;
    });
    var kinfo = khatmaInfo();
    if (kinfo && kinfo.done) earned += KH_POINTS;
    return ''
      + '<section id="rfqReadingPlan" aria-label="خطة القراءة السنوية">'
      + '  <div class="rp-head">'
      + '    <span class="rp-title">📚 وردك اليومي من الكتب</span>'
      + '    <span class="rp-total">' + (earned ? '+' + earned + ' نقطة اليوم' : 'لم تُسجّل وردًا اليوم') + '</span>'
      + '    <a class="rp-contest" href="contest.html">🏆 المسابقة</a>'
      + '  </div>'
      + '  <div class="rp-grid">' + BOOKS.map(cardHtml).join('') + khatmaHtml() + '</div>'
      + '</section>';
  }

  function render() {
    var host = document.getElementById('dailyApp');
    if (!host) return;
    var old = document.getElementById('rfqReadingPlan');
    var sec = document.createElement('div');
    sec.innerHTML = sectionHtml();
    var node = sec.firstElementChild;
    if (old) old.replaceWith(node);
    else {
      var anchor = document.getElementById('dailyDateBar') || host.querySelector('.daily-steps') || host.firstElementChild;
      if (anchor && anchor.parentNode) anchor.insertAdjacentElement('afterend', node);
      else host.insertBefore(node, host.firstChild);
    }
    bind(node);
    syncBadges();
  }

  function bind(node) {
    node.querySelectorAll('[data-rp-done]').forEach(function (btn) {
      btn.addEventListener('click', function () { toggleBook(btn.getAttribute('data-rp-done')); });
    });
    var contestLink = node.querySelector('.rp-contest');
    if (contestLink) contestLink.addEventListener('click', function (e) {
      if (typeof window.openContestApp === 'function') {
        e.preventDefault();
        window.openContestApp();
      }
    });
    node.querySelectorAll('[data-rp-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-rp-open');
        if (id === 'quran') { openQuran(); return; }
        var book = findBook(id);
        if (!book) return;
        var fn = window[book.open];
        if (typeof fn === 'function') { try { fn(); } catch (e) { console.warn(e); } }
        else toast('تعذّر فتح الكتاب الآن');
      });
    });
    node.querySelectorAll('[data-rp-khatma]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        createKhatma(parseInt(btn.getAttribute('data-rp-khatma'), 10));
        toast('📖 بدأت الختمة — صفحتك اليوم محددة في الورد');
        render();
      });
    });
    var kdone = node.querySelector('[data-rp-khatma-done]');
    if (kdone) kdone.addEventListener('click', function () {
      var info = khatmaInfo();
      if (!info) { toast('ابدأ ختمة أولًا'); return; }
      markKhatma(!info.done);
    });
  }

  function openQuran() {
    var fn = window.openQuranApp;
    if (typeof fn !== 'function') { location.href = 'quran.html'; return; }
    try { fn(); } catch (e) {}
    setTimeout(function () {
      var fr = document.getElementById('quranFrame');
      if (fr && fr.contentWindow) {
        try { fr.contentWindow.postMessage({ type: 'rm-khatma' }, location.origin); } catch (e) {}
      }
    }, 700);
  }

  /* ---------- مزامنة بطاقات الإحصائيات والتقرير ---------- */
  function yearSum(key) {
    var total = 0;
    try {
      var now = new Date().getFullYear();
      var recs = (typeof d !== 'undefined' && d && d.recs) ? d.recs : {};
      Object.keys(recs).forEach(function (day) {
        if (new Date(day + 'T12:00:00').getFullYear() !== now) return;
        var rec = recs[day] || {};
        var item = rec[key];
        if (item && typeof item.p === 'number') total += item.p;
      });
    } catch (e) {}
    return total;
  }
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && el.textContent !== String(value)) el.textContent = value;
  }
  function syncBadges() {
    var today = todayStr();
    BOOKS.forEach(function (b) {
      var st = ensureBook(b.id);
      var done = !!st.done[today];
      var dayPts = done ? b.points : 0;
      setText('comp' + cap(b.id) + 'Gr', dayPts);
      setText('yrComp' + cap(b.id) + 'Gr', yearSum(b.id));
      var prog = document.getElementById(b.id + 'Progress');
      if (prog) {
        var idx = dayIndexFor(b, today);
        var sec = section(b, idx);
        var planPct = Math.round((sec.pos + 1) / sec.cycle * 100);
        prog.textContent = 'اليوم ' + (sec.pos + 1) + ' من ' + sec.cycle + ' — ' + planPct + '%' + (done ? ' ✓' : '');
        var bar = document.getElementById(b.id + 'ProgressBar');
        if (bar) bar.style.width = planPct + '%';
      }
    });
    var kinfo = khatmaInfo();
    setText('compQuranGr', (kinfo ? (kinfo.done ? KH_POINTS : 0) : 0) + (typeof S !== 'undefined' && S.quran ? (S.quran.p || 0) : 0));
    setText('yrCompQuranGr', yearSum('quran') + yearSum('wird'));
  }
  function cap(id) { return id.charAt(0).toUpperCase() + id.slice(1); }

  /* ---------- ملاحظة درجات الكتب داخل الإحصائيات ---------- */
  function statsNote() {
    if (document.getElementById('rfqReadingStatsNote')) return;
    var box = document.getElementById('stats');
    if (!box) return;
    var note = document.createElement('div');
    note.id = 'rfqReadingStatsNote';
    note.style.cssText = 'margin:12px 15px;padding:10px 12px;border-radius:12px;border:1px dashed rgba(45,212,191,.4);background:rgba(45,212,191,.08);font:600 .78rem Tajawal,sans-serif;color:#b7d8d2;line-height:1.8';
    note.textContent = '📚 درجات الكتب (رياض الصالحين، قصص الأنبياء، السيرة، ورد الختمة) تُسجَّل من صفحة «الرفيق اليومي» وتُحتسب تلقائيًا في الإجمالي والتقرير.';
    var target = box.querySelector('.stats-box');
    if (target && target.parentNode) target.parentNode.insertBefore(note, target.nextSibling);
  }

  var lastRenderedDay = '';
  function refreshIfNeeded() {
    if (!document.getElementById('dailyApp')) return;
    var host = document.getElementById('rfqReadingPlan');
    if (!host) { render(); return; }
    var t = todayStr();
    if (t !== lastRenderedDay) { lastRenderedDay = t; render(); }
    else syncBadges();
  }

  function init() {
    injectStyle();
    render();
    lastRenderedDay = todayStr();
    statsNote();
    // إعادة الرسم عند تغيير اليوم أو العودة للتطبيق.
    setInterval(refreshIfNeeded, 30000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) refreshIfNeeded();
    });
    // مزامنة بطاقات الإحصاء عند فتح صفحة الإحصائيات.
    var originalShPg = window.shPg;
    if (typeof originalShPg === 'function' && !window.__rfqReadingShPg) {
      window.__rfqReadingShPg = true;
      window.shPg = function (id) {
        var out = originalShPg.apply(this, arguments);
        if (id === 'stats' || id === 'report') setTimeout(function () { syncBadges(); statsNote(); }, 60);
        return out;
      };
    }
    window.addEventListener('storage', function (e) {
      if (e.key === 'khatmaPlan' || e.key === LS_KEY) render();
    });
    // تسجيل ورد الختمة من داخل المصحف نفسه.
    window.addEventListener('message', function (ev) {
      if (ev.origin !== location.origin) return;
      var m = ev.data || {};
      if (m.type !== 'rm-wird-done') return;
      applyPoints('wird', m.done === false ? 0 : KH_POINTS);
      render();
    });
  }

  window.RFQ_READING = {
    render: render,
    toggle: toggleBook,
    section: sectionHtml,
    khatma: khatmaInfo,
    createKhatma: createKhatma,
    syncBadges: syncBadges,
    points: { riyad: 30, qasas: 20, seerah: 25, wird: KH_POINTS }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
