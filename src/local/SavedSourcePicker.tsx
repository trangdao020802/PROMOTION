import React,{useState} from 'react';
import {localFetch} from './api.mjs';
import {selectReusableSources} from '../core/source-composition.mjs';
const roles={payment:'PaymentList',export:'Export ByCourse',transfer:'Transfer'};
export default function SavedSourcePicker({datasets,currentId,disabled,onChange,onBusy}) {
 const [choice,setChoice]=useState(''),[batches,setBatches]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 function update(next){setBatches(next);onChange(next.flatMap(batch=>selectReusableSources(batch.sources,batch.keys,{includeHistory:batch.includeHistory})));}
 async function add(){
  if(!choice||busy||disabled)return;
  setBusy(true);onBusy(true);setError('');
  try{
   const response=await localFetch('/api/datasets/sources?id='+encodeURIComponent(choice)),data=await response.json();
   if(!response.ok)throw Error(data.error||'Chưa đọc được bộ nguồn đã lưu.');
   update([...batches,{...data,keys:data.sources.map(source=>source.key),includeHistory:false}]);setChoice('');
  }catch(e){setError(e.message);}finally{setBusy(false);onBusy(false);}
 }
 return <section className="saved-source-picker" aria-labelledby="reuse-source-title">
  <h3 id="reuse-source-title">Kết hợp nguồn đã lưu</h3>
  <p>Chọn bộ nguồn đã chỉnh sửa, giữ từng sheet cần dùng rồi bổ sung file hoặc báo cáo mới từ Hub. Các ô đã sửa, voucher và thông tin Hub được dùng lại theo đúng Contract và học viên.</p>
  <div className="reuse-source-controls">
   <label><span>Bộ nguồn có sẵn trên trình duyệt này</span><select value={choice} disabled={disabled||busy} onChange={e=>setChoice(e.target.value)}>
    <option value="">Chọn bộ nguồn đã lưu</option>
    {datasets.filter(d=>d.usable!==false&&!batches.some(b=>b.dataset.id===d.id)).map(d=><option key={d.id} value={d.id}>{d.id===currentId?'Đang mở · ':''}{d.fileName} · {new Date(d.createdAt).toLocaleString('vi-VN')}</option>)}
   </select></label>
   <button type="button" className="secondary-button" disabled={disabled||busy||!choice} onClick={()=>void add()}>{busy?'Đang mở nguồn…':'Thêm nguồn đã lưu'}</button>
  </div>
  {!datasets.length&&<p className="source-note">Chưa có bộ nguồn đã lưu trên trình duyệt này.</p>}
  {batches.map(batch=><fieldset key={batch.dataset.id} className="reuse-source-batch" disabled={disabled||busy}>
   <legend>{batch.dataset.fileName}</legend>
   <p className="source-note">{batch.dataset.from} – {batch.dataset.to} · {batch.editedRecords} hồ sơ có chỉnh sửa đã lưu</p>
   <label className="reuse-history"><input type="checkbox" checked={batch.includeHistory} onChange={e=>update(batches.map(b=>b===batch?{...b,includeHistory:e.target.checked}:b))}/><span>Dùng cả thu / chuyển trước kỳ đã lưu</span></label>
   <p className="source-note">Mặc định chỉ lấy thu và chuyển trong kỳ gốc. Bật lịch sử khi cần cọc hoặc chuyển tiền cũ. Chỉ các dòng đã được giữ trong bộ nguồn này có thể dùng lại.</p>
   {batch.sources.map(source=>{
    const count=selectReusableSources([source],[source.key],{includeHistory:batch.includeHistory})[0]?.records.length??0;
    return <label className="reuse-sheet" key={source.key}><input type="checkbox" checked={batch.keys.includes(source.key)} onChange={e=>update(batches.map(b=>b===batch?{...b,keys:e.target.checked?[...b.keys,source.key]:b.keys.filter(k=>k!==source.key)}:b))}/><span><strong>{roles[source.role]}</strong> · {source.fileName} · {source.sheetName}<small>{count.toLocaleString('vi-VN')} dòng dùng lại</small></span></label>;
   })}
   <button type="button" className="quiet-button" onClick={()=>update(batches.filter(b=>b!==batch))}>Bỏ bộ nguồn này</button>
  </fieldset>)}
  {error&&<p className="hub-error" role="alert">{error}</p>}
 </section>;
}
