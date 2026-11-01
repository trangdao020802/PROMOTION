const CT=/^[A-Z0-9]+-CT-\d{4,20}$/;
export const ctCode=value=>{
 const v=String(value??'').trim().toUpperCase();
 return CT.test(v)?v:null;
};
export const ancestryKey=({datasetId,masterCt,student,parentCt})=>
 ['hub-upstream',String(datasetId),String(masterCt),String(student),String(parentCt)].join('|');
const unique=items=>[...new Set(items.map(ctCode).filter(Boolean))];
export function upstreamCandidates(row,parentCt,parentHubFact=null,manual=[]){
 const parent=ctCode(parentCt);
 if(!parent)return [];
 const history=row?.reconciliation?.movementHistory??row?.account?.movementHistory??[];
 const fromLedger=history.filter(e=>ctCode(e?.to)===parent&&Number(e.amount)>0).map(e=>e.from);
 const fromHub=(parentHubFact?.hubContract?.movements?.rows??[])
  .filter(e=>ctCode(e?.to)===parent&&Number(e.amount)>0).map(e=>e.from);
 const forbidden=new Set([ctCode(row?.ct??row?.cells?.contractTotal),parent]);
 return unique([...fromLedger,...fromHub,...manual]).filter(ct=>!forbidden.has(ct));
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
