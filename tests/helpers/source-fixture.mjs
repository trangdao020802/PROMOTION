import {parseDate} from '../../src/core/source-parser.mjs';
export function sourceFixture(id='saved-a'){
 const day=parseDate('2026-11-10'),ct='QA2611-CT-000001',student='QA-STUDENT';
 const cells={B:'QA Center',C:'QA1',D:'QA2611-PAY-000001',E:ct,R:student,S:'Dữ liệu kiểm thử',O:day,P:'0000778',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'',AA:'',AB:'',AQ:'',AO:'',AC:7200000,AD:0,AE:0,AF:7200000,AG:25};
 const row={sourceKey:'p',sourceRow:2,cells};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-11-01',to:'2026-11-30',center:''},cutoff:parseDate('2026-11-30'),records:[row],cash:[row],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct,student,target:7200000,paid:7200000,totalHours:25,center:'QA1',contractType:'New'}],sources:['payment','export','transfer'].map((role,index)=>({key:['p','e','t'][index],role,fileIndex:index,fileName:role+'.csv',sheetName:'CSV',headerRow:1,rowCount:role==='transfer'?0:1}))};
 return {id,fileName:'Bộ nguồn kiểm thử',fileIds:[id+'-p',id+'-e',id+'-t'],bundle,createdAt:'2026-11-20T08:00:00.000Z'};
}
