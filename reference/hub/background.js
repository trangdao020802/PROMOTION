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
  if (close || job.silent) { try { await chrome.tabs.remove(job.hubTab); } catch { /* already closed */ } }
  else { try { await chrome.tabs.update(job.hubTab, {active: true}); } catch { /* already closed */ } }
}
const onList = (job, sender) => new URL(sender.url).pathname.toLowerCase() === P.list(job.ct);
const indexPath = value => {const path=new URL(value).pathname;return /^\/(?:contract|deposit)\/[a-zA-Z]{1,40}(?:\/[1-9]\d{0,14})?\/?$/i.test(path)?path.replace(/\/[1-9]\d{0,14}\/?$/,''):'/';};
const searched = (job, sender, message) => P.searchMatches(sender.url, job.ct, job.scope, job.fields) || job.ui && job.uiReady && onList(job, sender) && message.scope === job.scope;
async function handle(m, sender) {
  if (sender.frameId !== 0 || !Number.isInteger(sender.tab?.id)) return {error: 'Nguồn yêu cầu không hợp lệ.'};
  const source = P.source(sender.url), hub = P.hub(sender.url);
  if (!source && !hub) return {error: 'Trang này không được dùng cầu nối.'};
  let job = await read();
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
  if(m.type==='course-start'&&source){
    const course=C?.courseRequest(m.course);if(!course||typeof m.id!=='string'||!/^\w[\w-]{0,79}$/.test(m.id))return {error:'Yêu cầu đọc Course info không hợp lệ.'};
    if(job&&job.sourceTab===sender.tab.id&&job.sourceDocument&&sender.documentId&&job.sourceDocument!==sender.documentId){await finish(job,{type:'error',message:'Promotion đã tải lại.'});job=null;}
    if(job)return {error:'Đang có một lượt Hub. Chờ hoàn tất rồi thử lại.'};
    const tab=await chrome.tabs.create({url:'about:blank',active:false});
    job={id:m.id,kind:'course',course,silent:true,sourceTab:sender.tab.id,sourceDocument:sender.documentId,hubTab:tab.id,stage:'course',expires:Date.now()+15*60_000};await chrome.storage.session.set({job});
    try{await chrome.tabs.update(tab.id,{url:course.url,active:false});}catch{await finish(job,{type:'error',message:'Không mở được Course info trên Hub.'});return {};}
    await emit(job,{type:'progress',phase:'course',message:`Đang đọc nền GetContractDetail / Course info của ${course.ct}…`});return {};
  }
  if(m.type==='index-start'&&source){
    let groups;try{groups=I.indexGroups(m.codes);}catch{return {error:'Danh sách CT / DEP không hợp lệ.'};}
    if(groups.length!==1||typeof m.id!=='string'||!/^[\w-]{1,80}$/.test(m.id))return {error:'Mỗi lượt đọc cần cùng loại hồ sơ và tháng.'};
    if(job&&job.sourceTab===sender.tab.id&&job.sourceDocument&&sender.documentId&&job.sourceDocument!==sender.documentId){await finish(job,{type:'error',message:'Promotion đã tải lại; bắt đầu lượt mới.'});job=null;}
    if(job)return {error:'Đang có một lượt Hub. Hoàn tất hoặc dừng lượt đó trước.'};
    const tab=await chrome.tabs.create({url:'about:blank',active:false});
    job={id:m.id,kind:'index',silent:true,codes:groups[0].codes,sourceTab:sender.tab.id,sourceDocument:sender.documentId,hubTab:tab.id,stage:'index',expires:Date.now()+15*60_000};
    await chrome.storage.session.set({job});
    try{await chrome.tabs.update(tab.id,{url:I.indexURL(job.codes,job.id)});}catch{await finish(job,{type:'error',message:'Không mở được danh sách Hub.'});return {};}
    await emit(job,{type:'progress',phase:'index',message:`Đang đọc danh sách ${groups[0].kind==='contract'?'Contract':'Deposit'} · ${groups[0].from} → ${groups[0].to} cho ${job.codes.length} mã…`});return {};
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
  if (m.type === 'start' && source) {
    if (!P.code(m.ct) || typeof m.id !== 'string' || !/^[\w-]{1,80}$/.test(m.id)) return {error: 'Mã CT / DEP không hợp lệ.'};
    if (job && job.sourceTab === sender.tab.id && job.sourceDocument && sender.documentId && job.sourceDocument !== sender.documentId) {
      await finish(job, {type: 'error', message: 'Trang Promotion đã tải lại; bắt đầu lượt tìm mới.'}); job = null;
    }
    if (job) return {error: 'Đang có một lượt tìm Hub. Hoàn tất hoặc dừng lượt đó trước.'};
    // Persist before navigation; a service-worker restart cannot misroute a result.
    const tab = await chrome.tabs.create({url: 'about:blank', active: false});
    job = {id: m.id, ct: P.code(m.ct), silent:true, scope: P.range(m.ct).scope, sourceTab: sender.tab.id, sourceDocument: sender.documentId, hubTab: tab.id, stage: 'search', expires: Date.now() + 15 * 60_000};
    await chrome.storage.session.set({job});
    try { await chrome.tabs.update(tab.id, {url: P.search(job.ct, job.scope)}); }
    catch { await finish(job, {type: 'error', message: 'Không mở được tab Hub.'}); return {}; }
    await emit(job, {type: 'progress', phase: 'search', message: `Đang tìm ${job.ct}: ${P.range(job.ct, job.scope).from} → ${P.range(job.ct, job.scope).to}…`});
    return {};
  }
  if (!job) return {};
  if (m.type === 'cancel' && source && sender.tab.id === job.sourceTab && m.id === job.id) {
    await finish(job, {type: 'error', message: 'Đã dừng tìm Hub.'}); return {};
  }
  if (!hub || sender.tab.id !== job.hubTab) return {};
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
    if(job.kind==='course'){
      if((job.resumes??0)>=1){await finish(job,{type:'error',message:'Hub không giữ được hồ sơ sau đăng nhập.'},false);return {};}
      job={...job,resumes:1};await chrome.storage.session.set({job});await chrome.tabs.update(job.hubTab,{url:job.course.url,active:false});return {};
    }
    if(job.kind==='index'&&!/^\/(?:home|dashboard)?(?:\/index)?\/?$/i.test(new URL(sender.url).pathname)){
      await finish(job,{type:'error',code:'index_navigation',message:'Hub đã chuyển sang trang khác khi đọc danh sách; chưa xác minh hoặc lưu link.',diagnostic:{stage:'index',path:indexPath(sender.url),reason:'unexpected_navigation'}},false);return {};
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
  if(job.kind==='course'){
    if(m.type==='course-failure'){await finish(job,C.courseFailure(m.reason,Array.isArray(m.fields)?m.fields:[]),false);return {};}
    if(sender.url!==job.course.url)return {};
    if(m.type==='course-complete'){const payload=C.coursePayload(m.payload,job.course);if(!payload)return {error:'Thông tin khóa học sai CT / học viên.'};await finish(job,{type:'course-result',payload});}
    return {};
  }
  if(job.kind==='index'){
    const matches=I.indexURLMatches(sender.url,job.codes,job.id,job.fields);
    if(m.type==='index-fields'&&matches&&P.kind(job.codes[0])==='deposit'&&!job.fields){
      const fields=P.depositFields(m.fields);if(!fields)return {error:'Bộ lọc Deposit không hợp lệ.'};job={...job,fields};await chrome.storage.session.set({job});
      await emit(job,{type:'progress',phase:'index',message:'Đã nhận diện bộ lọc Deposit; đang đọc danh sách theo tháng…'});
      await chrome.tabs.update(job.hubTab,{url:I.indexURL(job.codes,job.id,job.fields)});return {};
    }
    if(m.type==='index-complete'){const links=matches&&I.indexLinks(m.links,job.codes);if(!links)return {error:'Cặp mã/link hoặc bộ lọc danh sách không hợp lệ.'};await finish(job,{type:'index-result',links});return {};}
    if(m.type==='index-failure'){
      const conflicts=['multiple_ids','pair_mismatch','conflicting_codes','network_conflict'];
      const reason=conflicts.includes(m.reason)?'mismatch':m.reason==='connection'?'connection':m.reason==='invalid_packet'?'index_invalid':m.reason==='unexpected_navigation'?'index_navigation':'index_unavailable';
      if(new URL(sender.url).pathname.toLowerCase()!==P.list(job.codes[0])&&!['index_navigation','connection','index_invalid'].includes(reason))return {};
      const diagnostic={stage:'index',path:indexPath(sender.url),reason:conflicts.includes(m.reason)||['connection','invalid_packet','unexpected_navigation','filters','unsupported'].includes(m.reason)?m.reason:'unsupported'};
      if(job.codes.includes(m.ct))diagnostic.ct=m.ct;
      if(Number.isSafeInteger(m.candidates)&&m.candidates>=0&&m.candidates<=I.INDEX_LIMIT)diagnostic.candidates=m.candidates;
      if(/^\/(?:contract|deposit)\/[a-zA-Z]{1,40}$/i.test(m.route??''))diagnostic.route=m.route;
      const messages={connection:'Không kết nối được danh sách Hub.',mismatch:'Có mã được gắn với nhiều ID khác nhau trên Hub; chưa lưu. Xem mã và lý do bên dưới.',index_invalid:'Dữ liệu mã/link hoặc bộ lọc trả về không hợp lệ; chưa lưu link.',index_navigation:'Hub đã chuyển sang trang khác khi đọc danh sách; chưa xác minh hoặc lưu link.',index_unavailable:'Chưa đọc được danh sách Hub; đã dừng. Kiểm tra tab Hub hoặc gắn link thủ công.'};
      await finish(job,{type:'error',code:reason,message:messages[reason],diagnostic},false);return {};
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
  if (m.type === 'filters-ui' && job.stage === 'search' && P.kind(job.ct) === 'deposit' && onList(job, sender) && m.scope === job.scope) {
    if ((job.uiAttempts ?? 0) >= 2) { await finish(job, {type: 'error', code: 'filters', message: 'Deposit không giữ giá trị sau khi bấm Search; chưa kết luận không có mã.'}, false); return {}; }
    job = {...job, fields: undefined, ui: true, uiReady: false, uiAttempts: (job.uiAttempts ?? 0) + 1}; await chrome.storage.session.set({job});
    await emit(job, {type: 'progress', phase: 'search', message: `Đang điền mã và ngày, bấm Search trên Deposit: ${job.ct}…`});
    return {apply: true};
  }
  if (m.type === 'ui-ready' && job.stage === 'search' && job.ui && onList(job, sender) && m.scope === job.scope) {
    job = {...job, uiReady: true}; await chrome.storage.session.set({job}); return {ready: true};
  }
  if (m.type === 'filters' && job.stage === 'search' && P.kind(job.ct) === 'deposit' && !job.fields) {
    const fields = P.depositFields(m.fields);
    if (new URL(sender.url).pathname.toLowerCase() !== '/deposit/manage' || !fields) return {error: 'Không nhận diện được bộ lọc Deposit.'};
    job = {...job, fields}; await chrome.storage.session.set({job});
    await emit(job, {type: 'progress', phase: 'search', message: `Đã nhận diện bộ lọc Deposit; đang tìm ${job.ct}…`});
    await chrome.tabs.update(job.hubTab, {url: P.search(job.ct, job.scope, fields)}); return {};
  }
  if (m.type === 'detail' && job.stage === 'search') {
    const url = P.detail(m.url, job.ct);
    if (!searched(job, sender, m) || !url || m.ct !== job.ct) return {error: 'Kết quả Hub không khớp yêu cầu.'};
    job = {...job, stage: 'detail', detailUrl: url, resumes: 0};
    await chrome.storage.session.set({job});
    await emit(job, {type: 'progress', phase: 'detail', message: `Đã tìm ${job.ct}; đang kiểm tra trang chi tiết…`});
    await chrome.tabs.update(job.hubTab, {url}); return {};
  }
  if (m.type === 'complete' && job.stage === 'detail') {
    if (m.ct !== job.ct || P.detail(sender.url, job.ct) !== job.detailUrl || P.detail(m.url, job.ct) !== job.detailUrl) return {error: 'Link chi tiết không khớp mã đang tìm.'};
    await finish(job, {type: 'result', ct: job.ct, url: job.detailUrl}); return {};
  }
  if (m.type === 'failure') {
    const validSearch = searched(job, sender, m);
    const expectedPage = job.stage === 'search' ? validSearch || ['unsupported', 'connection', 'filters', 'timeout'].includes(m.reason) && onList(job, sender) : P.detail(sender.url, job.ct) === job.detailUrl;
    if (!expectedPage) return {};
    if (m.reason === 'missing' && job.stage === 'search' && job.scope === 'month' && validSearch) {
      job = {...job, scope: 'wide', uiReady: false, uiAttempts: 0, resumes: 0}; await chrome.storage.session.set({job});
      await emit(job, {type: 'progress', phase: 'search', message: `Không thấy ${job.ct} trong tháng ghi trên mã; đang mở rộng 2000–2099…`});
      await chrome.tabs.update(job.hubTab, {url: P.search(job.ct, job.scope, job.fields)}); return {};
    }
    const reasons = {missing: 'Hub trả bảng không có kết quả sau khi mở rộng ngày.', ambiguous: 'Hub trả nhiều link khác nhau cho cùng mã; chưa lưu link.', unsupported: 'Không nhận diện được bộ lọc hoặc đường dẫn chi tiết Hub; chưa lưu link.', mismatch: 'Trang chi tiết không xác nhận đúng mã CT / DEP; chưa lưu link.', timeout: 'Hub chưa tải được kết quả sau 25 giây. Chưa kết luận mã không tồn tại.', connection: 'Tab Hub đang báo lỗi kết nối; chưa thực hiện được tra cứu.', filters: 'Hub chưa xác nhận mã và bộ lọc ngày đã được áp dụng; chưa kết luận không tìm thấy.'};
    const diagnostic = {stage: job.stage, scope: job.scope, path: new URL(sender.url).pathname, mode: job.ui ? 'ui' : job.fields ? 'get' : 'query'};
    for (const key of ['tables', 'anchors']) if (Number.isInteger(m.diagnostic?.[key]) && m.diagnostic[key] >= 0 && m.diagnostic[key] <= 10000) diagnostic[key] = m.diagnostic[key];
    if (/^\/(?:contract|deposit)\/[a-zA-Z]{1,40}$/.test(m.diagnostic?.route ?? '')) diagnostic.route = m.diagnostic.route;
    await finish(job, {type: 'error', code: m.reason === 'missing' ? 'not_found' : Object.hasOwn(reasons, m.reason) ? m.reason : 'bridge', message: reasons[m.reason] ?? 'Chưa xác minh được link Hub.', diagnostic}, m.reason === 'missing'); return {};
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
  let url;try{url=new URL(change.url);}catch{return;}
  if(url.origin!=='https://hub24.apollo.vn:10000'||!/^\/login\/?$/i.test(url.pathname))return;
  if(job.silent){await finish(job,{type:'error',code:'hub_login',message:'Hub cần đăng nhập. Mở Hub và đăng nhập, rồi bấm Tiếp tục lấy Input. Tiến độ CT đã lấy đủ vẫn được giữ.'});return;}
  await chrome.storage.session.set({job:{...job,loginNotified:true}});
  await emit(job,{type:'progress',phase:'login',message:'Đăng nhập Hub trong tab vừa mở. Đọc dữ liệu sẽ tiếp tục sau đăng nhập.'});
 }).catch(()=>{});
});
