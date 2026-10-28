import React,{useCallback,useEffect,useId,useRef,useState} from 'react';

export default function AuditSearch({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const id=useId(),trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null),[open,setOpen]=useState(false);
 const position=useCallback(()=>{
  if(!trigger.current||!panel.current)return;
  const rect=trigger.current.getBoundingClientRect(),viewport=window.visualViewport,left=viewport?.offsetLeft??0,top=viewport?.offsetTop??0,width=viewport?.width??window.innerWidth,height=viewport?.height??window.innerHeight;
  const panelWidth=Math.min(320,width-24),panelHeight=panel.current.getBoundingClientRect().height||110;
  Object.assign(panel.current.style,{width:panelWidth+'px',left:Math.max(left+12,Math.min(rect.right-panelWidth,left+width-panelWidth-12))+'px',top:(rect.bottom+panelHeight+18<=top+height?rect.bottom+6:Math.max(top+12,rect.top-panelHeight-6))+'px'});
 },[]);
 useEffect(()=>{
  if(!open)return;
  window.addEventListener('resize',position);window.addEventListener('scroll',position,true);window.visualViewport?.addEventListener('resize',position);
  return()=>{window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);window.visualViewport?.removeEventListener('resize',position);};
 },[open,position]);
 return <div className="audit-search">
  <button ref={trigger} type="button" className={'audit-search-trigger'+(value?' active':'')} aria-label="Tìm hồ sơ" aria-expanded={open} aria-controls={id} popoverTarget={id} title={value?'Đang tìm: '+value:'Tìm hồ sơ'} onClick={position}>
   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
   {value&&<span className="audit-search-active" aria-hidden="true"/>}
  </button>
  <div ref={panel} id={id} popover="auto" className="audit-search-panel" role="search" aria-label="Tìm hồ sơ trên bảng đối chiếu" onToggle={event=>{
   const visible=(event.nativeEvent as any).newState==='open';setOpen(visible);if(visible){position();input.current?.focus({preventScroll:true});}
  }}>
   <label htmlFor={id+'-input'}>Tìm hồ sơ</label>
   <div className="search-box">
    <input ref={input} id={id+'-input'} type="search" value={value} onChange={event=>onChange(event.target.value)} placeholder="Tên học sinh, mã thanh toán…" autoComplete="off" onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();panel.current?.hidePopover();trigger.current?.focus();}}}/>
    {value&&<button type="button" className="clear-search" aria-label="Xóa tìm kiếm" onClick={()=>{onChange('');input.current?.focus();}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>}
   </div>
  </div>
 </div>;
}
