import test from 'node:test';
import assert from 'node:assert/strict';
import {invoiceNumber,eInvoiceKey,projectPaymentInvoice,parseInvoiceText,mergePaymentInvoice,invoiceReadsComplete,displayedInvoiceNo} from '../src/core/hub-invoice.mjs';
import {projectHubContract,projectContractPayments,validateHubContract,projectHubMovements} from '../src/core/hub-contract.mjs';
import {projectLearnerPaymentPage,mergeLearnerFinance} from '../src/core/hub-learner-payments.mjs';
import {financeBundle} from '../src/core/hub-finance-bundle.mjs';
const guid='12345678-1234-4567-89ab-123456789abc';
const master='QA2610-CT-000910',mid='QA2610-CT-000911',old='QA2506-CT-000912',dep='QA2610-DEP-000913';
const root={ContractId:910,ContractNo:master,LeadId:90,KidId:91,ListCourseInfo:[],ListMovingIn:[]};
const p={PaymentId:101,PaymentCode:'QA2506-PAY-000910',Amount:4725000,TotalAmount:4725000,RemainAmount:0,IsComplete:true,CompleteDate:'2025-06-27',PaymentMethodTypeName:'Online Payments',EInvoiceFKey:guid,EInvoiceVersion:2};
test('real FKey and printed invoice number remain distinct and leading zeroes survive projection',()=>{
 assert.equal(invoiceNumber('0000424'),'0000424');assert.equal(invoiceNumber(424),'424');assert.equal(invoiceNumber(guid),null);assert.equal(invoiceNumber('0'),null);
 assert.equal(projectPaymentInvoice(p).invoiceRef,guid);assert.equal(projectPaymentInvoice(p).eInvoiceKey,guid);
 const row=projectContractPayments([{...p,InvoiceNo:'0000424',InvoiceDate:'2025-06-27',InvoiceAmount:4725000}],910)[0];
 assert.equal(row.invoice.number,'0000424');assert.equal(row.eInvoiceKey,guid);assert.equal(row.invoice.amount,4725000);
 const f=projectHubContract(root,{payments:[row],paymentState:'read'});assert.ok(validateHubContract(f));assert.equal(f.learner.url,'https://hub24.apollo.vn:7777/lead/detail/90?s=91');
 assert.equal(displayedInvoiceNo(guid),'Chưa đọc số hóa đơn');assert.ok(!invoiceReadsComplete(projectHubContract(root,{payments:projectContractPayments([p],910),paymentState:'read'})));
 assert.ok(invoiceReadsComplete(f));
 const encoded=projectPaymentInvoice({...p,EInvoiceCode:'1/001;C26TQA-'+guid+'_424'});assert.equal(encoded.invoice.number,'424');
 assert.equal(projectPaymentInvoice({...p,EInvoiceCode:'1/001;C26TQA-other-key_424'}).invoice,undefined);
});
test('invoice text is read from labeled VAT fields, including the date printed as day / month / year',()=>{
 const source='HÓA ĐƠN GIÁ TRỊ GIA TĂNG (VAT INVOICE)\nKý hiệu (Serial No): 1C25TQA\nSố (Invoice No): 0000424\nNgày (Date) 27 tháng (month) 06 năm (year) 2025\nĐơn giá 4.725.000\nTổng cộng tiền thanh toán (Grand total) (6): 4.725.000';
 assert.deepEqual(parseInvoiceText(source),{number:'0000424',date:'2025-06-27',amount:4725000,source:'e-invoice-pdf',conflicts:[]});
 assert.equal(parseInvoiceText('Invoice No: 0000424 Payment amount 4.725.000'),null);
 assert.equal(parseInvoiceText('VAT INVOICE\nE-Invoice '+guid),null);
 assert.equal(parseInvoiceText(source+'\nInvoice No: 0000999'),null);
 const missing=parseInvoiceText('VAT INVOICE\nInvoice No: 424\nInvoice Date: 31/02/2025');assert.equal(missing.date,null);assert.equal(missing.amount,null);
});
test('a PDF/API discrepancy is retained for CHECK instead of silently replacing the old evidence',()=>{
 const a={...projectPaymentInvoice({...p,InvoiceNo:'424',InvoiceAmount:4725000}),code:p.PaymentCode};
 const same=mergePaymentInvoice(a,{invoice:{number:'0000424',date:'2025-06-27',amount:4725000,source:'e-invoice-pdf',conflicts:[]}});assert.equal(same.invoice.number,'0000424');assert.deepEqual(same.invoice.conflicts,[]);
 const changed=mergePaymentInvoice(a,{invoice:{number:'999',date:'2025-06-27',amount:5000000,source:'e-invoice-pdf',conflicts:[]}});assert.deepEqual(changed.invoice.conflicts,['number','amount']);
});
const group=(ct,id,rows,kid=91)=>({ContractDepositNo:ct,ContractDepositId:id,KidId:kid,ListPayment:rows,Address:'PRIVATE',PayerName:'PRIVATE'});
const receipt=(code,amount,invoice)=>({PaymentCode:code,PaymentDate:'2026-10-31',Amount:amount,Status:'Paid',PaymentType:'Deposit',InvoiceNo:invoice});
const moving=(code,from,amount=4725000)=>({...receipt(code,amount,null),RelatedContractDepositNo:from,PaymentType:'Transfer fee'});
test('Learner Payments exposes only the current student and connected CT/DEP ancestors, not sibling or unrelated invoices',()=>{
 const page=projectLearnerPaymentPage({KidId:91,TotalCount:5,ListData:[
  group(master,910,[moving('QA2610-PAY-000910',mid),moving('QA2610-PAY-000913',dep,1350000)]),
  group(mid,911,[moving('QA2610-PAY-000911',old)]),group(dep,913,[receipt('QA2610-PAY-000914',1350000,'0000514')]),
  group('QA2610-CT-000999',999,[receipt('QA2610-PAY-000999',999,'0000999')]),
  group('QA2610-CT-000998',998,[receipt('QA2610-PAY-000998',998,'0000998')],92)
 ]},root);
 const f=mergeLearnerFinance(projectHubContract(root),[page]);assert.ok(validateHubContract(f));
 assert.deepEqual(f.relatedFinance.map(f=>f.ct).sort(),[mid,dep].sort());assert.ok(!JSON.stringify(f).includes('PRIVATE'));
 assert.ok(!JSON.stringify(f).includes('0000999'));assert.ok(!JSON.stringify(f).includes('0000998'));
 const bundle=financeBundle(f);assert.equal(bundle.length,2);assert.equal(bundle.find(x=>x.ct===dep).hubContract.payments.rows[0].invoice.number,'0000514');
 // The missing older payer is discoverable by code, but no invoice is invented.
 assert.ok(f.relatedFinance.find(x=>x.ct===mid).movements.rows.some(m=>m.from===old));assert.ok(!bundle.some(f=>f.ct===old));
 assert.equal(projectLearnerPaymentPage({KidId:92,ListData:[]},root),null);
 assert.equal(projectLearnerPaymentPage({ListData:[group(master,999,[])]},root),null);
});
test('pagination merges distinct payments once and incoming transfer rows never collapse genuine equal installments',()=>{
 const page=(pay,amount)=>projectLearnerPaymentPage({ListData:[group(master,910,[moving(pay,mid,amount)])],TotalCount:2},root);
 const f=mergeLearnerFinance(projectHubContract(root),[page('QA2610-PAY-000910',4725000),page('QA2610-PAY-000915',4725000)]);
 assert.equal(f.payments.rows.length,2);assert.equal(f.movements.rows.length,2);
 const raw={...root,ListMovingIn:undefined,ListPayment:[{...p,PaymentCode:'QA2610-PAY-000910',RelatedContractDepositNo:mid,PaymentTypeId:10,CompleteDate:'2026-10-31'},{...p,PaymentCode:'QA2610-PAY-000915',RelatedContractDepositNo:mid,PaymentTypeId:10,CompleteDate:'2026-10-31'}]};
 assert.equal(projectHubMovements(raw).length,2);
});
