/* رفيق المسلم — الأذكار الصوتية أوفلاين
 * - يحمّل آيات/سور الأذكار للقراء الستة داخل Cache Storage ويشغّلها بدون إنترنت.
 * - يتحقق من تسجيلات الأذكار المحلية (59 + 8 سبحة) ويصلح الناقص.
 * - لا يحمّل أي شيء تلقائياً: كل التحميل يبدأ بضغطة منك بعد أن ترى قائمة ما سيُحمَّل.
 * - لا يعتمد على الـ Service Worker في التشغيل (blob URL من الكاش).
 */
(function () {
  "use strict";
  var CACHE_NAME = "rafiq-adhkar-quran-v1";
  var MEDIA_CACHE = "rafiq-media-lazy-v1"; // نفس كاش الـ SW للتسجيلات المحلية
  var IDX_KEY = "rfq_off_idx_v1", DONE_KEY = "rfq_off_done_v1", VER_KEY = "rfq_off_ver_v1", BASE = "https://rafiq.offline/q/";
  var TASBIH = ["subhanallah", "alhamdulillah", "allahu_akbar", "astaghfirullah", "la_hawla", "la_ilaha_illallah", "la_ilaha_illallah_wahdahu", "salah_annabi"];
  var hasCaches = typeof caches !== "undefined";

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function p3(n) { return String(n).padStart(3, "0"); }
  function mb(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + " م.ب" : Math.max(1, Math.round(b / 1024)) + " ك.ب"; }

  var idx = {}; try { idx = JSON.parse(ls(IDX_KEY) || "{}") || {}; } catch (e) { idx = {}; }
  function saveIdx() { ls(IDX_KEY, JSON.stringify(idx)); }
  var doneFlags = {}; try { doneFlags = JSON.parse(ls(DONE_KEY) || "{}") || {}; } catch (e) { doneFlags = {}; }
  function markDone() { var ch = false; reciters().forEach(function (r) { if (!doneFlags[r.id] && status(r.id).done) { doneFlags[r.id] = 1; ch = true; } }); if (ch) ls(DONE_KEY, JSON.stringify(doneFlags)); }
  function missingCount(rid) { var s = status(rid); return s.total - s.have; }

  /* ---------- الوحدات المطلوبة (تُستخرج من بيانات الأذكار نفسها) ---------- */
  var _units = null, _groups = null, _uLabel = {};
  function build() {
    var map = {}, list = [], gmap = {}, glist = [], AY = window.SURAH_AYAT_COUNT || [], SEC = ["الصباح", "المساء", "النوم"];
    function addU(id, u) { if (!map[id]) { u.id = id; map[id] = u; list.push(u); } return map[id]; }
    try {
      for (var t = 0; t < 3; t++) {
        var arr = (window.ATH_DATA && ATH_DATA[t] && ATH_DATA[t].arr) || [];
        for (var i = 0; i < arr.length; i++) {
          var its = window.getDhikrAudioItems(arr[i], t);
          for (var j = 0; j < its.length; j++) {
            var it = its[j]; if (it.type !== "quran") continue;
            var gid = it.fullSurah ? "f" + it.surah : it.surah + ":" + it.from + "-" + it.to, g = gmap[gid];
            if (!g) {
              var lab = String(it.label || "").replace(/^ثم\s+/, "").replace(/\s*\(مرة واحدة\)/, "");
              g = gmap[gid] = { id: gid, surah: it.surah, from: it.fullSurah ? 1 : it.from, to: it.fullSurah ? (AY[it.surah] || 1) : it.to, full: !!it.fullSurah, label: lab, tags: [], uids: [], big: !!it.fullSurah && (AY[it.surah] || 0) > 40 };
              glist.push(g);
              if (it.fullSurah) g.uids.push(addU("f" + it.surah, { kind: "full", surah: it.surah, big: g.big }).id);
              else for (var a = it.from; a <= it.to; a++) g.uids.push(addU(it.surah + ":" + a, { kind: "ayah", surah: it.surah, ayah: a, big: false }).id);
              g.uids.forEach(function (uid) { _uLabel[uid] = lab; });
            }
            if (g.tags.indexOf(SEC[t]) < 0) g.tags.push(SEC[t]);
          }
        }
      }
    } catch (e) { console.warn("[RFQ_OFF] units", e); }
    glist.sort(function (a, b) { return a.surah - b.surah || a.from - b.from; });
    if (list.length) { _units = list; _groups = glist; }
    return list;
  }
  function units() { return _units || build(); }
  function groups() { if (!_groups) build(); return _groups || []; }
  function unitById(id) { var us = units(); for (var i = 0; i < us.length; i++) if (us[i].id === id) return us[i]; return null; }
  function itemOf(u) {
    var AY = window.SURAH_AYAT_COUNT || [];
    return u.kind === "full" ? { type: "quran", surah: u.surah, from: 1, to: AY[u.surah] || 1, fullSurah: true } : { type: "quran", surah: u.surah, from: u.ayah, to: u.ayah };
  }
  function keyOfUnit(rid, u) { return BASE + rid + "/" + p3(u.surah) + "-" + (u.kind === "full" ? "full" : p3(u.ayah)) + ".mp3"; }
  function keyOfItem(rid, it) { return BASE + rid + "/" + p3(it.surah) + "-" + (it.fullSurah ? "full" : p3(it.from)) + ".mp3"; }
  function reciters() { return window.RECITERS || []; }
  function recById(id) { var r = reciters(); for (var i = 0; i < r.length; i++) if (r[i].id === id) return r[i]; return null; }
  /* قارئ بلا مصادر آية بآية (مثل إدريس أبكر): نُحمّل سوره الكاملة فقط ونتجنّب طلب مقاطع غير متاحة */
  function unitSupported(rid, u) { var r = recById(rid); return !(r && (r.noPartial || r.offlineFullOnly) && !r.clipOffline && u.kind === "ayah"); }

  /* آيات إدريس أبكر المضمّنة داخل التطبيق (audio/adhkar-sabah/ayat-*.mp3) تعمل بدون إنترنت أصلًا */
  function bundled(rid, u) { try { return rid === "idris" && u.kind === "ayah" && window.RFQ_AUDIO && typeof RFQ_AUDIO.ayatFile === "function" && !!RFQ_AUDIO.ayatFile(u.surah, u.ayah); } catch (e) { return false; } }
  function haveUnit(rid, u) { return bundled(rid, u) || idx[keyOfUnit(rid, u)] != null; }

  /* ---------- حالة كل قارئ ---------- */
  function status(rid) {
    var us = units(), have = 0, bytes = 0, total = 0;
    for (var i = 0; i < us.length; i++) {
      if (!unitSupported(rid, us[i])) continue;
      total++;
      var k = keyOfUnit(rid, us[i]); if (bundled(rid, us[i])) { have++; } else if (idx[k] != null) { have++; bytes += idx[k] || 0; }
    }
    return { total: total, have: have, bytes: bytes, done: total > 0 && have === total };
  }

  /* ---------- API المستخدم من المشغّل ---------- */
  var API = { ready: !!hasCaches };
  API.has = function (rid, item) { return idx[keyOfItem(rid, item)] != null; };
  API.getUrl = function (rid, item) {
    if (!hasCaches) return Promise.resolve(null);
    return caches.open(CACHE_NAME).then(function (c) { return c.match(keyOfItem(rid, item)); }).then(function (res) {
      if (!res) { delete idx[keyOfItem(rid, item)]; saveIdx(); return null; }
      return res.blob().then(function (b) { return URL.createObjectURL(b); });
    }).catch(function () { return null; });
  };
  API.findAny = function (item, exceptId) {
    var rs = reciters(), i = 0;
    function next() {
      if (i >= rs.length) return Promise.resolve(null);
      var r = rs[i++]; if (r.id === exceptId || !API.has(r.id, item)) return next();
      return API.getUrl(r.id, item).then(function (u) { return u ? { url: u, name: r.short } : next(); });
    }
    return next();
  };
  API.badge = function (rid) { var s = status(rid); return s.done ? "✓ أوفلاين" : (s.have ? s.have + "/" + s.total : ""); };
  API.status = status;

  /* ---------- التحميل ---------- */
  var job = null, listeners = [];
  function emit() { for (var i = 0; i < listeners.length; i++) try { listeners[i](); } catch (e) {} updateChips(); }
  function isMp3(buf) { var b = new Uint8Array(buf.slice(0, 3)); return (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0); }

  function fetchUnit(rid, u, signal) {
    var r = recById(rid);
    if (r && window.RFQ_POLISH && window.RFQ_POLISH.appliesUnit(r, u)) return window.RFQ_POLISH.getBlob(r, u, signal);
    if (r && r.clipOffline && u.kind === "ayah" && window.RFQ_CLIP) return window.RFQ_CLIP.fetchClip(r, u, signal);
    var urls = window.RFQ_AUDIO.sameReciterUrls(r, itemOf(u)), n = 0, last;
    function tryNext() {
      if (n >= urls.length) return Promise.reject(last || new Error("no url"));
      var url = urls[n++];
      return fetch(url, { signal: signal }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.blob();
      }).then(function (blob) {
        if (blob.size < 3000) throw new Error("ملف صغير");
        return blob.slice(0, 3).arrayBuffer().then(function (hd) {
          if (!isMp3(hd)) throw new Error("ليس MP3");
          return blob;
        });
      }).catch(function (e) { if (e && e.name === "AbortError") throw e; last = e; return tryNext(); });
    }
    return tryNext();
  }

  API.download = function (rids, o) {
    o = o || {};
    if (!hasCaches) { toast("المتصفح لا يدعم التخزين للأوفلاين", true); return; }
    if (navigator.onLine === false) { toast("📴 لا يوجد اتصال — التحميل يحتاج إنترنت", true); return; }
    if (job && job.active) return;
    var tasks = [];
    rids.forEach(function (rid) { units().forEach(function (u) { if ((!o.only || o.only[u.id]) && unitSupported(rid, u) && !haveUnit(rid, u)) tasks.push({ rid: rid, u: u }); }); });
    if (!tasks.length) { toast("✓ كل ما اخترته محمّل بالفعل", false); return; }
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    job = { active: true, tasks: tasks, total: tasks.length, done: 0, failed: [], ctl: new AbortController(), running: {}, rids: rids.slice(), conc: 3, bytes: 0 };
    emit(); runJob();
  };
  API.stop = function () { if (job && job.active) { job.active = false; job.stopped = true; try { job.ctl.abort(); } catch (e) {} emit(); } };
  API.busy = function () { return !!(job && job.active); };

  function runJob() {
    var j = job;
    caches.open(CACHE_NAME).then(function (cache) {
      return new Promise(function (resolve) {
        var running = 0;
        function pump() {
          if (!j.active) { if (running === 0) resolve(); return; }
          if (!j.tasks.length && running === 0) return resolve();
          while (running < j.conc && j.tasks.length) { (function (t) {
            var key = keyOfUnit(t.rid, t.u); running++; j.running[key] = t; emit();
            fetchUnit(t.rid, t.u, j.ctl.signal).then(function (blob) {
              return cache.put(key, new Response(blob, { headers: { "Content-Type": "audio/mpeg", "X-Rafiq-Bytes": String(blob.size) } })).then(function () { idx[key] = blob.size; j.bytes += blob.size; });
            }).catch(function (e) { if (!(e && e.name === "AbortError")) j.failed.push({ rid: t.rid, u: t.u, msg: String(e && e.message || e) }); })
              .then(function () { running--; delete j.running[key]; j.done++; saveIdx(); emit(); pump(); });
          })(j.tasks.shift()); }
        }
        pump();
      });
    }).then(function () {
      j.active = false; j.finished = true; saveIdx(); markDone(); emit();
      if (j.stopped) return;
      if (j.failed.length) toast("⚠️ تعذّر تحميل " + j.failed.length + " مقطع — أعد المحاولة", true);
      else toast("✅ تم التحميل — يعمل الآن بدون إنترنت", false);
    }).catch(function (e) { j.active = false; emit(); toast("⚠️ تعذّر التحميل: " + (e && e.message || e), true); });
  }

  API.remove = function (rid) {
    if (!hasCaches) return Promise.resolve();
    return caches.open(CACHE_NAME).then(function (c) {
      var ks = Object.keys(idx).filter(function (k) { return k.indexOf(BASE + rid + "/") === 0; });
      delete doneFlags[rid]; ls(DONE_KEY, JSON.stringify(doneFlags)); if (window.RFQ_POLISH) window.RFQ_POLISH.clear(rid); return Promise.all(ks.map(function (k) { delete idx[k]; return c.delete(k); }));
    }).then(function () { saveIdx(); emit(); });
  };

  /* ---------- التسجيلات المحلية (الأدعية والسبحة) ---------- */
  function localFiles() {
    var set = {}, dir = "audio/adhkar-sabah/";
    function add(f) { set[f.indexOf("/") > -1 ? f : dir + f] = 1; }
    var F = window.LOCAL_DHIKR_FULL || {}, P = window.LOCAL_DHIKR_PARTS || {};
    for (var k in F) add(F[k]);
    for (var k2 in P) for (var m in P[k2]) add(P[k2][m]);
    TASBIH.forEach(function (n) { set["audio/tasbih/" + n + ".mp3"] = 1; });
    return Object.keys(set);
  }
  function abs(u) { return new URL(u, location.href).href; }
  API.verifyLocal = function (repair) {
    if (!hasCaches) return Promise.resolve({ total: 0, have: 0, missing: [] });
    var files = localFiles(), missing = [];
    return Promise.all(files.map(function (f) { return caches.match(abs(f)).then(function (r) { if (!r || r.status !== 200) missing.push(f); }).catch(function () { missing.push(f); }); }))
      .then(function () {
        var res = { total: files.length, have: files.length - missing.length, missing: missing };
        if (!repair || !missing.length || navigator.onLine === false) return res;
        return caches.open(MEDIA_CACHE).then(function (c) {
          var q = missing.slice(), fixed = 0;
          function worker() { var f = q.shift(); if (!f) return Promise.resolve(); return fetch(abs(f), { cache: "reload" }).then(function (r) { if (r.ok) return c.put(abs(f), r).then(function () { fixed++; }); }).catch(function () {}).then(worker); }
          return Promise.all([worker(), worker(), worker()]).then(function () { return API.verifyLocal(false).then(function (r2) { r2.fixed = fixed; return r2; }); });
        });
      });
  };

  /* ---------- فحص الجاهزية ---------- */
  API.readiness = function () {
    var cur = window.RFQ_AUDIO && RFQ_AUDIO.currentReciter(), s = cur ? status(cur.id) : null, out = [];
    out.push({ ok: !!(navigator.serviceWorker && navigator.serviceWorker.controller), label: "محرّك العمل بدون إنترنت (Service Worker)", fix: "افتح التطبيق مرة أخرى مع اتصال ثم أعد تحميل الصفحة" });
    return Promise.all([
      hasCaches ? caches.match("./index.html").then(function (r) { return !!r; }).catch(function () { return false; }) : Promise.resolve(false),
      API.verifyLocal(false)
    ]).then(function (a) {
      out.push({ ok: a[0], label: "واجهة التطبيق محفوظة", fix: "افتح التطبيق مرة واحدة مع اتصال ثابت" });
      out.push({ ok: a[1].have === a[1].total && a[1].total > 0, label: "تسجيلات الأدعية والسبحة (" + a[1].have + "/" + a[1].total + ")", fix: "اضغط «فحص وإصلاح» وأنت متصل" });
      if (s) out.push({ ok: s.done, label: "آيات وسور الأذكار بصوت " + cur.short + " (" + s.have + "/" + s.total + ")" + (cur.noPartial ? " • 🎧 سور كاملة فقط" : ""), fix: "اضغط «تحميل» تحت اسم القارئ" });
      return out;
    });
  };

  /* ---------- أدوات واجهة ---------- */
  function toast(msg, err) { if (typeof window.athToast === "function") { try { window.athToast(msg, !!err); return; } catch (e) {} } var d = document.createElement("div"); d.textContent = msg; d.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:10px 18px;border-radius:22px;z-index:99999;font:700 .85rem Tajawal,sans-serif"; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3000); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var CSS = '.rfo-ov{position:fixed;inset:0;z-index:100000;background:rgba(2,6,14,.8);display:flex;align-items:flex-end;justify-content:center;font-family:Tajawal,sans-serif;direction:rtl}' +
    '.rfo-sheet{width:min(580px,100%);max-height:93vh;overflow:auto;overscroll-behavior:contain;background:radial-gradient(120% 60% at 50% 0,#14263f 0,#09121f 55%,#050a14 100%);border:1px solid rgba(251,191,36,.3);border-radius:24px 24px 0 0;padding:18px 16px 28px;color:#e2e8f0;animation:rfoUp .3s cubic-bezier(.2,.8,.2,1)}' +
    '@keyframes rfoUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
    '.rfo-h{display:flex;align-items:center;gap:10px;margin-bottom:14px}.rfo-h b{flex:1;font-size:1.15rem;color:#fcd34d;font-family:Amiri,serif}' +
    '.rfo-x{background:rgba(255,255,255,.07);border:0;color:#cbd5e1;width:36px;height:36px;border-radius:50%;font-size:1.2rem;cursor:pointer}' +
    '.rfo-hero{display:flex;gap:14px;align-items:center;background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(251,191,36,.08));border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:14px;margin-bottom:12px}' +
    '.rfo-ring{width:70px;height:70px;flex:none;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#10b981 calc(var(--p,0)*1%),rgba(255,255,255,.08) 0)}' +
    '.rfo-ring i{width:56px;height:56px;border-radius:50%;background:#08111e;display:grid;place-items:center;font:900 1.05rem Tajawal,sans-serif;color:#fff}' +
    '.rfo-ring.ok{background:conic-gradient(#10b981 100%,#10b981 0);box-shadow:0 0 22px rgba(16,185,129,.45)}' +
    '.rfo-hero p{margin:3px 0 0;font-size:.8rem;color:#94a3b8;line-height:1.7}.rfo-hero strong{display:block;font-size:1.02rem;color:#f1f5f9}' +
    '.rfo-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:15px;padding:12px;margin-bottom:10px}.rfo-card.cur{border-color:rgba(251,191,36,.5);background:rgba(251,191,36,.06)}' +
    '.rfo-row{display:flex;align-items:center;gap:8px}.rfo-row b{flex:1;font-size:.95rem}' +
    '.rfo-tag{font-size:.7rem;padding:2px 9px;border-radius:12px;background:rgba(52,211,153,.15);color:#34d399;font-weight:800;white-space:nowrap}.rfo-tag.w{background:rgba(251,191,36,.14);color:#fbbf24}.rfo-tag.n{background:rgba(148,163,184,.14);color:#94a3b8}' +
    '.rfo-bar{height:7px;border-radius:7px;background:rgba(255,255,255,.07);margin:9px 0 6px;overflow:hidden}.rfo-bar i{display:block;height:100%;width:100%;transform-origin:right;transform:scaleX(var(--p,0));background:linear-gradient(90deg,#10b981,#fbbf24);transition:transform .3s}' +
    '.rfo-bar.live i{background:linear-gradient(90deg,#10b981,#fbbf24,#10b981);background-size:200% 100%;animation:rfoSh 1.4s linear infinite}@keyframes rfoSh{to{background-position:-200% 0}}' +
    '.rfo-sub{font-size:.74rem;color:#94a3b8;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.rfo-sp{flex:1}' +
    '.rfo-btn{border:1px solid rgba(251,191,36,.4);background:rgba(251,191,36,.12);color:#fbbf24;border-radius:11px;padding:8px 14px;font:800 .8rem Tajawal,sans-serif;cursor:pointer}.rfo-btn.g{border-color:rgba(52,211,153,.4);background:rgba(52,211,153,.12);color:#34d399}.rfo-btn.d{border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.08);color:#f87171}.rfo-btn.big{width:100%;padding:13px;font-size:.98rem;background:linear-gradient(135deg,#10b981,#059669);border:0;color:#fff;box-shadow:0 8px 22px rgba(16,185,129,.28)}.rfo-btn:disabled{opacity:.45}' +
    '.rfo-chk{list-style:none;margin:8px 0 0;padding:0}.rfo-chk li{font-size:.8rem;padding:4px 0;color:#cbd5e1}.rfo-chk .ok::before{content:"✓ ";color:#34d399;font-weight:900}.rfo-chk .no::before{content:"✕ ";color:#f87171;font-weight:900}.rfo-chk small{display:block;color:#94a3b8;margin-inline-start:16px}' +
    '.rfo-list{margin:8px 0}.rfo-g{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);margin-bottom:6px;cursor:pointer}.rfo-g.big{border-color:rgba(251,191,36,.45);background:rgba(251,191,36,.07)}.rfo-g.off{opacity:.55;cursor:default}.rfo-g.off .t b{color:#94a3b8}.rfo-g .st.na{color:#64748b}' +
    '.rfo-g input{width:19px;height:19px;accent-color:#10b981;flex:none}.rfo-g .t{flex:1;min-width:0}.rfo-g .t b{display:block;font-size:.86rem;color:#f1f5f9;line-height:1.5}.rfo-g .t small{color:#94a3b8;font-size:.7rem}.rfo-g .st{font-size:.74rem;font-weight:800;white-space:nowrap;color:#94a3b8}.rfo-g .st.ok{color:#34d399}.rfo-g .st.go{color:#fbbf24}' +
    '.rfo-chips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.rfo-chips span{font-size:.74rem;padding:3px 10px;border-radius:12px;background:rgba(251,191,36,.12);color:#fcd34d;font-weight:800}' +
    '.rfo-sum{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:13px;padding:10px 12px;font-size:.84rem;margin-bottom:10px;line-height:1.8}.rfo-now{font-size:.8rem;color:#fcd34d;min-height:1.4em;margin:2px 0 8px}' +
    '.rfo-done{text-align:center;padding:14px 4px}.rfo-done .c{width:64px;height:64px;margin:0 auto 8px;border-radius:50%;background:#10b981;color:#fff;display:grid;place-items:center;font-size:2rem;font-weight:900;box-shadow:0 0 28px rgba(16,185,129,.55);animation:rfoPop .45s cubic-bezier(.2,1.4,.4,1)}@keyframes rfoPop{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}' +
    '.rfo-chip-row{display:flex;justify-content:flex-end;margin:-2px 0 8px}.rfo-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.35);color:#34d399;padding:8px 12px;border-radius:10px;font:800 .78rem Tajawal,sans-serif;cursor:pointer;flex-shrink:0}.rfo-chip.w{background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.35);color:#fbbf24}.rfo-chip.o{background:rgba(148,163,184,.12);border-color:rgba(148,163,184,.3);color:#cbd5e1}' +
    '.ath-reciter-off{margin-inline-start:auto;font-size:.72rem;color:#34d399;font-weight:800}' +
    '@media (prefers-reduced-motion:reduce){.rfo-sheet,.rfo-done .c,.rfo-bar.live i{animation:none}}html.rfq-battery-saver .rfo-sheet,html.rfq-battery-saver .rfo-bar.live i{animation:none}';

  /* ---------- اللوحة ---------- */
  var panel = null, view = "main", pick = null;
  function ensureStyle() { if (!document.getElementById("rfo-style")) { var st = document.createElement("style"); st.id = "rfo-style"; st.textContent = CSS; document.head.appendChild(st); } }
  API.openPanel = function () {
    if (panel) return; ensureStyle(); view = "main"; pick = null;
    panel = document.createElement("div"); panel.className = "rfo-ov";
    panel.innerHTML = '<div class="rfo-sheet" role="dialog" aria-label="الأذكار أوفلاين"><div class="rfo-h"><b id="rfoTitle">📥 الأذكار بدون إنترنت</b><button class="rfo-x" aria-label="إغلاق">×</button></div><div id="rfoBody"></div></div>';
    panel.addEventListener("click", function (e) { if (e.target === panel || e.target.className === "rfo-x") API.closePanel(); });
    document.body.appendChild(panel); listeners.push(render); render();
  };
  API.closePanel = function () { if (!panel) return; panel.remove(); panel = null; listeners = listeners.filter(function (f) { return f !== render; }); };

  var _readyCache = null;
  function allIds() { return reciters().map(function (r) { return r.id; }); }
  function recNames(ids) { return ids.map(function (id) { var r = recById(id); return r ? r.short : id; }); }

  function render() {
    if (!panel) return; var body = panel.querySelector("#rfoBody"), sheet = panel.querySelector(".rfo-sheet"); if (!body) return;
    var top = sheet.scrollTop;
    body.innerHTML = view === "pick" ? pickHtml() : mainHtml();
    panel.querySelector("#rfoTitle").textContent = view === "pick" ? "ما الذي سيتم تحميله؟" : "📥 الأذكار بدون إنترنت";
    sheet.scrollTop = top; if (view === "main") storeInfo();
  }

  function mainHtml() {
    var cur = RFQ_AUDIO.currentReciter(), online = navigator.onLine !== false, rs = reciters(), cs = status(cur.id), busy = API.busy();
    var pct = cs.total ? Math.round(cs.have / cs.total * 100) : 0;
    var h = '<div class="rfo-hero"><div class="rfo-ring' + (cs.done ? " ok" : "") + '" style="--p:' + pct + '"><i>' + (cs.done ? "✓" : pct + "%") + '</i></div><div><strong>' + (cs.done ? "جاهز بدون إنترنت" : "لم يُحمَّل شيء بعد لهذا القارئ") + '</strong><p>' + (online ? "متصل بالإنترنت" : "📴 أنت الآن أوفلاين — المحمَّل يعمل") + ' • القارئ الحالي: ' + esc(cur.short) + '</p><p>لن يتم تحميل أي شيء إلا بعد أن تختار وتضغط «ابدأ التحميل».</p></div></div>';
    rs.forEach(function (r) {
      var s = status(r.id), isCur = r.id === cur.id;
      var fresh = !s.done && doneFlags[r.id] && s.have, tag = s.done ? '<span class="rfo-tag">✓ جاهز</span>' : (fresh ? '<span class="rfo-tag w">🆕 ' + (s.total - s.have) + ' جديد</span>' : s.have ? '<span class="rfo-tag w">' + s.have + "/" + s.total + '</span>' : '<span class="rfo-tag n">غير محمّل</span>');
      h += '<div class="rfo-card' + (isCur ? " cur" : "") + '"><div class="rfo-row"><b>' + esc(r.name) + (r.noPartial ? ' <span class="rfo-tag n">🎧 سور كاملة فقط</span>' : "") + '</b>' + tag + '</div><div class="rfo-bar"><i style="--p:' + (s.total ? (s.have / s.total).toFixed(3) : 0) + '"></i></div><div class="rfo-sub"><span>' + s.have + " من " + s.total + " مقطع" + (s.bytes > 1000 ? " • " + mb(s.bytes) : "") + '</span><span class="rfo-sp"></span>' +
        (isCur ? "" : '<button class="rfo-btn g" data-a="sel" data-r="' + r.id + '">اختيار</button>') +
        (s.have ? '<button class="rfo-btn d" data-a="del" data-r="' + r.id + '"' + (busy ? " disabled" : "") + '>حذف</button>' : "") +
        (s.done ? "" : '<button class="rfo-btn" data-a="pick" data-r="' + r.id + '"' + (busy ? " disabled" : "") + '>' + (fresh ? "تحميل الجديد" : s.have ? "إكمال التحميل" : "تحميل") + '…</button>') + '</div></div>';
    });
    h += '<div class="rfo-card"><button class="rfo-btn" style="width:100%" data-a="pickall"' + (busy ? " disabled" : "") + '>⬇ اختيار وتحميل القراء الستة…</button></div>';
    h += '<div class="rfo-card"><div class="rfo-row"><b>🩺 فحص الجاهزية</b><button class="rfo-btn g" data-a="check">فحص وإصلاح</button></div><ul class="rfo-chk">' + (_readyCache ? chkHtml(_readyCache) : "<li>اضغط «فحص وإصلاح» للتأكد أن كل شيء يعمل بدون إنترنت. (الإصلاح يحمّل فقط تسجيلات الأدعية الناقصة من التطبيق نفسه.)</li>") + '</ul><div class="rfo-sub" id="rfoStore" style="margin-top:8px"></div></div>';
    h += '<div class="rfo-card rfo-safe"><div class="rfo-row"><b>🛡 تحميلاتك محفوظة مع كل تحديث</b></div><p class="rfo-sub" style="margin:6px 0;line-height:1.8">عند صدور نسخة جديدة من التطبيق تبقى المقاطع المحمَّلة على جهازك ولا تحتاج لتحميلها مرة أخرى؛ لو أُضيف مقطع جديد يُعرض لك اختياريًا فقط. تُحذف فقط إذا ضغطت «حذف» أو مسحت بيانات الموقع من المتصفح.' + (API.appVersion() ? "<br>نسخة التطبيق الحالية: <b>" + esc(API.appVersion()) + "</b>" : "") + '</p><div class="rfo-sub" id="rfoPersist"></div></div>';
    return h;
  }
  function chkHtml(list) { return list.map(function (c) { return '<li class="' + (c.ok ? "ok" : "no") + '">' + esc(c.label) + (c.ok ? "" : "<small>" + esc(c.fix) + "</small>") + "</li>"; }).join(""); }

  function selectedUnits() { var set = {}; groups().forEach(function (g) { if (!pick.off[g.id]) g.uids.forEach(function (u) { set[u] = 1; }); }); return set; }
  function gState(g, rids) {
    var have = 0, tot = 0, going = false;
    g.uids.forEach(function (uid) { var u = unitById(uid); rids.forEach(function (rid) { if (!unitSupported(rid, u)) return; tot++; var k = keyOfUnit(rid, u); if (haveUnit(rid, u)) have++; if (job && job.active && job.running[k]) going = true; }); });
    return { have: have, tot: tot, going: going, none: tot === 0 };
  }
  function pickHtml() {
    var rids = pick.rids, sel = selectedUnits(), busy = API.busy(), finished = job && job.finished && !job.active && !job.stopped && pick.started;
    var needed = 0, already = 0; rids.forEach(function (rid) { Object.keys(sel).forEach(function (uid) { var u = unitById(uid); if (!unitSupported(rid, u)) return; if (haveUnit(rid, u)) already++; else needed++; }); });
    var fullOnly = rids.filter(function (rid) { var r = recById(rid); return r && (r.noPartial || r.offlineFullOnly); }).map(function (rid) { return (recById(rid) || {}).short; });
    var h = '<div class="rfo-chips">' + recNames(rids).map(function (n) { return "<span>🎙 " + esc(n) + "</span>"; }).join("") + '</div>';
    if (busy || (job && pick.started && (job.finished || job.stopped))) {
      var p = job.total ? job.done / job.total : 0, cur = Object.keys(job.running).map(function (k) { var t = job.running[k]; return (_uLabel[t.u.id] || "") + " — " + (recById(t.rid) || {}).short; })[0] || "";
      if (finished && !job.failed.length) h += '<div class="rfo-done"><div class="c">✓</div><b style="font-size:1.05rem;color:#f1f5f9">تم التحميل — يعمل الآن بدون إنترنت</b><p class="rfo-sub" style="justify-content:center;margin-top:6px">' + job.done + " مقطع • " + mb(job.bytes) + '</p></div>';
      else h += '<div class="rfo-card"><div class="rfo-row"><b>' + (busy ? "جارٍ التحميل…" : (job.stopped ? "تم الإيقاف" : "انتهى مع أخطاء")) + '</b><span class="rfo-tag w">' + job.done + "/" + job.total + '</span></div><div class="rfo-bar' + (busy ? " live" : "") + '"><i style="--p:' + p.toFixed(3) + '"></i></div><div class="rfo-now">' + (busy ? "⬇ " + esc(cur) : "") + '</div>' + (job.failed.length ? '<div class="rfo-sub" style="color:#f87171">تعذّر تحميل ' + job.failed.length + ' مقطع (تحقق من الاتصال ثم اضغط ابدأ مرة أخرى)</div>' : "") + (busy ? '<button class="rfo-btn d" data-a="stop" style="margin-top:8px">إيقاف</button>' : "") + '</div>';
    } else {
      h += '<div class="rfo-sum">سيتم تحميل <b>' + needed + '</b> مقطع صوتي' + (rids.length > 1 ? " (لـ " + rids.length + " قراء)" : "") + (already ? " • محمّل بالفعل: " + already : "") + (fullOnly.length ? '<br><span style="color:#fcd34d">🎧 ' + esc(fullOnly.join("، ")) + ': تنزيل السور كاملة فقط؛ تشغيل الآيات المنفردة يحتاج اتصالاً بالإنترنت</span>' : "") + '<br><span style="color:#94a3b8;font-size:.76rem">اختر ما تريد من القائمة. للتشغيل بدون إنترنت، اختر ما تريد من القائمة ثم اضغط «ابدأ التحميل» — كل ذكر يُحمَّل بصوت القارئ الذي اخترته (آيات الأذكار تُحمَّل آية بآية بدون سور كاملة). يُحمَّل الملف من الإنترنت إلى جهازك فقط بعد موافقتك.</span></div>';
    }
    h += '<div class="rfo-list">';
    groups().forEach(function (g) {
      var st = gState(g, rids), on = !pick.off[g.id], mark = st.none ? '<span class="st na">🎧 غير متاح بصوته</span>' : (st.going ? '<span class="st go">⬇ جارٍ</span>' : (st.have === st.tot ? '<span class="st ok">✓ محمّل</span>' : (st.have ? '<span class="st">' + st.have + "/" + st.tot + "</span>" : '<span class="st">—</span>')));
      var sub = (g.full ? "سورة كاملة" : g.uids.length + (g.uids.length > 1 ? " آيات" : " آية")) + " • " + g.tags.join(" · ") + (g.big ? " • ملف كبير" : "") + (st.none ? " • سور كاملة فقط عند " + (rids.length > 1 ? "القراء المحددين" : "هذا القارئ") : "");
      h += '<label class="rfo-g' + (g.big ? " big" : "") + (st.none ? " off" : "") + '"><input type="checkbox" data-g="' + g.id + '"' + (on ? " checked" : "") + (busy || st.none ? " disabled" : "") + '><span class="t"><b>' + (g.big ? "📖 " : "") + esc(g.label) + (g.big ? " — كاملة" : "") + '</b><small>' + esc(sub) + '</small></span>' + mark + '</label>';
    });
    h += '</div><div class="rfo-row" style="margin-top:8px">';
    h += '<button class="rfo-btn" data-a="back"' + (busy ? " disabled" : "") + '>← رجوع</button><button class="rfo-btn g" data-a="toggleall"' + (busy ? " disabled" : "") + '>' + (Object.keys(pick.off).length ? "تحديد الكل" : "إلغاء التحديد") + '</button></div>';
    if (!busy) h += '<button class="rfo-btn big" data-a="start" style="margin-top:12px"' + (!needed || navigator.onLine === false ? " disabled" : "") + '>' + (navigator.onLine === false ? "📴 يلزم اتصال بالإنترنت" : (needed ? "ابدأ التحميل (" + needed + " مقطع)" : "✓ كل المختار محمّل")) + '</button>';
    return h;
  }

  function storeInfo() {
    var el = panel && panel.querySelector("#rfoStore"), pe = panel && panel.querySelector("#rfoPersist"); if (!el || !navigator.storage || !navigator.storage.estimate) return;
    Promise.all([navigator.storage.estimate(), navigator.storage.persisted ? navigator.storage.persisted() : false]).then(function (r) {
      if (el.isConnected) el.textContent = "💾 المساحة المستخدمة: " + mb(r[0].usage || 0) + (r[0].quota ? " من " + mb(r[0].quota) : "");
      if (pe && pe.isConnected) pe.innerHTML = r[1] ? '<span class="rfo-tag">🔒 محميّة من الحذف التلقائي</span>' : '<span class="rfo-tag w">غير مثبّتة</span><button class="rfo-btn g" data-a="persist">🔒 ثبّت الحماية</button><span style="flex-basis:100%">على الآيفون يُفضَّل «إضافة إلى الشاشة الرئيسية» حتى لا يحذف Safari البيانات بعد أسبوع من عدم الاستخدام.</span>';
    }).catch(function () {});
  }
  document.addEventListener("change", function (e) {
    var t = e.target; if (!panel || !pick || !t.getAttribute || !t.getAttribute("data-g")) return;
    var id = t.getAttribute("data-g"); if (t.checked) delete pick.off[id]; else pick.off[id] = true; render();
  });
  document.addEventListener("click", function (e) {
    var t = e.target; if (!panel || !panel.contains(t)) return;
    var a = t.getAttribute && t.getAttribute("data-a"), r = t.getAttribute && t.getAttribute("data-r");
    if (!a) return;
    if (a === "pick" || a === "pickall") { pick = { rids: a === "pick" ? [r] : allIds(), off: {}, started: false }; view = "pick"; render(); }
    else if (a === "back") { view = "main"; pick = null; render(); }
    else if (a === "toggleall") { if (Object.keys(pick.off).length) pick.off = {}; else groups().forEach(function (g) { pick.off[g.id] = true; }); render(); }
    else if (a === "start") { pick.started = true; API.download(pick.rids, { only: selectedUnits() }); render(); }
    else if (a === "stop") API.stop();
    else if (a === "persist") { try { navigator.storage.persist().then(function (ok) { toast(ok ? "🔒 تم تثبيت الحماية" : "المتصفح لم يمنح الحماية الآن (يمنحها غالبًا بعد تكرار الاستخدام أو التثبيت كتطبيق)", !ok); storeInfo(); }); } catch (e) {} }
    else if (a === "del") { if (confirm("حذف تحميلات هذا القارئ من الجهاز؟")) API.remove(r); }
    else if (a === "sel") { var i = reciters().findIndex(function (x) { return x.id === r; }); if (i > -1 && window.athMP_setReciter) { athMP_setReciter(i); setTimeout(render, 50); } }
    else if (a === "check") { t.disabled = true; t.textContent = "جارٍ الفحص…"; API.verifyLocal(true).then(function () { return API.readiness(); }).then(function (l) { _readyCache = l; render(); }); }
  });

  /* ---------- أزرار داخل شاشات الأذكار (لا تحمّل شيئاً، فقط تفتح اللوحة) ---------- */
  function chipState() {
    var cur = window.RFQ_AUDIO && RFQ_AUDIO.currentReciter(); if (!cur) return ["", "o"];
    var s = status(cur.id);
    if (job && job.active) return ["⬇ " + (job.total ? Math.round(job.done / job.total * 100) : 0) + "%", "w"];
    if (navigator.onLine === false) return [s.done ? "📴 جاهز" : "📴 " + s.have + "/" + s.total, s.done ? "" : "w"];
    if (s.done) return ["✓ أوفلاين", ""];
    if (doneFlags[cur.id] && s.have) return ["🆕 " + (s.total - s.have) + " جديد", "w"];
    return ["⬇ حمّل للأوفلاين", "w"];
  }
  function updateChips() { var c; try { c = chipState(); } catch (e) { c = ["⬇ حمّل للأوفلاين", "w"]; } document.querySelectorAll(".rfo-chip").forEach(function (b) { b.textContent = c[0]; b.className = "rfo-chip " + c[1]; }); }
  function makeChipRow() {
    var wrap = document.createElement("div"); wrap.className = "rfo-chip-row";
    var b = document.createElement("button"); b.className = "rfo-chip"; b.type = "button"; b.title = "اعرف ما سيتم تحميله ثم حمّل للاستماع بدون إنترنت";
    b.addEventListener("click", function () { API.openPanel(); }); wrap.appendChild(b);
    return wrap;
  }
  function injectChips() {
    ensureStyle();
    document.querySelectorAll(".ath-playall-btn").forEach(function (btn) {
      var row = btn.parentNode;
      /* الأفضل: داخل القائمة المنسدلة «الدرجات والتحميل» في هيدر الأذكار (توفير مساحة على الموبايل) */
      var head = row.parentNode, body = head && head.querySelector(".ath-drop-body");
      if (body) {
        var ex = body.querySelector(".rfo-chip-row");
        if (ex) { var eb = ex.querySelector(".rfo-chip"); if (eb && !eb.__rfo) { eb.__rfo = 1; eb.addEventListener("click", function () { API.openPanel(); }); } return; }
        body.appendChild(makeChipRow());
        return;
      }
      /* احتياطي: لو الهيدر قديم بدون قائمة، نفس السلوك السابق (سطر مستقل تحت «تشغيل الكل») */
      if (row.nextElementSibling && row.nextElementSibling.classList.contains("rfo-chip-row")) return;
      row.parentNode.insertBefore(makeChipRow(), row.nextSibling);
    });
    updateChips();
  }
  API.refreshChips = function () { injectChips(); };
  function reconcile() {
    if (!hasCaches) return Promise.resolve();
    return caches.open(CACHE_NAME).then(function (c) {
      return c.keys().then(function (ks) {
        var present = {}, ch = false;
        return Promise.all(ks.map(function (req) {
          present[req.url] = 1;
          if (idx[req.url] > 1) return;
          return c.match(req).then(function (res) {
            var n = res ? parseInt(res.headers.get("X-Rafiq-Bytes") || "0", 10) : 0;
            if (n && n < 3000) { delete present[req.url]; return c.delete(req); }
            idx[req.url] = n || 1; ch = true;
          });
        })).then(function () {
          Object.keys(idx).forEach(function (k) { if (!present[k]) { delete idx[k]; ch = true; } });
          if (ch) saveIdx(); markDone(); emit();
        });
      });
    }).catch(function () {});
  }

  /* ---------- بقاء التحميلات عبر تحديثات التطبيق ---------- */
  function appVer() { try { return JSON.parse(ls(VER_KEY) || "null"); } catch (e) { return null; } }
  function onSwUpdated(msg) {
    var prev = appVer(), ver = msg.version || "";
    reconcile().then(function () {
      var n = Object.keys(idx).length;
      if (prev && prev.v && ver && prev.v !== ver && n > 0) {
        var fresh = reciters().filter(function (r) { return doneFlags[r.id] && !status(r.id).done; }).length;
        toast("🎉 تم تحديث رفيق المسلم إلى " + ver + " — تحميلاتك الأوفلاين محفوظة (" + n + " مقطع)" + (fresh ? " • يوجد مقاطع جديدة اختيارية" : ""), false);
      }
      ls(VER_KEY, JSON.stringify({ v: ver, n: n, t: Date.now() }));
      if (panel) render();
    });
  }
  API.appVersion = function () { var v = appVer(); return v && v.v || ""; };

  API.__reconcile = reconcile;
  window.RFQ_OFFLINE = API;
  function boot() {
    injectChips(); reconcile();
    try { if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", function (e) { if (e.data && e.data.type === "SW_UPDATED") onSwUpdated(e.data); }); } catch (e) {}
    document.addEventListener("rfq:reciter", updateChips);
    window.addEventListener("online", function () { updateChips(); render(); });
    window.addEventListener("offline", function () { updateChips(); render(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
