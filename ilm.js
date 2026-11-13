/* ============================================================
   المكتبة الإيمانية — ilm.js
   تطبيق صفحة واحدة (SPA): السيرة · الأنبياء · الفقه
   بحث فوري + وضع ليلي + تنقّل بالهاش (يدعم زر الرجوع)
   ============================================================ */
(function () {
  'use strict';

  var SEERAH = window.ILM_SEERAH || { intro: '', stations: [] };
  var ANBIYA = window.ILM_ANBIYA || [];
  var FIQH = window.ILM_FIQH || { intro: '', chapters: [] };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var escRe = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };

  /* ---------------- أدوات ---------------- */
  function blocksText(blocks) {
    return (blocks || []).map(function (b) {
      return b.t === 'list' ? (b.v || []).join(' ') : (b.v || '');
    }).join(' ');
  }
  function words(t) { return (t || '').trim().split(/\s+/).filter(Boolean).length; }
  function mins(w) { return Math.max(1, Math.round(w / 180)); }
  function arNum(n) { return Number(n).toLocaleString('ar-EG'); }

  function blocksHTML(blocks) {
    return (blocks || []).map(function (b) {
      if (b.t === 'h') return '<h3>' + esc(b.v) + '</h3>';
      if (b.t === 'p') return '<p>' + b.v + '</p>';
      if (b.t === 'quote') {
        return '<blockquote class="quote">' + b.v + (b.src ? '<cite>' + esc(b.src) + '</cite>' : '') + '</blockquote>';
      }
      if (b.t === 'list') {
        return '<ul>' + (b.v || []).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      }
      if (b.t === 'note') return '<div class="callout">' + b.v + '</div>';
      return '';
    }).join('');
  }
  function lessonsHTML(list, title) {
    if (!list || !list.length) return '';
    return '<div class="lessons"><h3>' + esc(title || 'الدروس المستفادة والفوائد التربوية') + '</h3><ol>' +
      list.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol></div>';
  }

  /* ---------------- بناء فهرس البحث ---------------- */
  var INDEX = [];
  (function buildIndex() {
    SEERAH.stations.forEach(function (st) {
      INDEX.push({
        kind: 'seerah', id: st.id, tag: 'السيرة',
        title: st.stage + ' — ' + st.title,
        sub: st.sub,
        text: [st.title, st.sub, blocksText(st.blocks), (st.lessons || []).join(' ')].join(' ')
      });
    });
    ANBIYA.forEach(function (p) {
      INDEX.push({
        kind: 'anbiya', id: p.id, tag: 'قصص الأنبياء',
        title: 'قصة ' + p.name + ' — ' + (p.epithet || ''),
        sub: p.era + ' · ' + p.place,
        text: [p.name, p.epithet, p.summary, p.era, p.place, blocksText(p.story), (p.lessons || []).join(' ')].join(' ')
      });
    });
    FIQH.chapters.forEach(function (ch) {
      (ch.qa || []).forEach(function (item, i) {
        INDEX.push({
          kind: 'fiqh', id: ch.id, qi: i, tag: 'الفقه',
          title: item.q,
          sub: ch.title,
          text: [item.q, item.a, item.dalil || ''].join(' ')
        });
      });
    });
  })();

  /* ---------------- الوضع الليلي ---------------- */
  var root = document.documentElement;
  function applyTheme(mode) {
    if (mode === 'dark') root.setAttribute('data-theme', 'dark');
    else { root.removeAttribute('data-theme'); root.setAttribute('data-mode', 'light'); }
    root.setAttribute('data-mode', mode);
    try { localStorage.setItem('ilm_theme', mode); localStorage.setItem('rm_theme', mode); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0b1220' : '#fbf6ec');
  }
  window.IlmTheme = { set: applyTheme, get: function () { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; } };
  /* الوضع يأتي من إعدادات التطبيق كله */
  (function () {
    var m = null;
    try { m = new URLSearchParams(location.search).get('theme') || localStorage.getItem('rm_theme'); } catch (e) {}
    if (!m) { try { m = localStorage.getItem('ilm_theme'); } catch (e) {} }
    applyTheme(m === 'dark' ? 'dark' : 'light');
  })();
  window.addEventListener('storage', function (e) {
    if (e.key === 'rm_theme' && e.newValue) applyTheme(e.newValue === 'dark' ? 'dark' : 'light');
  });
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d && d.type === 'rafiq:theme') applyTheme(d.mode === 'dark' ? 'dark' : 'light');
  });

  /* ---------------- التنقّل (SPA + hash) ---------------- */
  var views = { home: '#view-home', seerah: '#view-seerah', anbiya: '#view-anbiya', fiqh: '#view-fiqh', search: '#view-search' };
  var current = 'home';

  function setActive(viewName) {
    Object.keys(views).forEach(function (k) { $(views[k]).classList.toggle('is-active', k === viewName); });
    $$('.nav-pill').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-go') === viewName); });
    current = viewName;
  }

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }
  function goView(name) { go('#/' + name); }

  function route() {
    var h = decodeURIComponent(location.hash || '#/home');
    var raw = h.replace(/^#\/?/, '');
    var qi = raw.indexOf('?');
    var path = qi >= 0 ? raw.slice(0, qi) : raw;
    var query = qi >= 0 ? raw.slice(qi + 1) : '';
    var parts = path.split('/');
    var view = parts[0] || 'home';
    if (view === 'search') {
      var term = '';
      query.split('&').forEach(function (kv) {
        var p = kv.split('=');
        if (p[0] === 'q') term = p.slice(1).join('=');
      });
      $('#q').value = term;
      renderSearchView(term);
      setActive('search');
    } else if (view === 'seerah') {
      setActive('seerah');
      if (parts[1]) openStation(parts[1], false);
      else showStationList();
    } else if (view === 'anbiya') {
      setActive('anbiya');
      if (parts[1]) openProphet(parts[1], false);
      else showAnbiyaGrid();
    } else if (view === 'fiqh') {
      setActive('fiqh');
      renderFiqh(parts[1] || '', null, false);
    } else {
      setActive('home');
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------------- الرئيسية: الإحصاءات ---------------- */
  function fillHome() {
    var seerahWords = SEERAH.stations.reduce(function (a, s) { return a + words(blocksText(s.blocks)); }, 0);
    var anbiyaWords = ANBIYA.reduce(function (a, p) { return a + words(p.summary) + words(blocksText(p.story)); }, 0);
    var qaCount = FIQH.chapters.reduce(function (a, c) { return a + (c.qa || []).length; }, 0);

    var stats = [
      ['7', 'محطات للسيرة'],
      [arNum(ANBIYA.length), 'نبيًّا ورسولًا'],
      [arNum(qaCount), 'سؤالًا فقهيًّا'],
      [arNum(seerahWords + anbiyaWords), 'كلمة في المكتبة']
    ];
    $('#heroStats').innerHTML = stats.map(function (s) {
      return '<div class="hstat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>';
    }).join('');

    $('#metaSeerah').innerHTML = '<span class="chip">7 محطات</span><span class="chip">' + arNum(mins(seerahWords)) + ' دقيقة قراءة</span>';
    $('#metaAnbiya').innerHTML = '<span class="chip">' + arNum(ANBIYA.length) + ' نبيًّا</span><span class="chip">' + arNum(mins(anbiyaWords)) + ' دقيقة قراءة</span>';
    $('#metaFiqh').innerHTML = '<span class="chip">' + arNum(FIQH.chapters.length) + ' أبواب</span><span class="chip">' + arNum(qaCount) + ' سؤال وجواب</span>';
    $('#seerahHint').textContent = 'اضغط على أي محطة لقراءتها كاملة · ' + arNum(SEERAH.stations.length) + ' محطات';
    $('#anbiyaHint').textContent = 'مرتّبة زمنيًّا من آدم إلى محمد ﷺ · ' + arNum(ANBIYA.length) + ' نبيًّا';
    $('#fiqhHint').textContent = arNum(FIQH.chapters.length) + ' أبواب · ' + arNum(qaCount) + ' سؤال وجواب مع الدليل';
  }

  /* ---------------- السيرة ---------------- */
  function showStationList() {
    $('#stationList').hidden = false;
    $('#seerahReader').hidden = true;
    $('#seerahAll').hidden = true;
  }

  function renderStations() {
    $('#stationList').innerHTML = SEERAH.stations.map(function (st, i) {
      return '<button class="station" type="button" data-station="' + st.id + '">' +
        '<span class="st-num">' + (i + 1) + '</span>' +
        '<span class="st-txt"><span class="st-kicker">' + esc(st.stage) + '</span>' +
        '<span class="st-title">' + esc(st.title) + '</span>' +
        '<span class="st-sub">' + esc(st.sub) + '</span></span>' +
        '<span class="st-arrow" aria-hidden="true">←</span></button>';
    }).join('');
  }

  function findStation(id) {
    for (var i = 0; i < SEERAH.stations.length; i++) if (SEERAH.stations[i].id === id) return { st: SEERAH.stations[i], i: i };
    return null;
  }

  function openStation(id, setHash) {
    var f = findStation(id);
    if (!f) { showStationList(); return; }
    if (setHash !== false) { go('#/seerah/' + id); return; }
    var st = f.st, idx = f.i;
    var total = SEERAH.stations.length;
    var prev = SEERAH.stations[idx - 1], next = SEERAH.stations[idx + 1];

    $('#stationList').hidden = true;
    $('#seerahAll').hidden = false;
    var r = $('#seerahReader');
    r.hidden = false;
    r.innerHTML =
      '<div class="reader-head"><div class="rh-kicker">' + esc(st.stage) + ' · ' + (idx + 1) + ' من ' + total + '</div>' +
      '<h2>' + esc(st.title) + '</h2><div class="rh-sub">' + esc(st.sub) + '</div></div>' +
      '<div class="reader-body">' + (st.intro ? '<p>' + st.intro + '</p>' : '') + blocksHTML(st.blocks) +
      lessonsHTML(st.lessons, 'الدروس والعبر من هذه المحطة') + '</div>' +
      '<div class="reader-nav">' +
      '<button class="rn-btn" type="button" data-station-nav="' + (prev ? prev.id : '') + '"' + (prev ? '' : ' disabled') + '>← ' + (prev ? esc(prev.title) : 'لا يوجد سابق') + '</button>' +
      '<button class="rn-btn" type="button" data-station-nav="' + (next ? next.id : '') + '"' + (next ? '' : ' disabled') + '>' + (next ? esc(next.title) : 'نهاية المحطات') + ' →</button>' +
      '</div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- الأنبياء ---------------- */
  var GROUPS = {
    early: 'قبل الطوفان',
    after: 'من بعد الطوفان',
    israel: 'أنبياء بني إسرائيل',
    final: 'خاتم النبيين'
  };
  var activeGroup = 'all';

  function showAnbiyaGrid() {
    $('#anbiyaGrid').hidden = false;
    $('#anbiyaReader').hidden = true;
    $('#anbiyaBar').hidden = false;
    $('#anbiyaAll').hidden = true;
    renderAnbiyaGrid();
  }

  function renderAnbiyaBar() {
    var chips = ['all'].concat(Object.keys(GROUPS));
    $('#anbiyaBar').innerHTML = chips.map(function (g) {
      var n = g === 'all' ? ANBIYA.length : ANBIYA.filter(function (p) { return p.group === g; }).length;
      var label = g === 'all' ? 'كل الأنبياء' : GROUPS[g];
      return '<button class="topic' + (activeGroup === g ? ' is-active' : '') + '" type="button" data-group="' + g + '">' +
        esc(label) + ' <b>' + n + '</b></button>';
    }).join('');
  }

  function renderAnbiyaGrid() {
    renderAnbiyaBar();
    var list = ANBIYA.filter(function (p) { return activeGroup === 'all' || p.group === activeGroup; });
    $('#anbiyaGrid').innerHTML = list.map(function (p) {
      return '<button class="pcard" type="button" data-prophet="' + p.id + '">' +
        '<span class="pc-top"><span class="pc-order">' + p.order + '</span>' +
        '<span><span class="pc-name">' + esc(p.name) + '</span>' +
        '<span class="pc-tag">' + esc(p.epithet || '') + '</span></span></span>' +
        '<span class="pc-sum">' + esc(p.summary) + '</span>' +
        '<span class="pc-meta"><span>' + esc(p.era) + '</span><span>' + esc(p.place) + '</span></span></button>';
    }).join('');
  }

  function findProphet(id) {
    for (var i = 0; i < ANBIYA.length; i++) if (ANBIYA[i].id === id) return { p: ANBIYA[i], i: i };
    return null;
  }

  function openProphet(id, setHash) {
    var f = findProphet(id);
    if (!f) { showAnbiyaGrid(); return; }
    if (setHash !== false) { go('#/anbiya/' + id); return; }
    var p = f.p, idx = f.i;
    var prev = ANBIYA[idx - 1], next = ANBIYA[idx + 1];

    $('#anbiyaGrid').hidden = true;
    $('#anbiyaBar').hidden = true;
    $('#anbiyaAll').hidden = false;
    var r = $('#anbiyaReader');
    r.hidden = false;
    r.innerHTML =
      '<div class="reader-head"><div class="rh-kicker">القصة ' + (idx + 1) + ' من ' + ANBIYA.length + ' · ' + esc(GROUPS[p.group] || '') + '</div>' +
      '<h2>' + esc(p.name) + ' <span style="font-size:.62em;color:var(--gold)">' + esc(p.honorific || 'عليه السلام') + '</span></h2>' +
      '<div class="rh-sub">' + esc(p.epithet || '') + '</div></div>' +
      '<div class="reader-body">' +
      '<h3>نبذة عن النبي</h3><p>' + p.summary + '</p>' +
      '<div class="callout"><b>زمان البعثة:</b> ' + p.era + '<br><b>مكان البعثة:</b> ' + p.place + '</div>' +
      (p.quran ? '<div class="quote">' + p.quran + '</div>' : '') +
      '<h3>سرد الأحداث</h3>' + blocksHTML(p.story) +
      lessonsHTML(p.lessons, 'الدروس المستفادة والفوائد التربوية') +
      '</div>' +
      '<div class="reader-nav">' +
      '<button class="rn-btn" type="button" data-prophet-nav="' + (prev ? prev.id : '') + '"' + (prev ? '' : ' disabled') + '>← ' + (prev ? esc(prev.name) : 'البداية') + '</button>' +
      '<button class="rn-btn" type="button" data-prophet-nav="' + (next ? next.id : '') + '"' + (next ? '' : ' disabled') + '>' + (next ? esc(next.name) : 'النهاية') + ' →</button>' +
      '</div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- الفقه ---------------- */
  function renderFiqh(chapterId, openIndex, setHash) {
    if (setHash !== false && chapterId) { go('#/fiqh/' + chapterId); return; }
    $('#fiqhClose').hidden = !chapterId;
    var chips = [{ id: '', title: 'كل الأبواب' }].concat(FIQH.chapters.map(function (c) { return { id: c.id, title: c.title }; }));
    $('#fiqhBar').innerHTML = chips.map(function (c) {
      return '<button class="topic' + ((c.id || '') === (chapterId || '') ? ' is-active' : '') + '" type="button" data-chapter="' + c.id + '">' + esc(c.title) + '</button>';
    }).join('');

    var chapters = chapterId ? FIQH.chapters.filter(function (c) { return c.id === chapterId; }) : FIQH.chapters;
    var html = '';
    if (!chapterId && FIQH.intro) html += '<div class="note glass" style="margin:0 0 4px">' + FIQH.intro + '</div>';
    chapters.forEach(function (ch) {
      html += '<div class="note glass" style="margin:10px 0 0;padding:14px 18px;display:flex;gap:10px;align-items:center">' +
        '<span style="font-size:1.3rem">' + (ch.icon || '📘') + '</span><div><b style="font-family:Cairo,sans-serif;font-weight:800;font-size:1.06rem;color:var(--ink)">' + esc(ch.title) + '</b>' +
        (ch.sub ? '<div style="font-size:.78rem;color:var(--muted)">' + esc(ch.sub) + '</div>' : '') + '</div></div>';
      html += '<div class="fiqh-body">' + (ch.qa || []).map(function (item, i) {
        return '<details class="qa" data-chapter-id="' + ch.id + '" data-qi="' + i + '"' + (openIndex === i ? ' open' : '') + '>' +
          '<summary>' + esc(item.q) + '</summary>' +
          '<div class="a"><p>' + item.a + '</p>' +
          (item.dalil ? '<span class="dalil"><b>الدليل:</b> ' + item.dalil + '</span>' : '') + '</div></details>';
      }).join('') + '</div>';
    });
    $('#fiqhBody').innerHTML = html;

    if (openIndex != null) {
      var el = $('.qa[data-chapter-id="' + chapterId + '"][data-qi="' + openIndex + '"]');
      if (el) setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------------- البحث ---------------- */
  var qInput = $('#q'), panel = $('#searchPanel'), spList = $('#spList'), spCount = $('#spCount');

  function search(term) {
    var t = term.trim();
    if (t.length < 2) return [];
    var parts = t.split(/\s+/).filter(Boolean).map(escRe);
    var re = new RegExp('(' + parts.join('|') + ')', 'gi');
    return INDEX.map(function (item) {
      var hay = item.text;
      var score = 0;
      var all = true;
      parts.forEach(function (p) {
        var m = hay.match(new RegExp(p, 'gi'));
        if (!m) all = false; else score += m.length;
      });
      if (!all) {
        if (new RegExp(parts.join('|'), 'i').test(item.title)) { all = true; score += 2; } else return null;
      }
      if (!all) return null;
      var source = item.kind === 'fiqh' ? item.text : item.text;
      var pos = hay.search(re);
      var start = Math.max(0, pos - 60), snip = hay.slice(start, pos + 130).replace(/\s+/g, ' ').trim();
      snip = esc(snip).replace(new RegExp(escRe(parts.join('|')), 'gi'), function (m) { return '<mark>' + m + '</mark>'; });
      return { item: item, score: score, snip: (start > 0 ? '… ' : '') + snip + ' …' };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; });
  }

  function highlight(text, term) {
    var t = term.trim();
    if (!t) return esc(text);
    var parts = t.split(/\s+/).filter(Boolean).map(escRe);
    return esc(text).replace(new RegExp('(' + parts.join('|') + ')', 'gi'), '<mark>$1</mark>');
  }

  function resultHTML(res, term, idx) {
    var it = res.item;
    var tagClass = it.kind === 'seerah' ? 't-seerah' : it.kind === 'anbiya' ? 't-anbiya' : 't-fiqh';
    return '<button class="sp-item" type="button" data-result="' + idx + '">' +
      '<div class="sp-title"><span class="sp-tag ' + tagClass + '">' + it.tag + '</span>' + highlight(it.title, term) + '</div>' +
      '<div class="sp-snip">' + highlight(it.sub || '', term) + ' · ' + res.snip + '</div></button>';
  }

  var lastResults = [];

  function runSearch(term, showPanel) {
    lastResults = search(term);
    spCount.textContent = lastResults.length;
    if (!lastResults.length) {
      spList.innerHTML = '<div class="sp-empty">لا توجد نتائج مطابقة لـ «' + esc(term) + '». جرّب كلمة أخرى مثل: بدر، يوسف، الوضوء.</div>';
    } else {
      spList.innerHTML = lastResults.slice(0, 40).map(function (r, i) { return resultHTML(r, term, i); }).join('');
    }
    $('#qClear').hidden = !term;
    if (showPanel !== false) panel.hidden = false;
  }

  function openResult(i) {
    var r = lastResults[i];
    if (!r) return;
    panel.hidden = true;
    var it = r.item;
    if (it.kind === 'seerah') go('#/seerah/' + it.id);
    else if (it.kind === 'anbiya') go('#/anbiya/' + it.id);
    else { activeChapterTarget = { chapter: it.id, qi: it.qi }; go('#/fiqh/' + it.id); }
  }
  var activeChapterTarget = null;

  function renderSearchView(term) {
    var res = search(term);
    $('#searchHint').textContent = term ? res.length + ' نتيجة عن «' + term + '»' : 'اكتب كلمتين على الأقل للبحث';
    $('#searchGrid').innerHTML = res.length
      ? res.map(function (r) {
          var it = r.item;
          var tagClass = it.kind === 'seerah' ? 't-seerah' : it.kind === 'anbiya' ? 't-anbiya' : 't-fiqh';
          return '<button class="res-card" type="button" data-sres="' + encodeURIComponent(JSON.stringify(it)) + '">' +
            '<span class="res-title"><span class="sp-tag ' + tagClass + '">' + it.tag + '</span>' + highlight(it.title, term) + '</span>' +
            '<span class="res-snip">' + r.snip + '</span></button>';
        }).join('')
      : '<div class="note glass" style="grid-column:1/-1">لا توجد نتائج. جرّب كلمات أبسط أو ابحث في قسم واحد.</div>';
  }

  function goToIndexItem(it) {
    if (it.kind === 'seerah') go('#/seerah/' + it.id);
    else if (it.kind === 'anbiya') go('#/anbiya/' + it.id);
    else { activeChapterTarget = { chapter: it.id, qi: it.qi }; go('#/fiqh/' + it.id); }
  }

  qInput && qInput.addEventListener('input', function () {
    var v = qInput.value;
    if (v.trim().length < 2) { panel.hidden = true; $('#qClear').hidden = !v; return; }
    runSearch(v, true);
  });
  qInput && qInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var v = qInput.value.trim();
      panel.hidden = true;
      if (v) go('#/search?q=' + encodeURIComponent(v));
    } else if (e.key === 'Escape') { panel.hidden = true; qInput.blur(); }
  });
  $('#qClear') && $('#qClear').addEventListener('click', function () {
    qInput.value = ''; panel.hidden = true; $('#qClear').hidden = true; qInput.focus();
    if (current === 'search') go('#/home');
  });
  $('#spClose') && $('#spClose').addEventListener('click', function () { panel.hidden = true; });
  $('#searchClear') && $('#searchClear').addEventListener('click', function () {
    qInput.value = ''; $('#qClear').hidden = true; go('#/home');
  });
  spList && spList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-result]');
    if (b) openResult(+b.getAttribute('data-result'));
  });
  $('#searchGrid') && $('#searchGrid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sres]');
    if (b) goToIndexItem(JSON.parse(decodeURIComponent(b.getAttribute('data-sres'))));
  });
  document.addEventListener('click', function (e) {
    if (panel.hidden) return;
    if (panel.contains(e.target) || (e.target.closest && e.target.closest('.search-wrap'))) return;
    panel.hidden = true;
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); qInput.focus(); qInput.select(); }
  });

  /* ---------------- أحداث عامة ---------------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]');
    if (t) { goView(t.getAttribute('data-go')); return; }

    var st = e.target.closest('[data-station]');
    if (st) { openStation(st.getAttribute('data-station')); return; }

    var stn = e.target.closest('[data-station-nav]');
    if (stn) { var sid = stn.getAttribute('data-station-nav'); if (sid) openStation(sid); return; }

    var pr = e.target.closest('[data-prophet]');
    if (pr) { openProphet(pr.getAttribute('data-prophet')); return; }

    var pn = e.target.closest('[data-prophet-nav]');
    if (pn) { var pid = pn.getAttribute('data-prophet-nav'); if (pid) openProphet(pid); return; }

    var gr = e.target.closest('[data-group]');
    if (gr) { activeGroup = gr.getAttribute('data-group'); renderAnbiyaGrid(); return; }

    var ch = e.target.closest('[data-chapter]');
    if (ch) { var cid = ch.getAttribute('data-chapter'); if (cid) go('#/fiqh/' + cid); else go('#/fiqh'); return; }
  });

  $('#seerahAll') && $('#seerahAll').addEventListener('click', function () { go('#/seerah'); });
  $('#anbiyaAll') && $('#anbiyaAll').addEventListener('click', function () {
    activeGroup = 'all'; go('#/anbiya');
  });
  $('#fiqhClose') && $('#fiqhClose').addEventListener('click', function () { go('#/fiqh'); });

  window.addEventListener('hashchange', function () {
    var m = /^#\/fiqh\/([^/?]+)/.exec(decodeURIComponent(location.hash));
    if (m && activeChapterTarget && activeChapterTarget.chapter === m[1]) {
      var target = activeChapterTarget; activeChapterTarget = null;
      setActive('fiqh'); renderFiqh(target.chapter, target.qi, false);
      return;
    }
    activeChapterTarget = null;
    route();
  });

  /* ---------------- شريط القراءة + زر الأعلى ---------------- */
  var readBar = $('#readBar'), toTop = $('#toTop');
  window.addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? (window.scrollY / h) * 100 : 0;
    if (readBar) readBar.style.width = p.toFixed(1) + '%';
    if (toTop) toTop.hidden = window.scrollY < 420;
  }, { passive: true });
  toTop && toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------------- التهيئة ---------------- */
  function init() {
    fillHome();
    renderStations();
    renderAnbiyaGrid();
    renderFiqh('', null, false);
    if (!location.hash) location.replace('#/home');
    route();
    document.title = 'المكتبة الإيمانية — السيرة النبوية وقصص الأنبياء والفقه الميسر';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* رسائل من التطبيق الأم */
  window.addEventListener('message', function (e) {
    if (e.data === 'ilm:close') { try { history.back(); } catch (err) {} }
  });

  /* فتح كتاب قصص الأنبياء الكامل */
  var banner = document.getElementById('qasasBanner');
  banner && banner.addEventListener('click', function (ev) {
    ev.preventDefault();
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'rafiq:open', app: 'qasas' }, '*'); return; } catch (e) {}
    }
    location.href = 'qasas.html';
  });
})();
