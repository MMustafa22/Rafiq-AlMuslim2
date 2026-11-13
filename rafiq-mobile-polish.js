(function(){
  'use strict';
  var STYLE_ID='rfq-mobile-polish-style';
  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    var s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
      /* رفيق المسلم — واجهة موبايل خفيفة وواضحة */
      html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
      .rm-modal{z-index:100001!important}
      .rm-notif-slim .rm-modal-content{max-width:560px!important;padding:18px 16px 22px!important}
      .rm-notif-slim .rm-modal-title{margin-bottom:5px!important}
      .rfq-notif-lead{color:#cbd5e1;font-size:13px;line-height:1.7;margin:0 0 14px}
      .rfq-notif-status{display:flex;align-items:flex-start;gap:9px;padding:11px 12px;border-radius:13px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);color:#d1fae5;font-size:12px;line-height:1.7;margin:10px 0 14px}
      .rfq-notif-status.warn{background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.28);color:#fde68a}
      .rfq-notif-group{border:1px solid rgba(255,255,255,.1);background:rgba(15,23,42,.52);border-radius:15px;padding:12px;margin:10px 0}
      .rfq-notif-group h3{font-size:14px;color:#fbbf24;margin:0 0 8px}
      .rfq-notif-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.07)}
      .rfq-notif-row:last-child{border-bottom:0;padding-bottom:0}
      .rfq-notif-row:first-of-type{padding-top:2px}
      .rfq-notif-copy{font-size:13px;line-height:1.5;color:#f8fafc}
      .rfq-notif-copy small{display:block;color:#94a3b8;font-size:11px;margin-top:2px}
      .rfq-notif-switch{flex:0 0 auto;position:relative;width:48px;height:28px;border:0;border-radius:999px;background:#334155;cursor:pointer;transition:.2s}
      .rfq-notif-switch:after{content:'';position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:#e2e8f0;transition:.2s}
      .rfq-notif-switch.active{background:#10b981}.rfq-notif-switch.active:after{right:24px;background:#fff}
      .rfq-notif-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
      .rfq-notif-actions .rm-btn{min-height:44px}
      .rfq-notif-footer{display:flex;gap:8px;margin-top:10px}.rfq-notif-footer>*{flex:1}
      .rfq-notif-slim input[type=number]{font-size:16px!important}
      @media(max-width:520px){
        .container:not(#mainApp){padding:10px 10px 86px!important}
        .op-i,.chk{min-height:48px!important;padding:13px 14px!important}
        .sec-nm{font-size:1rem!important}
        .rfq-notif-slim .rm-modal-content{width:calc(100vw - 16px)!important;max-height:calc(100dvh - 16px)!important;padding:16px 12px 18px!important}
        .rfq-notif-group{padding:10px;margin:8px 0}
        .rfq-notif-copy{font-size:12px}.rfq-notif-copy small{font-size:10px}
        .rfq-notif-actions{grid-template-columns:1fr 1fr}
      }
      /* ===== تمرير سلس على الموبايل ===== */
      @media(max-width:899px){
        html,body{height:auto!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch;overscroll-behavior-y:auto!important;touch-action:pan-y}
      }
    `;
    document.head.appendChild(s);
  }
  function enabled(n,key,def){return n[key]===undefined?def:!!n[key]}
  function buildSlimNotifications(){
    if(!window.RafiqMuslim||typeof window.RafiqMuslim.getState!=='function') return false;
    var api=window.RafiqMuslim, st=api.getState(), n=st.settings.notifSettings;
    var old=document.getElementById('rm-notif-modal'); if(old) old.remove();
    var modal=document.createElement('div'); modal.id='rm-notif-modal'; modal.className='rm-modal rm-notif-slim';
    function sw(key,def){return '<button type="button" class="rfq-notif-switch '+(enabled(n,key,def)?'active':'')+'" data-key="'+key+'" aria-label="تبديل"></button>'}
    modal.innerHTML='<div class="rm-modal-content">'+
      '<button class="rm-modal-close" type="button" aria-label="إغلاق">×</button>'+ 
      '<h2 class="rm-modal-title">🔔 تنبيهات الصلاة</h2>'+ 
      '<p class="rfq-notif-lead">اختار التنبيهات التي تحتاجها فقط. التعديلات تُحفظ على جهازك وتُطبّق على مواقيتك الحالية.</p>'+ 
      '<div id="rfq-notif-status" class="rfq-notif-status"><span>⏳</span><span>جارٍ فحص دعم التنبيهات…</span></div>'+ 
      '<section class="rfq-notif-group"><h3>🕌 تنبيه الصلاة</h3>'+ 
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">الأذان عند دخول الوقت<small>يعمل داخل التطبيق، وقد يطلب المتصفح إذن الصوت.</small></div>'+sw('azanEnabled',true)+'</div>'+ 
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">صوت الأذان الكامل<small>أوقفه إذا كنت تفضّل إشعارًا صامتًا.</small></div>'+sw('azanSoundEnabled',true)+'</div>'+ 
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">إشعار قبل الأذان<small>تذكير مختصر قبل وقت الصلاة.</small></div><input id="rfq-pre-min" class="rm-input" type="number" min="0" max="60" step="5" value="'+(n.preAzanMinutes||0)+'" style="width:78px;text-align:center"></div>'+ 
      '</section>'+ 
      '<section class="rfq-notif-group"><h3>📢 عداد الإقامة</h3>'+
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">بعد الأذان الكامل بـ<small>يبدأ العداد بعد انتهاء صوت الأذان، ثم يُشغّل صوت الإقامة المختصر من «حي على الصلاة».</small></div><input id="rfq-iqama-delay" class="rm-input" type="number" min="1" max="120" step="1" value="'+(n.iqamaDelayMinutes||15)+'" style="width:78px;text-align:center"><span style="color:#94a3b8;font-size:11px">دقيقة</span></div>'+
      '</section>'+ 
            '<section class="rfq-notif-group"><h3>🌙 الوضع الهادئ</h3>'+ 
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">الوضع الهادئ (مُفعّل افتراضيًا)<small>يصمت الإقامة والاستعداد للأذان والأذكار وقراءة القرآن والذكر الدوري، ويُبقي الأذان وحده.</small></div>'+sw('quietEnabled',true)+'</div>'+
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">إبقاء الأذان في البوابة الليلية<small>البوابة الليلية من ٢٣:٣٠ حتى ٠٥:٠٠ تُصمت كل شيء ما عدا الأذان.</small></div>'+sw('quietKeepAzan',true)+'</div>'+
      '</section>'+ 
      '<section class="rfq-notif-group"><h3>🔁 قائمة التكرار</h3>'+ 
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">📢 الإقامة<small>بعد انتهاء الأذان — مع كل صلاة.</small></div><span style="color:#94a3b8;font-size:11px;white-space:nowrap">مُصمت</span></div>'+
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">⏳ الاستعداد للأذان<small>قبل دخول الوقت بـ ١٥ دقيقة.</small></div><span style="color:#94a3b8;font-size:11px;white-space:nowrap">مُصمت</span></div>'+
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">📿 الأذكار وتلاوة القرآن<small>الصباح والمساء والنوم، وقراءة القرآن ٢٠:٠٠.</small></div><span style="color:#94a3b8;font-size:11px;white-space:nowrap">مُصمت</span></div>'+
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">📿 الذكر الدوري<small>كل ساعة من ٧:٠٠ حتى ٢٢:٠٠.</small></div><span style="color:#94a3b8;font-size:11px;white-space:nowrap">مُصمت</span></div>'+
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">🕌 الأذان<small>عند دخول وقت الصلاة.</small></div><span style="color:#34d399;font-size:11px;white-space:nowrap">يبقى دائمًا</span></div>'+
      '</section>'+ 
'<section class="rfq-notif-group"><h3>📱 إشعارات الجهاز</h3>'+ 
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">التنبيهات خارج التطبيق<small>فعّلها من هنا ثم اسمح للمتصفح عند الطلب.</small></div>'+sw('desktopNotifEnabled',true)+'</div>'+ 
        '<div class="rfq-notif-row"><div class="rfq-notif-copy">تذكير الأذكار<small>الصباح والمساء والنوم.</small></div>'+sw('athkarNotificationsEnabled',true)+'</div>'+ 
      '</section>'+ 
      '<section class="rfq-notif-group"><h3>🔊 الصوت</h3><div class="rfq-notif-row"><div class="rfq-notif-copy">مستوى الصوت</div><input id="rfq-notif-volume" type="range" min="0" max="100" value="'+Math.round((st.settings.notifVolume==null?.8:st.settings.notifVolume)*100)+'" style="width:145px"></div></section>'+ 
      '<div class="rfq-notif-actions"><button type="button" class="rm-btn" id="rfq-test-notif">🔔 اختبار التنبيه</button><button type="button" class="rm-btn" id="rfq-permission">🔐 السماح بالتنبيهات</button></div>'+ 
      '<div class="rfq-notif-footer"><button type="button" class="rm-btn rm-btn-success" id="rfq-save-notif">💾 حفظ</button><button type="button" class="rm-btn" id="rfq-cancel-notif">إلغاء</button></div>'+ 
      '</div>';
    document.body.appendChild(modal);
    function setStatus(msg,warn){var el=modal.querySelector('#rfq-notif-status');el.classList.toggle('warn',!!warn);el.innerHTML='<span>'+(warn?'⚠️':'✅')+'</span><span>'+msg+'</span>'}
    modal.querySelector('.rm-modal-close').onclick=close; modal.querySelector('#rfq-cancel-notif').onclick=close;
    modal.querySelectorAll('[data-key]').forEach(function(b){b.onclick=function(){var key=b.dataset.key;n[key]=!enabled(n,key,true);b.classList.toggle('active',n[key]);if((key==='desktopNotifEnabled'||key==='athkarNotificationsEnabled')&&n[key]&&typeof Notification!=='undefined'&&Notification.requestPermission)Notification.requestPermission().then(function(){}).catch(function(){});}});
    modal.querySelector('#rfq-permission').onclick=function(){if(typeof Notification==='undefined'){setStatus('هذا المتصفح لا يدعم إشعارات النظام.',true);return;}Notification.requestPermission().then(function(x){setStatus(x==='granted'?'تم السماح بالتنبيهات.':'لم يتم السماح — يمكنك تعديل ذلك من إعدادات المتصفح.',x!=='granted');}).catch(function(){setStatus('تعذّر طلب الإذن من المتصفح.',true)});};
    modal.querySelector('#rfq-test-notif').onclick=function(){if(typeof api.testSWNotif==='function')api.testSWNotif().then(function(ok){setStatus(ok?'وصل اختبار التنبيه إلى النظام.':'تعذّر الاختبار؛ راجع إذن المتصفح.',!ok)});else if(typeof api.testNotif==='function')api.testNotif();};
    modal.querySelector('#rfq-save-notif').onclick=function(){n.preAzanMinutes=Math.max(0,Math.min(60,parseInt(modal.querySelector('#rfq-pre-min').value)||0));n.iqamaDelayMinutes=Math.max(1,Math.min(120,parseInt(modal.querySelector('#rfq-iqama-delay').value)||15));st.settings.notifVolume=(parseInt(modal.querySelector('#rfq-notif-volume').value)||0)/100;try{localStorage.setItem('rm_pq_notif_settings',JSON.stringify(n));localStorage.setItem('rm_pq_notif_volume',String(st.settings.notifVolume))}catch(e){}if(typeof api.sendSettingsToSW==='function')api.sendSettingsToSW();if(typeof api.armSmartPrayerGuardian==='function')api.armSmartPrayerGuardian('mobile-save');if(typeof api.showInAppToast==='function')api.showInAppToast('✅ تم الحفظ','تم حفظ إعدادات التنبيهات بنجاح','🔔');close();};
    function close(){modal.classList.remove('show');setTimeout(function(){if(modal.parentNode)modal.remove()},220)}
    requestAnimationFrame(function(){modal.classList.add('show');var secure=window.isSecureContext, has='Notification' in window;setStatus(has&&secure?'التنبيهات جاهزة. يمكنك اختبارها قبل الحفظ.':'التنبيهات تحتاج HTTPS ومتصفحًا يدعم إشعارات النظام.',!(has&&secure));});
    return true;
  }
  function install(){injectStyle();if(!window.RafiqMuslim||!window.RafiqMuslim.openNotifModal){setTimeout(install,80);return}window.RafiqMuslim.openNotifModal=buildSlimNotifications;}
  function releaseScrollLock(){
    try{
      if(document.documentElement.style.overflow==='hidden')document.documentElement.style.overflow='';
      if(document.body.style.overflow!=='hidden')return;
      var open=document.querySelector('.suc-mdl.show,.rm-modal.show');
      if(open&&getComputedStyle(open).display!=='none')return;
      document.body.style.overflow='';
    }catch(e){}
  }
  releaseScrollLock();
  setTimeout(releaseScrollLock,1500);setTimeout(releaseScrollLock,3000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)releaseScrollLock()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
