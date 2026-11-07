/* ربط زر «السيرة النبوية» (ilm.html سابقًا) بالكتاب الكامل في book.html */
(function () {
  'use strict';

  function openIlmApp() {
    if (typeof window.openSeerahApp === 'function') { window.openSeerahApp(); return; }
    if (typeof window.rafiqHubHide === 'function') window.rafiqHubHide();
    var ov = document.getElementById('ilmOverlay');
    var fr = document.getElementById('ilmFrame');
    if (!ov || !fr) return;
    ov.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { ov.style.opacity = '1'; });
    if (!fr._ilmLoaded) {
      fr._ilmLoaded = true;
      var t = '';
      try { t = '&theme=' + (localStorage.getItem('rm_theme') === 'dark' ? 'dark' : 'light'); } catch (e) {}
      fr.src = 'book.html?book=seerah' + t;
    }
  }

  function closeIlmApp() {
    var ov = document.getElementById('ilmOverlay');
    if (!ov) return;
    ov.style.opacity = '0';
    setTimeout(function () {
      ov.style.display = 'none';
      document.body.style.overflow = '';
      if (typeof window.rafiqHubRestore === 'function') window.rafiqHubRestore();
    }, 220);
  }

  window.openIlmApp = openIlmApp;
  window.closeIlmApp = closeIlmApp;
  window.addEventListener('message', function (e) {
    if (e.data === 'closeIlm' || e.data === 'ilm:close' || e.data === 'book:close') closeIlmApp();
  });
})();
