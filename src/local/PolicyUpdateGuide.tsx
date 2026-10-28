import React,{useEffect,useRef,useState} from 'react';
import {localFetch} from './api.mjs';
import {assetPath} from './paths.mjs';
import {POLICY_SCHEMA,normalizePolicyRow,validatePolicyRows} from '../core/policy-pack.mjs';
import {policyTableRows,policyTemplateCSV} from '../core/policy-import.mjs';
const money=(n:any)=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('vi-VN'):'Cần bổ sung';
function download(name:string,value:string,type='application/json'){const url=URL.createObjectURL(new Blob([value],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function request(body?:any,method='GET'){const r=await localFetch('/api/policy-versions',{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})}),value=await r.json();if(!r.ok)throw Error(value.error);return value;}
export default function PolicyUpdateGuide({policy}:any){
 const [state,setState]=useState<any>(null),[tables,setTables]=useState<any[]>([]),[sheet,setSheet]=useState(0),[jsonRows,setJsonRows]=useState<any[]|null>(null),[title,setTitle]=useState(''),[fileName,setFileName]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[preview,setPreview]=useState<any>(null);
 const [from,setFrom]=useState(''),[to,setTo]=useState(''),[approval,setApproval]=useState(''),[center,setCenter]=useState('*'),[regime,setRegime]=useState('q4');
 const worker=useRef<Worker|null>(null),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;request().then(setState).catch(e=>setMessage(e.message));return ()=>{mounted.current=false;worker.current?.terminate();};},[]);
 const invalidate=()=>setPreview(null);
 async function read(file?:File){
  if(!file)return;setBusy(true);setMessage('Đang đọc file chính sách…');invalidate();setTables([]);setJsonRows(null);setFileName(file.name);setTitle(file.name.replace(/\.[^.]+$/,''));
  try{
   if(file.size>20*1024*1024)throw Error('File chính sách tối đa 20 MB.');
   if(/\.json$/i.test(file.name)){const pack=JSON.parse(await file.text());if(pack.schema!==POLICY_SCHEMA||!Array.isArray(pack.rows))throw Error('JSON cần đúng mẫu apollo-price-policy/v1.');setJsonRows(pack.rows);setTitle(pack.title||file.name);setMessage('Đã đọc '+pack.rows.length+' dòng. Kiểm tra phạm vi rồi bấm Xem trước.');}
   else{
    worker.current?.terminate();const w=new Worker(assetPath('source-parser.worker.mjs'),{type:'module'});worker.current=w;
    const result:any=await new Promise((resolve,reject)=>{w.onmessage=({data})=>data.type==='error'?reject(Error(data.message)):data.type==='policy-read'?resolve(data):null;w.onerror=()=>reject(Error('Không đọc được file. Dùng CSV/JSON theo mẫu.'));w.postMessage({type:'policy-read',requestId:1,file});});w.terminate();worker.current=null;
    if(!mounted.current)return;setTables(result.tables);setSheet(Math.max(0,result.tables.findIndex((t:any)=>/tra cứu|tra cuu|policy|giá|gia/i.test(t.name))));setMessage('Đã đọc file. Chọn sheet giá, điền ngày hiệu lực và căn cứ duyệt.');
   }
  }catch(e:any){setMessage(e.message);}finally{if(mounted.current)setBusy(false);}
 }
 async function showPreview(){
  setBusy(true);setMessage('Đang kiểm tra khóa, giá và thời kỳ…');invalidate();
  try{
   const defaults={...(from?{from}:{}),...(to?{to}:{}),...(approval?{approval}:{}),center,source:fileName,regime};
   const rows=jsonRows?jsonRows.map(r=>normalizePolicyRow({...r,...(from?{from}:{}),...(to?{to}:{}),...(approval?{approval}:{}),...(center!=='*'?{center}:{})})):policyTableRows(tables[sheet],defaults);
   const current=await request();setState(current);const value=await request({schema:POLICY_SCHEMA,operation:'preview',rows,version:current.active.version},'POST');setPreview(value);setMessage(value.errors.length?'Chưa áp dụng: sửa các dòng được báo bên dưới rồi tải file lại.':'Đã kiểm tra '+value.changedRows+' dòng. Áp dụng sẽ tính lại bộ nguồn đang mở.');
  }catch(e:any){setMessage(e.message);}finally{setBusy(false);}
 }
 async function apply(){if(!preview||preview.errors.length)return;setBusy(true);setMessage('Đang lưu phiên bản và tính lại…');try{await request({schema:POLICY_SCHEMA,operation:'apply',rows:preview.rows,title,version:preview.version},'POST');window.location.reload();}catch(e:any){setMessage(e.message);setBusy(false);invalidate();}}
 async function restore(packId:string|null){setBusy(true);try{await request({packId,version:state.active.version},'PATCH');window.location.reload();}catch(e:any){setMessage(e.message);setBusy(false);}}
 return <details className="policy-update-guide">
  <summary>Cập nhật chính sách giá trên web</summary>
  <p><strong>Đang dùng: {state?.current?.title||'Bộ chính sách đã phát hành'}</strong>{state?.current&&<> · {state.current.rows.length} dòng cập nhật</>}. Bảng giá, Rule và bộ tính dùng chung phiên bản này.</p>
  <p>Nhập XLSX bảng giá có cột rõ ràng, CSV theo mẫu hoặc JSON đã xuất. Giá gốc là giá trước giảm; chọn nhãn Discount được phép, tháng tặng, kỳ trả góp và ngày hiệu lực riêng. Voucher cá nhân tiếp tục quản lý tại Voucher.</p>
  <div className="policy-update-actions"><button type="button" className="secondary-button" onClick={()=>download('apollo-policy-template.csv',policyTemplateCSV(),'text/csv;charset=utf-8')}>Tải mẫu CSV</button><button type="button" className="quiet-button" disabled={!state?.current||busy} onClick={()=>download('apollo-price-policy.json',JSON.stringify(state.current,null,2))}>Xuất bản đang dùng</button></div>
  <div className="policy-update-fields">
   <label>File chính sách<input type="file" accept=".xlsx,.csv,.tsv,.json" disabled={busy} onChange={e=>void read(e.target.files?.[0])}/></label>
   {tables.length>0&&<label>Sheet giá<select value={sheet} disabled={busy} onChange={e=>{setSheet(Number(e.target.value));invalidate();}}>{tables.map((t,i)=><option key={i} value={i}>{t.name}</option>)}</select></label>}
   <label>Tên phiên bản<input value={title} disabled={busy} onChange={e=>{setTitle(e.target.value);invalidate();}} placeholder="Giá tháng 11 · bản đã duyệt"/></label>
   <label>Từ ngày<input type="text" inputMode="numeric" placeholder="YYYY-MM-DD" value={from} disabled={busy} onChange={e=>{setFrom(e.target.value);invalidate();}}/></label>
   <label>Đến ngày<input type="text" inputMode="numeric" placeholder="YYYY-MM-DD" value={to} disabled={busy} onChange={e=>{setTo(e.target.value);invalidate();}}/></label>
   <label>Center / phạm vi<input value={center} disabled={busy} onChange={e=>{setCenter(e.target.value);invalidate();}} placeholder="* = toàn bộ"/></label>
   <label>Cột giảm của bảng tra cứu<select value={regime} disabled={busy} onChange={e=>{setRegime(e.target.value);invalidate();}}><option value="q4">Q4</option><option value="base">Base</option></select></label>
   <label className="policy-update-approval">Căn cứ phê duyệt<input value={approval} disabled={busy} onChange={e=>{setApproval(e.target.value);invalidate();}} placeholder="Số quyết định / người duyệt / phiên bản nguồn; bỏ trống nếu từng dòng đã có"/></label>
  </div>
  <div className="policy-update-actions"><button type="button" className="secondary-button" disabled={busy||(!jsonRows&&!tables.length)} onClick={()=>void showPreview()}>Xem trước & kiểm tra</button><button type="button" className="primary-button" disabled={busy||!preview||preview.errors.length>0||!title.trim()} onClick={()=>void apply()}>Áp dụng & tính lại</button></div>
  {message&&<p role="status" className="import-status">{message}</p>}
  {preview?.errors.length>0&&<button type="button" className="quiet-button" disabled={busy} onClick={()=>{const rows=preview.rows.filter((r:any)=>validatePolicyRows([r]).length===0);setJsonRows(rows);setMessage('Giữ '+rows.length+'/'+preview.rows.length+' dòng hợp lệ trong bản nháp. Bấm Xem trước để kiểm tra lại chồng lấn. File gốc được giữ nguyên.');invalidate();}}>Bỏ dòng thiếu / sai cột khỏi bản nháp</button>}
  {preview&&<div className="policy-preview">{preview.errors.length>0&&<ul className="policy-import-errors">{preview.errors.slice(0,30).map((s:string,i:number)=><li key={i}>{s}</li>)}</ul>}<div className="reference-scroll"><table className="reference-table" aria-label="Xem trước chính sách giá"><thead><tr>{['Khóa giá','Hiệu lực / phạm vi','Giá gốc','Giảm','Sau giảm','Tháng tặng / kỳ','Nguồn / căn cứ'].map(s=><th key={s}>{s}</th>)}</tr></thead><tbody>{preview.rows.slice(0,80).map((r:any,i:number)=><tr key={i}><td>{r.group} · {r.year} · L{r.layer} · {r.hours}h<small>{r.variant} · {r.packageKey} · {r.months} tháng</small></td><td>{r.from} → {r.to}<small>{r.center} · {r.contractType}</small></td><td>{money(r.gross)}</td><td>{money(r.discount)}</td><td>{typeof r.gross==='number'&&typeof r.discount==='number'?money(r.gross-r.discount):'Cần bổ sung'}</td><td>Trả thẳng {r.straight} · Loyalty {r.loyalty} · Ref {r.referral}<small>{r.maxTerms} kỳ</small></td><td>{r.source}<small>{r.approval}</small></td></tr>)}</tbody></table></div><small>Hiển thị tối đa 80 dòng; kiểm tra toàn bộ {preview.rows.length} dòng. {preview.totalRows} dòng trong bản sau cập nhật.</small></div>}
  <details className="policy-version-history"><summary>Lịch sử phiên bản & khôi phục</summary><p>Giá cũ ngoài thời kỳ cập nhật được giữ. Khôi phục chuyển toàn bộ bản giá về phiên bản đã chọn và tính lại.</p><button className="quiet-button" disabled={busy||!state?.active?.packId} onClick={()=>void restore(null)}>Dùng bộ chính sách đã phát hành</button>{state?.history.map((v:any)=><div className="policy-history-row" key={v.id}><span><strong>{v.title}</strong><small>{new Date(v.createdAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})} · {v.rowCount} dòng</small></span><button className="quiet-button" disabled={busy||state.active.packId===v.id} onClick={()=>void restore(v.id)}>{state.active.packId===v.id?'Đang áp dụng':'Khôi phục & tính lại'}</button></div>)}</details>
  <p className="policy-update-note">Bản cập nhật lưu trên trình duyệt này. Xuất JSON để sao lưu hoặc nhập trên máy khác. File thiếu cột, có giá xung đột hoặc điều kiện chưa xác minh sẽ được chỉ rõ trước khi áp dụng. Không tự đọc công thức Excel bất kỳ; ô chưa có kết quả không được coi là 0.</p>
  {policy&&<small>Audit {policy.file} là bộ ca đối chiếu; chính sách gốc và các phiên bản cập nhật mới cung cấp giá áp dụng.</small>}
 </details>;
}
