// Read-only payment lineage. Traversal never creates a receipt, a CT identity,
// a funded movement or an eligibility decision.
const order=(a,b)=>a.date-b.date||String(a.payment??a.id??'').localeCompare(String(b.payment??b.id??''));
export function upstreamTransfers(ct,movements){
 const incoming=new Map();
 for(const movement of movements){const list=incoming.get(movement.to)??[];list.push(movement);incoming.set(movement.to,list);}
 const seen=new Set(),queue=[ct],result=[];
 for(let i=0;i<queue.length;i++){
  const code=queue[i];if(seen.has(code))continue;seen.add(code);
  for(const movement of incoming.get(code)??[]){result.push(movement);if(!seen.has(movement.from))queue.push(movement.from);}
 }
 return result.sort(order);
}
export function paymentBranches(row){
 const ct=row.cells.contractTotal;if(!ct)return [];
 const events=row.reconciliation?.events??[],byId=new Map();
 for(const event of [...events,...(row.reconciliation?.movementHistory??[])]){
  if(!event.from||!event.to)continue;
  const key=JSON.stringify([event.payment,event.from,event.to]);if(!byId.has(key))byId.set(key,event);
 }
 const incoming=new Map();
 for(const event of byId.values()){const list=incoming.get(event.to)??[];list.push(event);incoming.set(event.to,list);}
 let expanded=0;
 const tree=(target,path)=>{
  const groups=new Map();
  for(const event of incoming.get(target)??[]){const list=groups.get(event.from)??[];list.push(event);groups.set(event.from,list);}
  return [...groups].map(([code,list])=>{
   list.sort(order);const cycle=path.has(code),next=new Set([...path,code]),truncated=!cycle&&(path.size>=32||expanded>=2000)&&incoming.has(code);expanded++;
   return {code,date:list[0].date,amount:list.reduce((n,e)=>n+Math.abs(e.amount),0),fundedAmount:list.filter(e=>e.invoiceBacked).reduce((n,e)=>n+Math.abs(e.amount),0),invoiceBacked:list.every(e=>e.invoiceBacked),invoiceIds:[...new Set(list.flatMap(e=>e.invoiceIds??[]))],events:list,cycle,truncated,children:cycle||truncated?[]:tree(code,next)};
  }).sort((a,b)=>a.date-b.date);
 };
 return tree(ct,new Set([ct]));
}

// Source-to-destination rows for Payment info. A movement is displayed once per
// immediate contributing branch, even when several invoices back that movement.
// Its original amount is never divided or promoted into a new cash document.
export function paymentFlows(row){
 const documents=row.receipts??[];
 return paymentBranches(row).map(branch=>{
  const steps=[],receipts=new Set(),movements=new Set();
  const visit=node=>{
   if(node.cycle||node.truncated){steps.push({kind:'notice',code:node.code,cycle:node.cycle,truncated:node.truncated});return;}
   for(const child of node.children)visit(child);
   for(const receipt of documents.filter(d=>d.contract===node.code))if(!receipts.has(receipt.id)){
    receipts.add(receipt.id);steps.push({kind:'receipt',receipt});
   }
   for(const event of node.events){
    const key=JSON.stringify([event.payment,event.from,event.to]);if(movements.has(key))continue;movements.add(key);
    const invoices=documents.filter(d=>event.invoiceIds?.includes(d.id));
    steps.push({kind:'transfer',event,invoices});
   }
  };
  visit(branch);
  return {code:branch.code,amount:branch.amount,fundedAmount:branch.fundedAmount,invoiceBacked:branch.invoiceBacked,steps};
 });
}
