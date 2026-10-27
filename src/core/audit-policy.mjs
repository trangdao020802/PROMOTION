// Normalized rules from the agreed Audit workbook. No cached transaction
// result or collected amount supplies a price or a discount.
import {regularMonthlyPrice} from './monthly-price.mjs';
const text=x=>String(x??'').trim();
export function auditPriceFor(data,{course,hours,pkg,date,layer,cells,context}){
 const audit=data.policy.auditPolicy;
 if(!audit||!layer||!hours||/VTDH|vững tin/i.test([course,cells.J,cells.L].join(' '))||/weeks?|tuần/i.test(text(cells.J)))return null;
 const row=data.policy.roadmap.find(r=>r.A===`${layer}|${hours}|${pkg}`),key=`ATLS|${layer}|${hours}|${pkg}`;
 const base=audit.baseTuition.find(r=>r.A===key);
 const ref=r=>[{file:audit.sourceFile,sheet:'RULE',row:r.row}];
 const phase=date>=audit.q4From&&date<audit.q4To+1?'q4':date>=audit.octoberFrom&&date<audit.q4From?'october':date>=audit.newFrom&&date<audit.octoberFrom?'base':null;
 if((!base||base.row>=51)&&['ATLS','AGLS'].includes(text(context.group).toUpperCase())&&Number.isInteger(pkg)&&pkg>0&&pkg<=120){
  const monthly=regularMonthlyPrice(data,{course,hours:cells.I,group:context.group}),hasOffer=!!text(cells.L)&&text(cells.L)!=='0';
  const issue=!monthly?'CHECK - CHƯA CÓ ĐƠN GIÁ THÁNG CHƯA GIẢM HỢP LỆ':!Number.isFinite(date)?'CHECK - THIẾU NGÀY ÁP DỤNG GIÁ':date<audit.shortFrom||date>=audit.shortTo+1?'CHECK - GÓI LẺ NGOÀI KỲ GIÁ THAM CHIẾU':hasOffer?'CHECK - ƯU ĐÃI GÓI LẺ CẦN RULE RIÊNG':null;
  return {row,hours,pkg,layer,phase,short:true,issue,months:pkg,monthly:monthly?.monthly??null,gross:monthly?Math.round(monthly.monthly*pkg):null,discount:hasOffer?null:0,maxTerms:0,straight:0,loyalty:0,referral:0,refs:monthly?.refs??[]};
 }
 if(!base||!phase)return null;
 if(['q4','october'].includes(phase)&&(!/^ATLS\b/i.test(course)||text(context.group).toUpperCase()!=='ATLS'))return null;
 const september=phase==='base'&&/Big Bang Sep/i.test(text(cells.L));
 const prefix=phase==='q4'?'BBQ426_CASH':phase==='october'?'OCT26_BASE':september?'BBSEP26_CASH':null;
 const rule=prefix?audit.regimes.find(r=>r.K===`${prefix}|${layer}|${hours}|${pkg}`):null;
 if(prefix&&!rule)return null;
 const issue=date<( /^new$/i.test(text(context.contractType))?audit.newFrom:audit.currentFrom)?'CHECK - CHƯA ĐẾN NGÀY ÁP DỤNG GIÁ 2026':null;
 return {row,hours,pkg,layer,phase,issue,months:rule?.AK??(pkg==='36 SPLIT'?18:pkg),gross:rule?.AL??base.E,discount:rule?.Q??base.F,maxTerms:rule?.R??base.G??null,straight:rule?.AN??0,loyalty:rule?.AO??0,referral:rule?.AQ??0,refs:ref(rule??base)};
}
export const auditReferenceApplies=(data,date)=>{const c=data.policy?.auditPolicy?.coverage;return !!c&&date>=c.from&&date<c.to+1;};
export const toleranceFor=(data,date)=>({money:auditReferenceApplies(data,date)?data.policy.auditPolicy.moneyTolerance:1,hours:1});
export const voucherBasisFor=(data,date)=>auditReferenceApplies(data,date)?data.policy.auditPolicy.voucherPercentBasis:'after-discount';

export function auditPolicyChecks(data,cells,context,account,receipts=[]){
 const audit=data.policy.auditPolicy;if(!audit)return [];
 const checks=[],label=text(cells.L),normalize=s=>text(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
 for(const rule of audit.calendar){
  if(!(rule.AV&&rule.AV===cells.AL||rule.AW&&normalize(label).includes(normalize(rule.AW))))continue;
  const prefix=rule.BE==='CHECK'?'CHECK':'XÁC MINH';
  if(cells.D<rule.AX||cells.D>=rule.AY+1)checks.push(`${prefix} - THỜI KỲ CHÍNH SÁCH ${rule.AU}: ngoài ngày áp dụng trong RULE dòng ${rule.row}.`);
  if(rule.BB===1&&text(context.group).toUpperCase()!=='ATLS')checks.push(`CHECK - ${rule.AU} CHỈ ÁP DỤNG ATLS`);
  const installment=/installment/i.test(text(context.method));
  if(rule.BA==='INSTALLMENT'&&!installment)checks.push(`CHECK - ${rule.AU} YÊU CẦU THANH TOÁN TRẢ GÓP`);
  if(rule.BA==='DIRECT'&&installment)checks.push(`CHECK - ${rule.AU} YÊU CẦU TRẢ THẲNG`);
  if(rule.AZ>0){
   const days=receipts.filter(r=>r.verified&&r.amount>0).map(r=>Math.floor(r.date));
   const deposit=days.length?Math.min(...days):null,target=account.paid?.target??account.snapshot?.target;
   let balance=0,full=null;
   const byDay=new Map();for(const e of account.events??[]){if(e.invoiceBacked){const day=Math.floor(e.date);byDay.set(day,(byDay.get(day)??0)+e.amount);}}
   for(const [day,amount]of [...byDay].sort((a,b)=>a[0]-b[0])){const before=balance;balance+=amount;if(!(target>0)||balance<target-1)full=null;else if(before<target-1)full=day;}
   const special=/^new$/i.test(text(context.contractType))&&deposit>=46268&&deposit<=46271,maxDays=special?60:rule.AZ;
   if(deposit===null||full===null)checks.push(`XÁC MINH - THỜI HẠN FULL ${rule.AU}: cần ngày cọc và ngày đóng đủ để kiểm tra ${maxDays} ngày.`);
   else if(full-deposit>maxDays)checks.push(`CHECK - ${rule.AU} VƯỢT HẠN CỌC → FULL ${maxDays} NGÀY`);
  }
 }
 return [...new Set(checks)];
}

// The agreed Audit explicitly maps a 36/36 siblings offer to the split
// schedule. The original Package text stays visible; sibling approval is still
// required before confirming its course hours/eligibility.
export function auditPackageKey(value,label,date,base,audit){
 if(!audit||typeof base==='string'&&base.endsWith('SPLIT'))return base;
 const input=text(value),offer=text(label),q4=date>=audit.octoberFrom&&date<audit.q4To+1||/Q4|Quý 4|From 06\/10|6\.10/i.test(offer);
 if(q4&&(/chia đôi/i.test(offer)||/siblings/i.test(input)||/36\/36/.test(offer)))return /36\/36/.test(offer)||/36\s*(?:months?|tháng)/i.test(offer+' '+input)?'36 SPLIT':'18 SPLIT';
 if(!q4&&(/chia đôi/i.test(offer)||/siblings/i.test(input)))return '36 SPLIT';
 return base;
}
