import React,{useEffect,useMemo,useRef,useState} from 'react';
import {contractInputPlan,fillContractInputs} from '../core/hub-course.mjs';
import {assetPath} from './paths.mjs';
import {localFetch as fetch} from './api.mjs';
import {inputTargets,completedInputs} from '../core/hub-input-progress.mjs';
const names:any={courseFee:'Course fee KOC',hoursPerWeek:'Hour/week',package:'Package',giftcode:'Giftcode No',discount:'Discount apply',groupKoc:'Group KOC',contractType:'Contract type'};
const json=async(path:string,options:any={})=>{const res=await fetch(path,options),value=await res.json();if(!res.ok)throw Error(value.error||'Chưa lưu được đầu vào theo CT.');return value;};
export default function HubInputAutofill({rows,datasetId,disabled,checkBridge,makeLookup,readInputs,onSave,onLinkSaved,onBusyChange}:any){
 const [refresh,setRefresh]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[results,setResults]=useState<any[]>([]),[bridgeNeeded,setBridgeNeeded]=useState(false),[run,setRun]=useState<any>(null);
 const controller=useRef<AbortController|null>(null),reset=useRef(false),revision=useRef(0),done=reset.current?[]:completedInputs(run,refresh),plan=useMemo(()=>contractInputPlan(rows,{refresh,completed:done}),[rows,refresh,run]);
 useEffect(()=>{let gone=false;const epoch=++revision.current;reset.current=false;setRun(null);setRefresh(false);void json('/api/hub-input-progress?dataset='+encodeURIComponent(datasetId)).then(data=>{if(!gone&&epoch===revision.current){setRun(data.run);setRefresh(data.run?.refresh??false);}}).catch(()=>{});return()=>{gone=true;controller.current?.abort();};},[datasetId]);
 const start=async()=>{
  if(busy||disabled||!plan.length)return;
  revision.current++;
  const task=new AbortController();controller.current=task;setBusy(true);onBusyChange?.(true);setResults([]);setBridgeNeeded(false);setMessage('Đang kiểm tra cầu nối Hub…');
  try{
   const ready=await checkBridge(task.signal),parts=String(ready.version??'').split('.').map(Number),version=(parts[0]||0)*1e6+(parts[1]||0)*1e3+(parts[2]||0);
   if(version<1006007||(!ready.capabilities?.includes('contract-inputs')||!ready.capabilities?.includes('course-network')||!ready.capabilities?.includes('no-new-tabs'))){setBridgeNeeded(true);throw Error('Cần cầu nối Hub 1.6.7 để tự lấy đủ Input theo Contract.');}
   const previous=(await json('/api/hub-input-progress?dataset='+encodeURIComponent(datasetId),{signal:task.signal})).run;
   const selected=contractInputPlan(rows,{refresh,completed:reset.current?[]:completedInputs(previous,refresh)});
   if(!selected.length){setRun(previous);setMessage('Không còn CT thiếu Input trong bộ lọc này. Có thể tạo lượt mới để đọc lại.');return;}
   let activeRun=(await json('/api/hub-input-progress',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'start',datasetId,refresh,targets:inputTargets(selected,refresh),version:previous?.version??0,reset:reset.current}),signal:task.signal})).run;
   reset.current=false;setRun(activeRun);
   const lookup=makeLookup(selected.map((r:any)=>r.ct||r.cells.contractTotal),setMessage,task.signal);
   const results=await fillContractInputs(selected,{signal:task.signal,progress:setMessage,update:setResults,
    loadLink:async(ct:string)=>(await json('/api/hub-links?ct='+encodeURIComponent(ct),{signal:task.signal})).link,
    lookup,
    saveLink:async(link:any)=>{const data=await json('/api/hub-links',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(link),signal:task.signal});onLinkSaved?.(data.link);return data.link;},
    read:(expected:any)=>readInputs(expected,setMessage,task.signal),save:onSave,
    checkpoint:async(row:any,payload:any,saved:any)=>{
     // Finish the checkpoint for an already saved CT even if Stop was just pressed.
     const data=await json('/api/hub-input-progress',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'complete',datasetId,runId:activeRun.runId,version:activeRun.version,ct:payload.ct,student:payload.student,sourceVersion:saved?.source?.version})});activeRun=data.run;setRun(activeRun);return data;
    }});
   setResults(results);setMessage((task.signal.aborted?'Đã dừng. ':results.length<selected.length?'Đã dừng để kiểm tra lỗi. ':'Hoàn tất lượt đọc. ')+'Đã xử lý '+results.length+'/'+selected.length+' CT; '+results.filter((r:any)=>r.status==='saved').length+' CT đã lưu và tính lại; '+results.filter((r:any)=>r.status!=='saved').length+' CT còn thiếu / cần kiểm tra. Tiến độ đã lưu; lần bấm tiếp theo bỏ qua CT đã lấy đủ.');
  }catch(e:any){setBridgeNeeded(e.code==='bridge'||String(e.message).includes('1.6.7'));setMessage(task.signal.aborted?'Đã dừng đọc Input.':e.message);}
  finally{if(controller.current===task)controller.current=null;setBusy(false);onBusyChange?.(false);}
 };
 return <section className="hub-input-panel" aria-label="Tự lấy Input theo Contract">
  <div className="hub-input-heading"><div><h3>Tự lấy Input theo Contract</h3><p>Đọc nền GetContractDetail / ListCourseInfo của đúng CT nhận tiền để điền Course fee KOC, Hour/week, Package, Giftcode No và Discount apply, rồi tự tính lại.</p></div><button type="button" className="primary-button" disabled={disabled||busy||!plan.length} onClick={()=>void start()}>{busy?'Đang lấy Input…':done.length?'Tiếp tục lấy Input · '+plan.length+' CT còn thiếu':'Tự lấy Input · '+plan.length+' CT đang lọc'}</button>{busy&&<button type="button" className="secondary-button" onClick={()=>controller.current?.abort()}>Dừng lấy Input</button>}{!busy&&run&&<button type="button" className="secondary-button" disabled={disabled} onClick={()=>{revision.current++;reset.current=true;setRun(null);setResults([]);setMessage('Đã tạo lượt mới. Dữ liệu đã lưu vẫn được giữ; bấm lấy Input để đọc lại theo lựa chọn.');}}>Tạo lượt đọc mới</button>}</div>
  <label className="hub-input-refresh"><input type="checkbox" checked={refresh} disabled={busy||disabled} onChange={e=>{revision.current++;setRefresh(e.target.checked);reset.current=true;setRun(null);}}/>Đọc lại cả CT đã đủ Input để đối chiếu</label>
  <p className="source-note">Tiến độ lưu sau từng CT trên trình duyệt này. Hết giờ, dừng hoặc mở lại trang rồi bấm lấy tiếp sẽ bỏ qua CT đã lấy đủ; CT đọc dở còn trong hàng chờ. Dùng tab Hub đã mở; không tạo tab mới, đổi URL, chuyển hay đóng tab đó. Mở hoặc tải lại Hub và đăng nhập trước khi lấy. Chưa có link sẽ tự tra theo tháng; nguồn mâu thuẫn và chứng từ chưa gắn CT vẫn chờ xác minh.</p>
  {message&&<p className="hub-input-message" role="status">{message}</p>}
  {bridgeNeeded&&<p className="hub-input-message">Cập nhật <a href={assetPath('downloads/promotion-hub-bridge.zip')+'?v=1.6.7'} download>cầu nối Hub 1.6.7</a>, tải lại Promotion và các tab Hub rồi bấm Tự lấy Input.</p>}
  {!!results.length&&<details className="hub-input-results" open={results.some(r=>r.status!=='saved')}><summary>Kết quả từng CT ({results.length})</summary>{results.map(r=><p key={r.ct}><strong>{r.ct}</strong> · {r.status==='saved'?'Đã lưu: '+r.fields.map((f:string)=>names[f]).join(', '):r.status==='partial'?'Đã lưu phần đọc được; còn thiếu '+r.missing.map((f:string)=>names[f]).join(', '):r.message}</p>)}</details>}
 </section>;
}
