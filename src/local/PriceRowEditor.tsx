import React,{useState} from 'react';
import {localFetch} from './api.mjs';
import {normalizePolicyRow,validatePolicyRows,POLICY_SCHEMA} from '../core/policy-pack.mjs';

const string=(v:any)=>v===null||v===undefined?'':String(v);
const numeric=(v:any)=>v===''||v===null||v===undefined?null:Number(v);
const money=(n:number|null)=>n!==null&&Number.isFinite(n)?n.toLocaleString('vi-VN')+' đ':'Chưa tính';

function initial(row:any){
 const weekly=row?.unit==='weeks'||row?.variant==='weekly';
 const weeks=weekly?(row.weeks??Number(String(row.packageKey??'').match(/^([\d.]+) WEEKS$/)?.[1])??''):'';
 const months=weekly?'':(row?.months??'');
 const unit=weekly?(row?.unitPrice??(typeof row?.gross==='number'&&Number(weeks)>0?row.gross/Number(weeks):'')):(row?.monthly??'');
 return {
  group:row?.group==='ATLS/AGLS'?'ATLS/AGLS':row?.group??'ATLS',
  course:row?.course??'',year:string(row?.year),layer:string(row?.layer),hours:string(row?.hours),
  variant:weekly?'weekly':row?.variant??'standard',months:string(months),weeks:string(weeks),
  packageKey:weekly?'':string(row?.packageKey??''),unitPrice:string(unit),discount:string(row?.discount),
  maxTerms:string(row?.maxTerms),straight:string(row?.straight??0),straightWeeks:string(row?.straightWeeks??0),loyalty:string(row?.loyalty??0),
  referral:string(row?.referral??0),from:row?.from??'',to:row?.to??'',center:row?.center??'*',
  contractType:row?.contractType??'*',discountLabels:Array.isArray(row?.discountLabels)?row.discountLabels.join('; '):'',
  conditions:row?.conditions??'',source:'',approval:''
 };
}
async function api(body?:any){
 const response=await localFetch('/api/policy-versions',{method:body?'POST':'GET',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const value=await response.json();if(!response.ok)throw Error(value.error??'Không lưu được chính sách giá.');return value;
}
export default function PriceRowEditor({row,onCancel}:any){
 const [form,setForm]=useState<any>(()=>initial(row)),[preview,setPreview]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const weekly=form.variant==='weekly',units=numeric(weekly?form.weeks:form.months),unitPrice=numeric(form.unitPrice);
 const gross=units!==null&&units>0&&unitPrice!==null&&unitPrice>0?Math.round(units*unitPrice):null;
 const discount=numeric(form.discount),net=gross!==null&&discount!==null?gross-discount:null;
 const update=(key:string,val:string)=>{setForm((old:any)=>({...old,[key]:val}));setPreview(null);setError('');};
 const normalized=()=>normalizePolicyRow({
  group:form.group,course:form.course,year:form.year,layer:form.layer,hours:form.hours,
  variant:form.variant,months:weekly?null:form.months,weeks:weekly?form.weeks:null,
  packageKey:weekly?undefined:form.packageKey||undefined,monthly:weekly?null:unitPrice,
  gross,discount:form.discount,maxTerms:form.maxTerms,straight:form.straight,straightWeeks:form.straightWeeks,
  loyalty:form.loyalty,referral:form.referral,from:form.from,to:form.to,center:form.center,
  contractType:form.contractType,discountLabels:form.discountLabels,conditions:form.conditions,
  source:form.source,approval:form.approval
 });
 const check=()=>{
  const missing=['group','course','year','layer','hours','unitPrice','discount','maxTerms','from','to','source','approval'].filter(k=>!String(form[k]??'').trim());
  if(!String(weekly?form.weeks:form.months).trim())missing.push(weekly?'weeks':'months');
  if(missing.length)throw Error('Điền đủ các trường bắt buộc: '+missing.join(', ')+'.');
  if(!Number.isFinite(gross)||gross<=0)throw Error('Đơn giá và thời lượng phải tạo ra giá gốc lớn hơn 0.');
  if(net===null||net<0)throw Error('Số tiền giảm không được lớn hơn giá gốc.');
  if(discount>0&&!String(form.discountLabels??'').trim())throw Error('Có giảm theo gói: cần nhập đúng nhãn Discount apply để bộ tính có thể áp dụng mức giảm này cho hợp đồng.');
  if(!weekly&&form.packageKey&&form.packageKey!==String(Number(form.months))&&form.variant==='standard')throw Error('Khóa gói standard phải khớp số tháng. Hãy xóa Khóa gói hoặc chọn đúng loại gói.');
  const value=normalized(),issues=validatePolicyRows([value]);
  if(issues.length)throw Error(issues.join('\n'));
  return value;
 };
 const view=async()=>{
  setBusy(true);setError('');setPreview(null);
  try{const price=check(),state=await api(),result=await api({schema:POLICY_SCHEMA,operation:'preview',rows:[price],version:state.active.version});
   if(result.errors.length)throw Error(result.errors.join('\n'));
   setPreview({price,version:result.version,changedRows:result.changedRows});
  }catch(e:any){setError(e.message||'Không xem trước được.');}finally{setBusy(false);}
 };
 const save=async()=>{
  if(!preview||busy)return;setBusy(true);setError('');
  try{const title='Giá cập nhật trên bảng · '+form.group+' · '+form.course.slice(0,65)+' · '+form.from;
   await api({schema:POLICY_SCHEMA,operation:'apply',rows:[preview.price],title,version:preview.version});
   window.location.reload();
  }catch(e:any){setPreview(null);setError(e.message||'Không lưu được.');setBusy(false);}
 };
 const input=(key:string,title:string,type='text',required=false,props:any={})=><label key={key}>{title}{required?' *':''}
  <input type={type} value={form[key]} onChange={e=>update(key,e.target.value)} disabled={busy} required={required} {...props}/></label>;
 const pick=(key:string,title:string,values:string[])=><label key={key}>{title} *<select value={form[key]} disabled={busy} onChange={e=>update(key,e.target.value)}>{values.map(v=><option key={v} value={v}>{v}</option>)}</select></label>;
 return <div className="price-edit-backdrop" role="presentation">
  <section className="price-edit-panel" role="dialog" aria-modal="true" aria-labelledby="price-editor-heading">
   <header className="price-edit-heading"><div><h3 id="price-editor-heading">{row?'Sửa giá / công thức của dòng đã chọn':'Thêm giá / công thức mới'}</h3><p>Giá mới chỉ áp dụng cho đúng khóa, gói, khoảng ngày, center và đối tượng. Nguồn gốc không bị ghi đè.</p></div><button type="button" className="quiet-button" disabled={busy} onClick={onCancel}>Đóng</button></header>
   <div className="price-edit-grid">
    {pick('group','Chương trình',['ATLS','AGLS','ATLS/AGLS','AHP','IELTS','PREMIUM'])}
    {input('course','Course fee KOC (tên khóa)', 'text',true,{placeholder:'ATLS - New Price 2026 - Layer 1'})}
    {input('year','Năm chính sách','number',true,{min:2023,max:2100})}
    {input('layer','Layer (0 cho gói tuần/Premium)','number',true,{min:0,max:3})}
    {input('hours','Hour/week','number',true,{min:0.5,max:40,step:0.5})}
    {pick('variant','Loại gói',['standard','weekly','split','trial','vtdh','ahp','summer','upgrade','ielts','premium'])}
    {input(weekly?'weeks':'months',weekly?'Số tuần tính học phí':'Số tháng tính học phí','number',true,{min:0.5,step:0.5})}
    {!weekly&&input('packageKey','Khóa gói đặc biệt (nếu có)','text',false,{placeholder:'Để trống với gói tháng tiêu chuẩn'})}
    {input('unitPrice',weekly?'Đơn giá chưa giảm (VND/tuần)':'Đơn giá chưa giảm (VND/tháng)','number',true,{min:1,step:1})}
    <label>Giá gốc (tự tính)<output className="price-edit-output">{money(gross)}</output></label>
    {input('discount','Giảm theo gói (VND, nhập 0 nếu không giảm)','number',true,{min:0,step:1})}
    <label>Sau giảm · chưa voucher<output className="price-edit-output">{money(net)}</output></label>
    {input('straight','Tháng tặng trả thẳng','number',true,{min:0,max:12,step:0.5})}
    {input('straightWeeks','Tuần tặng trả thẳng','number',true,{min:0,max:52,step:0.5})}
    {input('loyalty','Tháng loyalty tối đa','number',true,{min:0,max:12,step:0.5})}
    {input('referral','Tháng referral','number',true,{min:0,max:12,step:0.5})}
    {input('maxTerms','Kỳ trả góp tối đa (0 = trả thẳng)','number',true,{min:0,max:36,step:1})}
    {input('from','Từ ngày','date',true)}
    {input('to','Đến ngày','date',true)}
    {input('center','Center / phạm vi (* = toàn hệ thống)','text',true)}
    {input('contractType','Loại học viên (* / New / Renew)','text',true)}
    {input('discountLabels','Discount apply được phép (cách nhau bằng ;)','text',false,{placeholder:'Nhập đúng nhãn trong PaymentList khi có giảm tiền'})}
    {input('source','Nguồn giá / tên file chính sách đã duyệt','text',true,{placeholder:'Tên file hoặc quyết định nguồn, không dùng số quan sát Report'})}
    {input('approval','Căn cứ / người phê duyệt','text',true,{placeholder:'Số quyết định, người duyệt hoặc chứng từ cụ thể'})}
    <label className="price-edit-wide">Điều kiện áp dụng<textarea rows={3} disabled={busy} value={form.conditions} onChange={e=>update('conditions',e.target.value)} placeholder="Điều kiện ghi danh, full, học bổng..."/></label>
   </div>
   <p className="price-edit-note">Giá tuần được tính từ đơn giá/tuần × số tuần. Giá tháng từ đơn giá/tháng × số tháng. Discount/Voucher được tính riêng; số Report quan sát không tự biến thành giá được duyệt. Bản lưu thuộc chính sách trên trình duyệt đang sử dụng.</p>
   {error&&<div role="alert" className="price-edit-error">{error}</div>}
   {preview&&<div role="status" className="price-edit-confirm">Đã kiểm tra: {money(preview.price.gross)} − {money(preview.price.discount)} = {money(preview.price.gross-preview.price.discount)}. Giá sẽ được áp dụng khi hợp đồng khớp điều kiện trên; trang tự tải lại để tính lại dữ liệu.</div>}
   <footer className="price-edit-actions"><button className="quiet-button" type="button" disabled={busy} onClick={onCancel}>Hủy</button><button className="secondary-button" type="button" disabled={busy} onClick={()=>void view()}>{busy?'Đang kiểm tra…':'Kiểm tra giá và phạm vi'}</button><button className="primary-button" type="button" disabled={!preview||busy} onClick={()=>void save()}>Lưu giá & tính lại</button></footer>
  </section>
 </div>;
}
