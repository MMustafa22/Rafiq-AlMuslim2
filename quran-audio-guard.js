/* Quran-player enhancements: per-reader curated menus, direct play and safe recovery. */
(function () {
  "use strict";
  var playbackToken = 0;

  function catalog() { return typeof RECITERS !== "undefined" ? RECITERS : []; }
  function findReader(id) { return catalog().find(function (r) { return Number(r.id) === Number(id); }) || null; }
  function selectedReader() {
    var el = document.getElementById("readerSelect");
    if (!el) return null;
    var value = String(el.value || "");
    return findReader(value.indexOf("rare-") === 0 ? Number(value.split("-")[1]) : Number(value));
  }
  function showNotice(text) { if (typeof window.showReciterNotice === "function") window.showReciterNotice(text); }

  function updateCoverageBadge(){var badge=document.getElementById("reciterCoverage");if(badge){badge.textContent="";badge.classList.remove("partial","pending");badge.hidden=true;}}function buildCuratedMenus() {
    var host = document.getElementById("curatedAudioMenus");
    if (!host) return;
    host.replaceChildren();
    catalog().filter(function (r) { return Array.isArray(r.availableSurahs); }).forEach(function (reader) {
      var row = document.createElement("div");
      row.className = "curated-audio-menu";
      row.hidden = true;
      row.dataset.readerId = String(reader.id);
      var label = document.createElement("label");
      label.className = "curated-audio-label";
      label.htmlFor = "curated-surah-" + reader.id;
      label.textContent = reader.name;
      var select = document.createElement("select");
      select.className = "reader-select curated-surah-select";
      select.id = "curated-surah-" + reader.id;
      select.setAttribute("aria-label", "اختيار سورة مسجلة بصوت " + reader.name);
      var placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "اختاري سورة للاستماع…";
      select.appendChild(placeholder);
      reader.availableSurahs.slice().sort(function (a, b) { return a - b; }).forEach(function (number) {
        var option = document.createElement("option");
        option.value = String(number);
        var name = typeof SURAH_NAMES !== "undefined" ? SURAH_NAMES[number] : null;
        option.textContent = number + " — " + (name || "سورة " + number);
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        if (select.value) playCuratedSurah(reader.id, Number(select.value));
      });
      row.appendChild(label);
      row.appendChild(select);
      host.appendChild(row);
    });
  }

  function updateCuratedVisibility() {
    var host = document.getElementById("curatedAudioMenus");
    if (!host) return;
    var reader = selectedReader();
    var partial = !!(reader && Array.isArray(reader.availableSurahs));
    host.hidden = !partial;
    Array.prototype.forEach.call(host.children, function (row) {
      row.hidden = !partial || Number(row.dataset.readerId) !== Number(reader && reader.id);
    });
  }

  function playCuratedSurah(readerId, surahNumber) {
    var reader = findReader(readerId);
    var number = Number(surahNumber);
    if (!reader || !Array.isArray(reader.availableSurahs) || !reader.availableSurahs.includes(number)) {
      showNotice("هذه السورة غير متاحة في تسجيل القارئ المختار.");
      return;
    }
    var audio = document.getElementById("quranAudioPlayer");
    if (!audio || typeof window.updateAudioPlayer !== "function") return;
    playbackToken += 1;
    var myToken = playbackToken;
    var readerSelect = document.getElementById("readerSelect");
    if (readerSelect) readerSelect.value = "rare-" + reader.id;
    selectedRecId = Number(reader.id);
    updateCoverageBadge();
    updateCuratedVisibility();
    if (typeof _ttsActive !== "undefined" && _ttsActive && typeof window._stopReading === "function") _stopReading();
    audio.pause();
    if (typeof _mpAutoplayNext !== "undefined") _mpAutoplayNext = false;
    var surahName = typeof SURAH_NAMES !== "undefined" ? SURAH_NAMES[number] : "سورة " + number;
    // Set this exact checked track first, then play synchronously inside the dropdown's user gesture.
    // Navigate first: several short surahs share a mushaf page, whose page map may name a different surah.
    // Then restore the explicitly selected audio track so e.g. Al-Fil never becomes Quraysh.
    if (typeof window.loadPageBySurah === "function") window.loadPageBySurah(number);
    window.updateAudioPlayer(number, surahName);
    var playRequest = audio.play();
    if (typeof window.settingsSave === "function") settingsSave("selectedRecId", Number(reader.id)).catch(function () {});
    if (playRequest && typeof playRequest.catch === "function") playRequest.catch(function (error) {
      if (myToken !== playbackToken) return;
      if (error && error.name === "NotAllowedError") showNotice("اضغطي على اختيار السورة مرة أخرى لبدء الاستماع.");
      else showNotice("تعذّر تشغيل هذه السورة الآن — تحققي من الاتصال ثم أعيدي اختيارها.");
    });
  }
  window.playCuratedSurah = playCuratedSurah;

  function setup() {
    var readerSelect = document.getElementById("readerSelect");
    buildCuratedMenus();
    updateCoverageBadge();
    updateCuratedVisibility();
    if (readerSelect) {
      readerSelect.addEventListener("change", function () { updateCoverageBadge(); updateCuratedVisibility(); });
      if (window.MutationObserver) new MutationObserver(function () { updateCoverageBadge(); updateCuratedVisibility(); }).observe(readerSelect, { childList: true });
    }

    // A partial-reader option selects the reader only; its own dropdown selects and starts a track.
    if (typeof window.changeReader === "function") {
      var originalChangeReader = window.changeReader;
      window.changeReader = async function () {
        var value = String((document.getElementById("readerSelect") || {}).value || "");
        if (value.indexOf("rare-") === 0 && value.split("-").length === 2) {
          var id = Number(value.split("-")[1]);
          if (!findReader(id)) return;
          selectedRecId = id;
          var previousAudio = document.getElementById("quranAudioPlayer");
          if (previousAudio) { previousAudio.pause(); previousAudio.removeAttribute("src"); previousAudio.load(); }
          var oldDownload = document.getElementById("downloadMp3Btn");
          if (oldDownload) { oldDownload.href = "#"; oldDownload.setAttribute("aria-disabled", "true"); oldDownload.classList.add("audio-unavailable"); }
          await settingsSave("selectedRecId", id);
          updateCoverageBadge();
          updateCuratedVisibility();
          return;
        }
        return originalChangeReader.apply(this, arguments);
      };
    }

    if (typeof window.mpGoSurah === "function") {
      var originalGoSurah = window.mpGoSurah;
      window.mpGoSurah = function (requested) {
        var reader = selectedReader();
        if (reader && Array.isArray(reader.availableSurahs)) {
          var current = Number(_surahNum) || 1;
          var direction = Number(requested) >= current ? 1 : -1;
          var tracks = reader.availableSurahs.slice().sort(function (a, b) { return a - b; });
          var next = direction > 0
            ? tracks.find(function (n) { return n >= Number(requested) && n > current; })
            : tracks.slice().reverse().find(function (n) { return n <= Number(requested) && n < current; });
          if (!next) { showNotice("انتهت السور المتاحة لهذا التسجيل — اختاري قارئًا كاملًا لمتابعة المصحف."); return; }
          requested = next;
        }
        return originalGoSurah.call(this, requested);
      };
    }

    if (typeof window.updateAudioPlayer === "function") {
      var originalUpdateAudio = window.updateAudioPlayer;
      window.updateAudioPlayer = function (surahNumber, surahName) {
        var reader = selectedReader();
        if (reader && Array.isArray(reader.availableSurahs) && !reader.availableSurahs.includes(Number(surahNumber))) {
          var currentAudio = document.getElementById("quranAudioPlayer");
          if (currentAudio) { currentAudio.pause(); currentAudio.removeAttribute("src"); currentAudio.load(); }
          _surahNum = Number(surahNumber);
          _surahName = surahName;
          var title = document.getElementById("currentSurahName");
          if (title) title.textContent = "🏠 سورة " + surahName;
          var download = document.getElementById("downloadMp3Btn");
          if (download) { download.href = "#"; download.setAttribute("aria-disabled", "true"); download.classList.add("audio-unavailable"); }
          showNotice("لا توجد تلاوة مسجلة لهذه السورة بصوت " + reader.name + " — لن يتم تشغيل صوت قارئ آخر بدلًا منه.");
          return;
        }
        var result = originalUpdateAudio.apply(this, arguments);
        var downloadLink = document.getElementById("downloadMp3Btn");
        if (downloadLink) { downloadLink.removeAttribute("aria-disabled"); downloadLink.classList.remove("audio-unavailable"); }
        return result;
      };
    }
    var downloadLink = document.getElementById("downloadMp3Btn");
    if (downloadLink) downloadLink.addEventListener("click", function (event) {
      if (downloadLink.getAttribute("aria-disabled") === "true") { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);

    var audio = document.getElementById("quranAudioPlayer");
    if (!audio) return;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    var playbackWanted = false;
    var retryCount = 0;
    var activeSource = "";
    var retryTimer = 0;
    var stallTimer = 0;
    var recovering = false;
    var STALL_LIMIT_MS = 12000;
    function sourceUrl() { return audio.currentSrc || audio.src || ""; }
    function clearRetry() { if (retryTimer) window.clearTimeout(retryTimer); retryTimer = 0; }
    function clearStall() { if (stallTimer) window.clearTimeout(stallTimer); stallTimer = 0; }
    function status(text, toast) {
      var node = document.getElementById("audioPlaybackStatus");
      if (node) { node.textContent = text; node.hidden = false; }
      if (toast) showNotice(text);
    }
    function clearStatus() {
      var node = document.getElementById("audioPlaybackStatus");
      if (node) { node.textContent = ""; node.hidden = true; }
    }

    // Reload the same file and resume from the saved position (used for errors AND silent stalls).
    function recover(reason) {
      var src = sourceUrl();
      if (audio.dataset.rfqPausedByOther === "1") { playbackWanted = false; return; }
      if (!src || !playbackWanted || recovering || retryCount >= 1000000) {
        if (retryCount >= 1000000 && playbackWanted) { playbackWanted = false; status("⚠️ تعذّر استعادة التلاوة — تحققي من الاتصال ثم اضغطي تشغيل.", true); }
        return;
      }
      if (!navigator.onLine) { status("📶 لا يوجد اتصال — ستستأنف التلاوة تلقائيًا عند عودة الإنترنت."); return; }
      var savedTime = Number(audio.currentTime) || 0;
      retryCount += 1; if (retryCount >= 2 && window.rfqAudioFailover && window.rfqAudioFailover()) { retryCount = 0; recovering = false; return; }
      var delay = retryCount === 1 ? 600 : Math.min(12000, 1800 * Math.pow(1.6, retryCount - 2));
      status((reason === "stall" ? "⏳ توقف البث؛ " : "⚠️ تعثّر الاتصال؛ ") + "إعادة المحاولة " + retryCount + " من نفس الموضع…", retryCount > 1);
      clearRetry(); clearStall();
      recovering = true;
      retryTimer = window.setTimeout(function () {
        retryTimer = 0;
        if (sourceUrl() !== src) { recovering = false; return; }
        var resume = function () {
          audio.removeEventListener("loadedmetadata", resume);
          if (Number.isFinite(audio.duration) && savedTime > 0 && savedTime < audio.duration) {
            try { audio.currentTime = savedTime; } catch (_) {}
          }
          recovering = false;
          if (audio.dataset.rfqPausedByOther === "1") return;
          audio.play().catch(function () {});
        };
        audio.addEventListener("loadedmetadata", resume);
        audio.src = src;
        audio.load();
      }, delay);
    }
    function armStallWatch() {
      clearStall();
      if (!playbackWanted || recovering) return;
      stallTimer = window.setTimeout(function () {
        stallTimer = 0;
        // still buffering (not enough data to play) after the limit -> reload from the saved position
        if (playbackWanted && !audio.paused && !audio.ended && audio.readyState < 3) recover("stall");
      }, STALL_LIMIT_MS);
    }

    audio.addEventListener("loadstart", function () {
      var src = sourceUrl();
      if (src && src !== activeSource) { activeSource = src; retryCount = 0; recovering = false; clearRetry(); clearStall(); }
    });
    audio.addEventListener("play", function () { playbackWanted = true; delete audio.dataset.rfqPausedByOther; });
    audio.addEventListener("pause", function () { if (!audio.error && !retryTimer && !recovering) { playbackWanted = false; clearStall(); clearStatus(); } });
    audio.addEventListener("ended", function () { playbackWanted = false; retryCount = 0; clearStall(); });
    audio.addEventListener("waiting", function () { if (playbackWanted) { status("⏳ الاتصال بطيء — جارٍ تحميل التلاوة دون تخطي الآيات."); armStallWatch(); } });
    audio.addEventListener("stalled", function () { if (playbackWanted) { status("⏳ توقف تدفق الصوت مؤقتًا — نحاول استعادته مع حفظ موضع القراءة."); armStallWatch(); } });
    audio.addEventListener("playing", function () {
      clearRetry(); clearStall(); retryCount = 0; recovering = false; clearStatus();
      if (typeof window.hideReciterNotice === "function") window.hideReciterNotice();
    });
    audio.addEventListener("timeupdate", function () { if (stallTimer && audio.readyState >= 3) clearStall(); });
    audio.addEventListener("error", function () { recover("error"); });

    // Back online (or tab visible again) while playback was wanted but the stream died -> resume.
    function resumeIfDead() {
      if (playbackWanted && !recovering && (audio.error || (audio.readyState < 3 && !audio.ended))) { retryCount = Math.min(retryCount, 3); recover("error"); }
    }
    window.addEventListener("online", resumeIfDead);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) resumeIfDead(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
