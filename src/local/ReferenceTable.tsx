import React,{useState} from 'react';
import {voucherDetailURL} from '../core/hub-voucher.mjs';
import {VOUCHER_POLICIES} from '../core/vouchers.mjs';
import {PRICE_PHASES} from '../core/price-catalog.mjs';

const value=(v:any)=>v===null||v===undefined||v===''?'Chưa có':typeof v==='number'?v.toLocaleString('vi-VN'):String(v);
const day=(v:any)=>typeof v==='number'&&Number.isFinite(v)?new Date(Date.UTC(1899,11,30)+v*86400000).toLocaleDateString('vi-VN',{timeZone:'UTC'}):v?String(v).split('-').reverse().join('/'):'Chưa xác định';
const statuses:any={PENDING:'Chờ bổ sung / duyệt',APPROVED:'Đã duyệt',CLOSED:'Đã đóng · có duyệt',REJECTED:'Từ chối',INACTIVE:'Không áp dụng'};
const coverage:any={ready:'Có giá và công thức',overridden:'Giá phát hành · có bản thay thế theo phạm vi',conflict:'CHECK · xung đột nguồn','gross-only':'Chỉ có giá gốc',missing:'CHECK · chưa đủ công thức','manual-policy':'Cần xác minh hồ sơ','not-applicable':'CHECK · chương trình không áp dụng'};
function Sources({row}:any){return <div className="price-source"><details><summary>Căn cứ nguồn ({row.refs?.length??0})</summary>{row.refs?.map((r:any,i:number)=><p key={i}>{r.file}<br/>{r.sheet} · {r.cell?'ô '+r.cell:r.rows?'dòng '+r.rows.join(', '):'dòng '+r.row}</p>)}{row.observedPrice!==null&&row.observedPrice!==undefined&&<p>Report quan sát: {value(row.observedPrice)} VND. Chỉ dùng so sánh.</p>}</details>{row.masterRefs?.length>0&&<details><summary>Đối chiếu bảng giá chung</summary>{row.masterRefs.map((m:any,i:number)=><p key={i}>{m.file} · dòng {m.row}<br/>{m.source}<br/>Giá trong bảng: {value(m.statedGross)} VND; Report quan sát: {value(m.observedGross)} VND.</p>)}</details>}{row.note&&<small>{row.note}</small>}</div>}
function Amount({n}:any){return <span className={typeof n==='number'?'price-number':'price-absent'}>{typeof n==='number'?value(n):'Chưa tính'}</span>}

