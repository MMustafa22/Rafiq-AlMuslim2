
/* قائمة أذكار السبحة (مقصورة على ما له تسجيل صوتي في audio/tasbih) */
(function(){var L=[["subhanallah","سبحان الله"],["alhamdulillah","الحمد لله"],["la_ilaha_illallah","لا إله إلا الله"],["allahu_akbar","الله أكبر"],["astaghfirullah","أستغفر الله"],["salah_annabi","اللهم صل على محمد"],["la_hawla","لا حول ولا قوة إلا بالله"],["la_ilaha_illallah_wahdahu","لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير"]];
function sel(){return document.getElementById("tasbihDhikrSelect")}
function sync(){var s=sel();if(!s)return;try{var st=getTasbihState();var k=st&&st.dhikrKey;s.value=L.some(function(x){return x[0]===k})?k:""}catch(e){}}
function build(){var w=document.querySelector(".tasbih-select-wrap");if(!w||sel())return;var s=document.createElement("select");s.id="tasbihDhikrSelect";s.className="tasbih-select";s.style.marginTop="8px";s.setAttribute("aria-label","اختيار الذكر");s.innerHTML='<option value="">📿 اختر الذكر…</option>'+L.map(function(x,i){return'<option value="'+x[0]+'">'+(x[1].length>48?x[1].slice(0,46)+"…":x[1])+"</option>"}).join("");s.onchange=function(){var f=L.filter(function(x){return x[0]===s.value})[0];if(f)tasbihSetDhikr(f[1],f[0],null)};w.appendChild(s);sync()}
new MutationObserver(build).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener("DOMContentLoaded",build);
if(typeof tasbihRenderUI==="function"){var _r=tasbihRenderUI;tasbihRenderUI=function(st){var o=_r.apply(this,arguments);sync();return o}}
})();
