// MAIN-world observer, activated by the requested tab's isolated bootstrap.
// It observes the page's own GetAllContracts GET; it never sends an API request.
(() => {
 const I=globalThis.PromotionHubIndex;
 if(!I||location.origin!==I.INDEX_ORIGIN||location.pathname.toLowerCase()!=='/contract/list'||window.top!==window)return;
 const limit=12*1024*1024;
 let id,deadline=0,active=false,released=false,wanted=new Set(),ready=false,pairs=[],conflicts=[];
 const alive=()=>active&&Date.now()<deadline;
 const endpoint=(value,method='GET')=>{try{const u=new URL(value,location.href);return String(method).toUpperCase()==='GET'&&u.origin===I.INDEX_ORIGIN&&!u.username&&!u.password&&/\/GetAllContracts\/?$/i.test(u.pathname);}catch{return false;}};
 const publish=()=>{if(alive())window.postMessage({channel:I.INDEX_CHANNEL,type:'snapshot',id,ready,pairs,conflicts},I.INDEX_ORIGIN);};
 const accept=value=>{
  if(!alive())return;const projection=I.projectContractPairs(value);if(!projection)return;
  // Keep bounded navigation metadata only; later responses can expose conflicts.
  const combined=[...new Map([...pairs,...projection.pairs].map(p=>[p.ct+'|'+p.id,p])).values()];
  const merged=I.projectContractPairs(combined.map(p=>({ContractNo:p.ct,ContractId:p.id})));
  if(!merged){ready=false;pairs=[];return;}ready=true;pairs=merged.pairs.filter(p=>wanted.has(p.ct));conflicts=[...new Set([...conflicts,...projection.conflicts,...merged.conflicts])].filter(ct=>wanted.has(ct));pairs=pairs.filter(p=>!conflicts.includes(p.ct));publish();
 };
 const parse=text=>{if(typeof text!=='string'||text.length>limit)return;try{accept(JSON.parse(text));}catch{}};
 const originalFetch=window.fetch;
 const wrappedFetch=typeof originalFetch==='function'?function(...args){
  const promise=originalFetch.apply(this,args);
  try{const req=args[0],method=args[1]?.method??(typeof req==='object'?req?.method:'GET')??'GET',url=typeof req==='string'?req:req?.url??req?.href;
  if(endpoint(url,method))void promise.then(async response=>{
   if(!alive()||!endpoint(response.url,method)||!response.ok)return;
   const reader=response.clone().body?.getReader();if(!reader)return;const decoder=new TextDecoder();let bytes=0,text='';
   try{for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>limit||!alive()){await reader.cancel();return;}text+=decoder.decode(chunk.value,{stream:true});}parse(text+decoder.decode());}catch{try{await reader.cancel();}catch{}}
  }).catch(()=>{});}catch{}
  return promise;
 }:null;
 if(wrappedFetch)window.fetch=wrappedFetch;
 const proto=window.XMLHttpRequest?.prototype,originalOpen=proto?.open,requests=new WeakMap();
 const wrappedOpen=originalOpen?function(method,url,...rest){
  const result=originalOpen.call(this,method,url,...rest);
  try{if(endpoint(url,method)){
   requests.set(this,{method,url});
   this.addEventListener('load',()=>{const req=requests.get(this);if(!alive()||!req||!endpoint(this.responseURL,req.method)||this.status<200||this.status>=300)return;
    try{if(this.responseType==='json')accept(this.response);else if(!this.responseType||this.responseType==='text')parse(this.responseText);}catch{}
   },{once:true});
  }else requests.delete(this);}catch{}
  return result;
 }:null;
 if(wrappedOpen)proto.open=wrappedOpen;
 window.addEventListener('message',event=>{
  const m=event.data;if(event.source!==window||event.origin!==I.INDEX_ORIGIN||m?.channel!==I.INDEX_CHANNEL)return;
  if(m.type==='hello'&&!released&&typeof m.id==='string'&&/^[\w-]{1,80}$/.test(m.id)){window.postMessage({channel:I.INDEX_CHANNEL,type:'ready',id:m.id},I.INDEX_ORIGIN);return;}
  if(m.type==='activate'&&!active&&!released&&I.indexURLMatches(location.href,m.codes,m.id)){
   id=m.id;wanted=new Set(m.codes);deadline=Date.now()+60_000;active=true;return;
  }
  if(m.id!==id)return;
  if(m.type==='read')publish();
  if(m.type==='release'){active=false;released=true;pairs=[];conflicts=[];wanted.clear();if(wrappedFetch&&window.fetch===wrappedFetch)window.fetch=originalFetch;if(wrappedOpen&&proto.open===wrappedOpen)proto.open=originalOpen;}
 });
 window.postMessage({channel:I.INDEX_CHANNEL,type:'ready'},I.INDEX_ORIGIN);
})();
