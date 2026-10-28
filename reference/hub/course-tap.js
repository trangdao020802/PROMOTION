// Observe the Hub page's own GET. Never construct or issue an API request.
(() => {
 const N=globalThis.PromotionHubCourseNetwork,origin='https://hub24.apollo.vn:7777';
 if(!N||location.origin!==origin||!/^\/contract\/detail\/[1-9]\d{0,14}\/?$/i.test(location.pathname)||window.top!==window)return;
 let id=null,stopped=false,snapshot=null;const limit=2*1024*1024,channel=N.COURSE_NETWORK_CHANNEL;
 const endpoint=(url,method)=>N.courseDetailEndpoint(url,location.href,method);
 const publish=()=>{if(id&&snapshot&&!stopped)window.postMessage({channel,type:'snapshot',id,projection:snapshot},origin);};
 const accept=(value,url)=>{if(stopped)return;const projected=N.projectContractDetail(value,url,location.href);if(projected){snapshot=projected;publish();}};
 const parse=(value,url)=>{if(typeof value!=='string'||value.length>limit)return;try{accept(JSON.parse(value),url);}catch{}};
 const originalFetch=window.fetch;
 const wrappedFetch=typeof originalFetch==='function'?function(...args){
  const promise=originalFetch.apply(this,args);
  try{const req=args[0],method=args[1]?.method??req?.method??'GET',url=typeof req==='string'?req:req?.url??req?.href;
   if(endpoint(url,method))void promise.then(async response=>{if(stopped||!response.ok||!endpoint(response.url,method))return;
    const reader=response.clone().body?.getReader();if(!reader)return;const decoder=new TextDecoder();let size=0,value='';
    try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>limit||stopped){await reader.cancel();return;}value+=decoder.decode(part.value,{stream:true});}parse(value+decoder.decode(),response.url);}catch{try{await reader.cancel();}catch{}}
   }).catch(()=>{});
  }catch{}return promise;
 }:null;
 if(wrappedFetch)window.fetch=wrappedFetch;
 const proto=window.XMLHttpRequest?.prototype,originalOpen=proto?.open,requests=new WeakMap();
 const wrappedOpen=originalOpen?function(method,url,...rest){const result=originalOpen.call(this,method,url,...rest);
  try{if(endpoint(url,method)){requests.set(this,{method});this.addEventListener('load',()=>{const req=requests.get(this);if(stopped||!req||this.status<200||this.status>=300||!endpoint(this.responseURL,req.method))return;try{if(this.responseType==='json')accept(this.response,this.responseURL);else if(!this.responseType||this.responseType==='text')parse(this.responseText,this.responseURL);}catch{}},{once:true});}else requests.delete(this);}catch{}return result;
 }:null;
 if(wrappedOpen)proto.open=wrappedOpen;
 window.addEventListener('message',event=>{
  const m=event.data;if(event.source!==window||event.origin!==origin||m?.channel!==channel||stopped)return;
  if(m.type==='activate'&&typeof m.id==='string'&&/^[\w-]{1,80}$/.test(m.id)&&m.url===location.href&&(!id||id===m.id)){id=m.id;publish();return;}
  if(m.id!==id)return;if(m.type==='read')publish();
  if(m.type==='release'){stopped=true;snapshot=null;if(wrappedFetch&&window.fetch===wrappedFetch)window.fetch=originalFetch;if(wrappedOpen&&proto.open===wrappedOpen)proto.open=originalOpen;}
 });
 window.postMessage({channel,type:'ready'},origin);
})();
