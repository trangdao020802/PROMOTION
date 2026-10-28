importScripts('core.js','report-core.js','index-core.js','course-core.js','voucher-core.js');
const P = globalThis.PromotionHub;
const R = globalThis.PromotionHubReports;
const I = globalThis.PromotionHubIndex;
const C = globalThis.PromotionHubCourse;
const V = globalThis.PromotionHubVoucher;
const read = async () => (await chrome.storage.session.get('job')).job;
const emit = async (job, message) => { try { await chrome.tabs.sendMessage(job.sourceTab, {id: job.id, ...message}); } catch { /* source tab closed */ } };
async function finish(job, message, close = true) {
  if ((await read())?.id !== job.id) return;
  await chrome.storage.session.remove('job');
  await emit(job, message);
  if (job.reused) { try { await chrome.tabs.sendMessage(job.hubTab,{type:'hub-agent-stop',id:job.id,agentKey:job.agentKey}); } catch {} return; }
  if (close || job.silent) { try { await chrome.tabs.remove(job.hubTab); } catch { /* already closed */ } }
  else { try { await chrome.tabs.update(job.hubTab, {active: true}); } catch { /* already closed */ } }
}
// No automatic tab creation/navigation for link or Contract Input requests.
async function existingAgent(sender) {
 const tabs=await chrome.tabs.query({url:'https://hub24.apollo.vn/*'});
 const candidates=tabs.filter(t=>{try{return new URL(t.url).origin===P.HUB;}catch{return false;}}).sort((a,b)=>Number(b.windowId===sender.tab.windowId)-Number(a.windowId===sender.tab.windowId)||(b.lastAccessed||0)-(a.lastAccessed||0));
 for(const tab of candidates){try{const ready=await chrome.tabs.sendMessage(tab.id,{type:'hub-agent-ping'});if(ready?.ready&&ready.version===P.VERSION&&typeof ready.agentKey==='string'&&/^[\w-]{1,80}$/.test(ready.agentKey))return {tab,agentKey:ready.agentKey};}catch{}}
 return null;
}
async function startAgent(job,sender) {
 const agent=await existingAgent(sender);
 if(!agent)return {code:'hub_tab_missing',error:'Chưa có tab Hub sẵn sàng. Mở hoặc tải lại tab Hub đang dùng và đăng nhập, rồi bấm lấy tiếp. Ứng dụng không tạo tab mới.'};
 job={...job,reused:true,silent:true,sourceTab:sender.tab.id,sourceDocument:sender.documentId,hubTab:agent.tab.id,agentKey:agent.agentKey,expires:Date.now()+60_000};
 await chrome.storage.session.set({job});
 try{const reply=await chrome.tabs.sendMessage(job.hubTab,{type:'hub-agent-run',id:job.id,agentKey:job.agentKey,kind:job.kind,course:job.course,codes:job.codes});if(!reply?.accepted)throw Error();}
 catch{await finish(job,{type:'error',code:'hub_tab_unavailable',message:'Tab Hub chưa sẵn sàng; tải lại tab Hub rồi thử lại. Không tạo tab mới.'});return {};}
 await emit(job,{type:'progress',phase:job.kind==='course'?'course':'index',message:job.kind==='course'?`Đang đọc nền GetContractDetail / Course info của ${job.course.ct} qua tab Hub có sẵn…`:`Đang đọc danh sách theo tháng cho ${job.codes.length} mã qua tab Hub có sẵn…`});return {};
}
async function handle(m, sender) {
  if (sender.frameId !== 0 || !Number.isInteger(sender.tab?.id)) return {error: 'Nguồn yêu cầu không hợp lệ.'};
  const source = P.source(sender.url), hub = P.hub(sender.url);
  if (!source && !hub) return {error: 'Trang này không được dùng cầu nối.'};
  let job = await read();
  // Discard pre-upgrade automated jobs without touching their old tabs.
  if(job&&!job.reused&&!['voucher','report'].includes(job.kind)){await chrome.storage.session.remove('job');await emit(job,{type:'error',code:'bridge',message:'Cầu nối đã cập nhật. Bấm lấy tiếp để đọc phần còn thiếu.'});job=null;}
  if (job && job.expires < Date.now()) { await finish(job, {type: 'error', message: 'Lượt tìm đã hết hạn. Bấm tìm lại.'}); job = null; }
  if(m.type==='voucher-start'&&source){
    const voucher=V.voucherRequest(m.voucher);if(!voucher||typeof m.id!=='string'||!/^[\w-]{1,80}$/.test(m.id))return {error:'Mã Giftcode không hợp lệ.'};
    if(job&&job.sourceTab===sender.tab.id&&job.sourceDocument&&sender.documentId&&job.sourceDocument!==sender.documentId){await finish(job,{type:'error',message:'Promotion đã tải lại.'});job=null;}
    if(job)return {error:'Đang có một lượt Hub. Hoàn tất hoặc dừng lượt đó trước.'};
    const tab=await chrome.tabs.create({url:'about:blank',active:false});
    job={id:m.id,kind:'voucher',voucher,stage:'voucher-search',sourceTab:sender.tab.id,sourceDocument:sender.documentId,hubTab:tab.id,expires:Date.now()+15*60_000};
    await chrome.storage.session.set({job});await chrome.tabs.update(tab.id,{url:V.HUB_VOUCHERS,active:true});
    await emit(job,{type:'progress',phase:'voucher-search',message:`Đang tìm Giftcode ${voucher.code} trên Hub…`});return {};
  }
  if(source&&['course-start','index-start','start'].includes(m.type)){
    if(typeof m.id!=='string'||!/^\w[\w-]{0,79}$/.test(m.id))return {error:'Mã lượt đọc không hợp lệ.'};
    let request;
    if(m.type==='course-start'){const course=C.courseRequest(m.course);if(!course)return {error:'Yêu cầu Course info không hợp lệ.'};request={id:m.id,kind:'course',course};}
    else {let groups;try{groups=I.indexGroups(m.type==='start'?[m.ct]:m.codes);}catch{return {error:'Danh sách CT / DEP không hợp lệ.'};}if(groups.length!==1)return {error:'Mỗi lượt cần cùng loại hồ sơ và tháng.'};request={id:m.id,kind:m.type==='start'?'lookup':'index',codes:groups[0].codes,ct:m.type==='start'?P.code(m.ct):undefined};}
    if(job&&job.sourceTab===sender.tab.id&&job.sourceDocument&&sender.documentId&&job.sourceDocument!==sender.documentId){await finish(job,{type:'error',message:'Promotion đã tải lại.'});job=null;}
    if(job)return {error:'Đang có một lượt Hub. Hoàn tất hoặc dừng lượt đó trước.'};
    return startAgent(request,sender);
  }
  if(m.type==='report-start'&&source){
    if(!R||!Object.hasOwn(R.HUB_REPORTS,m.report)||!R.reportPeriod(m.month)||typeof m.id!=='string'||!/^[\w-]{1,80}$/.test(m.id))return {error:'Báo cáo hoặc tháng không hợp lệ.'};
    if(job&&job.sourceTab===sender.tab.id&&job.sourceDocument&&sender.documentId&&job.sourceDocument!==sender.documentId){await finish(job,{type:'error',message:'Promotion đã tải lại; bắt đầu lấy báo cáo mới.'});job=null;}
    if(job)return {error:'Đang có một lượt Hub. Hoàn tất hoặc dừng lượt đó trước.'};
    const tab=await chrome.tabs.create({url:'about:blank',active:false});
    job={id:m.id,kind:'report',report:m.report,month:m.month,pageSize:50,stage:'report-probe',sourceTab:sender.tab.id,sourceDocument:sender.documentId,hubTab:tab.id,expires:Date.now()+R.reportRenderMs(m.report)+15*60_000};
    await chrome.storage.session.set({job});
    try{await chrome.tabs.update(tab.id,{url:R.reportURL(job.report,job.month,job.pageSize),active:true});}catch{await finish(job,{type:'error',message:'Không mở được báo cáo Hub.'});return {};}
    await emit(job,{type:'progress',phase:'report-probe',message:`Đang hiển thị tab Hub · mở 50 dòng để đọc tổng số mục ${R.HUB_REPORTS[job.report].label} · ${job.month} · North…`});return {};
  }
  if (!job) return {};
  if (m.type === 'cancel' && source && sender.tab.id === job.sourceTab && m.id === job.id) {
    await finish(job, {type: 'error', message: 'Đã dừng tìm Hub.'}); return {};
  }
  if (!hub || sender.tab.id !== job.hubTab) return {};
  if(job.reused){
    if(m.type==='context')return {id:job.id,kind:'agent'};
    if(m.type!=='agent-complete'||m.id!==job.id||m.agentKey!==job.agentKey)return {};
    if(m.error||m.code){
      const codes=['hub_login','hub_frame_unavailable','hub_timeout','course_unavailable','index_navigation','index_invalid','mismatch'];
      await finish(job,{type:'error',code:codes.includes(m.code)?m.code:'hub_unavailable',message:typeof m.message==='string'?m.message.slice(0,600):'Hub chưa trả dữ liệu; bấm lấy tiếp.',...(m.code==='course_unavailable'?{diagnostic:C.courseFailure(m.diagnostic?.reason,Array.isArray(m.diagnostic?.fields)?m.diagnostic.fields:[]).diagnostic}:{})});return {};
    }
    if(job.kind==='course'){const payload=C.coursePayload(m.payload,job.course);if(!payload)return {error:'Thông tin khóa học sai CT / học viên.'};await finish(job,{type:'course-result',payload});}
    else {const links=I.indexLinks(m.links,job.codes);if(!links)return {error:'Cặp mã / link không hợp lệ.'};if(job.kind==='lookup'){const link=links.find(l=>l.ct===job.ct);await finish(job,link?{type:'result',...link}:{type:'error',code:'not_found',message:'Chưa có mã trong danh sách Hub đã đọc; cần xác minh.'});}else await finish(job,{type:'index-result',links});}
    return {};
  }
  if (m.type === 'context') return job.kind==='voucher'?{id:job.id,kind:'voucher',voucher:job.voucher,stage:job.stage,searchApplied:job.searchApplied,list:job.list,url:job.detailUrl,codesUrl:job.codesUrl,detailPairs:job.detailPairs}:job.kind==='course'?{id:job.id,kind:'course',course:job.course}:job.kind==='index'?{id:job.id,kind:'index',codes:job.codes,fields:job.fields}:job.kind==='report'?{id:job.id,kind:'report',report:job.report,month:job.month,stage:job.stage,pageSize:job.pageSize,total:job.total}:{id: job.id, ct: job.ct, stage: job.stage, scope: job.scope, fields: job.fields, ui: job.ui, url: job.detailUrl};
  if (m.id !== job.id) return {};
  if (m.type === 'login') {
    if(job.silent){await finish(job,{type:'error',code:'hub_login',message:'Hub cần đăng nhập. Mở Hub và đăng nhập, sau đó bấm Tiếp tục lấy Input; các CT đã lưu được bỏ qua.'});return {};}
    await emit(job, {type: 'progress', phase: 'login', message: job.kind==='report'?'Đăng nhập Hub trong tab vừa mở. Báo cáo sẽ tiếp tục sau đăng nhập.':job.kind==='index'?'Đăng nhập Hub trong tab vừa mở. Đọc danh sách sẽ tiếp tục sau đăng nhập.':'Cần đăng nhập Hub trong tab vừa mở. Tìm kiếm sẽ tự tiếp tục sau đăng nhập.'});
    await chrome.tabs.update(job.hubTab, {active: true}); return {};
  }
  if (m.type === 'resume') {
    if(job.kind==='voucher'){
      if((job.resumes??0)>=1){await finish(job,{type:'error',message:'Hub chưa mở lại đúng trang Voucher sau đăng nhập.'},false);return {};}
      job={...job,resumes:1};await chrome.storage.session.set({job});await chrome.tabs.update(job.hubTab,{url:job.codesUrl||job.detailUrl||V.HUB_VOUCHERS,active:true});return {};
    }
    if ((job.resumes ?? 0) >= 1) { await finish(job, {type: 'error', code: 'filters', message: 'Hub chuyển hướng nhưng không giữ bộ lọc tìm kiếm. Chưa kết luận mã không tồn tại.', diagnostic: {stage: job.stage, scope: job.scope, path: new URL(sender.url).pathname}}, false); return {}; }
    job = {...job, resumes: (job.resumes ?? 0) + 1}; await chrome.storage.session.set({job});
    await emit(job, {type: 'progress', phase: job.kind==='index'?'index':job.kind==='report'?job.stage:'search', message: job.kind==='index'?'Đang mở lại danh sách theo tháng sau đăng nhập…':job.kind==='report'?'Đang mở lại đúng báo cáo và tháng sau đăng nhập…':`Đang tiếp tục tìm ${job.ct} sau đăng nhập…`});
    await chrome.tabs.update(job.hubTab, {...(job.kind==='report'?{active:true}:{}),url: job.kind==='index'?I.indexURL(job.codes,job.id,job.fields):job.kind==='report'?R.reportURL(job.report,job.month,job.pageSize):job.stage === 'detail' ? job.detailUrl : P.search(job.ct, job.scope, job.fields)}); return {};
  }
  if(job.kind==='voucher'){
    const manage=new URL(sender.url).pathname.toLowerCase()==='/giftcode/manage';
    if(m.type==='voucher-search-applied'&&manage&&job.stage==='voucher-search'&&m.code===job.voucher.code){job={...job,searchApplied:true};await chrome.storage.session.set({job});return {apply:true};}
    if(m.type==='voucher-detail'&&manage&&job.stage==='voucher-search'&&job.searchApplied){
      const choice=V.voucherListChoice([m.row]);if(!choice)return {error:'Link Voucher chưa được xác minh từ dòng kết quả Hub.'};
      const list={};for(const key of ['label','center','startDate','endDate','status','creator','conditions'])if(typeof choice.record[key]==='string')list[key]=choice.record[key].slice(0,key==='conditions'?1500:200);
      job={...job,stage:'voucher-detail',detailUrl:choice.url,list,resumes:0};await chrome.storage.session.set({job});
      await emit(job,{type:'progress',phase:'voucher-detail',message:'Đang đọc chi tiết và xác nhận Giftcode đầy đủ…'});await chrome.tabs.update(job.hubTab,{url:choice.url,active:true});return {};
    }
    if(m.type==='voucher-codes'&&job.stage==='voucher-detail'&&V.voucherDetailURL(sender.url)===job.detailUrl){
      const codesUrl=V.voucherCodesURL(m.url,job.detailUrl);if(!codesUrl||!Array.isArray(m.pairs)||m.pairs.length>40)return {error:'List gift code không thuộc Voucher đang đọc.'};
      if(m.pairs.some(p=>typeof p.value==='string'&&p.value.length>(V.voucherLabel(p.label)==='centerCode'?2000:1500)))return {error:'Thông tin Voucher vượt giới hạn đọc; chưa tự điền.'};
      const detailPairs=m.pairs.filter(p=>V.voucherLabel(p.label)&&typeof p.value==='string').map(p=>({label:String(p.label).slice(0,100),value:p.value,unit:String(p.unit??'').slice(0,20)}));
      job={...job,stage:'voucher-codes',codesUrl,detailPairs,resumes:0};await chrome.storage.session.set({job});await emit(job,{type:'progress',phase:'voucher-detail',message:'Đang xác nhận mã đầy đủ trong List gift code…'});await chrome.tabs.update(job.hubTab,{url:codesUrl,active:true});return {};
    }
    if(m.type==='voucher-complete'&&((job.stage==='voucher-detail'&&V.voucherDetailURL(sender.url)===job.detailUrl)||(job.stage==='voucher-codes'&&V.voucherCodesURL(sender.url,job.detailUrl)===job.codesUrl))){
      const payload=V.voucherPayload(m.payload,job.voucher,job.detailUrl);if(!payload)return {error:'Dữ liệu Voucher không khớp mã hoặc link chi tiết.'};
      await finish(job,{type:'voucher-result',payload});return {};
    }
    if(m.type==='voucher-failure'){
      const messages={ambiguous:'Hub trả nhiều Voucher; chưa xác định duy nhất mã đang tìm.',code_unconfirmed:'Chưa thấy Giftcode đầy đủ trong List gift code. Không dùng Code prefix để tự điền.',conflict:'Thông tin Voucher trên Hub có dữ liệu mâu thuẫn.',unit:'Chưa xác định rõ đơn vị % hay VNĐ/đ cạnh Discount amount. Chưa tự điền mức giảm.',centers:'Chưa đọc đủ danh sách Center code trên Hub; chưa tự điền phạm vi.',filters:'Hub chưa giữ đúng mã Giftcode trong ô tìm kiếm.',unsupported:'Chưa đọc được cấu trúc trang Voucher của Hub.',timeout:'Hub chưa hiển thị đủ Voucher hoặc List gift code trong thời gian chờ.'};
      await finish(job,{type:'error',code:'voucher_'+(Object.hasOwn(messages,m.reason)?m.reason:'unsupported'),message:messages[m.reason]||messages.unsupported},false);return {};
    }
    return {};
  }
  if(job.kind==='report'){
    const matches=R.reportURLMatches(sender.url,job.report,job.month,job.pageSize);
    if(m.type==='report-count'&&job.stage==='report-probe'&&matches){
      if(!Number.isSafeInteger(m.total)||m.total<0||m.total>R.MAX_REPORT_ROWS)return {error:'Tổng dòng báo cáo vượt giới hạn hoặc chưa xác minh.'};
      job={...job,total:m.total,pageSize:Math.max(1,m.total),stage:'report-full',resumes:0,expires:Date.now()+R.reportRenderMs(job.report)+15*60_000};await chrome.storage.session.set({job});
      await emit(job,{type:'progress',phase:'report-full',message:`Đang lấy đủ ${job.total} dòng chi tiết ${R.HUB_REPORTS[job.report].label} · ${job.month}…`});
      await chrome.tabs.update(job.hubTab,{url:R.reportURL(job.report,job.month,job.pageSize),active:true});return {};
    }
    if(m.type==='report-complete'&&job.stage==='report-full'&&matches){
      const payload=R.reportPayload(m.payload,job.report,job.month);
      if(!payload||payload.total!==job.total)return {error:'Bảng báo cáo chưa đủ dòng hoặc khác bộ lọc.'};
      await finish(job,{type:'report-result',payload});return {};
    }
    if(m.type==='report-failure'){
      const path=new URL(sender.url).pathname;
      if(path!==R.HUB_REPORTS[job.report].path)return {};
      const reasons={not_rendered:`Hub chưa hiển thị bảng ${R.HUB_REPORTS[job.report].label} sau ${R.reportRenderMs(job.report)%60_000?R.reportRenderMs(job.report)/1000+' giây':R.reportRenderMs(job.report)/60_000+' phút'}; chưa nhập dữ liệu. Kiểm tra tab Hub và chi tiết lỗi.`,filters:'Hub đang có bộ lọc mâu thuẫn với tháng hoặc North được yêu cầu.',detail_table:`Chưa nhận diện duy nhất bảng chi tiết ${R.HUB_REPORTS[job.report].label}. Xem chi tiết kiểm tra báo cáo.`,total_count:`Đã nhận diện bảng chi tiết ${R.HUB_REPORTS[job.report].label} nhưng chưa xác nhận được tổng dòng. Xem chi tiết kiểm tra báo cáo.`,pagination:'Bảng chi tiết còn phân trang; chưa lấy đủ dữ liệu.',row_count:'Số dòng chi tiết khác tổng dòng Hub; chưa nhập dữ liệu.',date_column:`Bảng chi tiết thiếu hoặc trùng cột ${R.HUB_REPORTS[job.report].dateField}; chưa xác nhận được tháng.`,date_rows:`Có dòng thiếu, sai hoặc ngoài tháng ${job.month} tại cột ${R.HUB_REPORTS[job.report].dateField}; chưa nhập dữ liệu.`,limit:'Báo cáo vượt giới hạn; chọn nguồn có phạm vi nhỏ hơn.',connection:'Không kết nối được báo cáo Hub.',unsupported:'Cấu trúc bảng báo cáo chưa được hỗ trợ; chưa nhập dữ liệu.',timeout:'Hub chưa tải xong báo cáo trong thời gian cho phép.'};
      const code=Object.hasOwn(reasons,m.reason)?m.reason:'unsupported',diagnostic=R.reportDiagnostic({...m,stage:job.stage,path,report:job.report,month:job.month});
      const filterMessages={dates:`Bộ lọc ngày trên Hub đang mâu thuẫn với ${R.HUB_REPORTS[job.report].dateField} tháng ${job.month}.`,region:'Bộ lọc vùng trên Hub đang mâu thuẫn với North (1).',page_size:`Số dòng mỗi trang trên Hub đang khác ${job.pageSize}.`};
      await finish(job,{type:'error',code:'report_'+code,message:code==='filters'&&Object.hasOwn(filterMessages,m.filter)?filterMessages[m.filter]:reasons[code],diagnostic},false);return {};
    }
    return {};
  }
  return {};
}

