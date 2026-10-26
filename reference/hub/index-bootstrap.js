// Isolated document_start: the background's dedicated tab context activates
// the page observer. A request marker is never put into a Hub URL.
(() => {
 const I=globalThis.PromotionHubIndex;
 if(!I||location.origin!==I.INDEX_ORIGIN||window.top!==window||location.pathname.toLowerCase()!=='/contract/list')return;
 let job,stopped=false;
 const activate=()=>{if(job&&!stopped)window.postMessage({channel:I.INDEX_CHANNEL,type:'activate',id:job.id,codes:job.codes},I.INDEX_ORIGIN);};
 const listen=event=>{
  const m=event.data;if(event.source!==window||event.origin!==I.INDEX_ORIGIN||m?.channel!==I.INDEX_CHANNEL)return;
  if(m.type==='ready'&&(!m.id||m.id===job?.id))activate();
  if(job&&m.id===job.id&&m.type==='release'){stopped=true;job=null;window.removeEventListener('message',listen);}
 };
 window.addEventListener('message',listen);
 void chrome.runtime.sendMessage({type:'context'}).then(context=>{
  if(stopped||context?.kind!=='index'||!I.indexURLMatches(location.href,context.codes,context.id)){window.removeEventListener('message',listen);return;}
  job=context;window.postMessage({channel:I.INDEX_CHANNEL,type:'hello',id:job.id},I.INDEX_ORIGIN);
 }).catch(()=>{window.removeEventListener('message',listen);});
})();
