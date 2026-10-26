// Isolated-world requested-code selector. MAIN world is untrusted page data.
(() => {
 const P=globalThis.PromotionHub,I=globalThis.PromotionHubIndex;
 if(!P||!I||location.origin!==P.HUB||window.top!==window)return;
 const send=m=>chrome.runtime.sendMessage(m);
 void send({type:'context'}).then(job=>{
  if(job?.kind!=='index')return;
  let done=false,working=false,login=false,network=null,observer,timer,firstTable=0,requested=false;
  const deadline=Date.now()+25_000,group=I.indexGroups(job.codes)[0];
  const release=()=>window.postMessage({channel:I.INDEX_CHANNEL,type:'release',id:job.id},P.HUB);
  const finish=message=>{if(done)return;done=true;observer?.disconnect();clearInterval(timer);release();void send({id:job.id,...message}).then(result=>{if(result?.error)void send({id:job.id,type:'index-failure',reason:'invalid_packet'});}).catch(()=>{});};
  const visible=e=>!e.hidden&&e.getAttribute('aria-hidden')!=='true'&&(!e.getClientRects||e.getClientRects().length>0);
  const discover=()=>{
   const fields=[];
   for(const form of document.querySelectorAll('form')){
    const action=new URL(form.getAttribute('action')||location.href,location.href);if((form.getAttribute('method')||'get').toLowerCase()!=='get'||action.origin!==P.HUB||action.pathname.toLowerCase()!=='/deposit/manage')continue;
    const inputs=[...form.querySelectorAll('input')].filter(e=>['text','search','date','hidden'].includes(e.type)&&!/token|session|pass|auth|secret|credential/i.test(e.name)&&(e.type!=='hidden'||/^(?:startDate|endDate)$/i.test(e.name)));
    const keys=inputs.filter(e=>/deposit\s*no\.?/i.test(e.getAttribute('placeholder')||'')),start=inputs.find(e=>/^startDate$/i.test(e.name)),end=inputs.find(e=>/^endDate$/i.test(e.name));
    if(keys.length!==1)continue;
    if(start&&end){const f=P.depositFields({keyword:keys[0].name,start:start.name,end:end.name});if(f)fields.push(f);continue;}
    for(const e of inputs){if(e===keys[0])continue;const m=/^\s*\d{2}([-\/])\d{2}\1\d{4}( to | - )\d{2}\1\d{2}\1\d{4}\s*$/.exec(e.value??'');if(m){const f=P.depositFields({keyword:keys[0].name,dateRange:e.name,separator:m[1],join:m[2]});if(f)fields.push(f);}}
   }
   return fields.length===1?fields[0]:null;
  };
  const inspect=()=>{
   if(done||working)return;working=true;
   try{
    if([...document.querySelectorAll('input[type="password"]')].some(visible)||/\/(?:login|signin|sign-in)(?:\/|$)/i.test(location.pathname)){if(!login){login=true;void send({type:'login',id:job.id});}return;}
    if(/upstream connect error|ERR_CONNECTION|connection (?:refused|reset)/i.test((document.body?.innerText??'').slice(0,400))){finish({type:'index-failure',reason:'connection'});return;}
    if(location.pathname.toLowerCase()!==(group.kind==='contract'?'/contract/list':'/deposit/manage')){
     finish(/^\/(?:home|dashboard)?(?:\/index)?\/?$/i.test(location.pathname)?{type:'resume'}:{type:'index-failure',reason:'unexpected_navigation'});return;
    }
    if(!I.indexURLMatches(location.href,job.codes,job.id,job.fields)){if(Date.now()>=deadline)finish({type:'index-failure',reason:'filters'});return;}
    if(group.kind==='deposit'&&!job.fields){const fields=discover();if(fields&&!I.indexURLMatches(location.href,job.codes,job.id,fields)){finish({type:'index-fields',fields});return;}}
    const rx=group.kind==='deposit'?/Deposit\s*(?:no\.?|code)/i:/Contract\s*(?:no\.?|code)/i;
    const tables=[...document.querySelectorAll('table')].filter(t=>visible(t)&&rx.test(t.querySelector('thead')?.textContent||[...t.querySelectorAll('th')].map(e=>e.textContent).join(' ')));
    const anchors=tables.flatMap(t=>[...t.querySelectorAll('tbody a[href]')].slice(0,I.INDEX_LIMIT*3).map(a=>({text:a.textContent.trim(),href:a.href}))),links=[],wanted=new Set(job.codes),byCode=new Map();
    for(const a of anchors){const codes=[...new Set(a.text.toUpperCase().match(/\b[A-Z0-9]+-(?:CT|DEP)-\d{4,20}\b/g)??[])];if(codes.length===1&&wanted.has(codes[0])){if(!byCode.has(codes[0]))byCode.set(codes[0],[]);byCode.get(codes[0]).push(a);}}
    const pairs=new Map((network?.pairs??[]).map(p=>[p.ct,p])),ids=new Map();
    for(const ct of job.codes){
     const match=I.selectIndexCandidate(byCode.get(ct)??[],ct),pair=pairs.get(ct),url=pair&&I.contractPairURL(pair);
     const reason=network?.conflicts.includes(ct)?'network_conflict':match.status==='conflict'?'multiple_ids':url&&match.identity&&pair.id!==match.identity.id?'pair_mismatch':null;
     if(reason){finish({type:'index-failure',reason,ct,candidates:match.candidates});return;}
     // Unsupported anchors are unresolved. They do not prove two IDs conflict.
     const chosen=url??(match.status==='found'?match.url:null);
     if(chosen){
      const identity=I.indexLinkIdentity(chosen,ct),key=identity.kind+':'+identity.id;
      if(ids.has(key)&&ids.get(key)!==ct){finish({type:'index-failure',reason:'conflicting_codes',ct,candidates:2});return;}
      ids.set(key,ct);links.push({ct,url:chosen});
     }
    }
    if(!I.indexLinks(links,job.codes)){finish({type:'index-failure',reason:'invalid_packet'});return;}
    if(tables.length&&!firstTable)firstTable=Date.now();
    // Absence here is only unresolved, never not_found; no per-code detail probe.
    if(network?.ready||group.kind==='deposit'&&links.length===job.codes.length||firstTable&&Date.now()-firstTable>=1500||Date.now()>=deadline){finish({type:'index-complete',links});return;}
    if(!requested){requested=true;window.postMessage({channel:I.INDEX_CHANNEL,type:'read',id:job.id},P.HUB);}
   }catch{finish({type:'index-failure',reason:'unsupported'});}finally{working=false;}
  };
  window.addEventListener('message',event=>{
   const m=event.data;if(done||event.source!==window||event.origin!==P.HUB||m?.channel!==I.INDEX_CHANNEL||m.type!=='snapshot'||m.id!==job.id||typeof m.ready!=='boolean'||!Array.isArray(m.pairs)||m.pairs.length>I.INDEX_LIMIT||!Array.isArray(m.conflicts)||m.conflicts.length>I.INDEX_LIMIT)return;
   if(m.pairs.some(p=>!I.contractPairURL(p))||m.conflicts.some(c=>!P.code(c)?.includes('-CT-')))return;
   const projection=I.projectContractPairs(m.pairs.map(p=>({ContractNo:p.ct,ContractId:p.id})));if(!projection)return;
   network={ready:m.ready,pairs:projection.pairs,conflicts:[...new Set([...m.conflicts,...projection.conflicts])]};inspect();
  });
  timer=setInterval(inspect,750);observer=new MutationObserver(inspect);observer.observe(document.documentElement,{childList:true,subtree:true});inspect();
 }).catch(()=>{});
})();
