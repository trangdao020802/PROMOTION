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
  const matches=level.filter(v=>plain(v)&&!seen.has(v)&&(hubList(v.ListCourseInfo,20)||hubList(v.CourseInfos,20)||id(v.ContractId??v.Id)&&text(v.ContractNo??v.ContractCode)&&['ListPayment','ListMovingOut','ListMovingIn'].some(k=>v[k]!=null)));
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
const invoiceEvidence=value=>{
 const v=text(value);if(!v)return null;
 return /^\d{4,15}$/.test(v)||/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)?v:null;
};
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
  const invoiceRef=invoiceEvidence(r.InvoiceNo??r.InvoiceNumber??r.EInvoiceId??r.EInvoiceGuid??r.EInvoice);
  rows.push({id:id(r.PaymentId),code,amount:number(r.Amount),totalAmount:number(r.TotalAmount),remaining:number(r.RemainAmount),typeId:id(r.PaymentTypeId),type:text(r.PaymentTypeName).slice(0,200),method:text(r.PaymentMethodTypeName??r.PaymentMethodName).slice(0,200),scheduledDate:date(r.ScheduledDate),completeDate:date(r.CompleteDate),complete:typeof r.IsComplete==='boolean'?r.IsComplete:null,...(invoiceRef?{invoiceRef}:{})});
 }
 return new Set(rows.map(r=>r.id)).size===rows.length?rows:null;
}
// A Hub transfer is a trace, never a second original receipt.
const contractCode=v=>/^[A-Z0-9]+-CT-\d{4,20}$/.test(text(v).toUpperCase())?text(v).toUpperCase():null;
const moveDay=v=>{
 const iso=date(v);if(iso)return iso;
 const match=/^(\d{2})\/(\d{2})\/(\d{4})(?:\s|$)/.exec(text(v));
 if(!match)return null;const candidate=match[3]+'-'+match[2]+'-'+match[1];
 return Number.isFinite(Date.parse(candidate))&&new Date(candidate+'T00:00:00Z').toISOString().slice(0,10)===candidate?candidate:null;
};
export function projectHubMovements(root){
 if(!plain(root))return null;
 const ct=contractCode(root.ContractNo??root.ContractCode);
 if(!ct)return null;
 const lists=[['out',['ListMovingOut','ListTransferOut','MovingOut']],['in',['ListMovingIn','ListTransferIn','MovingIn']]];
 const rows=[];let hasList=false;
 for(const [direction,names]of lists){
  const existing=names.find(name=>root[name]!=null);if(!existing)continue;
  const list=hubList(root[existing],200);if(!list)return null;hasList=true;
  for(const item of list){
   if(!plain(item))return null;
   const from=contractCode(item.FromContractNo??item.FromContractCode??(direction==='out'?ct:null));
   const to=contractCode(item.ToContractNo??item.ToContractCode??(direction==='in'?ct:null));
   const amount=number(item.TransferAmount??item.MovingAmount??item.Amount);
   if(!from||!to||from===to||amount===null||amount<=0)return null;
   if(direction==='out'&&from!==ct||direction==='in'&&to!==ct)return null;
   const day=moveDay(item.TransferDate??item.MovingDate??item.Date);
   const reference=text(item.PaymentCode??item.TransferCode??'');
   if(!day||reference.length>150||reference&&!/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(reference))return null;
   rows.push({from,to,amount,date:day,reference,direction});
  }
 }
 return hasList?rows:null;
}

