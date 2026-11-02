import {hubDocumentCode} from './hub-document.mjs';
import {coursePayload} from './hub-course.mjs';
import {validateHubContract} from './hub-contract.mjs';
import {mergePaymentInvoice,paymentInvoiceNumber,eInvoiceKey} from './hub-invoice.mjs';

const code=hubDocumentCode;
export const childFactKey=({datasetId,masterCt,ct,student})=>
 'hub-child-fact:'+String(datasetId)+':'+String(masterCt)+':'+String(ct)+':'+String(student);
export function mergeChildFinancialFact(prior,next){
 if(!prior||prior.id!==next.id||prior.url!==next.url||!validateHubContract(prior.hubContract))return next;
 const missing=['payments','movements'].filter(k=>next.hubContract[k]?.state!=='read');
 const hubContract={...next.hubContract};
 for(const k of missing)if(prior.hubContract[k]?.state==='read')hubContract[k]=prior.hubContract[k];
 if(hubContract.payments.state==='read')hubContract.payments={...hubContract.payments,rows:hubContract.payments.rows.map(p=>{
  const old=prior.hubContract.payments.rows.find(q=>q.code===p.code&&Math.abs(q.amount-p.amount)<=1);
  return old?mergePaymentInvoice(p,old):p;
 })};
 if(!hubContract.relatedFinance&&prior.hubContract.relatedFinance)hubContract.relatedFinance=prior.hubContract.relatedFinance;
 return {...next,hubContract,lastReadMissing:missing};
}
export function childFactInput({datasetId,masterCt,ct,student,url,payload,parentCt=null}){
 const main=code(masterCt),child=code(ct);
 if(!datasetId||typeof datasetId!=='string'||datasetId.length>150||!main||!child||main===child||
    !student||typeof student!=='string'||student.length>150)return null;
 const course=coursePayload(payload,{ct:child,student,url,readFinance:true});
 if(!course||!course.hubContract||!validateHubContract(course.hubContract)||course.hubContract.ct!==child)return null;
 const facts={ct:child,student,url,parentCt:parentCt&&code(parentCt)!==child?code(parentCt):null,hubContract:course.hubContract,
  courseSummary:{courseFee:null,package:null,hoursPerWeek:null},
  capturedAt:course.hubContract.capturedAt};
 return {id:childFactKey({datasetId,masterCt:main,ct:child,student}),datasetId,masterCt:main,...facts};
}
const equal=(a,b)=>String(a??'').trim().toUpperCase()===String(b??'').trim().toUpperCase();
const amount=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
// Hub facts are evidence only. An invoice or internal movement may not become
// Paid source cash unless the original PaymentList/Transfer is present.
export function compareChildFacts(fact,row){
 if(!fact||!row||!equal(fact.masterCt,row.ct||row.cells?.contractTotal)||!equal(fact.student,row.cells?.F))return null;
 const original=row.receipts??[],movement=row.reconciliation?.movementHistory??[];
 const payments=fact.hubContract?.payments?.rows??[];
 const matched=payments.map(p=>{
  const candidates=original.filter(r=>equal(r.payment,p.code));
  const receipt=candidates.length===1?candidates[0]:null;
  return {code:p.code,amount:p.amount,method:p.method,completeDate:p.completeDate,complete:p.complete,
   invoice:paymentInvoiceNumber(p)??receipt?.vat??null,invoiceDate:p.invoice?.date??null,invoiceAmount:p.invoice?.amount??null,eInvoiceKey:p.eInvoiceKey??eInvoiceKey(p.invoiceRef),invoiceConflicts:p.invoice?.conflicts??[],sourceAmount:amount(receipt?.amount),
   status:receipt&&Math.abs((amount(receipt.amount)??0)-p.amount)<=1?'matched':receipt?'conflict':'missing-source'};
 });
 const transfers=movement.filter(e=>equal(e.from,fact.ct)||equal(e.to,fact.ct)).map(e=>({
  from:e.from,to:e.to,amount:amount(e.amount),date:e.date,
  backed:e.invoiceBacked===true,source:(e.refs??[]).map(r=>String(r.file??'')).filter(Boolean).join(', ')
 }));
 const hubMoves=(fact.hubContract?.movements?.rows??[]).map(item=>{
  const matches=transfers.filter(e=>equal(e.from,item.from)&&equal(e.to,item.to)&&e.amount!==null&&Math.abs(e.amount-item.amount)<=1);
  return {...item,sourceMatched:matches.length===1,invoiceBacked:matches.length===1&&matches[0].backed};
 });
 return {ct:fact.ct,paymentState:fact.hubContract?.payments?.state??'pending',payments:matched,
  transfers,hubMoves,movementState:fact.hubContract?.movements?.state??'pending',
  missingPayments:matched.filter(p=>p.status!=='matched').length,
  missingTransfers:hubMoves.filter(t=>!t.sourceMatched||!t.invoiceBacked).length};
}
