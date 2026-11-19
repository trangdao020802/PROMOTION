import React,{useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {glossaryParts} from '../core/terms.mjs';

function tooltipPosition(element:HTMLSpanElement|null){
 const rect=element?.getBoundingClientRect();if(!rect)return null;
 const width=Math.min(344,window.innerWidth-32),below=window.innerHeight-rect.bottom>=160;
 return {left:Math.max(16,Math.min(rect.left,window.innerWidth-width-16)),top:below?rect.bottom+8:rect.top-8,width,transform:below?'none':'translateY(-100%)'};
}

function TermHelp({term,text}:any){
 const id=useId(),anchor=useRef<HTMLSpanElement>(null);
 const [position,setPosition]=useState<any>(null);
 const open=position!==null,show=()=>setPosition(tooltipPosition(anchor.current));
 useEffect(()=>{
  if(!open)return;
  const update=()=>setPosition(document.activeElement===anchor.current?tooltipPosition(anchor.current):null);
  window.addEventListener('scroll',update,true);window.addEventListener('resize',update);
  return()=>{window.removeEventListener('scroll',update,true);window.removeEventListener('resize',update);};
 },[open]);
 return <>
  <span ref={anchor} className="term-help" data-term={term.id} tabIndex={0} aria-describedby={position?id:undefined}
   onMouseEnter={show} onMouseLeave={()=>{if(document.activeElement!==anchor.current)setPosition(null);}}
   onFocus={show} onBlur={()=>setPosition(null)}
   onKeyDown={event=>{if(event.key==='Escape'&&position){event.stopPropagation();setPosition(null);}}}>{text}</span>
  {position&&createPortal(<span id={id} className="term-tooltip" role="tooltip" style={position}><strong>{term.meaning}</strong><span>{term.description}</span></span>,document.body)}
 </>;
}

export default function TermText({text}:any){
 return <>{glossaryParts(text).map((part:any,index:number)=>part.term?<TermHelp key={index} term={part.term} text={part.text}/>:part.text)}</>;
}
