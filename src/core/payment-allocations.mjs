// Read-only presentation of allocation evidence. This never creates cash or
// changes the funded balances used by reconciliation.
const key=e=>JSON.stringify([e.payment,e.from,e.to]);
const order=(a,b)=>a.date-b.date||String(a.payment??a.id).localeCompare(String(b.payment??b.id));
const unique=a=>[...new Set(a)];
const same=(a,b)=>Math.abs(a-b)<=1;

export function paymentAllocations(row){
 const ct=String(row.cells?.contractTotal??'');
 const receipts=row.receipts??[],documents=new Map(receipts.map(r=>[r.id,r]));
 const cutoff=row.reconciliation?.cutoff??Infinity,moves=new Map();
 // Prefer the original positive transfer over the signed outgoing ledger view.
 for(const e of [...(row.reconciliation?.movementHistory??[]),...(row.reconciliation?.events??[])]){
  if(!e.from||!e.to||!Number.isFinite(e.amount)||e.date>=cutoff+1)continue;
  if(e.amount<0){
   if(e.from===ct){const previous=moves.get(key(e));moves.set(key(e),{...e,...previous,amount:previous?.amount??Math.abs(e.amount),debit:Math.abs(e.amount)});}
   continue;
  }
  if(!moves.has(key(e)))moves.set(key(e),{...e});
 }
 const events=[...moves.values()].sort(order),incoming=events.filter(e=>e.to===ct&&e.from!==ct);
 const confirmed=incoming.filter(e=>e.invoiceBacked===true&&e.invoiceIds?.length&&e.invoiceIds.every(id=>documents.get(id)?.verified));
 const invoiceIds=unique(incoming.flatMap(e=>e.invoiceIds??[]));
 const invoices=invoiceIds.filter(id=>documents.has(id)).map(id=>{
  const receipt=documents.get(id),adjacent=new Map();
  for(const e of events.filter(e=>e.invoiceBacked&&e.invoiceIds?.includes(id))){
   const list=adjacent.get(e.from)??[];list.push(e);adjacent.set(e.from,list);
  }
  const paths=[],warnings=new Set();let visited=0;
  const walk=(code,date,path,codes)=>{
   if(++visited>2000||path.length>=32||paths.length>=64){warnings.add('Luồng dài; chưa hiển thị hết căn cứ.');return;}
   for(const e of adjacent.get(code)??[]){
    if(Math.floor(e.date)<Math.floor(date))continue;
    if(codes.has(e.to)){warnings.add('Có luồng chuyển vòng; cần đối chiếu Transfer.');continue;}
    const next=[...path,e];
    if(e.to===ct){paths.push(next);continue;}
    walk(e.to,e.date,next,new Set([...codes,e.to]));
   }
  };
  walk(receipt.contract,receipt.date,[],new Set([receipt.contract]));
  const terminals=confirmed.filter(e=>e.invoiceIds?.includes(id));
  const reached=new Set(paths.map(p=>key(p.at(-1))));
  if(!paths.length||terminals.some(e=>!reached.has(key(e))))warnings.add('Chưa truy vết đủ đường từ hóa đơn gốc đến CT nhận tiền.');
  let amount=null;
  if(receipt.verified&&terminals.length&&!warnings.size&&terminals.every(e=>e.invoiceIds.length===1)){
   const total=terminals.reduce((n,e)=>n+e.amount,0);
   if(total<=receipt.amount+1)amount=total;
   else warnings.add('Phân bổ liên quan vượt giá trị hóa đơn; không cộng lặp các vòng chuyển.');
  }
  return {id,receipt,amount,paths,terminalKeys:terminals.map(key),warnings:[...warnings]};
 }).sort((a,b)=>order(a.receipt,b.receipt));
 // An entire invoice pool arriving at this CT proves each original amount.
 // A partial mixed pool has no FIFO/pro-rata rule: leave each share unknown.
 const seen=new Set();
 for(const first of confirmed){
  if(seen.has(key(first)))continue;
  const group=[first],ids=new Set(first.invoiceIds??[]);seen.add(key(first));
  for(let i=0;i<group.length;i++)for(const e of confirmed){
   if(seen.has(key(e))||!e.invoiceIds?.some(id=>ids.has(id)))continue;
   seen.add(key(e));group.push(e);for(const id of e.invoiceIds)ids.add(id);
  }
  const roots=[...ids].map(id=>invoices.find(r=>r.id===id));
  if(roots.length&&roots.every(r=>r?.receipt.verified&&r.receipt.amount>0&&!r.warnings.length)&&
    same(group.reduce((n,e)=>n+e.amount,0),roots.reduce((n,r)=>n+r.receipt.amount,0))){
   for(const root of roots)root.amount=root.receipt.amount;
  }
 }
 for(const invoice of invoices)if(invoice.amount===null&&!invoice.warnings.length)invoice.warnings.push('Nguồn tiền trộn nhiều hóa đơn; chưa đủ căn cứ tách số phân bổ của từng hóa đơn.');
 const assigned=new Set(invoices.map(r=>r.id));
 return {ct,invoices,originals:receipts.filter(r=>!assigned.has(r.id)),
  incoming,total:confirmed.reduce((n,e)=>n+e.amount,0),
  dates:unique(incoming.map(e=>Math.floor(e.date))).sort((a,b)=>a-b),
  pending:incoming.filter(e=>!confirmed.includes(e)),
  outgoing:events.filter(e=>e.from===ct&&e.to!==ct),
  warnings:unique(invoices.flatMap(r=>r.warnings))};
}
