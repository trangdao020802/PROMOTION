import test from 'node:test';
import assert from 'node:assert/strict';
import {hubDisplayedTablesFromDocument,projectHubContract,mergeDisplayedHubContract,projectContractPayments,projectHubMovements,projectHubDisplayedTables} from '../src/core/hub-contract.mjs';
import {isOriginalPaymentSource} from '../src/core/hub-upstream.mjs';
import {eInvoicePDFURL,invoiceKeyFromURL,financeReadsComplete} from '../src/core/hub-invoice.mjs';
import {readDirectInvoices} from '../src/core/hub-direct-invoice.mjs';
import {readInvoicePDF} from '../src/bridge/invoice-pdf.mjs';
import {invoiceDocument} from './helpers/invoice-document.mjs';
const ct='QA2506-CT-000301',to='QA2610-CT-000302',key='12345678-1234-4567-89ab-123456789abc',pay='QA2506-PAY-000301',out='2610-PAY-000302';
const headers=['Payment code','Payment method','Scheduled date','Completed date','Payment amount','Remain amount','Paid amount','E-Invoice','Complete payment','Others'];
function displayed({unsupportedMovingHeader=false,invoiceText='Xem PDF',href='/Downloads/EInvoice/'+key+'.pdf',literal=false}={}){
 const link={hidden:false,getAttribute:k=>k==='href'?href:k==='ng-click'&&literal?"$vm.printEInvoice('"+key+"', 2)":null,closest:()=>null,getClientRects:()=>[{}]};
 const cell=(text,tagName='TD',colSpan=1,links=[])=>({tagName,colSpan,textContent:text,innerText:text,hidden:false,getAttribute:()=>null,getClientRects:()=>[{}],closest:()=>null,querySelectorAll:s=>s==='a'?links:[]});
 const table={hidden:false,getAttribute:()=>null,getClientRects:()=>[{}],closest:()=>null};
 const row=cells=>({children:cells,hidden:false,getAttribute:()=>null,getClientRects:()=>[{}],closest:s=>s==='table'?table:null});
 const original=[pay,'Online Payments','27/06/2025','27/06/2025','4.725.000','0','4.725.000',invoiceText,'true',''];
 const rows=[row(headers.map(h=>cell(h,'TH'))),row(original.map((v,i)=>cell(v,'TD',1,i===7?[link]:[]))),row([cell('Moving-out','TD',10)]),
  row((unsupportedMovingHeader?['Document code','Date','Amount','Destination']:['Payment code','Transfer date','Moving out amount','Transfer to']).map(h=>cell(h,'TH'))),
  row([cell(out,'TD',2),cell('31/10/2026','TD',2),cell('4.725.000','TD',3),cell(to,'TD',3)])];
 // Colspans in the real Moving-out table have matching heading spans.
 rows[3].children.forEach((n,i)=>n.colSpan=[2,2,3,3][i]);
 table.querySelectorAll=s=>s==='tr'?rows:[];
 return {querySelectorAll:s=>s==='table'?[table]:[]};
}
const base=()=>projectHubContract({ContractId:301,ContractNo:ct,ListCourseInfo:[]});
function facts(){return mergeDisplayedHubContract(base(),hubDisplayedTablesFromDocument(displayed()),ct);}
test('one table with two financial header sections reads one original Payment and one Moving-out with its own date and columns',()=>{
 const tables=hubDisplayedTablesFromDocument(displayed({literal:true}));assert.equal(tables.length,2);
 const f=mergeDisplayedHubContract(base(),tables,ct);assert.equal(f.payments.rows.length,1);assert.equal(f.payments.rows[0].code,pay);assert.equal(f.payments.rows[0].amount,4725000);assert.equal(f.payments.rows[0].eInvoiceKey,key);assert.equal(f.payments.rows[0].eInvoiceVersion,2);
 assert.equal(f.movements.rows.length,1);assert.equal(f.movements.rows[0].reference,out);assert.equal(f.movements.rows[0].date,'2026-10-31');assert.equal(f.movements.rows[0].to,to);
 assert.ok(isOriginalPaymentSource({ct:to,reconciliation:{movementHistory:[]}},ct,{hubContract:f}));
 const partial=hubDisplayedTablesFromDocument(displayed({unsupportedMovingHeader:true}));const parsed=projectHubDisplayedTables(partial,ct);assert.equal(parsed.payments.length,1);assert.equal(parsed.movements,null);
});
test('only the exact Hub invoice URL or a single E-Invoice cell key can supply a download link',()=>{
 assert.equal(eInvoicePDFURL(key),'https://hub24.apollo.vn:7777/Downloads/EInvoice/'+key+'.pdf');
 for(const url of ['https://other.example/Downloads/EInvoice/'+key+'.pdf','/Downloads/EInvoice/'+key+'.pdf?token=secret','/Downloads/EInvoice/not-a-guid.pdf'])assert.equal(invoiceKeyFromURL(url),null);
 const f=mergeDisplayedHubContract(base(),hubDisplayedTablesFromDocument(displayed({href:'https://other.example/Downloads/EInvoice/'+key+'.pdf'})),ct);assert.equal(f.payments.rows[0].invoiceRef,undefined);
 const textOnly=facts();assert.equal(textOnly.payments.rows[0].invoiceRef,key);assert.ok(!financeReadsComplete(textOnly));
});
test('Moving-out API type 8 is excluded from Paid receipts and retained as a dated outgoing movement',()=>{
 const original={PaymentId:31,ContractId:301,PaymentCode:pay,PaymentTypeId:2,PaymentTypeName:'Payment',PaymentMethodTypeName:'Online Payments',Amount:4725000,IsComplete:true,CompleteDate:'2025-06-27',EInvoiceFKey:key};
 const moving={PaymentId:32,ContractId:301,PaymentCode:out,PaymentTypeId:8,PaymentTypeName:'Transfer',RelatedContractDepositNo:to,Amount:4725000,IsComplete:true,CompleteDate:'2026-10-31'};
 const rows=projectContractPayments([original,moving],301);assert.equal(rows.length,1);assert.equal(rows[0].code,pay);
 const moves=projectHubMovements({ContractNo:ct,ListPayment:[original,moving]});assert.equal(moves.length,1);assert.equal(moves[0].direction,'out');assert.equal(moves[0].from,ct);assert.equal(moves[0].to,to);
});
test('the original contract ends ancestry lookup but a mixed Payment plus a known Moving-in still follows its real upstream',()=>{
 const f=facts(),row={ct:to,reconciliation:{movementHistory:[]}};
 assert.ok(isOriginalPaymentSource(row,ct,{hubContract:f}));
 assert.equal(isOriginalPaymentSource({...row,reconciliation:{movementHistory:[{from:'QA2505-CT-000300',to:ct,amount:1000000}]}},ct,{hubContract:f}),false);
 assert.equal(isOriginalPaymentSource(row,ct,{hubContract:f},['QA2505-DEP-000300']),false);
 const old=structuredClone(f);delete old.financeRevision;old.payments.rows[0].invoiceRef='0000301';assert.equal(financeReadsComplete(old),false);
});
test('an unrendered finance template cannot clear saved receipts by claiming an empty read',()=>{
 const projected=projectHubDisplayedTables([{headers,rows:[['{{payment.PaymentCode}}','{{payment.Method}}','','','{{payment.Amount}}','','{{payment.Amount}}','{{payment.EInvoiceFKey}}','','']]}],ct);
 assert.equal(projected.payments,null);assert.equal(projected.movements,null);
});
const response=bytes=>({ok:true,headers:{get:()=>null},body:{getReader:()=>{let read=false;return {read:async()=>read?{done:true}:(read=true,{done:false,value:bytes}),cancel:async()=>{}};}}});
test('a DOM-only original contract reads the actual PDF parser through its direct E-Invoice URL without CenterId or Angular',async()=>{
 const calls=[],f=facts(),pdf=invoiceDocument(['VAT INVOICE','Invoice No: 0000301','Invoice Date: 27/06/2025','Grand total: 4.725.000']);
 const result=await readDirectInvoices(f,{fetch:async(url,options)=>{calls.push({url,options});return response(pdf);},readPDF:readInvoicePDF});
 assert.equal(calls.length,1);assert.equal(calls[0].url,eInvoicePDFURL(key));assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].options.credentials,'same-origin');
 assert.equal(result.payments.rows.length,1);assert.equal(result.payments.rows[0].invoice.number,'0000301');assert.equal(result.payments.rows[0].invoice.date,'2025-06-27');assert.equal(result.payments.rows[0].invoice.amount,4725000);assert.ok(financeReadsComplete(result));assert.equal(f.payments.rows[0].invoice,undefined);
});
test('login HTML or an aborted direct invoice fetch preserves the original facts; an amount discrepancy stays CHECK',async()=>{
 const f=facts();const html=await readDirectInvoices(f,{fetch:async()=>response(new TextEncoder().encode('<!doctype html>login')),readPDF:()=>assert.fail('HTML is not a PDF')});assert.deepEqual(html,f);
 const ctrl=new AbortController();ctrl.abort();let read=false;assert.deepEqual(await readDirectInvoices(f,{signal:ctrl.signal,fetch:()=>{read=true;},readPDF:readInvoicePDF}),f);assert.equal(read,false);
 const pdf=invoiceDocument(['VAT INVOICE','Invoice No: 0000301','Invoice Date: 27/06/2025','Grand total: 5.000.000']);
 const changed=await readDirectInvoices(f,{fetch:async()=>response(pdf),readPDF:readInvoicePDF});assert.deepEqual(changed.payments.rows[0].invoice.conflicts,['amount']);assert.equal(changed.payments.rows[0].amount,4725000);
});
