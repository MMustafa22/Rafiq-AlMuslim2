/* ============================================================
   رفيق المسلم — تكبير المصحف لكبار السن (واضح وسهل)
   - زر «تكبير» كبير دائم داخل القارئ + لوحة بأزرار ضخمة
   - ثلاثة أحجام جاهزة: عادي / كبير / كبير جدًا
   - قرص بإصبعين (Pinch) + ضغطتان سريعتان + أزرار + / - من الكيبورد
   - الوضع المريح: أزرار تنقّل أكبر + تفسير بخط أكبر
   - يتذكّر اختيارك
   ============================================================ */
(function () {
  'use strict';
  var KZ = 'rm_qz', KE = 'rm_qz_easy', KH = 'rm_qz_hint';
  var MIN = 1, MAX = 4, STEP = 0.25;
  var z = 1, easy = false;
  var $ = function (id) { return document.getElementById(id); };
  var ar = function (n) { try { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); } catch (e) { return n; } };
  function load() {
    try { var v = parseFloat(localStorage.getItem(KZ)); if (v >= MIN && v <= MAX) z = v; easy = localStorage.getItem(KE) === '1'; } catch (e) {}
  }
  function save() { try { localStorage.setItem(KZ, String(z)); localStorage.setItem(KE, easy ? '1' : '0'); } catch (e) {} }

  /* ---------------- CSS ---------------- */
  var css = '\
#readerView .img-wrapper.rmz-on{overflow-x:auto;overflow-y:hidden;justify-content:flex-start!important;direction:ltr;-webkit-overflow-scrolling:touch;scrollbar-width:none;transition:none!important}\
#readerView .img-wrapper.rmz-on::-webkit-scrollbar{display:none}\
#readerView .img-wrapper.rmz-on .mushaf-page-img{width:calc(var(--rmz,1)*100%)!important;max-width:none!important;flex:0 0 auto}\
.immersive .page-image-area{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;z-index:2200!important;overflow:hidden!important}\
.immersive .img-wrapper{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;overflow:hidden!important;background:#fffdf5!important}\
.immersive .mushaf-page-img{width:auto!important;height:auto!important;max-width:100vw!important;max-height:100dvh!important;object-fit:contain!important;object-position:center!important;margin:0 auto!important}\
html.rmz-fullpage #rmzDock{display:none!important}\
#pageImageArea{touch-action:pan-x pan-y}\
#rmzDock{display:none!important}\
#rmzMain{display:flex;align-items:center;gap:8px;border:0;cursor:pointer;border-radius:999px;padding:12px 20px 12px 16px;font:800 1.05rem Tajawal,sans-serif;color:#2a1c00;background:linear-gradient(135deg,#f3d27a,#c9972b);box-shadow:0 4px 0 #8a6414,0 10px 20px rgba(0,0,0,.4);min-height:56px;-webkit-tap-highlight-color:transparent}\
#rmzMain:active{transform:translateY(3px);box-shadow:0 1px 0 #8a6414,0 4px 10px rgba(0,0,0,.4)}\
#rmzMain .ic{font-size:1.5rem;line-height:1}\
#rmzMain.pulse{animation:rmzPulse 1.6s ease 3}\
@keyframes rmzPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}\
#rmzPanel{position:absolute;left:0;bottom:70px;width:min(92vw,360px);background:var(--panel-bg,#0e1a2b);color:var(--text,#f3ecd2);border:2px solid rgba(212,175,55,.6);border-radius:22px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);display:none}\
#rmzPanel.open{display:block;animation:rmzIn .18s ease}\
@keyframes rmzIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}\
body:not(.dark-mode) #rmzPanel{background:#fffdf0;color:#3a2a00;border-color:#b8912a}\
.rmz-title{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:1.1rem;margin-bottom:12px}\
.rmz-x{border:0;background:rgba(212,175,55,.2);color:inherit;width:40px;height:40px;border-radius:50%;font-size:1.1rem;cursor:pointer}\
.rmz-row{display:flex;align-items:center;gap:10px;justify-content:space-between}\
.rmz-big{flex:0 0 76px;height:76px;border:0;border-radius:20px;font:900 2.4rem Tajawal,sans-serif;color:#2a1c00;background:linear-gradient(135deg,#f3d27a,#c9972b);box-shadow:0 4px 0 #8a6414,0 8px 14px rgba(0,0,0,.35);cursor:pointer;-webkit-tap-highlight-color:transparent;line-height:1}\
.rmz-big:active{transform:translateY(3px);box-shadow:0 1px 0 #8a6414}\
.rmz-big[disabled]{opacity:.35;filter:grayscale(.6)}\
.rmz-lvl{flex:1;text-align:center}\
.rmz-lvl b{display:block;font-size:2rem;font-weight:900;color:#c9972b}\
.rmz-lvl span{font-size:.8rem;opacity:.8}\
.rmz-presets{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}\
.rmz-chip{border:2px solid rgba(212,175,55,.55);background:transparent;color:inherit;border-radius:14px;padding:12px 4px;font:800 .95rem Tajawal,sans-serif;cursor:pointer;line-height:1.35;min-height:56px}\
.rmz-chip small{display:block;font-weight:600;opacity:.75;font-size:.75rem}\
.rmz-chip.on{background:linear-gradient(135deg,#f3d27a,#c9972b);color:#2a1c00;border-color:#8a6414}\
.rmz-easy{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:rgba(212,175,55,.12);cursor:pointer;margin-top:4px}\
.rmz-easy .t{flex:1;font-weight:800;font-size:.95rem;line-height:1.5}.rmz-easy .t small{display:block;font-weight:600;opacity:.8;font-size:.78rem}\
.rmz-sw{width:56px;height:32px;border-radius:999px;background:#777;position:relative;flex:0 0 56px;transition:background .2s}\
.rmz-sw::after{content:"";position:absolute;top:3px;right:3px;width:26px;height:26px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 2px 4px rgba(0,0,0,.4)}\
.rmz-easy.on .rmz-sw{background:#2d9a4a}.rmz-easy.on .rmz-sw::after{transform:translateX(-24px)}\
.rmz-reset{width:100%;margin-top:10px;border:0;background:transparent;color:inherit;opacity:.8;font:700 .9rem Tajawal,sans-serif;padding:10px;cursor:pointer;text-decoration:underline}\
#rmzToast{position:fixed;left:50%;top:84px;transform:translateX(-50%) scale(.9);background:rgba(20,16,4,.92);color:#f6e3a1;border:1px solid rgba(212,175,55,.6);border-radius:16px;padding:12px 18px;font:700 .95rem Tajawal,sans-serif;z-index:3500;opacity:0;pointer-events:none;transition:all .25s;max-width:88vw;text-align:center;line-height:1.7;direction:rtl}\
#rmzToast.show{opacity:1;transform:translateX(-50%) scale(1)}\
/* الوضع المريح */\
html.rmz-easy .nav-bar{height:92px!important;gap:8px!important;overflow-x:auto;justify-content:flex-start!important;scrollbar-width:none}html.rmz-easy .nav-bar>*{flex-shrink:0}\
html.rmz-easy .nav-bar .nav-btn{font-size:1.1rem!important;min-height:64px!important;padding:8px 12px!important;border-radius:16px!important;font-weight:800!important}\
html.rmz-easy .nav-jump-input{font-size:1.3rem!important;height:56px!important;min-width:84px}\
html.rmz-easy #rmzDock{bottom:108px}\
html.rmz-easy .mushaf-container{padding-bottom:100px!important}\
html.rmz-easy #tafseerBody{zoom:var(--rmz-ts,1.5)}\
@media (max-width:380px){.rmz-big{flex-basis:64px;height:64px;font-size:2rem}}';
  var st = document.createElement('style'); st.id = 'rmz-css'; st.textContent = css; document.head.appendChild(st);

  /* ---------------- UI ---------------- */
  function build() {
    if ($('rmzDock')) return;
    var d = document.createElement('div'); d.id = 'rmzDock';
    d.innerHTML =
      '<div id="rmzPanel" role="dialog" aria-label="تكبير المصحف">' +
        '<div class="rmz-title"><span>🔍 حجم صفحة المصحف</span><button class="rmz-x" id="rmzClose" aria-label="إغلاق">✕</button></div>' +
        '<div class="rmz-row">' +
          '<button class="rmz-big" id="rmzPlus" aria-label="تكبير">＋</button>' +
          '<div class="rmz-lvl"><b id="rmzLvl">١٠٠٪</b><span id="rmzLbl">الحجم العادي</span></div>' +
          '<button class="rmz-big" id="rmzMinus" aria-label="تصغير">－</button>' +
        '</div>' +
        '<div class="rmz-presets">' +
          '<button class="rmz-chip" data-z="1">عادي<small>١٠٠٪</small></button>' +
          '<button class="rmz-chip" data-z="2">كبير<small>٢٠٠٪</small></button>' +
          '<button class="rmz-chip" data-z="3">كبير جدًا<small>٣٠٠٪</small></button>' +
        '</div>' +
        '<div class="rmz-easy" id="rmzEasy" role="switch" aria-checked="false" tabindex="0"><div class="t">👓 الوضع المريح<small>أزرار تنقّل أكبر وتفسير بخط أكبر</small></div><div class="rmz-sw"></div></div>' +
        '<button class="rmz-reset" id="rmzReset">↺ العودة للحجم الأصلي</button>' +
      '</div>' +
      '<button id="rmzMain" aria-label="تكبير الصفحة"><span class="ic">🔍</span><span>تكبير</span></button>';
    document.body.appendChild(d);
    var t = document.createElement('div'); t.id = 'rmzToast'; document.body.appendChild(t);

    $('rmzMain').onclick = function (e) { e.stopPropagation(); $('rmzPanel').classList.toggle('open'); $('rmzMain').classList.remove('pulse'); };
    $('rmzClose').onclick = function () { $('rmzPanel').classList.remove('open'); };
    $('rmzPlus').onclick = function () { setZoom(z + STEP * (z >= 2 ? 2 : 1)); };
    $('rmzMinus').onclick = function () { setZoom(z - STEP * (z > 2 ? 2 : 1)); };
    $('rmzReset').onclick = function () { setZoom(1); };
    Array.prototype.forEach.call(d.querySelectorAll('.rmz-chip'), function (c) { c.onclick = function () { setZoom(parseFloat(c.getAttribute('data-z'))); }; });
    var ez = $('rmzEasy');
    ez.onclick = function () { setEasy(!easy); };
    ez.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEasy(!easy); } };
    document.addEventListener('click', function (e) { var p = $('rmzPanel'); if (p && p.classList.contains('open') && !$('rmzDock').contains(e.target)) p.classList.remove('open'); });
  }

  function toast(m) { var t = $('rmzToast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2200); }

  function labelFor(v) { return v <= 1.05 ? 'الحجم العادي' : v < 2 ? 'مكبّر قليلًا' : v < 3 ? 'كبير — مريح للقراءة' : 'كبير جدًا'; }

  /* ---------------- التطبيق ---------------- */
  function wrapper() { return $('imgWrapper'); }
  function apply(anchor) {
    var w = wrapper(), area = $('pageImageArea'); if (!w) return;
    var img = w.querySelector('.mushaf-page-img');
    var before = null;
    if (anchor && img) {
      var r = img.getBoundingClientRect();
      before = { x: (w.scrollLeft + w.clientWidth / 2) / Math.max(1, w.scrollWidth), y: (window.innerHeight / 2 - r.top) / Math.max(1, r.height), top: window.scrollY + r.top };
    }
    if (area) area.style.setProperty('--rmz', z);
    w.style.setProperty('--rmz', z);
    w.classList.toggle('rmz-on', z > 1.001);
    document.documentElement.style.setProperty('--rmz-ts', String(1 + Math.min(0.9, (z - 1) * 0.34 + 0.18)));
    requestAnimationFrame(function () {
      if (z <= 1.001) { w.scrollLeft = 0; return; }
      if (before) {
        w.scrollLeft = before.x * w.scrollWidth - w.clientWidth / 2;
        var i2 = w.querySelector('.mushaf-page-img');
        if (i2) { var h = i2.getBoundingClientRect().height; window.scrollTo(0, before.top + before.y * h - window.innerHeight / 2); }
      } else { w.scrollLeft = (w.scrollWidth - w.clientWidth) / 2; }
    });
    var pct = Math.round(z * 100);
    if ($('rmzLvl')) { $('rmzLvl').textContent = ar(pct) + '٪'; $('rmzLbl').textContent = labelFor(z); }
    if ($('rmzPlus')) { $('rmzPlus').disabled = z >= MAX - 0.001; $('rmzMinus').disabled = z <= MIN + 0.001; }
    Array.prototype.forEach.call(document.querySelectorAll('.rmz-chip'), function (c) { c.classList.toggle('on', Math.abs(parseFloat(c.getAttribute('data-z')) - z) < 0.13); });
  }
  function setZoom(v, quiet) {
    v = Math.max(MIN, Math.min(MAX, Math.round(v * 100) / 100));
    z = v; save(); apply(true);
    if (!quiet) toast('🔍 ' + ar(Math.round(z * 100)) + '٪ — ' + labelFor(z));
  }
  function setEasy(on) {
    easy = !!on; save();
    document.documentElement.classList.toggle('rmz-easy', easy);
    var e = $('rmzEasy'); if (e) { e.classList.toggle('on', easy); e.setAttribute('aria-checked', easy ? 'true' : 'false'); }
    toast(easy ? '👓 تم تفعيل الوضع المريح' : 'تم إيقاف الوضع المريح');
  }

  var fitMode = false, zoomBeforeFit = 1, suppressMouseDoubleClickUntil = 0;
  /* ملء الشاشة الحقيقي (يخفي شريط المتصفح) — على الأجهزة التي لا تدعمه (iPhone Safari) يبقى وضع الصفحة الكاملة داخل المتصفح */
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function enterFS() {
    if (fsEl()) return;
    var el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!f) return;
    try { var p = f.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  function exitFS() {
    if (!fsEl()) return;
    var f = document.exitFullscreen || document.webkitExitFullscreen;
    if (!f) return;
    try { var p = f.call(document); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  /* لو خرج المستخدم من ملء الشاشة بنفسه (Esc أو سحبة الرجوع) نخرج من وضع الصفحة الكاملة أيضًا */
  function onFsChange() {
    if (fsEl() || !fitMode) return;
    var rv = $('readerView');
    if (rv && rv.style.display !== 'none') togglePageFit(false);
    else { fitMode = false; document.documentElement.classList.remove('rmz-fullpage'); }
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
  function togglePageFit(fromTouch) {
    var rv = $('readerView'); if (!rv || rv.style.display === 'none') return;
    var wasImmersive = rv.classList.contains('immersive');
    if (!wasImmersive) enterFS(); else exitFS(); /* لازم يتنادى مباشرة داخل لمسة المستخدم */
    if (!fitMode) zoomBeforeFit = z;
    if (typeof window._toggleImmersive === 'function') window._toggleImmersive();
    else rv.classList.toggle('immersive', !wasImmersive);
    var active = rv.classList.contains('immersive');
    rv.classList.remove('immersive-show');
    fitMode = active;
    document.documentElement.classList.toggle('rmz-fullpage', active);
    setZoom(active ? 1 : zoomBeforeFit, true);
    if (fromTouch) suppressMouseDoubleClickUntil = Date.now() + 700;
    toast(active ? 'وضع القراءة: الصفحة بملء الشاشة — اضغط مرتين للعودة' : 'تم الرجوع إلى عرض المصحف العادي');
  }

  /* ---------------- اللمس: قرص + ضغطتان ---------------- */
  var pinch = null, lastTap = 0, lastTapXY = null, tapStart = null;
  function inArea(t) { var a = $('pageImageArea'); return a && t && a.contains(t); }
  function dist(a, b) { return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
  window.addEventListener('touchstart', function (e) {
    if (!inArea(e.target)) return;
    if (e.touches.length === 2) { pinch = { d: dist(e.touches[0], e.touches[1]), z: z }; tapStart = null; e.stopPropagation(); }
    else { tapStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; if (z > 1.001) e.stopPropagation(); } /* لا تقلّب الصفحة أثناء التحريك */
  }, { capture: true, passive: true });
  window.addEventListener('touchmove', function (e) {
    if (pinch && e.touches.length === 2) {
      e.preventDefault(); e.stopPropagation();
      var nz = pinch.z * (dist(e.touches[0], e.touches[1]) / pinch.d);
      nz = Math.max(MIN, Math.min(MAX, nz));
      z = nz; apply(true);
    }
  }, { capture: true, passive: false });
  window.addEventListener('touchend', function (e) {
    if (pinch) { if (e.touches.length < 2) { pinch = null; z = Math.round(z * 20) / 20; save(); apply(true); toast('🔍 ' + ar(Math.round(z * 100)) + '٪'); } e.stopPropagation(); return; }
    if (!inArea(e.target)) return;
    var ct = e.changedTouches[0], now = Date.now();
    if (tapStart && Math.hypot(ct.clientX - tapStart.x, ct.clientY - tapStart.y) > 24) { tapStart = null; lastTap = 0; return; }
    tapStart = null;
    var near = lastTapXY && Math.hypot(ct.clientX - lastTapXY.x, ct.clientY - lastTapXY.y) < 72;
    if (now - lastTap < 550 && near) {
      e.stopPropagation(); lastTap = 0;
      togglePageFit(true);
    } else { lastTap = now; lastTapXY = { x: ct.clientX, y: ct.clientY }; if (z > 1.001) e.stopPropagation(); }
  }, { capture: true, passive: true });
  window.addEventListener('touchcancel', function () { tapStart = null; lastTap = 0; }, { capture: true, passive: true });
  window.addEventListener('dblclick', function (e) {
    if (Date.now() < suppressMouseDoubleClickUntil || !inArea(e.target)) return;
    e.preventDefault(); e.stopPropagation(); togglePageFit(false);
  }, true);
  window.addEventListener('keydown', function (e) {
    var rv = $('readerView'); if (!rv || rv.style.display === 'none') return;
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(z + STEP); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); setZoom(z - STEP); }
    else if (e.key === '0') { setZoom(1); }
  }, true);
  /* Ctrl + عجلة الماوس على الكمبيوتر */
  window.addEventListener('wheel', function (e) { if (e.ctrlKey && inArea(e.target)) { e.preventDefault(); setZoom(z + (e.deltaY < 0 ? STEP : -STEP), true); } }, { capture: true, passive: false });

  /* ---------------- إظهار الزر داخل القارئ فقط ---------------- */
  function tick() {
    var rv = $('readerView'), d = $('rmzDock'); if (!d) return;
    var vis = rv && rv.style.display !== 'none' && getComputedStyle(rv).display !== 'none' && document.body.style.overflow !== 'hidden';
    d.classList.toggle('show', !!vis);
    if (vis) {
      var w = wrapper(); if (w && (w.classList.contains('rmz-on') !== (z > 1.001) || w.style.getPropertyValue('--rmz') !== String(z))) apply(false);
    } else { var p = $('rmzPanel'); if (p) p.classList.remove('open'); if (fsEl()) exitFS(); }
  }
  function boot() {
    load(); build();
    document.documentElement.classList.toggle('rmz-easy', easy);
    var e = $('rmzEasy'); if (e) { e.classList.toggle('on', easy); e.setAttribute('aria-checked', easy ? 'true' : 'false'); }
    apply(false);
    setInterval(tick, 400);
    /* عند تغيير الصفحة: ابقَ على نفس التكبير وارجع لأعلى الصفحة */
    var w = wrapper();
    if (w) new MutationObserver(function () { requestAnimationFrame(function () { apply(false); }); }).observe(w, { childList: true });
    try {
      if (!localStorage.getItem(KH)) {
        localStorage.setItem(KH, '1');
        setTimeout(function () {
          var rv = $('readerView'); if (rv && rv.style.display !== 'none') {
            toast('اضغط مرتين على الصفحة لوضع القراءة بملء الشاشة، واضغط مرتين للعودة');
          }
        }, 2500);
      }
    } catch (er) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.RafiqQuranZoom = { set: setZoom, get: function () { return z; }, easy: setEasy };
})();
