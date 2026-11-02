import {hubDocumentCode} from './hub-document.mjs';
import {financeBundle} from './hub-finance-bundle.mjs';
import {upgradeEdges} from './hub-upgrade.mjs';
export const ctCode=hubDocumentCode;
export const ancestryKey=({datasetId,masterCt,student,parentCt})=>
 ['hub-upstream',String(datasetId),String(masterCt),String(student),String(parentCt)].join('|');
const unique=items=>[...new Set(items.map(ctCode).filter(Boolean))];
export function knownFinanceDocuments(row,settings=[],{datasetId,masterCt,student}){
 const known=new Set([masterCt,...(row.sourceContracts??[])]),moves=row.account?.movementHistory??row.reconciliation?.movementHistory??[];
 const related=settings.filter(s=>s.datasetId===datasetId&&s.masterCt===masterCt&&s.student===student);
 for(const s of [...related])for(const d of financeBundle(s.hubContract))related.push({...s,...d});
 for(let depth=0;depth<16;depth++){
  const before=known.size;
  for(const m of moves)if(known.has(m.to)&&Number(m.amount)>0&&ctCode(m.from))known.add(m.from);
  for(const s of related){
   if(known.has(s.parentCt))for(const c of s.codes??[])if(ctCode(c))known.add(c);
   if(known.has(s.ct))for(const m of s.hubContract?.movements?.rows??[])if(m.to===s.ct&&Number(m.amount)>0&&ctCode(m.from))known.add(m.from);
  }
  for(const edge of upgradeEdges(related.map(s=>s.hubContract)))if(known.has(edge.to))known.add(edge.from);
  if(known.size===before||known.size>200)break;
 }
 return known;
}
export function upstreamCandidates(row,parentCt,parentHubFact=null,manual=[]){
 const parent=ctCode(parentCt);
 if(!parent)return [];
 const history=row?.reconciliation?.movementHistory??row?.account?.movementHistory??[];
 const fromLedger=history.filter(e=>ctCode(e?.to)===parent&&Number(e.amount)>0).map(e=>e.from);
 const fromHub=(parentHubFact?.hubContract?.movements?.rows??[])
  .filter(e=>ctCode(e?.to)===parent&&Number(e.amount)>0).map(e=>e.from);
 const forbidden=new Set([ctCode(row?.ct??row?.cells?.contractTotal),parent]);
 const facts=parentHubFact?.hubContract,upgrades=upgradeEdges([facts,...(facts?.relatedFinance??[])]).filter(e=>e.to===parent).map(e=>e.from);
 return unique([...fromLedger,...fromHub,...upgrades,...manual]).filter(ct=>!forbidden.has(ct));
}
export function isOriginalPaymentSource(row,parentCt,parentHubFact=null,manual=[]){
 const ct=ctCode(parentCt),facts=parentHubFact?.hubContract;
 if(!ct||facts?.ct!==ct||facts.payments?.state!=='read'||upstreamCandidates(row,ct,parentHubFact,manual).length)return false;
 const outgoing=new Set((facts.movements?.rows??[]).filter(m=>m.direction==='out').map(m=>m.reference));
 return facts.payments.rows.some(p=>p.complete===true&&p.amount>0&&p.completeDate&&!outgoing.has(p.code)&&p.typeId!=='10'&&!/transfer|moving|deposit to contract|^other$/i.test((p.method+' '+p.type).trim()));
}
export function originPaymentSummary(facts){
 const seen=new Set(),results=[];
 for(const fact of facts??[]){
  for(const p of fact?.hubContract?.payments?.rows??[]){
   const key=String(fact.ct)+'|'+String(p.id??p.code);
   if(seen.has(key))continue;seen.add(key);
   results.push({ct:fact.ct,paymentCode:p.code,amount:p.complete===true?p.amount:null,complete:p.complete===true});
  }
 }
 return {payments:results,hubPaid:results.reduce((s,p)=>s+(p.amount??0),0)};
}
