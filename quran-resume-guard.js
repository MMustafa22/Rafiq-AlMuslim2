/* ============================================================
   حرس الشبكة واستئناف التلاوة — رفيق المسلم
   ------------------------------------------------------------
   • إذا انقطع الإنترنت أثناء سماع القرآن: يُحفظ آخر موضع (السورة/القارئ/الآية/الثانية)
     ويُستأنف تلقائيًا من نفس الموضع عند رجوع الاتصال — لا من أول السورة.
   • يمنع محرّك الآيات من «تخطّي» الآيات عند انقطاع الشبكة (وهو سبب الرجوع للبداية).
   • يبدّل خوادم القرّاء تلقائيًا (كلها HTTPS على المنفذ 443) لتعمل خلف الفايروول،
     مع إمكانية تمرير الصوت عبر بوابة الشركة إن كانت تحجب نطاقات القرّاء.
   • يفضّل النسخة المحفوظة أوفلاين (Cache Storage) إن وُجدت.
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "rfq_quran_resume_v1";
  var GATEWAY_KEY = "rfq_audio_gateway";
  var GOLD_STORE_KEY = null; // غير مستخدم هنا — للتوافق فقط
  var MIRROR_SERVERS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  var MAX_MIRROR_TRIES = 4;
  var MIN_RESUME_SECONDS = 20;

  /* ---------------- تخزين آمن ---------------- */
  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }
  function readState() {
    try {
      var s = JSON.parse(lsGet(STORE_KEY) || "null");
      return s && typeof s === "object" ? s : null;
    } catch (e) { return null; }
  }
  function writeState(s) {
    if (!s) return;
    s.ts = Date.now();
    lsSet(STORE_KEY, JSON.stringify(s));
  }
  function toNum(v) { v = parseFloat(v); return isFinite(v) ? v : 0; }
  function isOffline() { return navigator.onLine === false; }

  /* ---------------- واجهة الحالة ---------------- */
  var CSS_ID = "rfq-net-guard-style";
  var CSS = [
    "#rfqNetBanner{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 92px);",
    "z-index:9995;max-width:min(94vw,470px);width:max-content;box-sizing:border-box;display:none;align-items:center;gap:9px;",
    "padding:9px 13px;border-radius:13px;direction:rtl;font-family:Tajawal,sans-serif;font-size:.78rem;font-weight:700;",
    "line-height:1.6;color:#dbeafe;background:rgba(15,23,42,.96);border:1px solid rgba(96,165,250,.45);",
    "box-shadow:0 10px 30px rgba(0,0,0,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}",
    "#rfqNetBanner.show{display:flex}",
    "#rfqNetBanner[data-mode=warn]{border-color:rgba(251,191,36,.55);color:#fde68a;background:rgba(41,29,4,.96)}",
    "#rfqNetBanner[data-mode=ok]{border-color:rgba(52,211,153,.55);color:#a7f3d0;background:rgba(4,35,28,.96)}",
    "#rfqNetBanner b{color:#fff}",
    ".rfq-net-btn{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:inherit;border-radius:9px;",
    "padding:4px 9px;font-family:inherit;font-size:.72rem;font-weight:800;cursor:pointer;white-space:nowrap}",
    ".rfq-net-btn:hover{filter:brightness(1.18)}",
    "#rfqResumeChip{display:none!important}",
    "#rfqResumeInline{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:7px 13px;border:1px solid rgba(15,125,91,.55);border-radius:999px;background:rgba(15,125,91,.14);color:#b7f3d8;font:800 .88rem Tajawal,sans-serif;cursor:pointer;white-space:nowrap}",
    "#rfqResumeInline:hover{filter:brightness(1.12)}html[data-rafiq-theme=\"light\"] #rfqResumeInline{background:rgba(15,125,91,.1);color:#0c6f50;border-color:rgba(15,125,91,.45)}",
    "#rfqResumeChip{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 34px);",
    "z-index:9994;display:none;align-items:center;gap:10px;padding:8px 10px 8px 12px;border-radius:14px;direction:rtl;",
    "font-family:Tajawal,sans-serif;background:linear-gradient(135deg,rgba(26,42,66,.98),rgba(11,20,34,.98));",
    "border:1px solid rgba(212,175,55,.5);box-shadow:0 12px 32px rgba(0,0,0,.5);max-width:min(94vw,430px)}",
    "#rfqResumeChip.show{display:flex}",
    ".rc-ic{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;",
    "background:rgba(212,175,55,.18);color:#f2cc6e;font-size:.85rem}",
    ".rc-txt{display:flex;flex-direction:column;gap:1px;color:#e7eef8;font-size:.76rem;font-weight:800;line-height:1.45}",
    ".rc-txt small{color:#9fb0c6;font-size:.68rem;font-weight:700}",
    ".rc-go{border:1px solid rgba(52,211,153,.5);background:rgba(52,211,153,.16);color:#86efac;border-radius:9px;",
    "padding:6px 11px;font-family:inherit;font-size:.74rem;font-weight:900;cursor:pointer;flex-shrink:0}",
    ".rc-x{border:0;background:transparent;color:#94a3b8;font-size:1rem;cursor:pointer;padding:2px 4px;flex-shrink:0}",
    ".rfq-gw-ov{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;",
    "background:rgba(2,6,23,.9);direction:rtl;font-family:Tajawal,sans-serif}",
    ".rfq-gw-box{background:#0f1c30;border:1px solid rgba(212,175,55,.35);border-radius:16px;padding:16px;max-width:430px;width:100%;color:#e2e8f0}",
    ".rfq-gw-box h3{margin:0 0 8px;color:#f2cc6e;font-size:1rem}",
    ".rfq-gw-box p{margin:0 0 10px;font-size:.76rem;line-height:1.9;color:#9fb0c6}",
    ".rfq-gw-box input{width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid rgba(212,175,55,.3);",
    "background:rgba(0,0,0,.3);color:#fff;font-family:inherit;font-size:.8rem;text-align:left;direction:ltr;outline:0}",
    ".rfq-gw-row{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}",
    ".rfq-gw-row button{flex:1;min-width:96px;padding:9px;border-radius:10px;font-family:inherit;font-size:.78rem;font-weight:800;cursor:pointer;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#e2e8f0}",
    ".rfq-gw-row button.primary{border-color:rgba(52,211,153,.5);background:rgba(52,211,153,.16);color:#86efac}",
    /* ---------- الوضع النهاري: نفس لوحة التطبيق (كريمي/ذهبي) ---------- */
    "html[data-rafiq-theme=\"light\"] #rfqNetBanner{color:#2b4a6b;background:rgba(255,253,248,.97);border-color:rgba(96,165,250,.5);box-shadow:0 10px 30px rgba(120,88,23,.18)}",
    "html[data-rafiq-theme=\"light\"] #rfqNetBanner b{color:#1e3a5f}",
    "html[data-rafiq-theme=\"light\"] #rfqNetBanner[data-mode=warn]{border-color:rgba(163,120,19,.55);color:#7b5a10;background:rgba(255,247,224,.97)}",
    "html[data-rafiq-theme=\"light\"] #rfqNetBanner[data-mode=ok]{border-color:rgba(15,125,91,.5);color:#0c6f50;background:rgba(240,253,248,.97)}",
    "html[data-rafiq-theme=\"light\"] .rfq-net-btn{border-color:rgba(163,120,19,.35);background:rgba(201,162,39,.12);color:inherit}",
    "html[data-rafiq-theme=\"light\"] #rfqResumeChip{background:linear-gradient(135deg,#fffdf8,#f4ead4);border-color:rgba(163,120,19,.45);box-shadow:0 12px 32px rgba(120,88,23,.22)}",
    "html[data-rafiq-theme=\"light\"] .rc-ic{background:rgba(201,162,39,.18);color:#8a6408}",
    "html[data-rafiq-theme=\"light\"] .rc-txt{color:#2b2115}",
    "html[data-rafiq-theme=\"light\"] .rc-txt small{color:#7b6a4f}",
    "html[data-rafiq-theme=\"light\"] .rc-go{border-color:rgba(15,125,91,.45);background:rgba(15,125,91,.12);color:#0c6f50}",
    "html[data-rafiq-theme=\"light\"] .rc-x{color:#7b6a4f}",
    "html[data-rafiq-theme=\"light\"] .rfq-gw-ov{background:rgba(120,100,60,.35)}",
    "html[data-rafiq-theme=\"light\"] .rfq-gw-box{background:#fffdf8;border-color:rgba(163,120,19,.35);color:#2b2115}",
    "html[data-rafiq-theme=\"light\"] .rfq-gw-box h3{color:#8a6408}",
    "html[data-rafiq-theme=\"light\"] .rfq-gw-box p{color:#5d4c33}",
    "html[data-rafiq-theme=\"light\"] .rfq-gw-box input{background:#fff;border-color:rgba(163,120,19,.35);color:#2b2115}",
    "html[data-rafiq-theme=\"light\"] .rfq-gw-row button{border-color:rgba(163,120,19,.3);background:rgba(201,162,39,.1);color:#3a2f1e}",
    "html[data-rafiq-theme=\"light\"] .rfq-gw-row button.primary{border-color:rgba(15,125,91,.45);background:rgba(15,125,91,.12);color:#0c6f50}"
  ].join("");

  function injectStyle() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement("style");
    st.id = CSS_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var bannerTimer = 0;
  function bannerNode() {
    var b = document.getElementById("rfqNetBanner");
    if (b) return b;
    injectStyle();
    b = document.createElement("div");
    b.id = "rfqNetBanner";
    b.setAttribute("role", "status");
    b.setAttribute("aria-live", "polite");
    document.body.appendChild(b);
    return b;
  }
  function say(html, mode, autoHideMs) {
    if (!document.body) return;
    var b = bannerNode();
    b.innerHTML = html;
    b.setAttribute("data-mode", mode || "info");
    b.classList.add("show");
    if (bannerTimer) clearTimeout(bannerTimer);
    if (autoHideMs) bannerTimer = setTimeout(function () { b.classList.remove("show"); }, autoHideMs);
  }
  function silence() {
    var b = document.getElementById("rfqNetBanner");
    if (b) b.classList.remove("show");
  }

  /* ---------------- أدوات الروابط ---------------- */
  function fleet() {
    return {
      state: readState,
      gateway: function () { return (lsGet(GATEWAY_KEY) || "").trim(); },
      setGateway: setGateway,
      resume: function () { resumeAll(true); },
      offline: isOffline
    };
  }

  function setGateway(url) {
    url = String(url || "").trim();
    if (url) lsSet(GATEWAY_KEY, url); else { try { localStorage.removeItem(GATEWAY_KEY); } catch (e) {} }
    say("✅ تم حفظ بوابة الصوت — ستُستخدم في كل التلاوات القادمة.", "ok", 4000);
  }

  function gatewayUrl(u) {
    var g = fleet().gateway();
    if (!g || !u) return "";
    if (g.indexOf("{url}") > -1) return g.replace(/\{url\}/g, encodeURIComponent(u));
    return g + (g.indexOf("?") > -1 ? "&" : "?") + "url=" + encodeURIComponent(u);
  }

  function playableUrl(u) {
    return gatewayUrl(u) || u;
  }

  function mirrorList(u) {
    var out = [];
    var url;
    var base = (typeof location !== "undefined" && location.href) ? location.href
      : ((document.baseURI) || "https://rafiq.local/");
    try { url = new URL(u, base); } catch (e) { return out; }
    var host = url.hostname;
    if (!/\.mp3quran\.net$/i.test(host)) return out;
    MIRROR_SERVERS.forEach(function (n) {
      var h = "server" + n + ".mp3quran.net";
      if (h.toLowerCase() !== host.toLowerCase()) {
        out.push(url.protocol + "//" + h + url.pathname + url.search);
      }
    });
    // ابدأ من خادم مختلف عن الحالي ثم أكمل بالترتيب
    var start = new Date().getSeconds() % Math.max(1, out.length);
    return out.slice(start).concat(out.slice(0, start));
  }

  function cachedBlob(u) {
    if (!u || u.indexOf("blob:") === 0 || typeof caches === "undefined") return Promise.resolve("");
    return caches.match(u, { ignoreSearch: true }).then(function (res) {
      return res ? res.blob().then(function (b) { return URL.createObjectURL(b); }) : "";
    }).catch(function () { return ""; });
  }

  /* ---------------- تتبّع عناصر الصوت ---------------- */
  var tracked = [];

  function snapshot(el) {
    var src = el.currentSrc || el.src || "";
    var st = { time: toNum(el.currentTime), url: src };
    var dataSurah = el.getAttribute("data-surah");
    if (dataSurah) st.surah = toNum(dataSurah);

    var R = window.RAQ;
    if (R && R.queue && R.queue[R.idx]) {
      var it = R.queue[R.idx];
      if (it && it.type === "quran") {
        st.surah = toNum(it.surah) || st.surah;
        st.ayah = toNum(it.from);
        st.label = it.label || st.label;
        st.engine = "adhkar";
      }
    }
    if (typeof window.athMP_getCurrentReciterIdx === "function" && typeof window.athMP_getReciters === "function") {
      try {
        var list = window.athMP_getReciters();
        var rec = list && list[window.athMP_getCurrentReciterIdx()];
        if (rec) { st.reciterName = rec.name; st.reciterKey = rec.id; }
      } catch (e) {}
    }
    if (!st.surah && src) {
      var m = src.match(/\/(\d{3})(\d{3})\.mp3/i);
      if (m) { st.surah = parseInt(m[1], 10); st.ayah = parseInt(m[2], 10); }
      else {
        m = src.match(/\/(\d{3})\.mp3/i);
        if (m) st.surah = parseInt(m[1], 10);
      }
    }
    var rs = document.getElementById("readerSelect");
    if (rs && rs.value) st.reciterId = String(rs.value);
    var title = document.getElementById("currentSurahName");
    if (title) {
      var t = (title.textContent || "").replace(/^[^\u0600-\u06FF]+/, "").replace(/^سورة\s*/, "").trim();
      if (t) st.surahName = t;
    }
    if (!st.surahName && st.surah && typeof SURAH_NAMES !== "undefined" && SURAH_NAMES[st.surah]) {
      st.surahName = SURAH_NAMES[st.surah];
    }
    st.seconds = st.time;
    // نتعامل مع تلاوات القرآن فقط (وليس الأذان أو الأذكار المحلية)
    var isQuran = st.engine === "adhkar" || /everyayah\.com|mp3quran\.net|islamic\.network/i.test(st.url);
    return (isQuran && (st.url || st.surah)) ? st : null;
  }

  function saveNow(el) {
    var st = snapshot(el);
    if (!st) return null;
    el.__rfqRec = st;
    writeState(st);
    return st;
  }

  function track(el) {
    if (!el || el.__rfqNet) return;
    el.__rfqNet = true;
    el.__rfqWanted = false;
    el.__rfqMirror = 0;
    tracked.push(el);

    el.addEventListener("play", function () {
      el.__rfqWanted = true;
      el.__rfqMirror = 0;
      el.__rfqTries = 0;
      el.__rfqGiveUp = false;
    });
    el.addEventListener("playing", function () {
      el.__rfqWanted = true;
      el.__rfqMirror = 0;
      el.__rfqTries = 0;
      el.__rfqGiveUp = false;
      if (el.__rfqWasOffline) {
        el.__rfqWasOffline = false;
        el.__rfqPending = false;
        say("✅ عاد الاتصال — استُؤنفت التلاوة من نفس الموضع الذي توقّفت عنده.", "ok", 4500);
      }
    });
    el.addEventListener("pause", function () {
      if (el.__rfqGrace) { el.__rfqGrace = false; return; }
      if (!el.__rfqPending) el.__rfqWanted = false;
    });
    el.addEventListener("timeupdate", function () {
      if (!el.__rfqWanted || el.__rfqPending) return;
      var last = el.__rfqLastSave || 0;
      if (Date.now() - last < 1500) return;
      el.__rfqLastSave = Date.now();
      saveNow(el);
    });
    el.addEventListener("ended", function () {
      el.__rfqWanted = false;
      el.__rfqPending = false;
    });
  }

  function scan() {
    var nodes = document.querySelectorAll("audio");
    for (var i = 0; i < nodes.length; i++) track(nodes[i]);
    if (window.RAQ && window.RAQ.audioEl) track(window.RAQ.audioEl);
  }

  /* ---------------- الاستئناف ---------------- */
  function resume(el, force) {
    if (!el || !el.__rfqPending) return;
    if (!force && Date.now() - (el.__rfqTryAt || 0) < 4000) return;
    el.__rfqTryAt = Date.now();
    if (isOffline()) return;
    el.__rfqTries = (el.__rfqTries || 0) + 1;
    if (el.__rfqTries > 8) {
      // لا نُبقي المستخدم في حلقة محاولات لا تنتهي
      el.__rfqPending = false;
      el.__rfqGiveUp = true;
      say("⚠️ تعذّر الوصول إلى خوادم التلاوة — تحقّق من الشبكة أو اضغط 🛡️ لتشغيلها عبر بوابة الشركة.", "warn");
      return;
    }

    var rec = el.__rfqRec || readState();
    if (!rec) { el.__rfqPending = false; return; }
    var src = (rec.url || "").trim() || el.src;
    if (!src) { el.__rfqPending = false; return; }

    var t = toNum(rec.time);
    var who = rec.reciterName ? (" بصوت " + rec.reciterName) : "";
    var label = rec.surahName ? ("سورة " + rec.surahName) : (rec.label || "التلاوة");
    say("⏳ عاد الاتصال — جارٍ استئناف <b>" + label + "</b>" + who + " من نفس الموضع…", "info");

    cachedBlob(src).then(function (cached) {
      var target = cached || playableUrl(src);
      el.__rfqGrace = true;
      el.src = target;
      try { el.load(); } catch (e) {}
      var done = false;

      function seekAndPlay() {
        if (done) return;
        done = true;
        if (t > 0.5) {
          try {
            var d = el.duration;
            el.currentTime = (isFinite(d) && d > 3) ? Math.min(t, Math.max(0, d - 1.2)) : t;
          } catch (e) {}
        }
        var p = el.play();
        if (p && p.catch) p.catch(function () {});
      }
      el.addEventListener("loadedmetadata", seekAndPlay, { once: true });
      el.addEventListener("canplay", seekAndPlay, { once: true });
      setTimeout(seekAndPlay, 7000);
    }).catch(function () {});
  }

  function resumeAll(force) {
    if (isOffline()) return;
    for (var i = 0; i < tracked.length; i++) {
      if (tracked[i] && tracked[i].__rfqPending) resume(tracked[i], force);
    }
  }

  function dropped(el) {
    el.__rfqPending = true;
    el.__rfqWasOffline = true;
    el.__rfqTryAt = Date.now();
    saveNow(el);
    el.__rfqGrace = true;
    try { el.pause(); } catch (e) {}
    say('📴 انقطع الاتصال — موضعك محفوظ (السورة والقارئ والثانية) وستُستأنف التلاوة تلقائيًا من هنا عند عودة الإنترنت. ' +
        '<button class="rfq-net-btn" onclick="rfqNetGuard.resume()">المحاولة الآن</button>' +
        '<button class="rfq-net-btn" title="تشغيل القرّاء خلف الفايروول" onclick="rfqNetGuard.dialog()">🛡️</button>', "warn");
  }

  /**
   * نلتقط خطأ الشبكة في مرحلة الالتقاط على document قبل وصوله لمحرّك الآيات،
   * فنمنع «التخطّي» إلى الآية التالية ونحفظ الموضع بدلًا من إعادة السورة من أولها.
   */
  function onMediaError(ev) {
    var el = ev.target;
    if (!el || String(el.tagName || "").toUpperCase() !== "AUDIO") return;
    track(el);
    if (!el.__rfqWanted || el.__rfqGiveUp) return;
    var failing = el.currentSrc || el.src || "";
    var isQuran = /everyayah\.com|mp3quran\.net|islamic\.network/i.test(failing) ||
      !!(window.RAQ && window.RAQ.queue && window.RAQ.queue[window.RAQ.idx] &&
         window.RAQ.queue[window.RAQ.idx].type === "quran");
    if (!isQuran) return;
    var code = el.error && el.error.code;

    if (isOffline()) {
      ev.stopImmediatePropagation();
      dropped(el);
      return;
    }

    // خطأ شبكة/فك ترميز مع اتصال قائم: غالبًا خادم محجوب أو بطيء -> خادم بديل
    if (code === 2 || code === 3) {
      var list = mirrorList(el.src);
      if (el.__rfqMirror < MAX_MIRROR_TRIES && el.__rfqMirror < list.length) {
        ev.stopImmediatePropagation();
        var alt = list[el.__rfqMirror++];
        el.__rfqSrc = alt;
        var t = toNum(el.currentTime);
        saveNow(el);
        say("🔁 الخادم الحالي لم يستجب — نجرّب خادمًا بديلًا (" + el.__rfqMirror + "/" + MAX_MIRROR_TRIES + ")…", "warn");
        el.__rfqGrace = true;
        el.src = playableUrl(alt);
        try { el.load(); } catch (e) {}
        el.addEventListener("loadedmetadata", function () {
          if (t > 1) { try { el.currentTime = t; } catch (e) {} }
          var p = el.play();
          if (p && p.catch) p.catch(function () {});
        }, { once: true });
        return;
      }
      if (code === 2) {
        // لا خادم بديل يعمل الآن: نحفظ الموضع وننتظر بدلًا من القفز للآية التالية
        ev.stopImmediatePropagation();
        dropped(el);
      }
    }
  }

  /* ---------------- بوابة الشركة (الفايروول) ---------------- */
  function openGatewayDialog() {
    injectStyle();
    var old = document.getElementById("rfqGwOverlay");
    if (old) old.remove();
    var ov = document.createElement("div");
    ov.id = "rfqGwOverlay";
    ov.className = "rfq-gw-ov";
    ov.innerHTML =
      '<div class="rfq-gw-box">' +
        '<h3>🛡️ تشغيل القرّاء خلف الفايروول</h3>' +
        '<p>كل خوادم التلاوة تعمل عبر HTTPS على المنفذ 443 فقط (لا منافذ غريبة ولا WebSocket)، ' +
        'والتطبيق يجرّب عدة خوادم تلقائيًا إن حجب الفايروول أحدها.<br>' +
        'إذا كانت الشبكة تسمح بموقع واحد فقط، ضع رابط بوابة الصوت التي تمرّر الملف عبره، ' +
        'وسيُطلب منها بهذه الصيغة: <b>?url=</b> أو استخدم <b>{url}</b> داخل الرابط.</p>' +
        '<input id="rfqGwInput" type="url" placeholder="https://gateway.example.com/audio?url=" value="' +
          String(fleet().gateway()).replace(/"/g, "&quot;") + '">' +
        '<div class="rfq-gw-row"><button class="primary" id="rfqGwSave">حفظ</button>' +
        '<button id="rfqGwClear">إيقاف البوابة</button><button id="rfqGwClose">إغلاق</button></div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov) ov.remove(); });
    document.getElementById("rfqGwClose").onclick = function () { ov.remove(); };
    document.getElementById("rfqGwSave").onclick = function () {
      setGateway(document.getElementById("rfqGwInput").value);
      ov.remove();
    };
    document.getElementById("rfqGwClear").onclick = function () {
      setGateway("");
      ov.remove();
    };
  }

  /* ---------------- شريحة متابعة آخر تلاوة ---------------- */
  var chipTimer = 0;
  function hideChip() {
    var c = document.getElementById("rfqResumeChip");
    if (c) { c.classList.remove("show"); c.remove(); }
    var inline = document.getElementById("rfqResumeInline");
    if (inline) inline.remove();
    if (chipTimer) { clearTimeout(chipTimer); chipTimer = 0; }
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(toNum(sec)));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return h > 0 ? h + ":" + p(m) + ":" + p(s) : m + ":" + p(s);
  }

  function showChip(st) {
    injectStyle();
    var old = document.getElementById("rfqResumeChip");
    if (old) old.remove();
    old = document.getElementById("rfqResumeInline");
    if (old) old.remove();
    var row = document.querySelector("#quranFinderTools .qf-filter-row");
    if (!row) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "rfqResumeInline";
    btn.className = "qf-chip";
    btn.title = "استكمال آخر موضع محفوظ في التلاوة";
    btn.innerHTML = "▶ استكمال القراءة";
    row.appendChild(btn);
    btn.onclick = function () { resumeSaved(st); };
    if (chipTimer) clearTimeout(chipTimer);
    chipTimer = setTimeout(hideChip, 60000);
  }

  function resumeSaved(st) {
    var el = document.getElementById("quranAudioPlayer");
    if (!el || !st) return;
    hideChip();
    var rs = document.getElementById("readerSelect");
    if (rs && st.reciterId && String(rs.value) !== String(st.reciterId)) {
      rs.value = String(st.reciterId);
      try { rs.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
    }
    if (typeof window.updateAudioPlayer === "function") {
      window.updateAudioPlayer(Number(st.surah) || 1, st.surahName || ("سورة " + (st.surah || 1)));
    } else if (st.url) {
      el.src = playableUrl(st.url);
      try { el.load(); } catch (e) {}
    }
    var t = toNum(st.time);
    var seek = function () {
      if (t > 0.5) { try { el.currentTime = t; } catch (e) {} }
      var p = el.play();
      if (p && p.catch) p.catch(function () {});
    };
    el.__rfqWanted = true;
    el.__rfqRec = st;
    el.addEventListener("loadedmetadata", seek, { once: true });
    if (el.readyState >= 1) setTimeout(seek, 90);
  }

  function offerLastSession() {
    var el = document.getElementById("quranAudioPlayer");
    if (!el) return; // الشريحة خاصة بصفحة المصحف ذات المشغّل الكامل
    var st = readState();
    if (!st || !st.surah) return;
    // موضع محرّك الأذكار يُحفظ بالآية لا بالثانية؛ لا نعرض شريحة مضللة للمشغّل الكامل
    if (st.engine === "adhkar") return;
    if (toNum(st.time) < MIN_RESUME_SECONDS) return;
    if (Date.now() - toNum(st.ts) > 1000 * 60 * 60 * 24 * 30) return;
    showChip(st);
  }

  /* ---------------- أحداث الشبكة ---------------- */
  function onOnline() {
    var pending = tracked.filter(function (el) { return el && el.__rfqPending; });
    if (!pending.length) {
      silence();
      resumeAll(false);
      return;
    }
    say("📶 عاد الإنترنت — جارٍ الاستئناف من آخر موضع…", "ok");
    resumeAll(true);
  }

  function onOffline() {
    var wanted = false;
    for (var i = 0; i < tracked.length; i++) {
      if (tracked[i] && tracked[i].__rfqWanted && !tracked[i].paused) {
        saveNow(tracked[i]);
        wanted = true;
      }
    }
    if (wanted) {
      say("📴 انقطع الإنترنت — التلاوة محفوظة وستكمل من نفس الموضع تلقائيًا عند الرجوع.", "warn");
    }
  }

  function boot() {
    injectStyle();
    scan();
    document.addEventListener("error", onMediaError, true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) resumeAll(false);
    });

    // اكتشاف مشغّلات الصوت التي تُنشأ لاحقًا (محرّك الأذكار/التلاوة)
    if (window.MutationObserver) {
      new MutationObserver(function () { scan(); }).observe(document.documentElement, { childList: true, subtree: true });
    }
    setInterval(function () {
      scan();
      if (!isOffline()) resumeAll(false);
    }, 6000);

    // استأنف فورًا لو عاد الاتصال قبل تحميل الصفحة
    setTimeout(function () { resumeAll(false); offerLastSession(); }, 900);
  }

  window.rfqNetGuard = fleet();
  window.rfqNetGuard.dialog = openGatewayDialog;
  window.rfqNetGuard.offer = offerLastSession;
  window.rfqResumeAudio = resumeSaved;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
