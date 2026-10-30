import {normalizeHubDiscount} from './hub-discount.mjs';
import {weeklyHours,pricingIdentity} from './pricing-key.mjs';
import {validateHubPolicy,HUB_POLICY_ERRORS} from './hub-policy.mjs';
const HUB='https://hub24.apollo.vn:7777';
const text=v=>String(v??'').trim().replace(/\s+/g,' ');
const label=v=>text(v).replace(/[\s:*]+$/,'').replace(/\s*\/\s*/g,'/').toLowerCase();
export const courseLabel=v=>COURSE_LABELS[label(v)]??null;
export const COURSE_FIELDS=['courseFee','hoursPerWeek','package','giftcode','discount','groupKoc','contractType'];
export const COURSE_LABELS={
 'price name':'courseFee','course fee koc':'courseFee','hour/week':'hoursPerWeek','hours/week':'hoursPerWeek','hours per week':'hoursPerWeek',
 'package':'package','package before discount':'package','package (before discount)':'package','student id':'student','student code':'student',
 'giftcode no':'giftcode','giftcode no.':'giftcode','giftcode':'giftcode','gift code':'giftcode','discount apply':'discount','promotion apply':'discount','discount':'discount',
 'group koc':'groupKoc','contract type':'contractType',
 'contract no':'contract','contract no.':'contract','contract code':'contract','contract number':'contract'
};
// Read only explicitly labeled values, including Hub's read-only column layout.
// "Course fee" is money; only Price name / Course fee KOC identifies a price.
export function coursePageFromDocument(root,{staticDocument=false}={}){
 const visible=e=>!!e&&!e.hidden&&e.getAttribute?.('aria-hidden')!=='true'&&(!staticDocument?(!e.getClientRects||e.getClientRects().length>0):!e.closest?.('[hidden],[aria-hidden="true"],script,template'));
 const query=(e,s)=>[...e?.querySelectorAll?.(s)??[]];
 const controls='input:not([type="hidden"]):not([type="password"]),select,textarea';
 const valueOf=(element,key)=>{
  if(!visible(element)||courseLabel(element.textContent))return null;
  const inputs=['INPUT','SELECT','TEXTAREA'].includes(element.tagName)?[element]:query(element,controls).filter(visible);
  if(inputs.length){
   if(inputs.length!==1)return null;
   const input=inputs[0];if(['password','hidden'].includes(String(input.type).toLowerCase())||/token|session|pass|auth|secret|credential/i.test(input.name??''))return null;
   return input.tagName==='SELECT'?[...input.selectedOptions??[]].map(e=>e.textContent).join(';'):input.value;
  }
  if(query(element,'label,dt,th,.control-label').some(e=>visible(e)&&courseLabel(e.textContent)))return null;
  const value=element.innerText??element.textContent;
  return value;
 };
 const pairs=[];
 for(const node of query(root,'label,dt,th,td,.control-label,.form-label,[class*="col-"]')){
  const key=courseLabel(node.textContent);if(!key||!visible(node))continue;
  const id=node.getAttribute?.('for'),control=node.control||(id?root.getElementById?.(id):null);
  let value=control?valueOf(control,key):null;
  if(value==null){
   let current=node;
   for(let level=0;current&&level<4;level++,current=current.parentElement){
    if(['BODY','FORM','TABLE','FIELDSET'].includes(current.tagName))break;
    const sibling=current.nextElementSibling;
    if(sibling){value=valueOf(sibling,key);if(text(value))break;}
    const parent=current.parentElement;
    if(!parent||query(parent,'label,dt,th,.control-label,.form-label').filter(e=>visible(e)&&courseLabel(e.textContent)).length>1)break;
   }
  }
  if(key==='discount'&&!normalizeHubDiscount(value,{wrappedOnly:label(node.textContent)==='discount'}))continue;
  if(text(value))pairs.push({label:node.textContent,value:key==='discount'?String(value).trim():text(value)});
 }
 return {titles:query(root,'h1,h2,h3,h4,h5,h6,[role="heading"],.page-title,.content-header,.breadcrumb').filter(visible).map(e=>e.textContent),pairs};
}
export function courseFailure(reason,fields=[]){
 const messages={identity:'Không xác minh được duy nhất mã CT trên tiêu đề hoặc trường Contract code / Contract No.',student:'Student ID trên Hub không khớp học viên đang đối chiếu.',conflict:'Có nhiều giá trị khác nhau cho cùng trường Course info.',empty:'Chưa tìm thấy trường Course info có nhãn đọc được trên Hub.',format:'Định dạng dữ liệu Course info chưa hợp lệ.',loading:'Hub vẫn đang tải Course info khi hết thời gian chờ.',navigation:'Hub đã chuyển khỏi URL chi tiết CT được yêu cầu.'};
 const key=Object.hasOwn(messages,reason)?reason:'empty',known=fields.filter(f=>COURSE_FIELDS.includes(f));
 return {type:'error',code:'course_unavailable',message:messages[key]+(known.length?' Trường: '+known.join(', ')+'.':'')+' Chưa lưu dữ liệu CT này.',diagnostic:{stage:'course',reason:key,fields:known}};
}
export function courseRequest(v){
 if(!v||typeof v!=='object'||typeof v.ct!=='string'||typeof v.student!=='string'||typeof v.url!=='string')return null;
 const ct=v.ct.trim().toUpperCase(),student=v.student.trim();
 if(!/^[A-Z0-9]+-CT-\d{4,20}$/.test(ct)||!/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(student)||Object.hasOwn(Object.prototype,student))return null;
 try{const u=new URL(v.url);if(u.origin!==HUB||u.username||u.password||u.hash||u.search||!/^\/contract\/detail\/[1-9]\d{0,14}\/?$/i.test(u.pathname))return null;return {ct,student,url:u.href};}catch{return null;}
}
export function coursePayload(v,expected){
 const request=courseRequest(expected);
 if(!request||!v||typeof v!=='object'||Object.keys(v).some(k=>!['ct','student','url','hubPolicy','hubPolicyError',...COURSE_FIELDS].includes(k))||v.ct!==request.ct||v.student!==request.student||v.url!==request.url)return null;
 const result={...request};
 for(const key of COURSE_FIELDS){
  if(v[key]!=null&&(typeof v[key]!=='string'||!text(v[key])||text(v[key]).length>(key==='discount'?2000:200)))return null;
  result[key]=v[key]==null?null:key==='discount'?normalizeHubDiscount(v[key]):text(v[key]);
 }
 if(!COURSE_FIELDS.some(k=>result[k]!==null))return null;
 if(result.giftcode&&/^\d[\d.,\s]*\s*(?:vnd|vnđ|đ|₫|%)$/i.test(result.giftcode))result.giftcode=null;
 if(result.hoursPerWeek){const hours=weeklyHours(result.hoursPerWeek);if(!(hours>0&&hours<=168))return null;result.hoursPerWeek=hours+' hrs/week';}
 if(result.hoursPerWeek&&!(parseFloat(result.hoursPerWeek)>0&&parseFloat(result.hoursPerWeek)<=168))return null;
 const identity=pricingIdentity(result.courseFee,result.hoursPerWeek,result.package);if(identity.unit==='weeks'&&identity.weeks)result.package=identity.weeks+' weeks';
 if(!result.package&&identity.paymentMode==='once'&&identity.courseMonths&&identity.variant==='standard')result.package=identity.courseMonths+' months';
 if(v.hubPolicy!=null){if(!validateHubPolicy(v.hubPolicy)||v.hubPolicy.ct!==request.ct||String(v.hubPolicy.contractId)!==request.url.replace(/\/$/,'').split('/').pop())return null;result.hubPolicy=v.hubPolicy;}
 if(v.hubPolicyError!=null){if(!HUB_POLICY_ERRORS.includes(v.hubPolicyError))return null;result.hubPolicyError=v.hubPolicyError;}
 return result;
}
export function parseCoursePage(page,expected){
 const request=courseRequest(expected);if(!request||page.url!==request.url)return {error:'identity'};
 const identity=[...(page.titles??[]),...(page.pairs??[]).filter(p=>courseLabel(p.label)==='contract').map(p=>p.value)];
 const codes=[...new Set(identity.flatMap(t=>text(t).match(/[A-Z0-9]+-CT-\d{4,20}\b/gi)??[]).map(v=>v.toUpperCase()))];
 if(codes.length!==1||codes[0]!==request.ct)return {error:'identity'};
 const pairs=page.pairs??[],hasBefore=pairs.some(p=>/before discount/i.test(p.label)&&COURSE_LABELS[label(p.label)]==='package'),values={};
 for(const pair of pairs){
  const key=COURSE_LABELS[label(pair.label)];if(!key||key==='contract'||hasBefore&&key==='package'&&!/before discount/i.test(pair.label))continue;
  let value=key==='discount'?normalizeHubDiscount(pair.value,{wrappedOnly:label(pair.label)==='discount'}):text(pair.value);if(!value)continue;
  if(['giftcode','discount'].includes(key)&&/^(?:0|[-—]+|none|no (?:giftcode|discount)|n\/a)$/i.test(value))value='0';
  else if(/^[-—]+$/.test(value)||value==='0')continue;
  (values[key]??=new Set()).add(value);
 }
 const conflicts=Object.entries(values).filter(([k,s])=>k!=='discount'&&s.size>1).map(([k])=>k);
 if(conflicts.length)return {error:'conflict',fields:conflicts};
 if(values.student&&[...values.student][0]!==request.student)return {error:'student'};
 const payload=coursePayload({...request,...Object.fromEntries(COURSE_FIELDS.map(k=>[k,values[k]?[...values[k]].join(k==='discount'?';':''):null]))},request);
 return payload?{payload}:{error:COURSE_FIELDS.some(k=>values[k])?'format':'empty',fields:COURSE_FIELDS.filter(k=>values[k])};
}
export function missingContractInputs(row){
 if(row?.kind!=='contract'||!String(row.ct||row.cells?.contractTotal||'').includes('-CT-'))return [];
 const c=row.cells??{},missing=['H','I','J'].filter(k=>!text(c[k]));
 if(!text(c.K)||text(c.K)==='0'&&(Number(c.V)>0||text(row.context?.voucherDescription)&&text(row.context.voucherDescription)!=='0'))missing.push('K');
 if(!text(c.L)||text(c.L)==='0'&&Number(c.U)>0)missing.push('L');
 return missing;
}
export function contractInputPlan(rows,{refresh=false,completed=[],needsVoucher=()=>false,needsPolicy=()=>false}={}){
 const unique=new Map(),students=new Map();
 for(const row of rows??[]){const ct=text(row.ct||row.cells?.contractTotal),student=text(row.cells?.F);if(row.kind!=='contract'||!/^[A-Z0-9]+-CT-\d{4,20}$/.test(ct)||!/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(student)||Object.hasOwn(Object.prototype,student))continue;(students.get(ct)??(students.set(ct,new Set()),students.get(ct))).add(student);unique.set(ct+'|'+student,row);}
 const done=new Set(completed);
 return [...unique.values()].filter(r=>(refresh||missingContractInputs(r).length>0||needsVoucher(r)||needsPolicy(r))&&students.get(text(r.ct||r.cells.contractTotal)).size===1&&!done.has(text(r.ct||r.cells.contractTotal)+'|'+text(r.cells.F)));
}
export async function fillContractInputs(rows,io){
 const results=[];
 for(const row of rows){
  if(io.signal?.aborted)break;
  const ct=text(row.ct||row.cells.contractTotal),student=text(row.cells.F);
  let stage='input';
  try{
   io.progress?.('Đang lấy Input theo '+ct+'…');
   let link=await io.loadLink(ct);
   if(!courseRequest({ct,student,url:link?.url??''})){
    const found=await io.lookup(ct);if(io.signal?.aborted)break;
    if(found.ct!==ct||!courseRequest({ct,student,url:found.url}))throw Error('Link Hub không khớp CT nhận.');
    link=await io.saveLink({ct,url:found.url,version:link?.version??0});
   }
   if(io.signal?.aborted)break;
   const expected={ct,student,url:link.url},payload=coursePayload(await io.read(expected),expected);
   if(!payload)throw Error('Thông tin trả về không khớp CT / Student ID.');
   if(io.signal?.aborted)break;
   const saved=await io.save(row,payload);
   stage='voucher';
   const completion=await io.afterSave?.(row,payload,saved);
   stage='checkpoint';
   const checkpoint=await io.checkpoint?.(row,payload,saved);
   results.push({ct,status:checkpoint?.complete===false?'partial':'saved',fields:[...COURSE_FIELDS.filter(k=>payload[k]!==null),...(payload.hubPolicy?['hubPolicy']:[])],missing:checkpoint?.missing??[],hubPolicyError:payload.hubPolicyError??null,...(completion?{voucher:completion}:{})});io.saved?.(row,payload);
  }catch(e){
   if(io.signal?.aborted)break;
   const skippedVoucher=stage==='voucher'&&(['timeout','hub_timeout'].includes(e.code)||/^voucher_/.test(e.code??''));
   results.push({ct,status:'check',message:String(e.message??e)+(skippedVoucher?' Bỏ qua Voucher của CT này trong lượt hiện tại; tiếp tục CT khác. CT còn thiếu sẽ được thử lại khi lấy tiếp.':''),...(skippedVoucher?{voucher:{state:'unavailable'}}:{})});
   if(!skippedVoucher&&!['index_unresolved','not_found','course_invalid','course_empty','course_unavailable'].includes(e.code))break;
  }
  io.update?.([...results]);
 }
 return results;
}
