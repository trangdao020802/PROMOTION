// Supplemental Paid documents enter the same dated, capacity-limited ledger as
// the source reports. Internal transfers are never added as a second receipt.
import {validateHubContract} from './hub-contract.mjs';
import {hubDocumentCode as code,hubDocumentId} from './hub-document.mjs';
import {childFactKey} from './child-hub-evidence.mjs';
import {buildAccounts,unionReceipts,unionTransfers} from './reconcile.mjs';
import {buildContractGroups} from './contracts.mjs';
import {paymentAllocations} from './payment-allocations.mjs';
import {financeBundle} from './hub-finance-bundle.mjs';
import {paymentInvoiceNumber,eInvoiceKey} from './hub-invoice.mjs';
const day=value=>typeof value==='number'?value:(Date.parse(String(value)+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000;
const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
const signature=m=>JSON.stringify([m.from,m.to,Math.floor(m.date)]);
const unique=a=>[...new Set(a)];
export function hubFundingSources(input,{datasetId,facts=[],links=[]}={}){
 const urls=new Map(links.map(l=>[l.ct,l.url]));
 const parents=facts.filter(f=>f.datasetId===datasetId&&code(f.masterCt)?.includes('-CT-')&&f.student&&code(f.ct)&&
  f.id===childFactKey(f)&&urls.get(f.ct)===f.url&&hubDocumentId(f.url,f.ct)===f.hubContract?.contractId&&
  validateHubContract(f.hubContract)&&f.hubContract.ct===f.ct);
 const valid=[...parents];
 for(const parent of parents)for(const doc of financeBundle(parent.hubContract)){
  if(urls.has(doc.ct)&&urls.get(doc.ct)!==doc.url)continue;
  if(valid.some(f=>f.masterCt===parent.masterCt&&f.student===parent.student&&f.ct===doc.ct))continue;
  const f={...parent,...doc};f.id=childFactKey(f);valid.push(f);
 }
 const rawMoves=unionTransfers(input.transferSources??[]).rows,rawCash=unionReceipts(input.cashSources??[]).rows;
 const existingCodes=new Set(rawCash.map(p=>p.payment.toUpperCase())),rawByPair=new Map(),hubByPair=new Map(),pending=[];
 for(const m of rawMoves){const k=signature(m),list=rawByPair.get(k)??[];list.push(m);rawByPair.set(k,list);}
 // Moving-in and Moving-out can have different Payment codes for one transfer.
 // Reconcile the complete daily amount multiset, retaining genuine multiplicity.
 for(const f of valid){
  if(f.hubContract.movements?.state!=='read')continue;
  const own=new Map();
  for(const m of f.hubContract.movements.rows){
   const move={...m,date:day(m.date)};if(!Number.isFinite(move.date)||move.date>=input.cutoff+1)continue;
   const k=signature(move),list=own.get(k)??[];list.push(move);own.set(k,list);
  }
  for(const [k,list]of own){const group=hubByPair.get(k)??[];group.push({f,list});hubByPair.set(k,group);}
 }
 const addedMoves=[],blocked=new Set();
 for(const [k,observations]of hubByPair){
  const sets=observations.map(o=>o.list.map(m=>m.amount).sort((a,b)=>a-b)),raw=rawByPair.get(k);
  if(raw)sets.push(raw.map(m=>m.amount).sort((a,b)=>a-b));
  const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<=1);
  if(sets.some(s=>!equal(s,sets[0]))){blocked.add(k);const [from,to]=JSON.parse(k);pending.push({from,to,reason:'Moving / Transfer khác số tiền hoặc số lần chuyển: '+from+' → '+to});continue;}
  if(raw)continue;
  const {f,list}=observations[0];
  for(const [i,m]of list.entries())addedMoves.push({type:'Transfer',date:m.date,from:m.from,to:m.to,fromStudent:'',toStudent:'',out:m.amount,amount:m.amount,payment:m.reference,
   ref:{file:'Hub · '+f.ct,sheet:'Moving '+m.direction,row:i+1,url:f.url}});
 }
 // Preserve the imported ledger. A disagreement cannot supply a new Hub cash
 // path and remains a visible warning. A manual ancestry supplies no money.
 const transfers=input.transferSources??[];
 const allMoves=[...rawMoves.filter(m=>!blocked.has(signature(m))),...addedMoves];
 const reaches=(origin,target)=>{
  const queue=[origin],seen=new Set();
  for(let i=0;i<queue.length&&seen.size<200;i++){const ct=queue[i];if(ct===target)return true;if(seen.has(ct))continue;seen.add(ct);for(const m of allMoves)if(m.from===ct&&positive(m.amount))queue.push(m.to);}
  return false;
 };
 const addedCash=[],meta={};
 for(const f of valid){
  if(f.hubContract.payments.state!=='read')continue;
  for(const [i,p]of f.hubContract.payments.rows.entries()){
   if(!p.code||existingCodes.has(p.code.toUpperCase()))continue;
   if(!p.invoiceRef||p.invoice?.conflicts?.length||p.invoice?.amount!=null&&Math.abs(p.invoice.amount-p.amount)>1||p.complete!==true||!p.completeDate||!positive(p.amount)||p.typeId==='10'||/transfer|moving|deposit to contract|^other$/i.test((p.method+' '+p.type).trim())){
    pending.push({origin:f.ct,paymentCode:p.code,reason:'Thiếu hóa đơn Paid gốc, ngày hoặc mã E-Invoice / VAT'});continue;
   }
   if(!reaches(f.ct,f.masterCt)){pending.push({origin:f.ct,paymentCode:p.code,reason:'Chưa có đường Moving / Transfer về CT tổng'});continue;}
   const invoiceNo=paymentInvoiceNumber(p);
   addedCash.push({payment:p.code,contract:f.ct,student:'',vat:invoiceNo??p.invoiceRef,date:day(p.completeDate),amount:p.amount,paid:true,cancelled:false,
    ref:{file:'Hub · '+f.ct,sheet:'Payment Info · Paid',row:i+1,url:f.url}});
   meta[p.code]={method:p.method||null,term:null,invoiceNumber:invoiceNo,invoiceDate:p.invoice?.date??null,invoiceAmount:p.invoice?.amount??null,eInvoiceKey:p.eInvoiceKey??eInvoiceKey(p.invoiceRef),invoiceSource:p.invoice?.source??null,hubURL:f.url};
  }
 }
 return {input:{...input,cashSources:[...(input.cashSources??[]),{rows:addedCash}],transferSources:[...transfers,{rows:addedMoves}]},cash:addedCash,moves:addedMoves,pending,meta,changed:!!(addedCash.length||addedMoves.length||blocked.size)};
}
export function attachHubFunding(model,{datasetId,facts,links}){
 if(!model.input)return;
 const extra=hubFundingSources(model.input,{datasetId,facts,links});if(!extra.changed)return;
 const prior=new Map(model.contractGroups.map(g=>[g.id,g]));
 model.input=extra.input;model.receiptMeta={...model.receiptMeta,...extra.meta};
 model.extensions.accounts=buildAccounts(extra.input,{contractSummaries:true});
 const refreshed=buildContractGroups(model,extra.input,{paymentTrace:true});
 const codes=new Set(extra.cash.map(r=>r.payment));
 for(const fresh of refreshed){
  const group=prior.get(fresh.id);if(!group||group.kind!=='contract')continue;
  const base=group.account.net;
  group.account=fresh.account;group.receipts=fresh.receipts;group.raw=fresh.raw;
  group.warnings=unique([...group.warnings.filter(w=>!w.includes('chưa có phương thức thanh toán')), ...fresh.warnings]);
  const codesInPath=new Set([group.ct,...(group.account.movementHistory??[]).flatMap(m=>[m.from,m.to])]);
  group.warnings=unique([...group.warnings,...extra.pending.filter(p=>p.from&&codesInPath.has(p.from)&&codesInPath.has(p.to)||p.origin&&codesInPath.has(p.origin)).map(p=>p.reason)]);
  const allocations=paymentAllocations({...group,cells:{...group.cells,contractTotal:group.ct},reconciliation:group.account});
  const receipts=allocations.invoices.filter(r=>codes.has(r.receipt.payment)).map(r=>({origin:r.receipt.contract,paymentCode:r.receipt.payment,invoiceRef:r.receipt.vat,paid:r.receipt.amount,allocated:r.amount,
   completeDate:new Date(Date.UTC(1899,11,30)+r.receipt.date*86400000).toISOString().slice(0,10),path:r.paths[0]??[]}));
  group.account.hubSupplement={ledger:true,amount:group.account.net-base,receipts,pending:extra.pending,status:'hub-backed'};
 }
}
// Bounded projection retained for integrations; production uses attachHubFunding
// once for the whole dataset so competing masters share one funding budget.
export function verifiedHubSupplement({masterCt,student,datasetId,sourcePayments=[],sourceMovements=[],facts=[],links=[],cutoff=Infinity}){
 const movements=sourceMovements.map(m=>({...m,type:'Transfer',date:day(m.date),out:m.out??m.amount,fromStudent:'',toStudent:'',ref:{file:'Transfer'}}));
 const input={cutoff,cashSources:[],transferSources:[{rows:movements}],links:[],paid:[{ct:masterCt,student}],snapshots:[],records:[]};
 const filtered=facts.filter(f=>f.masterCt===masterCt&&f.student===student);
 const imported=new Set(sourcePayments.map(p=>String(p.payment).toUpperCase()));
 const safe=filtered.map(f=>({...f,hubContract:{...f.hubContract,payments:{...f.hubContract.payments,rows:f.hubContract.payments.rows.filter(p=>!imported.has(p.code.toUpperCase()))}}}));
 const extra=hubFundingSources(input,{datasetId,facts:safe,links}),accounts=buildAccounts(extra.input,{contractSummaries:true}),account=accounts.contracts[masterCt];
 const cash=unionReceipts(extra.input.cashSources).rows,documents=new Map(cash.map(r=>[r.id,r]));
 const incoming=(account?.events??[]).filter(e=>e.to===masterCt&&e.invoiceBacked);
 const ids=unique(incoming.flatMap(e=>e.invoiceIds??[]));
 const receipts=ids.map(id=>{const r=documents.get(id);return {origin:r.contract,paymentCode:r.payment,invoiceRef:r.vat,paid:r.amount,allocated:incoming.every(e=>e.invoiceIds.length===1)?incoming.filter(e=>e.invoiceIds.includes(id)).reduce((n,e)=>n+e.amount,0):null,completeDate:new Date(Date.UTC(1899,11,30)+r.date*86400000).toISOString().slice(0,10),path:[]};});
 for(const r of receipts){let current=r.origin,seen=new Set();while(current!==masterCt&&!seen.has(current)){seen.add(current);const m=[...movements,...extra.moves].find(m=>m.from===current);if(!m)break;r.path.push(m);current=m.to;}}
 return {amount:account?.net??0,receipts,pending:extra.pending,paths:receipts.map(r=>r.path),status:account?.net>0?'hub-backed':'evidence-only'};
}
