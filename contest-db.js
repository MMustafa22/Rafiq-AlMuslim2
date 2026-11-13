/* ============================================================
   رفيق المسلم — قاعدة بيانات المسابقة (IndexedDB)
   ------------------------------------------------------------
   متاجر البيانات:
     members : الحسابات (الاسم + البريد + واتساب + كلمة المرور المشفّرة)
     scores  : درجة كل متسابق في كل شهر هجري
     meta    : بيانات تشغيلية

   الخصوصية:
     - البريد ورقم الواتساب لا يخرجان أبدًا من دوال الترتيب العامة.
     - كلمة المرور تُخزَّن مشفّرة (PBKDF2-SHA256) ولا تُحفظ كنص صريح.
     - الترتيب يعرض الاسم والنقاط وعدد الأيام فقط.
   ============================================================ */
(function () {
  'use strict';

  var DB_NAME = 'rafiq-contest-db';
  var DB_VERSION = 1;
  var SESSION_KEY = 'rfq_contest_session_v2';
  var HIJRI_MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  var HIJRI_FMT = null;

  function hijri() {
    try {
      if (!HIJRI_FMT) HIJRI_FMT = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
      var out = {};
      HIJRI_FMT.formatToParts(new Date()).forEach(function (p) { out[p.type] = p.value; });
      return { y: parseInt(out.year, 10), m: parseInt(out.month, 10) };
    } catch (e) { return { y: 1448, m: 1 }; }
  }
  function currentMonth() {
    var h = hijri();
    return h.y + '-' + String(h.m).padStart(2, '0');
  }
  function monthLabel(key) {
    var p = String(key || '').split('-');
    var y = parseInt(p[0], 10) || 0;
    var m = parseInt(p[1], 10) || 0;
    var yy = String(y).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[+d]; });
    return (HIJRI_MONTHS[(m - 1 + 12) % 12] || '') + ' ' + yy + ' هـ';
  }
  function shiftMonth(key, delta) {
    var p = String(key).split('-');
    var y = parseInt(p[0], 10);
    var m = parseInt(p[1], 10) + delta;
    while (m < 1) { m += 12; y--; }
    while (m > 12) { m -= 12; y++; }
    return y + '-' + String(m).padStart(2, '0');
  }

  /* ---------- فتح قاعدة البيانات ---------- */
  var dbPromise = null;
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('متصفحك لا يدعم قاعدة البيانات المطلوبة. جرّب متصفحًا أحدث.')); return; }
      var req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(new Error('تعذّر فتح قاعدة بيانات المسابقة.')); return; }
      req.onupgradeneeded = function (ev) {
        var db = ev.target.result;
        if (!db.objectStoreNames.contains('members')) {
          var m = db.createObjectStore('members', { keyPath: 'id' });
          m.createIndex('emailKey', 'emailKey', { unique: true });
        }
        if (!db.objectStoreNames.contains('scores')) {
          var s = db.createObjectStore('scores', { keyPath: 'key' });
          s.createIndex('month', 'month', { unique: false });
          s.createIndex('memberId', 'memberId', { unique: false });
        }
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(new Error('تعذّر فتح قاعدة بيانات المسابقة: ' + (req.error && req.error.message || ''))); };
      req.onblocked = function () { reject(new Error('قاعدة البيانات مستخدمة في تبويب آخر — أغلق التبويبات الأخرى ثم أعد المحاولة.')); };
    });
    return dbPromise;
  }
  function tx(stores, mode, fn) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t;
        try { t = db.transaction(stores, mode); } catch (e) { reject(e); return; }
        var result;
        try { result = fn(t); } catch (e) { try { t.abort(); } catch (x) {} reject(e); return; }
        t.oncomplete = function () { resolve(result); };
        t.onerror = function () { reject(t.error || new Error('خطأ في قاعدة البيانات')); };
        t.onabort = function () { reject(t.error || new Error('أُلغيت العملية')); };
      });
    });
  }
  function getAll(store) {
    return tx([store], 'readonly', function (t) {
      var out = [];
      t.objectStore(store).getAll().onsuccess = function (e) {
        var rows = e.target.result || [];
        out.length = 0;
        for (var i = 0; i < rows.length; i++) out.push(rows[i]);
      };
      return out;
    });
  }

  /* ---------- التشفير ---------- */
  function randomBytes(n) {
    var a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return a;
  }
  function b64(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function unb64(str) {
    var s = atob(str);
    var a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  }
  function subtle() {
    if (!window.crypto || !crypto.subtle) throw new Error('المتصفح لا يدعم التشفير المطلوب — افتح التطبيق عبر https أو localhost.');
    return crypto.subtle;
  }
  function hashPassword(password, saltBytes) {
    var enc = new TextEncoder();
    return subtle().importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) {
        return subtle().deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 150000, hash: 'SHA-256' }, key, 256);
      })
      .then(function (bits) { return b64(new Uint8Array(bits)); });
  }

  /* ---------- جلسة ---------- */
  function readSession() {
    try {
      var s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return s && s.id ? s : null;
    } catch (e) { return null; }
  }
  function writeSession(member) {
    if (!member) { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} return; }
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: member.id, email: member.email, at: Date.now() }));
    } catch (e) {}
  }

  /* ---------- تحقق ---------- */
  function cleanName(v) {
    return String(v || '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim();
  }
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
  }
  function cleanPhone(v) {
    return String(v || '').replace(/\D/g, '').replace(/^0+/, '');
  }
  function assert(cond, message) { if (!cond) throw new Error(message); }

  /* ---------- بيانات تجريبية ---------- */
  var DEMO_NAMES = ['أحمد محمد حسن', 'عبد الرحمن المصري', 'فاطمة الزهراء', 'يوسف بن سالم', 'أم عبد الله', 'سارة بنت أحمد', 'محمد الفاتح', 'نور الهدى', 'إبراهيم الخليل', 'عمر الصغير'];
  function seedDemo() {
    return openDb().then(function () {
      return getAll('meta').then(function (meta) {
        if (meta.some(function (r) { return r.key === 'seeded'; })) return;
        var month = currentMonth();
        return tx(['members', 'scores', 'meta'], 'readwrite', function (t) {
          var members = t.objectStore('members');
          var scores = t.objectStore('scores');
          DEMO_NAMES.forEach(function (name, i) {
            var id = 'demo-' + (i + 1);
            members.put({ id: id, name: name, demo: true, joined: '1447-0' + ((i % 9) + 1), createdAt: Date.now() });
            for (var back = 0; back < 4; back++) {
              var m = shiftMonth(month, -back);
              var base = 26000 - i * 1450 - back * 900;
              var pts = Math.max(1200, Math.round(base + ((i * 731 + back * 97) % 1400)));
              var days = Math.max(6, 29 - i - back);
              scores.put({ key: id + '|' + m, memberId: id, month: m, pts: pts, days: days, at: Date.now(), demo: true });
            }
          });
          t.objectStore('meta').put({ key: 'seeded', value: Date.now() });
          return true;
        });
      });
    });
  }

  /* ---------- الحسابات ---------- */
  function register(data) {
    var name = cleanName(data.name);
    var email = String(data.email || '').trim().toLowerCase();
    var cc = String(data.cc || '').replace(/\D/g, '');
    var phone = cleanPhone(data.whatsapp);
    var password = String(data.password || '');

    assert(name.length >= 3, 'اكتب اسمك كما تريد أن يظهر في الترتيب (3 أحرف على الأقل).');
    assert(name.length <= 40, 'الاسم طويل جدًا.');
    assert(validEmail(email), 'أدخل بريدًا إلكترونيًا صحيحًا.');
    assert(cc.length >= 1 && cc.length <= 4, 'اختر مفتاح الدولة.');
    assert(phone.length >= 7 && phone.length <= 12, 'أدخل رقم واتساب صحيحًا.');
    assert(password.length >= 8, 'كلمة المرور 8 أحرف على الأقل.');

    return getAll('members').then(function (members) {
      assert(!members.some(function (m) { return m.emailKey === email; }), 'هذا البريد مسجَّل بالفعل — سجّل الدخول بدلًا من إنشاء حساب.');
      assert(!members.some(function (m) { return !m.demo && m.cc === cc && m.whatsapp === phone; }), 'رقم الواتساب مسجَّل بالفعل.');
      var salt = b64(randomBytes(16));
      return hashPassword(password, unb64(salt)).then(function (hash) {
        var member = {
          id: 'm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
          name: name, email: email, emailKey: email,
          cc: cc, whatsapp: phone,
          salt: salt, hash: hash,
          joined: currentMonth(), createdAt: Date.now()
        };
        return tx(['members'], 'readwrite', function (t) { t.objectStore('members').put(member); })
          .then(function () { writeSession(member); return publicMember(member); });
      });
    });
  }

  function login(email, password) {
    var key = String(email || '').trim().toLowerCase();
    assert(validEmail(key), 'أدخل البريد الإلكتروني المسجَّل.');
    assert(String(password || '').length > 0, 'أدخل كلمة المرور.');
    var lockUntil = parseInt(localStorage.getItem('rfq_contest_lock') || '0', 10) || 0;
    if (Date.now() < lockUntil) {
      return Promise.reject(new Error('محاولات كثيرة — حاول بعد ' + Math.ceil((lockUntil - Date.now()) / 1000) + ' ثانية.'));
    }
    return getAll('members').then(function (members) {
      var member = members.filter(function (m) { return m.emailKey === key; })[0];
      if (!member) {
        var fails = (parseInt(localStorage.getItem('rfq_contest_fail') || '0', 10) || 0) + 1;
        localStorage.setItem('rfq_contest_fail', String(fails));
        if (fails >= 5) {
          localStorage.setItem('rfq_contest_lock', String(Date.now() + 30000));
          localStorage.setItem('rfq_contest_fail', '0');
        }
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }
      return hashPassword(password, unb64(member.salt)).then(function (hash) {
        if (hash !== member.hash) {
          var fails = (parseInt(localStorage.getItem('rfq_contest_fail') || '0', 10) || 0) + 1;
          localStorage.setItem('rfq_contest_fail', String(fails));
          if (fails >= 5) {
            localStorage.setItem('rfq_contest_lock', String(Date.now() + 30000));
            localStorage.setItem('rfq_contest_fail', '0');
          }
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
        localStorage.setItem('rfq_contest_fail', '0');
        writeSession(member);
        return publicMember(member);
      });
    });
  }

  function publicMember(m) {
    return {
      id: m.id, name: m.name, demo: !!m.demo,
      email: m.email, cc: m.cc, whatsapp: m.whatsapp,
      joined: m.joined, createdAt: m.createdAt
    };
  }
  function me() {
    var session = readSession();
    if (!session) return Promise.resolve(null);
    return openDb()
      .then(function () { return getAll('members'); })
      .then(function (members) {
        var member = members.filter(function (m) { return m.id === session.id; })[0] || null;
        if (!member) { writeSession(null); return null; }
        return publicMember(member);
      })
      .catch(function () { return null; });
  }
  function logout() { writeSession(null); }

  function deleteAccount() {
    var session = readSession();
    if (!session) return Promise.resolve(false);
    return getAll('scores').then(function (scores) {
      return tx(['members', 'scores'], 'readwrite', function (t) {
        t.objectStore('members').delete(session.id);
        scores.forEach(function (s) { if (s.memberId === session.id) t.objectStore('scores').delete(s.key); });
      });
    }).then(function () { writeSession(null); return true; });
  }

  function updateName(name) {
    var session = readSession();
    var clean = cleanName(name);
    assert(clean.length >= 3, 'الاسم قصير جدًا.');
    return getAll('members').then(function (members) {
      var member = members.filter(function (m) { return m.id === session.id; })[0];
      if (!member) throw new Error('الحساب غير موجود.');
      member.name = clean;
      return tx(['members'], 'readwrite', function (t) { t.objectStore('members').put(member); })
        .then(function () { return publicMember(member); });
    });
  }

  /* ---------- الدرجات ---------- */
  function saveMonth(memberId, month, pts, days) {
    var key = memberId + '|' + month;
    var row = { key: key, memberId: memberId, month: month, pts: Math.max(0, Math.round(pts || 0)), days: Math.max(0, Math.round(days || 0)), at: Date.now() };
    return tx(['scores'], 'readwrite', function (t) { t.objectStore('scores').put(row); }).then(function () { return row; });
  }

  function standings(month, opts) {
    opts = opts || {};
    return Promise.all([getAll('members'), getAll('scores')]).then(function (rows) {
      var members = rows[0], scores = rows[1];
      var byMember = {};
      scores.forEach(function (s) { if (s.month === month) byMember[s.memberId] = s; });
      var out = members.map(function (m) {
        var s = byMember[m.id] || { pts: 0, days: 0 };
        return { id: m.id, name: m.name, pts: s.pts || 0, days: s.days || 0, demo: !!m.demo, joined: m.joined };
      }).filter(function (r) {
        if (opts.includeEmpty) return true;
        return r.pts > 0 || !r.demo;
      });
      out.sort(function (a, b) { return (b.pts - a.pts) || (b.days - a.days) || String(a.name).localeCompare(String(b.name), 'ar'); });
      out.forEach(function (r, i) { r.rank = i + 1; });
      return out;
    });
  }

  function memberScores(memberId) {
    return getAll('scores').then(function (rows) {
      return rows.filter(function (r) { return r.memberId === memberId; }).sort(function (a, b) { return a.month < b.month ? 1 : -1; });
    });
  }

  function counts() {
    return Promise.all([getAll('members'), getAll('scores')]).then(function (rows) {
      return {
        members: rows[0].filter(function (m) { return !m.demo; }).length,
        demo: rows[0].filter(function (m) { return m.demo; }).length,
        scores: rows[1].length,
        months: Array.from(new Set(rows[1].map(function (s) { return s.month; }))).length
      };
    });
  }

  function clearDemo() {
    return Promise.all([getAll('members'), getAll('scores')]).then(function (rows) {
      var demoIds = {};
      rows[0].forEach(function (m) { if (m.demo) demoIds[m.id] = true; });
      return tx(['members', 'scores', 'meta'], 'readwrite', function (t) {
        Object.keys(demoIds).forEach(function (id) { t.objectStore('members').delete(id); });
        rows[1].forEach(function (s) { if (demoIds[s.memberId]) t.objectStore('scores').delete(s.key); });
        t.objectStore('meta').put({ key: 'seeded', value: Date.now() });
      });
    });
  }

  function exportAll() {
    return Promise.all([getAll('members'), getAll('scores')]).then(function (rows) {
      return {
        app: 'rafiq-almuslim-contest',
        version: 2,
        exportedAt: new Date().toISOString(),
        members: rows[0].filter(function (m) { return !m.demo; }).map(function (m) {
          return { name: m.name, email: m.email, cc: m.cc, whatsapp: m.whatsapp, joined: m.joined };
        }),
        scores: rows[1].map(function (s) {
          var m = rows[0].filter(function (x) { return x.id === s.memberId; })[0];
          return { email: m ? m.email : '', month: s.month, pts: s.pts, days: s.days };
        }).filter(function (s) { return !!s.email; })
      };
    });
  }

  function importAll(data) {
    if (!data || data.app !== 'rafiq-almuslim-contest' || !Array.isArray(data.members)) {
      return Promise.reject(new Error('الملف ليس نسخة صالحة من قاعدة بيانات المسابقة.'));
    }
    return getAll('members').then(function (members) {
      var byEmail = {};
      members.forEach(function (m) { byEmail[m.emailKey] = m; });
      var added = 0;
      return tx(['members', 'scores'], 'readwrite', function (t) {
        data.members.forEach(function (m) {
          var email = String(m.email || '').trim().toLowerCase();
          if (!email || byEmail[email]) return;
          var salt = b64(randomBytes(16));
          var member = {
            id: 'm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
            name: cleanName(m.name) || 'مشارك',
            email: email, emailKey: email,
            cc: String(m.cc || '').replace(/\D/g, ''), whatsapp: cleanPhone(m.whatsapp),
            salt: salt, hash: '',
            joined: m.joined || currentMonth(), createdAt: Date.now(),
            imported: true
          };
          byEmail[email] = member;
          added++;
          t.objectStore('members').put(member);
        });
        (data.scores || []).forEach(function (s) {
          var email = String(s.email || '').trim().toLowerCase();
          var m = byEmail[email];
          if (!m) return;
          t.objectStore('scores').put({ key: m.id + '|' + s.month, memberId: m.id, month: s.month, pts: Math.max(0, s.pts | 0), days: Math.max(0, s.days | 0), at: Date.now() });
        });
      }).then(function () { return { added: added, scores: (data.scores || []).length }; });
    });
  }

  function card() {
    var session = readSession();
    if (!session) return Promise.reject(new Error('سجّل الدخول أولًا.'));
    return me().then(function (m) {
      if (!m) throw new Error('الحساب غير موجود.');
      return window.RFQ_POINTS.mySummary(currentMonth()).then(function (s) {
        return {
          app: 'rafiq-almuslim-contest-card',
          version: 1,
          exportedAt: new Date().toISOString(),
          name: m.name, email: m.email, cc: m.cc, whatsapp: m.whatsapp,
          month: s.month, pts: s.pts, days: s.days
        };
      });
    });
  }

  function importCard(data) {
    if (!data || data.app !== 'rafiq-almuslim-contest-card' || !data.email || !data.month) {
      return Promise.reject(new Error('بطاقة الدرجات غير صالحة.'));
    }
    var email = String(data.email).trim().toLowerCase();
    return getAll('members').then(function (members) {
      var member = members.filter(function (m) { return m.emailKey === email; })[0];
      if (!member) {
        return Promise.reject(new Error('لا يوجد حساب مطابق لهذا البريد في قاعدة البيانات.'));
      }
      return saveMonth(member.id, String(data.month), data.pts, data.days);
    });
  }

  window.RFQ_CONTEST = {
    ready: openDb().then(seedDemo).catch(function (e) { console.warn('[RFQ_CONTEST]', e); }),
    register: register,
    login: login,
    me: me,
    logout: logout,
    deleteAccount: deleteAccount,
    updateName: updateName,
    saveMonth: saveMonth,
    standings: standings,
    memberScores: memberScores,
    counts: counts,
    clearDemo: clearDemo,
    exportAll: exportAll,
    importAll: importAll,
    card: card,
    importCard: importCard,
    currentMonth: currentMonth,
    monthLabel: monthLabel,
    shiftMonth: shiftMonth,
    hasSession: function () { return !!readSession(); }
  };
})();
