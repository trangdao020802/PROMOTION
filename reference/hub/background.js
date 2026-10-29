importScripts('core.js','report-core.js','index-core.js','course-core.js','voucher-core.js');
const P=globalThis.PromotionHub,R=globalThis.PromotionHubReports,I=globalThis.PromotionHubIndex,C=globalThis.PromotionHubCourse,V=globalThis.PromotionHubVoucher;
const read=async()=>(await chrome.storage.session.get('job')).job;
const emit=async(job,message)=>{try{await chrome.tabs.sendMessage(job.sourceTab,{id:job.id,...message});}catch{}};
async function finish(job,message){
 if((await read())?.id!==job.id)return;
 await chrome.storage.session.remove('job');await emit(job,message);
 if(job.reused)try{await chrome.tabs.sendMessage(job.hubTab,{type:'hub-agent-stop',id:job.id,agentKey:job.agentKey});}catch{}
}
async function existingAgent(sender){
 const tabs=await chrome.tabs.query({url:'https://hub24.apollo.vn/*'});
 for(const tab of tabs.filter(t=>{try{return new URL(t.url).origin===P.HUB;}catch{return false;}}).sort((a,b)=>Number(b.windowId===sender.tab.windowId)-Number(a.windowId===sender.tab.windowId)||(b.lastAccessed||0)-(a.lastAccessed||0))){
  try{const ready=await chrome.tabs.sendMessage(tab.id,{type:'hub-agent-ping'});if(ready?.ready&&ready.version===P.VERSION&&typeof ready.agentKey==='string'&&/^[\w-]{1,80}$/.test(ready.agentKey))return {tab,agentKey:ready.agentKey};}catch{}
 }
 return null;
}
async function navigate(job,url){
 if(!job.reused)return;
 await chrome.tabs.sendMessage(job.hubTab,{type:'hub-agent-navigate',id:job.id,agentKey:job.agentKey,url});
}
async function startAgent(request,sender){
 const agent=await existingAgent(sender);
 if(!agent)return {error:'Mở hoặc tải lại tab Hub đã đăng nhập rồi bấm lấy tiếp. Cầu nối không tạo tab mới.',code:'hub_tab_missing'};
 const duration=request.kind==='report'?R.reportRenderMs(request.report)+120000:request.kind==='voucher'?300000:60000;
 const job={...request,reused:true,silent:true,sourceTab:sender.tab.id,sourceDocument:sender.documentId,hubTab:agent.tab.id,agentKey:agent.agentKey,expires:Date.now()+duration};
 await chrome.storage.session.set({job});
 try{const reply=await chrome.tabs.sendMessage(job.hubTab,{...request,type:'hub-agent-run',agentKey:job.agentKey,duration});if(!reply?.accepted)throw Error();}
 catch{await finish(job,{type:'error',code:'hub_tab_unavailable',message:'Tab Hub chưa sẵn sàng; tải lại Hub rồi thử lại.'});return {};}
 await emit(job,{type:'progress',phase:job.kind,message:'Đang đọc '+(job.kind==='report'?R.HUB_REPORTS[job.report].label:job.kind==='voucher'?'Voucher '+job.voucher.code:job.kind==='course'?'Course info '+job.course.ct:'danh sách CT / DEP')+' trong nền…'});return {};
}
function frameURL(job,url){
 try{
  const u=new URL(url);if(u.origin!==P.HUB||u.username||u.password||u.hash)return false;
  if(job.kind==='report')return R.reportURLMatches(url,job.report,job.month,job.pageSize);
  if(job.kind==='voucher')return job.stage==='voucher-search'?u.pathname.toLowerCase()==='/giftcode/manage':job.stage==='voucher-codes'?V.voucherCodesURL(url,job.detailUrl)===job.codesUrl:V.voucherDetailURL(url)===job.detailUrl;
 }catch{}return false;
}
async function handle(m,sender){
 if(!Number.isInteger(sender.tab?.id)||!Number.isInteger(sender.frameId))return {error:'Nguồn yêu cầu không hợp lệ.'};
 const source=sender.frameId===0&&P.source(sender.url),hub=P.hub(sender.url);if(!source&&!hub)return {};
 let job=await read();
 if(job&&!job.reused){await chrome.storage.session.remove('job');await emit(job,{type:'error',code:'bridge',message:'Cầu nối đã cập nhật; bấm lấy tiếp.'});job=null;}
 if(job&&job.expires<Date.now()){await finish(job,{type:'error',code:'hub_timeout',message:'Lượt đọc đã hết giờ; bấm lấy tiếp.'});job=null;}
 if(source&&m.type==='cancel'){if(job?.sourceTab===sender.tab.id&&m.id===job.id)await finish(job,{type:'error',code:'cancelled',message:'Đã dừng. Dữ liệu đã lưu được giữ.'});return {};}
 if(source&&['start','index-start','course-start','voucher-start','report-start'].includes(m.type)){
  if(typeof m.id!=='string'||!/^\w[\w-]{0,79}$/.test(m.id))return {error:'Mã lượt đọc không hợp lệ.'};
  if(job?.sourceTab===sender.tab.id&&job.sourceDocument&&sender.documentId&&job.sourceDocument!==sender.documentId){await finish(job,{type:'error',code:'cancelled',message:'Promotion đã tải lại.'});job=null;}
  if(job)return {error:'Đang có một lượt Hub. Hoàn tất hoặc dừng lượt đó trước.'};
  let request;
  if(m.type==='course-start'){const course=C.courseRequest(m.course);if(!course)return {error:'Yêu cầu Course info không hợp lệ.'};request={id:m.id,kind:'course',course};}
  else if(m.type==='voucher-start'){const voucher=V.voucherRequest(m.voucher);if(!voucher)return {error:'Mã Giftcode không hợp lệ.'};request={id:m.id,kind:'voucher',voucher,stage:'voucher-search'};}
  else if(m.type==='report-start'){if(!Object.hasOwn(R.HUB_REPORTS,m.report)||!R.reportPeriod(m.month))return {error:'Báo cáo hoặc tháng không hợp lệ.'};request={id:m.id,kind:'report',report:m.report,month:m.month,pageSize:50,stage:'report-probe'};}
  else {let groups;try{groups=I.indexGroups(m.type==='start'?[m.ct]:m.codes);}catch{return {error:'Danh sách CT / DEP không hợp lệ.'};}if(groups.length!==1)return {error:'Mỗi lượt cần cùng loại hồ sơ và tháng.'};request={id:m.id,kind:m.type==='start'?'lookup':'index',codes:groups[0].codes,ct:m.type==='start'?P.code(m.ct):undefined};}
  return startAgent(request,sender);
 }
 if(!hub||!job||sender.tab.id!==job.hubTab)return {};
 if(sender.frameId===0){
  if(m.type==='context')return {id:job.id,kind:'agent'};
  if(m.type!=='agent-complete'||m.id!==job.id||m.agentKey!==job.agentKey)return {};
  if(m.error||m.code){await finish(job,{type:'error',code:m.code==='course_unavailable'?'course_unavailable':['hub_login','hub_frame_unavailable','hub_timeout','index_navigation','index_invalid','mismatch'].includes(m.code)?m.code:'hub_unavailable',message:typeof m.message==='string'?m.message.slice(0,600):'Hub chưa trả đủ dữ liệu.',...(m.code==='course_unavailable'?{diagnostic:C.courseFailure(m.diagnostic?.reason,Array.isArray(m.diagnostic?.fields)?m.diagnostic.fields:[]).diagnostic}:{})});return {};}
  if(job.kind==='course'){const payload=C.coursePayload(m.payload,job.course);if(!payload)return {error:'Course info sai CT / học viên.'};await finish(job,{type:'course-result',payload});}
  else if(['index','lookup'].includes(job.kind)){const links=I.indexLinks(m.links,job.codes);if(!links)return {error:'Cặp mã / link không hợp lệ.'};const link=links.find(l=>l.ct===job.ct);await finish(job,job.kind==='index'?{type:'index-result',links}:link?{type:'result',...link}:{type:'error',code:'not_found',message:'Chưa có mã trong danh sách Hub đã đọc.'});}
  return {};
 }
 // Only the broker's named child, bound to its frame/document and exact stage URL,
 // may supply voucher/report data. Unrelated Hub frames get no job context.
 if(!['voucher','report'].includes(job.kind)||m.frameJob!==job.id||m.frameKey!==job.agentKey||!frameURL(job,sender.url))return {};
 if(job.frameId!=null&&job.frameId!==sender.frameId)return {};
 if(m.type==='context'){job={...job,frameId:sender.frameId,frameDocument:sender.documentId};await chrome.storage.session.set({job});return job.kind==='voucher'?{id:job.id,kind:job.kind,voucher:job.voucher,stage:job.stage,searchApplied:job.searchApplied,list:job.list,url:job.detailUrl,codesUrl:job.codesUrl,detailPairs:job.detailPairs}:{id:job.id,kind:job.kind,report:job.report,month:job.month,stage:job.stage,pageSize:job.pageSize,total:job.total};}
 if(m.id!==job.id||job.frameId!==sender.frameId||job.frameDocument&&sender.documentId&&job.frameDocument!==sender.documentId)return {};
 if(m.type==='login'){await finish(job,{type:'error',code:'hub_login',message:'Đăng nhập lại trên tab Hub đang mở rồi bấm lấy tiếp.'});return {};}
  if(job.kind==='voucher'){
    const manage=new URL(sender.url).pathname.toLowerCase()==='/giftcode/manage';
    if(m.type==='voucher-search-applied'&&manage&&job.stage==='voucher-search'&&m.code===job.voucher.code){job={...job,searchApplied:true};await chrome.storage.session.set({job});return {apply:true};}
    if(m.type==='voucher-detail'&&manage&&job.stage==='voucher-search'&&job.searchApplied){
      const choice=V.voucherListChoice([m.row]);if(!choice)return {error:'Link Voucher chưa được xác minh từ dòng kết quả Hub.'};
      const list={};for(const key of ['label','center','startDate','endDate','status','creator','conditions'])if(typeof choice.record[key]==='string')list[key]=choice.record[key].slice(0,key==='conditions'?1500:200);
      job={...job,stage:'voucher-detail',detailUrl:choice.url,list,resumes:0};await chrome.storage.session.set({job});
      await emit(job,{type:'progress',phase:'voucher-detail',message:'Đang đọc chi tiết và xác nhận Giftcode đầy đủ…'});await navigate(job,choice.url);return {};
    }
    if(m.type==='voucher-codes'&&job.stage==='voucher-detail'&&V.voucherDetailURL(sender.url)===job.detailUrl){
      const codesUrl=V.voucherCodesURL(m.url,job.detailUrl);if(!codesUrl||!Array.isArray(m.pairs)||m.pairs.length>40)return {error:'List gift code không thuộc Voucher đang đọc.'};
      if(m.pairs.some(p=>typeof p.value==='string'&&p.value.length>(V.voucherLabel(p.label)==='centerCode'?2000:1500)))return {error:'Thông tin Voucher vượt giới hạn đọc; chưa tự điền.'};
      const detailPairs=m.pairs.filter(p=>V.voucherLabel(p.label)&&typeof p.value==='string').map(p=>({label:String(p.label).slice(0,100),value:p.value,unit:String(p.unit??'').slice(0,20)}));
      job={...job,stage:'voucher-codes',codesUrl,detailPairs,resumes:0};await chrome.storage.session.set({job});await emit(job,{type:'progress',phase:'voucher-detail',message:'Đang xác nhận mã đầy đủ trong List gift code…'});await navigate(job,codesUrl);return {};
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
      await navigate(job,R.reportURL(job.report,job.month,job.pageSize));return {};
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
chrome.tabs.onUpdated.addListener((tabId,change)=>{
 if(!change.url)return;
 serial=serial.then(async()=>{const job=await read();if(job?.hubTab===tabId)await finish(job,{type:'error',code:'hub_navigation',message:'Tab Hub đã chuyển trang. Bấm lấy tiếp; tiến độ đã lưu được giữ.'});}).catch(()=>{});
});
