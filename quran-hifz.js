/* رفيق المسلم — خطة حفظ القرآن، متابعة الورد، واختبار التسميع الذاتي */
(function () {
  "use strict";
  const KEY = "rm_quran_hifz_plan_v1";
  const TEST_KEY = "rm_quran_hifz_self_test_v1";
  const TOTAL = 604;
  let testClock = null;
  const ar = n => typeof toArabicNum === "function" ? toArabicNum(n) : String(n);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) { return null; } };
  const save = plan => localStorage.setItem(KEY, JSON.stringify(plan));
  const readTest = () => {
    try {
      const value = JSON.parse(localStorage.getItem(TEST_KEY) || "null") || {};
      return { attempts: 0, mastered: 0, review: 0, history: [], ...value, history: Array.isArray(value.history) ? value.history : [] };
    } catch (_) { return { attempts: 0, mastered: 0, review: 0, history: [] }; }
  };
  const saveTest = test => localStorage.setItem(TEST_KEY, JSON.stringify(test));
  const dateAtMidnight = s => new Date(String(s || today()) + "T00:00:00");
  const dayIndex = plan => Math.max(0, Math.floor((dateAtMidnight(today()) - dateAtMidnight(plan.startDate)) / 86400000));
  const range = plan => {
    const index = dayIndex(plan);
    const from = Math.min(TOTAL, plan.startPage + index * plan.pagesPerDay);
    const to = Math.min(TOTAL, from + plan.pagesPerDay - 1);
    return { from, to, index };
  };
  function dailyGoal(plan, date) {
    const index = Math.max(0, Math.floor((dateAtMidnight(date || today()) - dateAtMidnight(plan.startDate)) / 86400000));
    const totalPages = Math.max(0, TOTAL - Number(plan.startPage || 1) + 1);
    const perDay = Math.max(1, Number(plan.pagesPerDay) || 1);
    return Math.max(0, Math.min(perDay, totalPages - index * perDay));
  }
  function dailyProgress(plan, date) {
    const key = date || today();
    const goal = dailyGoal(plan, key);
    const done = !!(plan.done && plan.done[key]);
    const saved = Number(plan.progress && plan.progress[key]) || 0;
    const count = done ? goal : Math.min(goal, Math.max(0, saved));
    return { goal, count, pct: goal ? Math.round(count / goal * 100) : 100 };
  }
  function totalCompletedPages(plan) {
    const done = plan.done || {}, progress = plan.progress || {};
    const dates = new Set(Object.keys(done).filter(key => done[key]).concat(Object.keys(progress)));
    let total = 0;
    dates.forEach(key => {
      if (key < plan.startDate || key > today()) return;
      const stat = dailyProgress(plan, key);
      total += stat.count;
    });
    return Math.min(Math.max(0, TOTAL - Number(plan.startPage || 1) + 1), total);
  }
  function openHifzPanel() {
    renderHifzPanel();
    const el = document.getElementById("hifzOverlay");
    if (el) { el.classList.add("open"); document.body.style.overflow = "hidden"; }
    startTestClockIfNeeded();
  }
  function closeHifzPanel() {
    const el = document.getElementById("hifzOverlay");
    if (el) el.classList.remove("open");
    document.body.style.overflow = "";
    if (testClock) { clearInterval(testClock); testClock = null; }
  }
  function startHifzPlan() {
    const days = Math.max(1, Number(document.getElementById("hifzDays")?.value) || 180);
    const startPage = Math.min(TOTAL, Math.max(1, Number(document.getElementById("hifzStartPage")?.value) || 1));
    const pages = TOTAL - startPage + 1;
    save({ days, startPage, pagesPerDay: Math.ceil(pages / days), startDate: today(), done: {} });
    renderHifzPanel();
  }
  function markHifzToday() {
    const plan = read(); if (!plan) return;
    plan.done = plan.done || {};
    plan.progress = plan.progress || {};
    const key = today(), stat = dailyProgress(plan, key);
    if (plan.done[key]) { delete plan.done[key]; delete plan.progress[key]; }
    else { plan.done[key] = true; plan.progress[key] = stat.goal; }
    save(plan); renderHifzPanel();
  }
  function updateHifzTodayProgress(delta) {
    const plan = read(); if (!plan) return;
    plan.done = plan.done || {};
    plan.progress = plan.progress || {};
    const key = today(), stat = dailyProgress(plan, key);
    if (!stat.goal) return;
    const next = Math.max(0, Math.min(stat.goal, stat.count + (Number(delta) || 0)));
    if (next) plan.progress[key] = next; else delete plan.progress[key];
    if (next >= stat.goal) plan.done[key] = true; else delete plan.done[key];
    save(plan); renderHifzPanel();
  }
  function resetHifzPlan() {
    if (!confirm("هل تريد إلغاء خطة الحفظ الحالية؟")) return;
    localStorage.removeItem(KEY); renderHifzPanel();
  }
  function openHifzToday() {
    const plan = read(); if (!plan) return;
    const r = range(plan);
    if (typeof loadPage === "function") { closeHifzPanel(); loadPage(r.from); }
  }
  function startHifzSelfTest() {
    const plan = read(); if (!plan) return;
    const r = range(plan);
    const min = Math.max(1, Math.min(plan.startPage, r.to));
    const max = Math.max(min, r.to);
    const previousPage = Number(readTest().page) || 0;
    let page = min + Math.floor(Math.random() * (max - min + 1));
    if (max > min && page === previousPage) page = min + ((page - min + 1) % (max - min + 1));
    const test = readTest();
    test.page = page;
    test.startedAt = Date.now();
    test.lastResult = "";
    saveTest(test);
    renderHifzPanel();
    startTestClockIfNeeded();
  }
  function elapsedSeconds(test) {
    return test && test.startedAt ? Math.max(0, Math.floor((Date.now() - Number(test.startedAt)) / 1000)) : 0;
  }
  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return ar(minutes) + ":" + ar(String(rest).padStart(2, "0"));
  }
  function startTestClockIfNeeded() {
    if (testClock) { clearInterval(testClock); testClock = null; }
    const overlay = document.getElementById("hifzOverlay");
    if (!overlay || !overlay.classList.contains("open") || !readTest().startedAt) return;
    const update = () => {
      const el = document.getElementById("hifzTestElapsed");
      if (el) el.textContent = formatDuration(elapsedSeconds(readTest()));
    };
    update();
    testClock = setInterval(update, 1000);
  }
  function openHifzTestPage() {
    const test = readTest();
    const page = Number(test.page);
    if (!page || page < 1 || page > TOTAL) return;
    closeHifzPanel();
    if (typeof loadPage === "function") loadPage(page);
  }
  function recordHifzSelfTest(result) {
    if (result !== "mastered" && result !== "review") return;
    const test = readTest();
    if (!test.page || !test.startedAt) return;
    test.attempts = (Number(test.attempts) || 0) + 1;
    if (result === "mastered") test.mastered = (Number(test.mastered) || 0) + 1;
    else test.review = (Number(test.review) || 0) + 1;
    test.lastPage = test.page;
    test.lastResult = result;
    test.lastDurationSeconds = elapsedSeconds(test);
    test.history = Array.isArray(test.history) ? test.history : [];
    test.history.push({ date: today(), page: test.page, result, durationSeconds: test.lastDurationSeconds });
    if (test.history.length > 100) test.history = test.history.slice(-100);
    test.page = null;
    test.startedAt = null;
    saveTest(test);
    renderHifzPanel();
  }
  function renderSelfTest(test, plan, r) {
    const page = Number(test.page);
    const active = page >= 1 && page <= TOTAL && !!test.startedAt;
    const attempts = Number(test.attempts) || 0;
    const masteryPct = attempts ? Math.round((Number(test.mastered) || 0) / attempts * 100) : 0;
    const resultText = test.lastResult === "mastered" ? "آخر تقييم: متقن" : test.lastResult === "review" ? "آخر تقييم: يحتاج إلى مراجعة" : "لم تسجل تقييمًا بعد";
    const history = test.history.slice(-5).reverse();
    return `<div class="hifz-guide" style="margin-top:14px"><b>🧠 اختبار التسميع الذاتي</b>
      <p style="margin:7px 0 10px">اختر صفحة عشوائية من بداية خطتك حتى ورد اليوم، سمّعها غيبًا، ثم افتح المصحف لتراجعها بنفسك.</p>
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:.78rem;color:var(--panel-text-muted)"><span>اختبارات: ${ar(attempts)}</span><span>متقن: ${ar(Number(test.mastered)||0)}</span><span>مراجعة: ${ar(Number(test.review)||0)}</span><span>نسبة الإتقان: ${ar(masteryPct)}٪</span></div>
      <button class="hifz-primary" style="width:100%;margin-top:10px" onclick="startHifzSelfTest()">🎲 اختر صفحة وابدأ التسميع</button>
      ${active ? `<div style="margin-top:12px;padding:12px;border:1px solid rgba(212,175,55,.35);border-radius:12px;text-align:center;background:rgba(212,175,55,.07)">
        <div style="font-size:.8rem;color:var(--panel-text-muted)">سمّع الصفحة غيبًا</div><strong style="display:block;margin:4px 0;color:var(--gold);font-size:1.1rem">صفحة ${ar(page)}</strong>
        <div style="font-size:.8rem;color:var(--panel-text-muted)">مدة التسميع: <b id="hifzTestElapsed">${formatDuration(elapsedSeconds(test))}</b></div>
        <button class="hifz-secondary" style="width:100%;margin-top:9px" onclick="openHifzTestPage()">📖 افتح الصفحة في المصحف للمراجعة</button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button class="hifz-secondary" onclick="recordHifzSelfTest('mastered')">✅ أتقنتها</button><button class="hifz-secondary" onclick="recordHifzSelfTest('review')">🔁 أحتاج إلى مراجعة</button></div>
      </div>` : `<small style="display:block;margin-top:8px;color:var(--panel-text-muted)">${esc(resultText)}${test.lastPage ? ` — صفحة ${ar(test.lastPage)}` : ""}</small>`}
      ${history.length ? `<div style="margin-top:12px"><b style="font-size:.82rem">أحدث تقييمات التسميع</b>${history.map(item => `<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:.76rem"><span>${esc(item.date || "")} — صفحة ${ar(Number(item.page)||0)}</span><b style="color:${item.result === "mastered" ? "#34d399" : "#fbbf24"}">${item.result === "mastered" ? "متقن" : "يحتاج مراجعة"}</b></div>`).join("")}</div>` : ""}
    </div>`;
  }
  function renderHifzStats(plan, test, r, doneCount, totalDays) {
    const totalPages = Math.max(1, TOTAL - Number(plan.startPage || 1) + 1);
    const completedPages = totalCompletedPages(plan);
    const planPct = Math.min(100, Math.round(completedPages / totalPages * 100));
    const todayStat = dailyProgress(plan, today());
    const attempts = Number(test.attempts) || 0;
    const mastered = Number(test.mastered) || 0;
    const review = Number(test.review) || 0;
    const masteryPct = attempts ? Math.round(mastered / attempts * 100) : 0;
    const days = [];
    for (let offset = 6; offset >= 0; offset--) {
      const key = new Date(Date.parse(today() + "T00:00:00Z") - offset * 86400000).toISOString().slice(0, 10);
      const stat = dailyProgress(plan, key);
      days.push({ key, done: stat.pct >= 100 && stat.goal > 0, count: stat.count, goal: stat.goal, pct: stat.pct });
    }
    return `<div class="hifz-guide" style="margin-top:14px"><b>📊 إحصائيات الإنجاز والتسميع</b>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin-top:10px">
        <div style="padding:10px;border-radius:10px;background:rgba(212,175,55,.09);text-align:center"><small>إنجاز ورد اليوم</small><strong style="display:block;color:var(--gold);font-size:1.1rem">${ar(todayStat.pct)}٪</strong><small>${ar(todayStat.count)} من ${ar(todayStat.goal)} صفحة</small></div>
        <div style="padding:10px;border-radius:10px;background:rgba(212,175,55,.09);text-align:center"><small>إنجاز الخطة</small><strong style="display:block;color:var(--gold);font-size:1.1rem">${ar(planPct)}٪</strong><small>${ar(completedPages)} من ${ar(totalPages)} صفحة</small></div>
        <div style="padding:10px;border-radius:10px;background:rgba(212,175,55,.09);text-align:center"><small>إتقان التسميع</small><strong style="display:block;color:#34d399;font-size:1.1rem">${ar(masteryPct)}٪</strong><small>${ar(mastered)} متقن من ${ar(attempts)} اختبار</small></div>
        <div style="padding:10px;border-radius:10px;background:rgba(212,175,55,.09);text-align:center"><small>يحتاج إلى مراجعة</small><strong style="display:block;color:#fbbf24;font-size:1.1rem">${ar(review)}</strong><small>تقييمًا من إجمالي الاختبارات</small></div>
      </div>
      <div style="margin-top:12px;font-size:.8rem"><b>إنجاز آخر ٧ أيام</b><div style="display:flex;gap:6px;justify-content:space-between;margin-top:7px">${days.map(day => `<span title="${esc(day.key)} — ${day.count} من ${day.goal} صفحة" style="flex:1;text-align:center;padding:6px 2px;border-radius:8px;background:${day.done ? "rgba(52,211,153,.2)" : day.count ? "rgba(251,191,36,.16)" : "rgba(255,255,255,.06)"};color:${day.done ? "#34d399" : day.count ? "#fbbf24" : "var(--panel-text-muted)"};font-size:.72rem">${day.done ? "✓" : day.count ? ar(day.pct) + "٪" : "·"}<small style="display:block">${ar(Number(day.key.slice(-2)))}</small></span>`).join("")}</div></div>
    </div>`;
  }
  function renderHifzPanel() {
    const body = document.getElementById("hifzBody"); if (!body) return;
    const plan = read();
    if (!plan) {
      body.innerHTML = `<div class="hifz-intro"><div class="hifz-hero">💎</div><h3>ابدأ حفظ القرآن بخطوات ثابتة</h3><p>اختر مدة مناسبة لك. التطبيق يقسم الصفحات إلى ورد يومي، ويساعدك على القراءة والتسجيل والمراجعة بدون ضغط.</p></div>
        <div class="hifz-guide"><b>طريقة الحفظ اليومية</b><ol><li>اقرأ الصفحة الجديدة نظرًا عدة مرات.</li><li>قسّم الصفحة إلى مقاطع قصيرة، واحفظ كل مقطع بالتكرار.</li><li>سمّع الصفحة غيبًا ثم راجع أخطاءك من المصحف.</li><li>ابدأ كل يوم بمراجعة ورد الأمس قبل الحفظ الجديد.</li></ol></div>
        <div class="hifz-form"><label>مدة الخطة<select id="hifzDays"><option value="60">شهران — ${ar(10)} صفحات يوميًا تقريبًا</option><option value="90">3 أشهر — ${ar(7)} صفحات يوميًا تقريبًا</option><option value="180" selected>6 أشهر — ${ar(4)} صفحات يوميًا تقريبًا</option><option value="365">سنة — ${ar(2)} صفحة يوميًا تقريبًا</option></select></label><label>صفحة البداية<input id="hifzStartPage" type="number" min="1" max="604" value="1"></label><button class="hifz-primary" onclick="startHifzPlan()">ابدأ خطة الحفظ</button></div>`;
      return;
    }
    const r = range(plan);
    const doneCount = Object.keys(plan.done || {}).filter(key => plan.done[key] && key >= plan.startDate && key <= today()).length;
    const totalDays = Math.max(1, Math.ceil((TOTAL - plan.startPage + 1) / plan.pagesPerDay));
    const totalPages = Math.max(1, TOTAL - Number(plan.startPage || 1) + 1);
    const pct = Math.min(100, Math.round(totalCompletedPages(plan) / totalPages * 100));
    const isDone = !!(plan.done && plan.done[today()]);
    const todayStat = dailyProgress(plan, today());
    const test = readTest();
    body.innerHTML = `<div class="hifz-current"><div class="hifz-hero">💎</div><div><b>خطة حفظ القرآن</b><span>ورد اليوم — اليوم ${ar(Math.min(totalDays, r.index + 1))} من ${ar(totalDays)}</span></div></div>
      <div class="hifz-range"><span>ورد اليوم</span><strong>من صفحة ${ar(r.from)} إلى ${ar(r.to)}</strong><small>${ar(plan.pagesPerDay)} صفحات تقريبًا</small></div>
      <div class="hifz-progress"><div><span>التقدم المسجل في الخطة</span><b>${ar(pct)}٪</b></div><i style="width:${pct}%"></i><small>أنجزت ${ar(doneCount)} يومًا كاملًا من ${ar(totalDays)}</small></div>
      <div class="hifz-actions"><button class="hifz-primary" onclick="openHifzToday()">📖 افتح ورد اليوم</button><button class="hifz-secondary ${isDone ? "done" : ""}" onclick="markHifzToday()">${isDone ? "✅ تم تسجيل ورد اليوم" : "✓ سجلت الورد كاملًا"}</button></div>
      <div class="hifz-guide" style="margin-top:10px"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span>إنجاز ورد اليوم: <b style="color:var(--gold)">${ar(todayStat.pct)}٪</b> — ${ar(todayStat.count)} من ${ar(todayStat.goal)} صفحات</span><span style="display:flex;gap:6px"><button class="hifz-secondary" aria-label="تقليل التقدم صفحة" onclick="updateHifzTodayProgress(-1)">−</button><button class="hifz-secondary" onclick="updateHifzTodayProgress(1)">＋ صفحة</button></span></div></div>
      ${renderHifzStats(plan, test, r, doneCount, totalDays)}
      ${renderSelfTest(test, plan, r)}
      <div class="hifz-guide"><b>نظام المراجعة المقترح</b><ol><li>مراجعة ورد الأمس قبل الجديد.</li><li>مراجعة آخر 5 صفحات في نهاية كل أسبوع.</li><li>خصص يومًا أسبوعيًا للمراجعة فقط إذا شعرت بتراكم الورد.</li><li>لا تنتقل للصفحة التالية حتى تستطيع تسميع السابقة بثبات.</li></ol></div>
      <div class="hifz-footer"><button onclick="resetHifzPlan()">إلغاء الخطة</button><button onclick="closeHifzPanel()">إغلاق</button></div>`;
    startTestClockIfNeeded();
  }
  window.openHifzPanel = openHifzPanel;
  window.closeHifzPanel = closeHifzPanel;
  window.startHifzPlan = startHifzPlan;
  window.markHifzToday = markHifzToday;
  window.updateHifzTodayProgress = updateHifzTodayProgress;
  window.resetHifzPlan = resetHifzPlan;
  window.openHifzToday = openHifzToday;
  window.startHifzSelfTest = startHifzSelfTest;
  window.openHifzTestPage = openHifzTestPage;
  window.recordHifzSelfTest = recordHifzSelfTest;
  window.renderHifzPanel = renderHifzPanel;
})();
