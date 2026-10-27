// Parent identity follows proved, fully moved funding. Course text, edited
// fields and a shared Student ID alone never join two contracts.
const isCT=value=>/-CT-/i.test(value??'');
const same=(a,b)=>Math.abs(a-b)<=1;

export function contractSettlements(input,accounts,{cash,transfers,funded}){
 const students=new Map(),outgoing=new Map(),next=new Map(),previous=new Map();
 const addStudent=(code,student)=>{
  if(!code||!String(student??'').trim())return;
  const values=students.get(code)??new Set();values.add(String(student).trim());students.set(code,values);
 };
 for(const row of [...(input.paid??[]),...(input.snapshots??[])])addStudent(row.ct,row.student);
 for(const row of cash)addStudent(row.contract,row.student);
 for(const row of input.records??[])addStudent(row.contract,row.student);
 for(const move of transfers){
  addStudent(move.from,move.fromStudent);addStudent(move.to,move.toStudent);
  const list=outgoing.get(move.from)??[];list.push(move);outgoing.set(move.from,list);
  if(!isCT(move.from)||!isCT(move.to)||!(move.out>0)||!(move.amount>0))continue;
  const targets=next.get(move.from)??new Set();targets.add(move.to);next.set(move.from,targets);
  const origins=previous.get(move.to)??new Set();origins.add(move.from);previous.set(move.to,origins);
 }
 const student=code=>students.get(code)?.size===1?[...students.get(code)][0]:null;
 // Remove sinks to find cycles and all paths that could lead into a cycle.
 // A returned/reversed transfer must never retire another course by accident.
 const nodes=new Set([...next.keys(),...previous.keys()]),degree=new Map([...nodes].map(code=>[code,next.get(code)?.size??0]));
 const queue=[...nodes].filter(code=>degree.get(code)===0),safe=new Set();
 for(let i=0;i<queue.length;i++){
  const code=queue[i];safe.add(code);
  for(const origin of previous.get(code)??[]){const count=degree.get(origin)-1;degree.set(origin,count);if(count===0)queue.push(origin);}
 }
 const exhausted=new Map();
 for(const [ct,account]of Object.entries(accounts.contracts??{})){
  const moves=outgoing.get(ct)??[],owner=student(ct),events=account.events??[];
  if(!owner||!safe.has(ct)||!moves.length||!same(account.net,0)||!events.some(e=>e.amount>1)||events.some(e=>e.invoiceBacked!==true))continue;
  if(moves.some(m=>!isCT(m.to)||!(m.out>1)||!(m.amount>1)||!same(m.out,m.amount)||!funded.has(m.id)||student(m.to)!==owner))continue;
  const targets=[...new Set(moves.map(m=>m.to))];
  if(targets.length===1)exhausted.set(ct,{next:targets[0],student:owner});
 }
 const aliases={};
 for(const [origin,first]of exhausted){
  let target=first.next;const seen=new Set([origin]);
  while(exhausted.has(target)&&!seen.has(target)){seen.add(target);target=exhausted.get(target).next;}
  const account=accounts.contracts?.[target];
  if(seen.has(target)||!safe.has(target)||!account||student(target)!==first.student)continue;
  // A zero-balance node whose remaining transfers are ambiguous stays visible
  // for verification; an active, partially retained destination is a real CT.
  if((outgoing.get(target)?.length??0)>0&&same(account.net,0))continue;
  aliases[origin]={target,student:first.student};
 }
 return aliases;
}
