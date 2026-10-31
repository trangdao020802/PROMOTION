import React,{useEffect,useMemo,useRef,useState} from 'react';
import {contractInputPlan,fillContractInputs} from '../core/hub-course.mjs';
import {assetPath} from './paths.mjs';
import {localFetch as fetch} from './api.mjs';
import {inputTargets,completedInputs} from '../core/hub-input-progress.mjs';
import {completeContractVoucher,rowNeedsVoucher} from '../core/hub-completion.mjs';
import {readHubVoucher} from './hub-voucher-bridge.mjs';
import {voucherCode} from '../core/vouchers.mjs';
import {hubPolicyMissing} from '../core/hub-policy.mjs';
import {rememberProgress,recalledProgress,progressNote} from '../core/contract-memory.mjs';
const names:any={courseFee:'Course fee KOC',hoursPerWeek:'Hour/week',package:'Package',giftcode:'Giftcode No',discount:'Discount apply',groupKoc:'Group KOC',contractType:'Contract type',hubPolicy:'bảng giá / quy tắc Hub',hubContract:'căn cứ các danh sách của CT tổng',payments:'lịch thanh toán Hub'};
const policyReasons:any={context:'Hub chưa trả đủ ID / ngày của CT',price:'Chưa đọc được bảng giá',groups:'Chưa đọc được nhóm khuyến mãi',timeout:'Hết thời gian chờ cấu hình',permission:'Phiên Hub chưa cho phép đọc cấu hình',unsupported:'Nhánh hợp đồng cần quy tắc riêng',format:'Cấu hình Hub chưa đủ hoặc chưa thống nhất'};
const json=async(path:string,options:any={})=>{const res=await fetch(path,options),value=await res.json();if(!res.ok)throw Error(value.error||'Chưa lưu được đầu vào theo CT.');return value;};
export default function HubInputAutofill({rows,datasetId,disabled,checkBridge,makeLookup,readInputs,onSave,onLinkSaved,onBusyChange,vouchers=[],onVoucherSave,request,onRequestConsumed}:any){
 const [refresh,setRefresh]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[results,setResults]=useState<any[]>([]),[bridgeNeeded,setBridgeNeeded]=useState(false),[run,setRun]=useState<any>(null),[policy,setPolicy]=useState(false);
 const voucherIndex=vouchers;
 const controller=useRef<AbortController|null>(null),reset=useRef(false),revision=useRef(0),automatic=useRef(''),done=reset.current?[]:completedInputs(run,refresh),plan=useMemo(()=>contractInputPlan(rows,{refresh,completed:done,needsPolicy:r=>(!r.hubContract||r.hubContract.payments?.state!=='read')||policy&&hubPolicyMissing(r),needsVoucher:r=>!!onVoucherSave&&rowNeedsVoucher(r,voucherIndex)}),[rows,refresh,run,voucherIndex,onVoucherSave,policy]);
 useEffect(()=>{let gone=false;const epoch=++revision.current;reset.current=false;setRun(null);setRefresh(false);const restore=(run:any)=>{const local=recalledProgress(datasetId),note=local&&(!run||local.runId===run.runId)?local:run?.note;if(note?.message)setMessage((note.state==='running'?'Lượt trước tạm dừng khi làm mới. Nội dung cuối: ':'Nội dung đã lưu: ')+note.message+(note.ct?' · '+note.ct+' · '+(note.studentName||note.student):''));};restore(null);void json('/api/hub-input-progress?dataset='+encodeURIComponent(datasetId)).then(data=>{if(!gone&&epoch===revision.current){setRun(data.run);setRefresh(data.run?.refresh||false);restore(data.run);}}).catch(()=>{});return()=>{gone=true;controller.current?.abort();};},[datasetId]);
 const start=async(auto=false,fromStart=false)=>{
  if(controller.current||busy||disabled||!rows.length||!auto&&!fromStart&&!plan.length)return;
  revision.current++;if(fromStart){reset.current=true;setRefresh(true);}
  const task=new AbortController();controller.current=task;setBusy(true);onBusyChange?.(true);setResults([]);setBridgeNeeded(false);setMessage('Đang kiểm tra cầu nối Hub…');
  try{
   const previous=(await json('/api/hub-input-progress?dataset='+encodeURIComponent(datasetId),{signal:task.signal})).run;
   const restart=auto&&previous?.targets?.length&&previous.targets.every((t:any)=>previous.completed.includes(t.ct+'|'+t.student));
   const readAll=fromStart||refresh,selected=contractInputPlan(rows,{refresh:readAll,completed:reset.current||restart?[]:completedInputs(previous,readAll),needsPolicy:r=>(!r.hubContract||r.hubContract.payments?.state!=='read')||policy&&hubPolicyMissing(r),needsVoucher:r=>!!onVoucherSave&&rowNeedsVoucher(r,voucherIndex)});
   if(!selected.length){setRun(previous);setMessage('Không còn CT thiếu Input trong bộ lọc này. Có thể tạo lượt mới để đọc lại.');return;}
   const ready=await checkBridge(task.signal),parts=String(ready.version??'').split('.').map(Number),version=(parts[0]||0)*1e6+(parts[1]||0)*1e3+(parts[2]||0);
   if(version<1006014||(!ready.capabilities?.includes('contract-lists')||!ready.capabilities?.includes('contract-inputs')||!ready.capabilities?.includes('course-network')||!ready.capabilities?.includes('no-new-tabs'))){setBridgeNeeded(true);throw Error('Cần cầu nối Hub 1.6.14 để tự lấy Input và quy tắc giá theo Contract.');}
   let activeRun=(await json('/api/hub-input-progress',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'start',datasetId,refresh:readAll,targets:inputTargets(selected,readAll,{facts:true}),version:previous?.version??0,reset:!!(reset.current||restart)}),signal:task.signal})).run;
   reset.current=false;setRun(activeRun);let queue=Promise.resolve<any>(null),current:any=null;
   const changeRun=(operation:any)=>{const next=queue.then(async()=>{const data=await json('/api/hub-input-progress',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({...operation,datasetId,runId:activeRun.runId,version:activeRun.version})});activeRun=data.run;setRun(activeRun);return data;});queue=next.catch(()=>null);return next;};
   const report=(message:string,identity?:any,state='running')=>{if(identity)current=identity;setMessage(message);const note=progressNote({state,message,...current},activeRun);if(!note)return Promise.resolve();rememberProgress(datasetId,{...note,runId:activeRun.runId});return changeRun({operation:'status',note});};
   const progress=(message:string)=>{void report(message).catch(()=>{});};
   const lookup=makeLookup(selected.flatMap((r:any)=>[r.ct||r.cells.contractTotal,...(r.sourceContracts??[])]),progress,task.signal);
   const results=await fillContractInputs(selected,{signal:task.signal,progress:report,update:setResults,
    loadLink:async(ct:string)=>(await json('/api/hub-links?ct='+encodeURIComponent(ct),{signal:task.signal})).link,
    lookup,
    saveLink:async(link:any)=>{const data=await json('/api/hub-links',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(link),signal:task.signal});onLinkSaved?.(data.link);return data.link;},
    read:(expected:any)=>readInputs({...expected,readPolicy:policy},progress,task.signal),save:onSave,
    afterSave:onVoucherSave?async(row:any,payload:any,saved:any)=>completeContractVoucher(row,payload,saved,{signal:task.signal,progress,loadVoucher:async(code:string,current:any)=>(await json('/api/vouchers?code='+encodeURIComponent(code)+'&student='+encodeURIComponent(current.cells.F)+'&name='+encodeURIComponent(current.cells.G))).voucher,readVoucher:(code:string)=>readHubVoucher(code,{signal:task.signal,onProgress:progress,budgetMs:15000}),saveVoucher:onVoucherSave}):undefined,
    checkpoint:async(row:any,payload:any,saved:any)=>{
     // Finish the checkpoint for an already saved CT even if Stop was just pressed.
     return changeRun({operation:'complete',ct:payload.ct,student:payload.student,sourceVersion:saved?.source?.version});
    }});
   setResults(results);await report((task.signal.aborted?'Đã dừng. ':results.length<selected.length?'Đã dừng để kiểm tra lỗi. ':'Hoàn tất lượt đọc. ')+'Đã xử lý '+results.length+'/'+selected.length+' CT; '+results.filter((r:any)=>r.status==='saved').length+' CT đã lưu và tính lại; '+results.filter((r:any)=>r.status!=='saved').length+' CT còn thiếu / cần kiểm tra. Tiến độ đã lưu; lần bấm tiếp theo bỏ qua CT đã lấy đủ.',undefined,task.signal.aborted?'paused':results.length<selected.length?'error':'complete');
  }catch(e:any){setBridgeNeeded(e.code==='bridge'||String(e.message).includes('1.6.14'));setMessage(task.signal.aborted?'Đã dừng đọc Input.':e.message);}
  finally{if(controller.current===task)controller.current=null;setBusy(false);onBusyChange?.(false);if(auto)onRequestConsumed?.(request?.id);}
 };
 useEffect(()=>{
  if(!request?.id||automatic.current===request.id||disabled||busy||!rows.length)return;
  automatic.current=request.id;void start(true);
 },[request?.id,disabled,busy,rows,datasetId]);
 return <section className="hub-input-panel" aria-label="Tự lấy Input theo Contract">
  <div className="hub-input-heading"><div><h3>Tự lấy Input theo Contract</h3><p>Đọc lần lượt CT tổng theo thứ tự bảng: khóa học, ưu đãi, giftcode và lịch thanh toán; lưu từng hồ sơ rồi tính bằng bảng giá, quy tắc và các báo cáo hiện có.</p></div><button type="button" className="primary-button" disabled={disabled||busy||!plan.length} onClick={()=>void start()}>{busy?'Đang lấy Input…':done.length?'Tiếp tục lấy Input · '+plan.length+' CT còn thiếu':'Tự lấy Input · '+plan.length+' CT đang lọc'}</button>{busy&&<button type="button" className="secondary-button" onClick={()=>controller.current?.abort()}>Dừng lấy Input</button>}{!busy&&rows.length>0&&<button type="button" className="secondary-button" disabled={disabled} onClick={()=>void start(false,true)}>Tạo lượt đọc mới</button>}</div>
  <label className="hub-input-refresh"><input type="checkbox" checked={refresh} disabled={busy||disabled} onChange={e=>{revision.current++;setRefresh(e.target.checked);reset.current=true;setRun(null);}}/>Đọc lại cả CT đã đủ Input để đối chiếu</label>
  <label className="hub-input-refresh"><input type="checkbox" checked={policy} disabled={busy||disabled} onChange={e=>{setPolicy(e.target.checked);reset.current=true;setRun(null);}}/>Đọc thêm cấu hình giá và khuyến mãi từ Hub</label>
  <p className="source-note">Tạo lượt đọc mới bắt đầu đọc lại toàn bộ CT trong bộ lọc ngay từ dòng đầu, kể cả Discount apply và Giftcode No đã có. Mặc định lấy các danh sách của CT tổng để bổ sung bộ nguồn; bộ tính tiếp tục dùng bảng giá và quy tắc hiện có. Cấu hình giá từ Hub là phần bổ sung, không bắt buộc để lưu Input. Tiến độ lưu sau từng CT; hết giờ hoặc thiếu thông tin sẽ chuyển sang CT khác. Bấm lấy tiếp để thử lại phần còn thiếu. Ô nhập tay được giữ. Dùng phiên Hub đang đăng nhập; không tạo tab mới, đổi URL, chuyển hay đóng tab đó. Dữ liệu nguồn mâu thuẫn tiếp tục được đánh dấu để kiểm tra.</p>
  {message&&<p className="hub-input-message" role="status">{message}</p>}
  {bridgeNeeded&&<p className="hub-input-message">Cập nhật <a href={assetPath('downloads/promotion-hub-bridge.zip')+'?v=1.6.14'} download>cầu nối Hub 1.6.14</a>, tải lại Promotion và các tab Hub rồi bấm Tự lấy Input.</p>}
  {!!results.length&&<details className="hub-input-results" open={results.some(r=>r.status!=='saved')}><summary>Kết quả từng CT ({results.length})</summary>{results.map(r=><p key={r.ct}><strong>{r.ct}</strong> · {r.status==='saved'?'Đã lưu: '+r.fields.map((f:string)=>names[f]).join(', '):r.status==='partial'?'Đã lưu phần đọc được; còn thiếu '+r.missing.map((f:string)=>names[f]).join(', ')+(r.hubPolicyError?' · '+policyReasons[r.hubPolicyError]:''):r.message}</p>)}</details>}
 </section>;
}
