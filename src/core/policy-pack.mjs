import {pricingIdentity,priceText} from './pricing-key.mjs';
import {dateSerial} from './verification.mjs';
const num=n=>typeof n==='number'&&Number.isFinite(n);
const day=d=>typeof d==='number'?d:dateSerial(d);
export const POLICY_SCHEMA='apollo-price-policy/v1';
const variants=['standard','trial','vtdh','ahp','split','summer','upgrade','ielts','premium','weekly'];
export const policyRowKey=r=>[r.group,r.year,r.layer,r.hours,r.variant,r.packageKey??r.months,r.from,r.to,r.center??'*',r.contractType??'*'].join('|');
export function stagePolicyUpdate(current,incoming){
 const iso=d=>new Date(Date.UTC(1899,11,30)+d*86400000).toISOString().slice(0,10);
 let rows=current.map(r=>({...r}));
 const key=r=>[r.group,r.year,r.layer,r.hours,r.variant,r.packageKey??r.months,r.center??'*',r.contractType??'*'].join('|');
 for(const next of incoming){
  rows=rows.flatMap(old=>{if(key(old)!==key(next)||day(old.to)<day(next.from)||day(old.from)>day(next.to))return [old];
   return [...(day(old.from)<day(next.from)?[{...old,to:iso(day(next.from)-1)}]:[]),...(day(old.to)>day(next.to)?[{...old,from:iso(day(next.to)+1)}]:[])];});
  rows.push(next);
 }
 return rows;
}
export function validatePolicyRows(rows){
 const errors=[];if(!Array.isArray(rows)||!rows.length||rows.length>4000)return ['Bộ chính sách cần 1–4.000 dòng giá.'];
 for(const [i,r]of rows.entries()){
  const e=[],scope=r&&typeof r==='object'?r:{};
  if(!['ATLS','AGLS','AHP','IELTS','PREMIUM','ATLS/AGLS'].includes(scope.group))e.push('chương trình');
  if(!Number.isInteger(scope.year)||scope.year<2023||scope.year>2100)e.push('năm');
  if(![1,2,3].includes(scope.layer)&&!(scope.layer===0&&['weekly','premium'].includes(scope.variant)))e.push('layer');
  if(!num(scope.hours)||scope.hours<=0||scope.hours>40)e.push('giờ/tuần');
  if(!variants.includes(scope.variant))e.push('loại gói');
  const weeks=scope.weeks??Number(/^(\d+(?:\.\d+)?) WEEKS$/.exec(String(scope.packageKey))?.[1]);
  if(scope.variant==='weekly'?!(num(weeks)&&weeks>0&&weeks<=520):!num(scope.months)||scope.months<=0||scope.months>120)e.push(scope.variant==='weekly'?'số tuần':'số tháng');
  const summerKey=/^(?:S\d{2}(?:-\d+)?|SUMMER)\|(\d+(?:\.\d+)?)M$/.exec(String(scope.packageKey??''));
  if(scope.variant==='summer'&&(!summerKey||Number(summerKey[1])!==scope.months))e.push('mã phiên bản hè (ví dụ S26-2|12M) khớp số tháng');
  if(!num(scope.gross)||scope.gross<=0||scope.gross>1e10)e.push('giá gốc');
  if(!num(scope.discount)||scope.discount<0||scope.discount>scope.gross)e.push('giảm tiền');
  if(scope.variant!=='weekly'&&scope.monthly!=null&&(!num(scope.monthly)||Math.abs(scope.monthly*scope.months-scope.gross)>1))e.push('giá tháng × tháng khác giá gốc');
  if(!Number.isInteger(scope.maxTerms)||scope.maxTerms<0||scope.maxTerms>36)e.push('kỳ trả góp');
  for(const k of ['straight','loyalty','referral'])if(!num(scope[k])||scope[k]<0||scope[k]>12)e.push(k+' (tháng tặng)');
  const a=day(scope.from),b=day(scope.to);if(a===null||b===null||!Number.isFinite(a)||!Number.isFinite(b)||b<a)e.push('ngày hiệu lực');
  if(!String(scope.source??'').trim()||!String(scope.approval??'').trim())e.push('nguồn / căn cứ duyệt');
  if(scope.course){const c=pricingIdentity(scope.course,scope.hours,scope.months+' months',{group:scope.group});if(c.conflicts.length)e.push(...c.conflicts);if(c.year&&c.year!==scope.year)e.push('năm trong Course Fee khác cột năm');if(c.layer&&c.layer!==scope.layer)e.push('layer trong Course Fee khác cột layer');}
  if(scope.discountLabels!=null&&(!Array.isArray(scope.discountLabels)||scope.discountLabels.some(s=>typeof s!=='string'||s.length>500)))e.push('nhãn Discount');
  if(e.length)errors.push(`Dòng ${i+1}: thiếu/sai ${e.join(', ')}.`);
 }
 const seen=new Set();for(const [i,r]of rows.entries()){const k=policyRowKey(r);if(seen.has(k))errors.push(`Dòng ${i+1}: trùng khóa và phạm vi hiệu lực.`);seen.add(k);}
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  const a=rows[i],b=rows[j],base=r=>[r.year,r.layer,r.hours,r.variant,r.packageKey??r.months].join('|');
  const overlap=(x,y)=>!x||x==='*'||!y||y==='*'||priceText(x)===priceText(y);
  const shared=(a.group===b.group||a.group==='ATLS/AGLS'&&['ATLS','AGLS'].includes(b.group)||b.group==='ATLS/AGLS'&&['ATLS','AGLS'].includes(a.group));
  if(shared&&base(a)===base(b)&&overlap(a.center,b.center)&&overlap(a.contractType,b.contractType)&&day(a.from)<=day(b.to)&&day(b.from)<=day(a.to)&&policyRowKey(a)!==policyRowKey(b))errors.push(`Dòng ${i+1} và ${j+1}: chồng lấn thời kỳ/phạm vi. Chia ngày hoặc chọn đúng center/đối tượng.`);
 }
 return [...new Set(errors)];
}
export function mergePolicyPack(base,pack){return {...base,typedPrices:[...(base.typedPrices??[]),...(pack?.rows??[]).map(r=>({...r,override:true,revision:pack.id,revisionTitle:pack.title}))],policyRevision:pack?.id??'published'};}
export function matchTypedPrice(policy,identity,date,context={}){
 const candidates=(policy.typedPrices??[]).filter(r=>r.year===identity.year&&(r.layer===identity.layer||r.layer===0&&['weekly','premium'].includes(identity.variant))&&r.hours===identity.hours&&r.variant===identity.variant&&String(r.packageKey??r.months)===String(identity.packageKey)&&
  (r.group===identity.group||r.group==='ATLS/AGLS'&&['ATLS','AGLS'].includes(identity.group))&&day(r.from)<=date&&date<day(r.to)+1&&
  (!r.center||r.center==='*'||priceText(r.center)===priceText(context.center))&&(!r.contractType||r.contractType==='*'||priceText(r.contractType)===priceText(context.contractType)));
 const rows=candidates.some(r=>r.override)?candidates.filter(r=>r.override):candidates;
 if(!rows.length)return null;
 if(rows.length!==1)return {gross:null,discount:null,issue:'CHECK - NHIỀU RULE CÙNG KHÓA / THỜI KỲ: '+identity.key,refs:rows.flatMap(r=>r.refs??[]),identity};
 const r=rows[0];
 if(r.variant==='weekly'&&/^new$/i.test(context.contractType??''))return {...r,gross:null,discount:null,identity,refs:r.refs??[],issue:'CHECK - GIÁ TUẦN CHỈ DÀNH CHO HỌC VIÊN CURRENT'};
 if(r.billingScope==='class'&&r.groupMin>1)return {...r,gross:null,discount:null,identity,refs:r.refs??[],issue:'CHECK - PREMIUM: giá nguồn là cho cả lớp '+r.groupMin+'–'+r.groupMax+' học viên. Bổ sung sĩ số và giá phân bổ cho một học viên; không lấy cả học phí lớp làm học phí của một CT.'};
 return {...r,pkg:r.packageKey??r.months,phase:r.regime??(date>=dateSerial('2026-10-06')?'q4':date>=dateSerial('2026-10-01')?'october':'base'),identity,
  key:identity.key,refs:r.refs??[{file:r.source,sheet:r.sheet??'Chính sách cập nhật',row:r.row??1}],issue:r.issue??null,policyKey:r.policyKey??'TYPED_POLICY',net:r.gross-r.discount};
}
// Imported values are typed explicitly. Empty cells stay empty, including
// missing XLSX formula caches; no eval() or transaction amount is involved.
export function normalizePolicyRow(r,defaults={}){
 const v={...defaults,...r},numeric=k=>{if(v[k]===''||v[k]==null)return null;if(typeof v[k]==='number')return v[k];const n=Number(String(v[k]).replace(/[.\s](?=\d{3}(?:\D|$))/g,'').replace(',','.'));return Number.isFinite(n)?n:null;};
 const identity=pricingIdentity(v.course??'',v.hours,v.package??'',{group:v.group});
 const weeks=numeric('weeks')??identity.weeks??Number(/^(\d+(?:\.\d+)?) WEEKS$/.exec(String(v.packageKey))?.[1]),weekly=(v.variant||identity.variant)==='weekly';
 const months=weekly?null:numeric('months')??identity.months;
 return {group:String(v.group??identity.group??'').toUpperCase(),year:numeric('year')??identity.year,layer:numeric('layer')??identity.layer,hours:numeric('hours')??identity.hours,variant:v.variant||identity.variant,
  packageKey:weekly&&weeks>0?weeks+' WEEKS':v.packageKey||identity.packageKey||months,months,...(weekly?{weeks:weeks>0?weeks:null}:{}),monthly:weekly?null:numeric('monthly'),gross:numeric('gross'),discount:numeric('discount'),maxTerms:numeric('maxTerms'),
  straight:numeric('straight')??0,loyalty:numeric('loyalty')??0,referral:numeric('referral')??0,from:v.from??'',to:v.to??'',center:v.center||'*',contractType:v.contractType||'*',
  source:v.source||'',approval:v.approval||'',course:v.course||'',discountLabels:Array.isArray(v.discountLabels)?v.discountLabels:String(v.discountLabels||'').split(';').map(s=>s.trim()).filter(Boolean),conditions:v.conditions||'',...(v.totalHours?{totalHours:Number(v.totalHours)}:{})};
}
