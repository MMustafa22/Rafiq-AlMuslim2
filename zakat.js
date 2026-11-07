/* ============================================================
   حاسبة الزكاة — رفيق المسلم
   أنواع الزكاة: المال، الرواتب، الأسهم وعروض التجارة، الذهب والفضة،
   الزرع والثمار، الماشية، المعادن والكنوز.
   تعمل بالكامل بدون إنترنت.
   ============================================================ */
(function () {
  "use strict";

  var STYLE_ID = "rfq-zakat-style";
  var GOLD_NISAB_GRAMS = 85;     // نصاب الذهب وزنًا = 85 جرامًا (وهو نصاب المال قيمةً)
  var SILVER_NISAB_GRAMS = 595;  // نصاب الفضة وزنًا = 595 جرامًا
  var HARVEST_NISAB_KG = 653;    // نصاب الزروع والثمار = 5 أوسق ≈ 653 كجم
  var LIVESTOCK_NISAB = { camel: 5, cattle: 30, sheep: 40 };
  var GOLD_PRICE_KEY = "rfq_zakat_gold_price"; // آخر سعر ذهب أدخله المستخدم

  var CSS = [
    "#zakatOverlay{position:fixed;inset:0;z-index:9900;background:rgba(1,6,15,.93);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;overflow-y:auto;padding:16px 12px 46px;direction:rtl;font-family:Tajawal,sans-serif}",
    "#zakatOverlay.show{display:block}",
    "#zakatBox{max-width:600px;margin:0 auto}",
    ".zk-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}",
    ".zk-hd h2{margin:0;color:#f4c95d;font-size:1.22rem}",
    ".zk-hd small{display:block;color:#94a3b8;font-size:.72rem;font-weight:600;margin-top:3px}",
    ".zk-x{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;font-size:1.2rem;cursor:pointer;flex-shrink:0}",
    ".zk-card{background:#111c30;border:1px solid rgba(244,201,93,.22);border-radius:16px;padding:14px;margin-bottom:12px}",
    ".zk-card h3{margin:0 0 10px;color:#f4c95d;font-size:.95rem}",
    ".zk-types{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}",
    ".zk-type{padding:9px 4px;border-radius:11px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#dbe7f5;font-family:inherit;font-size:.72rem;font-weight:800;cursor:pointer;line-height:1.45;text-align:center}",
    ".zk-type span{display:block;font-size:1.15rem;margin-bottom:2px}",
    ".zk-type.on{background:linear-gradient(135deg,rgba(244,201,93,.24),rgba(52,211,153,.1));border-color:rgba(244,201,93,.6);color:#ffe39a}",
    ".zk-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)}",
    ".zk-row:last-child{border-bottom:0}",
    ".zk-row label{color:#c9d6e7;font-size:.84rem;font-weight:700;line-height:1.5}",
    ".zk-row label i{display:block;color:#8ea6c2;font-style:normal;font-size:.68rem;font-weight:600;margin-top:2px}",
    ".zk-row input[type=number]{width:130px;flex-shrink:0;box-sizing:border-box;padding:8px 9px;border-radius:10px;border:1px solid rgba(244,201,93,.3);background:rgba(0,0,0,.28);color:#fff;font:inherit;font-size:.88rem;text-align:center;outline:0}",
    ".zk-row input:focus{border-color:#f4c95d}",
    ".zk-row input[type=checkbox]{width:20px;height:20px;accent-color:#f4c95d;flex-shrink:0}",
    ".zk-calc{width:100%;margin-top:12px;padding:12px;border:1px solid rgba(52,211,153,.45);border-radius:12px;background:linear-gradient(135deg,rgba(52,211,153,.16),rgba(244,201,93,.1));color:#7ef0c0;font:inherit;font-weight:900;font-size:.95rem;cursor:pointer}",
    ".zk-calc:hover{filter:brightness(1.12)}",
    "#zakatResult{display:none;margin-bottom:12px}",
    "#zakatResult.show{display:block}",
    ".zk-res{background:linear-gradient(150deg,rgba(52,211,153,.12),rgba(244,201,93,.06));border:1px solid rgba(244,201,93,.4);border-radius:16px;padding:16px;text-align:center}",
    ".zk-res .zk-big{font-size:1.9rem;font-weight:900;color:#ffe39a;line-height:1.25;word-break:break-word}",
    ".zk-res .zk-cap{font-size:.78rem;color:#9fb0c6;font-weight:700;margin-bottom:4px}",
    ".zk-break{display:grid;gap:6px;margin-top:12px}",
    ".zk-break div{display:flex;justify-content:space-between;padding:8px 11px;border-radius:10px;background:rgba(255,255,255,.045);color:#c9d6e7;font-size:.8rem}",
    ".zk-break b{color:#ffe39a}",
    ".zk-note{margin-top:11px;padding:10px 12px;border-radius:11px;background:rgba(52,211,153,.08);color:#6ee7b7;font-size:.76rem;line-height:1.85}",
    ".zk-warn{margin-top:11px;padding:10px 12px;border-radius:11px;background:rgba(251,191,36,.1);color:#fcd34d;font-size:.76rem;line-height:1.85}",
    ".zk-hint{color:#8ea6c2;font-size:.72rem;line-height:1.8;margin-top:6px}",
    ".zk-nisab{margin-top:12px;border-radius:12px;padding:11px 13px;font-size:.78rem;line-height:1.85;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);color:#c9d6e7}",
    ".zk-nisab-t{font-weight:900;font-size:.87rem;margin-bottom:6px;color:#ffe39a}",
    ".zk-nisab.ok{border-color:rgba(52,211,153,.45);background:rgba(52,211,153,.09)}",
    ".zk-nisab.ok .zk-nisab-t{color:#6ee7b7}",
    ".zk-nisab.bad{border-color:rgba(248,113,113,.5);background:rgba(248,113,113,.1)}",
    ".zk-nisab.bad .zk-nisab-t{color:#fca5a5}",
    ".zk-nisab.info{border-color:rgba(96,165,250,.35);background:rgba(96,165,250,.08)}",
    ".zk-nisab.info .zk-nisab-t{color:#93c5fd}",
    ".zk-nrow{display:flex;justify-content:space-between;gap:10px;padding:4px 0;font-size:.78rem}",
    ".zk-nrow b{color:#ffe39a;white-space:nowrap}",
    ".zk-nisab.bad .zk-nrow b{color:#fecaca}",
    ".zk-bar{height:7px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin:10px 0 4px}",
    ".zk-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#f4c95d,#34d399);transition:width .35s}",
    ".zk-bar-label{display:flex;justify-content:space-between;font-size:.66rem;color:#93a3b8;font-weight:700}",
    "@media(max-width:420px){.zk-types{grid-template-columns:repeat(2,1fr)}.zk-row input[type=number]{width:112px}}"
  ].join("");

  var TYPES = [
    { id: "money",   icon: "💰", label: "المال والنقود" },
    { id: "salary",  icon: "🏦", label: "الرواتب والمدخرات" },
    { id: "trade",   icon: "📈", label: "الأسهم وعروض التجارة" },
    { id: "gold",    icon: "🥇", label: "الذهب والفضة" },
    { id: "harvest", icon: "🌾", label: "الزرع والثمار" },
    { id: "livestock", icon: "🐑", label: "الماشية" },
    { id: "mine",    icon: "⛏️", label: "المعادن والكنوز" }
  ];

  var CAMELS = [
    [5, 9, "شاة واحدة"], [10, 14, "شاتان"], [15, 19, "ثلاث شياه"], [20, 24, "أربع شياه"],
    [25, 35, "بنت مخاض (ناقة في عامها)"], [36, 45, "بنت لبون (ناقة في سنتها)"],
    [46, 60, "حائل (ناقة في ثلاث)"], [61, 75, "مُضَحٍّان (ابنا مخاض)"],
    [76, 90, "مُرْضِعَتان (ابنتا لبون)"], [91, 120, "حَوَلان (ابنا لبون)"],
    [121, 140, "ثلاث مخاض"], [141, 150, "ثلاث لبون"], [151, 999999, "أربع لبون — وما زاد فعلى نسبة"]
  ];
  var CATTLE = [
    [30, 39, "تَبيعة (ابنة ستّ)"], [40, 59, "مُسِنّة (ابنة خمس)"],
    [60, 69, "تَبِيّان (ابنا ستّ)"], [70, 89, "مُسِنّتان (ابنتا خمس)"],
    [90, 119, "حُوَلان (ابنا خمس)"]
  ];
  var SHEEP = [
    [40, 120, "شاة واحدة"], [121, 200, "شاتان"], [201, 399, "ثلاث شياه"]
  ];

  function num(id) {
    var el = document.getElementById(id);
    var v = el ? parseFloat(String(el.value).replace(/[^\d.]/g, "")) : NaN;
    return isFinite(v) && v > 0 ? v : 0;
  }
  function fmt(n) {
    return (Math.round(n * 100) / 100).toLocaleString("ar-EG-u-nu-latn", { maximumFractionDigits: 2 });
  }

  /* ---------- النصاب يُحسب تلقائيًا لكل نوع دون حقول نصاب منفصلة ---------- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function savedGoldPrice() {
    var v = parseFloat(lsGet(GOLD_PRICE_KEY) || "0");
    return isFinite(v) && v > 0 ? v : 0;
  }
  function goldPrice() {
    var direct = num("zkGoldP") || num("zkNisabGold");
    if (direct > 0) { lsSet(GOLD_PRICE_KEY, String(direct)); return direct; }
    return savedGoldPrice();
  }
  function nRow(label, value) {
    return '<div class="zk-nrow"><span>' + label + "</span><b>" + value + "</b></div>";
  }
  function headWord(n) { return n <= 10 ? " رؤوس" : " رأسًا"; }
  var lastNisabReached = null; // نتيجة آخر تقييم للنصاب: true / false / null
  function nBar(pct, caption) {
    pct = Math.max(0, Math.min(100, Math.round(pct || 0)));
    return '<div class="zk-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="zk-bar-label"><span>' + caption + '</span><span>' + pct + "%</span></div>";
  }

  function nisabReport(r) {
    var gp = goldPrice();
    var t = currentType;

    /* ---- الذهب والفضة: الحكم بالوزن أولًا، ثم بالقيمة ---- */
    if (t === "gold") {
      var gw = num("zkGoldW"), sw = num("zkSilverW");
      if (!gw && !sw) {
        lastNisabReached = null; return '<div class="zk-nisab info"><div class="zk-nisab-t">📏 نصاب الذهب والفضة</div>' +
          nRow("نصاب الذهب", "85 جرامًا") + nRow("نصاب الفضة", "595 جرامًا") +
          '<div class="zk-hint">أدخل الوزن بالجرام؛ سنخبرك فورًا إن كان قد بلغ النصاب أم لا، وكم جرامًا ينقصك.</div></div>';
      }
      var gOk = gw >= GOLD_NISAB_GRAMS;
      var sOk = sw >= SILVER_NISAB_GRAMS;
      var gPrice = num("zkGoldP") || gp;
      var sPrice = num("zkSilverP");
      var rows = "";
      if (gw > 0) {
        rows += nRow("وزن الذهب المُدخل", fmt(gw) + " جم");
        if (!gOk) {
          var needG = GOLD_NISAB_GRAMS - gw;
          rows += nRow("ينقصك لنصاب الذهب (85 جم)",
            fmt(needG) + " جم" + (gPrice > 0 ? " ≈ " + fmt(needG * gPrice) : ""));
        }
      }
      if (sw > 0) {
        rows += nRow("وزن الفضة المُدخل", fmt(sw) + " جم");
        if (!sOk) {
          var needS = SILVER_NISAB_GRAMS - sw;
          rows += nRow("ينقصك لنصاب الفضة (595 جم)",
            fmt(needS) + " جم" + (sPrice > 0 ? " ≈ " + fmt(needS * sPrice) : ""));
        }
      }
      if (gOk || sOk) {
        lastNisabReached = true; return '<div class="zk-nisab ok"><div class="zk-nisab-t">✅ بلغ مالك نصاب الزكاة</div>' + rows +
          '<div class="zk-hint">تجب الزكاة (2.5%) متى حال الحول الهجري عليه. ' +
          (gPrice > 0 || sPrice > 0 ? "ويُحسب المقدار من قيمة المعدن بسعر اليوم." : "أدخل سعر الجرام لحساب قيمة الزكاة نقدًا.") +
          "</div></div>";
      }
      var pctG = gw > 0 ? (gw / GOLD_NISAB_GRAMS * 100) : (sw / SILVER_NISAB_GRAMS * 100);
      var title = (gw > 0 && sw > 0) ? "🚫 لم يبلغ نصاب الذهب ولا نصاب الفضة"
        : (gw > 0 ? "🚫 لم يبلغ نصاب الزكاة المفروضة على الذهب" : "🚫 لم يبلغ نصاب الزكاة المفروضة على الفضة");
      lastNisabReached = false; return '<div class="zk-nisab bad"><div class="zk-nisab-t">' + title + "</div>" + rows +
        nBar(pctG, "نسبة ما تملكه من النصاب") +
        (gw > 0
          ? '<div class="zk-hint">لا زكاة في أقل من <b>85 جرامًا</b> من الذهب — بالوزن لا بالقيمة؛ فلو ملكت جرامًا واحدًا ولو بسعر مرتفع فلا زكاة فيه حتى يكتمل النصاب ويحول عليه الحول.</div></div>'
          : '<div class="zk-hint">لا زكاة في أقل من <b>595 جرامًا</b> من الفضة — بالوزن لا بالقيمة؛ حتى يكتمل النصاب ويحول عليه الحول.</div></div>');
    }

    /* ---- المال والرواتب والأسهم: النصاب = قيمة 85 جرامًا من الذهب ---- */
    if (t === "money" || t === "salary" || t === "trade") {
      if (!(gp > 0)) {
        lastNisabReached = null; return '<div class="zk-nisab info"><div class="zk-nisab-t">📏 كيف أعرف النصاب؟</div>' +
          nRow("نصاب الذهب", "85 جرامًا") + nRow("نصاب الفضة", "595 جرامًا") +
          '<div class="zk-hint">أدخل سعر جرام الذهب اليوم في الحقل أعلاه (اختياري) لنخبرك إن بلغ مالك النصاب: النصاب = 85 × سعر الجرام.</div></div>';
      }
      var threshold = gp * GOLD_NISAB_GRAMS;
      var base = Math.max(0, r.base);
      if (base >= threshold) {
        lastNisabReached = true; return '<div class="zk-nisab ok"><div class="zk-nisab-t">✅ بلغ مالك النصاب</div>' +
          nRow("قيمة النصاب (85 جم × سعر الجرام)", fmt(threshold)) +
          '<div class="zk-hint">تجب الزكاة 2.5% إذا حال الحول الهجري على المبلغ وهو بالغ النصاب.</div></div>';
      }
      lastNisabReached = false; return '<div class="zk-nisab bad"><div class="zk-nisab-t">🚫 لم يبلغ مالك النصاب</div>' +
        nRow("قيمة النصاب (85 جم × سعر الجرام)", fmt(threshold)) +
        nRow("ينقصك للوصول إلى النصاب", fmt(Math.max(0, threshold - base))) +
        nBar(base / threshold * 100, "ما تملكه من النصاب") +
        '<div class="zk-hint">لا تجب الزكاة حتى يبلغ المال قيمة 85 جرامًا من الذهب ويحول عليه الحول الهجري.</div></div>';
    }

    /* ---- الزروع والثمار ---- */
    if (t === "harvest") {
      var qty = num("zkQty");
      if (!qty) {
        lastNisabReached = null; return '<div class="zk-nisab info"><div class="zk-nisab-t">📏 نصاب الزروع والثمار</div>' +
          nRow("النصاب", "5 أوسق ≈ 653 كجم") + '<div class="zk-hint">أدخل كمية الإنتاج بالكيلوجرام.</div></div>';
      }
      if (qty >= HARVEST_NISAB_KG) {
        lastNisabReached = true; return '<div class="zk-nisab ok"><div class="zk-nisab-t">✅ بلغ الإنتاج النصاب</div>' +
          nRow("كمية الإنتاج", fmt(qty) + " كجم") + nRow("النصاب", "653 كجم") +
          '<div class="zk-hint">العُشر (10%) إن سُقي بماء السماء، ونصف العُشر (5%) إن سُقي بكلفة.</div></div>';
      }
      lastNisabReached = false; return '<div class="zk-nisab bad"><div class="zk-nisab-t">🚫 لم يبلغ الزرع النصاب</div>' +
        nRow("كمية الإنتاج", fmt(qty) + " كجم") + nRow("النصاب (5 أوسق)", "≈ 653 كجم") +
        nRow("ينقصك للوصول إلى النصاب", fmt(HARVEST_NISAB_KG - qty) + " كجم") +
        nBar(qty / HARVEST_NISAB_KG * 100, "ما تملكه من النصاب") + "</div>";
    }

    /* ---- الماشية ---- */
    if (t === "livestock") {
      var kind = (document.querySelector('input[name="zkAnimal"]:checked') || {}).value || "camel";
      var count = num("zkCount");
      var min = LIVESTOCK_NISAB[kind] || 5;
      var kindName = kind === "camel" ? "الإبل" : (kind === "cattle" ? "البقر" : "الغنم");
      if (!count) {
        lastNisabReached = null; return '<div class="zk-nisab info"><div class="zk-nisab-t">📏 نصاب الماشية</div>' +
          nRow("الإبل", "5 رؤوس") + nRow("البقر", "30 رأسًا") + nRow("الغنم", "40 رأسًا") + "</div>";
      }
      if (count >= min) {
        lastNisabReached = true; return '<div class="zk-nisab ok"><div class="zk-nisab-t">✅ بلغت الماشية النصاب</div>' +
          nRow("العدد", fmt(count) + " رأسًا") + nRow("نصاب " + kindName, fmt(min) + headWord(min)) +
          '<div class="zk-hint">تجب الزكاة المبيّنة أعلاه بعد مرور الحول، وتُخرَج من الماشية نفسها.</div></div>';
      }
      lastNisabReached = false; return '<div class="zk-nisab bad"><div class="zk-nisab-t">🚫 لم تبلغ الماشية النصاب</div>' +
        nRow("نصاب " + kindName, fmt(min) + headWord(min)) +
        nRow("ينقصك للوصول إلى النصاب", fmt(min - count) + " رأسًا") +
        nBar(count / min * 100, "ما تملكه من النصاب") + "</div>";
    }

    /* ---- المعادن والكنوز ---- */
    if (t === "mine") {
      var val = num("zkMineVal");
      if (!(gp > 0)) {
        lastNisabReached = null; return '<div class="zk-nisab info"><div class="zk-nisab-t">📏 نصاب المعدن والكنز</div>' +
          nRow("النصاب", "قيمة 85 جرامًا من الذهب") +
          '<div class="zk-hint">أدخل سعر جرام الذهب اليوم لتقييم النصاب؛ ومقدار الزكاة ربع العشر (20%).</div></div>';
      }
      var mineThreshold = gp * GOLD_NISAB_GRAMS;
      if (val >= mineThreshold) {
        lastNisabReached = true; return '<div class="zk-nisab ok"><div class="zk-nisab-t">✅ بلغ المعدن النصاب</div>' +
          nRow("قيمة النصاب", fmt(mineThreshold)) +
          '<div class="zk-hint">تُخرج ربع العشر (20%) مرة واحدة عند استخراجه أو العثور عليه.</div></div>';
      }
      lastNisabReached = false; return '<div class="zk-nisab bad"><div class="zk-nisab-t">🚫 لم يبلغ المعدن النصاب</div>' +
        nRow("قيمة النصاب", fmt(mineThreshold)) +
        nRow("ينقصك للوصول إلى النصاب", fmt(Math.max(0, mineThreshold - val))) + "</div>";
    }

    lastNisabReached = null;
    return "";
  }

  /* ---------- حسابات كل نوع ---------- */
  function calcMoney() {
    var cash = num("zkCash") + num("zkBank");
    var receivable = num("zkReceivable");
    var debt = num("zkDebt");
    var base = cash + receivable - debt;
    return { base: base, rate: 0.025,
      extra: [["النقد والبنك", cash], ["ديون مستحقة لك", receivable], ["ديون عليك", -debt]] };
  }
  function calcSalary() {
    var saved = num("zkSaved");
    return { base: saved, rate: 0.025, extra: [["المدخرات المتراكمة", saved]] };
  }
  function calcTrade() {
    var shares = num("zkShares");
    var goods = num("zkGoods");
    var base = shares + goods;
    return { base: base, rate: 0.025, extra: [["قيمة الأسهم", shares], ["قيمة البضاعة", goods]] };
  }
  function calcGold() {
    var g = num("zkGoldW") * num("zkGoldP");
    var s = num("zkSilverW") * num("zkSilverP");
    var base = g + s;
    return { base: base, rate: 0.025, extra: [["قيمة الذهب", g], ["قيمة الفضة", s]] };
  }
  function calcHarvest() {
    var qty = num("zkQty");
    var price = num("zkUnitPrice");
    var irrigated = document.getElementById("zkIrrigated");
    var rate = (irrigated && irrigated.checked) ? 0.05 : 0.10;
    var base = qty * price;
    return { base: base, rate: rate,
      extra: [["كمية الإنتاج", qty], ["سعر الوحدة", price], ["نسبة الوجوب", (rate * 100) + "%"]] };
  }
  function calcLivestock() {
    var kind = (document.querySelector('input[name="zkAnimal"]:checked') || {}).value || "camel";
    var n = num("zkCount");
    var table = kind === "camel" ? CAMELS : (kind === "cattle" ? CATTLE : SHEEP);
    var due = null;
    if (kind === "camel" || kind === "cattle") {
      for (var i = 0; i < table.length; i++) {
        if (n >= table[i][0] && n <= table[i][1]) { due = table[i][2]; break; }
      }
      if (kind === "cattle" && n >= 120) {
        var groups = Math.floor((n - 120) / 30);
        due = (Math.floor(n / 40) >= 3) ? "3 تبع + " + groups + " مسنّة" : "3 تبع";
      }
    } else {
      if (n >= 400) due = "4 شياه +" + Math.ceil((n - 400) / 100) + " لكل مئة زائدة";
      else for (var j = 0; j < SHEEP.length; j++) {
        if (n >= SHEEP[j][0] && n <= SHEEP[j][1]) { due = SHEEP[j][2]; break; }
      }
    }
    return { livestock: true, base: n, due: due || "لا زكاة على هذا العدد",
      extra: [["العدد", n],
        ["النوع", kind === "camel" ? "إبل" : (kind === "cattle" ? "بقر" : "غنم")]] };
  }
  function calcMine() {
    var v = num("zkMineVal");
    return { base: v, rate: 0.20, extra: [["قيمة المعثر/الكنز", v]], note: "زكاة المعادن والكنوز رُبع العشر (20%) وتخرج مرة واحدة عند إخراجها." };
  }

  var CALC = {
    money: calcMoney, salary: calcSalary, trade: calcTrade,
    gold: calcGold, harvest: calcHarvest, livestock: calcLivestock, mine: calcMine
  };

  var FIELDS = {
    money: [
      { id: "zkCash", l: "نقد في البيت أو المحفظة", i: "بالعملة التي تحسب بها" },
      { id: "zkBank", l: "رصيد في البنك", i: "ما لا تحتاجه خلال السنة القادمة" },
      { id: "zkReceivable", l: "ديون مستحقة لك", i: "ما تُرجح استرداده" },
      { id: "zkDebt", l: "ديون عليك", i: "تُخصم إذا كانت مستحقة الأداء" },
      { id: "zkNisabGold", l: "سعر جرام الذهب اليوم", i: "اختياري — لتحديد النصاب (85 جم)" }
    ],
    salary: [
      { id: "zkSaved", l: "إجمالي المدخرات المتراكمة", i: "بعد مرور سنة هجرية على أول دفعة فيها" },
      { id: "zkNisabGold", l: "سعر جرام الذهب اليوم", i: "اختياري — لتحديد النصاب (85 جم)" }
    ],
    trade: [
      { id: "zkShares", l: "قيمة الأسهم", i: "بسعر السوق اليوم" },
      { id: "zkGoods", l: "قيمة البضاعة التجارية", i: "بسعر البيع لا بسعر الشراء" },
      { id: "zkNisabGold", l: "سعر جرام الذهب اليوم", i: "اختياري — لتحديد النصاب (85 جم)" }
    ],
    gold: [
      { id: "zkGoldW", l: "وزن الذهب (جرام)", i: "ما يملكه من ذهب غير المأكول والملبوس" },
      { id: "zkGoldP", l: "سعر جرام الذهب", i: "" },
      { id: "zkSilverW", l: "وزن الفضة (جرام)", i: "" },
      { id: "zkSilverP", l: "سعر جرام الفضة", i: "" }
    ],
    harvest: [
      { id: "zkQty", l: "كمية الإنتاج", i: "بالكيلو أو الوحدة" },
      { id: "zkUnitPrice", l: "سعر الوحدة", i: "بسعر السوق وقت الحصاد" }
    ],
    livestock: [
      { id: "zkCount", l: "عدد رؤوس الماشية", i: "ما بلغ نصاب الزكاة من الإبل والبقر والغنم" }
    ],
    mine: [{ id: "zkMineVal", l: "قيمة المعادن المستخرجة أو الكنز", i: "بسعر السوق" }]
  };

  var currentType = "money";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function ensureDom() {
    if (document.getElementById("zakatOverlay")) return;
    injectStyle();
    var ov = document.createElement("div");
    ov.id = "zakatOverlay";
    ov.innerHTML =
      '<div id="zakatBox">' +
        '<div class="zk-hd"><div><h2>🧮 حاسبة الزكاة</h2><small>اختر نوع الزكاة وأدخل ما تملك — نحسبها لك فورًا</small></div>' +
        '<button class="zk-x" onclick="closeZakat()">✕</button></div>' +
        '<div class="zk-card"><h3>اختر نوع الزكاة</h3><div class="zk-types" id="zkTypes"></div></div>' +
        '<div class="zk-card" id="zkFieldsCard"><h3 id="zkFieldsTitle"></h3><div id="zkFields"></div>' +
          '<button class="zk-calc" onclick="zkCalc()">احسب الزكاة</button></div>' +
        '<div id="zakatResult"></div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov) closeZakat(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && ov.classList.contains("show")) closeZakat();
    });
    buildTypes();
    zkSelect("money");
  }

  function buildTypes() {
    var wrap = document.getElementById("zkTypes");
    wrap.innerHTML = TYPES.map(function (t) {
      return '<button class="zk-type' + (t.id === currentType ? " on" : "") + '" data-id="' + t.id +
             '" onclick="zkSelect(\'' + t.id + '\')"><span>' + t.icon + '</span>' + t.label + "</button>";
    }).join("");
  }

  function renderFields() {
    var list = FIELDS[currentType] || [];
    var html = list.map(function (f) {
      return '<div class="zk-row"><label>' + f.l + (f.i ? "<i>" + f.i + "</i>" : "") +
             '</label><input type="number" id="' + f.id + '" placeholder="0" inputmode="decimal" oninput="zkCalc()"></div>';
    }).join("");
    if (currentType === "harvest") {
      html += '<div class="zk-row"><label>هل ريّيت النبت بدون نفقة؟<i>فتنقص النسبة إلى 5%</i></label>' +
              '<input type="checkbox" id="zkIrrigated" onchange="zkCalc()"></div>';
    }
    if (currentType === "livestock") {
      html += '<div class="zk-row"><label>نوع الماشية</label><span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">' +
        '<label style="font-size:.76rem;display:flex;align-items:center;gap:4px"><input type="radio" name="zkAnimal" value="camel" checked onchange="zkCalc()"> إبل</label>' +
        '<label style="font-size:.76rem;display:flex;align-items:center;gap:4px"><input type="radio" name="zkAnimal" value="cattle" onchange="zkCalc()"> بقر</label>' +
        '<label style="font-size:.76rem;display:flex;align-items:center;gap:4px"><input type="radio" name="zkAnimal" value="sheep" onchange="zkCalc()"> غنم</label>' +
        '</span></div>';
    }
    var legend = {
      money: "📏 نصاب المال = قيمة 85 جرامًا من الذهب. أدخل سعر الجرام اليوم (اختياري) لنخبرك إن بلغ مالك النصاب.",
      salary: "📏 نصاب المدخرات = قيمة 85 جرامًا من الذهب. أدخل سعر الجرام اليوم (اختياري) لتقييم النصاب.",
      trade: "📏 نصاب عروض التجارة = قيمة 85 جرامًا من الذهب. أدخل سعر الجرام اليوم (اختياري) لتقييم النصاب.",
      gold: "📏 نصاب الذهب 85 جرامًا، ونصاب الفضة 595 جرامًا — بالوزن لا بالقيمة.",
      harvest: "📏 نصاب الزروع والثمار 5 أوسق ≈ 653 كجم.",
      livestock: "📏 نصاب الإبل 5، والبقر 30، والغنم 40 رأسًا.",
      mine: "📏 نصاب المعدن والكنز = قيمة 85 جرامًا من الذهب، ومقدار الزكاة ربع العشر (20%)."
    };
    if (legend[currentType]) html += '<div class="zk-hint">' + legend[currentType] + "</div>";
    document.getElementById("zkFields").innerHTML = html;
    var gpField = document.getElementById("zkNisabGold");
    if (gpField && !gpField.value && savedGoldPrice() > 0) gpField.value = savedGoldPrice();
    var meta = TYPES.filter(function (t) { return t.id === currentType; })[0];
    document.getElementById("zkFieldsTitle").textContent = meta ? (meta.icon + " " + meta.label) : "";
    Array.prototype.forEach.call(document.querySelectorAll(".zk-type"), function (b) {
      b.classList.toggle("on", b.getAttribute("data-id") === currentType);
    });
  }

  window.zkSelect = function (id) { currentType = id; renderFields(); zkCalc(); };

  function zkBreak(items) {
    return '<div class="zk-break">' + items.map(function (p) {
      var v = p[1];
      var shown = (typeof v === "number")
        ? (v === 0 ? "0" : (v < 0 ? "−" + fmt(-v) : fmt(v)))
        : String(v == null ? "" : v);
      return "<div><span>" + p[0] + "</span><b>" + shown + "</b></div>";
    }).join("") + "</div>";
  }

  window.zkCalc = function () {
    var res = document.getElementById("zakatResult");
    if (!res) return;
    var r = CALC[currentType]();
    var html = "";

    if (r.livestock) {
      html = '<div class="zk-res"><div class="zk-cap">الزكاة المستحقة</div>' +
             '<div class="zk-big">' + r.due + "</div>" +
             zkBreak(r.extra) + nisabReport(r) +
             '<div class="zk-note">زكاة الماشية تخرج من الماشية نفسها (أو من قيمتها إن لم تجد المُخرَجة) عند بلوغ النصاب وحلول الحول.</div></div>';
      res.innerHTML = html;
      res.classList.add("show");
      return;
    }

    var zakat = r.base * r.rate;
    var repHtml = nisabReport(r);
    var below = lastNisabReached === false;
    var owed = below ? 0 : zakat;

    html = '<div class="zk-res"><div class="zk-cap">' +
           (below ? "لا تجب الزكاة — لم يبلغ النصاب" : "الزكاة المستحقة") + "</div>" +
           '<div class="zk-big">' + fmt(owed) + "</div>" +
           zkBreak(r.extra.concat([["الخاضع للزكاة", r.base], ["النسبة", (r.rate * 100) + "%"],
             ["المبلغ بعد الزكاة", Math.max(0, r.base - owed)]]));
    html += repHtml;

    html += '<div class="zk-note">تنبيه: الزكاة تجب في مالك إذا حال عليه الحول الهجري (سنة قمرية ≈ 354 يومًا) وبلغ النصاب. ' +
            (r.note || "هذه الحسبة إرشادية، وللأسئلة الخاصة راجع أهل العلم.") + "</div></div>";

    res.innerHTML = html;
    res.classList.add("show");
  };

  window.openZakat = function () {
    ensureDom();
    var ov = document.getElementById("zakatOverlay");
    ov.classList.add("show");
    document.body.style.overflow = "hidden";
    zkCalc();
  };
  window.closeZakat = function () {
    var ov = document.getElementById("zakatOverlay");
    if (ov) ov.classList.remove("show");
    document.body.style.overflow = "";
  };
})();
