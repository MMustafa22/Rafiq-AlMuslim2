/* ============================================================
   رفيق المسلم — قارئ الدرجات المشترك
   ------------------------------------------------------------
   يقرأ سجل الأيام من تطبيق رفيق المسلم (IndexedDB أو localStorage)
   ويحوّله إلى مجموع نقاط لكل شهر هجري.
   لا يعرض أي بيانات تواصل — أرقام فقط.
   ============================================================ */
(function () {
  'use strict';

  var TEXT_KEY = 'rfq_data_v12';
  var DB_NAME = 'rafiq-day-history-v1';
  var DAY_SCORE_CAP = 1350;
  var PARTS = {
    quran: ['quran', 'wird'],
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    sunan: ['sFajr', 'sDhuhrB', 'sDhuhrA', 'sMaghrib', 'sIsha', 'duha', 'taraweeh', 'baqarah', 'mulk'],
    athkar: ['aMorn', 'aEve', 'aSlp', 'postFajr', 'postDhuhr', 'postAsr', 'postMaghrib', 'postIsha', 'noBadContent'],
    books: ['riyad', 'qasas', 'seerah', 'sahabaRead']
  };
  var HIJRI_MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  var hijriFmt = null;

  function hijriParts(date) {
    try {
      if (!hijriFmt) hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
      var out = {};
      hijriFmt.formatToParts(date).forEach(function (p) { out[p.type] = p.value; });
      return { y: parseInt(out.year, 10), m: parseInt(out.month, 10), d: parseInt(out.day, 10) };
    } catch (e) {
      return { y: 1448, m: 1, d: 1 };
    }
  }
  function monthKeyOf(dateStr) {
    var h = hijriParts(new Date(dateStr + 'T12:00:00'));
    if (!h || !h.y || !h.m) return '';
    return h.y + '-' + String(h.m).padStart(2, '0');
  }
  function currentMonth() {
    var h = hijriParts(new Date());
    return h.y + '-' + String(h.m).padStart(2, '0');
  }
  function monthLabel(key) {
    var p = String(key || '').split('-');
    var y = parseInt(p[0], 10) || 0;
    var m = parseInt(p[1], 10) || 0;
    var yy = String(y).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[+d]; });
    return (HIJRI_MONTHS[(m - 1 + 12) % 12] || '') + ' ' + yy + ' هـ';
  }
  function dayScore(record) {
    if (!record || typeof record !== 'object') return 0;
    var sum = 0;
    Object.keys(record).forEach(function (k) {
      var item = record[k];
      if (item && typeof item.p === 'number' && isFinite(item.p)) sum += item.p;
    });
    return Math.min(sum, DAY_SCORE_CAP);
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('no-indexeddb')); return; }
      var req;
      try { req = indexedDB.open(DB_NAME, 1); } catch (e) { reject(e); return; }
      req.onupgradeneeded = function (ev) {
        var db = ev.target.result;
        if (!db.objectStoreNames.contains('days')) db.createObjectStore('days', { keyPath: 'date' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('db-open-failed')); };
      req.onblocked = function () { reject(new Error('db-blocked')); };
      setTimeout(function () { reject(new Error('db-timeout')); }, 4000);
    });
  }
  function readIndexedDb() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var records = {};
        var tx = db.transaction(['days'], 'readonly');
        var req = tx.objectStore('days').getAll();
        req.onsuccess = function (e) {
          (e.target.result || []).forEach(function (row) {
            if (row && typeof row.date === 'string' && row.record && typeof row.record === 'object') records[row.date] = row.record;
          });
        };
        tx.oncomplete = function () { db.close(); resolve(records); };
        tx.onerror = function () { db.close(); reject(tx.error || new Error('db-read-failed')); };
        tx.onabort = function () { db.close(); reject(tx.error || new Error('db-read-aborted')); };
      });
    });
  }

  function readLocalStorage() {
    var out = { records: null, bonus: 0 };
    try {
      var parsed = JSON.parse(localStorage.getItem(TEXT_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return out;
      out.bonus = Number(parsed.bonusPts) || 0;
      if (parsed.recs && typeof parsed.recs === 'object') out.records = parsed.recs;
    } catch (e) {}
    return out;
  }

  function readAll() {
    var local = readLocalStorage();
    if (local.records && Object.keys(local.records).length) {
      return Promise.resolve({ records: local.records, bonus: local.bonus, source: 'localStorage' });
    }
    return readIndexedDb()
      .then(function (records) { return { records: records, bonus: local.bonus, source: 'indexedDB' }; })
      .catch(function () { return { records: local.records || {}, bonus: local.bonus, source: 'empty' }; });
  }

  function summarize(records, month) {
    var total = 0, days = 0, best = 0, parts = { quran: 0, prayers: 0, sunan: 0, athkar: 0, books: 0 };
    var monthRecords = {};
    Object.keys(records || {}).forEach(function (day) {
      if (monthKeyOf(day) !== month) return;
      var rec = records[day] || {};
      var score = dayScore(rec);
      if (score > 0) { days++; monthRecords[day] = score; }
      total += score;
      if (score > best) best = score;
      Object.keys(PARTS).forEach(function (group) {
        PARTS[group].forEach(function (k) {
          var item = rec[k];
          if (item && typeof item.p === 'number') parts[group] += item.p;
        });
      });
    });
    return { month: month, label: monthLabel(month), pts: Math.round(total), days: days, best: best, parts: parts, records: monthRecords };
  }

  function monthsOf(records) {
    var set = {};
    Object.keys(records || {}).forEach(function (day) {
      var key = monthKeyOf(day);
      if (key) set[key] = true;
    });
    set[currentMonth()] = true;
    return Object.keys(set).sort();
  }

  function mySummary(month) {
    return readAll().then(function (data) {
      var target = month || currentMonth();
      return summarize(data.records, target);
    });
  }

  window.RFQ_POINTS = {
    readAll: readAll,
    summarize: summarize,
    months: monthsOf,
    currentMonth: currentMonth,
    monthLabel: monthLabel,
    monthKeyOf: monthKeyOf,
    dayScore: dayScore,
    mySummary: mySummary,
    cap: DAY_SCORE_CAP
  };
})();
