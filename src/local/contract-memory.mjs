import {all,get,put} from './db.mjs';
import {sourceKey,sourceMemory,makeSnapshot,validSnapshot,snapshotKey} from '../core/contract-memory.mjs';
export const courseMemories=async()=>sourceMemory(await all('courseSources'));
export async function courseMemory(ct,student){const exact=await get('courseSources',sourceKey(ct,student));if(exact)return exact;const legacy=await get('courseSources',ct);return legacy?.student===student?legacy:null;}
export async function rememberCalculation(data,row,patches){const snapshot=await makeSnapshot(data,row,patches);await put('recordSnapshots',snapshot);return snapshot;}
export async function calculationMemories(data,records,patches){
 const snapshots=new Map((await all('recordSnapshots')).map(s=>[s.id,s]));let count=0;
 const rows=await Promise.all(records.map(async row=>{const snapshot=snapshots.get(snapshotKey(data.dataset?.id??data.hash,row));if(await validSnapshot(snapshot,data,row,patches)){count++;return snapshot.row;}return row;}));
 return {rows,count};
}
