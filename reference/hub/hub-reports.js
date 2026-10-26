// Runs only in the isolated content-script world, in the dedicated report tab.
(() => {
 const P=globalThis.PromotionHub,R=globalThis.PromotionHubReports;
 if(!P||!R||location.origin!==P.HUB||window.top!==window)return;
 const send=m=>chrome.runtime.sendMessage(m);
 void send({type:'context'}).then(job=>{
  if(job?.kind!=='report'||!R.reportPeriod(job.month)||!Object.hasOwn(R.HUB_REPORTS,job.report))return;
  const spec=R.HUB_REPORTS[job.report],period=R.reportPeriod(job.month),startedAt=Date.now(),renderMs=R.reportRenderMs(job.report),renderDeadline=startedAt+renderMs,validationMs=job.report==='payment'?renderMs:30_000;
  let deadline=startedAt+validationMs,seenTables=false,done=false,working=false,loginNotified=false,observer,timer;
  const visible=e=>!e.hidden&&e.getAttribute('aria-hidden')!=='true'&&(!e.getClientRects||e.getClientRects().length>0);
  const stop=()=>{done=true;observer?.disconnect();clearInterval(timer);};
  const complete=m=>{stop();void send({id:job.id,...m}).then(r=>{if(r?.error)void send({id:job.id,type:'report-failure',reason:'row_count'});}).catch(()=>{});};
  const fail=(reason,extra={})=>complete({type:'report-failure',reason,...extra});
  const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const keys=e=>[norm(e.name),norm(e.id)];
  const safe=e=>e.type!=='password'&&!/token|session|pass|auth|secret|credential/i.test(e.name+' '+e.id);
  const description=e=>norm([e.getAttribute('aria-label'),e.getAttribute('placeholder'),...[...(e.labels??[])].map(l=>l.textContent)].filter(Boolean).join(' '));
  const fromKey=e=>keys(e).some(k=>['fromdate','datefrom','startdate'].includes(k)),toKey=e=>keys(e).some(k=>['todate','dateto','enddate'].includes(k));
  const rangeKey=e=>keys(e).some(k=>['daterange','dates','range','daterangepicker',norm(spec.dateField)].includes(k))||visible(e)&&[norm(spec.dateField),'daterange','khoangngay'].some(k=>description(e).includes(k));
  const dateParts=value=>{
   const text=String(value??'').trim(),iso=/^(20\d{2})-(\d{2})-(\d{2})$/.exec(text),local=/^(\d{1,2})[-/](\d{1,2})[-/](20\d{2})$/.exec(text);
   return iso?{iso:text}:local?{dmy:`${local[3]}-${local[2].padStart(2,'0')}-${local[1].padStart(2,'0')}`,mdy:`${local[3]}-${local[1].padStart(2,'0')}-${local[2].padStart(2,'0')}`} : {};
  };
  const dateMatches=(value,expected)=>Object.values(dateParts(value)).includes(expected);
  const rangeMatches=value=>{
   const dates=String(value??'').match(/20\d{2}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2}/g);if(dates?.length!==2)return false;
   const first=dateParts(dates[0]),last=dateParts(dates[1]);return ['iso','dmy','mdy'].some(format=>first[format]===period.from&&last[format]===period.to);
  };
  const rangeReadable=value=>(String(value??'').match(/20\d{2}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2}/g)??[]).length===2;
  const filterProof=()=>{
   // Only explicitly named or semantically labeled date/region controls. Hidden
   // unknown controls and authentication values are never inspected.
   const all=[...document.querySelectorAll('input')].filter(safe);
   const inputs=all.filter(e=>['text','date','search','hidden'].includes(e.type)&&(fromKey(e)||toKey(e)||rangeKey(e)&&e.type!=='hidden'||e.type==='hidden'&&keys(e).some(k=>['daterange','dates','range'].includes(k))));
   const from=inputs.filter(fromKey),to=inputs.filter(toKey),ranges=inputs.filter(e=>!fromKey(e)&&!toKey(e)&&rangeKey(e));
   const datesConflict=from.some(e=>Object.keys(dateParts(e.value)).length&&!dateMatches(e.value,period.from))||to.some(e=>Object.keys(dateParts(e.value)).length&&!dateMatches(e.value,period.to))||ranges.some(e=>rangeReadable(e.value)&&!rangeMatches(e.value));
   const regionKey=e=>keys(e).some(k=>/^region(?:id)?$/.test(k));
   const regions=[...document.querySelectorAll('select')].filter(e=>safe(e)&&(regionKey(e)||visible(e)&&/^(?:region|mien|khuvuc)$/.test(description(e))));
   regions.push(...all.filter(e=>e.type==='hidden'&&regionKey(e)));
   const regionConflict=regions.some(e=>/^\d+$/.test(e.value)&&e.value!=='1'||/^south$/i.test(e.value)||[...(e.selectedOptions??[])].some(o=>/^south(?:\s|$)/i.test(o.textContent.trim())));
   const sizes=job.stage==='report-full'?[...document.querySelectorAll('select,input')].filter(e=>safe(e)&&keys(e).includes('ps')):[];
   // An option list may not contain an arbitrary ps=2262 and display blank;
   // the exact URL, actual N rows and pagination still have to prove completeness.
   const pageSizeMatch=sizes.every(e=>!Number.isSafeInteger(Number(e.value))||Number(e.value)<=0||Number(e.value)===job.pageSize);
   return {datesConflict,regionConflict,pageSizeMatch,dateControls:inputs.length,regionControls:regions.length};
  };
  const cellText=cell=>{
   const copy=cell.cloneNode(true);for(const e of copy.querySelectorAll('script,style,input,select,button,form,iframe,svg'))e.remove();return copy.textContent.replace(/\u00a0/g,' ').trim();
  };
  const header=table=>{
   const own=rows=>[...rows].filter(r=>r.closest('table')===table),head=own(table.querySelectorAll('thead tr')).slice(0,8);
   const read=rows=>{
    if(!rows.length)return null;
    try{const headers=R.flattenHeaders(rows.map(row=>[...row.cells].map(c=>({text:cellText(c),colSpan:c.colSpan,rowSpan:c.rowSpan}))));
     return R.detailHeaders(headers,job.report)?{headers,headerRows:new Set(rows)}:null;
    }catch{return null;}
   };
   const standard=read(head);if(standard)return standard;
   // Legacy report markup may use td in tbody for business header rows.
   // Match the schema; never select a table solely by its visual position.
   const allRows=own(table.querySelectorAll('tr'));
   // PaymentList has filters, a long center summary, then invoice detail.
   // Its business header can occur below the first eight rows in a shared table.
   // Anchor on both date/VAT labels, then validate the complete detail schema.
   if(job.report==='payment')for(const row of allRows.slice(0,R.MAX_REPORT_ROWS+8)){
    const labels=[...row.cells].map(c=>norm(c.textContent));
    if(labels.includes('invoicedate')&&labels.includes('vatinvoiceno')){
     const found=read([row]);if(found)return found;
    }
   }
   const rows=allRows.slice(0,8);
   for(let start=0;start<rows.length;start++)for(let size=1;size<=8-start;size++){
    const found=read(rows.slice(start,start+size));if(found)return found;
   }
   return null;
  };
  const dataRows=(table,headerRows)=>{
   // Exclude filter/summary rows before the identified business header even
   // when Hub renders all three visual sections inside one HTML table.
   const positions=new Map();let headerEnd=-1;
   for(const row of table.querySelectorAll('tr'))if(row.closest('table')===table){
    positions.set(row,positions.size);if(headerRows.has(row))headerEnd=positions.get(row);
   }
   return [...table.querySelectorAll('tbody tr')].filter(r=>r.closest('table')===table&&!headerRows.has(r)&&positions.get(r)>headerEnd);
  };
  const pageSizeControls=()=>[...document.querySelectorAll('select')].filter(e=>safe(e)&&keys(e).some(k=>['ps','pagesize'].includes(k)));
  const pageSizeOptions=()=>pageSizeControls().flatMap(e=>[...(e.options??[])].slice(0,100).map(o=>({value:o.value,text:o.textContent,disabled:o.disabled})));
  const countNumber=value=>{const s=String(value??'').trim();return /^\d+(?:[., ]\d{3})*$/.test(s)?Number(s.replace(/[., ]/g,'')):null;};
  const totalFromText=text=>{
   const patterns=[/\bof\s+([\d., ]+)\s+(?:entries|records?|rows?)\b/i,/(?:tổng(?:\s+số)?|total)\s*(?:records?|rows?|entries|bản ghi|dòng)\s*:?\s*([\d., ]+)/i,/(?:records?|rows?|entries|bản ghi|dòng)\s*(?:total|tổng(?:\s+số)?)\s*:?\s*([\d., ]+)/i];
   for(const rx of patterns){const m=rx.exec(text);if(m){const n=countNumber(m[1]);if(n!==null)return n;}}return null;
  };
  const totalRows=(table,headerRows)=>{
   const bound=table.id?document.getElementById(table.id+'_info'):null;
   const explicit=[...document.querySelectorAll('[data-total-records],[data-record-count],input[name="totalRecords"],input[name="TotalRecords"],[id*="TotalRecord"],[id*="totalRecord"]')];
   const labels=[...document.querySelectorAll('label,span,strong,b,p')].filter(e=>e.textContent.length<180&&/^\s*(?:total(?:\s+number\s+of)?|tổng(?:\s+số)?)\s*(?:records?|rows?|entries|bản ghi|dòng)\b/i.test(e.textContent));
   const nodes=[...explicit,...labels];
   const values=[];
   for(const e of nodes){
    const attr=e.getAttribute('data-total-records')??e.getAttribute('data-record-count');
    const n=attr!==null?countNumber(attr):/totalRecords/i.test(e.name||e.id)?countNumber(e.value??e.textContent):totalFromText(e.textContent);
    if(n!==null)values.push(n);
   }
   const unique=[...new Set(values)];
   // A client-side grid may count only the server's current page. Its info
   // text alone never authorizes a probe to call that partial page complete.
   const info=bound?[bound]:[...document.querySelectorAll('.dataTables_info,.pagination-info,.pagination-summary,.k-pager-info'),...[...document.querySelectorAll('div,span,p')].filter(e=>e.textContent.length<180&&/^\s*Showing\s+[\d., ]+\s+to\s+[\d., ]+\s+of\s+[\d., ]+\s+entries\s*$/i.test(e.textContent))];
   const counts=[...new Set(info.map(e=>totalFromText(e.textContent)).filter(n=>n!==null))];
   const globalFooter=counts.length===1&&info.some(e=>{
    const m=/^\s*Showing\s+([\d., ]+)\s+to\s+([\d., ]+)\s+of\s+([\d., ]+)\s+entries\s*$/i.exec(e.textContent);if(!m)return false;
    const start=countNumber(m[1]),end=countNumber(m[2]),total=countNumber(m[3]),shown=dataRows(table,headerRows).length;
    return start===1&&end===shown&&end<=job.pageSize&&total===counts[0]&&total>end&&hasMore(table);
   });
   // A current-page counter cannot contradict a declared global counter.
   const proven=[...new Set([...unique,...(globalFooter?counts:[])])];
   if(proven.length>1)return {value:null,server:false,source:'conflict'};
   if(proven.length===1)return {value:proven[0],server:true,source:unique.length?'server':'footer'};
   return {value:null,server:false,source:'none'};
  };
  const hasMore=table=>[...(table?.closest?.('.dataTables_wrapper')??document).querySelectorAll('.pagination a,.pagination button,.dataTables_paginate a,.dataTables_paginate button,.k-pager-wrap a,a[rel="next"]')].some(e=>{
   if(!visible(e)||e.disabled||e.getAttribute('aria-disabled')==='true'||/(?:^|\s)disabled(?:\s|$)/i.test(e.className+' '+(e.parentElement?.className??'')))return false;
   const text=(e.textContent+' '+(e.getAttribute('aria-label')??'')).trim();return /\bnext\b|trang sau|^sau$|[›»]/i.test(text)||/^\d+$/.test(text)&&Number(text)>1;
  });
  const bodyRows=(table,headers,headerRows)=>{
   const rows=dataRows(table,headerRows),result=[];let size=0;
   for(const row of rows){
    const cells=[...row.cells];
    if(cells.length===1&&cells[0].colSpan>1&&/no\s+(?:matching\s+)?(?:data|records?|results?)|không\s+(?:có|tìm thấy)\s+(?:dữ liệu|kết quả)/i.test(cells[0].textContent))continue;
    if(cells.length!==headers.length||cells.some(c=>c.colSpan!==1||c.rowSpan!==1))throw Error('structure');
    const values=cells.map(cellText);if(values.some(v=>v.length>4000))throw Error('limit');
    size+=values.reduce((n,v)=>n+v.length,0);if(size>R.MAX_REPORT_BYTES||result.length>=R.MAX_REPORT_ROWS)throw Error('limit');result.push(values);
   }
   return result;
  };
  const inspect=()=>{
   if(done||working)return;working=true;
   try{
    if([...document.querySelectorAll('input[type="password"]')].some(visible)||/\/(?:login|signin|sign-in)(?:\/|$)/i.test(location.pathname)){
     if(!loginNotified){loginNotified=true;void send({type:'login',id:job.id});}return;
    }
    if(/upstream connect error|ERR_CONNECTION|connection (?:refused|reset)/i.test((document.body?.innerText??'').slice(0,400))){fail('connection');return;}
    if(!R.reportURLMatches(location.href,job.report,job.month,job.pageSize)){
     if(location.pathname!==spec.path){complete({type:'resume'});return;}
     if(Date.now()>=deadline)fail('filters');return;
    }
    const filters=filterProof();
    // A missing/unknown datepicker is not evidence of wrong dates. The exact
    // requested URL scopes the read; recognized contradictions still stop it.
    // Full packets must separately pass the actual business-date row check.
    if(filters.datesConflict||filters.regionConflict||!filters.pageSizeMatch){if(Date.now()>=deadline)fail('filters',{filter:filters.datesConflict?'dates':filters.regionConflict?'region':'page_size',dateControls:filters.dateControls,regionControls:filters.regionControls});return;}
    const allTables=[...document.querySelectorAll('table')],tables=allTables.filter(visible),loading=document.readyState==='loading'||[...document.querySelectorAll('[aria-busy="true"],.dataTables_processing')].some(visible);
    const pageState={tablesDetected:allTables.length,tablesScanned:tables.length,frames:document.querySelectorAll('iframe,frame').length,grids:document.querySelectorAll('[role="grid"],[role="table"]').length,documentState:document.readyState,visibility:document.visibilityState,loading,elapsedSeconds:Math.floor((Date.now()-startedAt)/1000)};
    // No rendered table is a page-readiness failure, not a header mismatch.
    // Never read hidden tables or infer a zero-row report from a blank page.
    if(loading||!tables.length){if(Date.now()>=renderDeadline)fail(loading?'timeout':'not_rendered',{...pageState,tables:0,pageSizes:[]});return;}
    if(!seenTables){seenTables=true;deadline=Math.min(renderDeadline,Date.now()+validationMs);}
    let candidates=[];const pageSizes=pageSizeOptions().map(o=>Number(o.value)).filter(n=>Number.isSafeInteger(n)&&n>0&&n<=R.MAX_REPORT_ROWS);
    for(const table of tables){const parsed=header(table);if(parsed)candidates.push({table,...parsed});}
    const withData=candidates.filter(c=>dataRows(c.table,c.headerRows).length>0);if(withData.length)candidates=withData;
    const diagnostic={...pageState,tables:candidates.length,pageSizes};
    if(candidates.length!==1){if(Date.now()>=deadline)fail('detail_table',diagnostic);return;}
    const {table,headers,headerRows}=candidates[0],proof=totalRows(table,headerRows),total=proof.value;
    Object.assign(diagnostic,{columns:headers.length,actualRows:dataRows(table,headerRows).length,countSource:proof.source});
    if(proof.source==='conflict'){fail('total_count',diagnostic);return;}
    if(total!==null&&total>R.MAX_REPORT_ROWS){fail('limit');return;}
    if(job.stage==='report-probe'){
     if(total!==null&&proof.server){complete({type:'report-count',total});return;}
     if(Date.now()>=deadline)fail('total_count',diagnostic);return;
    }
    const rows=bodyRows(table,headers,headerRows);
    if(total!==null&&total!==job.total||rows.length!==job.total){if(Date.now()>=deadline)fail('row_count',{actualRows:rows.length,expectedRows:job.total});return;}
    if(hasMore(table)){if(Date.now()>=deadline)fail('pagination',{actualRows:rows.length,expectedRows:job.total});return;}
    const dateStatus=R.reportDateStatus(headers,rows,job.report,job.month);
    if(!['ok','not_rendered'].includes(dateStatus)){fail(dateStatus==='missing'?'date_column':'date_rows',{actualRows:rows.length,expectedRows:job.total});return;}
    const payload={report:job.report,month:job.month,url:location.href,headers,rows,total:job.total,capturedAt:new Date().toISOString()};
    if(new TextEncoder().encode(JSON.stringify(payload)).length>R.MAX_REPORT_BYTES){fail('limit');return;}
    if(!R.reportPayload(payload,job.report,job.month)){fail('filters');return;}
    complete({type:'report-complete',payload});
   }catch(error){fail(error.message==='limit'?'limit':'unsupported');}finally{working=false;}
  };
  timer=setInterval(inspect,750);observer=new MutationObserver(inspect);observer.observe(document.documentElement,{childList:true,subtree:true});inspect();
 }).catch(()=>{});
})();
