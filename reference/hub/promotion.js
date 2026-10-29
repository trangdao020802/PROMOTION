(() => {
  const P = globalThis.PromotionHub;
  if (location.origin !== P.SITE || window.top !== window) return;
  const reply = value => window.postMessage({channel: P.CHANNEL, direction: 'response', ...value}, P.SITE);
  window.addEventListener('message', event => {
    const m = event.data;
    if (event.source !== window || event.origin !== P.SITE || !m || m.channel !== P.CHANNEL || m.direction !== 'request' || typeof m.id !== 'string' || !/^[\w-]{1,80}$/.test(m.id)) return;
    if (m.action === 'ping') { reply({id: m.id, type: 'ready', version: P.VERSION,capabilities:['lookup','index','report','course','contract-inputs','course-network','no-new-tabs','voucher','background-voucher','background-reports']}); return; }
    if (!['lookup','index','report','course','voucher','cancel'].includes(m.action) || (m.action === 'lookup' && !P.code(m.ct))) return;
    if(m.action==='voucher'&&!globalThis.PromotionHubVoucher?.voucherRequest(m.voucher))return;
    if(m.action==='course'&&!globalThis.PromotionHubCourse?.courseRequest(m.course))return;
    if(m.action==='index'){try{if(globalThis.PromotionHubIndex.indexGroups(m.codes).length!==1)return;}catch{return;}}
    if(m.action==='report'&&(!globalThis.PromotionHubReports?.reportPeriod(m.report?.month)||!Object.hasOwn(globalThis.PromotionHubReports.HUB_REPORTS,m.report?.report)))return;
    const request=m.action==='voucher'?{type:'voucher-start',id:m.id,voucher:m.voucher}:m.action==='course'?{type:'course-start',id:m.id,course:m.course}:m.action==='index'?{type:'index-start',id:m.id,codes:m.codes}:m.action==='report'?{type:'report-start',id:m.id,report:m.report.report,month:m.report.month}:{type: m.action === 'lookup' ? 'start' : 'cancel', id: m.id, ct: m.ct};
    chrome.runtime.sendMessage(request).then(result => {
      if (result?.error) reply({id: m.id, type: 'error', code: result.code || 'bridge', message: result.error});
    }).catch(() => reply({id: m.id, type: 'error', message: 'Cầu nối đã ngắt. Tải lại Promotion sau khi bật tiện ích.'}));
  });
  chrome.runtime.onMessage.addListener(message => {
    if (!['result','index-result','report-result','course-result','voucher-result','progress','error'].includes(message?.type)) return;
    reply(message);
  });
})();
