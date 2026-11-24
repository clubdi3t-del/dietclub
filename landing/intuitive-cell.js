// خلية "الأكل الحدسي" في قائمة المشتركين: حلقة التقدم + أعمدة آخر 14 يوم
// الاستخدام: td.innerHTML = intuitiveCell({day:13, status:"alert"|"stop"|"done"|"ok", last14:[8,0,7,...]})
// last14 = درجة التطبيق (1-10) لآخر 14 يوم بالترتيب، 0 = ما سوّى التمرين
function intuitiveCell(u){
  if(!u||!u.day)return '<span style="color:#cbd5e1">—</span>';
  const C={ok:"#22c55e",alert:"#f59e0b",stop:"#ef4444",done:"#6d4fd8"}[u.status||"ok"];
  const r=15,L=2*Math.PI*r,p=Math.min(u.day,30)/30;
  const ring=`<svg width="38" height="38" viewBox="0 0 38 38"><circle cx="19" cy="19" r="${r}" fill="none" stroke="#eef0f5" stroke-width="4"/>
   <circle cx="19" cy="19" r="${r}" fill="none" stroke="${C}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${L*p} ${L}" transform="rotate(-90 19 19)"/>
   <text x="19" y="23" text-anchor="middle" font-size="11" font-weight="800" fill="#1f2937">${u.day}</text></svg>`;
  const d=(u.last14||[]).slice(-14),bars=d.map((v,i)=>{const h=v?4+v*2.2:3;return `<rect x="${(13-i)*6}" y="${26-h}" width="4" height="${h}" rx="1.5" fill="${v?(v>=7?"#6d4fd8":v>=4?"#a99cf0":"#d6d0fa"):"#fca5a5"}"/>`}).join("");
  const done=d.filter(Boolean).length;
  return `<span title="اليوم ${u.day}/30 • أنجز ${done} من آخر ${d.length} يوم" style="display:inline-flex;align-items:center;gap:8px;direction:rtl">${ring}<svg width="84" height="26" viewBox="0 0 84 26">${bars}</svg></span>`;
}
