import test from 'node:test';
import assert from 'node:assert/strict';
import {policyData} from '../scripts/policy-data.mjs';
import {buildPriceCatalogue,policyRuleCatalogue} from '../src/core/price-catalog.mjs';
import {priceFor} from '../src/core/price-resolver.mjs';
import {pricingIdentity} from '../src/core/pricing-key.mjs';
import {normalizePolicyRow,validatePolicyRows,mergePolicyPack} from '../src/core/policy-pack.mjs';
import {dateSerial} from '../src/core/verification.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {buildModel} from '../src/local/model.mjs';
const policy=policyData(),financial=['monthly','months','gross','discount','net','maxTerms','straight','loyalty','referral'];
const cells=(J='12 months (S26-2)',when='2026-10-10',B='QA1')=>({H:'AGLS - New Price 2026 - Layer 1',I:'3 hrs/week',J,D:dateSerial(when),L:'0',B});
const select=(p=policy,input=cells())=>priceFor({policy:p},input,{group:'AGLS',contractType:'New'});

test('every price catalogue row is the Contract selector result for the same declared inputs',()=>{
 const rows=buildPriceCatalogue(policy);assert.ok(rows.length>400);
 for(const row of rows){
  const r=priceFor({policy},row.resolution.cells,row.resolution.context);
  for(const field of financial)assert.equal(row[field],r[field],row.id+' '+field);
  assert.equal(row.issue,r.issue??null,row.id+' policy state');assert.equal(row.pricingKey,r.key);
 }
 // A price for a multi-student class must not be displayed as one student's fee.
 const group=rows.find(r=>r.variant==='premium'&&r.groupMin>1);assert.ok(group);assert.equal(group.gross,null);assert.equal(group.status,'missing');
});
test('S26-2 retains its 12 months while catalogue, RULE and calculator share the unresolved policy',()=>{
 const row=buildPriceCatalogue(policy).find(r=>r.id==='master-48'),r=select();
 assert.equal(row.months,12);assert.equal(row.packageKey,'S26-2|12M');assert.equal(row.pricingKey,r.key);
 for(const field of financial.filter(f=>f!=='months')){assert.equal(row[field],null,field);assert.equal(r[field],null,field);}
 assert.equal(row.status,'missing');assert.match(row.note,/COMBO SUMMER/);assert.equal(row.issue,r.issue);
 assert.ok(r.refs.some(ref=>ref.sheet==='Bảng giá chung'&&ref.row===48));
 assert.equal(row.masterRefs[0].statedGross,38700000);assert.equal(row.observedPrice,43200000);
 const rule=policyRuleCatalogue(policy,[row])[0];assert.equal(rule.gross,null);assert.equal(rule.status,'missing');assert.match(rule.benefit,/chưa xác định/);assert.ok(!rule.benefit.includes('+0 tháng'));
});
test('Audit / Report observations cannot promote an unverified Summer reference into a price',()=>{
 const p=structuredClone(policy);
 for(const row of p.prices.filter(r=>/S26/.test(r.E)))row.J=1;
 for(const row of p.priceEvidence.master.filter(r=>/S26/.test(r.package))){row.statedGross=2;row.observedGross=3;}
 const catalogue=buildPriceCatalogue(p).find(r=>r.id==='master-48');
 assert.equal(catalogue.gross,null);assert.equal(catalogue.discount,null);assert.equal(select(p).gross,null);
});
const summerPolicy=()=>normalizePolicyRow({group:'AGLS',year:2026,layer:1,hours:3,variant:'summer',package:'12 months (S26-2)',months:12,monthly:3000000,gross:36000000,discount:3600000,maxTerms:3,straight:1,loyalty:0,referral:0,from:'2026-03-01',to:'2026-05-31',center:'QA1',contractType:'New',source:'QA synthetic approved policy',approval:'QA approval only',discountLabels:['QA Summer Cash']});
test('an imported Summer policy fills both views only for the exact edition, dates and center',()=>{
 const row=summerPolicy();assert.deepEqual(validatePolicyRows([row]),[]);
 const p=mergePolicyPack(policy,{id:'qa-summer',title:'QA synthetic policy',rows:[row]});
 const match=select(p,cells('12 months (S26-2)','2026-03-01'));assert.equal(match.gross,36000000);assert.equal(match.discount,3600000);
 const shown=buildPriceCatalogue(p).find(r=>r.id.startsWith('update-qa-summer-'));assert.ok(shown);
 for(const field of financial)assert.equal(shown[field],match[field],field);
 assert.equal(select(p,cells('12 months (S26-2)','2026-05-31')).gross,36000000);
 for(const input of [cells('12 months (S26-2)','2026-02-28'),cells('12 months (S26-2)','2026-06-01'),cells('12 months (S26-2)','2026-04-01','QA2'),cells('12 months (S26)','2026-04-01')])assert.equal(select(p,input).gross,null);
 assert.equal(select(p,cells('12 months','2026-04-01')).gross,38700000);
 assert.notEqual(pricingIdentity(cells().H,cells().I,'12 months (S26)').key,pricingIdentity(cells().H,cells().I,cells().J).key);
 assert.ok(validatePolicyRows([{...row,packageKey:12}]).some(e=>e.includes('phiên bản hè')));
 const conflict={...p,typedPrices:[...p.typedPrices,{...row,override:true}]};
 assert.equal(select(conflict,cells('12 months (S26-2)','2026-04-01')).gross,null);
 assert.match(select(conflict,cells('12 months (S26-2)','2026-04-01')).issue,/NHIỀU RULE/);
 assert.equal(buildPriceCatalogue(conflict).find(r=>r.id.startsWith('update-qa-summer-')).status,'conflict');
});
test('the actual Contract row leaves price and total unavailable for the same unverified S26-2 case',()=>{
 const ct='QA2610-CT-000048',student='QA-CATALOG',input=cells(),raw={B:'QA CENTER',C:'QA1',D:'QA2610-PAY-000048',E:ct,R:student,S:'DỮ LIỆU GIẢ',O:input.D,P:'QA0048',I:'Paid',F:'Payment',G:'New',X:'AGLS',Z:input.H,AA:input.I,AB:input.J,AQ:'0',AO:'0',AH:'Online Payments',AJ:'',AC:43200000,AD:0,AE:0,AF:43200000,AG:150};
 const receipt={sourceKey:'p',sourceRow:2,cells:raw},bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:dateSerial('2026-10-31'),records:[receipt],cash:[receipt],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct,student,target:43200000,paid:43200000,totalHours:150,courseFee:input.H,hoursPerWeek:input.I,package:input.J,contractType:'New',center:'QA1'}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 const engine=new AuditEngine(buildModel(bundle,policy)),record={id:'CT::'+ct},r=engine.calculate(record);
 assert.equal(r.cells.M,null);assert.equal(r.cells.N,null);assert.equal(r.cells.Q,null);assert.equal(r.cells.AF,'CHECK');assert.equal(r.cells.BD,select().issue);
 const approved=engine.calculate(record,{reviews:Object.fromEntries(r.reviewItems.map(i=>[i.id,{approved:true,scope:i.scope}]))});assert.equal(approved.cells.M,null);assert.equal(approved.cells.AF,'CHECK');
});
