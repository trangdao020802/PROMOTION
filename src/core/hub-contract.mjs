// Read-only facts from the receiving contract. These are evidence, never CALC
// prices or a second set of receipts to add to Export/PaymentList/Transfer.
import {normalizeHubDiscount} from './hub-discount.mjs';
import {hubDocumentCode} from './hub-document.mjs';
import {projectUpgradeLinks,validUpgradeLinks,upgradeDate,upgradeAncestors,mergeUpgradeLinks} from './hub-upgrade.mjs';
import {invoiceReference,projectPaymentInvoice,validateInvoice,eInvoiceKey,mergePaymentInvoice,invoiceKeyFromURL} from './hub-invoice.mjs';
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
  const matches=level.filter(v=>plain(v)&&!seen.has(v)&&(hubList(v.ListCourseInfo,20)||hubList(v.CourseInfos,20)||id(v.ContractId??v.DepositId??v.Id)&&text(v.ContractNo??v.ContractCode??v.DepositNo??v.DepositCode)&&['ListPayment','ListMovingOut','ListMovingIn'].some(k=>v[k]!=null)));
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
const invoiceEvidence=invoiceReference;
const outgoingPayment=r=>Number(r?.PaymentTypeId)===8||/moving[ -]?out|transfer[ -]?out/i.test(text(r?.PaymentTypeName));
export function projectContractPayments(value,contractId){
 let list=hubList(value,500);
 if(!list&&plain(value)){
  if((value.ContractId??value.DepositId)!=null&&id(value.ContractId??value.DepositId)!==String(contractId))return null;
  for(const key of ['ListPayment','Data','data','Result','result']){list=hubList(value[key],500);if(list)break;}
 }
 if(!list)return null;
 const rows=[];
 for(const r of list){
  if(plain(r)&&outgoingPayment(r))continue;
  if(!plain(r)||(r.ContractId??r.DepositId)!=null&&id(r.ContractId??r.DepositId)!==String(contractId)||!id(r.PaymentId)||number(r.Amount)===null)return null;
  const code=text(r.PaymentCode);if(code.length>150||code&&!/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(code))return null;
  rows.push({id:id(r.PaymentId),code,amount:number(r.Amount),totalAmount:number(r.TotalAmount),remaining:number(r.RemainAmount),typeId:id(r.PaymentTypeId),type:text(r.PaymentTypeName).slice(0,200),method:text(r.PaymentMethodTypeName??r.PaymentMethodName).slice(0,200),scheduledDate:date(r.ScheduledDate),completeDate:date(r.CompleteDate),complete:typeof r.IsComplete==='boolean'?r.IsComplete:null,...projectPaymentInvoice(r)});
 }
 return new Set(rows.map(r=>r.id)).size===rows.length?rows:null;
}
// A Hub transfer is a trace, never a second original receipt.
const contractCode=hubDocumentCode;
const moveDay=v=>{
 const iso=date(v);if(iso)return iso;
 const match=/^(\d{2})\/(\d{2})\/(\d{4})(?:\s|$)/.exec(text(v));
 if(!match)return null;const candidate=match[3]+'-'+match[2]+'-'+match[1];
 return Number.isFinite(Date.parse(candidate))&&new Date(candidate+'T00:00:00Z').toISOString().slice(0,10)===candidate?candidate:null;
};
export function projectHubMovements(root){
 if(!plain(root))return null;
 const ct=contractCode(root.ContractNo??root.ContractCode??root.DepositNo??root.DepositCode);
 if(!ct)return null;
 const lists=[['out',['ListMovingOut','ListTransferOut','MovingOut']],['in',['ListMovingIn','ListTransferIn','MovingIn']]];
 const rows=[];let hasList=false;
 for(const [direction,names]of lists){
  const existing=names.find(name=>root[name]!=null);if(!existing)continue;
  const list=hubList(root[existing],200);if(!list)return null;hasList=true;
  for(const item of list){
   if(!plain(item))return null;
   const from=contractCode(item.FromContractNo??item.FromContractCode??item.FromDepositNo??item.MovingInFrom??(direction==='out'?ct:null));
   const to=contractCode(item.ToContractNo??item.ToContractCode??item.ToDepositNo??item.TransferTo??(direction==='in'?ct:null));
   const amount=number(item.TransferAmount??item.MovingAmount??item.Amount);
   if(!from||!to||from===to||amount===null||amount<=0)return null;
   if(direction==='out'&&from!==ct||direction==='in'&&to!==ct)return null;
   const day=moveDay(item.TransferDate??item.MovingDate??item.MovingInDate??item.MovingOutDate??item.Date);
   const reference=text(item.PaymentCode??item.TransferCode??'');
   if(!day||reference.length>150||reference&&!/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(reference))return null;
   rows.push({from,to,amount,date:day,reference,direction});
  }
 }
 // Completed transfer rows identify their original CT/DEP, not new cash.
 const explicitMoves=[...rows];
 for(const p of hubList(root.ListPayment,500)??[]){
  const other=contractCode(p?.RelatedContractDepositNo),amount=number(p?.Amount),day=moveDay(p?.TransferDate??p?.CompleteDate),reference=text(p?.PaymentCode),direction=outgoingPayment(p)?'out':'in';
  if(!other||other===ct||p.IsComplete!==true||!(amount>0)||!day||/refund/i.test(text(p.PaymentTypeName)))continue;
  if(direction==='in'&&p.PaymentTypeId!==10&&!/transfer|deposit to contract/i.test(text(p.PaymentMethodTypeName)+' '+text(p.PaymentTypeName)))continue;
  if(reference&&!/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(reference))continue;
  const from=direction==='out'?ct:other,to=direction==='out'?other:ct;
  if(!explicitMoves.some(m=>m.from===from&&m.to===to&&m.date===day)&&!rows.some(m=>m.direction===direction&&m.reference===reference&&m.from===from&&m.to===to&&m.amount===amount&&m.date===day))rows.push({from,to,amount,date:day,reference,direction});
  hasList=true;
 }
 return hasList?rows:null;
}

