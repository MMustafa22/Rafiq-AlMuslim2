/* ربط كتاب «قصص الأنبياء لابن كثير» بالصفحة الرئيسية لرفيق المسلم */
(function () {
  'use strict';
  var SRC = 'qasas.html?v=1';

  function build() {
    if (document.getElementById('qasasOverlay')) return;
    var ov = document.createElement('div');
    ov.id = 'qasasOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10000;display:none;flex-direction:column;background:#fbf7ef;opacity:0;transition:opacity .22s ease';
    ov.innerHTML =
      '<iframe id="qasasFrame" src="" title="قصص الأنبياء لابن كثير" loading="lazy" style="flex:1;width:100%;border:0;background:#fbf7ef" allowfullscreen></iframe>';
    document.body.appendChild(ov);
  }

  function openQasasApp() {
    build();
    if (typeof window.rafiqHubHide === 'function') window.rafiqHubHide();
    var ov = document.getElementById('qasasOverlay');
    var fr = document.getElementById('qasasFrame');
    if (!ov || !fr) return;
    ov.style.display = 'flex';
    ov.style.opacity = '0';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { ov.style.opacity = '1'; });
    if (!fr._qLoaded) {
      fr._qLoaded = true;
      var t = '';
      try { t = (localStorage.getItem('rm_theme') === 'light') ? '&theme=light' : '&theme=dark'; } catch (e) {}
      fr.src = SRC + t;
    }
  }

  function closeQasasApp() {
    var ov = document.getElementById('qasasOverlay');
    if (!ov) return;
    ov.style.opacity = '0';
    setTimeout(function () {
      ov.style.display = 'none';
      document.body.style.overflow = '';
      if (typeof window.rafiqHubRestore === 'function') window.rafiqHubRestore();
    }, 220);
  }

  window.openQasasApp = openQasasApp;
  window.closeQasasApp = closeQasasApp;

  window.addEventListener('message', function (e) {
    if (e.data === 'qasas:close' || e.data === 'closeQasas') closeQasasApp();
    var d = e.data || {};
    if (d && d.type === 'rafiq:open' && d.app === 'qasas') {
      if (typeof window.closeIlmApp === 'function') {
        window.closeIlmApp();
        setTimeout(openQasasApp, 260);
      } else openQasasApp();
    }
  });

  function bind() {
    var tile = document.querySelector('.home-tile.t-qasas');
    if (tile && !tile._qasasBound) {
      tile._qasasBound = true;
      tile.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openQasasApp();
      }, false);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();

  /* في حال أُضيف الزر لاحقًا */
  setTimeout(bind, 1200);
})();
