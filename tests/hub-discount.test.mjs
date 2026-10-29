import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHubDiscount} from '../src/core/hub-discount.mjs';
import {coursePayload} from '../src/core/hub-course.mjs';

export const discountExamples=[
 ['10.00% (2026 October - Promotion Discount - 12 months)','2026 October - Promotion Discount - 12 months'],
 ['1 Months (2026 October - Promotion Referral - 1 month add-on)','2026 October - Promotion Referral - 1 month add-on'],
 ['1 Months (Sep/Oct 2026 - Tặng Tháng (TRẢ THẲNG) - All layer - Tặng 1 tháng)','Sep/Oct 2026 - Tặng Tháng (TRẢ THẲNG) - All layer - Tặng 1 tháng']
];
for(const [display,name]of discountExamples)test('Hub Discount extracts the outer offer name: '+name,()=>{
 assert.equal(normalizeHubDiscount(display),name);
 assert.equal(normalizeHubDiscount(display,{wrappedOnly:true}),name);
});
test('multi-offer Discount retains names once, including nested parentheses and wrapped lines',()=>{
 const decorated=discountExamples.map(([display])=>display);
 const expected=discountExamples.map(([,name])=>name).join(';');
 for(const separator of [';','\n',' '])assert.equal(normalizeHubDiscount(decorated.join(separator)),expected);
 assert.equal(normalizeHubDiscount(decorated.join(';')+';'+decorated[0]+';0;'),expected);
 assert.equal(normalizeHubDiscount('1 Months (Sep/Oct 2026 - Tặng Tháng\n(TRẢ THẲNG) - All layer - Tặng 1 tháng)'),discountExamples[2][1]);
});
test('plain program names keep their parentheses; monetary displays cannot become program names',()=>{
 for(const name of [discountExamples[2][1],'Siblings - Siblings 1.000.000 VND (AGLS/ATLS/IELTS)','Promotion (P.9/12/18)'])assert.equal(normalizeHubDiscount(name),name);
 for(const money of ['10.00%','1 Months','3.870.000 VNĐ','2,000,000 VND','0 đ','3870000'])assert.equal(normalizeHubDiscount(money),null);
 assert.equal(normalizeHubDiscount('0'),'0');
 assert.equal(normalizeHubDiscount('0 VNĐ',{wrappedOnly:true}),null);
 assert.equal(normalizeHubDiscount('0',{wrappedOnly:true}),null);
});
test('malformed benefit wrappers stay missing instead of truncating or inventing a program',()=>{
 for(const display of ['1 Months (Offer (TRẢ THẲNG)','10.00% ()','10.00% (Offer) unexplained text','10.00% Offer'])assert.equal(normalizeHubDiscount(display),null);
 const expected={ct:'QA2610-CT-000004',student:'QA-DISCOUNT',url:'https://hub24.apollo.vn:7777/contract/detail/12345'};
 assert.equal(coursePayload({...expected,courseFee:'ATLS - New Price 2026 - Layer 1',discount:'10.00% (Offer'},expected).discount,null);
 assert.equal(coursePayload({...expected,discount:discountExamples.map(([display])=>display).join(';')},expected).discount,discountExamples.map(([,name])=>name).join(';'));
});
