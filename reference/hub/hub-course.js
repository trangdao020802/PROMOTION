(() => {
 const P=globalThis.PromotionHub,C=globalThis.PromotionHubCourse,N=globalThis.PromotionHubCourseNetwork;
 if(location.origin!==P.HUB||window.top!==window)return;
 void chrome.runtime.sendMessage({type:'context'}).then(job=>{
  if(job?.kind!=='course'||!C.courseRequest(job.course))return;
  let done=false,login=false,lastChange=Date.now(),signature='';const deadline=Date.now()+90_000;
  const visible=e=>!e.hidden&&e.getAttribute('aria-hidden')!=='true'&&(!e.getClientRects||e.getClientRects().length>0);
  const send=message=>chrome.runtime.sendMessage({id:job.id,...message});
  const finish=message=>{if(done)return;done=true;clearInterval(timer);observer.disconnect();void send(message);};
  const inspect=()=>{
   if(done)return;
   if(globalThis.PromotionHubCourseWire?.done){done=true;clearInterval(timer);observer.disconnect();return;}
   if([...document.querySelectorAll('input[type="password"]')].some(visible)||/\/(?:login|signin)(?:\/|$)/i.test(location.pathname)){if(!login){login=true;void send({type:'login'});}return;}
   if(location.href!==job.course.url){if(/^\/(?:home|dashboard)?(?:\/index)?\/?$/i.test(location.pathname))finish({type:'resume'});else finish({type:'course-failure',reason:'navigation'});return;}
   const page=C.coursePageFromDocument(document),dom=C.parseCoursePage({url:location.href,...page},job.course),projection=globalThis.PromotionHubCourseWire?.projection;
   const result=projection&&N?N.parseContractDetailProjection(projection,job.course,dom.payload):dom,nextSignature=JSON.stringify(result);
   if(nextSignature!==signature){signature=nextSignature;lastChange=Date.now();}
   const loading=[...document.querySelectorAll('[aria-busy="true"],#nprogress')].some(visible);
   if(result.payload&&!loading&&Date.now()-lastChange>=600&&(['courseFee','hoursPerWeek','package','giftcode','discount'].every(k=>result.payload[k]!=null)||Date.now()>=deadline)){finish({type:'course-complete',payload:result.payload});return;}
   if(Date.now()>=deadline)finish({type:'course-failure',reason:loading||result.payload?'loading':result.error,fields:result.fields??[]});
  };
  const timer=setInterval(inspect,750),observer=new MutationObserver(inspect);observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['value','aria-busy','aria-hidden']});inspect();
 }).catch(()=>{});
})();
