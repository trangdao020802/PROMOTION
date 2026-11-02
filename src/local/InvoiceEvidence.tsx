import React from 'react';
import {paymentInvoiceNumber,invoiceNumber,eInvoiceKey,displayedInvoiceNo} from '../core/hub-invoice.mjs';
export default function InvoiceEvidence({payment={}}:any){
 const no=paymentInvoiceNumber(payment)??invoiceNumber(payment.invoiceNumber)??invoiceNumber(payment.vat);
 const key=payment.eInvoiceKey??eInvoiceKey(payment.invoiceRef??payment.vat);
 const day=payment.invoice?.date??payment.invoiceDate,value=payment.invoice?.amount??payment.invoiceAmount;
 const conflicts=payment.invoice?.conflicts??payment.invoiceConflicts??[];
 return <span className="invoice-evidence"><strong>{no??displayedInvoiceNo(payment.vat??payment.invoiceRef)}</strong>
  {key&&<small className="invoice-key">E-Invoice: {key}</small>}
  {day&&<small>Ngày hóa đơn: {String(day).split('-').reverse().join('/')}</small>}
  {typeof value==='number'&&<small>Tiền hóa đơn: {value.toLocaleString('vi-VN')} đ</small>}
  {conflicts.length>0&&<small className="moving-warning">CHECK · hóa đơn khác số / ngày / tiền từ nguồn đối chiếu</small>}
 </span>;
}
