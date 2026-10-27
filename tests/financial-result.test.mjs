import test from 'node:test';
import assert from 'node:assert/strict';
import {financialResult} from '../src/core/reconcile.mjs';

const account=(extra={})=>({ct:'QA2610-CT-000333',net:40635000,paid:{target:40050000},warnings:[],otherPayments:0,...extra});
test('equal displayed CALC and CT receipts return OK despite outstanding source trace warnings',()=>{
 const a=account({warnings:['Tổng tính lại khác PAID_BY_CONTRACT'],otherPayments:null});
 const result=financialResult(a,{Q:40635000,W:40635000});
 assert.equal(result.status,'OK');assert.equal(result.blocking,false);assert.equal(result.difference,0);
 assert.equal(result.target,40050000);assert.equal(result.calcTarget,40635000);assert.deepEqual(a.warnings,['Tổng tính lại khác PAID_BY_CONTRACT']);
 const missingExport=financialResult(account({paid:null}),{Q:40635000,W:40635000});assert.equal(missingExport.status,'OK');assert.equal(missingExport.target,null);
});
test('a shortage or surplus compares the two displayed amounts rather than the Export snapshot',()=>{
 const shortage=financialResult(account(),{Q:40635000,W:40050000});assert.equal(shortage.status,'CÒN THIẾU CT 585.000 đ');assert.equal(shortage.blocking,true);assert.equal(shortage.difference,-585000);
 const surplus=financialResult(account({warnings:['Cần kiểm tra nguồn']}),{Q:40050000,W:40635000});assert.equal(surplus.status,'CHECK - THỪA TIỀN CT 585.000 đ');assert.equal(surplus.overpaid,585000);assert.equal(surplus.blocking,true);
});
test('blank, text or non-finite amounts cannot pass; an established zero pair can pass',()=>{
 for(const bad of [null,undefined,'',0/0,Infinity,'40635000'])for(const key of ['Q','W']){
  const r=financialResult(account(),{Q:40635000,W:40635000,[key]:bad});assert.equal(r.blocking,true);assert.notEqual(r.status,'OK');
 }
 assert.equal(financialResult(account(),{Q:0,W:0}).status,'OK');
 assert.equal(financialResult(account(),{Q:null,W:0}).blocking,true);
});
test('the amount comparison retains the policy period tolerance',()=>{
 assert.equal(financialResult(account(),{Q:40635000,W:40634500},1000).status,'OK');
 assert.equal(financialResult(account(),{Q:40635000,W:40634500},1).blocking,true);
});
