import React,{useEffect,useState} from 'react';
import {tableWorkbook,XLSX_MIME} from '../core/xlsx-export.mjs';
import {reconciliationWorkbook} from '../core/table-exports.mjs';

// Prepare the file before the click, then use a native download link. This
// retains the user's click gesture after asynchronous XLSX compression.
export default function WorkbookDownload({sheets,records,columns,date,fileName,disabled=false,children,...props}:any){
 const [file,setFile]=useState<{url:string}|null>(null),[error,setError]=useState('');
 useEffect(()=>{
  let cancelled=false,url='';setFile(null);setError('');
  if(!disabled)void (sheets?tableWorkbook(sheets):reconciliationWorkbook(records,columns,date)).then(bytes=>{
   if(cancelled)return;url=URL.createObjectURL(new Blob([bytes],{type:XLSX_MIME}));setFile({url});
  }).catch(e=>{if(!cancelled)setError(e.message||'Chưa tạo được file XLSX.');});
  return()=>{cancelled=true;if(url)URL.revokeObjectURL(url);};
 },[sheets,records,columns,date,disabled]);
 if(error)return <span role="alert">{error}</span>;
 if(!file||disabled)return <button {...props} type="button" disabled title={disabled?'Chờ lưu và tính lại dữ liệu.':'Đang chuẩn bị file XLSX…'}>{children}</button>;
 return <a {...props} href={file.url} download={fileName}>{children}</a>;
}
