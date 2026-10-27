import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceRows,updateVoucherCatalogue} from '../src/core/reference-data.mjs';
import {EMPTY_VOUCHER} from '../src/core/vouchers.mjs';

test('price rules stay in RULE even when stale combined reference data contains them as vouchers',()=>{
 const rules=[{row:52,K:'BASE OCT',N:3,O:3,P:6,AL:19800000,Q:0,R:0,W:'Nguồn giá'}];
 const v={...EMPTY_VOUCHER,code:'QA-GIFTCODE',label:'BASE OCT'};
 const data={rules,prices:[{row:1,C:'Giá chung'}],vouchers:[...rules],customVouchers:[v,...rules]};
 assert.deepEqual(referenceRows(data,'prices'),rules);
 assert.equal(referenceRows(data,'master')[0].C,'Giá chung');
 const vouchers=referenceRows(data,'vouchers');assert.equal(vouchers.length,1);assert.equal(vouchers[0].AH,'QA-GIFTCODE');assert.equal(vouchers[0].M,'BASE OCT');assert.equal(vouchers[0].R,'PENDING');
 assert.deepEqual(referenceRows({...data,customVouchers:[]},'vouchers'),[]);
});
test('saving a voucher replaces its catalogue without carrying stale policy rows forward',()=>{
 const rules=[{row:53,K:'BASE 2026',AL:9900000}],v={...EMPTY_VOUCHER,code:'QA-NEW'};
 const data=updateVoucherCatalogue({rules,vouchers:rules,customVouchers:[],choices:{K:[]}},[v,{...EMPTY_VOUCHER,code:'0'}]);
 assert.deepEqual(data.rules,rules);assert.equal(data.vouchers.length,1);assert.equal(data.vouchers[0].AH,'QA-NEW');assert.deepEqual(data.choices.K,['QA-NEW']);
});
