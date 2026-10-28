// Isolated broker hosted by an already open Hub tab. Its URL/focus are untouched.
(() => {
 const P=globalThis.PromotionHub,I=globalThis.PromotionHubIndex,C=globalThis.PromotionHubCourse,N=globalThis.PromotionHubCourseNetwork;
 if(!P||!I||!C||!N||location.origin!==P.HUB||window.top!==window)return;
 const channel='promotion-hub/existing-tab/v1',agentKey=crypto.randomUUID();let job=null;
 const visible=e=>!e.hidden&&e.getAttribute?.('aria-hidden')!=='true'&&(!e.getClientRects||e.getClientRects().length>0);
 const post=(j,type,extra={})=>window.postMessage({channel,type,id:j.id,...extra},P.HUB);
 function stop(j){
  if(job!==j)return;job=null;clearInterval(j.timer);clearTimeout(j.routeTimer);clearTimeout(j.settleTimer);j.observer?.disconnect();j.abort?.abort();post(j,'stop');j.frame?.remove();
 }
 function finish(j,result){if(job!==j)return;stop(j);void chrome.runtime.sendMessage({...result,type:'agent-complete',id:j.id,agentKey}).catch(()=>{});}
 const failure=(j,code,message)=>finish(j,{error:true,code,message});
 function discover(root,url){
  const fields=[];
  for(const form of root.querySelectorAll('form')){
   const action=new URL(form.getAttribute('action')||url,url);if((form.getAttribute('method')||'get').toLowerCase()!=='get'||action.origin!==P.HUB||action.pathname.toLowerCase()!=='/deposit/manage')continue;
   const inputs=[...form.querySelectorAll('input')].filter(e=>['text','search','date','hidden'].includes(e.type)&&!/token|session|pass|auth|secret|credential/i.test(e.name)&&(e.type!=='hidden'||/^(?:startDate|endDate)$/i.test(e.name)));
   const keys=inputs.filter(e=>/deposit\s*no\.?/i.test(e.getAttribute('placeholder')||'')),start=inputs.find(e=>/^startDate$/i.test(e.name)),end=inputs.find(e=>/^endDate$/i.test(e.name));if(keys.length!==1)continue;
   if(start&&end){const f=P.depositFields({keyword:keys[0].name,start:start.name,end:end.name});if(f)fields.push(f);continue;}
   for(const e of inputs){if(e===keys[0])continue;const m=/^\s*\d{2}([-\/])\d{2}\1\d{4}( to | - )\d{2}\1\d{2}\1\d{4}\s*$/.exec(e.value??'');if(m){const f=P.depositFields({keyword:keys[0].name,dateRange:e.name,separator:m[1],join:m[2]});if(f)fields.push(f);}}
  }
  return fields.length===1?fields[0]:null;
 }
 // Fetch the saved detail/list URL as inert HTML first. Static read-only Course
 // info needs no full app/JS boot. Dynamic pages retain the managed iframe path.
 function readPage(j){
  if(job!==j||j.readingHTML||j.frame)return;
  if(typeof fetch!=='function'||typeof DOMParser!=='function'){frame(j);return;}
  j.readingHTML=true;j.abort=new AbortController();
  const url=j.course?.url||I.indexURL(j.codes,j.id,j.fields);
  void fetch(url,{credentials:'same-origin',cache:'no-store',signal:j.abort.signal}).then(async response=>{
   if(job!==j)return;
   if(!response.ok||response.url&&response.url!==url||Number(response.headers.get('content-length'))>2*1024*1024){frame(j);return;}
   const html=await response.text();if(job!==j)return;if(html.length>2*1024*1024){frame(j);return;}
   const root=new DOMParser().parseFromString(html,'text/html');
   if(root.querySelector('input[type="password"]')){failure(j,'hub_login','Đăng nhập trong tab Hub đang mở rồi bấm lấy tiếp.');return;}
   if(j.course){const parsed=C.parseCoursePage({...C.coursePageFromDocument(root,{staticDocument:true}),url},j.course),result=j.projection?N.parseContractDetailProjection(j.projection,j.course,parsed.payload):parsed;
    if(result.error&&['student','conflict'].includes(result.error)){finish(j,C.courseFailure(result.error));return;}
    if(result.payload&&['courseFee','hoursPerWeek','package','giftcode','discount'].every(k=>result.payload[k]!=null)){finish(j,{payload:result.payload});return;}
   }else{
    const anchors=[...root.querySelectorAll('table tbody a[href]')].map(a=>({text:a.textContent.trim(),href:new URL(a.getAttribute('href'),url).href})),links=[];
    for(const ct of j.codes){const result=I.selectIndexCandidate(anchors,ct);if(result.status==='conflict'){failure(j,'mismatch','Mã CT / DEP khớp nhiều ID; chưa lưu link.');return;}if(result.status==='found')links.push({ct,url:result.url});}
    if(links.length===j.codes.length&&I.indexLinks(links,j.codes)){finish(j,{links});return;}
   }
   frame(j);
  }).catch(()=>{if(job===j)frame(j);});
 }
 function frame(j){
  if(job!==j||j.frame||!document.documentElement)return;
  const element=document.createElement('iframe');element.name='promotion-hub-read:'+j.id;
  element.setAttribute('aria-hidden','true');element.setAttribute('inert','');element.tabIndex=-1;
  element.setAttribute('sandbox','allow-scripts allow-same-origin');
  element.style.cssText='position:fixed;left:-10000px;top:0;width:1280px;height:900px;opacity:0;pointer-events:none;border:0';
  element.src=j.course?.url||I.indexURL(j.codes,j.id,j.fields);j.frame=element;
  element.addEventListener('load',()=>{if(job===j){j.loaded=true;j.loadedAt=Date.now();inspect(j);}});
  document.documentElement.appendChild(element);
 }
 function courseResult(j,root,url){
  const parsed=C.parseCoursePage({...C.coursePageFromDocument(root),url},j.course);
  const network=j.projection&&N.parseContractDetailProjection(j.projection,j.course,parsed.payload);
  if(network?.error&&['student','conflict'].includes(network.error))return network;
  return network?.payload?network:parsed;
 }
 function inspect(j){
  if(job!==j)return;
  const expired=Date.now()>=j.deadline;
  if(!j.frame){if(expired)failure(j,'hub_timeout','Hub chưa trả dữ liệu. Bấm lấy tiếp để đọc CT còn thiếu.');return;}
  let root,url;
  try{root=j.frame.contentDocument;url=j.frame.contentWindow.location.href;}catch{if(j.loaded||expired)failure(j,'hub_frame_unavailable','Hub yêu cầu đăng nhập hoặc không cho phép đọc trong nền. Kiểm tra tab Hub đang mở rồi thử lại; không tạo tab mới.');return;}
  if(!root||url==='about:blank'){if(expired)failure(j,'hub_frame_unavailable','Hub chưa cho phép đọc trong nền. Kiểm tra tab Hub rồi thử lại; không tạo tab mới.');return;}
  if(root!==j.observedRoot&&typeof MutationObserver==='function'){
   j.observer?.disconnect();j.observedRoot=root;
   j.observer=new MutationObserver(()=>{if(!j.inspectQueued){j.inspectQueued=true;Promise.resolve().then(()=>{j.inspectQueued=false;inspect(j);});}});
   j.observer.observe(root.documentElement||root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['value','selected','aria-busy','aria-hidden']});
  }
  if([...root.querySelectorAll('input[type="password"]')].some(visible)||/\/(?:login|signin|sign-in)(?:\/|$)/i.test(new URL(url).pathname)){failure(j,'hub_login','Đăng nhập trong tab Hub đang mở rồi bấm lấy tiếp. Tiến độ đã lưu được giữ.');return;}
  if(j.course){
   if(url!==j.course.url){failure(j,'course_unavailable','Hub chuyển khỏi CT cần đọc; chưa lưu dữ liệu.');return;}
   if(j.activatedRoot!==root){j.activatedRoot=root;j.frame.contentWindow.postMessage({channel,type:'activate',id:j.id,course:j.course},P.HUB);}
   const result=courseResult(j,root,url),signature=JSON.stringify(result);
   if(signature!==j.signature){j.signature=signature;j.stableAt=Date.now();clearTimeout(j.settleTimer);j.settleTimer=setTimeout(()=>inspect(j),350);}
   const complete=result.payload&&['courseFee','hoursPerWeek','package','giftcode','discount'].every(k=>result.payload[k]!=null);
   if(result.payload&&(complete||Date.now()-j.stableAt>=350)||expired){finish(j,result.payload?{payload:result.payload}:C.courseFailure(result.error,result.fields));return;}
  }else{
   if(j.codes[0].includes('-DEP-')&&!j.fields){const fields=discover(root,url);if(fields&&!I.indexURLMatches(url,j.codes,j.id,fields)){j.fields=fields;j.loaded=false;j.frame.src=I.indexURL(j.codes,j.id,fields);return;}}
   if(!I.indexURLMatches(url,j.codes,j.id,j.fields)){failure(j,'index_navigation','Hub không giữ đúng tháng / loại hồ sơ cần đọc; chưa lưu link.');return;}
   if(j.activatedRoot!==root){j.activatedRoot=root;j.frame.contentWindow.postMessage({channel,type:'activate',id:j.id,codes:j.codes,fields:j.fields},P.HUB);}
   const rx=j.codes[0].includes('-DEP-')?/Deposit\s*(?:no\.?|code)/i:/Contract\s*(?:no\.?|code)/i;
   const tables=[...root.querySelectorAll('table')].filter(t=>visible(t)&&rx.test(t.querySelector('thead')?.textContent||[...t.querySelectorAll('th')].map(e=>e.textContent).join(' ')));
   const anchors=tables.flatMap(t=>[...t.querySelectorAll('tbody a[href]')].slice(0,I.INDEX_LIMIT*3).map(a=>({text:a.textContent.trim(),href:a.href}))),pairs=new Map((j.network?.pairs??[]).map(p=>[p.ct,p])),links=[];
   for(const ct of j.codes){
    const match=I.selectIndexCandidate(anchors,ct),pair=pairs.get(ct);
    if(j.network?.conflicts.includes(ct)||match.status==='conflict'||pair&&match.identity&&pair.id!==match.identity.id){failure(j,'mismatch','Mã CT / DEP khớp nhiều ID trên Hub; chưa lưu link.');return;}
    const url=pair?I.contractPairURL(pair):match.status==='found'?match.url:null;if(url)links.push({ct,url});
   }
   if(!I.indexLinks(links,j.codes)){failure(j,'index_invalid','Dữ liệu mã / link không hợp lệ; chưa lưu.');return;}
   if(tables.length&&!j.firstTable)j.firstTable=Date.now();
   if(j.network||links.length===j.codes.length||j.firstTable&&Date.now()-j.firstTable>=1500){finish(j,{links});return;}
   if(expired){failure(j,'hub_frame_unavailable','Chưa đọc được danh sách Hub trong nền. Kiểm tra tab Hub đang mở rồi thử lại; không tạo tab mới.');return;}
  }
  if(expired)failure(j,'hub_timeout','Hub chưa trả dữ liệu; bấm lấy tiếp để đọc phần còn thiếu.');
 }
 window.addEventListener('message',event=>{
  const j=job,m=event.data;if(!j||event.origin!==P.HUB||m?.channel!==channel||m.id!==j.id)return;
  const child=j.frame&&event.source===j.frame.contentWindow;if(event.source!==window&&!child)return;
  if(m.type==='route-missing'&&!child&&j.course){clearTimeout(j.routeTimer);readPage(j);return;}
  if(m.type==='course'&&j.course){
   if(!m.projection||!N.courseDetailEndpoint(m.projection.source,j.course.url))return;
   const result=N.parseContractDetailProjection(m.projection,j.course);
   if(result.error&&['student','conflict'].includes(result.error)){finish(j,C.courseFailure(result.error));return;}
   if(m.projection.ct&&m.projection.ct!==j.course.ct||m.projection.contractId&&m.projection.contractId!==j.course.url.replace(/\/$/,'').split('/').pop()){finish(j,C.courseFailure('identity'));return;}
   j.projection=m.projection;
   if(child&&typeof m.route==='string'&&m.route===new URL(m.projection.source).pathname)post(j,'learn-route',{course:j.course,route:m.route});
   if(result.payload&&['courseFee','hoursPerWeek','package','giftcode','discount'].every(k=>result.payload[k]!=null)){finish(j,{payload:result.payload});return;}
   clearTimeout(j.routeTimer);readPage(j);inspect(j);
  }
  if(m.type==='index'&&child&&!j.course&&Array.isArray(m.pairs)&&m.pairs.length<=I.INDEX_LIMIT&&Array.isArray(m.conflicts)&&m.conflicts.length<=I.INDEX_LIMIT){
   const p=I.projectContractPairs(m.pairs.map(v=>({ContractNo:v.ct,ContractId:v.id})));if(!p||m.pairs.some(v=>!I.contractPairURL(v))||m.conflicts.some(v=>!P.code(v)))return;
   j.network={pairs:p.pairs.filter(v=>j.codes.includes(v.ct)),conflicts:[...new Set([...p.conflicts,...m.conflicts])].filter(v=>j.codes.includes(v))};inspect(j);
  }
 });
 chrome.runtime.onMessage.addListener((m,sender,respond)=>{
  if(sender.id!==chrome.runtime.id)return;
  if(m.type==='hub-agent-ping'){respond({ready:true,version:P.VERSION,agentKey});return;}
  if(m.agentKey!==agentKey)return;
  if(m.type==='hub-agent-stop'){if(job?.id===m.id)stop(job);respond({});return;}
  if(m.type!=='hub-agent-run'||job||typeof m.id!=='string'||!/^\w[\w-]{0,79}$/.test(m.id)){respond({error:'Tab Hub đang bận hoặc yêu cầu không hợp lệ.'});return;}
  const course=m.kind==='course'&&C.courseRequest(m.course);let codes;
  try{if(!course){const groups=I.indexGroups(m.codes);if(groups.length!==1)throw Error();codes=groups[0].codes;}}catch{respond({error:'Danh sách CT / DEP không hợp lệ.'});return;}
  job={id:m.id,course:course||null,codes,deadline:Date.now()+30_000};const j=job;
  j.timer=setInterval(()=>inspect(j),1000);respond({accepted:true});
  if(course){post(j,'read-course',{course});j.routeTimer=setTimeout(()=>readPage(j),150);}else readPage(j);
 });
 window.addEventListener('pagehide',()=>{if(job)stop(job);});
})();
