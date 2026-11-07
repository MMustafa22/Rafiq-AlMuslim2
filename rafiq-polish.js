/* Rafiq v35: clarity, accessibility, locale and prayer transparency */
(()=>{'use strict';
function applyLang(){document.documentElement.lang='ar';document.documentElement.dir='rtl';document.body?.classList.remove('rfq-ltr')}
function init(){applyLang();if(!document.getElementById('rfq-polish-style')){let st=document.createElement('style');st.id='rfq-polish-style';st.textContent=`
/* Calm, readable desktop-first surfaces */
.container:not(#mainApp){max-width:1180px;padding:clamp(18px,3vw,38px);padding-bottom:100px}
.btn-nav,.btn,.btn-icon,.tab-btn{box-shadow:none!important;animation:none!important}
/* Larger usable area without shrinking labels */
@media(min-width:900px){.container:not(#mainApp){padding-top:28px}}
.home-tile.t-daily{--tile-c:rgba(45,212,191,.55);--tile-bg:rgba(45,212,191,.12);--tile-glow:rgba(45,212,191,.25);border-color:rgba(45,212,191,.3);background:linear-gradient(165deg,rgba(45,212,191,.1),var(--bg-glass) 70%)}
.home-tile.t-daily .ht-label{color:#e6edf7!important;font-weight:800}.daily-subtitle{font-size:.72rem;color:#9db7bd;line-height:1.25;text-align:center}
.daily-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 18px}.daily-step{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:8px 10px;background:#111c29;border:1px solid #334457;border-radius:12px;color:#c8d5df;font:700 .9rem Tajawal,sans-serif;cursor:pointer;transition:background .2s,border-color .2s,color .2s}.daily-step:hover{border-color:#4b8983}.daily-step[aria-current="step"]{background:linear-gradient(120deg,rgba(45,212,191,.18),rgba(20,42,48,.85));border-color:#4cb9aa;color:#e3fffa}.daily-step-num{width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.08);font-size:.8rem}.daily-step[aria-current="step"] .daily-step-num{background:#2d8f82;color:#fff}
.daily-hub-head h1{flex:1;text-align:center}.daily-hub-head{display:grid!important;grid-template-columns:1fr auto 1fr;align-items:center}.daily-hub-head .daily-back{margin:0;justify-self:start}.daily-hub-head .daily-hub-title{text-align:center}.daily-hub-head .daily-hub-title h1{flex:none;text-align:center}.daily-hub-head .daily-hub-spacer{display:block}@media(max-width:480px){.daily-hub-head{gap:8px;padding:14px 12px}.daily-hub-head .daily-back{padding:8px 10px;font-size:.84rem}.daily-hub-head .daily-hub-title p{font-size:.78rem}}.daily-hub-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 18px;padding:16px 18px;border:1px solid rgba(45,212,191,.28);border-radius:18px;background:linear-gradient(130deg,rgba(45,212,191,.12),rgba(15,23,42,.75));box-shadow:0 12px 34px rgba(0,0,0,.16)}
.daily-hub-head h1{font:800 clamp(1.15rem,2vw,1.6rem) Tajawal,sans-serif;color:#e7f7f4}.daily-hub-head p{font-size:.9rem;color:#afc4c8;margin-top:3px}.daily-back{border:1px solid #547879;border-radius:11px;background:#122b31;color:#dbf3ef;padding:9px 14px;font:700 .94rem Tajawal,sans-serif;cursor:pointer;white-space:nowrap}.daily-back:hover{background:#1a3c41}
#dailyApp .sub-page{max-width:100%}#dailyApp .sec-hd[onclick]{cursor:default}#dailyApp .sec-hd .col-ic{display:none}
@media(max-width:600px){.daily-steps{gap:5px}.daily-step{font-size:.76rem;padding:7px 5px;min-height:44px;gap:4px}.daily-step-num{width:22px;height:22px}}
@media(min-width:900px) and (max-height:780px){.daily-steps{margin-bottom:12px}}
.rfq-info-card{background:#101b2b;border:1px solid #304056;border-radius:14px;padding:14px 16px;margin:14px 0;color:#dbe5f1;font-size:.94rem;line-height:1.65}
.rfq-info-card summary{font-weight:800;cursor:pointer;color:#f3cf76}.rfq-info-card p{margin-top:8px;color:#c4d0dd}
.rfq-qibla-shortcut{display:flex;align-items:center;justify-content:center;gap:9px;text-decoration:none;color:#e9f4ff;background:#12283a;border:1px solid #3d6571;border-radius:12px;padding:12px 16px;font-weight:800;cursor:pointer;font:700 1rem Tajawal,sans-serif}

/* ---------- الوضع النهاري لعناصر الرفيق اليومي: نفس لوحة التطبيق (كريمي/ذهبي) ---------- */
html[data-rafiq-theme="light"] .daily-hub-head{background:linear-gradient(130deg,rgba(201,162,39,.13),rgba(255,253,248,.94))!important;border-color:rgba(163,120,19,.30)!important;box-shadow:0 10px 28px rgba(120,88,23,.10)!important}
html[data-rafiq-theme="light"] .daily-hub-head h1{color:#8a6408!important}
html[data-rafiq-theme="light"] .daily-hub-head p{color:#7b6a4f!important}
html[data-rafiq-theme="light"] .daily-back:hover{background:#fff}
html[data-rafiq-theme="light"] .daily-step:hover{border-color:rgba(163,120,19,.5)}
html[data-rafiq-theme="light"] .daily-step[aria-current="step"]{background:linear-gradient(120deg,rgba(15,125,91,.15),rgba(255,253,248,.96))!important;border-color:rgba(15,125,91,.48)!important;color:#0c6f50!important}
html[data-rafiq-theme="light"] .daily-step[aria-current="step"] .daily-step-num{background:#0f7d5b;color:#fff}
html[data-rafiq-theme="light"] .daily-subtitle{color:#7b6a4f}
html[data-rafiq-theme="light"] .rfq-info-card{background:#fffdf8;border-color:rgba(163,120,19,.24);color:#3a2f1e}
html[data-rafiq-theme="light"] .rfq-info-card summary{color:#8a6408}
html[data-rafiq-theme="light"] .rfq-info-card p{color:#5d4c33}
html[data-rafiq-theme="light"] .rfq-qibla-shortcut{color:#2b2115;background:linear-gradient(135deg,rgba(201,162,39,.16),rgba(255,253,248,.9));border-color:rgba(163,120,19,.32)}
/* شريط تثبيت التطبيق في الوضع النهاري */
html[data-rafiq-theme="light"] #pwa-install-banner>div{background:linear-gradient(135deg,#fffdf8,rgba(251,191,36,.18))!important;border-top-color:rgba(163,120,19,.35)!important}
html[data-rafiq-theme="light"] #pwa-install-banner div[style*="color:#fff"]{color:#2b2115!important}
html[data-rafiq-theme="light"] #pwa-install-banner div[style*="color:#aaa"]{color:#7b6a4f!important}
html[data-rafiq-theme="light"] #pwa-later-btn{background:transparent!important;border-color:rgba(163,120,19,.45)!important;color:#7b6a4f!important}
html[data-rafiq-theme="light"] #pwa-install-btn{background:#c9a227!important;color:#231a05!important}


/* Small direct Qibla action on the homepage date strip */
.rfq-home-qibla{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:26px;padding:3px 9px;border:1px solid rgba(212,175,55,.42);border-radius:999px;background:rgba(212,175,55,.08);color:var(--accent-gold,#fbbf24);font:800 .78rem Tajawal,sans-serif;white-space:nowrap;cursor:pointer;transition:background .18s,border-color .18s,transform .18s}
.rfq-home-qibla:hover{background:rgba(212,175,55,.15);border-color:rgba(212,175,55,.72);transform:translateY(-1px)}.rfq-home-qibla:focus-visible{outline:2px solid var(--accent-gold,#fbbf24);outline-offset:2px}.rfq-home-qibla-ic{font-size:.95rem;line-height:1}
@media(max-width:560px){.rfq-home-qibla{min-height:24px;padding:3px 6px;gap:4px;font-size:.7rem}.rfq-home-qibla-ic{font-size:.84rem}}
/* Quran surah finder: persistent search, quick filters and readable cards */
#tabSearch{display:none!important}
#searchBarWrapper.qf-persistent{display:flex;border-color:rgba(212,175,55,.48);background:linear-gradient(110deg,rgba(212,175,55,.09),rgba(255,255,255,.035));min-height:52px;padding:9px 14px;box-shadow:0 8px 24px rgba(0,0,0,.12)}
#searchBarWrapper.qf-persistent:focus-within{border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,175,55,.12)}
#searchInput{min-height:32px;font-size:1.05rem}#searchInput::placeholder{opacity:.8}
#quranFinderTools{margin:0 0 12px}.qf-helper{color:var(--text2);font-size:.84rem;margin:0 2px 9px;line-height:1.5}
.qf-filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.qf-chip{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:7px 13px;border:1px solid rgba(212,175,55,.22);border-radius:999px;background:rgba(255,255,255,.035);color:var(--text2);font:700 .88rem Tajawal,sans-serif;cursor:pointer;transition:all .18s}
.qf-chip:hover{border-color:rgba(212,175,55,.6);color:var(--gold)}.qf-chip[aria-pressed=true]{background:rgba(212,175,55,.15);border-color:var(--gold);color:var(--gold);box-shadow:0 3px 14px rgba(212,175,55,.12)}
.qf-count{font-size:.72rem;opacity:.8}.qf-finder-empty{grid-column:1/-1;padding:22px 16px;border:1px dashed rgba(212,175,55,.25);border-radius:14px;text-align:center;color:var(--text2);line-height:1.7}
#surahList .item-card{position:relative;min-height:112px;justify-content:center;padding:16px 14px 13px;cursor:pointer}
#surahList .item-card>b{font-size:1rem;line-height:1.45}
.qf-favorite-btn{position:absolute;top:7px;inset-inline-start:7px;z-index:2;width:32px;height:32px;border-radius:50%;border:1px solid rgba(212,175,55,.22);background:rgba(5,11,20,.42);color:rgba(255,220,128,.72);font-size:1.15rem;line-height:1;cursor:pointer;display:grid;place-items:center}
.qf-favorite-btn:hover,.qf-favorite-btn.is-favorite{color:#ffd76a;border-color:rgba(255,215,106,.75);background:rgba(212,175,55,.14)}
.qf-favorite-btn:focus-visible,.qf-chip:focus-visible,#searchInput:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
html[data-rafiq-theme="light"] .qf-chip{background:rgba(255,255,255,.68);color:#66501c}html[data-rafiq-theme="light"] .qf-chip[aria-pressed=true]{background:rgba(212,175,55,.15);color:#7d5c07}
@media(max-width:600px){.qf-filter-row{gap:6px}.qf-chip{min-height:36px;padding:6px 10px;font-size:.82rem}#surahList{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:900px){.app-shell{width:min(calc(100vw - 32px),1360px);max-width:1360px;min-width:0;margin-inline:auto}.container:not(#mainApp){max-width:1360px;padding-inline:32px}#surahList.grid-list{grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}}

#rm-prayer-overlay{direction:inherit}
`;document.head.append(st)}
// Keep Qibla access within the prayer-times area, not on the home dashboard.
document.getElementById('rfq-qibla-direct')?.remove();
// Activity points remain available within the relevant activity/statistics screens.
document.getElementById('rfq-points-explainer')?.remove();
// Time-zone preference is intentionally not surfaced on the home dashboard.
document.getElementById('rfq-zone-panel')?.remove();
// Split the daily practice tracker into its own page while keeping the progress summary on home.
const homeDateBar=document.getElementById('dateBannerCard');
homeDateBar?.querySelectorAll('.rfq-home-qibla').forEach(button=>button.remove());
// v50: زر القبلة الوحيد في الصفحة الرئيسية هو .rfq-qt-qibla (داخل شريط العنوان)؛ تم حذف النسخة المكررة.
const mainApp=document.getElementById('mainApp');
if(mainApp&&!document.getElementById('dailyApp')){
  const grid=mainApp.querySelector('.home-grid');
  const riyad=mainApp.querySelector('#btnRiyad');
  if(grid&&riyad){
    const dailyTile=document.createElement('button');
    dailyTile.type='button';dailyTile.id='btnDailyRafiq';dailyTile.className='home-tile t-daily';
    dailyTile.innerHTML='<span class="ht-star">✦</span><span class="ht-icon" aria-hidden="true">🪷</span><span class="ht-label">الرفيق اليومي</span>';
    dailyTile.setAttribute('aria-label','افتح الرفيق اليومي لمتابعة صلواتك وأورادك وتقييم اليوم');
    dailyTile.addEventListener('click',()=>window.shPg?.('dailyApp'));
    riyad.insertAdjacentElement('afterend',dailyTile); // الترتيب: أسماء الله، القرآن، رياض الصالحين، الرفيق اليومي، أذكار الصباح…
  }
  const p1=document.getElementById('p1'),p2=document.getElementById('p2'),p3=document.getElementById('p3');
  if(p1&&p2&&p3){
    const daily=document.createElement('main');daily.id='dailyApp';daily.className='container page';daily.setAttribute('aria-label','الرفيق اليومي');
    const head=document.createElement('header');head.className='daily-hub-head';
    head.innerHTML='<button type="button" class="daily-back" aria-label="العودة إلى الرئيسية">الرئيسية →</button><div class="daily-hub-title"><h1>الرفيق اليومي</h1><p>مساحة يومك: صلواتك، أورادك، وخطواتك الصغيرة</p></div><span class="daily-hub-spacer" aria-hidden="true"></span>';
    head.querySelector('button').addEventListener('click',()=>window.shPg?.('mainApp'));
    daily.append(head);
    const steps=document.createElement('nav');steps.className='daily-steps';steps.setAttribute('aria-label','خطوات متابعة اليوم');
    steps.innerHTML='<button class="daily-step" type="button" data-step="1"><span class="daily-step-num">1</span><span>الفرائض والقرآن</span></button><button class="daily-step" type="button" data-step="2"><span class="daily-step-num">2</span><span>السنن والأذكار</span></button><button class="daily-step" type="button" data-step="3"><span class="daily-step-num">3</span><span>القيام ومراجعة اليوم</span></button>';
    steps.querySelectorAll('[data-step]').forEach(btn=>btn.addEventListener('click',()=>window.goTo?.(Number(btn.dataset.step))));
    daily.append(steps);mainApp.insertAdjacentElement('afterend',daily);
    const score=p1.querySelector('.scr-card');
    const date=document.getElementById('dateBannerCard');
    if(score&&date){score.classList.add('daily-main-score');date.insertAdjacentElement('afterend',score)}
    [p1,p2,p3].forEach(page=>daily.append(page));
    const p2Nav=p2.querySelector('.nav-g');
    const duha=p3.querySelector('#duSec'), adhkarDaily=p3.querySelector('#athSec');
    if(p2Nav&&duha)p2Nav.insertAdjacentElement('beforebegin',duha);
    if(p2Nav&&adhkarDaily)p2Nav.insertAdjacentElement('beforebegin',adhkarDaily);
    // Present every section expanded, like the first step; headings remain informative, not dropdown controls.
    daily.querySelectorAll('.sec-hd[onclick*="togSec"]').forEach(hd=>{hd.removeAttribute('onclick');hd.setAttribute('aria-expanded','true');hd.parentElement?.classList.remove('col')});
    const setLabel=(button,label)=>{if(!button)return;const tw=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);let n,last=null;while(n=tw.nextNode())if(n.nodeValue.trim())last=n;if(last)last.nodeValue=' '+label};
    setLabel(p1.querySelector('.nav-g .nav-lg'),'السنن والأذكار');
    const p2Buttons=p2.querySelectorAll('.nav-g .nav-lg');setLabel(p2Buttons[0],'الفرائض والقرآن');setLabel(p2Buttons[1],'القيام ومراجعة اليوم');
    setLabel(p3.querySelector('.nav-g .nav-lg'),'السنن والأذكار');
    // Remove the duplicated pair of top-row navigation buttons from daily steps 2 and 3.
    [p2,p3].forEach(page=>{const strip=Array.from(page.children).find(el=>el.tagName==='DIV'&&el.querySelectorAll(':scope > button.btn-home').length===2);strip?.remove()});
    const descriptions=['','',''];
    const description=head.querySelector('p');
    const syncStep=()=>{const active=[p1,p2,p3].findIndex(page=>page.classList.contains('active'))+1;steps.querySelectorAll('[data-step]').forEach(btn=>{if(Number(btn.dataset.step)===active)btn.setAttribute('aria-current','step');else btn.removeAttribute('aria-current')});if(description)description.textContent=descriptions[Math.max(0,active-1)]};
    const stepObserver=new MutationObserver(syncStep);[p1,p2,p3].forEach(page=>stepObserver.observe(page,{attributes:true,attributeFilter:['class']}));syncStep();

  }
  // v59: شريط التاريخ + عداد الدرجات مثبّتين أسفل الشاشة داخل "dock" واحد (لا ينزلان تحت الأزرار عند السكرول).
  const dockDate=document.getElementById('dateBannerCard'),dockScore=mainApp.querySelector('.scr-card');
  if(dockDate&&dockScore&&!document.getElementById('rfqHomeDock')){
    const dock=document.createElement('div');dock.id='rfqHomeDock';dock.className='rfq-home-dock';
    const editMsg=document.getElementById('editModeMsg');
    dockDate.parentNode.insertBefore(dock,editMsg&&editMsg.parentNode===dockDate.parentNode?editMsg:dockDate);
    [dockDate,dockScore].forEach(n=>dock.appendChild(n));
    // شريط "وضع التعديل" يظهر داخل صفحة الرفيق اليومي (مكان التعديل الفعلي) مش في الرئيسية.
    const dailySteps=document.querySelector('#dailyApp .daily-steps');
    if(editMsg){if(dailySteps)dailySteps.insertAdjacentElement('afterend',editMsg);else dock.insertBefore(editMsg,dockDate)}
    // شريط التاريخ في الرفيق اليومي (تحت أزرار 1 2 3): بيختفي بس أثناء وضع التعديل، ويحل مكانه شريط "وضع التعديل".
    if(dailySteps&&!document.getElementById('dailyDateBar')){
      const bar=document.createElement('div');bar.id='dailyDateBar';bar.className='date-banner';
      bar.innerHTML='<strong class="date-h" id="hDate2"></strong><span class="date-g" id="rDay2"></span>';
      (editMsg||dailySteps).insertAdjacentElement('afterend',bar);
      bar.querySelector('#hDate2').textContent=dockDate.querySelector('#hDate')?.textContent||'';
      bar.querySelector('#rDay2').textContent=dockDate.querySelector('#rDay')?.textContent||'';
    }
    // ارتفاع الـ dock يتحول لمتغير CSS ليبقى آخر صف أزرار ظاهر فوقه ولا يتغطى.
    const syncDock=()=>{const h=Math.ceil(dock.getBoundingClientRect().height);if(h>0)document.documentElement.style.setProperty('--rfq-dock-h',h+'px')};
    if('ResizeObserver' in window)new ResizeObserver(syncDock).observe(dock);
    syncDock();window.addEventListener('load',syncDock,{once:true});
  }
}
// Keep the computer dashboard still; restore normal scrolling on every other route.
if(mainApp){
  document.body.classList.toggle('rfq-home-static',mainApp.classList.contains('active'));
  const oldSwitch=window.shPg;
  if(typeof oldSwitch==='function'&&!window.__rfqHomeScrollBound){window.__rfqHomeScrollBound=true;window.shPg=function(id){const out=oldSwitch.apply(this,arguments);document.body.classList.toggle('rfq-home-static',id==='mainApp');return out}}
}
// Make the Quran surah index fast to search and easy to revisit.
function initQuranSurahFinder(){
  const list=document.getElementById('surahList'),wrap=document.getElementById('searchBarWrapper'),input=document.getElementById('searchInput'),count=document.getElementById('searchResultCount'),tabSearch=document.getElementById('tabSearch');
  if(!list||!wrap||!input||list.dataset.qfReady)return;
  list.dataset.qfReady='1';
  const FAV_KEY='rafiq_quran_surah_favorites_v1',RECENT_KEY='rafiq_quran_surah_recent_v1';
  const getNumbers=key=>{try{return JSON.parse(localStorage.getItem(key)||'[]').map(Number).filter(n=>n>=1&&n<=114)}catch(_){return[]}};
  const setNumbers=(key,values)=>{try{localStorage.setItem(key,JSON.stringify(values))}catch(_){}};
  const arabicDigits='0123456789',persianDigits='۰۱۲۳۴۵۶۷۸۹';
  const normalize=value=>String(value||'').replace(/[0-9]/g,c=>String(arabicDigits.indexOf(c))).replace(/[۰-۹]/g,c=>String(persianDigits.indexOf(c))).replace(/[\u064B-\u065F\u0670\u06D6-\u06DC]/g,'').replace(/ـ/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase().trim().replace(/^(سوره|surah|sura|chapter)\s*/,'');
  const aliases={1:['fatiha','fatihah','alfatiha','opening'],2:['baqarah','baqara','bakara','cow'],3:['alimran','aliimran','imran'],12:['yusuf','yousef','joseph'],18:['kahf','cave'],19:['maryam','mary'],20:['taha','ta-ha'],21:['anbiya','prophets'],36:['yasin','yaseen'],37:['saffat'],44:['dukhan'],48:['fath'],50:['qaf'],55:['rahman','arrahman'],56:['waqiah','waqia',' الواقعة'],67:['mulk','tabarak'],68:['qalam'],78:['naba','amma'],93:['duha'],94:['sharh','inshirah'],97:['qadr'],99:['zalzalah'],100:['adiyat'],101:['qariah'],102:['takathur'],103:['asr'],105:['fil'],106:['quraysh','quraish'],108:['kawthar','kauthar'],109:['kafirun'],110:['nasr'],111:['masad','lahab'],112:['ikhlas'],113:['falaq'],114:['nas']};
  let activeFilter='all',lastQuery='';
  const tools=document.createElement('section');tools.id='quranFinderTools';tools.setAttribute('aria-label','أدوات اختيار السورة');
  tools.innerHTML='<p class="qf-helper">ابحث باسم السورة أو رقمها، أو استخدم الاختصارات للوصول بسرعة.</p><div class="qf-filter-row" role="group" aria-label="تصفية السور"><button type="button" class="qf-chip" data-qf-filter="all" aria-pressed="true">كل السور <span class="qf-count" data-qf-count="all">114</span></button><button type="button" class="qf-chip" data-qf-filter="short" aria-pressed="false">قصار السور</button><button type="button" class="qf-chip" data-qf-filter="favorites" aria-pressed="false">المفضلة <span class="qf-count" data-qf-count="favorites">0</span></button><button type="button" class="qf-chip" data-qf-filter="recent" aria-pressed="false">آخر قراءة <span class="qf-count" data-qf-count="recent">0</span></button></div>';
  wrap.insertAdjacentElement('afterend',tools);wrap.classList.add('qf-persistent');input.placeholder='اكتب اسم السورة أو رقمها… مثل: البقرة أو الكهف أو 18';input.setAttribute('aria-label','ابحث عن سورة بالاسم أو الرقم');
  if(tabSearch)tabSearch.style.display='none';
  const noResults=document.createElement('div');noResults.className='qf-finder-empty';noResults.hidden=true;noResults.setAttribute('role','status');list.insertAdjacentElement('afterend',noResults);
  function cards(){return Array.from(list.querySelectorAll('.item-card[id^="surah-card-"]'))}
  function cardNum(card){return Number(card.id.replace('surah-card-',''))||0}
  function refreshCounts(){const fav=getNumbers(FAV_KEY),recent=getNumbers(RECENT_KEY);tools.querySelector('[data-qf-count="favorites"]').textContent=fav.length.toLocaleString('ar-EG-u-nu-latn');tools.querySelector('[data-qf-count="recent"]').textContent=recent.length.toLocaleString('ar-EG-u-nu-latn')}
  function applyFilters(reorder=false){
    const query=normalize(lastQuery),fav=getNumbers(FAV_KEY),recent=getNumbers(RECENT_KEY);let visible=0;
    const allCards=cards();
    for(const card of allCards){const num=cardNum(card),name=normalize(card.querySelector('b')?.textContent||'');const queryMatch=!query||name.includes(query)||String(num).includes(query)||(aliases[num]||[]).some(a=>normalize(a).includes(query));const categoryMatch=activeFilter==='all'||(activeFilter==='short'?num>=78:activeFilter==='favorites'?fav.includes(num):recent.includes(num));const show=queryMatch&&categoryMatch;card.classList.toggle('hidden',!show);if(show)visible++}
    if(reorder&&allCards.length){const ordered=activeFilter==='recent'?allCards.slice().sort((a,b)=>{const ai=recent.indexOf(cardNum(a)),bi=recent.indexOf(cardNum(b));return (ai<0?999:ai)-(bi<0?999:bi)}):allCards.slice().sort((a,b)=>cardNum(a)-cardNum(b));if(ordered.some((card,i)=>allCards[i]!==card))ordered.forEach(card=>list.appendChild(card))}
    refreshCounts();tools.querySelectorAll('[data-qf-filter]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.qfFilter===activeFilter)));
    if(count)count.textContent=query||activeFilter!=='all'?`${visible.toLocaleString('ar-EG-u-nu-latn')} سورة`:'';
    noResults.hidden=visible>0;
    if(!visible){noResults.textContent=activeFilter==='favorites'&&!fav.length?'لم تحفظ سورًا للمفضلة بعد — اضغط رمز النجمة على أي سورة.':activeFilter==='recent'&&!recent.length?'ستظهر هنا السور التي فتحتها مؤخرًا.':'لا توجد نتائج مطابقة — جرّب اسمًا أو رقمًا آخر.'}
  }
  window.filterSurahs=query=>{lastQuery=String(query||'');applyFilters()};
  window.clearSearch=()=>{input.value='';lastQuery='';applyFilters();input.focus()};
  input.addEventListener('input',()=>{lastQuery=input.value;applyFilters()});
  tools.querySelectorAll('[data-qf-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeFilter=btn.dataset.qfFilter;applyFilters(true)}));
  function enhance(){for(const card of cards()){if(card.dataset.qfEnhanced)continue;const num=cardNum(card);if(!num)continue;card.dataset.qfEnhanced='1';card.setAttribute('tabindex','0');card.setAttribute('role','button');card.setAttribute('aria-label',`السورة ${num}: ${card.querySelector('b')?.textContent||''}`);card.title='افتح السورة للقراءة';
      const favBtn=document.createElement('button');favBtn.type='button';favBtn.className='qf-favorite-btn';favBtn.dataset.surah=num;favBtn.setAttribute('aria-label','إضافة إلى المفضلة');favBtn.innerHTML='☆';const isFav=getNumbers(FAV_KEY).includes(num);favBtn.classList.toggle('is-favorite',isFav);favBtn.setAttribute('aria-pressed',String(isFav));if(isFav){favBtn.innerHTML='★';favBtn.setAttribute('aria-label','إزالة من المفضلة')}
      favBtn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();let listFav=getNumbers(FAV_KEY);listFav=listFav.includes(num)?listFav.filter(x=>x!==num):[...listFav,num].sort((a,b)=>a-b);setNumbers(FAV_KEY,listFav);const saved=listFav.includes(num);favBtn.classList.toggle('is-favorite',saved);favBtn.innerHTML=saved?'★':'☆';favBtn.setAttribute('aria-pressed',String(saved));favBtn.setAttribute('aria-label',saved?'إزالة من المفضلة':'إضافة إلى المفضلة');applyFilters()});card.appendChild(favBtn);
      const original=card.onclick;card.onclick=event=>{if(event.target.closest('.qf-favorite-btn'))return;let recent=getNumbers(RECENT_KEY).filter(x=>x!==num);recent.unshift(num);setNumbers(RECENT_KEY,recent.slice(0,8));applyFilters();if(typeof original==='function')return original.call(card,event)};
      card.addEventListener('keydown',event=>{if(event.target!==card)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();card.click()}});
    }applyFilters()}
  const listObserver=new MutationObserver(()=>enhance());listObserver.observe(list,{childList:true});enhance();
  function syncTab(){const surahsVisible=document.getElementById('surahList').style.display!=='none';wrap.style.display=surahsVisible?'flex':'none';tools.style.display=surahsVisible?'block':'none';noResults.style.display=surahsVisible&&!noResults.hidden?'block':'none';if(surahsVisible)applyFilters()}
  const tabObserver=new MutationObserver(syncTab);tabObserver.observe(list,{attributes:true,attributeFilter:['style']});const juz=document.getElementById('juzList');if(juz)tabObserver.observe(juz,{attributes:true,attributeFilter:['style']});syncTab();
}
if(document.getElementById('surahList'))initQuranSurahFinder();

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
