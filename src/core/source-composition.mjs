// Reuse the normalized rows actually retained by a saved batch. The original
// files remain linked for download; reusing a batch never reparses those files.
export function reusableSources(dataset) {
 const bundle=dataset.bundle;
 return bundle.sources.map(source=>{
  const rows=source.role==='payment'?bundle.cash:source.role==='transfer'?bundle.transfers:bundle.exports;
  const records=rows.filter(row=>row.sourceKey===source.key);
  return {...source,records,fileId:dataset.fileIds[source.fileIndex],datasetId:dataset.id,
   datasetName:dataset.fileName,period:bundle.scope,periodStart:dateNumber(bundle.scope.from),periodEnd:bundle.cutoff,
   errors:[],warnings:[]};
 });
}
const dateNumber=value=>Math.floor((Date.parse(value+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000);
export function selectReusableSources(sources,keys,{includeHistory=false}={}) {
 return sources.filter(source=>keys.includes(source.key)).map(source=>{
  const records=source.records.filter(row=>source.role==='export'||includeHistory||
   (source.role==='payment'?row.cells.O:row.date)>=source.periodStart&&
   (source.role==='payment'?row.cells.O:row.date)<source.periodEnd+1);
  return records.length||!source.records.length?{...source,records,rowCount:records.length,includeHistory}:null;
 }).filter(Boolean);
}
export function prepareSourceSheets(incoming=[],saved=[]) {
 const sheets=[],fileRefs=[],origins=[],files=new Map();
 const add=(source,reused)=>{
  const token=reused?'saved:'+source.fileId:'new:'+source.fileIndex;
  if(!files.has(token)){
   files.set(token,fileRefs.length);
   fileRefs.push(reused?{kind:'saved',id:source.fileId}:{kind:'new',index:source.fileIndex});
  }
  const key='s'+sheets.length;
  sheets.push({...source,key,fileIndex:files.get(token),records:source.records.map(({sourceKey,...row})=>({...row,...(row.cells?{cells:{...row.cells}}:{})}))});
  origins.push({key,...(reused?{datasetId:source.datasetId,sourceKey:source.key,includeHistory:source.includeHistory===true}:{newFileIndex:source.fileIndex})});
 };
 for(const source of saved)add(source,true);
 for(const source of incoming)add(source,false);
 if(fileRefs.length>8)throw Error('Bộ kết hợp vượt 8 file gốc. Bỏ chọn sheet không cần dùng hoặc chia thành đợt nhỏ hơn.');
 if(sheets.length>12)throw Error('Bộ kết hợp vượt 12 sheet. Bỏ chọn nguồn không cần dùng.');
 return {sheets,fileRefs,origins};
}
export function hubReportPlan(month,history=0,reports=['transfer','export','payment']) {
 if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)||!Number.isInteger(history)||history<0||history>2)throw Error('Chọn tháng và tối đa 2 tháng nguồn lịch sử.');
 if(!Array.isArray(reports)||!reports.length||new Set(reports).size!==reports.length||reports.some(r=>!['transfer','export','payment'].includes(r)))throw Error('Chọn ít nhất một báo cáo cần lấy từ Hub.');
 const plan=['transfer','export','payment'].filter(r=>reports.includes(r)).map(report=>({report,month}));
 const [year,number]=month.split('-').map(Number);
 for(let i=1;i<=history;i++){
  const earlier=new Date(Date.UTC(year,number-1-i,1)).toISOString().slice(0,7);
  if(!/^20\d{2}-/.test(earlier))throw Error('Tháng lịch sử ngoài phạm vi hỗ trợ.');
  for(const report of ['payment','transfer'].filter(r=>reports.includes(r)))plan.push({report,month:earlier});
 }
 return plan;
}
