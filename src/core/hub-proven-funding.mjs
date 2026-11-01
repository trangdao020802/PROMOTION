// Independently verified HUB original Paid evidence, scoped to a single student
// and target CT. Movement is not cash. Only an invoice-backed original receipt
// traversing corroborated movements can supplement an absent PaymentList history.
import {validateHubContract} from './hub-contract.mjs';
import {childFactKey} from './child-hub-evidence.mjs';
const ct=v=>typeof v==='string'&&/^[A-Z0-9]+-CT-\d{4,20}$/.test(v.toUpperCase().trim())?v.toUpperCase().trim():null;
const numeric=v=>typeof v==='number'&&Number.isFinite(v)&&v>0?v:null;
const key=(from,to)=>from+'|'+to;
const amount=v=>Math.round(v*100)/100;
function addEdge(edges,m,source){
 const from=ct(m.from),to=ct(m.to),a=numeric(m.amount);
 if(!from||!to||from===to||!a)return;
 const k=key(from,to),entry=edges.get(k)??{from,to,amount:null,sources:new Set(),conflict:false};
 if(entry.amount!==null&&Math.abs(entry.amount-a)>1)entry.conflict=true;
 entry.amount=entry.amount===null?a:Math.min(entry.amount,a);
 entry.sources.add(source);edges.set(k,entry);
}
export function verifiedHubSupplement({masterCt,student,datasetId,sourcePayments=[],sourceMovements=[],facts=[],links=[]}){
 const master=ct(masterCt),studentId=String(student??'');
 const base={amount:0,receipts:[],pending:[],paths:[],status:'evidence-only'};
 if(!master||!studentId||!datasetId)return base;
 const validLinks=new Map(links.map(l=>[l.ct,l.url]));
 const accepted=facts.filter(f=>f.datasetId===datasetId&&f.masterCt===master&&f.student===studentId&&ct(f.ct)&&
  f.id===childFactKey({datasetId,masterCt:master,ct:f.ct,student:studentId})&&
  validLinks.get(f.ct)===f.url&&validateHubContract(f.hubContract)&&f.hubContract.ct===f.ct);
 const originalCodes=new Set(sourcePayments.map(r=>String(r.payment??'').toUpperCase()));
 const edges=new Map();
 for(const movement of sourceMovements)if(numeric(movement.amount))addEdge(edges,movement,'TRANSFER');
 for(const f of accepted)if(f.hubContract.movements?.state==='read')
  for(const movement of f.hubContract.movements.rows)addEdge(edges,movement,'HUB:'+f.ct);
 const remaining=new Map([...edges].map(([k,e])=>[k,e.conflict?0:e.amount]));
 const usedPayment=new Set();
 const trace=[];
 const payments=accepted.flatMap(f=>f.hubContract.payments?.state==='read'?f.hubContract.payments.rows.map(p=>({origin:f.ct,p})):[])
  .sort((a,b)=>a.origin.localeCompare(b.origin)||String(a.p.code).localeCompare(String(b.p.code)));
 function flow(origin,need,paymentDay){
  const visit=(node,seen,limit,path)=>{
   if(node===master)return {amount:limit,path};
   if(seen.size>12)return null;
   let best=null;
   for(const edge of edges.values()){
    if(edge.from!==node||seen.has(edge.to)||!(remaining.get(key(edge.from,edge.to))>0)||edge.conflict)continue;
    // The first movement leaving a source invoice CT must be witnessed by HUB.
    if(node===origin&&!edge.sources.has('HUB:'+origin))continue;
    const available=remaining.get(key(edge.from,edge.to));
    const moved=visit(edge.to,new Set([...seen,edge.to]),Math.min(limit,available),[...path,edge]);
    if(moved&&(!best||moved.amount>best.amount))best=moved;
   }
   return best;
  };
  const chosen=visit(origin,new Set([origin]),need,[]);
  if(!chosen?.amount)return null;
  for(const edge of chosen.path){const k=key(edge.from,edge.to);remaining.set(k,remaining.get(k)-chosen.amount);}
  return {amount:amount(chosen.amount),path:chosen.path.map(e=>({from:e.from,to:e.to,amount:e.amount,sources:[...e.sources]}))};
 }
 for(const {origin,p} of payments){
  const paymentCode=String(p.code??'').trim().toUpperCase(),token=origin+'|'+(p.id??paymentCode);
  if(usedPayment.has(token))continue;usedPayment.add(token);
  if(originalCodes.has(paymentCode))continue; // Never count a historical receipt twice.
  if(!paymentCode||p.complete!==true||!p.completeDate||!numeric(p.amount)||!p.invoiceRef){
   base.pending.push({origin,paymentCode,reason:'Thiếu xác nhận Paid/ngày hoặc mã E-Invoice/hóa đơn'});continue;
  }
  const result=flow(origin,p.amount,p.completeDate);
  if(!result){base.pending.push({origin,paymentCode,reason:'Chưa có luồng Moving-out/Transfer đã đối chiếu từ CT gốc về CT tổng'});continue;}
  const receipt={origin,paymentCode,invoiceRef:p.invoiceRef,paid:p.amount,allocated:result.amount,completeDate:p.completeDate,
   path:result.path};
  trace.push(receipt);
 }
 const total=amount(trace.reduce((s,r)=>s+r.allocated,0));
 return {amount:total,receipts:trace,pending:base.pending,paths:trace.map(t=>t.path),status:total>0?'hub-backed':'evidence-only'};
}
