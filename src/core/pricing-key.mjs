// Human spelling is not a financial key. Extract only explicit identity facts;
// never infer a layer, product or duration from an invoice amount.
export const priceText=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[–—_]/g,' ').replace(/\s+/g,' ').trim();
const single=values=>{const distinct=[...new Set(values)];return distinct.length===1?distinct[0]:null;};
export function weeklyHours(value){const s=priceText(value);if(/^\d+(?:[.,]\d+)?$/.test(s))return Number(s.replace(',','.'));return single([...s.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(?:hrs?|hours?|gio|h)\s*(?:\/|per|moi)\s*(?:week|tuan)\b/g)].map(m=>Number(m[1].replace(',','.'))));}
export function packageIdentity(value){
 const s=priceText(value),n=/^(\d+(?:[.,]\d+)?)\s*(?:months?|thang|t)(?:\b|$)/.exec(s),months=n?Number(n[1].replace(',','.')):null;
 if(/\b(?:weeks?|tuan)\b/.test(s)){const w=Number(/^(\d+)\s*(?:weeks?|tuan)/.exec(s)?.[1]);return {months:w>0?w/(25/6):null,key:w>0?w+' WEEKS':null,variant:'weekly'};}
 if(/\bsplit\b|chia doi|siblings?/.test(s)){
  const total=/^(18|24|36)\s+split$/.exec(s)?.[1];
  return {months:total?Number(total)/2:months,key:total?`${total} SPLIT`:months?`${months*2} SPLIT`:null,variant:'split'};
 }
 return {months,key:months,variant:/s26|summer|combo he/.test(s)?'summer':/upsell|upgrade|nang cap/.test(s)?'upgrade':/trai nghiem|trial/.test(s)?'trial':'standard'};
}
export function pricingIdentity(course,hours,pkg,context={}){
 const s=priceText(course),p=packageIdentity(pkg),years=[...new Set(s.match(/\b20\d{2}\b/g)??[])],layers=[...s.matchAll(/\b(?:layer|l)\s*[-:]?\s*([123])\b/g)].map(m=>Number(m[1]));
 const families=[...s.matchAll(/\b(atls|agls|ielts|ahp|premium)\b/g)].map(m=>m[1].toUpperCase()),family=single(families)??(families.length&&families.every(f=>['ATLS','AGLS'].includes(f))?'ATLS':!families.length?String(context.group??'').toUpperCase():null);
 const ahp=/\bahp\b|apollo\s*@\s*home/.test(s),vtdh=/\bvtdh\b|vung tin dong hanh/.test(s)||/\bvtdh\b|vung tin dong hanh/.test(priceText(pkg))&&!/vtdh[ -]*full/.test(priceText(pkg));
 const variant=ahp?'ahp':vtdh?'vtdh':family==='IELTS'?'ielts':family==='PREMIUM'?'premium':p.variant;
 if(variant==='premium'){const size=/\bgroup\s*:?\s*0?([125])(?:\s*[-–]\s*0?([48]))?\s*(?:persons?|people|hv)/.exec(s);if(size&&p.months===4.5)p.key=(size[1]+(size[2]?'-'+size[2]:''))+'|4.5M';}
 const year=years.length===1?Number(years[0]):null,layer=ahp?2:single(layers),weekly=weeklyHours(hours);
 const conflicts=[];if(years.length>1)conflicts.push('nhiều năm giá');if(new Set(layers).size>1&&!ahp)conflicts.push('nhiều layer');if(new Set(families).size>1&&!ahp&&!families.every(f=>['ATLS','AGLS'].includes(f)))conflicts.push('nhiều chương trình');
 const courseHours=weeklyHours(course),namedMonths=/(\d+)\s*thang\s*\(\s*dong\s*1\s*lan\s*\)/.exec(s);
 if(courseHours&&weekly&&courseHours!==weekly)conflicts.push('giờ trong Course Fee khác Hour/week');
 if(namedMonths&&p.months&&Number(namedMonths[1])!==p.months)conflicts.push('số tháng trong Course Fee khác Package');
 return {group:ahp?'AHP':family,family:ahp?'ATLS':family,year,layer,hours:weekly,months:p.months,packageKey:p.key,variant,conflicts,
  key:[ahp?'AHP':family??'?',year??'?',layer??'?',weekly??'?',variant,p.key??'?'].join('|')};
}
export function canonicalCourseName(identity){return ['ATLS','AGLS','AHP'].includes(identity.group)&&identity.year&&identity.layer?`ATLS - New Price ${identity.year} - Layer ${identity.layer}`:null;}
