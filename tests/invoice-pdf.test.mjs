import test from 'node:test';
import assert from 'node:assert/strict';
import {readInvoicePDF} from '../src/bridge/invoice-pdf.mjs';
function document(lines){
 const stream='BT /F1 12 Tf 40 750 Td '+lines.map((line,i)=>(i?'0 -24 Td ':'')+'('+line.replace(/[()\\]/g,'\\$&')+') Tj').join('\n')+' ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream'];
 let pdf='%PDF-1.4\n',offsets=[0];for(const [i,obj]of objects.entries()){offsets.push(Buffer.byteLength(pdf));pdf+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';}
 const xref=Buffer.byteLength(pdf);pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
 return new Uint8Array(Buffer.from(pdf));
}
test('the actual PDF reader extracts invoice no, issue date and grand total without returning buyer information',async()=>{
 const value=await readInvoicePDF(document(['VAT INVOICE','Invoice No: 0000424','Invoice Date: 27/06/2025','Buyer: PRIVATE-DO-NOT-EXPORT','Grand total: 4.725.000']));
 assert.deepEqual(value,{number:'0000424',date:'2025-06-27',amount:4725000,source:'e-invoice-pdf',conflicts:[]});assert.ok(!JSON.stringify(value).includes('PRIVATE'));
 assert.equal(await readInvoicePDF(new TextEncoder().encode('<!doctype html>LOGIN')),null);
 assert.equal(await readInvoicePDF(document(['PAYMENT HISTORY','Payment code: QA2506-PAY-000424','Amount: 4.725.000'])),null);
});
