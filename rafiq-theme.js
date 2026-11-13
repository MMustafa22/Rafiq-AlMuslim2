/* ============================================================
   رفيق المسلم — محرّك الوضع النهاري/الليلي العام
   - يطبّق الوضع على التطبيق كله
   - يزامن الأقسام المدمجة (المكتبة، رياض الصالحين، قصص الأنبياء)
   - يوفّر الزر داخل مركز الإعدادات
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'rm_theme';
  var root = document.documentElement;

  function getSaved() {
    try { return localStorage.getItem(KEY) || 'dark'; } catch (e) { return 'dark'; }
  }

  function updateSettingsLabel(mode) {
    var name = document.getElementById('rsThemeName');
    if (name) name.textContent = mode === 'light' ? 'الوضع النهاري ☀️' : 'الوضع الليلي 🌙';
    var hint = document.getElementById('rsThemeHint');
    if (hint) hint.textContent = mode === 'light'
      ? 'مظهر مشرق بألوان السكري والذهبي — مريح للقراءة في النهار.'
      : 'مظهر هادئ بالأزرق الداكن والذهبي — مريح للعين ليلًا.';
    var sw = document.getElementById('rsThemeState');
    if (sw) sw.textContent = mode === 'light' ? 'نهاري' : 'ليلي';
  }

  function syncFrames(mode) {
    var frames = ['ilmFrame', 'riyadFrame', 'qasasFrame', 'noorFrame', 'sahabaFrame', 'fr_seerah', 'fr_fiqh', 'quranFrame'];
    for (var i = 0; i < frames.length; i++) {
      var id = frames[i];
      var fr = document.getElementById(id);
      if (!fr) continue;
      try { fr.contentWindow.postMessage({ type: 'rafiq:theme', mode: mode }, '*'); } catch (e) {}
      if (id === 'noorFrame' || id === 'sahabaFrame' || id === 'fr_seerah' || id === 'fr_fiqh' || id === 'quranFrame') continue;
      try {
        var doc = fr.contentDocument;
        if (!doc) continue;
        var h = doc.documentElement;
        if (id === 'riyadFrame') {
          h.setAttribute('data-theme', mode === 'dark' ? 'midnight' : 'emerald');
        } else if (mode === 'dark') {
          h.setAttribute('data-theme', 'dark');
        } else {
          h.removeAttribute('data-theme');
          h.setAttribute('data-mode', 'light');
        }
      } catch (e) {}
    }
    try { localStorage.setItem('riyad_theme', mode === 'dark' ? 'midnight' : 'emerald'); } catch (e) {}
  }

  function apply(mode, opts) {
    mode = (mode === 'light') ? 'light' : 'dark';
    root.setAttribute('data-rafiq-theme', mode);
    try { root.style.colorScheme = mode === 'light' ? 'light' : 'dark'; } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'light' ? '#fbf7ef' : '#050b14');
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    syncFrames(mode);
    updateSettingsLabel(mode);
    if (!opts || !opts.silent) {
      try { window.dispatchEvent(new CustomEvent('rafiqthemechange', { detail: { mode: mode } })); } catch (e) {}
    }
    return mode;
  }

  window.RafiqTheme = {
    get: function () { return root.getAttribute('data-rafiq-theme') || getSaved(); },
    set: function (m) { return apply(m); },
    toggle: function () { return apply(window.RafiqTheme.get() === 'light' ? 'dark' : 'light'); }
  };

  /* التطبيق الفوري قبل رسم الصفحة */
  apply(getSaved(), { silent: true });

  /* مزامنة مع بقية الصفحات/الإطارات */
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) apply(e.newValue === 'light' ? 'light' : 'dark', { silent: true });
  });
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d && d.type === 'rafiq:theme') {
      var want = d.mode === 'light' ? 'light' : 'dark';
      if (want !== root.getAttribute('data-rafiq-theme')) apply(want, { silent: true });
    }
    if (d && d.type === 'rafiq:theme-ask') {
      var mode = window.RafiqTheme.get();
      try { e.source.postMessage({ type: 'rafiq:theme', mode: mode }, '*'); } catch (err) {}
    }
  });

  /* بعد فتح أي قسم مدمج نزامن وضعه */
  window.addEventListener('load', function () {
    syncFrames(window.RafiqTheme.get());
    setTimeout(function () { syncFrames(window.RafiqTheme.get()); }, 600);
  });
})();
