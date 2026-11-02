import {validateHubContract,mergeHubFinanceFacts} from './hub-contract.mjs';
import {validUpgradeLinks} from './hub-upgrade.mjs';
// Read only IDs observed in Upgrade from contract. The source response must
// independently confirm that ID and any already known CT code.
export async function readUpgradeFinance(facts,read,{signal,budgetMs=7000,maxDocuments=6,refresh=false}={}){
 if(!validateHubContract(facts))return facts;
 const copy=v=>JSON.parse(JSON.stringify(v));
 const start=Date.now(),docs=new Map([[facts.contractId,copy(facts)],...(facts.relatedFinance??[]).map(f=>[f.contractId,copy(f)])]),queue=[facts.contractId],seen=new Set();let reads=0;
 for(let i=0;i<queue.length&&seen.size<maxDocuments;i++){
  if(signal?.aborted||Date.now()-start>=budgetMs)break;
  const current=docs.get(queue[i]);if(!current||seen.has(current.contractId))continue;seen.add(current.contractId);
  for(const link of current.upgrades??[]){
   if(link.direction!=='from'||!validUpgradeLinks([link])||link.id===facts.contractId||signal?.aborted||Date.now()-start>=budgetMs)continue;
   let other=docs.get(link.id);
   if((refresh||!other||other.payments?.state!=='read')&&reads<maxDocuments)try{
    reads++;
    const value=await read({...link},Math.max(1,budgetMs-(Date.now()-start)));
    if(!signal?.aborted&&validateHubContract(value)&&value.contractId===link.id&&(!link.ct||value.ct===link.ct))other=other?mergeHubFinanceFacts(value,other):value;
   }catch{}
   if(!other||other.contractId!==link.id||link.ct&&other.ct!==link.ct||other.ct===current.ct)continue;
   link.ct=other.ct;const doc={...other,discounts:null};delete doc.relatedFinance;docs.set(link.id,doc);queue.push(link.id);
  }
 }
 const result=docs.get(facts.contractId),related=[...docs.values()].filter(f=>f.contractId!==facts.contractId).map(f=>{const d={...f,discounts:null};delete d.relatedFinance;return d;});
 if(related.length)result.relatedFinance=related.slice(0,32);
 return validateHubContract(result)?result:facts;
}
