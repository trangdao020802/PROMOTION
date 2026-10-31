import {get,all,put,versioned,activatePolicy} from './db.mjs';
import {buildModel,identity} from './model.mjs';
import {validateBundle} from '../core/source-parser.mjs';
import {AuditEngine} from './calculation.mjs';
import {EMPTY_VOUCHER,voucherInput,validateVoucher,voucherCode,voucherReference} from '../core/vouchers.mjs';
import {validateVerification} from '../core/verification.mjs';
import {validateReviews} from '../core/reviews.mjs';
import {assetPath} from './paths.mjs';
import {resolveCourseInfo} from '../core/course-info.mjs';
import {coursePayload,COURSE_FIELDS} from '../core/hub-course.mjs';
import {validInputTargets,newInputRun,completeInputRun} from '../core/hub-input-progress.mjs';
import {buildPriceCatalogue,policyRuleCatalogue,hubPriceCatalogue} from '../core/price-catalog.mjs';
import {POLICY_SCHEMA,normalizePolicyRow,validatePolicyRows,stagePolicyUpdate,mergePolicyPack} from '../core/policy-pack.mjs';
let policies;
let resolvedPolicy;
// Course inputs and review patches never change membership of a source bundle.
// Keep only its identity index; rebuilding the cash/transfer graph for each CT
// made an otherwise small IndexedDB write quadratic during a bulk Hub read.
const identityIndexes=new Map();
function indexModel(model){
 const groups=new Map(model.contractGroups.map(group=>[group.id,{id:group.id,ct:group.ct,kind:group.kind,paymentCode:group.paymentCode,cells:{F:group.cells.F}}]));
 identityIndexes.set(model.hash,{hash:model.hash,groups,students:new Set([...groups.values()].map(g=>g.ct+'|'+String(g.cells.F)))});
 while(identityIndexes.size>2)identityIndexes.delete(identityIndexes.keys().next().value);
}
async function datasetIndex(datasetId){const dataset=await currentDataset(datasetId),hash=dataset?.id||'policy-2026';if(!identityIndexes.has(hash))await loadWorkbook(dataset?.id);return identityIndexes.get(hash);}
const nativeFetch=globalThis.fetch.bind(globalThis);
export async function loadPolicies(){if(!policies)policies=nativeFetch(assetPath('rules.json'),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Không tải được bảng quy tắc.');return r.json()});const [base,active]=await Promise.all([policies,get('settings','policy-active')]);if(resolvedPolicy?.id===(active?.packId??'published'))return resolvedPolicy.value;const pack=active?.packId?await get('settings',active.packId):null;const value=mergePolicyPack(base,pack);resolvedPolicy={id:active?.packId??'published',value};return value;}
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const fail=(s,status=400)=>Object.assign(Error(s),{status});
const id=()=>{if(typeof crypto.randomUUID==='function')return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-')},now=()=>new Date().toISOString();
export async function currentDataset(datasetId){if(datasetId){const d=await get('datasets',datasetId);if(!d)throw fail('Không tìm thấy bộ nguồn trên trình duyệt này. Mở Tải bộ nguồn để chọn lại.',404);return d}const setting=await get('settings','current');return setting?.datasetId?await get('datasets',setting.datasetId):null}
export async function loadWorkbook(datasetId){const [dataset,p,vouchers,sources]=await Promise.all([currentDataset(datasetId),loadPolicies(),all('vouchers'),all('courseSources')]);const model=buildModel(dataset?.bundle,p);model.dataset=dataset;model.hash=dataset?.id||'policy-2026';indexModel(model);const engine=new AuditEngine(model);engine.setVouchers(vouchers);engine.setCourseSources(sources.filter(s=>identityIndexes.get(model.hash).students.has(s.ct+'|'+s.student)));return engine.data}
const baseRecord=g=>({...g.anchor,id:g.id,kind:g.kind,ct:g.ct,paymentCode:g.paymentCode,memberIds:g.memberIds,...(g.sourceContracts?{sourceContracts:g.sourceContracts}:{}),receipts:g.receipts,groupWarnings:g.warnings,hubContract:g.hubContract??null,hubReadMissing:g.hubReadMissing??[],hubPolicy:g.hubPolicy??null,hubPolicyError:g.hubPolicyError??null,cells:{...g.cells,contractTotal:g.ct||'',AG:'',AF:'CHECK'}});
async function bootstrap(datasetId){
 const model=await loadWorkbook(datasetId),saved=await all('edits'),links=await all('links');const savedMap=new Map(saved.map(x=>[x.id,x]));
 const edits={};for(const g of model.contractGroups){const e=savedMap.get(identity({kind:g.kind,ct:g.ct,paymentCode:g.paymentCode,cells:g.cells}));if(e)edits[g.id]={patch:e.patch,version:e.version,updatedAt:e.updatedAt}}
 const d=model.dataset,records=model.contractGroups.map(baseRecord),groups=model.contractGroups,hubSources=(await all('courseSources')).filter(s=>groups.some(g=>g.ct===s.ct&&String(g.cells.F)===s.student)),priceCatalogue=[...buildPriceCatalogue(model.policy),...hubPriceCatalogue(model.policy,hubSources)],ruleCatalogue=policyRuleCatalogue(model.policy,priceCatalogue);
 return {priceCatalogue,ruleCatalogue,policyCoverage:{sources:model.policy.priceEvidence.sources.length+(model.policy.policySupplement?.sources.length??0),checkedRows:model.policy.priceEvidence.checkedRows,conflicts:model.policy.priceEvidence.conflicts,sourceOrder:model.policy.policyRegister.sourceOrder,decisions:model.policy.policySupplement?.decisions??[],revision:model.policy.policyRevision,typedRows:model.policy.typedPrices?.length??0},source:model.source,hash:model.hash,tolerance:model.policy.auditPolicy?.moneyTolerance??1,policyReference:model.policy.auditPolicy?{file:model.policy.auditPolicy.sourceFile,moneyTolerance:model.policy.auditPolicy.moneyTolerance,hourTolerance:model.policy.auditPolicy.hourTolerance}:null,dataset:d?datasetMeta(d):null,needsSources:!d,needsCalculation:!!d,records,edits,choices:model.choices,courseSources:Object.fromEntries((await all('courseSources')).filter(s=>groups.some(g=>g.ct===s.ct&&String(g.cells.F)===s.student)).map(s=>[s.ct,s])),hubLinks:Object.fromEntries(links.map(l=>[l.ct,l])),customVouchers:model.extensions.customVouchers,vouchers:model.extensions.customVouchers.map(voucherReference),prices:model.policy.prices,rules:model.policy.rules,catalogue:model.extensions.catalogue,sourceManifest:[...model.policy.manifest,...model.policy.priceEvidence.sources.slice(16),...(model.policy.policySupplement?.sources??[])],cutoff:model.cutoff??Math.floor((Date.now()-Date.UTC(1899,11,30))/86400000),groupKocByRecord:Object.fromEntries(groups.map(g=>[g.id,model.grids.RAW_REPORT['X'+g.rawRow]||''])),groupingStats:{payments:d?.bundle.records.length||0,contracts:groups.filter(g=>g.kind==='contract').length,unlinked:groups.filter(g=>g.kind!=='contract').length},reconciliationStats:model.extensions.accounts.statistics,sourceCalculation:d?{counts:{payments:model.input.cashSources.flatMap(s=>s.rows).filter(r=>r.paid&&r.vat&&!r.cancelled).length,transfers:d.bundle.transfers.length,exports:d.bundle.exports.length},scope:d.bundle.scope,inputs:d.bundle.sources.map(s=>({file:s.fileName,sheet:s.sheetName,rows:s.rowCount}))}:null,continuity:d?{matchedRecords:Object.keys(edits).length,newRecords:groups.length-Object.keys(edits).length}:null};
}
function datasetMeta(d){return {id:d.id,fileName:d.fileName,sheetName:'Export · PaymentList · Transfer',rowCount:d.bundle.records.length,createdAt:d.createdAt,from:d.bundle.scope.from,to:d.bundle.scope.to,usable:true,sources:d.bundle.sources.map(s=>({...s,fileId:d.fileIds[s.fileIndex]}))}}
async function recordFor(datasetId,recordId){const model=await datasetIndex(datasetId),group=model.groups.get(recordId);if(!group)throw fail('Không có CT/hồ sơ trong bộ nguồn đang mở.');return {model,group,key:identity(group)}}
async function ensureVouchers(codes){for(const code of [...new Set(codes.map(voucherCode).filter(Boolean))])if(!await get('vouchers',code))await versioned('vouchers',code,0,()=>({...EMPTY_VOUCHER,code}));}
export function validHubURL(value,code){try{const u=new URL(value);if(u.origin!=='https://hub24.apollo.vn:7777'||u.username||u.password||u.hash)return false;const ct=String(code).includes('-CT-');if(ct)return /^\/contract\/detail\/[1-9]\d{0,14}\/?$/i.test(u.pathname)&&!u.search;return /^\/deposit\/(?:detail|view)\/[1-9]\d{0,14}\/?$/i.test(u.pathname)&&!u.search||/^\/deposit\/(?:detail|view)\/?$/i.test(u.pathname)&&u.searchParams.size===1&&['id','depositId'].some(k=>/^[1-9]\d{0,14}$/.test(u.searchParams.get(k)||''))}catch{return false}}
async function originalFile(file){if(!file?.blob)throw fail('Không tìm thấy file gốc trên trình duyệt này.',404);return new Response(file.blob,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(file.name||file.fileName)}`}})}
export async function localFetch(input,options={}){
 try{
  if(options.signal?.aborted)throw new DOMException('Đã hủy','AbortError');
  const url=new URL(String(input),globalThis.location?.origin||'https://local.invalid'),path=url.pathname,method=options.method||'GET';
  if(path==='/api/vouchers'&&method==='GET'){const code=voucherCode(url.searchParams.get('code'));return response(code?{voucher:await get('vouchers',code)||null}:{vouchers:await all('vouchers')});}
  if(!path.startsWith('/api/'))return nativeFetch(input,options);
  const body=typeof options.body==='string'?JSON.parse(options.body):options.body;
  if(path==='/api/policy-versions'){
   const active=await get('settings','policy-active'),current=active?.packId?await get('settings',active.packId):null;
   if(method==='GET')return response({schema:POLICY_SCHEMA,active:active??{version:0,packId:null},current,history:(await all('settings')).filter(s=>s.id.startsWith('policy-version:')).map(({rows,...s})=>({...s,rowCount:rows.length})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});
   if(method==='PATCH'){
    const pack=body.packId?await get('settings',body.packId):null;if(body.packId&&(!pack||!pack.id.startsWith('policy-version:')))throw fail('Không tìm thấy phiên bản cần khôi phục.');
    const saved=await activatePolicy(pack,body.version,{restore:true});resolvedPolicy=null;return response({active:saved});
   }
   if(method==='POST'){
    if(body.schema!==POLICY_SCHEMA||!['preview','apply'].includes(body.operation)||!Array.isArray(body.rows))throw fail('Bộ chính sách không đúng định dạng.');
    if(body.version!==(active?.version??0))throw fail('Chính sách đã đổi. Xem trước lại để áp đúng phiên bản.',409);
    const incoming=body.rows.map(r=>normalizePolicyRow(r)),initial=validatePolicyRows(incoming);
    const rows=initial.length?[]:stagePolicyUpdate(current?.rows??[],incoming),errors=initial.length?initial:validatePolicyRows(rows);
    if(body.operation==='preview')return response({rows:incoming,errors,totalRows:rows.length,version:active?.version??0,changedRows:incoming.length});
    if(errors.length)throw fail(errors.slice(0,10).join('\n'));
    if(typeof body.title!=='string'||!body.title.trim()||body.title.length>160)throw fail('Đặt tên cho phiên bản chính sách.');
    const pack={id:'policy-version:'+id(),schema:POLICY_SCHEMA,title:body.title.trim(),createdAt:now(),rows};
    const saved=await activatePolicy(pack,body.version);resolvedPolicy=null;return response({active:saved,packId:pack.id,rowCount:rows.length});
   }
  }
  if(path==='/api/bootstrap')return response(await bootstrap(url.searchParams.get('dataset')));
  if(path==='/api/workbook')return response(await loadWorkbook(url.searchParams.get('dataset')));
  if(path==='/api/datasets'&&method==='GET')return response({datasets:(await all('datasets')).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(datasetMeta)});
  if(path==='/api/source-files'&&method==='POST'){
   const name=url.searchParams.get('name')||'Nguồn';if(!(body instanceof Blob)||!body.size||body.size>20*1024*1024||!/^.{1,180}\.(xlsx|csv|tsv)$/i.test(name))throw fail('File nguồn cần XLSX/CSV/TSV, tối đa 20 MB.');
   const file={id:id(),name,blob:body,createdAt:now()};await put('files',file);return response({file:{id:file.id}});
  }
  if(path==='/api/datasets'&&method==='POST'){
   const problem=validateBundle(body.bundle);if(problem)throw fail(problem);
   if(!Array.isArray(body.fileIds)||body.fileIds.length>8)throw fail('Danh sách file gốc không hợp lệ.');
   for(const s of body.bundle.sources)if(!await get('files',body.fileIds[s.fileIndex]))throw fail('Cần lưu đủ từng file gốc trước khi lưu bộ nguồn.');
   const dataset={id:id(),fileName:'Bộ nguồn '+body.bundle.scope.from+' → '+body.bundle.scope.to,bundle:body.bundle,fileIds:body.fileIds,createdAt:now()};
   await ensureVouchers(body.bundle.cash.map(r=>r.cells.AO||''));await put('datasets',dataset);await put('settings',{id:'current',datasetId:dataset.id});return response({dataset:datasetMeta(dataset)});
  }
  if(path==='/api/datasets/file'){
   const d=await currentDataset(url.searchParams.get('id'));const fileId=url.searchParams.get('file')||d?.fileIds[0];if(!d?.fileIds.includes(fileId))throw fail('File không thuộc bộ nguồn này.');return originalFile(await get('files',fileId));
  }
  if(path==='/api/edits'&&method==='PATCH'){
   const {group,key}=await recordFor(body.datasetId,body.id);if(group.kind!=='contract')throw fail('Chứng từ chưa gắn CT không có khóa học riêng để chỉnh.');
   const patch=body.patch;if(!patch||typeof patch!=='object'||Object.keys(patch).some(k=>!['H','I','J','K','L','approved','verification','reviews'].includes(k)))throw fail('Đầu vào chỉnh sửa không hợp lệ.');
   for(const k of ['H','I','J','K','L'])if(own(patch,k)&&(typeof patch[k]!=='string'||patch[k].length>2000))throw fail('Đầu vào quá dài hoặc sai kiểu.');
   if(own(patch,'approved')&&typeof patch.approved!=='boolean')throw fail('Approved phải là lựa chọn có/không.');
   if(own(patch,'reviews')){const problem=validateReviews(patch.reviews);if(problem)throw fail(problem);}
   if(patch.verification){const problem=validateVerification(patch.verification);if(problem)throw fail(problem);for(const evidence of patch.verification.evidenceIds||[]){const e=await get('evidence',evidence);if(e?.recordKey!==key)throw fail('Minh chứng chưa được lưu đúng CT/học viên.');}}
   await ensureVouchers([patch.K||'']);const saved=await versioned('edits',key,body.version||0,()=>({patch,recordId:body.id,student:String(group.cells.F)}));return response({...saved,vouchers:await all('vouchers')});
  }
  if(path==='/api/vouchers'&&method==='PATCH'){
   const voucher=voucherInput(body.voucher),problem=validateVoucher(voucher);if(problem)throw fail(problem);voucher.code=voucherCode(voucher.code);const saved=await versioned('vouchers',voucher.code,body.version||0,()=>voucher);return response({voucher:saved,vouchers:await all('vouchers')});
  }
  if(path==='/api/hub-links'&&method==='GET'){
   const links=await all('links'),ct=url.searchParams.get('ct');return response({link:ct?links.find(l=>l.ct===ct)||null:null,links:ct?links.filter(l=>l.ct===ct):links});
  }
  if(path==='/api/hub-links'&&method==='PATCH'){
   const ct=String(body.ct||'').trim().toUpperCase();if(!/^[A-Z0-9]+-(?:CT|DEP)-\d{4,20}$/.test(ct)||!validHubURL(body.url,ct))throw fail('Dán đúng URL chi tiết Contract/Deposit trên https://hub24.apollo.vn:7777.');
   const saved=await versioned('links',ct,body.version||0,()=>({ct,url:body.url,source:body.source||'manual'}));return response({link:saved,...saved});
  }
  if(path==='/api/hub-input-progress'&&method==='GET'){
   const dataset=await currentDataset(url.searchParams.get('dataset'));if(!dataset)throw fail('Cần mở bộ nguồn trước khi lấy Input.');
   return response({run:await get('settings','hub-input-run:'+dataset.id)||null});
  }
  if(path==='/api/hub-input-progress'&&method==='PATCH'){
   const dataset=await currentDataset(body.datasetId);if(!dataset)throw fail('Cần mở bộ nguồn trước khi lưu tiến độ.');const key='hub-input-run:'+dataset.id,old=await get('settings',key);
   if(body.operation==='start'){
    if(typeof body.refresh!=='boolean'||!validInputTargets(body.targets))throw fail('Lượt đọc Input không hợp lệ.');
    const model=await datasetIndex(dataset.id);if(body.targets.some(t=>!model.students.has(t.ct+'|'+t.student)))throw fail('Có CT / học viên không thuộc bộ nguồn đang mở.');
    const next=newInputRun(old,body.targets,body.refresh,id(),!!body.reset),saved=await versioned('settings',key,body.version||0,()=>next);return response({run:saved});
   }
   if(body.operation==='complete'){
    if(!old||old.runId!==body.runId)throw fail('Lượt đọc đã thay đổi; bấm tiếp tục để tải tiến độ mới.',409);
    const source=await get('courseSources',body.ct);if(!source||source.version!==body.sourceVersion)throw fail('Cần lưu nguồn Input của CT trước khi lưu tiến độ.');
    const result=completeInputRun(old,body.ct,body.student,source),saved=await versioned('settings',key,body.version||0,()=>result.run);return response({run:saved,complete:result.complete,missing:result.missing});
   }
   throw fail('Thao tác lưu tiến độ không hợp lệ.');
  }
  if(path==='/api/course-sources'&&method==='PATCH'){
   const {model}=await recordFor(body.datasetId,'CT::'+body.payload?.ct);const payload=body.payload;
   if(body.hash!==model.hash||!model.students.has(payload.ct+'|'+String(payload.student)))throw fail('Nguồn Course info không khớp CT/học viên hiện tại.');
   const normalized=coursePayload(payload,payload);if(!normalized)throw fail('Thông tin đầu vào từ Hub không hợp lệ.');
   await ensureVouchers([normalized.giftcode??'']);
   const saved=await versioned('courseSources',payload.ct,body.version||0,old=>({...((old?.student===normalized.student&&old?.url===normalized.url&&old?.hubPolicy)?{hubPolicy:old.hubPolicy}:{}),...normalized,lastReadMissing:[...COURSE_FIELDS.filter(k=>normalized[k]==null)],...Object.fromEntries(COURSE_FIELDS.map(k=>[k,normalized[k]??(old?.student===normalized.student&&old?.url===normalized.url?old[k]:null)??null]))}));return response({source:saved,vouchers:await all('vouchers')});
  }
  if(path==='/api/evidence'&&method==='GET'){
   const {key}=await recordFor(url.searchParams.get('dataset'),url.searchParams.get('record'));const files=(await all('evidence')).filter(e=>e.recordKey===key).map(({blob,...e})=>e);return response({files});
  }
  if(path==='/api/evidence'&&method==='POST'){
   if(!(body instanceof FormData))throw fail('Minh chứng không hợp lệ.');const {key}=await recordFor(body.get('dataset'),body.get('record')),file=body.get('file');
   if(!(file instanceof Blob)||!file.size||file.size>5*1024*1024||!/\.(pdf|png|jpe?g|webp|xlsx|csv|tsv|txt|docx)$/i.test(file.name))throw fail('Minh chứng cần PDF, ảnh, Excel, CSV, TXT hoặc DOCX; tối đa 5 MB.');
   const saved={id:id(),recordKey:key,fileName:file.name,name:file.name,mimeType:file.type,size:file.size,createdAt:now(),blob:file};await put('evidence',saved);const {blob,...meta}=saved;return response({file:meta});
  }
  if(path==='/api/evidence/file')return originalFile(await get('evidence',url.searchParams.get('id')));
  return response({error:'Chức năng chưa được hỗ trợ.'},404);
 }catch(e){if(e.name==='AbortError')throw e;return response({error:e.message||'Chưa lưu được dữ liệu trên trình duyệt.',conflict:!!e.conflict},e.conflict?409:e.status||400)}
}
const own=(o,k)=>Object.hasOwn(o,k);
