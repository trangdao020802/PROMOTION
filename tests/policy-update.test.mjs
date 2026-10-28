import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePolicyRow,validatePolicyRows,stagePolicyUpdate,mergePolicyPack,matchTypedPrice} from '../src/core/policy-pack.mjs';
import {policyTableRows,POLICY_COLUMNS} from '../src/core/policy-import.mjs';
import {pricingIdentity} from '../src/core/pricing-key.mjs';
import {dateSerial} from '../src/core/verification.mjs';
const base=()=>normalizePolicyRow({group:'ATLS',year:2027,layer:1,hours:4,variant:'standard',months:12,gross:51600000,monthly:4300000,discount:5160000,maxTerms:6,from:'2027-01-01',to:'2027-12-31',source:'QA policy only',approval:'QA approval',discountLabels:['QA Cash']});
test('price import requires dates, numeric zero discounts and source approval; missing formula caches never become zero',()=>{
 const r=base();assert.deepEqual(validatePolicyRows([r]),[]);
 for(const patch of [{discount:null},{discount:undefined},{gross:0},{maxTerms:null},{from:''},{approval:''},{monthly:4800000},{discount:60000000},{hours:NaN}])assert.ok(validatePolicyRows([{...r,...patch}]).length,JSON.stringify(patch));
 assert.deepEqual(validatePolicyRows([{...r,discount:0,maxTerms:0}]),[]);
});
test('import detects duplicate and overlapping policy keys, while historical periods coexist',()=>{
 const r=base();assert.ok(validatePolicyRows([r,{...r}]).some(s=>s.includes('trùng khóa')));
 assert.ok(validatePolicyRows([r,{...r,from:'2027-06-01'}]).some(s=>s.includes('chồng lấn')));
 assert.deepEqual(validatePolicyRows([{...r,to:'2027-06-30'},{...r,from:'2027-07-01'}]),[]);
});
test('a new period splits the existing version, retaining old prices on both sides',()=>{
 const old=base(),next={...base(),from:'2027-04-01',to:'2027-06-30',discount:10000000};
 const staged=stagePolicyUpdate([old],[next]);assert.equal(staged.length,3);assert.deepEqual(validatePolicyRows(staged),[]);
 const p=mergePolicyPack({typedPrices:[]},{id:'qa-revision',rows:staged}),id=pricingIdentity('ATLS New Price 2027 Layer1','4 hrs/week','12 months');
 for(const [date,discount]of [['2027-03-31',5160000],['2027-04-01',10000000],['2027-06-30',10000000],['2027-07-01',5160000]])assert.equal(matchTypedPrice(p,id,dateSerial(date)).discount,discount);
 assert.equal(matchTypedPrice(p,id,dateSerial('2026-12-31')),null);assert.equal(old.to,'2027-12-31');
});
test('an override applies only to its center, year and product; overlapping ambiguous matches block calculation',()=>{
 const r={...base(),center:'HN.QA'},id=pricingIdentity('ATLS New Price 2027 Layer1','4 hrs/week','12 months');
 const p=mergePolicyPack({typedPrices:[base()]},{id:'qa',rows:[r]});assert.equal(matchTypedPrice(p,id,dateSerial('2027-05-01'),{center:'HN.QA'}).revision,'qa');assert.equal(matchTypedPrice(p,id,dateSerial('2027-05-01'),{center:'HN.OTHER'}).override,undefined);
 const bad={typedPrices:[r,{...r,discount:1}]};assert.match(matchTypedPrice(bad,id,dateSerial('2027-05-01'),{center:'HN.QA'}).issue,/NHIỀU RULE/);
});
test('machine-column CSV / Excel import keeps fields and zero values typed',()=>{
 const r=base(),values=POLICY_COLUMNS.map(k=>r[k]??'');const rows=policyTableRows({rows:[POLICY_COLUMNS,values]});assert.equal(rows[0].gross,51600000);assert.deepEqual(validatePolicyRows(rows),[]);
});
test('provided lookup workbook format uses gross/discount cells even when cached net formulas are blank',()=>{
 const headers=['Mã / Tên giá hệ thống (Key Name)','Khóa học & Phân loại','Khu vực (Layer)','Thời lượng (Giờ/tuần)','Đơn giá chưa giảm (VNĐ/tháng)','Giá gốc niêm yết (VNĐ)','Mức giảm gói - Base (VNĐ)','Mức giảm gói - Q4 (VNĐ)','Sau giảm - Base (VNĐ)','Sau giảm - Q4 (VNĐ)','Tháng tặng có điều kiện','Kỳ trả góp tối đa','Phạm vi tính & Quy tắc áp dụng'];
 const rows=policyTableRows({rows:[headers,['New Price 2026 - Layer 1 - 18 Tháng (Đóng 1 lần)','ATLS / AGLS 18T','Layer 1','4h',4200000,75600000,10000000,11340000,null,null,'Trả thẳng: +1T | Loyalty (>30M): +2T | Ref New: +1T','6 tháng (Base) / 9 tháng (Q4)','Điều kiện giả để kiểm thử']]},{from:'2026-10-06',to:'2026-12-31',source:'QA lookup',approval:'QA',regime:'q4'});
 const r=rows[0];assert.equal(r.discount,11340000);assert.equal(r.maxTerms,9);assert.equal(r.straight,1);assert.equal(r.loyalty,2);assert.equal(r.months,18);assert.deepEqual(validatePolicyRows(rows),[]);
});
test('shared ATLS/AGLS updates cannot overlap a competing ATLS-only update',()=>{
 const r=base();assert.ok(validatePolicyRows([r,{...r,group:'ATLS/AGLS'}]).some(s=>s.includes('chồng lấn')));
});
test('a lookup footer is not imported as a financial policy row',()=>{
 const headers=['Mã / Tên giá hệ thống (Key Name)','Khóa học & Phân loại','Khu vực (Layer)','Thời lượng (Giờ/tuần)','Đơn giá chưa giảm (VNĐ/tháng)','Giá gốc niêm yết (VNĐ)'];
 const rows=policyTableRows({rows:[headers,['Ghi chú: không coi công thức chưa lưu là 0']]},{source:'QA'});assert.deepEqual(rows,[]);
});