export function projectHubContract(root,{payments=null,paymentState='pending',capturedAt=new Date().toISOString()}={}){
 const result={schema:HUB_CONTRACT_SCHEMA,ct:text(root?.ContractNo??root?.ContractCode).toUpperCase(),contractId:id(root?.ContractId??root?.Id),capturedAt,discounts:contractDiscountFacts(root),payments:{state:paymentState==='pending'&&(projectContractPayments(root,id(root?.ContractId??root?.Id))?.length??0)>0?'read':paymentState,rows:payments??((projectContractPayments(root,id(root?.ContractId??root?.Id))?.length??0)>0?projectContractPayments(root,id(root?.ContractId??root?.Id)):[])},...(projectHubMovements(root)!==null?{movements:{state:'read',rows:projectHubMovements(root)}}:{movements:{state:'pending',rows:[]}})};
 return validateHubContract(result)?result:null;
}
export function validateHubContract(v){
 if(!exact(v,['schema','ct','contractId','capturedAt','discounts','payments'])&&!exact(v,['schema','ct','contractId','capturedAt','discounts','payments','movements'])||v.schema!==HUB_CONTRACT_SCHEMA||!/^\w+-CT-\d{4,20}$/.test(v.ct)||id(v.contractId)!==v.contractId||typeof v.capturedAt!=='string'||!Number.isFinite(Date.parse(v.capturedAt)))return false;
 if(v.discounts!==null&&(!hubList(v.discounts,100)||!v.discounts.every(d=>exact(d,['label','groupId','discountId','type','percent','amount','months'])&&!!text(d.label)&&d.label.length<=2000&&['groupId','discountId'].every(k=>d[k]===null||id(d[k])===d[k])&&(d.type===null||[1,2,3].includes(d.type))&&['percent','amount','months'].every(k=>d[k]===null||number(d[k])===d[k]&&d[k]>=0&&d[k]<=(k==='percent'?100:k==='months'?120:1e13)))))return false;
 if(v.movements!==undefined){
  const m=v.movements;
  if(!exact(m,['state','rows'])||!['read','pending'].includes(m.state)||!hubList(m.rows,400)||m.state==='pending'&&m.rows.length)return false;
  if(!m.rows.every(x=>exact(x,['from','to','amount','date','reference','direction'])&&contractCode(x.from)===x.from&&contractCode(x.to)===x.to&&x.from!==x.to&&number(x.amount)===x.amount&&x.amount>0&&moveDay(x.date)===x.date&&typeof x.reference==='string'&&x.reference.length<=150&&(!x.reference||/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(x.reference))&&['out','in'].includes(x.direction)&&((x.direction==='out'&&x.from===v.ct)||(x.direction==='in'&&x.to===v.ct))))return false;
 }
 const p=v.payments;
 if(!exact(p,['state','rows'])||!['read','pending','unavailable'].includes(p.state)||!hubList(p.rows,500)||p.state!=='read'&&p.rows.length||new Set(p.rows.map(r=>r.id??r.code)).size!==p.rows.length)return false;
 return p.rows.every(r=>(exact(r,['id','code','amount','totalAmount','remaining','typeId','type','method','scheduledDate','completeDate','complete'])||exact(r,['id','code','amount','totalAmount','remaining','typeId','type','method','scheduledDate','completeDate','complete','invoiceRef']))&&(r.id===null&&!!r.code||id(r.id)===r.id)&&typeof r.code==='string'&&r.code.length<=150&&(!r.code||/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(r.code))&&number(r.amount)===r.amount&&['totalAmount','remaining'].every(k=>r[k]===null||number(r[k])===r[k])&&(r.typeId===null||id(r.typeId)===r.typeId)&&['type','method'].every(k=>typeof r[k]==='string'&&r[k].length<=200)&&['scheduledDate','completeDate'].every(k=>r[k]===null||date(r[k])===r[k])&&(r.complete===null||typeof r.complete==='boolean')&&(r.invoiceRef===undefined||invoiceEvidence(r.invoiceRef)===r.invoiceRef))&&JSON.stringify(v).length<=300000;
}

/**
 * Read-only projections from Hub's displayed Payment Info and Moving-in/out
 * tables. Only allowlisted header/column positions enter the payload.
 * DOM lines have no internal PaymentId: preserve null instead of inventing it.
 */
