import {validateHubContract} from './hub-contract.mjs';
export function financeBundle(facts){
 if(!validateHubContract(facts)||!facts.relatedFinance?.length)return [];
 const docs=new Map([[facts.ct,facts],...facts.relatedFinance.map(f=>[f.ct,f])]),known=new Set([facts.ct]);
 for(let depth=0;depth<16;depth++){
  const before=known.size;
  for(const ct of [...known])for(const m of docs.get(ct)?.movements?.rows??[])if(m.to===ct&&m.amount>0)known.add(m.from);
  if(before===known.size)break;
 }
 return facts.relatedFinance.filter(f=>known.has(f.ct)).map(hubContract=>({ct:hubContract.ct,url:'https://hub24.apollo.vn:7777/'+(hubContract.ct.includes('-DEP-')?'deposit':'contract')+'/detail/'+hubContract.contractId,hubContract}));
}
