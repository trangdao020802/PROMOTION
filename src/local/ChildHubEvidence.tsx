import React,{useEffect,useRef,useState} from 'react';
import {localFetch} from './api.mjs';
import {compareChildFacts} from '../core/child-hub-evidence.mjs';
import UpstreamHubOrigins from './UpstreamHubOrigins.tsx';

const money=(n:any)=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('vi-VN')+' đ':'—';
const date=(d:any)=>typeof d==='number'?new Date(Date.UTC(1899,11,30)+d*86400000).toLocaleDateString('vi-VN',{timeZone:'UTC'}):d?String(d).split('-').reverse().join('/'):'—';
const request=async(path:string,init:any={})=>{
 const res=await localFetch(path,init),body=await res.json();
 if(!res.ok)throw Error(body.error||'Chưa đọc hoặc lưu được chứng từ Hub.');
 return body;
};
export default function ChildHubEvidence({row,ct,datasetId,link,hubLinks,onHubSaved,onRead,disabled}:any){
 const student=String(row?.cells?.F??''),masterCt=String(row?.ct||row?.cells?.contractTotal||'');
 const child=!!ct&&ct!==masterCt&&(row?.sourceContracts??[]).includes(ct)&&ct.includes('-CT-');
 const url=link?.url||'',[fact,setFact]=useState<any>(null),[message,setMessage]=useState(''),
 [busy,setBusy]=useState(false),[problem,setProblem]=useState(''),[ready,setReady]=useState(false);
 const active=useRef<AbortController|null>(null);
 const query=new URLSearchParams({datasetId:datasetId??'',masterCt,ct:ct??'',student});
 const run=async(force=false,signal?:AbortSignal)=>{
  if(!child||!url||!datasetId||disabled||active.current)return;
  const task=new AbortController();active.current=task;setBusy(true);setProblem('');
  if(signal)signal.addEventListener('abort',()=>task.abort(),{once:true});
  try{
   setMessage('Đang đọc Payment Info của '+ct+' từ link đã gắn…');
   const current=await request('/api/hub-child-facts?'+query,{signal:task.signal});
   if(task.signal.aborted)return;
   if(!force&&current.fact?.url===url&&current.fact?.hubContract?.payments?.state==='read'){
    setFact(current.fact);setMessage('Đã có dữ liệu Hub của đúng CT, không đọc lại.');return;
   }
   const payload=await onRead({ct,student,url,readFinance:true},(text:string)=>setMessage(String(text).slice(0,450)),task.signal);
   if(task.signal.aborted)return;
   if(!payload?.hubContract)throw Error('Hub chưa trả về Payment Info có định danh CT rõ ràng. Không tự ghi tiền từ trang không đủ căn cứ.');
   setMessage('Đã đọc Hub; đang lưu chứng cứ cho đúng CT con…');
   const saved=await request('/api/hub-child-facts',{method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({datasetId,masterCt,ct,student,url,payload,version:current.version}),signal:task.signal});
   if(task.signal.aborted)return;
   setFact(saved.fact);setMessage(saved.fact.hubContract.payments.state==='read'?'Đã lưu Payment Info và đối chiếu dữ liệu gốc.':'Đã lưu căn cứ Hub; chi tiết Payment vẫn thiếu, cần đọc lại hoặc bổ sung nguồn.');
  }catch(e:any){if(!task.signal.aborted){setProblem(e.message||'Không đọc được Hub.');setMessage('Không thay đổi bảng thu khi đọc lỗi.');}}
  finally{if(active.current===task)active.current=null;if(!task.signal.aborted)setBusy(false);}
 };
 useEffect(()=>{
  const controller=new AbortController();setFact(null);setProblem('');setMessage('');setReady(false);
  if(child&&url&&datasetId){setReady(true);void run(false,controller.signal);}
  return()=>{controller.abort();active.current?.abort();active.current=null;};
 },[ct,url,datasetId,masterCt,student,child,disabled]);
 if(!child)return null;
 const comparisons=fact?compareChildFacts(fact,row):null;
 return <section className="child-hub-facts" aria-label={'Đọc thêm chứng từ từ '+ct}>
  <h4>Chứng từ bổ sung · {ct}</h4>
  <p>Gắn link đúng CT con sẽ tự đọc thông tin được Hub cho phép. Tiền nhận/chuyển chỉ dùng đối chiếu với PaymentList và Transfer, không tự cộng thành tiền thu mới.</p>
  {!url?<p role="status">CT này chưa có link chi tiết trên Hub. Hãy gắn link và lưu phía trên.</p>:
   <div className="child-hub-action"><span role="status">{message||(ready?'Đang chuẩn bị đọc Hub…':'Chưa kiểm tra')}</span>
   <button type="button" className="secondary-button" disabled={busy||disabled} onClick={()=>void run(true)}>{busy?'Đang đọc…':'Đọc lại chứng từ CT này'}</button></div>}
  {problem&&<p role="alert" className="child-hub-warning">{problem}</p>}
  {comparisons&&<div className="child-hub-results">
   <p><strong>Payment Info tại Hub:</strong> {comparisons.paymentState==='read'?comparisons.payments.length+' khoản':'Chưa đọc đủ'} · <strong>Transfer trong nguồn:</strong> {comparisons.transfers.length} bước.</p>
   {comparisons.paymentState!=='read'&&<p className="child-hub-warning">Hub chưa trả về danh sách thanh toán đầy đủ. Không coi ô trống là 0.</p>}
   {comparisons.payments.length>0&&<div className="child-hub-scroller"><table><thead><tr><th>Mã Payment Hub</th><th>Tiền Hub</th><th>Ngày hoàn tất</th><th>Hóa đơn PaymentList</th><th>Đối chiếu</th></tr></thead>
    <tbody>{comparisons.payments.map((p:any,i:number)=><tr key={p.code||i}><td>{p.code||'Chưa có mã'}<small>{p.method}</small></td><td>{money(p.amount)}</td><td>{date(p.completeDate)}</td><td>{p.invoice||'Chưa tìm thấy hóa đơn gốc'}<small>{p.sourceAmount!==null?money(p.sourceAmount):''}</small></td><td>{p.status==='matched'?'Khớp tiền':p.status==='conflict'?'CHECK · chênh tiền':'CHECK · thiếu nguồn'}</td></tr>)}</tbody></table></div>}
   <p><strong>Moving trên Hub:</strong> {comparisons.movementState==='read'?comparisons.hubMoves.length+' bước':'Chưa có danh sách được xác minh từ Hub'}.</p>
   {comparisons.hubMoves.length>0&&<details open><summary>Moving-in / Moving-out đọc từ Hub ({comparisons.hubMoves.length})</summary>
    {comparisons.hubMoves.map((m:any,i:number)=><p key={i}>{m.from} → {m.to} · {money(m.amount)} · {date(m.date)} · {m.sourceMatched?(m.invoiceBacked?'Khớp Transfer có hóa đơn gốc':'CHECK · Transfer chưa chứng minh hóa đơn'):'CHECK · chưa có trong Transfer nguồn'}</p>)}</details>}
   {comparisons.transfers.length>0&&<details><summary>Transfer từ file nguồn của CT này ({comparisons.transfers.length})</summary>
    {comparisons.transfers.map((t:any,i:number)=><p key={i}>{t.from} → {t.to} · {money(t.amount)} · {date(t.date)} · {t.backed?'Có đối chiếu hóa đơn gốc':'CHECK · chưa đủ chứng từ gốc'}</p>)}</details>}
   {!comparisons.transfers.length&&<p className="child-hub-warning">Chưa thấy Transfer tương ứng trong bộ nguồn đang mở; không suy từ số tiền Hub.</p>}
   <small className="child-hub-source">Cập nhật Hub: {new Date(fact.capturedAt).toLocaleString('vi-VN')}. Các khoản Moving lấy từ Hub chỉ để đối chiếu; chỉ chuyển thành tiền thu sau khi có hóa đơn Paid gốc trong PaymentList và Transfer khớp.</small>
  </div>}
  {url&&<UpstreamHubOrigins row={row} parentCt={ct} parentFact={fact} datasetId={datasetId} hubLinks={hubLinks} onHubSaved={onHubSaved} onRead={onRead} disabled={disabled} path={[ct]} />}
 </section>;
}
