import test from 'node:test';
import assert from 'node:assert/strict';
import {inputTargets,validInputTargets,newInputRun,completeInputRun,completedInputs,inputKey} from '../src/core/hub-input-progress.mjs';
import {contractInputPlan} from '../src/core/hub-course.mjs';
const ct='QA2610-CT-000004',student='QA-PROGRESS',row={ct,kind:'contract',cells:{F:student,contractTotal:ct,H:'Price name',I:'3 hrs/week',J:'2 months',K:null,L:null,U:100,V:100}};
test('resume checkpoints are scoped by CT/student and survive refresh-all mode',()=>{
 const targets=inputTargets([row],true);assert.deepEqual(targets[0].required,['courseFee','hoursPerWeek','package','giftcode','discount']);assert.ok(validInputTargets(targets));
 let run=newInputRun(null,targets,true,'qa-first');const source={ct,student,courseFee:'Price name',hoursPerWeek:'3 hrs/week',package:'2 months',giftcode:'QA-FULL-CODE',discount:'Offer'};
 run=completeInputRun(run,ct,student,source).run;const restored=JSON.parse(JSON.stringify(run));assert.deepEqual(completedInputs(restored,true),[inputKey(ct,student)]);assert.equal(contractInputPlan([row],{refresh:true,completed:restored.completed}).length,0);
 const other={...row,cells:{...row.cells,F:'QA-OTHER'}};assert.equal(contractInputPlan([other],{refresh:true,completed:restored.completed}).length,1);
 const continued=newInputRun(restored,targets,true,'qa-next');assert.equal(continued.runId,'qa-first');assert.equal(continued.completed.length,1);
 assert.equal(newInputRun(restored,targets,true,'qa-reset',true).completed.length,0);assert.equal(newInputRun(restored,targets,false,'qa-mode').completed.length,0);
});
test('a partial or wrong-student source cannot remove a CT from the remaining queue',()=>{
 const targets=inputTargets([row],false),run=newInputRun(null,targets,false,'qa-partial');assert.deepEqual(targets[0].required,['giftcode','discount']);
 const partial=completeInputRun(run,ct,student,{ct,student,giftcode:'QA-FULL-CODE',discount:null});assert.equal(partial.complete,false);assert.deepEqual(partial.missing,['discount']);assert.deepEqual(partial.run.completed,[]);
 const wrong=completeInputRun(run,ct,student,{ct,student:'QA-OTHER',giftcode:'0',discount:'0'});assert.equal(wrong.complete,false);assert.equal(wrong.run.completed.length,0);
 assert.equal(completeInputRun(run,ct,student,{ct,student,giftcode:'0',discount:'0'}).complete,true);
});
test('progress rejects duplicate, malformed and unrecognized targets',()=>{
 const target=inputTargets([row],true)[0];for(const targets of [[],[target,target],[{...target,ct:'DEP-123'}],[{...target,student:''}],[{...target,required:['approved']}],[{...target,required:[]}]])assert.equal(validInputTargets(targets),false);
});
