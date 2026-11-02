import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {WorkerMessageHandler} from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import {parseInvoiceText} from '../core/hub-invoice.mjs';

// This module runs in the extension's isolated content world, loaded only when
// an E-Invoice is requested. No PDF, buyer name or address leaves the Hub tab.
globalThis.pdfjsWorker={WorkerMessageHandler};
export async function readInvoicePDF(bytes,{timeoutMs=3500}={}){
 if(!(bytes instanceof Uint8Array)||bytes.length<5||bytes.length>8*1024*1024||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')return null;
 let task,timer;
 try{
  task=getDocument({data:bytes,isEvalSupported:false,disableFontFace:true,useSystemFonts:false,useWasm:false,isOffscreenCanvasSupported:false,stopAtErrors:true,verbosity:0});
  const read=async()=>{
   const pdf=await task.promise;if(pdf.numPages>4)return null;
   const lines=[];
   for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n),content=await page.getTextContent();
    if(content.items.length>12000)return null;
    const rows=[];
    for(const item of content.items){
     if(typeof item.str!=='string'||!item.str.trim()||!Array.isArray(item.transform))continue;
     const [,,,,x,y]=item.transform;let row=rows.find(r=>Math.abs(r.y-y)<2);
     if(!row){row={y,items:[]};rows.push(row);}row.items.push({x,str:item.str});
    }
    lines.push(...rows.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ')));
    page.cleanup();
   }
   return parseInvoiceText(lines.join('\n'));
  };
  return await Promise.race([read(),new Promise(resolve=>{timer=setTimeout(()=>resolve(null),Math.max(100,Math.min(timeoutMs,5000)));})]);
 }catch{return null;}
 finally{clearTimeout(timer);try{await task?.destroy();}catch{}}
}
