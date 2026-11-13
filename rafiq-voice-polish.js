/* ============================================================
   رفيق المسلم — تنقية الصوت وتوحيد المستوى (إدريس أبكر + ياسر الدوسري)
   ------------------------------------------------------------
   لماذا؟ بالقياس الفعلي (EBU R128) مقارنةً بالحصري والمنشاوي والقطامي:
     • الدوسري أعلى من المجموعة بحوالي 4.6 ديسيبل ونهايات آياته مقطوعة بحدّة
     • إدريس أبكر (من ملفات السور) هادئ جدًا ومتفاوت، ومقاطعه تحمل بقايا الآية المجاورة
   ماذا نفعل؟ لكل آية/سورة قصيرة:
     1) فكّ الترميز  2) قصّ دقيق + قصّ الصمت  3) قياس الجهارة (BS.1770 مع بوابة)
     4) ضبط الجهارة على مستوى المجموعة (-15.4 LUFS)  5) محدّد قمم ناعم
     6) تلاشي ناعم في البداية والنهاية (لا طقطقة)  7) ترميز MP3 أحادي  8) حفظ في الكاش
   النتيجة: كل الأصوات بنفس المستوى تقريبًا، وبدايات ونهايات نظيفة، وتعمل بدون إنترنت بعد أول استماع.
   window.RFQ_POLISH = { applies, url, getBlob, clear }
   ============================================================ */