const line=v=>String(v??'').replace(/\s+/g,' ').trim();
const vnd=v=>{
 const x=line(v).replace(/\s*(?:VND|VNĐ|đ|₫)\s*$/i,'').replace(/\s/g,'');
 if(!/^-?\d{1,3}(?:\.\d{3})*(?:,\d+)?$|^-?\d+(?:,\d+)?$/.test(x))return null;
 const n=Number(x.replace(/\./g,'').replace(',','.'));return Number.isFinite(n)&&Math.abs(n)<=1e13?n:null;
};
const ddmmyyyy=v=>{
 const match=/(\d{2})\/(\d{2})\/(\d{4})/.exec(line(v));if(!match)return null;
 const result=match[3]+'-'+match[2]+'-'+match[1];
 return moveDay(result);
};
const indexed=(headers,names)=>{
 for(const name of names){const i=headers.findIndex(h=>line(h).toLowerCase()===name);if(i>=0)return i;}
 return -1;
};
export function projectHubDisplayedTables(tables,ct){
 const current=contractCode(ct);if(!current||!Array.isArray(tables)||tables.length>100)return null;
 let payments=null,movements=null;
 for(const table of tables){
  if(!Array.isArray(table?.headers)||!Array.isArray(table.rows)||table.rows.length>300)continue;
  const headers=table.headers,rows=table.rows;
  const pcode=indexed(headers,['payment code']),paid=indexed(headers,['paid amount']),completed=indexed(headers,['completed date']);
  const pamount=indexed(headers,['payment amount']);
  if(pcode>=0&&paid>=0&&completed>=0&&pamount>=0){
   const values=[];
   for(const r of rows){
    if(!Array.isArray(r)||r.length<headers.length)continue;
    const code=line(r[pcode]),amount=vnd(r[paid]),total=vnd(r[pamount]),done=ddmmyyyy(r[completed]);
    const invoiceRef=invoiceEvidence(r[indexed(headers,['invoice no','invoice number','e-invoice','e-invoice id'])]);
    if(!/^[A-Z0-9]+-PAY-[A-Z0-9-]{3,30}$/i.test(code)||amount===null||total===null||amount<0||total<0||amount>total)continue;
    values.push({id:null,code,amount,totalAmount:total,remaining:vnd(r[indexed(headers,['remain amount'])])??null,typeId:null,type:'Payment',method:line(r[indexed(headers,['payment method'])]).slice(0,200),scheduledDate:ddmmyyyy(r[indexed(headers,['scheduled date'])]),completeDate:done,complete:!!done&&amount>0,...(invoiceRef?{invoiceRef}:{})});
   }
   if(new Set(values.map(v=>v.code)).size===values.length)payments=values;
  }
  const out=indexed(headers,['moving out amount']),to=indexed(headers,['transfer to']),transferDate=indexed(headers,['transfer date']);
  const inAmount=indexed(headers,['moving in amount']),from=indexed(headers,['transfer from']);
  const direction=out>=0&&to>=0&&transferDate>=0?'out':inAmount>=0&&from>=0&&transferDate>=0?'in':null;
  if(direction){
   const list=[];
   for(const r of rows){
    if(!Array.isArray(r)||r.length<headers.length)continue;
    const other=contractCode(r[direction==='out'?to:from]),amt=vnd(r[direction==='out'?out:inAmount]),day=ddmmyyyy(r[transferDate]);
    if(!other||other===current||amt===null||amt<=0||!day)continue;
    const reference=line(r[indexed(headers,['payment code','transfer code'])]);
    if(reference&&!/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(reference))continue;
    list.push({from:direction==='out'?current:other,to:direction==='out'?other:current,amount:amt,date:day,reference,direction});
   }
   movements=[...(movements??[]),...list];
  }
 }
 return {payments,movements};
}
export function mergeDisplayedHubContract(facts,tables,ct){
 if(!validateHubContract(facts)||facts.ct!==ct)return null;
 const extra=projectHubDisplayedTables(tables,ct);if(!extra)return facts;
 const payments=facts.payments.state==='read'?{...facts.payments,
  rows:facts.payments.rows.map(row=>{
   const match=extra.payments?.find(item=>item.code===row.code&&Math.abs(item.amount-row.amount)<=1);
   return match?.invoiceRef&&!row.invoiceRef?{...row,invoiceRef:match.invoiceRef}:row;
  })}:extra.payments!==null?{state:'read',rows:extra.payments}:facts.payments;
 const movements=facts.movements?.state==='read'?facts.movements:extra.movements!==null?{state:'read',rows:extra.movements}:facts.movements??{state:'pending',rows:[]};
 const result={...facts,payments,movements};return validateHubContract(result)?result:facts;
}
