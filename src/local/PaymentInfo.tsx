import React,{useState} from 'react';
import {paymentAllocations} from '../core/payment-allocations.mjs';

export default function PaymentInfo({row,doc,SourceRefs,date,money}:any){
 const [expanded,setExpanded]=useState<Record<string,boolean>>({});
 const data=paymentAllocations(row),total=String(row.cells.contractTotal??'');
 const headers=(allocation=false)=><thead><tr><th>Ngày hóa đơn gốc</th><th>VAT Invoice No.</th><th>Payment code / Thanh toán</th><th>Nguồn tiền · CT / DEP</th><th>{allocation?'Phân bổ vào CT':'Số tiền hóa đơn'}</th><th>Truy vết / căn cứ</th></tr></thead>;
 const originalCells=(r:any,amount:any)=><><td>{date(r.date)}</td><td><strong>{r.vat||'Chưa có số VAT'}</strong></td><td><strong>{r.payment}</strong><small>{r.method??'Chưa rõ phương thức'}{r.term?` · ${r.term}`:''}</small></td><td>{doc(r.contract)}<small>{r.contract===total?'Thu trực tiếp · Contract tổng':'Hóa đơn gốc'}</small>{!r.verified&&<small className="invoice-pending">Thiếu VAT / trạng thái Paid hoặc dữ liệu mâu thuẫn · chưa gộp CT</small>}</td><td className="numeric">{amount==null?'Chưa tính':money(amount)}</td></>;
 const path=(invoice:any,steps:any[],index:number)=><div className="payment-invoice-path" key={index}>
  {invoice.paths.length>1&&<p>Đường phân bổ {index+1} · các căn cứ có liên quan</p>}
  <ol>
   <li><strong>Nguồn thu ban đầu</strong><div>{doc(invoice.receipt.contract)}</div><small>{date(invoice.receipt.date)}</small><SourceRefs refs={invoice.receipt.refs??[]}/></li>
   {steps.map((step:any,i:number)=><li key={JSON.stringify([step.payment,step.from,step.to])}>
    <strong>{step.to===data.ct?'Vào hợp đồng nhận tiền':'Qua hợp đồng trung gian'}</strong><div>{doc(step.to)}</div><small>{date(step.date)}</small><SourceRefs refs={step.refs??[]}/>
   </li>)}
  </ol>
 </div>;
 return <section className="payment-info" aria-label="Payment info"><h3>Payment info</h3>
  {data.originals.length>0&&<div className="payment-invoices"><h4>Hóa đơn gốc · PaymentList</h4><div className="ledger-scroll"><table className="payment-table">{headers()}<tbody>{data.originals.map((r:any)=><tr className="payment-original" key={r.id} data-invoice={r.id}>{originalCells(r,r.amount)}<td><SourceRefs refs={r.refs??[]}/></td></tr>)}</tbody></table></div></div>}
  {!row.receipts?.length&&<p className="evidence-caption">Chưa tìm thấy hóa đơn thu gốc trong bộ nguồn.</p>}
  {row.kind==='contract'?<>
   <div className="payment-movement in"><h4>Moving-in · Phân bổ vào hợp đồng</h4>
    <div className="contract-summary-grid payment-allocation-summary">
     <div><span>Hợp đồng nhận tiền</span><strong>{doc(data.ct)}</strong><small>Ngày nhận: {data.dates.length?data.dates.map((d:number)=>date(d)).join(' · '):'Chưa có phân bổ'}</small></div>
     <div><span>Tổng tiền phân bổ có hóa đơn</span><strong>{money(data.total)} ₫</strong><small>{data.invoices.length} hóa đơn gốc · chỉ cộng lần nhận vào CT này</small></div>
    </div>
    {data.invoices.length>0&&<div className="ledger-scroll"><table className="payment-table">{headers(true)}<tbody>{data.invoices.map((invoice:any)=>{
     const r=invoice.receipt;
     return <React.Fragment key={invoice.id}><tr className="payment-original" data-invoice={invoice.id}>{originalCells(r,invoice.amount)}<td>
      <button type="button" className="quiet-button payment-trace-toggle" aria-expanded={!!expanded[invoice.id]} aria-controls={'invoice-path-'+r.payment} onClick={()=>setExpanded(value=>({...value,[invoice.id]:!value[invoice.id]}))}>Luồng · Hóa đơn {r.vat||r.payment}</button>
     </td></tr>{expanded[invoice.id]&&<tr className="payment-transfer payment-transfer-total"><td colSpan={6}>
      <div className="payment-invoice-trace" id={'invoice-path-'+r.payment}>
       <p>Lịch sử phân bổ · Hóa đơn {r.vat||r.payment}</p>
       <p>Giá trị hóa đơn gốc: {money(r.amount)} ₫{invoice.amount!==null&&Math.abs(invoice.amount-r.amount)>1?` · Phân bổ vào CT này: ${money(invoice.amount)} ₫`:''}</p>
       {invoice.paths.map((steps:any[],i:number)=>path(invoice,steps,i))}
       {invoice.warnings.map((warning:string)=><p className="invoice-pending" key={warning}>{warning}</p>)}
      </div>
     </td></tr>}</React.Fragment>;
    })}</tbody></table></div>}
    {data.pending.length>0&&<div className="payment-unverified"><p className="evidence-caption invoice-pending">Phân bổ chưa đủ hóa đơn gốc · chưa cộng vào tổng có căn cứ</p><div className="ledger-scroll"><table className="payment-table"><thead><tr><th>Ngày chuyển</th><th>Từ mã CT / DEP</th><th>CT nhận tiền</th><th>Tiền theo Transfer</th><th>Căn cứ</th></tr></thead><tbody>{data.pending.map((e:any)=><tr key={JSON.stringify([e.payment,e.from,e.to])}><td>{date(e.date)}</td><td>{doc(e.from)}</td><td>{doc(e.to)}</td><td className="numeric">{money(e.amount)}</td><td><SourceRefs refs={e.refs??[]}/></td></tr>)}</tbody></table></div></div>}
    {!data.incoming.length&&<p className="evidence-caption">Chưa có dòng chuyển vào trong nguồn đang dùng.</p>}
    <p className="evidence-caption">Chuyển nội bộ · Không cộng lại vào tổng thu. Mở Luồng để xem nguồn thu ban đầu, CT trung gian và CT nhận tiền.</p>
   </div>
   <div className="payment-movement out"><h4>Moving-out · Chuyển ra khỏi CT</h4>{data.outgoing.length?<div className="ledger-scroll"><table className="payment-table"><thead><tr><th>Ngày chuyển</th><th>Từ mã CT / DEP</th><th>Đến mã CT / DEP</th><th>Số tiền chuyển</th><th>Hóa đơn thu gốc</th><th>Căn cứ Transfer / liên kết</th></tr></thead><tbody>{data.outgoing.map((e:any)=><tr key={JSON.stringify([e.payment,e.from,e.to])}><td>{date(e.date)}</td><td>{doc(e.from)}</td><td>{doc(e.to)}</td><td className="numeric">{money(Math.abs(e.debit??e.amount))}</td><td><span className={e.invoiceBacked?'invoice-confirmed':'invoice-pending'}>{e.invoiceBacked?'Có hóa đơn đã thanh toán':'Chưa đủ hóa đơn · chưa gộp CT'}</span></td><td><small>{e.kind}</small><SourceRefs refs={e.refs??[]}/></td></tr>)}</tbody></table></div>:<p className="evidence-caption">Chưa có dòng chuyển ra trong nguồn đang dùng.</p>}</div>
   <details className="payment-trace-notes"><summary>Cách đọc thanh toán</summary><p>Mỗi hóa đơn gốc hiển thị một lần; ngày và phương thức là của PaymentList gốc. Ngày nhận và tổng phân bổ lấy từ lần vào CT đang xem. Các bước trung gian chỉ để truy vết, không tạo tiền thu mới. Chưa đủ căn cứ tách từng hóa đơn thì hiển thị Chưa tính. Chỉ hiển thị nguồn đến {date(row.reconciliation?.cutoff)}.</p></details>
  </>:<p className="evidence-caption">Chứng từ chưa có CT nhận tiền duy nhất trong nguồn; chưa gắn khóa học.</p>}
 </section>;
}
