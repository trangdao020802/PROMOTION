import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
import {backgroundRuntime} from './helpers/existing-hub-runtime.mjs';
const ctx=vm.createContext({URL,Date});vm.runInContext(fs.readFileSync(new URL('../reference/hub/report-core.js',import.meta.url),'utf8'),ctx);const R=ctx.PromotionHubReports;
const headers={export:['Contract No.','Student code','Final pay amount contract','Total final payment amount invoice','Contract full date'],payment:['Payment code','Contract No.','Student ID','Invoice date','VAT Invoice No.'],transfer:['Transfer type','Transfer date','From student ID','To student ID','From Contract/Deposit No.','To Contract No.']};
for(const report of Object.keys(headers))test(report+' report probes its row count and reads the complete result in one bound background frame',async()=>{
 const r=backgroundRuntime(),id='qa-report-'+report,month='2026-10';let url=R.reportURL(report,month,50);
 const send=(m,extra={})=>r.send({id,frameJob:id,frameKey:'qa-agent',...m},20,url,{frameId:9,documentId:'qa-report-frame',...extra});
 await r.send({type:'report-start',id,report,month});assert.equal(r.store.job.kind,'report');
 await send({type:'context'});assert.equal(r.store.job.frameId,9);
 await send({type:'report-count',total:0});assert.equal(r.store.job.stage,'report-full');assert.equal(r.store.job.pageSize,1);
 url=R.reportURL(report,month,1);await send({type:'context'});
 const payload={report,month,url,headers:headers[report],rows:[],total:0,capturedAt:'2026-10-29T08:00:00.000Z'};
 await send({type:'report-complete',payload},{frameId:10});assert.ok(r.store.job);
 await send({type:'report-complete',payload,frameKey:'wrong'});assert.ok(r.store.job);
 await send({type:'report-complete',payload:{...payload,month:'2026-09'}});assert.ok(r.store.job);
 await send({type:'report-complete',payload});assert.equal(r.store.job,undefined);assert.ok(r.messages.some(m=>m.type==='report-result'));assert.deepEqual(r.mutations,[]);
});
test('silent voucher/report cancel, missing session and timeout never create a replacement tab',async()=>{
 for(const request of [{type:'voucher-start',voucher:{code:'QA-FULL'}},{type:'report-start',report:'payment',month:'2026-10'}]){
  const unavailable=backgroundRuntime({tabs:[]});const result=await unavailable.send({...request,id:'qa-no-tab'});assert.equal(result.code,'hub_tab_missing');assert.deepEqual(unavailable.mutations,[]);
  for(const action of ['cancel','timeout']){const r=backgroundRuntime();await r.send({...request,id:'qa-stop'});if(action==='cancel')await r.send({type:'cancel',id:'qa-stop'});else await r.send({type:'agent-complete',id:'qa-stop',agentKey:'qa-agent',error:true,code:'hub_timeout'},20,r.tabs[0].url);assert.equal(r.store.job,undefined);assert.deepEqual(r.mutations,[]);}
 }
});
