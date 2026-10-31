import test from 'node:test';import assert from 'node:assert/strict';
import {hubFixture} from './helpers/hub-policy-fixture.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {buildModel} from '../src/local/model.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {dateSerial} from '../src/core/verification.mjs';
import {hubPriceCatalogue} from '../src/core/price-catalog.mjs';
import {priceFor} from '../src/core/price-resolver.mjs';
function fixture(){
 const f=hubFixture(),ct=f.detail.ContractNo,student='QA-POLICY',date=dateSerial('2026-10-10');
 const c={B:'QA CENTER',C:'QA1',D:'QA2610-PAY-000004',E:ct,R:student,S:'SYNTHETIC',O:date,P:'QA0004',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:f.cells.H,AA:f.cells.I,AB:f.cells.J,AQ:'',AO:'',AH:'Online Payments',AJ:'',AC:38700000,AD:3870000,AE:0,AF:34830000,AG:163},r={sourceKey:'p',sourceRow:2,cells:c};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:dateSerial('2026-10-31'),records:[r],cash:[r],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct,student,target:34830000,paid:34830000,totalHours:163,courseFee:c.Z,hoursPerWeek:c.AA,package:c.AB,contractType:'New',center:c.C}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 const policy=policyData(),engine=new AuditEngine(buildModel(bundle,policy)),record={id:'CT::'+ct},source={ct,student,url:'https://hub24.apollo.vn:7777/contract/detail/12345',courseFee:f.cells.H,hoursPerWeek:f.cells.I,package:f.cells.J,giftcode:'0',discount:f.cells.L,hubPolicy:f.policy};
 return {...f,engine,record,source,policy};
}
test('saving live lookup metadata recomputes independent fees/hours and uses the same schedule in the catalogue',()=>{
 const f=fixture();assert.equal(f.engine.calculate(f.record).cells.N,null);f.engine.updateCourseSource(f.source);const row=f.engine.calculate(f.record);
 assert.equal(row.cells.M,38700000);assert.equal(row.cells.N,3870000);assert.equal(row.cells.Q,34830000);assert.equal(row.cells.extraHours,12.5);assert.equal(row.cells.R,163);assert.equal(row.cells.AA,0);assert.equal(row.cells.AC,0);assert.equal(row.pricing.hub,true);assert.ok(row.hubPolicy);assert.equal(row.cells.AF,'CHECK'); // registration evidence remains required
 const catalogue=hubPriceCatalogue(f.policy,[f.source]);assert.equal(catalogue.length,1);assert.equal(catalogue[0].gross,row.cells.M);assert.equal(catalogue[0].discount,row.cells.N);assert.equal(catalogue[0].net,row.cells.Q);
 const manual=f.engine.calculate(f.record,{L:'0'});assert.equal(manual.cells.N,0);assert.notEqual(manual.cells.AC,0);
 const changed=f.engine.calculate(f.record,{H:'ATLS - New Price 2026 - Layer 2'});assert.notEqual(changed.pricing.hub,true);assert.equal(changed.cells.H,'ATLS - New Price 2026 - Layer 2');
});
test('receiving CT discount input immediately recalculates with the existing documented policy and no Hub price API',()=>{
 const f=fixture();delete f.source.hubPolicy;f.engine.updateCourseSource(f.source);const row=f.engine.calculate(f.record);
 assert.equal(row.cells.L,f.cells.L);assert.equal(row.cells.M,38700000);assert.equal(row.cells.N,3870000);assert.equal(row.cells.Q,34830000);assert.equal(row.cells.extraHours,12.5);assert.equal(row.cells.R,163);
 assert.notEqual(row.pricing.hub,true);assert.equal(row.cells.AF,'CHECK'); // business verification remains independent
 const manual=f.engine.calculate(f.record,{L:'0',K:'0'});assert.equal(manual.cells.L,'0');assert.equal(manual.cells.N,0);
});
test('conflicting configured and documented gross prices remain CHECK with traceable evidence',()=>{
 const f=fixture();f.source.hubPolicy.product.unitPrice*=1.1;f.engine.updateCourseSource(f.source);const r=f.engine.calculate(f.record);assert.match(r.cells.BD,/GIÁ HUB KHÁC/);assert.equal(r.cells.AF,'CHECK');assert.ok(r.pricing.refs.some(ref=>ref.sheet==='GetCoursePrice'));
});
test('Hub lookup data cannot waive a known policy restriction on New students buying a current-only week price',()=>{
 const f=fixture(),p=structuredClone(f.source.hubPolicy);Object.assign(p.product,{priceName:'ATLS - New Price 2024 (Nationwide) - gói tuần',typeId:2,units:2,packageName:'2 weeks',unitPrice:500000});
 const cells={H:p.product.priceName,I:p.product.hourWeekName,J:p.product.packageName,D:dateSerial('2026-10-10'),L:'0',B:p.centerCode};const r=priceFor({policy:f.policy},cells,{hubPolicy:p,group:'ATLS',contractType:'New',method:'Online Payments'});assert.match(r.issue,/CHỈ DÀNH CHO HỌC VIÊN CURRENT/);
});
