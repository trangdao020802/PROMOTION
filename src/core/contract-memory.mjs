// A record is identified by CT/student. Its outcome is bound to every relevant
// saved input, policy, source ledger, voucher and condition/dependency patch.
import {voucherForStudent} from './vouchers.mjs';
export const CALCULATION_REVISION=typeof __CALC_REVISION__==='string'?__CALC_REVISION__:'contract-memory-v1';
export const sourceKey=(ct,student)=>String(ct)+'|'+String(student);
export const snapshotKey=(datasetId,row)=>'record:'+String(datasetId||'policy-2026')+':'+sourceKey(row.ct||row.cells?.contractTotal||row.paymentCode,row.cells?.F);
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,canonical(value[k])])):value;
const policyFingerprints=new WeakMap();
async function digest(value){const text=JSON.stringify(canonical(value));if(!globalThis.crypto?.subtle)return text;const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));return Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');}
function policyFingerprint(policy){if(!policy||typeof policy!=='object')return digest(policy);let saved=policyFingerprints.get(policy);if(!saved||saved.revision!==policy.policyRevision){saved={revision:policy.policyRevision,pending:digest(policy)};policyFingerprints.set(policy,saved);}return saved.pending;}
export function sourceMemory(sources){
 const map=new Map();for(const source of sources??[]){const key=sourceKey(source.ct,source.student),prior=map.get(key);if(!prior||source.id===key&&prior.id!==key||source.id===prior.id&&String(source.updatedAt??'')>String(prior.updatedAt??''))map.set(key,source);}return [...map.values()];
}
export async function calculationSignature(data,row,patches={}){
 const group=data.contractGroups.find(g=>g.id===row.id);if(!group)return '';
 const dependencies=Object.entries(patches).filter(([id,p])=>id===row.id||String(p.verification?.partnerContract??'').toUpperCase()===group.ct||Object.values(patches[row.id]?.verification??{}).includes(data.contractGroups.find(g=>g.id===id)?.ct)).sort(([a],[b])=>a.localeCompare(b));
 const partner=patches[row.id]?.verification?.partnerContract,related=data.contractGroups.filter(g=>g.ct&&g.ct===partner).map(g=>({ct:g.ct,cells:g.cells,raw:g.raw,account:g.account,hubPolicy:g.hubPolicy}));
 const code=String(patches[row.id]?.K??group.cells.K??'').trim().toUpperCase(),vouchers=voucherForStudent(data.extensions?.customVouchers,code,group.cells.F,group.cells.G);
 // Published/imported policy packs are immutable. Share their digest across all
 // rows; hashing the full price catalogue for every CT made refresh quadratic.
 return digest({revision:CALCULATION_REVISION,dataset:data.dataset?.id??data.hash??'policy-2026',cutoff:data.cutoff,policy:await policyFingerprint(data.policy),ct:group.ct,student:String(group.cells.F),name:group.cells.G,cells:group.cells,raw:group.raw,account:group.account,courseInfo:group.courseInfo,hubPolicy:group.hubPolicy,hubContract:group.hubContract,hubReadMissing:group.hubReadMissing,patches:dependencies,related,vouchers});
}
export async function validSnapshot(snapshot,data,row,patches){return !!snapshot&&snapshot.schema==='contract-snapshot/v1'&&snapshot.id===snapshotKey(data.dataset?.id??data.hash,row)&&snapshot.ct===String(row.ct||row.cells?.contractTotal||row.paymentCode)&&snapshot.student===String(row.cells?.F)&&snapshot.row?.id===row.id&&String(snapshot.row.cells?.F)===String(row.cells?.F)&&snapshot.signature===await calculationSignature(data,row,patches);}
export async function makeSnapshot(data,row,patches){return {id:snapshotKey(data.dataset?.id??data.hash,row),schema:'contract-snapshot/v1',ct:String(row.ct||row.cells?.contractTotal||row.paymentCode),student:String(row.cells?.F),studentName:String(row.cells?.G??''),center:String(row.cells?.B??''),signature:await calculationSignature(data,row,patches),row,updatedAt:new Date().toISOString()};}
export function progressNote(value,run){
 if(!value||!['running','paused','complete','error'].includes(value.state)||typeof value.message!=='string'||value.message.length>1200||value.ct&&(!run.targets.some(t=>t.ct===value.ct&&t.student===value.student)))return null;
 return {state:value.state,message:value.message,ct:value.ct??null,student:value.student??null,studentName:String(value.studentName??'').slice(0,200),index:Number.isSafeInteger(value.index)?value.index:null,total:run.targets.length,updatedAt:new Date().toISOString()};
}
export const progressStorageKey=dataset=>'promotion-input-progress:'+String(dataset);
export function rememberProgress(dataset,note){try{globalThis.localStorage?.setItem(progressStorageKey(dataset),JSON.stringify(note));}catch{}}
export function recalledProgress(dataset){try{return JSON.parse(globalThis.localStorage?.getItem(progressStorageKey(dataset))||'null');}catch{return null;}}
