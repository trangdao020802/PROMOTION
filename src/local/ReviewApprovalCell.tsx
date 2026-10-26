import React from 'react';
export default function ReviewApprovalCell({row,id,disabled,onChange}:any){
 const item=row.reviewItems?.find((i:any)=>i.id===id);
 if(!item)return <span className="muted">—</span>;
 return <label className={'approval '+(item.approved?'approved':'')} title={item.description}>
  <input type="checkbox" checked={item.approved} disabled={disabled} aria-label={'Duyệt '+item.label+' – '+row.cells.G} onChange={e=>onChange(e.target.checked)}/>
  <span>{item.approved?'Đã duyệt':'Chờ duyệt'}</span>
 </label>;
}
