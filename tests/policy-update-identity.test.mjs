import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePolicyRow,validatePolicyRows,mergePolicyPack,policyIdentityErrors} from '../src/core/policy-pack.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {priceFor} from '../src/core/price-resolver.mjs';
import {buildPriceCatalogue} from '../src/core/price-catalog.mjs';
import {dateSerial} from '../src/core/verification.mjs';

const base={group:'ATLS',year:2026,layer:1,hours:4,variant:'standard',package:'36 months',months:36,monthly:4300000,gross:154800000,discount:46440000,maxTerms:12,straight:1,loyalty:4,referral:1,from:'2026-10-06',to:'2026-12-31',source:'QA policy',approval:'QA approved',discountLabels:['QA cash']};
const cells={H:'ATLS New Price 2026 Layer1',I:'4 hrs/week',J:'36 months',L:'QA cash',D:dateSerial('2026-10-10')};
test('import cannot accept 18 months of tuition under the 36-month price key',()=>{
 const bad=normalizePolicyRow({...base,months:18,gross:77400000,discount:23220000});
 assert.equal(bad.packageKey,36);assert.equal(bad.months,18);assert.equal(bad.package,'36 months');
 assert.ok(validatePolicyRows([bad]).some(e=>e.includes('Package khác số tháng')));
 const good=normalizePolicyRow(base);assert.deepEqual(validatePolicyRows([good]),[]);
 const policy=mergePolicyPack(policyData(),{id:'qa-valid',rows:[good]}),price=priceFor({policy},cells,{group:'ATLS',contractType:'New'});
 assert.equal(price.gross,154800000);assert.equal(price.discount,46440000);assert.equal(price.months,36);
});
test('previously saved inconsistent updates block both Contract and price catalogue without falling back',()=>{
 // Old versions could persist this row because each monetary formula balances.
 const bad=normalizePolicyRow({...base,months:18,gross:77400000,discount:23220000}),policy=mergePolicyPack(policyData(),{id:'qa-old-invalid',rows:[bad]});
 const price=priceFor({policy},cells,{group:'ATLS',contractType:'New'});assert.equal(price.gross,null);assert.equal(price.discount,null);assert.equal(price.months,36);assert.match(price.issue,/DÒNG GIÁ KHÔNG THỐNG NHẤT/);
 const shown=buildPriceCatalogue(policy).find(r=>r.id.startsWith('update-qa-old-invalid-'));
 assert.equal(shown.package,'36 months');assert.equal(shown.gross,null);assert.equal(shown.net,null);assert.equal(shown.status,'conflict');assert.equal(shown.issue,price.issue);
});
test('split, weekly, Summer and Premium keys must agree with their declared units',()=>{
 for(const patch of [
  {variant:'split',package:undefined,packageKey:'36 SPLIT',months:36},
  {variant:'weekly',package:undefined,packageKey:'2 WEEKS',weeks:1,monthly:null},
  {variant:'summer',package:undefined,packageKey:'S26-2|12M',months:18},
  {group:'PREMIUM',variant:'premium',package:undefined,packageKey:'1|4.5M',months:9,monthly:null},
  {packageKey:0},
  {months:'không phải số'},
  {straightWeeks:'không phải số'},
  {straight:'không phải số'},
  {variant:'weekly',package:undefined,packageKey:'2 WEEKS',weeks:'không phải số',monthly:null},
  {course:'ATLS New Price 2026 Layer1 (gói tuần)'}
 ])assert.ok(validatePolicyRows([normalizePolicyRow({...base,...patch})]).length,JSON.stringify(patch));
 const weekly=normalizePolicyRow({...base,variant:'weekly',package:undefined,packageKey:'2 WEEKS',weeks:1,monthly:null});assert.equal(weekly.packageKey,'2 WEEKS');
 const split=normalizePolicyRow({...base,variant:'split',package:'18 months siblings',months:18,gross:77400000,discount:23220000});assert.equal(split.packageKey,'36 SPLIT');assert.deepEqual(validatePolicyRows([split]),[]);
 assert.deepEqual(validatePolicyRows([normalizePolicyRow({...base,packageKey:'36'})]),[]);
});
test('week awards survive policy import and catalogue without becoming half a month',async()=>{
 const {POLICY_COLUMNS,policyTableRows,policyTemplateRows}=await import('../src/core/policy-import.mjs');
 const good=normalizePolicyRow({...base,straight:0,straightWeeks:2}),values=POLICY_COLUMNS.map(key=>good[key]??'');
 const imported=policyTableRows([POLICY_COLUMNS,values]);assert.deepEqual(validatePolicyRows(imported),[]);assert.equal(imported[0].straightWeeks,2);assert.equal(imported[0].straight,0);
 assert.equal(policyTemplateRows()[0].length,policyTemplateRows()[1].length);
 const policy=mergePolicyPack(policyData(),{id:'qa-weeks',rows:imported}),price=priceFor({policy},cells,{group:'ATLS',contractType:'New'}),shown=buildPriceCatalogue(policy).find(r=>r.id.startsWith('update-qa-weeks-'));
 assert.equal(price.straightWeeks,2);assert.equal(shown.straightWeeks,2);assert.equal(shown.straight,0);
});
test('all 160 published supplement rows retain their existing product and duration identities',()=>{
 const rows=policyData().typedPrices;assert.equal(rows.length,160);for(const r of rows)assert.deepEqual(policyIdentityErrors(r),[],r.variant+' '+r.packageKey);
});
