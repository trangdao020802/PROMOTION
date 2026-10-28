// Read-only broker in an existing Hub tab. Never opens/navigates a browser tab.
// Only observed API routes are reused; raw responses never leave this world.
(() => {
 const P=globalThis.PromotionHub,I=globalThis.PromotionHubIndex,N=globalThis.PromotionHubCourseNetwork;
 if(!P||!I||!N||location.origin!==P.HUB)return;
 const channel='promotion-hub/existing-tab/v1',managed=window.top!==window&&/^promotion-hub-read:[\w-]{1,80}$/.test(window.name);
 if(window.top!==window&&!managed)return;
 const frameId=managed?window.name.slice('promotion-hub-read:'.length):null;
 let route=null,active=null,buffer=null,controller=null;
 const originalFetch=window.fetch,proto=window.XMLHttpRequest?.prototype,originalOpen=proto?.open;
 const publish=data=>(managed?window.parent:window).postMessage({channel,...data},P.HUB);
 function endpoint(value,method='GET'){
  try{const u=new URL(value,location.href),id=u.searchParams.get('contractId'),detail=P.HUB+'/contract/detail/'+id;
   return N.courseDetailEndpoint(u.href,detail,method)?{url:u.href,detail}:null;
  }catch{return null;}
 }
 const indexEndpoint=(value,method)=>{try{const u=new URL(value,location.href);return String(method||'GET').toUpperCase()==='GET'&&u.origin===P.HUB&&!u.username&&!u.password&&!u.hash&&/\/GetAllContracts\/?$/i.test(u.pathname);}catch{return false;}};
 function accept(value,url,method){
  const e=endpoint(url,method);
  if(e){route=new URL(e.url).pathname;
   if(managed&&e.detail===location.origin+location.pathname.replace(/\/$/,'')){
    const projection=N.projectContractDetail(value,url,e.detail);if(projection){buffer={type:'course',projection,route};if(active)publish({id:active.id,...buffer});}
   }
  }else if(managed&&location.pathname.toLowerCase()==='/contract/list'&&indexEndpoint(url,method)){
   const projection=I.projectContractPairs(value);if(projection){
    const old=buffer?.type==='index'?buffer:{pairs:[],conflicts:[]};
    const merged=I.projectContractPairs([...old.pairs,...projection.pairs].map(p=>({ContractNo:p.ct,ContractId:p.id})));
    if(merged){buffer={type:'index',pairs:merged.pairs,conflicts:[...new Set([...old.conflicts,...projection.conflicts,...merged.conflicts])]};if(active)publish({id:active.id,...buffer});}
   }
  }
 }
 async function readResponse(response,url,method,signal){
  if(!response.ok||response.url&&response.url!==url&&!endpoint(response.url,method)&&!indexEndpoint(response.url,method))return;
  const limit=indexEndpoint(url,method)?12*1024*1024:2*1024*1024;
  const reader=response.body?.getReader();if(!reader)return;let bytes=0,body='';const decoder=new TextDecoder();
  try{for(;;){const c=await reader.read();if(c.done)break;bytes+=c.value.byteLength;if(bytes>limit||signal?.aborted){await reader.cancel();return;}body+=decoder.decode(c.value,{stream:true});}accept(JSON.parse(body+decoder.decode()),url,method);}catch{try{await reader.cancel();}catch{}}
 }
 const wrappedFetch=typeof originalFetch==='function'?function(...args){
  const result=originalFetch.apply(this,args);
  try{const req=args[0],url=typeof req==='string'?req:req?.url??req?.href,method=args[1]?.method??req?.method??'GET';
   const e=endpoint(url,method);if(e)route=new URL(e.url).pathname;
   if(managed&&(e||indexEndpoint(url,method)))void result.then(r=>readResponse(r.clone(),new URL(url,location.href).href,method)).catch(()=>{});
  }catch{}return result;
 }:null;
 if(wrappedFetch)window.fetch=wrappedFetch;
 const wrappedOpen=originalOpen?function(method,url,...rest){
  const result=originalOpen.call(this,method,url,...rest);
  const e=endpoint(url,method);if(e)route=new URL(e.url).pathname;
  if(managed&&(e||indexEndpoint(url,method)))this.addEventListener('load',()=>{
   try{if(this.status<200||this.status>=300)return;const responseURL=this.responseURL||new URL(url,location.href).href;
    if(!endpoint(responseURL,method)&&!indexEndpoint(responseURL,method))return;
    const limit=indexEndpoint(url,method)?12*1024*1024:2*1024*1024;
    if(this.responseType==='json')accept(this.response,responseURL,method);else if((!this.responseType||this.responseType==='text')&&this.responseText.length<=limit)accept(JSON.parse(this.responseText),responseURL,method);
   }catch{}
  },{once:true});return result;
 }:null;
 if(wrappedOpen)proto.open=wrappedOpen;
 window.addEventListener('message',event=>{
  const m=event.data;if(event.origin!==P.HUB||m?.channel!==channel||event.source!==(managed?window.parent:window)||typeof m.id!=='string'||!/^\w[\w-]{0,79}$/.test(m.id))return;
  if(managed){
   if(m.type==='activate'&&m.id===frameId&&((m.course&&globalThis.PromotionHubCourse?.courseRequest(m.course)?.url===location.origin+location.pathname.replace(/\/$/,''))||(m.codes&&I.indexURLMatches(location.href,m.codes,m.id,m.fields)))){active={id:m.id};if(buffer)publish({id:m.id,...buffer});}
   return;
  }
  if(m.type==='stop'&&active?.id===m.id){controller?.abort();active=null;return;}
  if(m.type==='learn-route'){
   const request=globalThis.PromotionHubCourse?.courseRequest(m.course);
   if(request&&N.courseDetailEndpoint(P.HUB+m.route+'?contractId='+request.url.split('/').pop(),request.url))route=m.route;
   return;
  }
  if(m.type!=='read-course')return;
  const request=globalThis.PromotionHubCourse?.courseRequest(m.course);if(!request)return;
  controller?.abort();controller=new AbortController();const signal=controller.signal;active={id:m.id};
  const url=route&&N.courseDetailEndpoint(P.HUB+route+'?contractId='+request.url.split('/').pop(),request.url);
  if(!url){publish({type:'route-missing',id:m.id});return;}
  void (async()=>{
   try{
    const response=await originalFetch.call(window,url,{method:'GET',credentials:'same-origin',signal,redirect:'error'});
    if(!response.ok)throw Error('response');
    const reader=response.body?.getReader();if(!reader)throw Error('body');let body='',bytes=0;const decoder=new TextDecoder();
    try{for(;;){const c=await reader.read();if(c.done)break;bytes+=c.value.byteLength;if(bytes>2*1024*1024||signal.aborted){await reader.cancel();throw Error('limit');}body+=decoder.decode(c.value,{stream:true});}}catch(e){try{await reader.cancel();}catch{}throw e;}
    const projection=N.projectContractDetail(JSON.parse(body+decoder.decode()),url,request.url);
    if(active?.id===m.id&&!signal.aborted)publish(projection?{type:'course',id:m.id,projection}:{type:'route-missing',id:m.id});
   }catch{if(active?.id===m.id&&!signal.aborted)publish({type:'route-missing',id:m.id});}
  })();
 });
})();
