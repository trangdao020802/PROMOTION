import test from 'node:test';import assert from 'node:assert/strict';
import {buildModel} from '../src/local/model.mjs';import {AuditEngine} from '../src/local/calculation.mjs';import {policyData} from '../scripts/policy-data.mjs';
import {dateSerial} from '../src/core/verification.mjs';import {resolveTransferCourseInfo} from '../src/core/course-info.mjs';
import {fillContractInputs,coursePayload,courseReadComplete} from '../src/core/hub-course.mjs';import {projectContractDetail,parseContractDetailProjection} from '../src/core/hub-course-network.mjs';
import {inputTargets,newInputRun,completeInputRun} from '../src/core/hub-input-progress.mjs';import {projectHubContract} from '../src/core/hub-contract.mjs';
const old='QA2610-CT-000711',ct='QA2610-CT-000722',student='QA-CENTER-MOVE',offer='2026 October - Promotion Discount - 12 months';
const fields={H:'ATLS - New Price 2026 - Layer 1',I:'3 hrs/week',J:'12 months',K:'0',L:offer};
function bundle({blank=false}={}){
 const cells={B:'Center cũ',C:'QA1',D:'QA2610-PAY-000711',E:old,R:student,S:'HỌC VIÊN CHUYỂN CENTER GIẢ',O:dateSerial('2026-10-03'),P:'QA711',I:'Paid',F:'Payment',G:'New',X:'ATLS',AH:'Online Payments',Z:blank?'':fields.H,AA:blank?'':fields.I,AB:blank?'':fields.J,AO:blank?'':fields.K,AQ:blank?'':fields.L,AC:38700000,AD:3870000,AE:0,AF:34830000,AG:150};
 const r={sourceKey:'p',sourceRow:2,cells};return {kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:dateSerial('2026-10-31'),records:[r],cash:[r],transfers:[{sourceKey:'t',sourceRow:2,type:'Transfer',date:dateSerial('2026-10-10'),fromStudent:student,toStudent:student,from:old,to:ct,out:34830000,amount:34830000}],exports:[{sourceKey:'e',sourceRow:2,ct,student,target:34830000,paid:34830000,center:'QA2',centerName:'Center mới',contractType:'New',totalHours:150}],sources:[['p','payment'],['e','export'],['t','transfer']].map(([key,role],fileIndex)=>({key,role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
}
test('an empty receiving course uses its fully transferred same-student course once, preserving center, cash and source evidence',()=>{
 const data=buildModel(bundle(),policyData()),g=data.contractGroups[0],engine=new AuditEngine(data),row=engine.calculate({id:g.id});
 assert.equal(data.contractGroups.length,1);assert.equal(g.ct,ct);assert.deepEqual(g.sourceContracts,[old]);assert.equal(row.cells.F,student);assert.equal(row.cells.B,'QA2');
 for(const [key,value]of Object.entries(fields))assert.equal(row.cells[key],value);
 assert.deepEqual(row.courseInfo.originContracts,[old]);assert.ok(row.courseInfo.fields.H.every(f=>f.inheritedFrom===old&&f.ref.contract===old));
 assert.equal(row.cells.M,38700000);assert.equal(row.cells.N,3870000);assert.equal(row.cells.Q,34830000);assert.equal(row.cells.W,34830000);assert.equal(row.cells.AC,0);assert.equal(row.receipts.length,1);
 const manual=engine.calculate({id:g.id},{J:'6 months'});assert.equal(manual.cells.J,'6 months');assert.equal(manual.cells.contractTotal,ct);
});
test('cached Hub course facts can supply a proved transferred CT; unrelated CTs and students cannot',()=>{
 const create=()=>new AuditEngine(buildModel(bundle({blank:true}),policyData())),source={ct:old,student,url:'https://hub24.apollo.vn:7777/contract/detail/711',courseFee:fields.H,hoursPerWeek:fields.I,package:fields.J,giftcode:'0',discount:offer};
 for(const bad of [{...source,ct:'QA2610-CT-009999'},{...source,student:'QA-OTHER'}]){const e=create();e.setCourseSources([bad]);assert.equal(e.calculate({id:'CT::'+ct}).cells.H,null);}
 const e=create();e.setCourseSources([source]);assert.equal(e.calculate({id:'CT::'+ct}).cells.Q,34830000);
 e.updateCourseSource({...source,package:'6 months'});assert.equal(e.calculate({id:'CT::'+ct}).cells.J,'6 months');
});
test('a receiving course keeps its own explicit offers, and conflicting transferred packages remain unresolved',()=>{
 const donor={...fields,contract:old,ref:{file:'QA source',contract:old}};
 const own=resolveTransferCourseInfo([{...fields,K:'0',L:'0'}],[{...donor,K:'QA-CODE',L:offer}]);assert.equal(own.values.K,'0');assert.equal(own.values.L,'0');assert.deepEqual(own.originContracts,[]);
 const conflict=resolveTransferCourseInfo([],[donor,{...donor,contract:'QA2610-CT-000733',J:'6 months'}]);assert.equal(conflict.values.J,null);assert.equal(conflict.complete,false);assert.ok(conflict.warnings.some(m=>m.startsWith('J:')));
 const incompatible=resolveTransferCourseInfo([{H:'ATLS New Price 2026 Layer 2'}],[donor]);assert.equal(incompatible.values.I,null);assert.equal(incompatible.values.J,null);
});
test('a verified empty ListCourseInfo finishes promptly as empty evidence, never as a zero-priced course',()=>{
 const expected={ct,student,url:'https://hub24.apollo.vn:7777/contract/detail/722'},root={ContractId:722,ContractNo:ct,StudentCode:student,ListCourseInfo:[],ListDiscount:[],ListGiftCode:[]};
 const p=projectContractDetail(root,'https://hub24.apollo.vn:7777/qa/GetContractDetail?contractId=722',expected.url),result=parseContractDetailProjection(p,expected);
 assert.equal(result.payload.courseState,'empty');assert.equal(result.payload.courseFee,null);assert.equal(result.payload.discount,null);assert.equal(courseReadComplete(result.payload),true);
 assert.equal(coursePayload({...expected,courseState:'empty'},expected),null);
});
test('bulk input reads the proved source CT in the same workflow, retains both identities and checkpoints inherited fields',async()=>{
 const expected={ct,student,url:'https://hub24.apollo.vn:7777/contract/detail/722'},donor={ct:old,student,url:'https://hub24.apollo.vn:7777/contract/detail/711',courseFee:fields.H,hoursPerWeek:fields.I,package:fields.J,giftcode:'0',discount:offer};
 const facts=projectHubContract({ContractId:722,ContractNo:ct,ListDiscount:[]},{payments:[],paymentState:'read'}),empty={...expected,courseState:'empty',hubContract:facts},row={id:'CT::'+ct,ct,kind:'contract',sourceContracts:[old],cells:{F:student,G:'HỌC VIÊN GIẢ',contractTotal:ct}},reads=[];let saved;
 const result=await fillContractInputs([row],{loadLink:async code=>({url:code===ct?expected.url:donor.url}),read:async request=>{reads.push(request.ct);return request.ct===ct?empty:donor;},save:async(r,p)=>{saved=p;return {source:p};}});
 assert.equal(result[0].status,'saved');assert.deepEqual(reads,[ct,old]);assert.equal(saved.ct,ct);assert.equal(saved.inheritedCourses[0].ct,old);assert.equal(saved.inheritedCourses[0].student,student);
 const run=newInputRun(null,inputTargets([row],true,{facts:true}),true,'qa-transfer');assert.equal(completeInputRun(run,ct,student,saved).complete,true);
 assert.equal(completeInputRun(run,ct,student,{...saved,inheritedReadComplete:false}).complete,false);
 assert.equal(coursePayload({...saved,inheritedCourses:[{...donor,student:'OTHER'}]},expected),null);
});
