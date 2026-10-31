import test from 'node:test';import assert from 'node:assert/strict';
import {calculationSignature,makeSnapshot,validSnapshot,sourceMemory,sourceKey,progressNote,rememberProgress,recalledProgress} from '../src/core/contract-memory.mjs';
const fixture=()=>{const ct='QA2610-CT-000004',row={id:'CT::'+ct,ct,kind:'contract',cells:{F:'QA-STUDENT',G:'Dữ liệu kiểm thử',B:'QA1',H:'ATLS 2026 Layer 1',I:'3 hrs/week',J:'12 months',K:'QA-CODE',L:'Offer',Q:34830000,contractTotal:ct}},group={id:row.id,ct,cells:{...row.cells,Q:undefined},raw:{AH:'Online Payments',AJ:0},account:{net:34830000,events:[]}};return {row,data:{dataset:{id:'QA-DATA'},cutoff:46000,policy:{policyRevision:'QA-v1',prices:[{gross:38700000,discount:3870000}]},contractGroups:[group],extensions:{customVouchers:[{code:'QA-CODE',rate:.1,status:'APPROVED'}]}}};};
test('a stored whole-contract result is restored only for the same student and every financial input',async()=>{
 const {row,data}=fixture(),snapshot=await makeSnapshot(data,row,{});assert.equal(snapshot.studentName,row.cells.G);assert.ok(await validSnapshot(snapshot,data,row,{}));assert.ok(await validSnapshot(snapshot,structuredClone(data),structuredClone(row),{}));
 const mutations=[d=>d.contractGroups[0].cells.H+=' Layer 2',d=>d.contractGroups[0].cells.I='4 hrs/week',d=>d.contractGroups[0].cells.J='18 months',d=>d.contractGroups[0].cells.K='OTHER',d=>d.contractGroups[0].cells.L='Other offer',d=>d.contractGroups[0].cells.G='Tên đã đổi',d=>d.contractGroups[0].raw.AH='Installment',d=>d.contractGroups[0].raw.AJ=12,d=>d.contractGroups[0].account.net-=1000,d=>d.policy.prices[0].discount+=1000,d=>d.extensions.customVouchers[0].rate=.2,d=>d.cutoff++];
 for(const mutate of mutations){const copy=structuredClone(data);mutate(copy);assert.equal(await validSnapshot(snapshot,copy,row,{}),false);}
 assert.equal(await validSnapshot(snapshot,data,{...row,cells:{...row.cells,F:'QA-OTHER'}},{}),false);
 assert.equal(await validSnapshot(snapshot,data,row,{[row.id]:{L:'0'}}),false);assert.equal(await validSnapshot(snapshot,data,row,{[row.id]:{approved:true}}),false);
 const unrelated=structuredClone(data);unrelated.extensions.customVouchers.push({code:'UNRELATED',rate:.2});assert.equal(await calculationSignature(unrelated,row),snapshot.signature);
});
test('course memories keep both students under a CT and prefer a scoped record over its legacy entry',()=>{
 const ct='QA2610-CT-000004',old={id:ct,ct,student:'QA-A',discount:'Old',version:8},fresh={...old,id:sourceKey(ct,'QA-A'),discount:'New',version:1},other={...fresh,id:sourceKey(ct,'QA-B'),student:'QA-B',discount:'Other'};
 const sources=sourceMemory([fresh,old,other]);assert.equal(sources.length,2);assert.equal(sources.find(s=>s.student==='QA-A').discount,'New');assert.equal(sources.find(s=>s.student==='QA-B').discount,'Other');
});
test('the last active CT and exact progress survive reconstruction without claiming an interrupted job is running',()=>{
 const run={targets:[{ct:'QA2610-CT-000004',student:'QA-STUDENT'}]},note=progressNote({state:'running',ct:run.targets[0].ct,student:'QA-STUDENT',studentName:'Dữ liệu kiểm thử',index:1,message:'Đang đọc Course info QA2610-CT-000004 trong nền…'},run);assert.ok(note);assert.equal(progressNote({...note,student:'OTHER'},run),null);
 const values=new Map(),prior=globalThis.localStorage;globalThis.localStorage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)};
 try{rememberProgress('QA-DATA',{...note,runId:'QA-RUN'});const restored=recalledProgress('QA-DATA');assert.equal(restored.ct,note.ct);assert.equal(restored.message,note.message);assert.equal(recalledProgress('OTHER'),null);}finally{globalThis.localStorage=prior;}
});
