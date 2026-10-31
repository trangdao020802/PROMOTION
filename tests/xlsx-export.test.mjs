import test from 'node:test';import assert from 'node:assert/strict';import {inflateRawSync} from 'node:zlib';
import {tableWorkbook,spreadsheetNumber,XLSX_MIME} from '../src/core/xlsx-export.mjs';
import {reconciliationWorkbook,reportWorkbook,sourceDownload} from '../src/core/table-exports.mjs';
import {parseXlsx,autoMap,normalizeSheet} from '../src/core/source-parser.mjs';
import {policyTemplateRows,policyTableRows} from '../src/core/policy-import.mjs';
function files(bytes){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),result={};let at=0;while(view.getUint32(at,true)===0x04034b50){const method=view.getUint16(at+8,true),size=view.getUint32(at+18,true),nameLength=view.getUint16(at+26,true),extra=view.getUint16(at+28,true),name=new TextDecoder().decode(bytes.slice(at+30,at+30+nameLength)),start=at+30+nameLength+extra,chunk=bytes.slice(start,start+size);result[name]=new TextDecoder().decode(method===8?inflateRawSync(chunk):chunk);at=start+size;}return result;}
test('real XLSX separates columns, stores General numbers, preserves identifiers and treats formula-looking content as text',async()=>{
 const bytes=await tableWorkbook([{name:'Bảng đối chiếu',headers:['Contract','Student ID','Amount','Hours','Note'],rows:[['QA2610-CT-000004','001234','34.830.000',12.5,'=HYPERLINK("https://example.invalid")'],['QA2610-CT-000005','000001',0,null,'Nguyễn, An; Bình']]}]);
 const book=await parseXlsx(bytes.buffer),rows=book.readSheet('Bảng đối chiếu');assert.equal(rows[1][1],'001234');assert.equal(rows[1][2],34830000);assert.equal(rows[1][3],12.5);assert.equal(rows[1][4],'=HYPERLINK("https://example.invalid")');assert.equal(rows[2][2],0);
 const parts=files(bytes),sheet=parts['xl/worksheets/sheet1.xml'];assert.ok(sheet.includes('state="frozen"'));assert.ok(sheet.includes('<tablePart '));assert.ok(!sheet.includes('<f>'));
 const styles=parts['xl/styles.xml'];for(const xf of styles.matchAll(/<(?:\w+:)?xf\b[^>]*>/g))assert.ok(!/numFmtId="200"/.test(xf[0]));
});
test('raw Hub transfer tables retain duplicate Amount headings and both numeric columns on round trip',async()=>{
 const headers=['Transfer Type','Transfer Date','From Student ID','From Contract/Deposit No','Amount','To Student ID','To Contract No','Amount'];
 const payload={headers,rows:[['Transfer','2026-10-10','00123','QA2610-DEP-000004','1.000.000','00123','QA2610-CT-000004','1.000.000']],total:1,url:'https://hub24.apollo.vn:7777/report/TransferPaymentList',capturedAt:'2026-10-31T10:00:00Z'};
 const result=await reportWorkbook(payload,'transfer','2026-10',{path:'/report/TransferPaymentList',label:'Transfer PaymentList',dateField:'Transfer date'});assert.match(result.fileName,/\.xlsx$/);assert.equal(result.type,XLSX_MIME);
 const book=await parseXlsx(result.bytes.buffer),rows=book.readSheet('Transfer PaymentList');assert.deepEqual(rows[0],headers);assert.equal(rows[1][4],1000000);assert.equal(rows[1][7],1000000);assert.equal(rows[1][2],'00123');
 const mapped=autoMap(rows,'transfer'),normal=normalizeSheet(rows,'transfer',mapped);assert.deepEqual(normal.errors,[]);assert.equal(normal.records[0].amount,1000000);
 assert.ok(book.readSheet('Nguồn').some(r=>r[1]===payload.url));assert.ok(files(result.bytes)['xl/worksheets/sheet1.xml'].includes('<autoFilter '));
});
test('filtered audit export retains CALC/RAW values, missing cells, notes and approvals without CSV concatenation',async()=>{
 const row={paymentCode:'QA2610-PAY-000004',sourceContracts:['QA2610-CT-000003'],cells:{G:'Dữ liệu kiểm thử',F:'00123',Q:34830000,AC:0,L:'Offer one;Offer two',AG:'APPROVED',AN:'Cần kiểm tra'}};
 const cols=[{key:'F',label:'Student ID',group:1},{key:'Q',label:'Total fee',group:2},{key:'AC',label:'DIFF',group:4},{key:'L',label:'Discount apply',group:1},{key:'AG',label:'Approved',group:4}];
 const book=await parseXlsx((await reconciliationWorkbook([row],cols,()=>'' )).buffer),rows=book.readSheet('Bảng đối chiếu');assert.equal(rows.length,2);assert.equal(rows[0][3],'Total fee (CALC)');assert.equal(rows[1][3],34830000);assert.equal(rows[1][4],0);assert.equal(rows[1][5],'Offer one\nOffer two');assert.equal(rows[1][6],'APPROVED');
});
test('legacy CSV source downloads become real XLSX and policy samples keep all fields in their proper columns',async()=>{
 const file={name:'PaymentList.csv',blob:new Blob(['Student ID,Amount,Note\n00123,"1,000,000","A, B; C"'])},result=await sourceDownload(file);assert.equal(result.name,'PaymentList.xlsx');assert.equal(result.blob.type,XLSX_MIME);assert.equal((await parseXlsx(await result.blob.arrayBuffer())).readSheet('Nguồn')[1][1],1000000);
 const sample=policyTemplateRows();assert.equal(sample[0].length,sample[1].length);const rows=policyTableRows({name:'Policy',rows:sample});assert.equal(rows[0].gross,51600000);assert.equal(rows[0].monthly,4300000);assert.equal(rows[0].packageKey,12);assert.equal(rows[0].from,'2027-01-01');
 assert.equal(spreadsheetNumber('00123','Student ID'),'00123');assert.equal(spreadsheetNumber('12,5','Hours'),12.5);assert.equal(spreadsheetNumber('(1.000.000)','Amount'),-1000000);assert.equal(spreadsheetNumber('15.00%','Discount'),'15.00%');
});
