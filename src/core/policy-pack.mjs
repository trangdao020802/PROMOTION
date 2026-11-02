import {pricingIdentity,priceText,packageIdentity,isWeeklyCourse} from './pricing-key.mjs';
import {dateSerial} from './verification.mjs';
const num=n=>typeof n==='number'&&Number.isFinite(n);
const day=d=>typeof d==='number'?d:dateSerial(d);
export const POLICY_SCHEMA='apollo-price-policy/v1';
const variants=['standard','trial','vtdh','ahp','split','summer','upgrade','ielts','premium','weekly'];
const present=x=>x!==null&&x!==undefined&&String(x).trim()!=='';
// A policy row may not change the duration encoded in its lookup key.
// Keep this check shared by imports and reads of previously saved versions.
export function policyIdentityErrors(r){
 const errors=[],key=r.packageKey??r.months,weekly=r.variant==='weekly';
 let months=null,weeks=null;
 if(weekly){
  weeks=Number(/^(\d+(?:\.\d+)?) WEEKS$/.exec(String(key))?.[1]);
  if(!(weeks>0)||Object.hasOwn(r,'weeks')&&r.weeks!==weeks)errors.push('khóa gói tuần khác số tuần');
 }else if(r.variant==='summer'){
  months=Number(/^(?:S\d{2}(?:-\d+)?|SUMMER)\|(\d+(?:\.\d+)?)M$/.exec(String(key))?.[1]);
  if(!(months>0)||months!==r.months)errors.push('mã phiên bản hè (ví dụ S26-2|12M) khớp số tháng');
 }else if(r.variant==='premium'){
  months=Number(/^[\d-]+\|(\d+(?:\.\d+)?)M$/.exec(String(key))?.[1]);
  if(!(months>0)||months!==r.months)errors.push('khóa gói Premium khác số tháng');
 }else if(r.variant==='split'){
  const split=packageIdentity(key);months=split.months;
  if(split.variant!=='split'||!(months>0)||months!==r.months)errors.push('khóa gói chia đôi khác số tháng của một học viên');
 }else if(variants.includes(r.variant)){
  months=Number(key);
  if(!(months>0)||months!==r.months)errors.push('khóa Package khác số tháng tính giá');
 }
 if(present(r.package)){
  const p=packageIdentity(r.package);
  if(weekly?p.unit!=='weeks'||p.weeks!==weeks:p.unit==='weeks'||p.months!==r.months)errors.push('Package khác thời lượng hoặc đơn vị của dòng giá');
  if(!['premium','summer'].includes(r.variant)&&String(p.key)!==String(key))errors.push('Package khác khóa gói');
 }
 if(r.course){
  const c=pricingIdentity(r.course,r.hours,weekly?weeks+' weeks':r.months+' months');
  errors.push(...c.conflicts);
  if(c.year&&c.year!==r.year)errors.push('năm trong Course Fee khác cột năm');
  if(c.layer&&c.layer!==r.layer)errors.push('layer trong Course Fee khác cột layer');
  if(isWeeklyCourse(r.course)&&!weekly)errors.push('Course Fee gói tuần phải dùng Weeks');
  if(c.variant==='vtdh'&&r.variant!=='vtdh')errors.push('Course Fee VTDH khác loại gói');
 }
 return errors;
}
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
  const weeks=Object.hasOwn(scope,'weeks')?scope.weeks:Number(/^(\d+(?:\.\d+)?) WEEKS$/.exec(String(scope.packageKey))?.[1]);
  if(scope.variant==='weekly'?!(num(weeks)&&weeks>0&&weeks<=520):!num(scope.months)||scope.months<=0||scope.months>120)e.push(scope.variant==='weekly'?'số tuần':'số tháng');
  e.push(...policyIdentityErrors(scope));
  if(!num(scope.gross)||scope.gross<=0||scope.gross>1e10)e.push('giá gốc');
  if(!num(scope.discount)||scope.discount<0||scope.discount>scope.gross)e.push('giảm tiền');
  if(scope.variant!=='weekly'&&scope.monthly!=null&&(!num(scope.monthly)||Math.abs(scope.monthly*scope.months-scope.gross)>1))e.push('giá tháng × tháng khác giá gốc');
  if(!Number.isInteger(scope.maxTerms)||scope.maxTerms<0||scope.maxTerms>36)e.push('kỳ trả góp');
  for(const k of ['straight','loyalty','referral'])if(!num(scope[k])||scope[k]<0||scope[k]>12)e.push(k+' (tháng tặng)');
  if(scope.straightWeeks!==undefined&&(!num(scope.straightWeeks)||scope.straightWeeks<0||scope.straightWeeks>52))e.push('straightWeeks (tuần tặng trả thẳng)');
  const a=day(scope.from),b=day(scope.to);if(a===null||b===null||!Number.isFinite(a)||!Number.isFinite(b)||b<a)e.push('ngày hiệu lực');
  if(!String(scope.source??'').trim()||!String(scope.approval??'').trim())e.push('nguồn / căn cứ duyệt');
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
 const invalid=r.override?validatePolicyRows([r]):policyIdentityErrors(r);
 if(invalid.length)return {...r,pkg:r.packageKey??r.months,identity,months:identity.months,monthly:null,gross:null,discount:null,net:null,maxTerms:null,straight:null,straightWeeks:null,loyalty:null,referral:null,
  refs:r.refs??[{file:r.source,sheet:r.sheet??'Chính sách cập nhật',row:r.row??1}],issue:'CHECK - DÒNG GIÁ KHÔNG THỐNG NHẤT: '+invalid.join('; ')};
 if(r.variant==='weekly'&&/^new$/i.test(context.contractType??''))return {...r,gross:null,discount:null,identity,refs:r.refs??[],issue:'CHECK - GIÁ TUẦN CHỈ DÀNH CHO HỌC VIÊN CURRENT'};
 if(r.billingScope==='class'&&r.groupMin>1)return {...r,gross:null,discount:null,identity,refs:r.refs??[],issue:'CHECK - PREMIUM: giá nguồn là cho cả lớp '+r.groupMin+'–'+r.groupMax+' học viên. Bổ sung sĩ số và giá phân bổ cho một học viên; không lấy cả học phí lớp làm học phí của một CT.'};
 return {...r,pkg:r.packageKey??r.months,phase:r.regime??(date>=dateSerial('2026-10-06')?'q4':date>=dateSerial('2026-10-01')?'october':'base'),identity,
  key:identity.key,straightWeeks:r.straightWeeks??0,refs:r.refs??[{file:r.source,sheet:r.sheet??'Chính sách cập nhật',row:r.row??1}],issue:r.issue??null,policyKey:r.policyKey??'TYPED_POLICY',net:r.gross-r.discount};
}
// Imported values are typed explicitly. Empty cells stay empty, including
// missing XLSX formula caches; no eval() or transaction amount is involved.
export function normalizePolicyRow(r,defaults={}){
 const v={...defaults,...r},numeric=k=>{if(v[k]===''||v[k]==null)return null;if(typeof v[k]==='number')return v[k];const n=Number(String(v[k]).replace(/[.\s](?=\d{3}(?:\D|$))/g,'').replace(',','.'));return Number.isFinite(n)?n:null;};
 const identity=pricingIdentity(v.course??'',v.hours,v.package??'',{group:v.group});
 const weeks=present(v.weeks)?numeric('weeks'):identity.weeks??Number(/^(\d+(?:\.\d+)?) WEEKS$/.exec(String(v.packageKey))?.[1]),weekly=(v.variant||identity.variant)==='weekly';
 const months=weekly?null:present(v.months)?numeric('months'):identity.months,optional=k=>present(v[k])?numeric(k):0;
 return {group:String(v.group??identity.group??'').toUpperCase(),year:numeric('year')??identity.year,layer:numeric('layer')??identity.layer,hours:numeric('hours')??identity.hours,variant:v.variant||identity.variant,
  packageKey:present(v.packageKey)?v.packageKey:weekly&&weeks>0?weeks+' WEEKS':identity.packageKey??months,months,...(weekly?{weeks:weeks>0?weeks:null}:{}),...(present(v.package)?{package:v.package}:{}),monthly:weekly?null:numeric('monthly'),gross:numeric('gross'),discount:numeric('discount'),maxTerms:numeric('maxTerms'),
  straight:optional('straight'),straightWeeks:optional('straightWeeks'),loyalty:optional('loyalty'),referral:optional('referral'),from:v.from??'',to:v.to??'',center:v.center||'*',contractType:v.contractType||'*',
  source:v.source||'',approval:v.approval||'',course:v.course||'',discountLabels:Array.isArray(v.discountLabels)?v.discountLabels:String(v.discountLabels||'').split(';').map(s=>s.trim()).filter(Boolean),conditions:v.conditions||'',...(v.totalHours?{totalHours:Number(v.totalHours)}:{})};
}
