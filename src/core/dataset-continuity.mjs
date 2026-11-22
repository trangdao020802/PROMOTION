import {childFactKey,mergeChildFinancialFact} from './child-hub-evidence.mjs';
import {ancestryKey} from './hub-upstream.mjs';
import {validateHubContract} from './hub-contract.mjs';
// Course inputs, edits, vouchers and evidence already use CT/student keys.
// Only these finance facts are scoped to a batch and need a new identity.
export function inheritedFinanceSettings(settings,parentIds,groups,datasetId) {
 const parents=new Set(parentIds),contexts=new Set(groups.filter(g=>g.kind==='contract').map(g=>g.ct+'|'+String(g.cells.F))),result=new Map();
 for(const setting of [...settings].sort((a,b)=>String(a.updatedAt??'').localeCompare(String(b.updatedAt??'')))){
  if(!parents.has(setting.datasetId)||!contexts.has(setting.masterCt+'|'+setting.student))continue;
  const next={...setting,datasetId,version:1};
  if(setting.id.startsWith('hub-child-fact:')&&validateHubContract(setting.hubContract)){
   next.id=childFactKey(next);result.set(next.id,mergeChildFinancialFact(result.get(next.id),next));
  }else if(setting.id.startsWith('hub-upstream|')&&Array.isArray(setting.codes)){
   next.id=ancestryKey(next);next.codes=[...new Set([...(result.get(next.id)?.codes??[]),...next.codes])];result.set(next.id,next);
  }
 }
 return [...result.values()];
}
