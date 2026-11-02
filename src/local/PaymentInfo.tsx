import React,{useId,useState} from 'react';
import {paymentAllocations} from '../core/payment-allocations.mjs';
import HubContractEvidence from './HubContractEvidence';
import InvoiceEvidence from './InvoiceEvidence.tsx';
import {invoiceLabel} from '../core/hub-invoice.mjs';

function FlowIcon({kind='in'}:{kind?:string}){
 const paths:Record<string,React.ReactNode>={
  in:<><path d="M17 5 7 15M7 7v8h8"/></>,
  out:<><path d="M7 17 17 7M9 7h8v8"/></>,
  source:<><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h3"/></>,
  done:<path d="m6 12 4 4 8-8"/>,
  swap:<><path d="M5 8h14l-4-4m4 12H5l4 4"/></>,
  chevron:<path d="m8 10 4 4 4-4"/>
 };
 return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]??paths.in}</svg>;
}
function TraceEvidence({refs=[]}:{refs?:any[]}){
 if(!refs.length)return <span className="moving-no-evidence">Chưa có căn cứ</span>;
 return <details className="moving-evidence"><summary>{refs.length} căn cứ nguồn</summary>{refs.map((ref,i)=><p key={i}><strong>{ref.file}</strong><br/>{ref.sheet} · dòng {ref.rows?.join(', ')??ref.row}</p>)}</details>;
}
export default function PaymentInfo({row,doc,SourceRefs,date,money}:any){
 const [expanded,setExpanded]=useState<Record<string,boolean>>({}),prefix=useId().replace(/[^a-z0-9]/gi,'');
 const data=paymentAllocations(row),total=String(row.cells.contractTotal??'');
 const originalCells=(r:any)=><><td>{date(r.date)}</td><td><InvoiceEvidence payment={r}/></td><td><strong>{r.payment}</strong><small>{r.method??'Chưa rõ phương thức'}{r.term?` · ${r.term}`:''}</small></td><td>{doc(r.contract)}<small>{r.contract===total?'Thu trực tiếp · Contract tổng':'Hóa đơn gốc'}</small>{!r.verified&&<small className="invoice-pending">Thiếu VAT / trạng thái Paid hoặc dữ liệu mâu thuẫn · chưa gộp CT</small>}</td><td className="numeric">{r.amount==null?'Chưa tính':money(r.amount)}</td></>;
 const path=(invoice:any,steps:any[],index:number)=>{
  const nodes=[{code:invoice.receipt.contract,date:invoice.receipt.date,refs:invoice.receipt.refs,label:'Nguồn thu ban đầu',kind:'source'},...steps.map((step:any)=>({code:step.to,date:step.date,dateBasis:step.dateBasis,refs:step.refs,label:step.to===data.ct?'Vào hợp đồng nhận tiền':'Qua hợp đồng trung gian',kind:step.to===data.ct?'done':'in'}))];
  return <div className="moving-path" key={index}>
   {invoice.paths.length>1&&<p className="moving-path-label">Đường phân bổ {index+1}</p>}
   <ol className="moving-timeline">{nodes.map((node,i)=><li key={i} className={node.kind==='done'?'arrived':''}>
    <span className="moving-step-icon"><FlowIcon kind={node.kind}/></span>
    <div className="moving-step-main"><span>{node.label}</span>{doc(node.code,true)}</div>
    <div className="moving-step-meta"><time>{node.dateBasis==='period-end'?'Upgrade theo kỳ · chưa có ngày':date(node.date)}</time><TraceEvidence refs={node.refs}/></div>
   </li>)}</ol>
  </div>;
 };
 return <section className="payment-info" aria-label="Payment info"><h3>Payment info</h3>
  <HubContractEvidence facts={row.hubContract}/>
  {(data.hubReceipts?.length??0)>0&&<div className="hub-backed-payment" aria-label="Hóa đơn gốc đã truy ngược từ Hub">
   <h4>Hóa đơn gốc từ Hub · đã kiểm chứng đường chuyển</h4>
   <p className="evidence-caption">Chỉ tính một lần số tiền Paid từ CT phát sinh hóa đơn, đã xác minh E-Invoice và từng chặng tới CT tổng. Số tiền dưới đây được cộng bổ sung riêng với PaymentList đã nhập.</p>
   <div className="ledger-scroll"><table className="payment-table"><thead><tr><th>CT phát sinh</th><th>Payment code</th><th>E-Invoice ID / Số hóa đơn</th><th>Số tiền phân bổ</th><th>Đường Transfer đã đối chiếu</th></tr></thead>
   <tbody>{data.hubReceipts.map((r:any)=><tr key={r.origin+'|'+r.paymentCode}>
    <td>{doc(r.origin,true)}</td><td><strong>{r.paymentCode}</strong><small>Paid · {r.completeDate}</small></td>
    <td><InvoiceEvidence payment={r}/></td><td className="numeric"><strong>{money(r.allocated)}</strong></td>
    <td>{r.path.map((step:any)=>step.from+' → '+step.to).join(' · ')}</td>
   </tr>)}</tbody></table></div>
   <p className="evidence-caption"><strong>Tổng bổ sung có căn cứ từ Hub: {money(row.reconciliation?.hubSupplement?.amount??0)} ₫</strong>. Không tự coi E-Invoice ID là số VAT; xem chứng từ gốc trên Hub để xác nhận khi cần.</p>
  </div>}
  {data.originals.length>0&&<div className="payment-invoices"><h4>Hóa đơn gốc · PaymentList / Hub</h4><div className="ledger-scroll"><table className="payment-table"><thead><tr><th>Ngày thu gốc</th><th>Số hóa đơn / E-Invoice</th><th>Payment code / Thanh toán</th><th>Nguồn tiền · CT / DEP</th><th>Số tiền hóa đơn</th><th>Truy vết / căn cứ</th></tr></thead><tbody>{data.originals.map((r:any)=><tr className="payment-original" key={r.id} data-invoice={r.id}>{originalCells(r)}<td><SourceRefs refs={r.refs??[]}/></td></tr>)}</tbody></table></div></div>}
  {!row.receipts?.length&&<p className="evidence-caption">Chưa tìm thấy hóa đơn thu gốc trong bộ nguồn.</p>}
  {row.kind==='contract'?<>
   <section className="moving-card moving-in" aria-label="Moving-in · Phân bổ vào hợp đồng">
    <header className="moving-header"><span className="moving-header-icon"><FlowIcon/></span><h4>Phân bổ vào hợp đồng</h4><span className="moving-count">{data.invoices.length} hóa đơn</span></header>
    <div className="moving-summary">
     <div><span>Hợp đồng nhận tiền</span>{doc(data.ct,true)}<small>Ngày nhận: {data.dates.length?data.dates.map((d:number)=>date(d)).join(' · '):data.periodAllocated?'Upgrade theo kỳ · chưa có ngày cụ thể':'Chưa có phân bổ'}{data.periodAllocated&&data.dates.length?' · có Upgrade chưa rõ ngày':''}</small></div>
     <div className="moving-summary-total"><span>Tổng tiền phân bổ</span><strong>{money(data.total)} <span>₫</span></strong>{data.pending.length>0&&<small>Chưa tính đủ · {data.pending.length} phân bổ chờ nguồn</small>}</div>
    </div>
    {data.invoices.length>0&&<div className="moving-scroll"><table className="moving-table"><colgroup><col className="moving-col-invoice"/><col className="moving-col-source"/><col className="moving-col-amount"/><col className="moving-col-trace"/></colgroup><thead><tr><th>Hóa đơn gốc</th><th>Nguồn tiền / Thanh toán</th><th className="moving-amount">Số tiền (₫)</th><th className="moving-trace-heading">Truy vết</th></tr></thead>{data.invoices.map((invoice:any,index:number)=>{
     const r=invoice.receipt,isOpen=expanded[invoice.id]??index===0,pathId=`moving-${prefix}-${index}`;
     return <tbody className={isOpen?'moving-invoice is-open':'moving-invoice'} key={invoice.id}>
      <tr data-invoice={invoice.id}><td><InvoiceEvidence payment={r}/><time>Ngày thu: {date(r.date)}</time></td><td>{doc(r.contract,true)}<small>{r.payment}</small><small>{r.method||'Chưa rõ phương thức'}{r.term?` · ${r.term}`:''}</small>{!r.verified&&<small className="moving-warning">Hóa đơn chưa xác minh</small>}</td><td className="moving-amount"><strong>{invoice.amount==null?'Chưa tính':money(invoice.amount)}</strong></td><td className="moving-trace-cell"><button type="button" className="moving-toggle" aria-label={`Luồng phân bổ hóa đơn ${invoiceLabel(r)||r.payment}`} aria-expanded={isOpen} aria-controls={pathId} onClick={()=>setExpanded(value=>({...value,[invoice.id]:!isOpen}))}>Luồng<FlowIcon kind="chevron"/></button></td></tr>
      <tr className="moving-history-row" hidden={!isOpen}><td colSpan={4}>
       <div className="moving-history" id={pathId}>
        <p className="moving-history-title"><strong>Lịch sử phân bổ</strong><span> · Hóa đơn {invoiceLabel(r)||r.payment}</span></p>
        {invoice.amount!==null&&Math.abs(invoice.amount-r.amount)>1&&<p className="moving-partial">Giá trị hóa đơn gốc: {money(r.amount)} ₫ · Phân bổ vào CT này: {money(invoice.amount)} ₫</p>}
        {invoice.paths.map((steps:any[],i:number)=>path(invoice,steps,i))}
        {invoice.warnings.map((warning:string)=><p className="moving-warning" key={warning}>{warning}</p>)}
       </div>
      </td></tr>
     </tbody>;
    })}</table></div>}
    {data.pending.length>0&&<div className="moving-pending"><h5>Phân bổ chờ xác minh</h5><p>Chưa đủ hóa đơn gốc · chưa cộng vào tổng có căn cứ.</p><div className="moving-scroll"><table className="moving-table moving-pending-table"><thead><tr><th>Ngày chuyển</th><th>Từ mã CT / DEP</th><th>CT nhận tiền</th><th className="moving-amount">Tiền Transfer</th><th>Căn cứ</th></tr></thead><tbody>{data.pending.map((e:any)=><tr key={JSON.stringify([e.payment,e.from,e.to])}><td>{e.dateBasis==='period-end'?'Upgrade theo kỳ · chưa có ngày':date(e.date)}</td><td>{doc(e.from,true)}</td><td>{doc(e.to,true)}</td><td className="moving-amount">{money(e.amount)}</td><td><TraceEvidence refs={e.refs}/></td></tr>)}</tbody></table></div></div>}
    {!data.incoming.length&&<p className="moving-empty">Chưa có dòng chuyển vào trong nguồn đang dùng.</p>}
    <footer className="moving-footer"><FlowIcon kind="swap"/><span>Chuyển nội bộ · <strong>Không cộng lại vào tổng thu</strong></span></footer>
   </section>
   <section className="moving-card moving-out" aria-label="Moving-out · Chuyển ra khỏi CT">
    <header className="moving-header"><span className="moving-header-icon"><FlowIcon kind="out"/></span><h4>Chuyển ra khỏi hợp đồng</h4><span className="moving-count">{data.outgoing.length} lần chuyển</span></header>
    {data.outgoing.length?<div className="moving-scroll"><table className="moving-table moving-out-table"><thead><tr><th>Ngày / Nguồn chuyển</th><th>Hợp đồng nhận tiền</th><th className="moving-amount">Số tiền (₫)</th><th>Truy vết / căn cứ</th></tr></thead><tbody>{data.outgoing.map((e:any)=><tr key={JSON.stringify([e.payment,e.from,e.to])}><td><time>{e.dateBasis==='period-end'?'Upgrade theo kỳ · chưa có ngày':date(e.date)}</time>{doc(e.from,true)}</td><td>{doc(e.to,true)}<small className={e.invoiceBacked?'':'moving-warning'}>{e.invoiceBacked?'Có hóa đơn đã thanh toán':'Chưa đủ hóa đơn · chưa gộp CT'}</small></td><td className="moving-amount"><strong>{money(Math.abs(e.debit??e.amount))}</strong></td><td><small>{e.kind}</small><TraceEvidence refs={e.refs}/></td></tr>)}</tbody></table></div>:<p className="moving-empty">Chưa có dòng chuyển ra trong nguồn đang dùng.</p>}
    <footer className="moving-footer"><FlowIcon kind="swap"/><span>Chuyển nội bộ · <strong>Không tạo khoản thu mới</strong></span></footer>
   </section>
   <details className="payment-trace-notes"><summary>Cách đọc thanh toán</summary><p>Mỗi hóa đơn gốc hiển thị một lần; ngày và phương thức là của PaymentList gốc. Ngày nhận và tổng phân bổ lấy từ lần vào CT đang xem. Các bước trung gian chỉ để truy vết, không tạo tiền thu mới. Chưa đủ căn cứ tách từng hóa đơn thì hiển thị Chưa tính. Chỉ hiển thị nguồn đến {date(row.reconciliation?.cutoff)}.</p></details>
  </>:<p className="evidence-caption">Chứng từ chưa có CT nhận tiền duy nhất trong nguồn; chưa gắn khóa học.</p>}
 </section>;
}