export function projectHubLearner(root){
 const leadId=id(root?.LeadId),kidId=id(root?.KidId);
 return leadId&&kidId?{leadId,kidId,url:'https://hub24.apollo.vn:7777/lead/detail/'+leadId+'?s='+kidId}:null;
}

// GetContractInfoForUpdate is also the read-only source of CreatedDate. An
// Upgrade must be dated even when no price/promotion lookup is requested.
export function mergeHubContractDate(facts,info){
 if(!validateHubContract(facts)||facts.contractDate||!plain(info)||id(info.ContractId)!==facts.contractId||info.ContractNo!=null&&text(info.ContractNo).toUpperCase()!==facts.ct)return facts;
 const contractDate=upgradeDate(info.CreatedDate);
 return contractDate?{...facts,contractDate}:facts;
}

export function projectHubContract(root,{payments=null,paymentState='pending',capturedAt=new Date().toISOString()}={}){
 const result={schema:HUB_CONTRACT_SCHEMA,ct:text(root?.ContractNo??root?.ContractCode??root?.DepositNo??root?.DepositCode).toUpperCase(),contractId:id(root?.ContractId??root?.DepositId??root?.Id),capturedAt,discounts:contractDiscountFacts(root),payments:{state:paymentState==='pending'&&(projectContractPayments(root,id(root?.ContractId??root?.DepositId??root?.Id))?.length??0)>0?'read':paymentState,rows:payments??((projectContractPayments(root,id(root?.ContractId??root?.DepositId??root?.Id))?.length??0)>0?projectContractPayments(root,id(root?.ContractId??root?.DepositId??root?.Id)):[])},...(projectHubMovements(root)!==null?{movements:{state:'read',rows:projectHubMovements(root)}}:{movements:{state:'pending',rows:[]}})};
 result.financeRevision=3;
 result.contractDate=upgradeDate(root?.CreatedDate??root?.CreatedTime);
 result.upgrades=projectUpgradeLinks(root);
 const learner=projectHubLearner(root);if(learner)result.learner=learner;
 result.payments=withoutOutgoingPayments(result.payments,result.movements);
 return validateHubContract(result)?result:null;
}
export function validateHubContract(v,depth=0){
 if(!exact(v,['schema','ct','contractId','capturedAt','discounts','payments','movements','learner','relatedFinance','financeRevision','upgrades','contractDate'])||v.schema!==HUB_CONTRACT_SCHEMA||hubDocumentCode(v.ct)!==v.ct||id(v.contractId)!==v.contractId||typeof v.capturedAt!=='string'||!Number.isFinite(Date.parse(v.capturedAt))||v.financeRevision!==undefined&&![2,3].includes(v.financeRevision))return false;
 if(v.upgrades!==undefined&&(!validUpgradeLinks(v.upgrades)||v.upgrades.some(r=>r.id===v.contractId||r.ct===v.ct)))return false;
 if(v.contractDate!==undefined&&v.contractDate!==null&&upgradeDate(v.contractDate)!==v.contractDate)return false;
 if(v.learner!==undefined){const l=v.learner;if(!exact(l,['leadId','kidId','url'])||id(l.leadId)!==l.leadId||id(l.kidId)!==l.kidId||l.url!=='https://hub24.apollo.vn:7777/lead/detail/'+l.leadId+'?s='+l.kidId)return false;}
 if(v.relatedFinance!==undefined){
  if(depth>0||!hubList(v.relatedFinance,32)||new Set(v.relatedFinance.map(f=>f?.ct)).size!==v.relatedFinance.length||!v.relatedFinance.every(f=>f.ct!==v.ct&&f.discounts===null&&f.relatedFinance===undefined&&validateHubContract(f,depth+1)))return false;
  const ancestors=upgradeAncestors(v);
  if(v.relatedFinance.some(f=>!(v.learner&&f.learner?.kidId===v.learner.kidId)&&!ancestors.has(f.ct)))return false;
 }
 if(v.discounts!==null&&(!hubList(v.discounts,100)||!v.discounts.every(d=>exact(d,['label','groupId','discountId','type','percent','amount','months'])&&!!text(d.label)&&d.label.length<=2000&&['groupId','discountId'].every(k=>d[k]===null||id(d[k])===d[k])&&(d.type===null||[1,2,3].includes(d.type))&&['percent','amount','months'].every(k=>d[k]===null||number(d[k])===d[k]&&d[k]>=0&&d[k]<=(k==='percent'?100:k==='months'?120:1e13)))))return false;
 if(v.movements!==undefined){
  const m=v.movements;
  if(!exact(m,['state','rows'])||!['read','pending'].includes(m.state)||!hubList(m.rows,400)||m.state==='pending'&&m.rows.length)return false;
  if(!m.rows.every(x=>exact(x,['from','to','amount','date','reference','direction'])&&contractCode(x.from)===x.from&&contractCode(x.to)===x.to&&x.from!==x.to&&number(x.amount)===x.amount&&x.amount>0&&moveDay(x.date)===x.date&&typeof x.reference==='string'&&x.reference.length<=150&&(!x.reference||/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(x.reference))&&['out','in'].includes(x.direction)&&((x.direction==='out'&&x.from===v.ct)||(x.direction==='in'&&x.to===v.ct))))return false;
 }
 const p=v.payments;
 if(!exact(p,['state','rows'])||!['read','pending','unavailable'].includes(p.state)||!hubList(p.rows,500)||p.state!=='read'&&p.rows.length||new Set(p.rows.map(r=>r.id??r.code)).size!==p.rows.length)return false;
 return p.rows.every(r=>exact(r,['id','code','amount','totalAmount','remaining','typeId','type','method','scheduledDate','completeDate','complete','invoiceRef','eInvoiceKey','eInvoiceVersion','invoice'])&&(r.id===null&&!!r.code||id(r.id)===r.id)&&typeof r.code==='string'&&r.code.length<=150&&(!r.code||/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(r.code))&&number(r.amount)===r.amount&&['totalAmount','remaining'].every(k=>r[k]===null||number(r[k])===r[k])&&(r.typeId===null||id(r.typeId)===r.typeId)&&['type','method'].every(k=>typeof r[k]==='string'&&r[k].length<=200)&&['scheduledDate','completeDate'].every(k=>r[k]===null||date(r[k])===r[k])&&(r.complete===null||typeof r.complete==='boolean')&&(r.invoiceRef===undefined||invoiceEvidence(r.invoiceRef)===r.invoiceRef)&&(r.eInvoiceKey===undefined||eInvoiceKey(r.eInvoiceKey)===r.eInvoiceKey)&&(r.eInvoiceVersion===undefined||[1,2].includes(r.eInvoiceVersion))&&(r.invoice===undefined||validateInvoice(r.invoice)))&&JSON.stringify(v).length<=1200000;
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
function withoutOutgoingPayments(payments,movements){
 if(payments?.state!=='read')return payments;
 const out=(movements?.rows??[]).filter(m=>m.direction==='out'&&m.reference);
 return {...payments,rows:payments.rows.filter(p=>!out.some(m=>m.reference===p.code&&m.date===p.completeDate&&Math.abs(m.amount-p.amount)<=1))};
}
export function projectHubDisplayedTables(tables,ct){
 const current=contractCode(ct);if(!current||!Array.isArray(tables)||tables.length>100)return null;
 let payments=null,movements=null;
 for(const table of tables){
  if(!Array.isArray(table?.headers)||!Array.isArray(table.rows)||table.rows.length>300)continue;
  const headers=table.headers.map(value=>line(value).toLowerCase().replace(/[?*]+$/,'').replace(/moving[ -]+(in|out)/g,'moving $1').trim()),rows=table.rows;
  const pcode=indexed(headers,['payment code']),paid=indexed(headers,['paid amount']),completed=indexed(headers,['completed date']);
  const pamount=indexed(headers,['payment amount']);
  if(pcode>=0&&paid>=0&&completed>=0&&pamount>=0){
   const values=[];
   for(const [rowIndex,r] of rows.entries()){
    if(!Array.isArray(r)||r.length<headers.length)continue;
    const code=line(r[pcode]),amount=vnd(r[paid]),total=vnd(r[pamount]),done=ddmmyyyy(r[completed]);
    const linked=Array.isArray(table.invoices)?table.invoices.find(x=>x.row===rowIndex&&eInvoiceKey(x.key)):null;
    const invoiceRef=invoiceEvidence(r[indexed(headers,['invoice no','invoice number','e-invoice','e-invoice id'])])??linked?.key;
    if(!/^[A-Z0-9]+-PAY-[A-Z0-9-]{3,30}$/i.test(code)||amount===null||total===null||amount<0||total<0||amount>total)continue;
    values.push({id:null,code,amount,totalAmount:total,remaining:vnd(r[indexed(headers,['remain amount'])])??null,typeId:null,type:'Payment',method:line(r[indexed(headers,['payment method'])]).slice(0,200),scheduledDate:ddmmyyyy(r[indexed(headers,['scheduled date'])]),completeDate:done,complete:!!done&&amount>0,...(invoiceRef?{invoiceRef}:{}),...(eInvoiceKey(invoiceRef)?{eInvoiceKey:invoiceRef}:{}),...([1,2].includes(linked?.version)?{eInvoiceVersion:linked.version}:{})});
   }
   if(values.length&&new Set(values.map(v=>v.code)).size===values.length)payments=values;
  }
  const out=indexed(headers,['moving out amount']),to=indexed(headers,['transfer to','moving out to']),transferDate=indexed(headers,['transfer date','moving out date']);
  const inAmount=indexed(headers,['moving in amount']),from=indexed(headers,['moving in from','transfer from']),inDate=indexed(headers,['moving in date','transfer date']);
  const direction=out>=0&&to>=0&&transferDate>=0?'out':inAmount>=0&&from>=0&&inDate>=0?'in':null;
  if(direction){
   const list=[];
   for(const r of rows){
    if(!Array.isArray(r)||r.length<headers.length)continue;
    const other=contractCode(r[direction==='out'?to:from]),amt=vnd(r[direction==='out'?out:inAmount]),day=ddmmyyyy(r[direction==='out'?transferDate:inDate]);
    if(!other||other===current||amt===null||amt<=0||!day)continue;
    const reference=line(r[indexed(headers,['payment code','transfer code'])]);
    if(reference&&!/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(reference))continue;
    list.push({from:direction==='out'?current:other,to:direction==='out'?other:current,amount:amt,date:day,reference,direction});
   }
   if(list.length)movements=[...(movements??[]),...list];
  }
 }
 return {payments,movements};
}
export function mergeDisplayedHubContract(facts,tables,ct){
 if(!validateHubContract(facts)||facts.ct!==ct)return null;
 const extra=projectHubDisplayedTables(tables,ct);if(!extra)return facts;
 const payments=facts.payments.state==='read'&&facts.payments.rows.length?{...facts.payments,
  rows:facts.payments.rows.map(row=>{
   const match=extra.payments?.find(item=>item.code===row.code&&Math.abs(item.amount-row.amount)<=1);
   return match?mergePaymentInvoice(row,match):row;
  })}:extra.payments!==null?{state:'read',rows:extra.payments}:facts.payments;
 const moves=[...(facts.movements?.rows??[]),...(extra.movements??[])];
 const distinct=[...new Map(moves.map(m=>[JSON.stringify([m.from,m.to,m.amount,m.date,m.reference,m.direction]),m])).values()];
 const movements=facts.movements?.state==='read'||extra.movements!==null?{state:'read',rows:distinct}:facts.movements??{state:'pending',rows:[]};
 const result={...facts,payments:withoutOutgoingPayments(payments,movements),movements};return validateHubContract(result)?result:facts;
}
export function mergeHubFinanceFacts(first,second){
 if(!validateHubContract(first)||!validateHubContract(second)||first.ct!==second.ct||first.contractId!==second.contractId)return first;
 let payments=first.payments;
 if(payments.state!=='read'||!payments.rows.length)payments=second.payments.state==='read'?second.payments:payments;
 else if(second.payments.state==='read'){
  const conflicts=second.payments.rows.some(p=>payments.rows.some(q=>p.code===q.code&&Math.abs(p.amount-q.amount)>1));
  payments=conflicts?{state:'unavailable',rows:[]}:{...payments,rows:payments.rows.map(p=>{const match=second.payments.rows.find(q=>q.code===p.code&&Math.abs(q.amount-p.amount)<=1);return match?mergePaymentInvoice(p,match):p;})};
 }
 const values=[...(first.movements?.rows??[]),...(second.movements?.rows??[])],rows=[...new Map(values.map(m=>[JSON.stringify(m),m])).values()];
 const movements={state:first.movements?.state==='read'||second.movements?.state==='read'?'read':'pending',rows};
 let result={...first,payments:withoutOutgoingPayments(payments,movements),movements,contractDate:first.contractDate??second.contractDate??null};
 result=mergeUpgradeLinks(result,second.upgrades??[]);
 if(second.relatedFinance?.length)result.relatedFinance=[...new Map([...(first.relatedFinance??[]),...second.relatedFinance].map(f=>[f.ct,f])).values()];
 return validateHubContract(result)?result:first;
}

// A Payment Info table can contain multiple header sections (Payment,
// Moving-in, Moving-out). Preserve each section instead of using its last head.
export function hubDisplayedTablesFromDocument(root,{staticDocument=false}={}){
 const result=[];
 const visible=node=>!!node&&!node.hidden&&node.getAttribute?.('aria-hidden')!=='true'&&!node.closest?.('[hidden],[aria-hidden="true"],.ng-hide')&&(staticDocument||!node.getClientRects||node.getClientRects().length>0);
 const value=node=>line((staticDocument?node.textContent:node.innerText??node.textContent)??'');
 const normalized=v=>line(v).toLowerCase().replace(/moving[ -]+(in|out)/g,'moving $1').replace(/[?*]+$/,'').trim();
 for(const table of [...root.querySelectorAll('table')].slice(0,100)){
  if(!visible(table))continue;
  let headers=null,rows=[],invoices=[];
  const flush=()=>{if(headers)result.push({headers,rows,...(invoices.length?{invoices}:{})});headers=null;rows=[];invoices=[];};
  for(const tr of [...table.querySelectorAll('tr')].slice(0,1000)){
   if(tr.closest('table')!==table||!visible(tr))continue;
   const cells=[...tr.children].filter(n=>['TH','TD'].includes(n.tagName)&&visible(n));
   const expanded=cells.flatMap(n=>Array.from({length:Math.min(30,Math.max(1,Number(n.colSpan)||1))},()=>n)),values=expanded.map(value),folded=values.map(normalized);
   const hasHeader=cells.some(n=>n.tagName==='TH')||folded.includes('payment code');
   if(hasHeader){flush();if(folded.includes('payment code')&&folded.some(v=>/amount/.test(v)))headers=values;continue;}
   if(cells.length===1&&/^(?:payment|moving[ -]?(?:in|out))$/i.test(value(cells[0]))){flush();continue;}
   if(!headers||values.length!==headers.length||rows.length>=300)continue;
   const invoiceIndex=indexed(headers.map(normalized),['e-invoice','e-invoice id','invoice no','invoice number']),cell=expanded[invoiceIndex];
   if(cell){
    const keys=new Set((value(cell).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)??[]).filter(eInvoiceKey));let version;
    for(const a of [...cell.querySelectorAll?.('a')??[]])if(visible(a)){
     const key=invoiceKeyFromURL(a.getAttribute?.('href'));if(key)keys.add(key);
     const click=a.getAttribute?.('ng-click')??a.getAttribute?.('data-ng-click')??'',literal=/printEInvoice\(\s*['"]([0-9a-f-]{36})['"]\s*,\s*([12])\s*\)/i.exec(click);
     if(literal&&eInvoiceKey(literal[1])){keys.add(literal[1]);version=Number(literal[2]);}
    }
    if(keys.size===1)invoices.push({row:rows.length,key:[...keys][0],...(version?{version}:{})});
   }
   rows.push(values);
  }
  flush();
 }
 return result;
}
