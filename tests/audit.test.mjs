import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {policyData} from '../scripts/policy-data.mjs';
import {buildModel} from '../src/local/model.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {parseCsv,autoMap,normalizeSheet,buildBundle,validateBundle,parseDate,parseXlsx} from '../src/core/source-parser.mjs';
import {unionTransfers} from '../src/core/reconcile.mjs';
const p=policyData(),day=parseDate('2026-10-10');
export function fixture(){
 const source=(key,role,fileIndex)=>({key,role,fileIndex,fileName:key+'.csv',sheetName:'CSV',headerRow:1,rowCount:1});
 const cells={B:'Hà Nội',C:'HN1',D:'HN2610-PAY-0001',E:'HN2610-CT-0001',R:'ST001',S:'Học viên kiểm thử',O:day,P:'001',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'ATLS - New Price 2026 - Layer 1',AA:'4 hrs/week',AB:'24 months',AQ:'Q4 2026 Promotion Discount',AH:'Installment',AJ:'12 month',AC:103200000,AD:27864000,AE:0,AF:75336000,AG:400};
 const row={sourceKey:'p',sourceRow:2,cells};
 return {kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:'HN1'},cutoff:parseDate('2026-10-31'),records:[row],cash:[row],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:cells.E,student:cells.R,target:75336000,paid:75336000,courseFee:cells.Z,hoursPerWeek:cells.AA,package:cells.AB,totalHours:400,contractType:'New',center:'HN1'}],sources:[source('p','payment',0),source('e','export',1),source('t','transfer',2)]};
}
const engineFor=b=>new AuditEngine(buildModel(b,p));
const proof={registrationDate:'2026-10-10',placementDate:'2026-10-10',evidenceIds:['00000000-0000-4000-8000-000000000001']};
const calc=(b,patch={})=>{const e=engineFor(b);return e.calculate({id:e.data.contractGroups[0].id},{verification:proof,...patch})};
test('recalculates one CT independently from Payment, Export and the roadmap',()=>{
 const b=fixture();assert.equal(validateBundle(b),null);const r=calc(b);
 assert.equal(r.cells.M,103200000);assert.equal(r.cells.N,27864000);assert.equal(r.cells.Q,75336000);assert.equal(r.cells.R,400);assert.equal(r.cells.S,12);assert.equal(r.cells.AF,'OK');
});
test('matching CALC and receipts clear the CT comparison while preserving trace warnings and other checks',()=>{
 const b=fixture();b.exports[0].paid-=2000;let r=calc(b);
 assert.equal(r.cells.Q,r.cells.W);assert.equal(r.cells.ctCheck,'OK');assert.equal(r.reconciliation.blocking,false);assert.equal(r.cells.AF,'OK');
 assert.ok(r.reconciliation.warnings.some(w=>w.includes('PAID_BY_CONTRACT')));
 r=calc(b,{K:'QA-UNAPPROVED'});assert.equal(r.cells.Q,null);assert.equal(r.cells.AF,'CHECK');assert.notEqual(r.cells.CI,'OK');
});
test('deduplicates the same invoice across files and leaves child course fields empty',()=>{
 const b=fixture();b.sources.push({...b.sources[0],key:'history',fileIndex:3});b.cash.push({...structuredClone(b.cash[0]),sourceKey:'history'});
 const r=calc(b);assert.equal(r.cells.W,75336000);assert.equal(r.receipts.length,1);assert.deepEqual(r.receipts[0].cells,{H:null,I:null,J:null});
});
test('funded old deposits are allocated once; missing historical cash remains CHECK',()=>{
 const b=fixture();b.cash[0].cells.AF=20000000;
 const old={sourceKey:'history',sourceRow:2,cells:{...structuredClone(b.cash[0].cells),D:'HN2609-PAY-0099',E:'HN2609-DEP-0099',P:'099',O:parseDate('2026-09-15'),AF:55336000,Z:'',AA:'',AB:''}};
 b.sources.push({...b.sources[0],key:'history',fileIndex:3});b.cash.push(old);
 b.transfers.push({sourceKey:'t',sourceRow:2,type:'Transfer',date:day,fromStudent:'ST001',toStudent:'ST001',from:old.cells.E,to:b.cash[0].cells.E,out:55336000,amount:55336000});
 let r=calc(b);assert.equal(r.cells.W,75336000);assert.equal(r.cells.Q,75336000);assert.equal(r.cells.P,55336000);assert.equal(r.receipts.length,2);
 b.cash.pop();r=calc(b);assert.equal(r.cells.W,20000000);assert.equal(r.cells.AF,'CHECK');assert.ok(r.reconciliation.warnings.some(w=>w.includes('hóa đơn thu gốc')));
});
test('Approved changes only the exceeded installment check and is reversible',()=>{
 const b=fixture();b.cash[0].cells.AJ='18 month';assert.equal(calc(b).cells.AE,'CHECK - VƯỢT KỲ');
 assert.equal(calc(b,{approved:true}).cells.AE,'OK');assert.equal(calc(b,{approved:true}).cells.AF,'OK');assert.equal(calc(b,{approved:false}).cells.AE,'CHECK - VƯỢT KỲ');
 b.cash[0].cells.AF-=1200;assert.equal(calc(b,{approved:true}).cells.AF,'CHECK');
 b.cash[0].cells.AO='NEW-CODE';const r=calc(b,{approved:true});assert.equal(r.cells.O,null);assert.equal(r.cells.AF,'CHECK');assert.ok(r.cells.CI.includes('CHƯA'));
});
test('same-day scholarship requires matching registration dates and evidence even after Approved',()=>{
 const b=fixture();
 let r=calc(b,{approved:true,verification:{}});
 assert.equal(r.verification.registrationRequired,true);assert.equal(r.verification.registrationVerified,false);assert.equal(r.cells.AF,'CHECK');
 r=calc(b,{approved:true,verification:{...proof,placementDate:'2026-10-09'}});
 assert.equal(r.verification.registrationVerified,false);assert.equal(r.cells.AF,'CHECK');
 r=calc(b,{approved:true,verification:{...proof,evidenceIds:[]}});
 assert.equal(r.verification.registrationVerified,false);assert.equal(r.cells.AF,'CHECK');
 r=calc(b,{approved:true});assert.equal(r.verification.registrationVerified,true);assert.equal(r.cells.AF,'OK');
});
test('unknown rules and missing data remain null; explicit zero is a number',()=>{
 const b=fixture();delete b.cash[0].cells.AD;let r=calc(b);assert.equal(r.cells.AA,null);assert.equal(r.cells.AF,'CHECK');
 r=calc(fixture(),{L:'Ưu đãi không có quy tắc'});assert.equal(r.cells.N,null);assert.equal(r.cells.Q,null);assert.equal(r.cells.AF,'CHECK');
 r=calc(fixture());assert.equal(r.cells.O,0);assert.equal(r.cells.AB,0);
});
test('approved voucher uses remaining tuition and validates student, center and window',()=>{
 const b=fixture();b.cash[0].cells.AO='COUPON-TEST';b.cash[0].cells.AE=10320000;b.cash[0].cells.AF=65016000;b.exports[0].target=b.exports[0].paid=65016000;
 const e=engineFor(b),v={code:'COUPON-TEST',label:'Test',studentId:'ST001',studentName:'Học viên kiểm thử',center:'HN1',startDate:'2026-10-01',endDate:'2026-10-31',status:'APPROVED',type:'percent',rate:.1,amount:null,minimum:0,maximum:0,approvalNote:'Phê duyệt kiểm thử'};
 e.setVouchers([v]);let r=e.calculate({id:e.data.contractGroups[0].id});assert.equal(r.cells.O,10320000);assert.equal(r.cells.Q,65016000);
 e.setVouchers([{...v,status:'PENDING'}]);r=e.calculate({id:e.data.contractGroups[0].id},{approved:true});assert.equal(r.cells.O,null);assert.equal(r.cells.AF,'CHECK');
 e.setVouchers([{...v,studentId:'OTHER'}]);r=e.calculate({id:e.data.contractGroups[0].id});assert.ok(r.cells.CI.includes('STUDENT'));
});
test('unlinked deposit keeps course fields empty and waits for verification',()=>{
 const b=fixture();b.cash[0].cells.E='HN2610-DEP-0001';const r=calc(b);assert.equal(r.kind,'unlinked');assert.equal(r.cells.H,null);assert.equal(r.cells.I,null);assert.equal(r.cells.J,null);assert.equal(r.cells.AF,'CHECK');
});
test('transfer deduplication preserves repeated movements within one source',()=>{
 const t={type:'Transfer',date:day,fromStudent:'A',from:'DEP',toStudent:'A',to:'CT',out:10,amount:10,ref:{file:'a',row:2}};
 assert.equal(unionTransfers([{rows:[t,t]},{rows:[t]}]).rows.length,2);
});
test('CSV mapping parses numeric and date values, rejects conflicting copies and requires all sources',()=>{
 const rows=parseCsv('Payment code,Contract code,Student ID,Invoice date,Final payment invoice amount\nHN2610-PAY-001,HN2610-CT-001,ST1,10/10/2026,"1.000.000"');
 const mapped=autoMap(rows,'payment'),normalized=normalizeSheet(rows,'payment',mapped);assert.equal(normalized.errors.length,0);assert.equal(normalized.records[0].cells.AF,1000000);
 const result=buildBundle([{...mapped,key:'p',fileName:'p.csv',sheetName:'CSV',fileIndex:0,role:'payment',...normalized}],{from:'2026-10-01',to:'2026-10-31',center:''});assert.equal(result.bundle,null);assert.ok(result.errors.some(e=>e.message.includes('Export')));
});
test('the public build contains rules only, without uploaded transaction files or legacy results',()=>{
 assert.ok(!fs.existsSync(new URL('../dist/sources',import.meta.url)));assert.ok(!fs.existsSync(new URL('../dist/data',import.meta.url)));
 const r=JSON.parse(fs.readFileSync(new URL('../dist/rules.json',import.meta.url)));assert.ok(r.roadmap.length);assert.ok(!('audit' in r));assert.ok(!('vouchers' in r));
});
