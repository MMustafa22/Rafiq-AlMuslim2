/* Rafiq: رسائل إيجابية يومية — دورة لطيفة من 7 أيام */
(()=>{
  'use strict';
  const DATE_KEY='rfq_daily_message_date', INDEX_KEY='rfq_daily_message_index';
  const messages=[
    '🌿 خطوة صغيرة بنية صادقة… قد تفتح لك أبوابًا كبيرة من الخير. بارك الله في يومك.',
    '🤍 خذ يومك برفق؛ كل آية تقرؤها وكل ذكر تقوله نورٌ يضاف إلى قلبك.',
    '🌤️ لا تستصغر ما تفعله اليوم، فالثبات الجميل أحب الأعمال وإن قلّت.',
    '🕌 صلاتك موعد راحة وطمأنينة؛ اقترب منها بقلبك، وستجد فيها ما يسكّن روحك.',
    '📖 افتح للقرآن دقائق من يومك، فالقليل المستمر يصنع أثرًا عظيمًا مع الوقت.',
    '✨ أنت تتقدم ولو ببطء. احمد الله على كل محاولة، وابدأ من جديد بلا لوم.',
    '🌸 اجعل الرفق نيتك اليوم: بنفسك وبمن حولك، فالكلمة الطيبة عبادة وأثرها لا يضيع.'
  ];
  const pad=n=>String(n).padStart(2,'0');
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
  const dayNumber=date=>{const p=date.split('-').map(Number);return Math.floor((Date.UTC(p[0],p[1]-1,p[2])-Date.UTC(2024,0,1))/86400000)};
  const quiet=()=>{try{let s=null;const api=window.__rmSettingsAPI;if(api&&typeof api.getNotif==='function')s=api.getNotif();if(!s)s=JSON.parse(localStorage.getItem('rafiq_notif_settings')||'null');if(!s||s.quietEnabled!==true)return false;const now=new Date(),m=now.getHours()*60+now.getMinutes(),parse=v=>{const x=/^(\d{1,2}):(\d{2})$/.exec(v||'');return x?Number(x[1])*60+Number(x[2]):null},a=parse(s.quietStart||'23:30'),b=parse(s.quietEnd||'05:00');return a!==null&&b!==null&&a!==b&&(a<b?m>=a&&m<b:m>=a||m<b)}catch(_){return false}};
  const show=()=>{const date=today();try{if(localStorage.getItem(DATE_KEY)===date||quiet())return;const index=((dayNumber(date)%7)+7)%7;localStorage.setItem(DATE_KEY,date);localStorage.setItem(INDEX_KEY,String(index));const msg=messages[index];if(typeof window.toast==='function')window.toast(msg);else{const el=document.createElement('div');el.className='rfq-daily-toast';el.setAttribute('role','status');el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),5200)}}catch(e){console.warn('[Rafiq daily notification]',e)}};
  const init=()=>{if(!document.body)return;if(!document.getElementById('rfq-daily-notification-style')){const st=document.createElement('style');st.id='rfq-daily-notification-style';st.textContent='.rfq-daily-toast{position:fixed;z-index:2147483000;inset-inline:14px;bottom:20px;margin:auto;max-width:560px;padding:14px 18px;border:1px solid rgba(212,175,55,.55);border-radius:16px;background:linear-gradient(135deg,rgba(20,42,48,.98),rgba(15,23,42,.98));box-shadow:0 14px 36px rgba(0,0,0,.28);color:#fff8df;text-align:center;font:700 1rem/1.7 Tajawal,Arial,sans-serif;animation:rfqDailyIn .35s ease-out}@keyframes rfqDailyIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}html[data-rafiq-theme="light"] .rfq-daily-toast{background:linear-gradient(135deg,#fffdf8,#fff3c4);border-color:rgba(163,120,19,.42);color:#453515;box-shadow:0 14px 30px rgba(120,88,23,.18)}';document.head.appendChild(st)}setTimeout(show,1200)};
  window.rafiqDailyEncouragement={show,messages:messages.slice()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
