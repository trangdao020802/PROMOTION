// Read-only facts from the receiving contract. These are evidence, never CALC
// prices or a second set of receipts to add to Export/PaymentList/Transfer.
import {normalizeHubDiscount} from './hub-discount.mjs';
export const HUB_CONTRACT_SCHEMA='apollo-hub-contract/v1';
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'?v.trim().replace(/\s+/g,' '):'';
const id=v=>/^[1-9]\d{0,14}$/.test(String(v??''))?String(v):null;
const number=v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e13?v:null;
const date=v=>typeof v==='string'&&v.length<=50&&/^\d{4}-\d\d-\d\d(?:$|T| )/.test(v)&&Number.isFinite(Date.parse(v))?v.slice(0,10):null;
const exact=(v,names)=>plain(v)&&Object.keys(v).every(k=>names.includes(k));
export function hubList(v,max=500){if(typeof v==='string'&&v.length<=1e6){try{v=JSON.parse(v);}catch{return null;}}return Array.isArray(v)&&v.length<=max?v:null;}
export function contractRoot(value){
 let level=[value];const seen=new Set();
 for(let depth=0;depth<6&&level.length<=40;depth++){
  const matches=level.filter(v=>plain(v)&&!seen.has(v)&&(hubList(v.ListCourseInfo,20)||hubList(v.CourseInfos,20)));
  if(matches.length)return matches.length===1?matches[0]:null;
  const next=[];for(const v of level){if(!plain(v)||seen.has(v))continue;seen.add(v);for(const key of ['Data','data','Result','result','Model','model','Contract','contractInfo','item','$vm','vm'])if(plain(v[key]))next.push(v[key]);}level=next;
 }
 return null;
}
export function contractDiscountFacts(root){
 const values=['ListDiscount','Discounts'].map(k=>hubList(root?.[k],100)).filter(Boolean);
 if(!values.length)return null;
 const rows=values.find(v=>v.length)??values[0],result=[];
 for(const r of rows){
  if(!plain(r))return null;const group=text(r.GroupDiscountName),name=normalizeHubDiscount(text(r.DiscountName??r.Name))??text(r.DiscountName??r.Name);
  const full=normalizeHubDiscount(group&&name&&!name.toLowerCase().startsWith(group.toLowerCase())?group+' - '+name:name);
  if(!full||full==='0'||full.length>2000)return null;
  const type=[1,2,3].includes(r.GroupDiscountTypeId)?r.GroupDiscountTypeId:null;
  result.push({label:full,groupId:id(r.GroupDiscountId),discountId:id(r.DiscountId??r.ContractDiscountId),type,percent:number(r.PercentDiscount),amount:number(r.AmountDiscount),months:number(r.GiftMonths)});
 }
 return result;
}
export function projectContractPayments(value,contractId){
 let list=hubList(value,500);
 if(!list&&plain(value)){
  if(value.ContractId!=null&&id(value.ContractId)!==String(contractId))return null;
  for(const key of ['ListPayment','Data','data','Result','result']){list=hubList(value[key],500);if(list)break;}
 }
 if(!list)return null;
 const rows=[];
 for(const r of list){
  if(!plain(r)||r.ContractId!=null&&id(r.ContractId)!==String(contractId)||!id(r.PaymentId)||number(r.Amount)===null)return null;
  const code=text(r.PaymentCode);if(code.length>150||code&&!/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(code))return null;
  rows.push({id:id(r.PaymentId),code,amount:number(r.Amount),totalAmount:number(r.TotalAmount),remaining:number(r.RemainAmount),typeId:id(r.PaymentTypeId),type:text(r.PaymentTypeName).slice(0,200),method:text(r.PaymentMethodTypeName??r.PaymentMethodName).slice(0,200),scheduledDate:date(r.ScheduledDate),completeDate:date(r.CompleteDate),complete:typeof r.IsComplete==='boolean'?r.IsComplete:null});
 }
 return new Set(rows.map(r=>r.id)).size===rows.length?rows:null;
}
export function projectHubContract(root,{payments=null,paymentState='pending',capturedAt=new Date().toISOString()}={}){
 const result={schema:HUB_CONTRACT_SCHEMA,ct:text(root?.ContractNo??root?.ContractCode).toUpperCase(),contractId:id(root?.ContractId??root?.Id),capturedAt,discounts:contractDiscountFacts(root),payments:{state:paymentState,rows:payments??[]}};
 return validateHubContract(result)?result:null;
}
export function validateHubContract(v){
 if(!exact(v,['schema','ct','contractId','capturedAt','discounts','payments'])||v.schema!==HUB_CONTRACT_SCHEMA||!/^\w+-CT-\d{4,20}$/.test(v.ct)||id(v.contractId)!==v.contractId||typeof v.capturedAt!=='string'||!Number.isFinite(Date.parse(v.capturedAt)))return false;
 if(v.discounts!==null&&(!hubList(v.discounts,100)||!v.discounts.every(d=>exact(d,['label','groupId','discountId','type','percent','amount','months'])&&!!text(d.label)&&d.label.length<=2000&&['groupId','discountId'].every(k=>d[k]===null||id(d[k])===d[k])&&(d.type===null||[1,2,3].includes(d.type))&&['percent','amount','months'].every(k=>d[k]===null||number(d[k])===d[k]&&d[k]>=0&&d[k]<=(k==='percent'?100:k==='months'?120:1e13)))))return false;
 const p=v.payments;
 if(!exact(p,['state','rows'])||!['read','pending','unavailable'].includes(p.state)||!hubList(p.rows,500)||p.state!=='read'&&p.rows.length||new Set(p.rows.map(r=>r.id)).size!==p.rows.length)return false;
 return p.rows.every(r=>exact(r,['id','code','amount','totalAmount','remaining','typeId','type','method','scheduledDate','completeDate','complete'])&&id(r.id)===r.id&&typeof r.code==='string'&&r.code.length<=150&&(!r.code||/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(r.code))&&number(r.amount)===r.amount&&['totalAmount','remaining'].every(k=>r[k]===null||number(r[k])===r[k])&&(r.typeId===null||id(r.typeId)===r.typeId)&&['type','method'].every(k=>typeof r[k]==='string'&&r[k].length<=200)&&['scheduledDate','completeDate'].every(k=>r[k]===null||date(r[k])===r[k])&&(r.complete===null||typeof r.complete==='boolean'))&&JSON.stringify(v).length<=300000;
}
