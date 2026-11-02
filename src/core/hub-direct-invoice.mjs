import {validateHubContract} from './hub-contract.mjs';
import {eInvoiceKey,eInvoicePDFURL,validateInvoice,mergePaymentInvoice} from './hub-invoice.mjs';

// The route is the actual E-Invoice download route supplied by the user. It
// needs neither an Angular controller nor CenterId, and never opens a viewer.
export async function readDirectInvoices(facts,{fetch:read,readPDF,signal,isCurrent=()=>true,budgetMs=5000,timeoutMs=3000}={}){
 if(!validateHubContract(facts)||typeof read!=='function'||typeof readPDF!=='function')return facts;
 const started=Date.now(),rows=facts.payments.rows.map(p=>({...p}));let tried=0;
 for(const row of rows){
  const key=eInvoiceKey(row.eInvoiceKey??row.invoiceRef);
  if(!key||row.complete!==true||row.amount<=0||row.invoice?.date&&row.invoice?.amount!==null)continue;
  if(signal?.aborted||!isCurrent()||tried>=4||Date.now()-started>=budgetMs)break;tried++;
  const ctrl=new AbortController(),stop=()=>ctrl.abort(),timer=setTimeout(stop,Math.max(1,Math.min(timeoutMs,budgetMs-(Date.now()-started))));
  signal?.addEventListener('abort',stop,{once:true});
  try{
   const response=await read(eInvoicePDFURL(key),{method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',signal:ctrl.signal});
   if(!response.ok||Number(response.headers.get('content-length'))>8*1024*1024)continue;
   const stream=response.body?.getReader();if(!stream)continue;let size=0;const parts=[];
   for(;;){const part=await stream.read();if(part.done)break;size+=part.value.byteLength;if(size>8*1024*1024||ctrl.signal.aborted||!isCurrent()){await stream.cancel();throw Error('PDF limit');}parts.push(part.value);}
   if(ctrl.signal.aborted||signal?.aborted||!isCurrent())break;
   const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
   if(String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')continue;
   const invoice=await readPDF(bytes,{timeoutMs:Math.min(2000,Math.max(1,budgetMs-(Date.now()-started)))});
   if(ctrl.signal.aborted||signal?.aborted||!isCurrent()||!validateInvoice(invoice))continue;
   const merged=mergePaymentInvoice(row,{invoice});
   if(invoice.amount!==null&&Math.abs(invoice.amount-row.amount)>1)merged.invoice.conflicts=[...new Set([...merged.invoice.conflicts,'amount'])];
   Object.assign(row,merged);
  }catch{}finally{clearTimeout(timer);signal?.removeEventListener('abort',stop);}
 }
 const result={...facts,payments:{...facts.payments,rows}};return validateHubContract(result)?result:facts;
}
