/* ربط كتابي «السيرة النبوية» و«الفقه الميسّر» بالصفحة الرئيسية */
(function () {
  'use strict';
  var BOOKS = {
    seerah: { title: 'السيرة النبوية', icon: '🕌', badge: '٤١٧ بابًا', color: '15,93,67' },
    fiqh: { title: 'الفقه الميسّر', icon: '⚖️', badge: '١١ بابًا · ٩٧ مسألة', color: '163,120,19' }
  };

  function build(which) {
    var id = 'ov_' + which;
    if (document.getElementById(id)) return;
    var cfg = BOOKS[which];
    var ov = document.createElement('div');
    ov.id = id;
    ov.style.cssText = 'position:fixed;inset:0;z-index:10000;display:none;flex-direction:column;background:#fbf7ef;opacity:0;transition:opacity .22s ease';
    ov.innerHTML =
      '<iframe id="fr_' + which + '" title="' + cfg.title + '" loading="lazy" style="flex:1;width:100%;border:0;background:transparent" allowfullscreen></iframe>';
    document.body.appendChild(ov);
  }

  function openBook(which) {
    if (!BOOKS[which]) return;
    build(which);
    if (typeof window.rafiqHubHide === 'function') window.rafiqHubHide();
    var ov = document.getElementById('ov_' + which);
    var fr = document.getElementById('fr_' + which);
    if (!ov || !fr) return;
    ov.style.display = 'flex';
    ov.style.opacity = '0';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { ov.style.opacity = '1'; });
    if (!fr._loaded) {
      fr._loaded = true;
      var t = '';
      try { t = '&theme=' + (localStorage.getItem('rm_theme') === 'dark' ? 'dark' : 'light'); } catch (e) {}
      fr.src = 'book.html?book=' + which + t + '&v=4';
    }
  }

  function closeBook(which) {
    var ov = document.getElementById('ov_' + which);
    if (!ov) return;
    ov.style.opacity = '0';
    setTimeout(function () {
      ov.style.display = 'none';
      document.body.style.overflow = '';
      if (typeof window.rafiqHubRestore === 'function') window.rafiqHubRestore();
    }, 220);
  }

  window.openSeerahApp = function () { openBook('seerah'); };
  window.openFiqhApp = function () { openBook('fiqh'); };
  window.closeBook = closeBook;

  window.addEventListener('message', function (e) {
    if (e.data === 'book:close') {
      var o1 = document.getElementById('ov_seerah'), o2 = document.getElementById('ov_fiqh');
      if (o1 && o1.style.display === 'flex') closeBook('seerah');
      if (o2 && o2.style.display === 'flex') closeBook('fiqh');
    }
    var d = e.data || {};
    if (d && d.type === 'rafiq:open' && (d.app === 'seerah' || d.app === 'fiqh')) {
      if (typeof window.closeIlmApp === 'function') window.closeIlmApp();
      setTimeout(function () { openBook(d.app); }, 260);
    }
  });

  function applyShellTheme(){
    var light=false;
    try{light=(localStorage.getItem('rm_theme')||'dark')==='light'}catch(e){}
    ['ov_seerah','ov_fiqh'].forEach(function(id){
      var ov=document.getElementById(id);if(!ov)return;
      ov.style.background=light?'#fbf7ef':'#080e1a';
    });
  }
  function bind() {
    applyShellTheme();
    window.addEventListener('rafiqthemechange',applyShellTheme);
    var map = [['.home-tile.t-seerah', 'seerah'], ['.home-tile.t-fiqh', 'fiqh']];
    map.forEach(function (m) {
      var el = document.querySelector(m[0]);
      if (el && !el._bound) {
        el._bound = true;
        el.addEventListener('click', function (ev) {
          ev.preventDefault(); ev.stopPropagation(); openBook(m[1]);
        }, false);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
  setTimeout(bind, 1200);
})();
