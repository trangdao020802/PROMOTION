// Isolated document_start: bind the observed response to the dedicated CT job.
(() => {
 const N=globalThis.PromotionHubCourseNetwork,C=globalThis.PromotionHubCourse,origin='https://hub24.apollo.vn:7777';
 if(!N||location.origin!==origin||!/^\/contract\/detail\/[1-9]\d{0,14}\/?$/i.test(location.pathname)||window.top!==window)return;
 let job,stopped=false;const channel=N.COURSE_NETWORK_CHANNEL;
 const wire={projection:null,error:null,done:false};globalThis.PromotionHubCourseWire=wire;
 const activate=()=>{if(job&&!stopped)window.postMessage({channel,type:'activate',id:job.id,url:job.course.url},origin);};
 window.addEventListener('message',event=>{
  const m=event.data;if(event.source!==window||event.origin!==origin||m?.channel!==channel)return;
  if(stopped){if(m.type==='ready')window.postMessage({channel,type:'release',id:null},origin);return;}
  if(m.type==='ready'){activate();return;}
  if(!job||m.id!==job.id||m.type!=='snapshot')return;
  const result=N.parseContractDetailProjection(m.projection,job.course);wire.projection=m.projection;wire.error=result.error??null;
  if(result.payload&&C.courseReadComplete(result.payload)){
   stopped=true;wire.done=true;window.postMessage({channel,type:'release',id:job.id},origin);
   void chrome.runtime.sendMessage({id:job.id,type:'course-complete',payload:result.payload});
  }
 });
 void chrome.runtime.sendMessage({type:'context'}).then(context=>{if(context?.kind!=='course'||!C.courseRequest(context.course)||context.course.url!==location.href){stopped=true;window.postMessage({channel,type:'release',id:null},origin);return;}job=context;activate();}).catch(()=>{stopped=true;window.postMessage({channel,type:'release',id:null},origin);});
})();
