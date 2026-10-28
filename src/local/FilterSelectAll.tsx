import React,{useEffect,useRef} from 'react';

export default function FilterSelectAll({label,options,selected,onChange,searching=false}:{label:string;options:{value:string}[];selected:string[];onChange:(values:string[])=>void;searching?:boolean}){
 const checkbox=useRef<HTMLInputElement>(null),values=options.map(option=>option.value),visible=new Set(values),count=values.filter(value=>selected.includes(value)).length,all=values.length>0&&count===values.length,mixed=count>0&&!all;
 useEffect(()=>{if(checkbox.current)checkbox.current.indeterminate=mixed;},[mixed]);
 return <label className="filter-select-all" title={searching?'Chọn hoặc bỏ chọn tất cả giá trị đang hiển thị':'Chọn hoặc bỏ chọn tất cả giá trị'}>
  <input ref={checkbox} type="checkbox" aria-label={'Chọn tất cả '+label} aria-checked={mixed?'mixed':all} checked={all} disabled={!values.length} onChange={event=>onChange(event.target.checked?[...new Set([...selected,...values])]:selected.filter(value=>!visible.has(value)))}/>
  <span>{searching?'Chọn tất cả kết quả':'Chọn tất cả'}</span><small>{values.length}</small>
 </label>;
}
