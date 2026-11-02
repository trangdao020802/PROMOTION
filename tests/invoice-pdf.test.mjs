import test from 'node:test';
import assert from 'node:assert/strict';
import {readInvoicePDF} from '../src/bridge/invoice-pdf.mjs';
import {invoiceDocument as document} from './helpers/invoice-document.mjs';

test('the actual PDF reader extracts invoice no, issue date and grand total without returning buyer information',async()=>{
 const value=await readInvoicePDF(document(['VAT INVOICE','Invoice No: 0000424','Invoice Date: 27/06/2025','Buyer: PRIVATE-DO-NOT-EXPORT','Grand total: 4.725.000']));
 assert.deepEqual(value,{number:'0000424',date:'2025-06-27',amount:4725000,source:'e-invoice-pdf',conflicts:[]});assert.ok(!JSON.stringify(value).includes('PRIVATE'));
 assert.equal(await readInvoicePDF(new TextEncoder().encode('<!doctype html>LOGIN')),null);
 assert.equal(await readInvoicePDF(document(['PAYMENT HISTORY','Payment code: QA2506-PAY-000424','Amount: 4.725.000'])),null);
});
