import {tableWorkbook,XLSX_MIME} from './xlsx-export.mjs';
import {parseCsv} from './source-parser.mjs';
export async function reconciliationWorkbook(records,columns,date){
 const headers=['No.','Student name',...columns.map(c=>c.label+(c.group===2?' (CALC)':c.group===3?' (RAW)':'')),'Ghi chú'];
 const rows=records.map((row,index)=>[index+1,row.cells.G,...columns.map(c=>c.key==='paymentCode'?row.paymentCode:c.key==='D'?date(row.cells.D):c.key==='AG'?String(row.cells.AG??'').toUpperCase()==='APPROVED'?'APPROVED':'':c.key==='L'?String(row.cells.L??'').split(';').join('\n'):row.cells[c.key]),[row.cells.AN,row.sourceContracts?.length?'CT nguồn:\n'+row.sourceContracts.join('\n'):''].filter(Boolean).join('\n')]);
 return tableWorkbook([{name:'Bảng đối chiếu',headers,rows}]);
}
export async function reportWorkbook(payload,report,month,definition){
 const metadata=[['Source URL',payload.url],['Captured at',payload.capturedAt],['Region','North (1)'],['Date filter',definition.dateField],['Month',month],['Detail records',payload.total]];
 const bytes=await tableWorkbook([{name:definition.label,headers:payload.headers,rows:payload.rows},{name:'Nguồn',headers:['Thông tin','Giá trị'],rows:metadata,numbers:false}]);
 return {fileName:'Hub_'+definition.path.split('/').at(-1)+'_'+month+'.xlsx',bytes,type:XLSX_MIME,report,month,total:payload.total,url:payload.url};
}
export async function sourceDownload(file){
 if(!/\.(?:csv|tsv)$/i.test(file.name??file.fileName??''))return file;
 const rows=parseCsv(await file.blob.text());if(!rows.length)throw Error('File nguồn không có bảng dữ liệu.');
 const snapshot=rows[0]?.[0]==='Hub report snapshot',header=snapshot?rows.findIndex((r,i)=>i>6&&r.length>2):-1;
 const tables=snapshot&&header>=0?[{name:String(rows[0][1]||'Report'),headers:rows[header],rows:rows.slice(header+1)},{name:'Nguồn',headers:['Thông tin','Giá trị'],rows:rows.slice(0,header).filter(r=>r.length),numbers:false}]:[{name:'Nguồn',headers:rows[0],rows:rows.slice(1)}];
 const bytes=await tableWorkbook(tables);return {...file,name:(file.name??file.fileName).replace(/\.(?:csv|tsv)$/i,'.xlsx'),blob:new Blob([bytes],{type:XLSX_MIME})};
}
