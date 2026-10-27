(() => {
 const P=globalThis.PromotionHub,V=globalThis.PromotionHubVoucher;
 if(location.origin!==P.HUB||window.top!==window)return;
 void chrome.runtime.sendMessage({type:'context'}).then(job=>{
  if(job?.kind!=='voucher'||!V.voucherRequest(job.voucher))return;
  let done=false,inspecting=false,searched=false,filtering=false,lastChange=Date.now(),login=false;
  const deadline=Date.now()+90_000,code=job.voucher.code;
  const visible=e=>!e.hidden&&e.getAttribute('aria-hidden')!=='true'&&(!e.getClientRects||e.getClientRects().length>0);
  const text=e=>String(e?.textContent??'').trim().replace(/\s+/g,' ');
  const send=message=>chrome.runtime.sendMessage({id:job.id,...message});
  const finish=async message=>{if(done)return;done=true;clearInterval(timer);observer.disconnect();const result=await send(message);if(result?.error)await send({type:'voucher-failure',reason:'unsupported'});};
  const setInput=(input,value)=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;if(!setter)throw Error('input');setter.call(input,value);for(const type of ['input','change','keyup'])input.dispatchEvent(new Event(type,{bubbles:true}));};
  const busy=()=>[...document.querySelectorAll('[aria-busy="true"],.dataTables_processing,#nprogress')].some(visible);
  const keyword=()=>{
   const all=[...document.querySelectorAll('input')].filter(e=>visible(e)&&['text','search'].includes(e.type)&&!e.closest('.dataTables_filter')&&!/token|session|pass|auth|secret|credential/i.test(e.name));
   const named=all.filter(e=>[e.name,e.id,e.placeholder].some(value=>/^s$|search|keyword|giftcode|voucher/i.test(value||'')));
   return named.length===1?named[0]:all.length===1?all[0]:null;
  };
  const headers=table=>[...table.querySelectorAll('thead th')].map(text);
  const cellText=(cells,head,pattern)=>text(cells[head.findIndex(h=>pattern.test(h))]);
  const codeHeader=/^(?:gift\s*code|code)(?:\s*(?:no\.?|number))?$/i;
  const centerPages=new Map();
  // Center code is the actual permitted-center list, separate from the Region
  // selector. Read every observed UI page before following List gift code.
  const centerPairs=()=>{
   const tables=[...document.querySelectorAll('table')].filter(t=>headers(t).some(h=>/^center code$/i.test(h))&&!headers(t).some(h=>codeHeader.test(h))),pairs=[];
   for(const [index,table]of tables.entries()){
    const head=headers(table),rows=[...table.querySelectorAll('tbody tr')],codes=rows.map(row=>cellText([...row.querySelectorAll('td')],head,/^center code$/i)).filter(v=>/^[A-Z0-9][A-Z0-9._-]{1,79}$/i.test(v)).map(V.giftcodeKey);
    const wrapper=table.closest('.dataTables_wrapper'),info=text(wrapper?.querySelector('.dataTables_info')),signature=codes.join('|')+'|'+info;
    let state=centerPages.get(index);if(!state){state={codes:new Set(),waiting:''};centerPages.set(index,state);}
    if(state.waiting&&state.waiting===signature)return {pending:true};state.waiting='';
    const filter=wrapper?.querySelector('.dataTables_filter input');if(filter?.value?.trim())return {error:'centers'};
    for(const c of codes)state.codes.add(c);
    const next=wrapper?.querySelector('.dataTables_paginate .next,.pagination .next,[aria-label="Next"]');
    const disabled=e=>e?.disabled||e?.getAttribute('aria-disabled')==='true'||e?.classList?.contains('disabled')||e?.parentElement?.classList?.contains('disabled');
    if(next&&!disabled(next)){state.waiting=signature;(next.querySelector?.('a,button')||next).click();lastChange=Date.now();return {pending:true};}
    const total=info.match(/\bof\s+([\d,]+)\s+entr(?:y|ies)\b/i);
    if(total&&state.codes.size<Number(total[1].replaceAll(',','')))return {error:'centers'};
    const value=[...state.codes].join(', ');if(value.length>2000)return {error:'centers'};
    if(value)pairs.push({label:'Center code',value,unit:''});
   }
   return {pairs};
  };
  const listRows=()=>[...document.querySelectorAll('table')].filter(t=>headers(t).some(h=>/^voucher name$/i.test(h))).flatMap(table=>{
   const head=headers(table);return [...table.querySelectorAll('tbody tr')].map(row=>{const cells=[...row.querySelectorAll('td')],col=head.findIndex(h=>/^voucher name$/i.test(h)),links=cells[col]?[...cells[col].querySelectorAll('a[href]')].filter(a=>V.voucherDetailURL(a.href)):[];
    return links.length===1?{url:links[0].href,label:text(links[0]),center:cellText(cells,head,/^center$/i),startDate:cellText(cells,head,/^start date$/i),endDate:cellText(cells,head,/^end date$/i),status:cellText(cells,head,/^status$/i),creator:cellText(cells,head,/^created by$/i),conditions:cellText(cells,head,/^conditions$/i)}:null;
   }).filter(Boolean);
  });
  const pairs=()=>[...document.querySelectorAll('label,dt')].filter(e=>visible(e)&&V.voucherLabel(text(e))).map(label=>{
   const id=label.getAttribute('for'),group=label.closest('.form-group')||label.parentElement;
   let control=id?document.getElementById(id):null;
   if(!control&&group){const controls=[...group.querySelectorAll('input:not([type="hidden"]):not([type="password"]),select,textarea')];if(controls.length===1)control=controls[0];}
   if(control&&/token|session|pass|auth|secret|credential/i.test(control.name))return null;
   let value=control?control.tagName==='SELECT'?[...control.selectedOptions].map(text).join(', '):control.type==='checkbox'?control.checked?'Active':'Inactive':control.value:text(label.nextElementSibling);
   let unit='';
   if(V.voucherLabel(text(label))==='discount'&&control){
    // Hub can wrap the input before the suffix. Stay within its input group or
    // ancestors with one value control so Minimum/Maximum units cannot leak in.
    let root=control.closest('.input-group')||control.parentElement;
    for(let depth=0;root&&depth<4;depth++,root=root.parentElement){
     const controls=[...root.querySelectorAll('input:not([type="hidden"]),select,textarea')];if(controls.length>1)break;
     const suffixes=[...root.querySelectorAll('.input-group-addon,.input-group-text,.input-group-append,.input-group-prepend')].filter(visible).map(text).filter(v=>V.hubDiscountType(v));
     if(suffixes.length){unit=[...new Set(suffixes)].join(' ');break;}
     const sibling=text(control.nextElementSibling);if(V.hubDiscountType(sibling)){unit=sibling;break;}
     if(root===group)break;
    }
   }
   return {label:text(label),value,unit};
  }).filter(Boolean);
  const giftcodeRows=()=>[...document.querySelectorAll('table')].flatMap(table=>{
   const head=headers(table),index=head.findIndex(h=>codeHeader.test(h));if(index<0)return [];
   return [...table.querySelectorAll('tbody tr')].map(row=>{const cells=[...row.querySelectorAll('td')],cell=cells[index],exact=cell&&[...cell.querySelectorAll('a,span,code,input:not([type="hidden"])')].some(e=>V.giftcodeKey(e.value??text(e))===code);return {code:exact?code:text(cell),studentId:cellText(cells,head,/^student (?:id|code)$/i),studentName:cellText(cells,head,/^student name$/i),centerCode:cellText(cells,head,/^center code$/i),status:cellText(cells,head,/^status$/i)};});
  });
  const inspect=async()=>{
   if(done||inspecting)return;inspecting=true;
   try{
    if([...document.querySelectorAll('input[type="password"]')].some(visible)){if(!login){login=true;await send({type:'login'});}return;}
    const path=location.pathname.toLowerCase();
    if(/^\/(?:home|dashboard)?(?:\/index)?\/?$/i.test(path)){await finish({type:'resume'});return;}
    if(job.stage==='voucher-search'){
     if(path!=='/giftcode/manage'){await finish({type:'voucher-failure',reason:'unsupported'});return;}
     const input=keyword();
     if(!input){if(Date.now()>deadline)await finish({type:'voucher-failure',reason:'unsupported'});return;}
     if(!job.searchApplied&&!searched){
      const root=document,buttons=[...root.querySelectorAll('button,input[type="submit"],input[type="button"],a')].filter(e=>visible(e)&&/^(?:search|tìm kiếm)$/i.test(text(e)||e.value||''));
      if(buttons.length!==1){if(Date.now()>deadline)await finish({type:'voucher-failure',reason:'unsupported'});return;}
      const result=await send({type:'voucher-search-applied',code});if(!result?.apply)return;
      searched=true;setInput(input,code);
      // Apply-date filters are observed on this listing. Widen only those
      // recognized search controls; never inspect or submit record edit forms.
      for(const e of root.querySelectorAll('input')){if(e===input||!visible(e)||!['text','date'].includes(e.type))continue;const m=e.value.match(/^\d{2}([-\/])\d{2}\1\d{4}( to | - )\d{2}\1\d{2}\1\d{4}$/);if(m)setInput(e,'01'+m[1]+'01'+m[1]+'2000'+m[2]+'31'+m[1]+'12'+m[1]+'2099');}
      buttons[0].click();lastChange=Date.now();return;
     }
     if(V.giftcodeKey(input.value)!==code){if(Date.now()>deadline)await finish({type:'voucher-failure',reason:'filters'});return;}
     if(!busy()&&Date.now()-lastChange>600){const rows=listRows(),choice=V.voucherListChoice(rows);if(choice){await finish({type:'voucher-detail',row:choice.record});return;}if(rows.length>1){await finish({type:'voucher-failure',reason:'ambiguous'});return;}}
    }else if(job.stage==='voucher-detail'||job.stage==='voucher-codes'){
     const inCodes=job.stage==='voucher-codes';
     if(inCodes?V.voucherCodesURL(location.href,job.url)!==job.codesUrl:V.voucherDetailURL(location.href)!==job.url){await finish({type:'voucher-failure',reason:'unsupported'});return;}
     if(busy()||Date.now()-lastChange<600){if(Date.now()>deadline)await finish({type:'voucher-failure',reason:'timeout'});return;}
     const centers=centerPairs();if(centers.error){await finish({type:'voucher-failure',reason:centers.error});return;}if(centers.pending){if(Date.now()>deadline)await finish({type:'voucher-failure',reason:'centers'});return;}
     const page={url:job.url,pairs:[...(inCodes?job.detailPairs:pairs()),...centers.pairs],giftcodes:giftcodeRows(),list:job.list},result=V.parseVoucherDetail(page,job.voucher);
     if(result.payload&&!busy()){await finish({type:'voucher-complete',payload:result.payload});return;}
     if(['conflict','amount','unit'].includes(result.error)){await finish({type:'voucher-failure',reason:result.error==='unit'?'unit':'conflict'});return;}
     if(!filtering&&result.error==='code_unconfirmed'){
      if(!inCodes){const links=[...document.querySelectorAll('a[href]')].filter(a=>visible(a)&&/^list gift\s*code$/i.test(text(a))&&V.voucherCodesURL(a.href,job.url));if(links.length===1){await finish({type:'voucher-codes',url:links[0].href,pairs:page.pairs});return;}}
      const toggles=[...document.querySelectorAll('a,button')].filter(e=>visible(e)&&/^list gift\s*code$/i.test(text(e))&&(/^#/.test(e.getAttribute('href')||'')||e.hasAttribute('data-toggle')||e.hasAttribute('aria-expanded')));
      for(const toggle of toggles)if(toggle.getAttribute('aria-expanded')==='false'||toggle.classList.contains('collapsed'))toggle.click();
      const filters=[...document.querySelectorAll('table')].filter(t=>headers(t).some(h=>/^(?:gift\s*code|code)(?:\s*(?:no\.?|number))?$/i.test(h))).flatMap(t=>[...(t.closest('.dataTables_wrapper')?.querySelectorAll('.dataTables_filter input')||[])]).filter(visible);
      if(filters.length===1){filtering=true;setInput(filters[0],code);}
     }
     if(Date.now()>deadline){await finish({type:'voucher-failure',reason:result.error==='code_unconfirmed'?'code_unconfirmed':'timeout'});return;}
    }
    if(Date.now()>deadline)await finish({type:'voucher-failure',reason:'timeout'});
   }catch{await finish({type:'voucher-failure',reason:'unsupported'});}finally{inspecting=false;}
  };
  const timer=setInterval(inspect,750),observer=new MutationObserver(records=>{if(records.some(r=>r.target.closest?.('table')||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('table')||n.querySelector?.('table')))))lastChange=Date.now();void inspect();});observer.observe(document.documentElement,{childList:true,subtree:true});void inspect();
 }).catch(()=>{});
})();
