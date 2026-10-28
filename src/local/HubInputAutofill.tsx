import React,{useEffect,useMemo,useRef,useState} from 'react';
import {contractInputPlan,fillContractInputs} from '../core/hub-course.mjs';
import {assetPath} from './paths.mjs';
const names:any={courseFee:'Course fee KOC',hoursPerWeek:'Hour/week',package:'Package',giftcode:'Giftcode No',discount:'Discount apply',groupKoc:'Group KOC',contractType:'Contract type'};
export default function HubInputAutofill({rows,datasetId,disabled,checkBridge,makeLookup,readInputs,onSave,onLinkSaved,onBusyChange}:any){
 const [refresh,setRefresh]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[results,setResults]=useState<any[]>([]),[bridgeNeeded,setBridgeNeeded]=useState(false);
 const controller=useRef<AbortController|null>(null),plan=useMemo(()=>contractInputPlan(rows,{refresh}),[rows,refresh]);
 useEffect(()=>()=>controller.current?.abort(),[datasetId]);
 const json=async(path:string,options:any={})=>{const res=await fetch(path,options),value=await res.json();if(!res.ok)throw Error(value.error||'Chưa lưu được đầu vào theo CT.');return value;};
 const start=async()=>{
  if(busy||disabled||!plan.length)return;
  const task=new AbortController();controller.current=task;setBusy(true);onBusyChange?.(true);setResults([]);setBridgeNeeded(false);setMessage('Đang kiểm tra cầu nối Hub…');
  try{
   const ready=await checkBridge(task.signal),parts=String(ready.version??'').split('.').map(Number),version=(parts[0]||0)*1e6+(parts[1]||0)*1e3+(parts[2]||0);
   if(version<1006002||!ready.capabilities?.includes('contract-inputs')){setBridgeNeeded(true);throw Error('Cần cầu nối Hub 1.6.2 để tự lấy đủ Input theo Contract.');}
   const selected=[...plan],lookup=makeLookup(selected.map((r:any)=>r.ct||r.cells.contractTotal),setMessage,task.signal);
   const results=await fillContractInputs(selected,{signal:task.signal,progress:setMessage,update:setResults,
    loadLink:async(ct:string)=>(await json('/api/hub-links?ct='+encodeURIComponent(ct),{signal:task.signal})).link,
    lookup,
    saveLink:async(link:any)=>{const data=await json('/api/hub-links',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(link),signal:task.signal});onLinkSaved?.(data.link);return data.link;},
    read:(expected:any)=>readInputs(expected,setMessage,task.signal),save:onSave});
   setResults(results);setMessage((task.signal.aborted?'Đã dừng. ':'Hoàn tất lượt đọc. ')+results.filter((r:any)=>r.status==='saved').length+' CT đã lưu và tính lại; '+results.filter((r:any)=>r.status==='check').length+' CT cần kiểm tra.');
  }catch(e:any){setBridgeNeeded(e.code==='bridge'||String(e.message).includes('1.6.2'));setMessage(task.signal.aborted?'Đã dừng đọc Input.':e.message);}
  finally{if(controller.current===task)controller.current=null;setBusy(false);onBusyChange?.(false);}
 };
 return <section className="hub-input-panel" aria-label="Tự lấy Input theo Contract">
  <div className="hub-input-heading"><div><h3>Tự lấy Input theo Contract</h3><p>Lấy Course fee KOC, Hour/week, Package, Giftcode No và Discount apply từ đúng CT nhận tiền trên Hub, điền nhóm 01 rồi tự tính lại.</p></div><button type="button" className="primary-button" disabled={disabled||busy||!plan.length} onClick={()=>void start()}>{busy?'Đang lấy Input…':'Tự lấy Input · '+plan.length+' CT đang lọc'}</button>{busy&&<button type="button" className="secondary-button" onClick={()=>controller.current?.abort()}>Dừng lấy Input</button>}</div>
  <label className="hub-input-refresh"><input type="checkbox" checked={refresh} disabled={busy||disabled} onChange={e=>setRefresh(e.target.checked)}/>Đọc lại cả CT đã đủ Input để đối chiếu</label>
  <p className="source-note">CT chưa có link sẽ tự tra danh sách theo tháng như Tự gắn link Hub. Thông tin đã có và chỉnh sửa tay được giữ; nguồn mâu thuẫn tiếp tục CHECK. Chứng từ chưa gắn CT chờ xác minh.</p>
  {message&&<p className="hub-input-message" role="status">{message}</p>}
  {bridgeNeeded&&<p className="hub-input-message">Cập nhật <a href={assetPath('downloads/promotion-hub-bridge.zip')+'?v=1.6.2'} download>cầu nối Hub 1.6.2</a>, tải lại Promotion và các tab Hub rồi bấm Tự lấy Input.</p>}
  {!!results.length&&<details className="hub-input-results" open={results.some(r=>r.status==='check')}><summary>Kết quả từng CT ({results.length})</summary>{results.map(r=><p key={r.ct}><strong>{r.ct}</strong> · {r.status==='saved'?'Đã lưu: '+r.fields.map((f:string)=>names[f]).join(', '):r.message}</p>)}</details>}
 </section>;
}