export default function ReferenceTable({section,rows,disabled,onVoucherEdit}:any){
 const [phase,setPhase]=useState(section==='master'?'q4':'all'),[state,setState]=useState('all');
 if(section==='vouchers')return <div className="reference-scroll"><table className="reference-table voucher-reference" aria-label="Danh sách voucher">
  <thead><tr>{['Giftcode No','Học viên / Student ID','Center','Hiệu lực','Trạng thái','Chính sách','Loại / mức giảm','Cơ sở %','Căn cứ / chỉnh sửa'].map(s=><th key={s}>{s}</th>)}</tr></thead>
  <tbody>{rows.map((r:any)=><tr key={r.AH}><td>{voucherDetailURL(r.hubUrl)?<a href={voucherDetailURL(r.hubUrl)!} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{r.AH}</a>:r.AH}</td><td>{r.U}<small>{r.studentId}</small></td><td>{r.O}</td><td>{day(r.P)}<small>đến {day(r.Q)}</small></td><td>{statuses[r.R]??r.R}</td><td>{(VOUCHER_POLICIES as any)[r.policyId??'case-specific']}</td><td>{r.Z==='PHẦN TRĂM'?`${Number(r.V??0)*100}%`:value(r.AA)+' VND'}</td><td>{r.Z!=='PHẦN TRĂM'?'Số tiền cố định':r.percentBasis==='gross'?'Giá gốc':r.percentBasis==='after-discount'?'Giá gốc − Discount':'Theo ca đối chiếu; cần xác minh khi cộng Discount'}</td><td><details><summary>Căn cứ duyệt</summary><p>{r.approvalNote||'Chưa bổ sung'}</p></details><button className="quiet-button" disabled={disabled} onClick={()=>onVoucherEdit(r.AH)}>Chỉnh sửa voucher</button></td></tr>)}</tbody>
 </table></div>;
 const typed=rows.filter((r:any)=>r.id),visible=typed.filter((r:any)=>(phase==='all'||r.regime===phase||['supplement','legacy'].includes(r.regime)&&phase!=='reference'&&(!r.from||r.from<=(PRICE_PHASES as any)[phase]?.to)&&(!r.to||r.to>=(PRICE_PHASES as any)[phase]?.from)||!r.regime&&phase!=='reference'&&(!r.from||r.from<=(PRICE_PHASES as any)[phase]?.to)&&(!r.to||r.to>=(PRICE_PHASES as any)[phase]?.from))&&(state==='all'||r.status===state));
 const master=section==='master';
 const columns=master?['Khóa học / Layer / giờ','Gói / thời lượng tính','Kỳ chính sách','Đơn giá chưa giảm · tháng / tuần','Giá gốc','Giảm theo gói','Sau giảm · chưa voucher','Tháng tặng có điều kiện','Kỳ trả góp tối đa','Phạm vi tính','Truy vết / căn cứ']
  :['Khóa quy tắc','Khóa / Layer / giờ','Gói / hiệu lực','Cách tính / quyền lợi','Điều kiện áp dụng','Cộng gộp / thứ tự','Minh chứng cần có','Tình trạng','Truy vết / căn cứ'];
 return <>
  <div className="price-table-tools"><label>Kỳ chính sách<select aria-label="Kỳ chính sách bảng giá" value={phase} onChange={e=>setPhase(e.target.value)}><option value="all">Tất cả kỳ</option>{Object.entries(PRICE_PHASES).map(([id,p]:any)=><option key={id} value={id}>{p.label}</option>)}<option value="reference">Khóa / gói cần chính sách riêng</option></select></label><label>Phạm vi tính<select aria-label="Phạm vi tính bảng giá" value={state} onChange={e=>setState(e.target.value)}><option value="all">Tất cả tình trạng</option>{Object.entries(coverage).map(([id,label])=><option key={id} value={id}>{String(label)}</option>)}</select></label><span>{visible.length} dòng · tiền VND · tháng tặng chưa quy đổi thành tiền</span></div>
  <div className="reference-scroll"><table key={section} className={'reference-table canonical-'+section} aria-label={master?'Bảng giá chung thống nhất':'Quy tắc và điều kiện áp dụng'}>
   <thead><tr>{columns.map(s=><th key={s}>{s}</th>)}</tr></thead>
   <tbody>{visible.map((r:any)=>master?<tr key={r.id} className={'price-status-'+r.status}>
    <td><strong>{r.course}</strong><small>{r.group} · {r.koc??'chưa có KOC'} · {r.year??'chưa có năm'} · {r.layer===0?'Không chia Layer':`Layer ${r.layer??'?'}`} · {r.hours??'?'} giờ/tuần</small></td>
    <td>{r.package}<small>{r.unit==='weeks'?`${r.weeks??'?'} tuần tính học phí`:typeof r.months==='number'?r.months+' tháng tính học phí':'Chưa xác định số tháng'}</small></td>
    <td>{r.regimeLabel}<small>{day(r.from)} – {day(r.to)}</small>{r.renewFrom&&r.renewFrom!==r.from&&<small>Current từ {day(r.renewFrom)}</small>}</td>
    <td className="numeric"><Amount n={r.unit==='weeks'?r.unitPrice:r.monthly}/><small>{r.unit==='weeks'?'VND / tuần':'VND / tháng'}</small></td><td className="numeric"><Amount n={r.gross}/></td><td className="numeric"><Amount n={r.discount}/></td><td className="numeric"><Amount n={r.net}/></td>
    <td>Trả thẳng: {r.straight??'Chưa xác định'}<small>Loyalty tối đa: {r.loyalty??'Chưa xác định'}</small><small>Referral: {r.referral??'Chưa xác định'}</small></td>
    <td className="numeric">{r.maxTerms===0?'Trả thẳng':r.maxTerms===null?'Chưa có':r.maxTerms+' tháng'}</td>
    <td><span className={'price-coverage '+r.status}>{coverage[r.status]}</span>{r.conditions&&<small>{r.conditions}</small>}</td><td><Sources row={r}/></td>
   </tr>:<tr key={r.id} className={'price-status-'+r.status}>
    <td><strong>{r.ruleKey}</strong><small>{r.regimeLabel}</small></td><td>{r.course??r.group}<small>{r.layer?'Layer '+r.layer+' · '+r.hours+' giờ/tuần':''}</small></td><td>{r.package}<small>{day(r.from)} – {day(r.to)}</small></td><td>{r.benefit}</td><td>{r.conditions}</td><td>{r.stacking}</td><td>{r.requiredEvidence??'Đối tượng, ghi danh / full, lịch sử học phí và hồ sơ đối ứng nếu có.'}</td><td><span className={'price-coverage '+r.status}>{r.status==='ready'?'Có quy tắc nguồn':coverage[r.status]}</span></td><td><Sources row={r}/></td>
   </tr>)}{!visible.length&&<tr><td colSpan={columns.length}>Không có dòng phù hợp. Chọn Tất cả kỳ / tình trạng để xem các giá còn thiếu.</td></tr>}</tbody>
  </table></div>
 </>;
}
