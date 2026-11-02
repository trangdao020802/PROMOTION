import {hubList,projectHubContract,projectContractPayments,projectHubLearner,mergeHubFinanceFacts,validateHubContract} from './hub-contract.mjs';
import {hubDocumentCode} from './hub-document.mjs';
import {invoiceDay,projectPaymentInvoice,mergePaymentInvoice} from './hub-invoice.mjs';
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const id=v=>/^[1-9]\d{0,14}$/.test(String(v??''))?String(v):null;
const text=v=>typeof v==='string'?v.trim().replace(/\s+/g,' '):'';
const amount=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e13?v:null;
const code=hubDocumentCode;
export function projectLearnerPaymentPage(value,root){
 const learner=projectHubLearner(root);if(!learner)return null;
 if(typeof value==='string'&&value.length<=2e6){try{value=JSON.parse(value);}catch{return null;}}
 for(let i=0;i<3&&plain(value)&&!Array.isArray(value.ListData);i++){
  const next=value.Data??value.data??value.Result;if(!plain(next))break;value=next;
 }
 if(!plain(value)||value.KidId!=null&&id(value.KidId)!==learner.kidId)return null;
 const groups=hubList(value.ListData,200);if(!groups)return null;
 const documents=new Map();
 for(const group of groups){
  if(!plain(group)||group.KidId!=null&&id(group.KidId)!==learner.kidId)continue;
  const ct=code(group.ContractDepositNo??group.ContractNo??group.DepositNo),contractId=id(group.ContractDepositId??group.ContractId??group.DepositId);
  if(!ct||!contractId)continue;
  if(ct===code(root.ContractNo??root.DepositNo)&&contractId!==id(root.ContractId??root.DepositId))return null;
  const lists=['ListPayment','ListPayments','PaymentDetails','ListPaymentDetails','Payments'].map(k=>hubList(group[k],500)).filter(Boolean);
  const rows=lists.length?lists.find(a=>a.length)??[]:group.PaymentCode?[group]:[];
  const payments=[],moves=[];
  for(const raw of rows){
   if(!plain(raw)||raw.KidId!=null&&id(raw.KidId)!==learner.kidId)continue;
   const explicit=code(raw.ContractDepositNo??raw.ContractNo??raw.DepositNo);
   if(explicit&&explicit!==ct)continue;
   const paymentCode=text(raw.PaymentCode),paid=raw.IsComplete===true||raw.IsComplete!==false&&/^paid$/i.test(text(raw.StatusName??raw.Status??raw.PaymentStatusName));
   const paidAmount=amount(raw.PaidAmount??raw.Amount),completeDate=invoiceDay(raw.CompleteDate??raw.PaymentDate);
   if(!/^[A-Z0-9]+-PAY-[A-Z0-9-]{3,30}$/i.test(paymentCode)||paidAmount===null)continue;
   const method=text(raw.PaymentMethodTypeName??raw.PaymentMethodName).slice(0,200),type=text(raw.PaymentTypeName??raw.PaymentType).slice(0,200);
   const p={id:id(raw.PaymentId),code:paymentCode,amount:paidAmount,totalAmount:amount(raw.TotalAmount??raw.Amount),remaining:amount(raw.RemainAmount),typeId:id(raw.PaymentTypeId),type,method,
    scheduledDate:invoiceDay(raw.ScheduledDate),completeDate,complete:paid,...projectPaymentInvoice(raw,'learner-payments')};
   payments.push(p);
   const from=code(raw.RelatedContractDepositNo??raw.RelatedContractNo);
   if(from&&from!==ct&&paid&&paidAmount>0&&completeDate&&!/refund|moving[ -]?out|transfer[ -]?out/i.test(type))moves.push({from,to:ct,amount:paidAmount,date:completeDate,reference:paymentCode,direction:'in'});
  }
  if(!payments.length&&!moves.length)continue;
  const facts=projectHubContract({ContractNo:ct,ContractId:contractId,LeadId:learner.leadId,KidId:learner.kidId,ListMovingIn:[],ListCourseInfo:[]},{payments,paymentState:'read'});
  if(!facts)continue;facts.discounts=null;facts.movements={state:'read',rows:moves};
  const prior=documents.get(ct);
  if(prior){
   if(prior.contractId!==facts.contractId)return null;
   for(const p of facts.payments.rows){const old=prior.payments.rows.find(x=>x.code===p.code);if(old&&Math.abs(old.amount-p.amount)>1)return null;if(!old)prior.payments.rows.push(p);}
   prior.movements.rows.push(...moves);
  }else documents.set(ct,facts);
 }
 return {documents:[...documents.values()],count:groups.length,total:Number.isSafeInteger(value.TotalCount)&&value.TotalCount>=0?value.TotalCount:null};
}
export function mergeLearnerFinance(facts,pages){
 if(!validateHubContract(facts)||!facts.learner||!Array.isArray(pages))return facts;
 const docs=new Map();
 for(const page of pages)for(const doc of page?.documents??[]){
  if(!validateHubContract(doc)||doc.learner?.kidId!==facts.learner.kidId)continue;
  const prior=docs.get(doc.ct);
  if(prior){
   if(prior.contractId!==doc.contractId)return facts;
   const merged=mergeHubFinanceFacts(prior,doc);
   const rows=[...merged.payments.rows];for(const p of doc.payments.rows)if(!rows.some(q=>q.code===p.code))rows.push(p);
   docs.set(doc.ct,{...merged,payments:{...merged.payments,rows}});
  }else docs.set(doc.ct,doc);
 }
 const own=docs.get(facts.ct);
 let result=own?.contractId===facts.contractId?mergeHubFinanceFacts(facts,own):facts;
 // Only ancestors connected to the requested document leave Hub. Other
 // courses, siblings and unrelated payments of this household stay in Hub.
 const known=new Set([facts.ct]),related=[];
 for(let depth=0;depth<16&&known.size<=32;depth++){
  const before=known.size;
  for(const ct of [...known])for(const m of (ct===facts.ct?result:docs.get(ct))?.movements?.rows??[])if(m.to===ct)known.add(m.from);
  if(before===known.size)break;
 }
 for(const ct of known)if(ct!==facts.ct&&docs.has(ct)&&related.length<32)related.push({...docs.get(ct),discounts:null});
 if(related.length)result={...result,relatedFinance:related};
 return validateHubContract(result)?result:facts;
}
