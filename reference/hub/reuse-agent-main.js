// Read-only broker in an existing Hub tab. Never opens/navigates a browser tab.
// Observed detail routes and source-known read services use Hub's own client;
// only scoped, validated input and policy projections leave this world.
(() => {
 const P=globalThis.PromotionHub,I=globalThis.PromotionHubIndex,N=globalThis.PromotionHubCourseNetwork;
 if(!P||!I||!N||location.origin!==P.HUB)return;
 const channel='promotion-hub/existing-tab/v1',managed=window.top!==window&&/^promotion-hub-read:[\w-]{1,80}$/.test(window.name);
 if(window.top!==window&&!managed)return;
 const frameId=managed?window.name.slice('promotion-hub-read:'.length):null;
 let route=null,active=null,buffer=null,controller=null,serviceCapture=null;
 const learnerCache=new Map(),pdfPending=new Map();
 const originalFetch=window.fetch,proto=window.XMLHttpRequest?.prototype,originalOpen=proto?.open;
 const publish=data=>(managed?window.parent:window).postMessage({channel,...data},P.HUB);
 function endpoint(value,method='GET'){
  try{const u=new URL(value,location.href),deposit=/\/GetDepositDetail\/?$/i.test(u.pathname),id=u.searchParams.get(deposit?'depositId':'contractId'),detail=P.HUB+(deposit?'/deposit/detail/':'/contract/detail/')+id;
   const normalized=N.courseDetailEndpoint(u.href,detail,method);return normalized?{url:normalized,detail}:null;
  }catch{return null;}
 }
 function remember(e){
  route=e.url;
  if(serviceCapture&&e.detail===serviceCapture.detail&&new URL(e.url).searchParams.get('userRoleId')===serviceCapture.role)serviceCapture.url=e.url;
 }
 function angularReader(request){
  // Hub can host its Angular application in an existing same-origin frame.
  // Reuse that authenticated client without navigating any frame or tab.
  const worlds=[window];
  for(let i=0;i<worlds.length&&i<16;i++)try{for(const child of Array.from(worlds[i].frames??[]).slice(0,16-worlds.length)){try{if(child.location.origin===P.HUB&&!worlds.includes(child))worlds.push(child);}catch{}}}catch{}
  for(const world of worlds)try{
   const doc=world===window?document:world.document,root=doc.querySelector('[ng-app],[data-ng-app]')||doc.body||doc.documentElement;
   const injector=world.angular?.element(root).injector?.(),role=injector?.get('$rootScope')?.sessionInfo?.UserRoleId;
   if(!/^(?:0|[1-9]\d{0,14})$/.test(String(role??'')))continue;
   const deposit=request?.readFinance&&request.ct.includes('-DEP-'),service=injector.get(deposit?'depositService':'contractService');if(typeof service?.[deposit?'getDepositDetail':'getContractDetail']!=='function')continue;
   const invoke=name=>typeof service[name]==='function'?params=>service[name](params):undefined;
   const optional=name=>{try{return injector.get(name);}catch{return null;}},lead=optional('leadService'),invoice=optional('depositService');
   return {role:String(role),deposit,read:id=>deposit?service.getDepositDetail({depositId:id,userRoleId:role}):service.getContractDetail({contractId:id,userRoleId:role}),payments:invoke(deposit?'getDepositPayment':'getContractPayment'),
    learnerPayments:typeof lead?.getKidPayments==='function'?params=>lead.getKidPayments(params):null,invoice:typeof invoice?.printEInvoice==='function'?params=>invoice.printEInvoice(params):null,
    policy:{info:invoke('getContractInfoForUpdate'),prices:invoke('getCoursePrice'),groups:invoke('getApplicableGroupDiscount'),voucher:invoke('checkContractGiftCode')}};
  }catch{}
  return null;
 }
 const bounded=(pending,ms)=>new Promise(resolve=>{let settled=false;const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value);},timer=setTimeout(()=>finish(null),ms);Promise.resolve(pending).then(finish,()=>finish(null));});
 async function fetchBody(url,signal){
  const response=await originalFetch.call(window,url,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{'X-Requested-With':'XMLHttpRequest'},signal,redirect:'error'});
  if(!response.ok)throw Error('response');
  const reader=response.body?.getReader();if(!reader)throw Error('body');let body='',bytes=0;const decoder=new TextDecoder();
  try{for(;;){const c=await reader.read();if(c.done)break;bytes+=c.value.byteLength;if(bytes>2*1024*1024||signal.aborted){await reader.cancel();throw Error('limit');}body+=decoder.decode(c.value,{stream:true});}}catch(e){try{await reader.cancel();}catch{}throw e;}
  return body+decoder.decode();
 }
 const fetchJSON=async(url,signal)=>JSON.parse(await fetchBody(url,signal));
 async function addUpgradeDate(projection,client,signal){
  const facts=projection?.hubContract;
  if(!facts||facts.contractDate||!facts.upgrades?.some(l=>l.direction==='from')||!client?.policy?.info||signal.aborted)return;
  let pending;const stop=()=>{try{pending?.abort?.();}catch{}};
  signal.addEventListener('abort',stop,{once:true});
  try{
   pending=client.policy.info({contractId:facts.contractId});
   const info=await bounded(pending,1200);
   if(!signal.aborted)projection.hubContract=N.mergeHubContractDate(facts,info);
  }catch{}finally{stop();signal.removeEventListener('abort',stop);}
 }
 async function addLearnerFinance(projection,root,client,signal,request){
  const learner=projection?.hubContract?.learner;if(!learner||!client?.learnerPayments||signal.aborted)return;
  const key=client.role+'|'+learner.leadId+'|'+learner.kidId;
  if(request?.refreshFinance)learnerCache.delete(key);
  const old=learnerCache.get(key);
  let pending=old&&Date.now()-old.time<60000?old.pending:null;
  if(!pending){
   pending=(async()=>{const pages=[];let count=0;
    for(let p=1;p<=10;p++){
     if(signal.aborted)break;
     let value;try{value=await bounded(client.learnerPayments({kidId:learner.kidId,p,ps:100}),1200);}catch{break;}
     const page=N.projectLearnerPaymentPage(value,root);if(!page)break;pages.push(page);count+=page.count;
     if(!page.count||page.total===null||count>=page.total)break;
    }return pages;
   })();
   learnerCache.set(key,{time:Date.now(),pending});if(learnerCache.size>40)learnerCache.delete(learnerCache.keys().next().value);
  }
  const pages=await bounded(pending,1800);
  if(!pages?.length||pages.at(-1).total===null||pages.reduce((n,p)=>n+p.count,0)<pages.at(-1).total)learnerCache.delete(key);
  if(pages&&!signal.aborted)projection.hubContract=N.mergeLearnerFinance(projection.hubContract,pages);
 }
 async function invoiceBytes(value,signal){
  const url=new URL(value,P.HUB);
  if(url.protocol!=='https:'||url.username||url.password||url.hash||/^(?:localhost|127\.|0\.|\[::1\])/.test(url.hostname))return null;
  const r=await originalFetch.call(window,url.href,{method:'GET',credentials:url.origin===P.HUB?'same-origin':'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal});
  if(!r.ok||!/application\/pdf|application\/octet-stream/i.test(r.headers.get('content-type')??''))return null;
  const reader=r.body?.getReader();if(!reader)return null;let size=0;const chunks=[];
  try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>8*1024*1024||signal.aborted){await reader.cancel();return null;}chunks.push(part.value);}}catch{try{await reader.cancel();}catch{}return null;}
  const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
  return String.fromCharCode(...bytes.slice(0,5))==='%PDF-'?bytes.buffer:null;
 }
 async function addInvoicePDF(projection,root,client,request,signal,jobId){
  if(!request.readFinance||!projection?.hubContract||signal.aborted)return;
  const started=Date.now();let tried=0;
  for(const row of projection.hubContract.payments.rows){
   if(signal.aborted||Date.now()-started>5000||tried>=4)break;
   const key=N.eInvoiceKey(row.eInvoiceKey??row.invoiceRef);
   if(!key||row.complete!==true||row.amount<=0||row.invoice?.date&&row.invoice?.amount!==null)continue;
   tried++;const ctrl=new AbortController(),stop=()=>ctrl.abort(),timer=setTimeout(stop,4000);signal.addEventListener('abort',stop,{once:true});
   try{
    let bytes=null;
    try{bytes=await invoiceBytes(N.eInvoicePDFURL(key),ctrl.signal);}catch{}
    if(!bytes&&client?.invoice&&root?.CenterId&&!ctrl.signal.aborted){
     const result=await bounded(client.invoice({key,centerId:root.CenterId,...(row.eInvoiceVersion?{version:row.eInvoiceVersion}:{})}),1300);
     if(result&&!result.Error&&typeof result.PdfUrl==='string')bytes=await invoiceBytes(result.PdfUrl,ctrl.signal);
    }
    if(!bytes||ctrl.signal.aborted)continue;
    const ticket=crypto.randomUUID();
    const parsed=new Promise(resolve=>{pdfPending.set(ticket,{jobId,key,resolve});});
    publish({type:'invoice-pdf',id:jobId,ct:request.ct,ticket,key,bytes});
    const invoice=await bounded(parsed,2300);pdfPending.delete(ticket);
    if(signal.aborted||ctrl.signal.aborted||!N.validateInvoice(invoice))continue;
    const merged=N.mergePaymentInvoice(row,{invoice});if(invoice.amount!==null&&Math.abs(invoice.amount-row.amount)>1)merged.invoice.conflicts=[...new Set([...merged.invoice.conflicts,'amount'])];
    Object.assign(row,merged);
   }catch{}finally{clearTimeout(timer);signal.removeEventListener('abort',stop);}
  }
 }
 async function addDisplayedFinance(projection,request,signal){
  if(signal.aborted||!request.readFinance||!projection?.hubContract||typeof DOMParser!=='function')return;
  if(projection.hubContract.payments?.rows?.every(p=>p.invoiceRef)&&projection.hubContract.payments.rows.length&&projection.hubContract.movements?.state==='read')return;
  const controller=new AbortController(),stop=()=>controller.abort(),timer=setTimeout(stop,3000);signal.addEventListener('abort',stop,{once:true});
  try{const html=await fetchBody(request.url,controller.signal),doc=new DOMParser().parseFromString(html,'text/html');
   const titles=[...doc.querySelectorAll('title,h1,h2,h3,.page-title,.content-header')].map(n=>n.textContent??'').join(' ');
   if(!titles.includes(request.ct))return;
   const merged=N.mergeUpgradeLinks(N.mergeDisplayedHubContract(projection.hubContract,N.hubDisplayedTablesFromDocument(doc,{staticDocument:true}),request.ct),N.upgradeLinksFromDocument(doc,{staticDocument:true}));if(merged)projection.hubContract=merged;
  }catch{}finally{clearTimeout(timer);signal.removeEventListener('abort',stop);}
 }
 async function addUpgradeFinance(projection,client,signal,request,jobId){
  if(!projection?.hubContract?.upgrades?.some(l=>l.direction==='from')||signal.aborted)return;
  projection.hubContract=await N.readUpgradeFinance(projection.hubContract,async(link,remaining)=>{
   const ctrl=new AbortController(),stop=()=>ctrl.abort(),timer=setTimeout(stop,Math.min(3000,remaining));signal.addEventListener('abort',stop,{once:true});
   try{
    let api=new URL(projection.source);api.searchParams.set('contractId',link.id);api=N.courseDetailEndpoint(api.href,link.url);if(!api)return null;
    const payment=client?.payments?bounded(client.payments({contractId:link.id}),1500):Promise.resolve(null);
    const value=await bounded(client?.read?client.read(link.id):fetchJSON(api,ctrl.signal),Math.min(1800,remaining)),root=N.contractRoot(value);
    if(!root||ctrl.signal.aborted)return null;
    const payments=N.projectContractPayments(await payment,link.id),facts=N.projectHubContract(root,{payments,paymentState:payments?'read':'pending'});
    if(!facts||facts.contractId!==link.id||link.ct&&facts.ct!==link.ct)return null;
    const expected={...request,ct:facts.ct,url:link.url,readFinance:true},source={hubContract:facts};
    await addDisplayedFinance(source,expected,ctrl.signal);
    await addUpgradeDate(source,client,ctrl.signal);
    await addInvoicePDF(source,root,client,{...request,readFinance:true},ctrl.signal,jobId);
    return source.hubContract;
   }finally{clearTimeout(timer);signal.removeEventListener('abort',stop);}
  },{signal,budgetMs:7000,maxDocuments:6,refresh:request.refreshFinance===true});
 }
 const indexEndpoint=(value,method)=>{try{const u=new URL(value,location.href);return String(method||'GET').toUpperCase()==='GET'&&u.origin===P.HUB&&!u.username&&!u.password&&!u.hash&&/\/GetAllContracts\/?$/i.test(u.pathname);}catch{return false;}};
 function accept(value,url,method){
  const e=endpoint(url,method);
  if(e){remember(e);
   if(managed&&e.detail===location.origin+location.pathname.replace(/\/$/,'')){
    const projection=N.projectContractDetail(value,url,e.detail);if(projection){buffer={type:'course',projection,route:new URL(route).pathname};if(active)publish({id:active.id,...buffer});}
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
   const e=endpoint(url,method);if(e)remember(e);
   if(managed&&(e||indexEndpoint(url,method)))void result.then(r=>readResponse(r.clone(),new URL(url,location.href).href,method)).catch(()=>{});
  }catch{}return result;
 }:null;
 if(wrappedFetch)window.fetch=wrappedFetch;
 const wrappedOpen=originalOpen?function(method,url,...rest){
  const result=originalOpen.call(this,method,url,...rest);
  const e=endpoint(url,method);if(e)remember(e);
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
  if(m.type==='invoice-pdf-result'){
   const pending=pdfPending.get(m.ticket);if(pending&&pending.jobId===m.id&&pending.key===m.key&&active?.id===m.id){pdfPending.delete(m.ticket);pending.resolve(N.validateInvoice(m.invoice)?m.invoice:null);}return;
  }
  if(m.type==='stop'&&active?.id===m.id){controller?.abort();active=null;return;}
  if(m.type==='learn-route'){
   const request=globalThis.PromotionHubCourse?.courseRequest(m.course);
   const observed=request&&N.courseDetailEndpoint(m.source,request.url);if(observed)route=observed;
   return;
  }
  if(m.type!=='read-course')return;
  const request=globalThis.PromotionHubCourse?.courseRequest(m.course);if(!request)return;
  controller?.abort();controller=new AbortController();const signal=controller.signal;active={id:m.id};
  const client=angularReader(request);
  if(client){
   // Call Hub's existing GET service so its own role/authentication headers are
   // used. Never assign a controller field or run an Angular digest/model save.
   const capture={detail:request.url.replace(/\/$/,''),role:client.role,url:null};serviceCapture=capture;publish({type:'course-fetch',id:m.id});
   void (async()=>{let pending,paymentPending;try{
    const requestURL=new URL(request.url),contractId=requestURL.searchParams.get('depositId')??requestURL.searchParams.get('id')??requestURL.pathname.replace(/\/$/,'').split('/').pop();
    if(client.payments)try{paymentPending=client.payments(client.deposit?{depositId:contractId}:{contractId});}catch{}
    const paymentRead=paymentPending?bounded(paymentPending,2000):Promise.resolve(null);
    pending=client.read(contractId);
    signal.addEventListener('abort',()=>{for(const p of [pending,paymentPending])try{p?.abort?.();}catch{}},{once:true});
    const value=await pending;
    // This service/GET path is defined by the supplied Hub source. The role
    // comes exclusively from its live session, including an existing frame.
    const source=capture.url||N.courseDetailEndpoint(P.HUB+(client.deposit?'/api/Deposit/GetDepositDetail?depositId=':'/api/Contract/GetContractDetail?contractId=')+contractId+'&userRoleId='+client.role,request.url);
    const projection=source&&N.projectContractDetail(value,source,request.url),root=N.contractRoot(value);
    if(projection&&root){const rawPayments=await paymentRead,payments=N.projectContractPayments(rawPayments,contractId),facts=N.projectHubContract({...root,...(Array.isArray(rawPayments)?{ListPayment:rawPayments}:{})},{payments,paymentState:payments?'read':'unavailable'});if(facts)projection.hubContract=facts;}
    await addDisplayedFinance(projection,request,signal);
    await addUpgradeDate(projection,client,signal);
    await addLearnerFinance(projection,root,client,signal,request);
    await addUpgradeFinance(projection,client,signal,request,m.id);
    await addInvoicePDF(projection,root,client,request,signal,m.id);
    if(projection&&!request.readFinance&&request.readPolicy!==false&&client.policy.prices&&client.policy.groups&&!signal.aborted){
     const rules=await N.readHubPolicy(root,client.policy,{signal,budgetMs:5000});
     if(rules.policy)projection.hubPolicy=rules.policy;else projection.hubPolicyError=rules.policyError;
    }
    if(active?.id===m.id&&!signal.aborted)publish(projection?{type:'course',id:m.id,projection}:{type:'route-missing',id:m.id});
   }catch{if(active?.id===m.id&&!signal.aborted)publish({type:'route-missing',id:m.id});}finally{if(serviceCapture===capture)serviceCapture=null;}})();
   return;
  }
  let url=null;if(route){const target=new URL(route);target.searchParams.set('contractId',request.url.replace(/\/$/,'').split('/').pop());url=N.courseDetailEndpoint(target.href,request.url);}
  if(!url){publish({type:'route-missing',id:m.id});return;}
  publish({type:'course-fetch',id:m.id});
  void (async()=>{
   try{
    const paymentURL=new URL(url);let paymentRead=Promise.resolve(null);
    if(paymentURL.pathname.toLowerCase()==='/api/contract/getcontractdetail'){paymentURL.pathname='/api/Contract/GetContractPayment';paymentURL.searchParams.delete('userRoleId');paymentRead=bounded(fetchJSON(paymentURL.href,signal),2000);}
    const value=await fetchJSON(url,signal),projection=N.projectContractDetail(value,url,request.url),root=N.contractRoot(value);
    if(projection&&root){const payments=N.projectContractPayments(await paymentRead,projection.contractId),facts=N.projectHubContract(root,{payments,paymentState:payments?'read':'unavailable'});if(facts)projection.hubContract=facts;}
    await addDisplayedFinance(projection,request,signal);
    await addUpgradeFinance(projection,null,signal,request,m.id);
    if(active?.id===m.id&&!signal.aborted)publish(projection?{type:'course',id:m.id,projection}:{type:'route-missing',id:m.id});
   }catch{if(active?.id===m.id&&!signal.aborted)publish({type:'route-missing',id:m.id});}
  })();
 });
})();