// Serialize events touching the one active job, including tab removal/cancellation.
let serial = Promise.resolve();
chrome.runtime.onMessage.addListener((m, sender, respond) => {
  serial = serial.then(() => handle(m, sender)).then(respond, () => respond({error: 'Cầu nối gặp lỗi. Dừng lượt hiện tại rồi thử lại.'}));
  return true;
});
chrome.tabs.onRemoved.addListener(tabId => {
  serial = serial.then(async () => {
    const job = await read();
    if (job && (job.hubTab === tabId || job.sourceTab === tabId)) await finish(job, {type: 'error', message: 'Tab Hub hoặc Promotion đã đóng. Bấm tìm lại.'}, job.hubTab !== tabId);
  }).catch(() => {});
});
// Login redirects use Hub's separate sign-in port. Observe the URL only;
// credential fields and cookies are never read by the bridge.
chrome.tabs.onUpdated.addListener((tabId,change)=>{
 if(!change.url)return;
 serial=serial.then(async()=>{const job=await read();if(!job||job.hubTab!==tabId||job.loginNotified)return;
  if(job.reused){await finish(job,{type:'error',code:'hub_navigation',message:'Tab Hub đã chuyển trang. Bấm lấy tiếp để đọc phần còn thiếu; tiến độ đã lưu được giữ.'});return;}
  let url;try{url=new URL(change.url);}catch{return;}
  if(url.origin!=='https://hub24.apollo.vn:10000'||!/^\/login\/?$/i.test(url.pathname))return;
  if(job.silent){await finish(job,{type:'error',code:'hub_login',message:'Hub cần đăng nhập. Mở Hub và đăng nhập, rồi bấm Tiếp tục lấy Input. Tiến độ CT đã lấy đủ vẫn được giữ.'});return;}
  await chrome.storage.session.set({job:{...job,loginNotified:true}});
  await emit(job,{type:'progress',phase:'login',message:'Đăng nhập Hub trong tab vừa mở. Đọc dữ liệu sẽ tiếp tục sau đăng nhập.'});
 }).catch(()=>{});
});
