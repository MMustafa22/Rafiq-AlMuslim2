/* ============================================================
   رفيق المسلم — تحميل الجلد النهاري داخل التطبيقات المدمجة
   يُضمَّن في <head>، ويقرأ الوضع من إعدادات التطبيق الأم (rm_theme)
   ============================================================ */
(function () {
  'use strict';
  var CSS = 'rafiq-skin.css?v=8';

  function current() {
    var m = null;
    try {
      m = new URLSearchParams(location.search).get('theme');
      if (!m) m = localStorage.getItem('rm_theme');
    } catch (e) {}
    return m === 'light' ? 'light' : 'dark';
  }

  function apply(mode) {
    var h = document.documentElement;
    if (mode === 'light') h.setAttribute('data-rfq-light', '1');
    else h.removeAttribute('data-rfq-light');
    try { h.style.colorScheme = mode === 'light' ? 'light' : 'dark'; } catch (e) {}
    try { document.dispatchEvent(new CustomEvent('rfqthemechange', { detail: { mode: mode } })); } catch (e) {}
  }

  function ensureCss() {
    if (document.querySelector('link[data-rfq-skin]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = CSS;
    l.setAttribute('data-rfq-skin', '1');
    (document.head || document.documentElement).appendChild(l);
  }

  ensureCss();
  apply(current());

  try {
    window.addEventListener('storage', function (e) {
      if (e.key === 'rm_theme' && e.newValue) apply(e.newValue === 'light' ? 'light' : 'dark');
    });
    window.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d && d.type === 'rafiq:theme') apply(d.mode === 'light' ? 'light' : 'dark');
    });
  } catch (e) {}

  window.RafiqSkin = { apply: apply, get: current, refresh: function () { apply(current()); } };
})();
