import React,{useEffect,useState} from 'react';
import {localFetch} from './api.mjs';

export default function LocalFileLink({href,children,...props}:any){
 const [file,setFile]=useState<{url:string,name:string}|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  let cancelled=false,url='';
  setFile(null);setError('');
  (async()=>{
   try{
    const response=await localFetch(href);
    if(!response.ok)throw Error((await response.json()).error);
    const blob=await response.blob();
    if(cancelled)return;
    url=URL.createObjectURL(blob);
    const name=decodeURIComponent(response.headers.get('Content-Disposition')?.split("filename*=UTF-8''")[1]||'Nguon');
    setFile({url,name});
   }catch(e:any){if(!cancelled)setError(e.message||'Không đọc được file gốc.');}
  })();
  return()=>{cancelled=true;if(url)URL.revokeObjectURL(url);};
 },[href]);
 if(error)return <span role="alert">{error}</span>;
 if(!file)return <span aria-busy="true">{children} · Đang chuẩn bị…</span>;
 const label=(child:any):any=>typeof child==='string'?child.replace(/\.(csv|tsv)$/i,'.xlsx'):Array.isArray(child)?child.map(label):child;
 return <a {...props} href={file.url} download={file.name} target={undefined} title={file.name}>{label(children)}</a>;
}
