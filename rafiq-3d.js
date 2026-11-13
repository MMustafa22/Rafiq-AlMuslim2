/* ============================================================
   رفيق المسلم — محرّك المظهر ثلاثي الأبعاد (3D)
   - يحفظ الاختيار في localStorage (rm_3d)
   - يتزامن مع كل الصفحات المدمجة (iframes) فورًا
   - window.Rafiq3D = { get, set, toggle }
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'rm_3d', root = document.documentElement;
  var CSS = 'rafiq-3d.css?v=1';

  function saved() { try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; } }

  function ensureCss() {
    if (document.querySelector('link[data-r3d]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = CSS; l.setAttribute('data-r3d', '1');
    (document.head || root).appendChild(l);
  }

  function broadcast(on) {
    try {
      var frames = document.querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i++) {
        try { frames[i].contentWindow.postMessage({ type: 'rafiq:3d', on: on }, '*'); } catch (e) {}
      }
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'rafiq:3d', on: on }, '*');
    } catch (e) {}
  }

  function apply(on, opts) {
    on = !!on;
    if (on) root.setAttribute('data-rafiq-3d', 'on'); else root.removeAttribute('data-rafiq-3d');
    if (on) enableTilt(); else disableTilt();
    syncSwitches(on);
    if (!(opts && opts.silent)) {
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
      broadcast(on);
    }
    try { window.dispatchEvent(new CustomEvent('rafiq3dchange', { detail: { on: on } })); } catch (e) {}
    return on;
  }

  function syncSwitches(on) {
    var c = document.getElementById('rs3dChk'); if (c) c.checked = on;
    var h = document.getElementById('rs3dHint');
    if (h) h.textContent = on ? 'مفعّل — الأزرار والبطاقات بارزة وتتحرك عند اللمس.' : 'متوقف — الشكل المسطّح المعتاد.';
  }

  /* ---------- إمالة خفيفة للبطاقات عند اللمس/المرور ---------- */
  var tiltOn = false, SEL = '.home-tile,.item-card,.lib-card,.ach-card,.rd-card,.rn-card,.rm-prayer-card,.zk-card,.mushaf-card,.pcard';
  function onMove(e) {
    var t = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!t) return;
    var p = e.touches ? e.touches[0] : e, r = t.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var x = (p.clientX - r.left) / r.width - .5, y = (p.clientY - r.top) / r.height - .5;
    t.classList.add('r3d-tilt');
    t.style.setProperty('--r3d-ry', (x * 9).toFixed(2) + 'deg');
    t.style.setProperty('--r3d-rx', (-y * 9).toFixed(2) + 'deg');
  }
  function onLeave(e) {
    var t = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!t) return;
    t.style.setProperty('--r3d-ry', '0deg'); t.style.setProperty('--r3d-rx', '0deg');
    setTimeout(function () { t.classList.remove('r3d-tilt'); }, 200);
  }
  function enableTilt() {
    if (tiltOn) return; tiltOn = true;
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave, { passive: true });
    document.addEventListener('pointerup', onLeave, { passive: true });
    document.addEventListener('pointercancel', onLeave, { passive: true });
  }
  function disableTilt() {
    if (!tiltOn) return; tiltOn = false;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerout', onLeave);
    document.removeEventListener('pointerup', onLeave);
    document.removeEventListener('pointercancel', onLeave);
  }

  ensureCss();
  apply(saved(), { silent: true });

  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(e.newValue === 'on', { silent: true }); });
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d && d.type === 'rafiq:3d') {
      apply(!!d.on, { silent: true });
      try { localStorage.setItem(KEY, d.on ? 'on' : 'off'); } catch (er) {}
      /* مرّر للأبناء (iframe داخل iframe) */
      try { var fr = document.querySelectorAll('iframe'); for (var i = 0; i < fr.length; i++) fr[i].contentWindow.postMessage({ type: 'rafiq:3d', on: !!d.on }, '*'); } catch (er) {}
    }
  });
  document.addEventListener('DOMContentLoaded', function () { syncSwitches(saved()); });

  window.Rafiq3D = {
    get: function () { return root.getAttribute('data-rafiq-3d') === 'on'; },
    set: function (v) { return apply(v); },
    toggle: function () { return apply(!window.Rafiq3D.get()); }
  };
})();
