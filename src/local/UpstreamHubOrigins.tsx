import React,{useEffect,useRef,useState} from 'react';
import {localFetch} from './api.mjs';
import {ctCode,upstreamCandidates,originPaymentSummary} from '../core/hub-upstream.mjs';
import {compareChildFacts} from '../core/child-hub-evidence.mjs';
import {hubDocumentId} from '../core/hub-document.mjs';

const read=async(path:string,options:any={})=>{
 const response=await localFetch(path,options),json=await response.json();
 if(!response.ok)throw Error(json.error||'Không lưu hoặc đọc được chứng từ Hub.');
 return json;
};
const V=(value:any)=>typeof value==='number'&&Number.isFinite(value)?value.toLocaleString('vi-VN')+' đ':'—';
function OriginNode({row,ct,parentCt,datasetId,hubLinks,onHubSaved,onRead,onFactsSaved,depth,path,disabled}:any){
 const masterCt=row.ct||row.cells?.contractTotal,student=String(row.cells.F),link=hubLinks?.[ct];
 const [url,setUrl]=useState(link?.url||''),[fact,setFact]=useState<any>(null),[busy,setBusy]=useState(false),
 [error,setError]=useState(''),[status,setStatus]=useState('');
 const task=useRef<AbortController|null>(null);
 const params=new URLSearchParams({datasetId,masterCt,student,ct,parentCt});
 const scan=async(nextLink:string,signal?:AbortSignal,force=false)=>{
  if(!nextLink||disabled||task.current)return;
  const ctrl=new AbortController();task.current=ctrl;setBusy(true);setError('');
  if(signal)signal.addEventListener('abort',()=>ctrl.abort(),{once:true});
  try{
   setStatus('Đang đọc hóa đơn gốc và Moving-out: '+ct);
   const current=await read('/api/hub-child-facts?'+params,{signal:ctrl.signal});
   if(ctrl.signal.aborted)return;
   if(!force&&current.fact?.url===nextLink&&current.fact.hubContract?.payments?.state==='read'&&current.fact.hubContract?.movements?.state==='read'){
    setFact(current.fact);setStatus('Đã có chứng cứ Hub lưu trước đó.');return;
   }
   const payload=await onRead({ct,student,url:nextLink,readFinance:true},(v:string)=>setStatus(v),ctrl.signal);
   if(ctrl.signal.aborted)return;
   if(!payload?.hubContract)throw Error('Chưa lấy được Payment Info của CT gốc. Kiểm tra link, phiên Hub và bấm Đọc lại.');
   const saved=await read('/api/hub-child-facts',{method:'PATCH',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({datasetId,masterCt,student,ct,parentCt,url:nextLink,payload,version:current.version}),signal:ctrl.signal});
   setFact(saved.fact);await onFactsSaved?.();setStatus('Đã lưu chứng từ và tính lại đường chuyển tiền về CT tổng.');
  }catch(e:any){if(!ctrl.signal.aborted)setError(e?.message||'Hub chưa trả thông tin.');}
  finally{if(task.current===ctrl)task.current=null;if(!ctrl.signal.aborted)setBusy(false);}
 };
 useEffect(()=>{
  const controller=new AbortController();
  setFact(null);setUrl(link?.url||'');setError('');setStatus('');
  if(link?.url&&!disabled)void scan(link.url,controller.signal);
  return()=>{controller.abort();task.current?.abort();task.current=null;};
 },[ct,link?.url,datasetId,parentCt,student,disabled]);
 const attach=async()=>{
  if(busy||disabled)return;
  setBusy(true);setError('');
  try{
   const next=url.trim();
   if(!hubDocumentId(next,ct))throw Error('Dán đúng link chi tiết CT / DEP tương ứng trên Hub.');
   const resp=await read('/api/hub-links',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ct,url:next,datasetId,version:link?.version??0})});
   onHubSaved(resp.link);setStatus('Đã gắn link '+ct+'. Đang đọc thông tin…');
  }catch(e:any){setError(e.message);}
  finally{setBusy(false);}
 };
 const summary=fact?originPaymentSummary([fact]):null;
 const verified=(row?.reconciliation?.hubSupplement?.receipts??[]).filter((r:any)=>r.origin===ct);
 const counted=(r:any)=>verified.some((item:any)=>item.paymentCode===r.paymentCode);
 const audit=fact?compareChildFacts(fact,row):null;
 const related=fact?.hubContract?.movements?.rows?.some((m:any)=>m.from===ct&&m.to===parentCt);
 const matchingTransfer=(row.reconciliation?.movementHistory??[]).some((m:any)=>m.from===ct&&m.to===parentCt);
 return <div className="hub-origin-node">
  <div className="hub-origin-head"><strong>{ct}</strong><small>CT nguồn chuyển tới {parentCt}</small></div>
  <div className="hub-origin-link">
   <input aria-label={'Link Hub của '+ct} value={url} disabled={busy||disabled} onChange={e=>setUrl(e.target.value)} placeholder="https://hub24.apollo.vn:7777/contract/detail/..." />
   <button type="button" disabled={busy||disabled||!url.trim()||url.trim()===link?.url} onClick={()=>void attach()}>Lưu link CT gốc</button>
   {link?.url&&<button type="button" disabled={busy||disabled} onClick={()=>void scan(link.url,undefined,true)}>Đọc lại hóa đơn</button>}
  </div>
  {status&&<p role="status">{status}</p>}{error&&<p role="alert" className="child-hub-warning">{error}</p>}
  {fact&&<button type="button" className="secondary-button" disabled={busy||disabled} onClick={()=>void onFactsSaved?.().catch((e:any)=>setError(e.message))}>Tính lại chứng từ đã lưu</button>}
  {fact&&<>
   <p><strong>Chứng từ tại CT gốc:</strong> {fact.hubContract.payments.state==='read'?(summary?.payments.length+' Payment · '+V(summary?.hubPaid)):'Chưa đọc được hóa đơn/Payment Info đầy đủ'}.</p>
   {summary?.payments.map((p:any,i:number)=><p key={i}>
    <strong>{p.paymentCode}</strong> · {V(p.amount)} · {p.complete?'Đã thanh toán trên Hub':'Chưa xác minh Paid'}.
    <span> E-Invoice ID / Số hóa đơn: {fact.hubContract.payments.rows[i]?.invoiceRef??'Chưa đọc được từ Hub'}</span> ·
    {counted(p)?'Đã phân bổ có căn cứ trong tổng thu':audit?.payments[i]?.status==='matched'?'Đã có trong PaymentList (không cộng lại)':'CHECK · chờ E-Invoice và đường Transfer đủ căn cứ'}
   </p>)}
   <p><strong>Chặng {ct} → {parentCt}:</strong> {related?'Có Moving-out trên Hub':matchingTransfer?'Có trong Transfer đã nhập':'CHECK · chưa chứng minh được mối liên kết Transfer'}.</p>
   {fact.hubContract.movements?.state!=='read'&&<p className="child-hub-warning">Hub chưa trả Moving-out. Không tự tính tiền thu cho Contract tổng.</p>}
   {fact.hubContract.payments.state==='read'&&summary?.hubPaid===0&&<p className="child-hub-warning">CT này cũng chưa có khoản thu. Kiểm tra CT nguồn trước đó.</p>}
   {depth<12&&<UpstreamHubOrigins row={row} parentCt={ct} parentFact={fact} datasetId={datasetId} hubLinks={hubLinks} onHubSaved={onHubSaved} onRead={onRead} onFactsSaved={onFactsSaved} disabled={disabled} depth={depth+1} path={[...path,ct]} />}
  </>}
 </div>;
}
export default function UpstreamHubOrigins({row,parentCt,parentFact,datasetId,hubLinks,onHubSaved,onRead,onFactsSaved,disabled,depth=0,path=[]}:any){
 const masterCt=row.ct||row.cells?.contractTotal,student=String(row.cells.F);
 const [manual,setManual]=useState<string[]>([]),[input,setInput]=useState(''),[version,setVersion]=useState(0),[error,setError]=useState('');
 const params=new URLSearchParams({datasetId,masterCt,student,parentCt});
 useEffect(()=>{let live=true;setManual([]);setVersion(0);void read('/api/hub-upstreams?'+params).then(x=>{if(live){setManual(x.codes);setVersion(x.version);}}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[datasetId,masterCt,student,parentCt]);
 const discovered=upstreamCandidates(row,parentCt,parentFact,manual).filter(ct=>!path.includes(ct));
 const add=async()=>{
  const code=ctCode(input);if(!code||code===masterCt||code===parentCt||path.includes(code)){setError('Mã CT nguồn không hợp lệ hoặc tạo vòng chuyển tiền.');return;}
  try{const result=await read('/api/hub-upstreams',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({datasetId,masterCt,student,parentCt,upstreamCt:code,version})});
   setManual(result.codes);setVersion(result.version);setInput('');setError('');
  }catch(e:any){setError(e.message);}
 };
 if(depth>12)return <p className="child-hub-warning">Chuỗi Transfer vượt 12 tầng. Cần đối chiếu thủ công.</p>;
 return <section className="hub-upstream-section"><h4>Truy ngược CT phát sinh hóa đơn · từ {parentCt}</h4>
  <p>CT / DEP trung gian có thể chỉ có Moving-in. Gắn link nguồn để đọc tiếp trong nền. Hóa đơn nguồn có thể thuộc học viên khác; số tiền phải có đường chuyển vào hồ sơ này.</p>
  {discovered.map(ct=><OriginNode key={ct} row={row} ct={ct} parentCt={parentCt} datasetId={datasetId} hubLinks={hubLinks} onHubSaved={onHubSaved} onRead={onRead} onFactsSaved={onFactsSaved} disabled={disabled} depth={depth} path={path} />)}
  {!discovered.length&&<p className="child-hub-warning">Chưa biết CT chuyển vào. Nhập mã từ Moving-in hoặc lịch sử Transfer để tìm CT phát sinh tiền.</p>}
  <div className="hub-origin-link"><input aria-label={'Mã CT chuyển vào '+parentCt} value={input} disabled={disabled} onChange={e=>setInput(e.target.value)} placeholder="Nhập mã CT hoặc DEP nguồn" />
   <button type="button" disabled={disabled||!input.trim()} onClick={()=>void add()}>Thêm CT nguồn cần gắn link</button></div>
  {error&&<p role="alert" className="child-hub-warning">{error}</p>}
 </section>;
}
