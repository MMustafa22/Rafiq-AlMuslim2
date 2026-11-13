/* ============================================================
   رفيق المسلم — قصّ آية واحدة من ملف السورة (للقرّاء الذين لا يتوفر لهم ملف لكل آية)
   مثال: إدريس أبكر. بدل تحميل سورة البقرة كاملة (عشرات الميجابايت) لأجل آية واحدة،
   نحسب موضع الآية داخل ملف MP3 ونطلب هذا الجزء فقط (HTTP Range) — بضع مئات من الكيلوبايت.

   متانة التحميل (v1.1.7):
   - لا نعتمد على هيدر Content-Range (المتصفح يخفيه في الطلبات بين النطاقات)
   - إن تجاهل الخادم Range نقرأ البث حتى موضع الآية ثم نقطعه (بحدّ أقصى 12 ميجا)
   - نتحقق من أن معدّل البت ثابت (CBR) بمقارنة المدة المتوقعة بتوقيتات الآيات
   - إعادة محاولة لكل مصدر + مصدر بديل (مرآة)
   window.RFQ_CLIP.fetchClip(reciter, unit, signal) -> Promise<Blob>
   ============================================================ */
(function () {
  'use strict';
  var PAD = 0.40;                       /* ثوانٍ زائدة قبل الآية وبعدها (يقصّها المعالج الصوتي بدقّة لاحقًا) */
  var HEAD_BYTES = 65535;
  var STREAM_LIMIT = 12 * 1024 * 1024;  /* أقصى ما نقرأه من بث كامل إن لم يدعم الخادم Range */
  var MAX_CLIP = 6 * 1024 * 1024;
  var BR1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  var BR2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  var SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  var _timings = {};

  function p3(n) { return String(n).padStart(3, '0'); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function isAbort(e) { return e && e.name === 'AbortError'; }

  function fetchTimings(read, surah, signal) {
    var key = read + ':' + surah;
    if (_timings[key]) return _timings[key];
    function once(n) {
      return fetch('https://www.mp3quran.net/api/v3/ayat_timing?read=' + read + '&surah=' + surah, { signal: signal })
        .then(function (r) { if (!r.ok) throw new Error('timing HTTP ' + r.status); return r.json(); })
        .then(function (rows) { if (!Array.isArray(rows) || !rows.length) throw new Error('توقيتات الآيات غير متاحة لهذه السورة'); return rows; })
        .catch(function (e) { if (isAbort(e) || n >= 2) throw e; return sleep(700 * (n + 1)).then(function () { return once(n + 1); }); });
    }
    _timings[key] = once(0).catch(function (e) { delete _timings[key]; throw e; });
    return _timings[key];
  }

  /* قراءة ترويسة MP3: بداية الصوت + معدّل البت + (إن وُجد) جدول Xing للـ VBR */
  function parseHead(u8) {
    var pos = 0;
    if (u8.length > 10 && u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) {
      pos = 10 + (((u8[6] & 0x7f) << 21) | ((u8[7] & 0x7f) << 14) | ((u8[8] & 0x7f) << 7) | (u8[9] & 0x7f));
    }
    var limit = Math.min(u8.length - 4, pos + 8192);
    for (var i = pos; i < limit; i++) {
      if (u8[i] !== 0xff || (u8[i + 1] & 0xe0) !== 0xe0) continue;
      var ver = (u8[i + 1] >> 3) & 3, layer = (u8[i + 1] >> 1) & 3;
      var bi = u8[i + 2] >> 4, si = (u8[i + 2] >> 2) & 3;
      if (ver === 1 || layer !== 1 || bi === 0 || bi === 15 || si === 3) continue;
      var bitrate = (ver === 3 ? BR1 : BR2)[bi] * 1000, sr = SR[ver][si];
      var spf = ver === 3 ? 1152 : 576;
      var out = { audioStart: i, bitrate: bitrate, sampleRate: sr, spf: spf, vbr: null };
      var end = Math.min(u8.length - 8, i + 4 + 40);
      for (var j = i + 4; j < end; j++) {
        var t = String.fromCharCode(u8[j], u8[j + 1], u8[j + 2], u8[j + 3]);
        if (t === 'Xing' || t === 'Info') {
          var flags = (u8[j + 4] << 24 | u8[j + 5] << 16 | u8[j + 6] << 8 | u8[j + 7]) >>> 0, k = j + 8, frames = 0, bytes = 0, toc = null;
          if (flags & 1) { frames = (u8[k] << 24 | u8[k + 1] << 16 | u8[k + 2] << 8 | u8[k + 3]) >>> 0; k += 4; }
          if (flags & 2) { bytes = (u8[k] << 24 | u8[k + 1] << 16 | u8[k + 2] << 8 | u8[k + 3]) >>> 0; k += 4; }
          if (flags & 4) { toc = Array.prototype.slice.call(u8, k, k + 100); }
          if (frames) out.frames = frames;
          if (bytes) out.xingBytes = bytes;
          if (t === 'Xing' && toc && frames) out.vbr = { frames: frames, bytes: bytes, toc: toc, duration: frames * spf / sr };
          break;
        }
      }
      return out;
    }
    return null;
  }

  function byteAt(h, tSec, total) {
    if (tSec < 0) tSec = 0;
    if (h.vbr) {
      var v = h.vbr, audioBytes = v.bytes || ((total || 0) - h.audioStart);
      if (audioBytes <= 0) throw new Error('حجم الملف غير معروف');
      var pct = Math.min(99.999, tSec / v.duration * 100), i = Math.floor(pct), f = pct - i;
      var a = v.toc[i], b = i < 99 ? v.toc[i + 1] : 256;
      return h.audioStart + Math.floor((a + (b - a) * f) / 256 * audioBytes);
    }
    var bps = h.bytesPerSec || (h.bitrate / 8);
    return h.audioStart + Math.floor(tSec * bps);
  }

  /* جلب جزء من الملف: Range إن أمكن، وإلا قراءة البث حتى النهاية المطلوبة */
  function slice(url, from, to, signal) {
    return fetch(url, { headers: { Range: 'bytes=' + from + '-' + to }, signal: signal }).then(function (res) {
      if (res.status === 206) {
        var cr = res.headers.get('Content-Range') || '', m = cr.match(/\/(\d+)\s*$/);
        return res.arrayBuffer().then(function (buf) { return { buf: buf, total: m ? +m[1] : 0 }; });
      }
      if (res.status === 200 && res.body && res.body.getReader) {
        if (to + 1 > STREAM_LIMIT) { try { res.body.cancel(); } catch (e) {} throw new Error('الخادم لا يدعم الطلب الجزئي والآية بعيدة داخل الملف'); }
        var reader = res.body.getReader(), got = 0, chunks = [];
        function pump() {
          return reader.read().then(function (r) {
            if (r.done) return;
            chunks.push(r.value); got += r.value.length;
            if (got >= to + 1) { try { reader.cancel(); } catch (e) {} return; }
            return pump();
          });
        }
        return pump().then(function () {
          var all = new Uint8Array(got), p = 0;
          chunks.forEach(function (c) { all.set(c, p); p += c.length; });
          var part = all.subarray(Math.min(from, all.length), Math.min(to + 1, all.length));
          return { buf: part.buffer.slice(part.byteOffset, part.byteOffset + part.length), total: 0 };
        });
      }
      try { if (res.body && res.body.cancel) res.body.cancel(); } catch (e) {}
      throw new Error('HTTP ' + res.status);
    });
  }

  function clipFromUrl(url, t, signal) {
    return slice(url, 0, HEAD_BYTES, signal).then(function (head) {
      var h = parseHead(new Uint8Array(head.buf));
      if (!h) throw new Error('ترويسة MP3 غير مفهومة');
      var total = head.total || (h.xingBytes ? h.xingBytes + h.audioStart : 0);
      /* تحقّق من ثبات معدّل البت: المدة المتوقعة من الحجم يجب أن تطابق آخر توقيت */
      if (!h.vbr && total && t.last) {
        var est = (total - h.audioStart) * 8 / h.bitrate;
        if (est > 0 && Math.abs(est - t.last) / est > 0.06 && t.last > est * 0.5) {
          h.bytesPerSec = (total - h.audioStart) / (t.last + 1.2);
        }
      }
      var s = Math.max(0, t.start - PAD), e = t.end + PAD;
      var bs = byteAt(h, s, total), be = byteAt(h, e, total);
      var bps = h.vbr ? (h.vbr.bytes || (total - h.audioStart)) / h.vbr.duration : (h.bytesPerSec || h.bitrate / 8);
      var margin = 0;
      if (h.vbr) { margin = Math.min(2048, bs - h.audioStart); bs = bs - margin; be = be + 2048; }
      if (total) { if (bs >= total) throw new Error('موضع الآية خارج الملف'); be = Math.min(be, total - 1); }
      if (be - bs < 4000) throw new Error('مقطع قصير جدًا');
      if (be - bs > MAX_CLIP) throw new Error('مقطع أكبر من المتوقع');
      return slice(url, bs, be, signal).then(function (r) {
        var u8 = new Uint8Array(r.buf);
        if (u8.length < 3000) throw new Error('ملف صغير');
        var k = 0; while (k < Math.min(u8.length - 1, 4000) && !(u8[k] === 0xff && (u8[k + 1] & 0xe0) === 0xe0)) k++;
        if (k >= 4000) throw new Error('لا يوجد إطار MP3 في المقطع');
        var out = new Blob([k ? u8.subarray(k) : u8], { type: 'audio/mpeg' });
        /* lead: كم ثانية بين بداية المقطع وبداية الآية الفعلية (يستعملها المعالج الصوتي للقصّ الدقيق) */
        out._rfq = { lead: Math.max(0, (t.start - s) + (margin - k) / bps), dur: t.end - t.start };
        return out;
      });
    });
  }

  function fetchClip(r, u, signal) {
    return fetchTimings(r.timedAyahRead, u.surah, signal).then(function (rows) {
      var row = null, last = 0;
      for (var i = 0; i < rows.length; i++) {
        var en = Number(rows[i].end_time) / 1000; if (en > last) last = en;
        if (Number(rows[i].ayah) === Number(u.ayah)) row = rows[i];
      }
      if (!row) throw new Error('توقيت الآية ' + u.ayah + ' غير متاح');
      var t = { start: Number(row.start_time) / 1000, end: Number(row.end_time) / 1000, last: last };
      var urls = [];
      if (r.fullSurahMirror) urls.push(r.fullSurahMirror + p3(u.surah) + '.mp3');
      if (r.fullSurah) urls.push(r.fullSurah + p3(u.surah) + '.mp3');
      var n = 0, lastErr;
      function next() {
        if (n >= urls.length) return Promise.reject(lastErr || new Error('لا يوجد مصدر'));
        var url = urls[n++], tries = 0;
        function attempt() {
          return clipFromUrl(url, t, signal).catch(function (e) {
            if (isAbort(e)) throw e;
            lastErr = e;
            if (++tries < 2 && !/ترويسة|خارج الملف|لا يدعم/.test(String(e && e.message))) return sleep(600).then(attempt);
            return next();
          });
        }
        return attempt();
      }
      return next();
    });
  }

  window.RFQ_CLIP = { fetchClip: fetchClip, _parseHead: parseHead, _byteAt: byteAt };
})();
