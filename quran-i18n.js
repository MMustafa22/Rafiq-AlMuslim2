/* Rafiq Quran: interface direction + page-by-page meaning translations.
   Qur'an translations are fetched from named editions; no AI-generated scripture text. */
(function () {
  'use strict';
  const LANGS = {
    ar: { dir: 'rtl', edition: 'quran-uthmani', title: 'ترجمة معاني الآيات', subtitle: 'تُعرض بجانب صفحة المصحف', label: 'لغة الترجمة', loading: 'جارٍ تحميل ترجمة الصفحة…', error: 'تعذر تحميل الترجمة. تحقق من الاتصال ثم أعد المحاولة.', retry: 'إعادة المحاولة', toolbar: ['🎯 ختمة', '💎 حفظ القرآن', '🔍 بحث الآيات', '🔖 علاماتي', '📊 إحصائياتي', '📖 المصحف', '⬇ تحميل'], source: 'الترجمة لمعاني الآيات وليست بديلًا عن النص العربي.', prev: '◀ السابقة', next: 'التالية ▶', save: '🔖 حفظ علامة', marks: '📚 علاماتي', surahs: 'السور (114)', juzs: 'الأجزاء (30)', search: 'بحث' },
    en: { dir: 'ltr', edition: 'en.sahih', title: 'Verse meanings', subtitle: 'Shown beside the Mushaf page', label: 'Translation language', loading: 'Loading page translation…', error: 'Could not load the translation. Check your connection and retry.', retry: 'Retry', toolbar: ['🎯 Khatma plan', '💎 Memorization', '🔍 Search verses', '🔖 Bookmarks', '📊 Reading stats', '📖 Mushaf', '⬇ Download'], source: 'This is a translation of the meanings and does not replace the Arabic Qur’anic text.', prev: '◀ Previous', next: 'Next ▶', save: '🔖 Save bookmark', marks: '📚 Bookmarks', surahs: 'Surahs (114)', juzs: 'Juz (30)', search: 'Search' },
    ur: { dir: 'rtl', edition: 'ur.jalandhry', title: 'آیات کا ترجمہ', subtitle: 'مصحف کے صفحے کے ساتھ', label: 'ترجمے کی زبان', loading: 'صفحے کا ترجمہ لوڈ ہو رہا ہے…', error: 'ترجمہ نہیں مل سکا۔ انٹرنیٹ دیکھ کر دوبارہ کوشش کریں۔', retry: 'دوبارہ کوشش', toolbar: ['🎯 ختم قرآن', '💎 حفظ قرآن', '🔍 آیات تلاش', '🔖 میرے نشانات', '📊 مطالعہ اعداد', '📖 مصحف', '⬇ ڈاؤن لوڈ'], source: 'یہ آیات کے مفہوم کا ترجمہ ہے، عربی قرآنی متن کا متبادل نہیں۔', prev: '◀ پچھلا', next: 'اگلا ▶', save: '🔖 نشان محفوظ کریں', marks: '📚 میرے نشانات', surahs: 'سورتیں (114)', juzs: 'پارے (30)', search: 'تلاش' },
    fr: { dir: 'ltr', edition: 'fr.hamidullah', title: 'Sens des versets', subtitle: 'Affiché à côté de la page du Mushaf', label: 'Langue de traduction', loading: 'Chargement de la traduction…', error: 'Impossible de charger la traduction. Vérifiez la connexion puis réessayez.', retry: 'Réessayer', toolbar: ['🎯 Programme de lecture', '💎 Mémorisation', '🔍 Chercher un verset', '🔖 Signets', '📊 Statistiques', '📖 Mushaf', '⬇ Télécharger'], source: 'Cette traduction des sens ne remplace pas le texte coranique arabe.', prev: '◀ Précédent', next: 'Suivant ▶', save: '🔖 Enregistrer', marks: '📚 Signets', surahs: 'Sourates (114)', juzs: 'Juz (30)', search: 'Recherche' },
    hi: { dir: 'ltr', edition: 'hi.hindi', title: 'आयतों के अर्थ', subtitle: 'मुसहफ़ पृष्ठ के साथ दिखाया गया', label: 'अनुवाद की भाषा', loading: 'पृष्ठ का अनुवाद लोड हो रहा है…', error: 'अनुवाद लोड नहीं हो सका। इंटरनेट कनेक्शन जाँचकर फिर कोशिश करें।', retry: 'फिर कोशिश करें', toolbar: ['🎯 पाठ योजना', '💎 याद करना', '🔍 आयत खोजें', '🔖 बुकमार्क', '📊 पढ़ने के आँकड़े', '📖 मुसहफ़', '⬇ डाउनलोड'], source: 'यह आयतों के अर्थ का अनुवाद है, अरबी क़ुरआन के मूल पाठ का विकल्प नहीं।', prev: '◀ पिछला', next: 'अगला ▶', save: '🔖 बुकमार्क सहेजें', marks: '📚 बुकमार्क', surahs: 'सूरह (114)', juzs: 'पारे (30)', search: 'खोजें' },
    ru: { dir: 'ltr', edition: 'ru.kuliev', title: 'Смысл аятов', subtitle: 'Показано рядом со страницей мусхафа', label: 'Язык перевода', loading: 'Загрузка перевода страницы…', error: 'Не удалось загрузить перевод. Проверьте подключение и попробуйте снова.', retry: 'Повторить', toolbar: ['🎯 План чтения', '💎 Запоминание', '🔍 Поиск аятов', '🔖 Закладки', '📊 Статистика чтения', '📖 Мусхаф', '⬇ Скачать'], source: 'Это перевод смыслов аятов, а не замена арабскому тексту Корана.', prev: '◀ Назад', next: 'Далее ▶', save: '🔖 Сохранить закладку', marks: '📚 Закладки', surahs: 'Суры (114)', juzs: 'Джуз (30)', search: 'Поиск' },
    it: { dir: 'ltr', edition: 'it.piccardo', title: 'Significato dei versetti', subtitle: 'Visualizzato accanto alla pagina del Mushaf', label: 'Lingua della traduzione', loading: 'Caricamento della traduzione della pagina…', error: 'Impossibile caricare la traduzione. Controlla la connessione e riprova.', retry: 'Riprova', toolbar: ['🎯 Piano di lettura', '💎 Memorizzazione', '🔍 Cerca versetti', '🔖 Segnalibri', '📊 Statistiche', '📖 Mushaf', '⬇ Scarica'], source: 'Questa è una traduzione dei significati e non sostituisce il testo coranico arabo.', prev: '◀ Precedente', next: 'Successiva ▶', save: '🔖 Salva segnalibro', marks: '📚 Segnalibri', surahs: 'Sure (114)', juzs: 'Juz (30)', search: 'Cerca' },
    ja: { dir: 'ltr', edition: 'ja.japanese', title: 'クルアーンの意味', subtitle: 'ムスハフのページの横に表示', label: '翻訳の言語', loading: 'ページの翻訳を読み込み中…', error: '翻訳を読み込めませんでした。接続を確認して再試行してください。', retry: '再試行', toolbar: ['🎯 読書計画', '💎 暗記', '🔍 節を検索', '🔖 ブックマーク', '📊 読書統計', '📖 ムスハフ', '⬇ ダウンロード'], source: 'これは意味の翻訳であり、アラビア語のクルアーン本文に代わるものではありません。', prev: '◀ 前へ', next: '次へ ▶', save: '🔖 ブックマークを保存', marks: '📚 ブックマーク', surahs: 'スーラ (114)', juzs: 'ジュズ (30)', search: '検索' },
    zh: { dir: 'ltr', edition: 'zh.jian', title: '经文含义', subtitle: '显示在古兰经页面旁边', label: '翻译语言', loading: '正在加载本页译文…', error: '无法加载译文。请检查网络连接后重试。', retry: '重试', toolbar: ['🎯 诵读计划', '💎 背诵', '🔍 搜索经文', '🔖 书签', '📊 阅读统计', '📖 穆斯哈夫', '⬇ 下载'], source: '这是经文含义的翻译，不替代阿拉伯语《古兰经》原文。', prev: '◀ 上一页', next: '下一页 ▶', save: '🔖 保存书签', marks: '📚 书签', surahs: '章 (114)', juzs: '卷 (30)', search: '搜索' },
    es: { dir: 'ltr', edition: 'es.cortes', title: 'Significado de los versículos', subtitle: 'Se muestra junto a la página del Mushaf', label: 'Idioma de la traducción', loading: 'Cargando la traducción de la página…', error: 'No se pudo cargar la traducción. Compruebe su conexión e inténtelo de nuevo.', retry: 'Reintentar', toolbar: ['🎯 Plan de lectura', '💎 Memorizar', '🔍 Buscar versículos', '🔖 Marcadores', '📊 Estadísticas', '📖 Mushaf', '⬇ Descargar'], source: 'Esta es una traducción del significado y no sustituye el texto árabe del Corán.', prev: '◀ Anterior', next: 'Siguiente ▶', save: '🔖 Guardar marcador', marks: '📚 Marcadores', surahs: 'Suras (114)', juzs: 'Yuz (30)', search: 'Buscar' },
    de: { dir: 'ltr', edition: 'de.bubenheim', title: 'Bedeutung der Verse', subtitle: 'Neben der Mushaf-Seite angezeigt', label: 'Übersetzungssprache', loading: 'Seitenübersetzung wird geladen…', error: 'Die Übersetzung konnte nicht geladen werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.', retry: 'Erneut versuchen', toolbar: ['🎯 Leseplan', '💎 Auswendiglernen', '🔍 Verse suchen', '🔖 Lesezeichen', '📊 Lesestatistik', '📖 Mushaf', '⬇ Herunterladen'], source: 'Diese Übersetzung der Bedeutungen ersetzt nicht den arabischen Qur’an-Text.', prev: '◀ Zurück', next: 'Weiter ▶', save: '🔖 Lesezeichen speichern', marks: '📚 Lesezeichen', surahs: 'Suren (114)', juzs: 'Dschuz (30)', search: 'Suchen' },
    id: { dir: 'ltr', edition: 'id.indonesian', title: 'Makna Ayat', subtitle: 'Ditampilkan di samping halaman mushaf', label: 'Bahasa terjemahan', loading: 'Memuat terjemahan halaman…', error: 'Terjemahan tidak dapat dimuat. Periksa koneksi lalu coba lagi.', retry: 'Coba lagi', toolbar: ['🎯 Rencana khatam', '💎 Hafalan', '🔍 Cari ayat', '🔖 Penanda', '📊 Statistik', '📖 Mushaf', '⬇ Unduh'], source: 'Terjemahan makna ayat; tidak menggantikan teks Al-Qur’an berbahasa Arab.', prev: '◀ Sebelumnya', next: 'Berikutnya ▶', save: '🔖 Simpan penanda', marks: '📚 Penanda', surahs: 'Surah (114)', juzs: 'Juz (30)', search: 'Cari' },
    tr: { dir: 'ltr', edition: 'tr.diyanet', title: 'Ayetlerin Anlamı', subtitle: 'Mushaf sayfasının yanında gösterilir', label: 'Meal dili', loading: 'Sayfa meali yükleniyor…', error: 'Meal yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.', retry: 'Yeniden dene', toolbar: ['🎯 Hatim planı', '💎 Ezber', '🔍 Ayet ara', '🔖 Yer imleri', '📊 Okuma istatistikleri', '📖 Mushaf', '⬇ İndir'], source: 'Bu, ayetlerin anlamına dair bir mealdir; Arapça Kur’an metninin yerine geçmez.', prev: '◀ Önceki', next: 'Sonraki ▶', save: '🔖 Yer imi ekle', marks: '📚 Yer imleri', surahs: 'Sureler (114)', juzs: 'Cüzler (30)', search: 'Ara' }
  };
  const $ = (id) => document.getElementById(id);
  const safe = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  let selectedLang = 'ar';
  let requestId = 0;
  let highlightedAyah = null;
  let userPickedEdition = false;

  function showUxToast(message) {
    const old = document.querySelector('.rfq-ux-toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.className = 'rfq-ux-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.classList.add('show'), 10);
    window.setTimeout(() => { toast.classList.remove('show'); window.setTimeout(() => toast.remove(), 250); }, 3200);
  }

  function markAyahOnMushaf(globalNumber, label) {
    const area = $('pageImageArea');
    if (!area) return;
    let marker = $('rfqAyahFocus');
    if (!marker) {
      marker = document.createElement('div');
      marker.id = 'rfqAyahFocus';
      marker.className = 'rfq-ayah-focus';
      area.appendChild(marker);
    }
    marker.textContent = '📌 ' + (label || 'تم تحديد الآية') + ' — اضغط مرة أخرى لإخفاء التحديد';
    marker.classList.add('show');
    marker.onclick = () => marker.classList.remove('show');
    area.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function toggleTranslation() {
    const panel = $('quranTranslationPanel');
    if (!panel) return;
    const hidden = panel.classList.toggle('is-hidden');
    const button = $('qtToggleBtn');
    if (button) {
      button.textContent = hidden ? '📖 عرض الترجمة' : '🙈 إخفاء الترجمة';
      button.setAttribute('aria-expanded', String(!hidden));
    }
  }

  function toggleComfortMode() {
    if (typeof window._toggleImmersive === 'function') window._toggleImmersive();
    else document.getElementById('readerView')?.classList.toggle('immersive');
  }

  function currentPageNumber() {
    const page = (typeof currentPage !== "undefined" ? currentPage : window.currentPage) || 1;
    return Math.max(1, Math.min(604, Number(page)));
  }
  function applyInterfaceLanguage(code, remember) {
    selectedLang = LANGS[code] ? code : 'ar';
    const cfg = LANGS[selectedLang];
    document.documentElement.lang = selectedLang;
    document.documentElement.dir = cfg.dir;
    document.body.dir = cfg.dir;
    ['rfqLanguage','rfqLanguageReader'].forEach(id => { const picker = $(id); if (picker && picker.value !== selectedLang) picker.value = selectedLang; });
    const panel = $('quranTranslationPanel');
    if (panel) { panel.lang = selectedLang; panel.dir = cfg.dir; }
    document.title = ({ar:'القرآن الكريم — المصحف الشريف', en:'The Holy Quran — Mushaf', ur:'قرآن کریم — مصحف', fr:'Le Saint Coran — Mushaf', de:'Der Heilige Koran — Mushaf', es:'El Sagrado Corán — Mushaf', it:'Il Sacro Corano — Mushaf', ja:'聖クルアーン — ムスハフ', zh:'古兰经 — 穆斯哈夫', hi:'पवित्र क़ुरआन — मुसहफ़', ru:'Священный Коран — Мусхаф', id:'Al-Qur’an — Mushaf', tr:'Kur’an-ı Kerim — Mushaf'})[selectedLang];
    const edition = $('qtEdition');
    if (edition && !userPickedEdition) edition.value = cfg.edition;
    const set = (id, text) => { const el = $(id); if (el) el.textContent = text; };
    set('qtTitle', cfg.title); set('qtSubtitle', cfg.subtitle); set('qtLangLabel', cfg.label); set('qtAttribution', cfg.source); set('qtInterfaceLabel', ({ar:'لغة الواجهة',en:'Interface language',ur:'انٹرفیس کی زبان',fr:'Langue de l’interface',de:'Sprache der Oberfläche',es:'Idioma de la interfaz',it:'Lingua dell’interfaccia',ja:'表示言語',zh:'界面语言',hi:'इंटरफ़ेस की भाषा',ru:'Язык интерфейса',id:'Bahasa antarmuka',tr:'Arayüz dili'})[selectedLang]);
    const toolbar = document.querySelector('.index-toolbar');
    if (toolbar) { const actions = ['openKhatmaPanel()','openHifzPanel()','openAyahSearch()','openBookmarksPanel()','openStatsPanel()','openMushafPicker()','openDownloadPanel()']; const buttons = Array.from(toolbar.querySelectorAll('button')); actions.forEach((action,i) => { const b = buttons.find(x => (x.getAttribute('onclick')||'').includes(action)); if (b && cfg.toolbar[i]) b.textContent = cfg.toolbar[i]; }); }
    const mushafTitle = document.querySelector('#mushafPickerOverlay .dl-title'); if (mushafTitle) mushafTitle.textContent = ({ar:'📖 اختار المصحف',en:'📖 Choose Mushaf',ur:'📖 مصحف منتخب کریں',fr:'📖 Choisir le Mushaf',de:'📖 Mushaf auswählen',es:'📖 Elegir Mushaf',it:'📖 Scegli Mushaf',ja:'📖 ムスハフを選択',zh:'📖 选择古兰经版本',hi:'📖 मुसहफ़ चुनें',ru:'📖 Выбрать мусхаф'})[selectedLang];
    const nav = $('navBar');
    if (nav) {
      const buttons = nav.querySelectorAll('.nav-btn');
      if (buttons[0]) buttons[0].textContent = cfg.prev;
      if (buttons[1]) buttons[1].textContent = cfg.next;
      if (buttons[2]) buttons[2].textContent = cfg.save;
      if (buttons[3]) buttons[3].textContent = cfg.marks;
    }
    set('tabSurahs', cfg.surahs); set('tabJuzs', cfg.juzs);
    const search = $('tabSearch'); if (search) search.innerHTML = '<i class="fas fa-search" aria-hidden="true"></i> ' + safe(cfg.search);
    if (remember) { try { localStorage.setItem('rm_quran_lang', selectedLang); } catch (_) {} }
    loadPageTranslation(currentPageNumber());
  }

  async function loadPageTranslation(page) {
    const out = $('qtContent'); const editionSelect = $('qtEdition');
    if (!out || !editionSelect) return;
    const cfg = LANGS[selectedLang] || LANGS.ar;
    const edition = editionSelect.value || cfg.edition;
    const id = ++requestId;
    out.innerHTML = '<p class="qt-status" dir="auto">' + safe(cfg.loading) + '</p>';
    const url = 'https://api.alquran.cloud/v1/page/' + encodeURIComponent(page) + '/' + encodeURIComponent(edition);
    try {
      let response = null;
      try { if (window.caches) { const cache = await caches.open('rfq-translations-v1'); response = await cache.match(url); } } catch (_) {}
      if (!response) {
        response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        try { if (window.caches) { const cache = await caches.open('rfq-translations-v1'); await cache.put(url, response.clone()); } } catch (_) {}
      }
      const payload = await response.json();
      const ayahs = payload && payload.data && payload.data.ayahs;
      if (id !== requestId) return;
      if (!Array.isArray(ayahs) || !ayahs.length) throw new Error('No ayahs');
      const editionDirection = { 'en.sahih':'ltr', 'fr.hamidullah':'ltr', 'de.bubenheim':'ltr', 'es.cortes':'ltr', 'it.piccardo':'ltr', 'ja.japanese':'ltr', 'zh.jian':'ltr', 'hi.hindi':'ltr', 'ru.kuliev':'ltr', 'id.indonesian':'ltr', 'tr.diyanet':'ltr' };
      out.dir = editionDirection[edition] || 'rtl';
      out.lang = selectedLang;
      out.innerHTML = ayahs.map(a => '<div class="qt-ayah" data-ayah-global="' + safe(a.number) + '" tabindex="0" role="button" dir="auto"><span class="qt-num" aria-label="' + safe(a.numberInSurah) + '">' + safe(a.numberInSurah) + '</span>' + safe(a.text) + '</div>').join('');
      out.querySelectorAll('.qt-ayah').forEach((ayah) => {
        const selectAyah = () => {
          highlightedAyah = Number(ayah.dataset.ayahGlobal);
          applyHighlight();
          markAyahOnMushaf(highlightedAyah, 'الآية ' + (ayah.querySelector('.qt-num')?.textContent || ''));
        };
        ayah.addEventListener('click', selectAyah);
        ayah.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectAyah(); } });
      });
      applyHighlight();
    } catch (err) {
      if (id !== requestId) return;
      out.innerHTML = '<div class="qt-status" dir="auto">' + safe(cfg.error) + '<br><button class="qt-retry" type="button">' + safe(cfg.retry) + '</button></div>';
      const retry = out.querySelector('.qt-retry'); if (retry) retry.addEventListener('click', () => loadPageTranslation(page));
    }
  }

  function boot() {
    try { selectedLang = localStorage.getItem('rm_quran_lang') || 'ar'; } catch (_) {}
    const langPicker = $('rfqLanguage');
    if (langPicker) langPicker.addEventListener('change', () => { userPickedEdition = false; applyInterfaceLanguage(langPicker.value, true); showUxToast('✅ تم تغيير لغة الواجهة'); });
    const languageControl = document.querySelector('.rfq-language-control');
    if (languageControl && langPicker) {
      languageControl.addEventListener('click', (event) => {
        if (event.target === langPicker) return;
        event.preventDefault();
        try {
          if (typeof langPicker.showPicker === 'function') langPicker.showPicker();
          else { langPicker.focus(); langPicker.click(); }
        } catch (_) {
          langPicker.focus();
          langPicker.click();
        }
      });
    }
    const readerLangPicker = $('rfqLanguageReader');
    if (readerLangPicker) readerLangPicker.addEventListener('change', () => { userPickedEdition = false; applyInterfaceLanguage(readerLangPicker.value, true); showUxToast('✅ تم تغيير لغة الواجهة'); });
    const editionPicker = $('qtEdition');
    if (editionPicker) editionPicker.addEventListener('change', () => { userPickedEdition = true; loadPageTranslation(currentPageNumber()); });
    const header = document.querySelector('.qt-header');
    if (header && !$('qtToggleBtn')) {
      const actions = document.createElement('div');
      actions.className = 'qt-actions';
      actions.innerHTML = '<button type="button" id="qtToggleBtn" class="qt-action-btn" aria-expanded="true">🙈 إخفاء الترجمة</button><button type="button" class="qt-action-btn" id="qtComfortBtn">📖 وضع قراءة مريح</button>';
      header.appendChild(actions);
      $('qtToggleBtn').addEventListener('click', toggleTranslation);
      $('qtComfortBtn').addEventListener('click', toggleComfortMode);
    }
    try {
      const last = Number(localStorage.getItem('rm_quran_last') || 0);
      if (last > 1 && $('indexContainer') && $('readerView')?.style.display !== 'flex') {
        const row = document.querySelector('#quranFinderTools .qf-filter-row');
        if (row && !$('rfqResumePageInline')) {
          const resume = document.createElement('button');
          resume.type = 'button';
          resume.id = 'rfqResumePageInline';
          resume.className = 'qf-chip';
          resume.title = 'العودة إلى آخر صفحة قرأتها';
          resume.textContent = '▶ استكمال القراءة';
          resume.addEventListener('click', () => { if (typeof window.loadPage === 'function') window.loadPage(last); });
          row.appendChild(resume);
        }
      }
    } catch (_) {}
    applyInterfaceLanguage(selectedLang, false);
    const original = window.loadPage;
    if (typeof original === 'function') {
      window.loadPage = function (page) {
        const result = original.apply(this, arguments);
        window.setTimeout(() => loadPageTranslation(Number(page) || currentPageNumber()), 80);
        return result;
      };
    }
    const wrapper = $('imgWrapper');
    if (wrapper && window.MutationObserver) new MutationObserver(() => {
      const page = currentPageNumber();
      if (page !== Number(wrapper.dataset.translationPage || 0)) {
        wrapper.dataset.translationPage = String(page);
        loadPageTranslation(page);
      }
    }).observe(wrapper, { childList: true });
  }
  function applyHighlight() {
    const out = $('qtContent'); if (!out) return;
    out.querySelectorAll('.qt-ayah.is-playing').forEach(el => el.classList.remove('is-playing'));
    if (highlightedAyah == null) return;
    const el = out.querySelector('[data-ayah-global="' + CSS.escape(String(highlightedAyah)) + '"]');
    if (el) { el.classList.add('is-playing'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
  function highlightAyah(globalNumber) { highlightedAyah = Number(globalNumber); applyHighlight(); }
  function clearHighlight() { highlightedAyah = null; applyHighlight(); }
  window.RafiqQuranI18n = { setLanguage: applyInterfaceLanguage, loadTranslation: loadPageTranslation, highlightAyah, clearHighlight };
  window.showQuranUxToast = showUxToast;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
