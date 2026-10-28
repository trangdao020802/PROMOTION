(() => {
 const P=globalThis.PromotionHub,C=globalThis.PromotionHubCourse;
 if(location.origin!==P.HUB||window.top!==window)return;
 void chrome.runtime.sendMessage({type:'context'}).then(job=>{
  if(job?.kind!=='course'||!C.courseRequest(job.course))return;
  let done=false,login=false,lastChange=Date.now();const deadline=Date.now()+90_000;
  const visible=e=>!e.hidden&&e.getAttribute('aria-hidden')!=='true'&&(!e.getClientRects||e.getClientRects().length>0);
  const send=message=>chrome.runtime.sendMessage({id:job.id,...message});
  const finish=message=>{if(done)return;done=true;clearInterval(timer);observer.disconnect();void send(message);};
  const inspect=()=>{
   if(done)return;
   if([...document.querySelectorAll('input[type="password"]')].some(visible)||/\/(?:login|signin)(?:\/|$)/i.test(location.pathname)){if(!login){login=true;void send({type:'login'});}return;}
   if(location.href!==job.course.url){if(/^\/(?:home|dashboard)?(?:\/index)?\/?$/i.test(location.pathname))finish({type:'resume'});else finish({type:'course-failure',reason:'identity'});return;}
   const titles=[...document.querySelectorAll('h1,h2,h3,.page-title,.content-header,.breadcrumb')].filter(visible).map(e=>e.textContent);
   const pairs=[];
   for(const label of document.querySelectorAll('label,dt,th,td,[class*="col-"]')){
    if(!visible(label)||!C.courseLabel(label.textContent))continue;
    const id=label.getAttribute('for'),sibling=label.control||(id?document.getElementById(id):null)||label.nextElementSibling;if(!sibling||!visible(sibling))continue;
    // Never inspect arbitrary inputs, authentication controls or whole forms.
    const controls=['INPUT','SELECT','TEXTAREA'].includes(sibling.tagName)?[sibling]:[...sibling.querySelectorAll('input:not([type="hidden"]):not([type="password"]),select,textarea')];
    if(controls.some(e=>/token|session|pass|auth|secret|credential/i.test(e.name??'')))continue;
    const control=controls.length===1?controls[0]:null,value=control?control.tagName==='SELECT'?[...control.selectedOptions].map(e=>e.textContent).join(';'):control.value:sibling.textContent;
    pairs.push({label:label.textContent,value});
   }
   const result=C.parseCoursePage({url:location.href,titles,pairs},job.course);
   const loading=[...document.querySelectorAll('[aria-busy="true"],#nprogress')].some(visible);
   if(result.payload&&!loading&&Date.now()-lastChange>=600&&(['courseFee','hoursPerWeek','package'].every(k=>result.payload[k])||Date.now()>=deadline)){finish({type:'course-complete',payload:result.payload});return;}
   if(Date.now()>=deadline)finish({type:'course-failure',reason:result.error});
  };
  const timer=setInterval(inspect,750),observer=new MutationObserver(()=>{lastChange=Date.now();inspect();});observer.observe(document.documentElement,{childList:true,subtree:true});inspect();
 }).catch(()=>{});
})();