(function () {
  'use strict';

  var TARGET = -14.96;                /* هدف المقياس الداخلي؛ يعطي -15.4 LUFS بقياس EBU R128 الخارجي = متوسط الحصري/المنشاوي/القطامي */
  var IDS = { idris: 1, yasser: 1 };
  var SHORT_FULL = { 109: 1, 112: 1, 113: 1, 114: 1 };   /* سور قصيرة نعالجها كاملة */
  var CACHE = 'rafiq-adhkar-quran-voice-v1';   /* الاسم يبدأ بـ rafiq-adhkar-quran حتى لا يحذفه تنظيف الكاش القديم */
  var MAX_GAIN_DB = 24, MIN_GAIN_DB = -20;
  var mem = {}, order = [];
  var _lamePromise = null;

  function p3(n) { return String(n).padStart(3, '0'); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- هل ينطبق على هذا القارئ/المقطع؟ ---------- */
  function supported() {
    return !!(window.caches && (window.OfflineAudioContext || window.webkitOfflineAudioContext) && window.Blob && window.fetch);
  }
  function appliesUnit(r, u) {
    if (!r || !IDS[r.id] || !u || !supported()) return false;
    if (u.kind === 'ayah') return true;
    if (u.kind === 'full') return !!SHORT_FULL[u.surah];
    return false;
  }
  function itemToUnit(item) {
    if (!item || item.type !== 'quran') return null;
    if (item.fullSurah) return { kind: 'full', surah: item.surah };
    return { kind: 'ayah', surah: item.surah, ayah: item.from };
  }
  function applies(r, item) { var u = itemToUnit(item); return !!u && appliesUnit(r, u); }
  function keyOf(r, u) { return 'https://rafiq.local/voice/' + r.id + '/' + (u.kind === 'full' ? 'f' + u.surah : u.surah + '-' + u.ayah); }

  /* ---------- المصدر الخام ---------- */
  function fetchBlob(url, signal) {
    return fetch(url, { signal: signal }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.blob();
    }).then(function (b) { if (!b || b.size < 2000) throw new Error('ملف صغير'); return b; });
  }
  function rawBlob(r, u, signal) {
    if (r.id === 'idris' && u.kind === 'ayah' && window.RFQ_CLIP) return window.RFQ_CLIP.fetchClip(r, u, signal);
    var urls = [];
    if (u.kind === 'full') {
      if (r.fullSurah) urls.push(r.fullSurah + p3(u.surah) + '.mp3');
      if (r.fullSurahMirror) urls.push(r.fullSurahMirror + p3(u.surah) + '.mp3');
    } else if (window.RFQ_AUDIO && window.RFQ_AUDIO.sameReciterUrls) {
      urls = window.RFQ_AUDIO.sameReciterUrls(r, { type: 'quran', surah: u.surah, from: u.ayah, to: u.ayah }) || [];
    }
    if (!urls.length) return Promise.reject(new Error('لا يوجد مصدر'));
    var n = 0, last;
    function next() {
      if (n >= urls.length) return Promise.reject(last || new Error('لا يوجد مصدر'));
      return fetchBlob(urls[n++], signal).catch(function (e) { if (e && e.name === 'AbortError') throw e; last = e; return next(); });
    }
    return next();
  }

  /* ---------- فكّ الترميز ---------- */
  function decode(blob) {
    return blob.arrayBuffer().then(function (ab) {
      var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      var ctx = new AC(1, 1, 44100);
      return new Promise(function (res, rej) {
        var p = ctx.decodeAudioData(ab, res, rej);
        if (p && p.then) p.then(res, rej);
      });
    });
  }
  function toMono(buf) {
    var n = buf.length, ch = buf.numberOfChannels, out = new Float32Array(n);
    for (var c = 0; c < ch; c++) { var d = buf.getChannelData(c); for (var i = 0; i < n; i++) out[i] += d[i] / ch; }
    return out;
  }

  /* ---------- قياس الجهارة (ITU-R BS.1770-4 مبسّط مع البوابة) ---------- */
  function kWeight(x, fs) {
    /* المرحلة 1: رفّ عالٍ — المرحلة 2: مرشّح تمرير عالٍ (RLB) */
    var f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196;
    var K = Math.tan(Math.PI * f0 / fs), Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416);
    var a0 = 1 + K / Q + K * K;
    var b0 = (Vh + Vb * K / Q + K * K) / a0, b1 = 2 * (K * K - Vh) / a0, b2 = (Vh - Vb * K / Q + K * K) / a0;
    var a1 = 2 * (K * K - 1) / a0, a2 = (1 - K / Q + K * K) / a0;
    var y = new Float32Array(x.length), x1 = 0, x2 = 0, y1 = 0, y2 = 0, i, v;
    for (i = 0; i < x.length; i++) { v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
    f0 = 38.13547087602444; Q = 0.5003270373238773;
    K = Math.tan(Math.PI * f0 / fs); a0 = 1 + K / Q + K * K;
    var c1 = 2 * (K * K - 1) / a0, c2 = (1 - K / Q + K * K) / a0;
    var z = new Float32Array(x.length); x1 = x2 = y1 = y2 = 0;
    for (i = 0; i < y.length; i++) { v = y[i] - 2 * x1 + x2 - c1 * y1 - c2 * y2; x2 = x1; x1 = y[i]; y2 = y1; y1 = v; z[i] = v; }
    return z;
  }
  function loudness(x, fs) {            /* LUFS لإشارة أحادية */
    var z = kWeight(x, fs), win = Math.round(0.4 * fs), hop = Math.round(0.1 * fs), blocks = [], i, j;
    if (z.length < win) { win = z.length; hop = win; }
    if (win < 1) return -Infinity;
    for (i = 0; i + win <= z.length; i += hop) { var s = 0; for (j = i; j < i + win; j++) s += z[j] * z[j]; blocks.push(s / win); }
    function L(ms) { return -0.691 + 10 * Math.log10(ms); }
    var abs = blocks.filter(function (b) { return L(b) > -70; });
    if (!abs.length) return -Infinity;
    var mean = abs.reduce(function (a, b) { return a + b; }, 0) / abs.length;
    var rel = L(mean) - 10;
    var g = blocks.filter(function (b) { return L(b) > rel; });
    if (!g.length) g = abs;
    return L(g.reduce(function (a, b) { return a + b; }, 0) / g.length);
  }

  /* ---------- قصّ الصمت ---------- */
  function trimRange(x, fs) {
    var w = Math.max(1, Math.round(0.01 * fs)), n = x.length, peak = 0, i;
    for (i = 0; i < n; i++) { var a = Math.abs(x[i]); if (a > peak) peak = a; }
    var thr = Math.max(0.002, peak * 0.012), first = -1, last = -1;
    for (i = 0; i + w <= n; i += w) {
      var s = 0; for (var j = i; j < i + w; j++) s += x[j] * x[j];
      if (Math.sqrt(s / w) > thr) { if (first < 0) first = i; last = i + w; }
    }
    if (first < 0) return [0, n];
    return [Math.max(0, first - Math.round(0.05 * fs)), Math.min(n, last + Math.round(0.12 * fs))];
  }

  /* ---------- ترميز MP3 ---------- */
  function loadLame() {
    if (window.lamejs && window.lamejs.Mp3Encoder) return Promise.resolve(window.lamejs);
    if (_lamePromise) return _lamePromise;
    _lamePromise = new Promise(function (res, rej) {
      var base = '';
      try { var sc = document.querySelector('script[src*="rafiq-voice-polish"]'); if (sc) base = sc.src.replace(/rafiq-voice-polish\.js.*$/, ''); } catch (e) {}
      var s = document.createElement('script');
      s.src = (base || './') + 'lame.min.js'; s.async = true;
      s.onload = function () { (window.lamejs && window.lamejs.Mp3Encoder) ? res(window.lamejs) : rej(new Error('lamejs')); };
      s.onerror = function () { rej(new Error('lamejs load')); };
      document.head.appendChild(s);
    }).catch(function (e) { _lamePromise = null; throw e; });
    return _lamePromise;
  }
  function encodeMp3(pcm, fs) {
    return loadLame().then(function (L) {
      var i16 = new Int16Array(pcm.length), i;
      for (i = 0; i < pcm.length; i++) { var v = Math.max(-1, Math.min(1, pcm[i])); i16[i] = v < 0 ? v * 32768 : v * 32767; }
      var kbps = fs >= 32000 ? 96 : 64, enc = new L.Mp3Encoder(1, fs, kbps), parts = [], blk = 1152 * 8;
      for (i = 0; i < i16.length; i += blk) { var out = enc.encodeBuffer(i16.subarray(i, i + blk)); if (out.length) parts.push(new Uint8Array(out)); }
      var tail = enc.flush(); if (tail.length) parts.push(new Uint8Array(tail));
      return new Blob(parts, { type: 'audio/mpeg' });
    });
  }
  function encodeWav(pcm, fs) {
    var n = pcm.length, buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf), i;
    function w(o, s) { for (var k = 0; k < s.length; k++) dv.setUint8(o + k, s.charCodeAt(k)); }
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, fs, true); dv.setUint32(28, fs * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 2, true);
    for (i = 0; i < n; i++) { var v = Math.max(-1, Math.min(1, pcm[i])); dv.setInt16(44 + i * 2, v < 0 ? v * 32768 : v * 32767, true); }
    return new Blob([buf], { type: 'audio/wav' });
  }

  /* ---------- المعالجة الكاملة ---------- */
  function process(blob, meta) {
    return decode(blob).then(function (buf) {
      var fs = buf.sampleRate, x = toMono(buf), range;
      if (meta && meta.lead != null && isFinite(meta.lead)) {
        range = [Math.max(0, Math.round((meta.lead - 0.05) * fs)), Math.min(x.length, Math.round((meta.lead + meta.dur + 0.10) * fs))];
        if (range[1] - range[0] < fs * 0.2) range = trimRange(x, fs);
      } else range = trimRange(x, fs);
      x = x.subarray(range[0], range[1]);
      var I = loudness(x, fs) + 3.01;                 /* مكافئ ثنائي القناة المتطابق */
      var out = new Float32Array(x.length), i;
      if (isFinite(I)) {
        var gdb = Math.max(MIN_GAIN_DB, Math.min(MAX_GAIN_DB, TARGET - I)), g = Math.pow(10, gdb / 20);
        for (i = 0; i < x.length; i++) {
          var v = x[i] * g, a = Math.abs(v);
          if (a > 0.7) v = (v < 0 ? -1 : 1) * (0.7 + 0.14 * Math.tanh((a - 0.7) / 0.14));   /* محدّد ناعم: لا يتجاوز 0.84 (-1.5 dBFS) */
          out[i] = v;
        }
      } else out.set(x);
      /* تلاشي ناعم (جيب التمام المرفوع) */
      var fin = Math.min(Math.round(0.02 * fs), out.length >> 1), fout = Math.min(Math.round(0.12 * fs), out.length >> 1);
      for (i = 0; i < fin; i++) out[i] *= 0.5 - 0.5 * Math.cos(Math.PI * i / fin);
      for (i = 0; i < fout; i++) out[out.length - 1 - i] *= 0.5 - 0.5 * Math.cos(Math.PI * i / fout);
      return encodeMp3(out, fs).catch(function () { return encodeWav(out, fs); });
    });
  }

  /* ---------- الكاش ---------- */
  function cacheGet(key) {
    return caches.open(CACHE).then(function (c) { return c.match(key); }).then(function (res) { return res ? res.blob() : null; }).catch(function () { return null; });
  }
  function cachePut(key, blob) {
    return caches.open(CACHE).then(function (c) { return c.put(key, new Response(blob, { headers: { 'Content-Type': blob.type || 'audio/mpeg', 'X-Rafiq-Polish': '1' } })); }).catch(function () {});
  }

  /* ---------- الواجهة ---------- */
  var inflight = {};
  function getBlob(r, u, signal) {
    var key = keyOf(r, u);
    return cacheGet(key).then(function (hit) {
      if (hit && hit.size > 1000) return hit;
      if (inflight[key] && !signal) return inflight[key];
      var p = rawBlob(r, u, signal).then(function (raw) {
        return process(raw, raw._rfq).catch(function (e) { console.warn('[RFQ_POLISH] تعذّرت المعالجة، يُستخدم الأصل', e); return raw; });
      }).then(function (out) { return cachePut(key, out).then(function () { return out; }); });
      inflight[key] = p;
      var done = function () { delete inflight[key]; };
      p.then(done, done);
      return p;
    });
  }
  /* نحتفظ بالـ Blob في الذاكرة (آخر 10) ونُنشئ رابطًا جديدًا في كل تشغيل لأن المشغّل يلغي الرابط بعد الاستخدام */
  function remember(key, blob) {
    mem[key] = blob; order = order.filter(function (k) { return k !== key; }); order.push(key);
    while (order.length > 10) { delete mem[order.shift()]; }
  }
  function url(r, item, signal) {
    var u = itemToUnit(item);
    if (!u || !appliesUnit(r, u)) return Promise.resolve(null);
    var key = keyOf(r, u);
    if (mem[key]) return Promise.resolve(URL.createObjectURL(mem[key]));
    return getBlob(r, u, signal).then(function (b) { remember(key, b); return URL.createObjectURL(b); });
  }
  /* تجهيز مسبق (بدون تشغيل) كي لا ينتظر المستخدم */
  function warm(r, item) {
    var u = itemToUnit(item);
    if (!u || !appliesUnit(r, u)) return;
    var key = keyOf(r, u);
    if (mem[key]) return;
    getBlob(r, u).then(function (b) { remember(key, b); }).catch(function () {});
  }
  function clear(rid) {
    return caches.open(CACHE).then(function (c) {
      return c.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return !rid || k.url.indexOf('/voice/' + rid + '/') > -1; }).map(function (k) { return c.delete(k); })); });
    }).catch(function () {});
  }

  window.RFQ_POLISH = {
    TARGET: TARGET, applies: applies, appliesUnit: appliesUnit, url: url, warm: warm, getBlob: getBlob, clear: clear,
    _process: process, _loudness: loudness, _decode: decode, _toMono: toMono
  };
})();
