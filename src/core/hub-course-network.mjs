import {courseRequest,coursePayload,COURSE_FIELDS} from './hub-course.mjs';
import {normalizeHubDiscount} from './hub-discount.mjs';
import {contractRoot,projectHubContract} from './hub-contract.mjs';
export {contractRoot,projectContractPayments,projectHubContract} from './hub-contract.mjs';
export {readHubPolicy} from './hub-policy.mjs';
export const COURSE_NETWORK_CHANNEL='promotion-hub/course-network/v1';
const HUB='https://hub24.apollo.vn:7777';
const text=v=>typeof v==='string'?v.trim().replace(/\s+/g,' '):'';
const numberId=v=>/^[1-9]\d{0,14}$/.test(String(v??''))?String(v):null;
export function courseDetailEndpoint(value,detailURL,method='GET'){
 try{
  const detail=new URL(detailURL),match=/^\/contract\/detail\/([1-9]\d{0,14})\/?$/i.exec(detail.pathname),u=new URL(value,HUB);
  if(detail.origin!==HUB||detail.search||detail.hash||!match||String(method).toUpperCase()!=='GET'||u.origin!==HUB||u.username||u.password||u.hash||!/\/GetContractDetail\/?$/i.test(u.pathname)||u.searchParams.getAll('contractId').length!==1||u.searchParams.get('contractId')!==match[1])return null;
  if([...u.searchParams.keys()].some(k=>/token|session|password|secret|credential|authorization|api.?key/i.test(k)))return null;
  const roles=u.searchParams.getAll('userRoleId');
  if(roles.length>1||roles.length&&!/^(?:0|[1-9]\d{0,14})$/.test(roles[0]))return null;
  // Reuse the actual Hub role context, never a guessed/default user ID.
  // Incidental filters/cache parameters and authentication values are discarded.
  u.search='';u.searchParams.set('contractId',match[1]);if(roles.length)u.searchParams.set('userRoleId',roles[0]);return u.href;
 }catch{return null;}
}
const pick=(obj,names)=>{
 if(!obj||typeof obj!=='object'||Array.isArray(obj))return undefined;
 for(const name of names){const key=Object.keys(obj).find(k=>k.toLowerCase()===name.toLowerCase());if(key!==undefined&&obj[key]!=null&&obj[key]!=='')return obj[key];}
 return undefined;
};
const scalar=(obj,names,max=200)=>{const value=pick(obj,names);return typeof value==='string'&&text(value).length<=max?text(value)||null:null;};
function listValue(value,limit){
 if(typeof value==='string'&&value.length<=128000&&/^\s*\[/.test(value)){try{value=JSON.parse(value);}catch{return null;}}
 return Array.isArray(value)&&value.length<=limit?value:null;
}
function offer(obj,names,arrays,itemNames,withGroup=false){
 const values=[];let absent=false,invalid=false;
 for(const name of names){const direct=scalar(obj,[name],2000);if(!direct||/^\s*[\[{]/.test(direct))continue;if(/^(?:0|none|n\/a|[-—]+)$/i.test(direct))absent=true;else values.push(direct);}
 for(const name of arrays){const raw=pick(obj,[name]);if(raw==null)continue;const list=listValue(raw,100);if(!list){invalid=true;continue;}if(!list.length)absent=true;
  for(const entry of list){let value=typeof entry==='string'?text(entry):scalar(entry,itemNames,2000);if(!value){invalid=true;continue;}
   const group=withGroup&&scalar(entry,['GroupDiscountName'],2000);
   if(group){const name=normalizeHubDiscount(value)??value,fold=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();value=fold(name).startsWith(fold(group))?name:group+' - '+name;}
   values.push(value);
  }
 }
 const result=[...new Set(values)].join(';');return invalid?null:result.length>2000?null:result|| (absent?'0':null);
}
function giftcodeValue(obj){
 let result=offer(obj,['GiftcodeNo','GiftCodeNumber','Giftcode'],['ListGiftCode','ListGiftcodes','GiftCodes'],['GiftcodeNo','GiftCodeNumber','GiftCode','Code']);
 const keys=Object.keys(obj??{}),key=name=>keys.find(k=>k.toLowerCase()===name.toLowerCase()),id=key('GiftCodeId'),code=key('GiftCode');
 const amounts=['GiftCodeDiscount','GiftCodeDiscountAmount','GiftCodeDiscountAmountMax'].map(key).filter(Boolean);
 const hasAmount=amounts.some(k=>obj[k]!=null&&obj[k]!==''&&Number(obj[k])!==0);
 if(result==='0'&&(id&&obj[id]!=null&&Number(obj[id])>0||hasAmount))result=null;
 if(result==null&&id&&code&&[null,0,'0'].includes(obj[id])&&[null,''].includes(obj[code])&&!hasAmount&&['ListGiftCode','ListGiftcodes','GiftCodes'].every(name=>{const raw=pick(obj,[name]);return raw==null||listValue(raw,100)?.length===0;}))result='0';
 return result;
}
function fields(obj){
 const namedDiscount=normalizeHubDiscount(offer(obj,['DiscountApply','DiscountApplyName','PromotionApply','PromotionApplyName'],['ListDiscountApply','ListDiscount','Discounts','ListPromotion','ListPromotionApply','PromotionApply'],['DiscountName','PromotionName','Name'],true));
 const displayedDiscount=normalizeHubDiscount(scalar(obj,['Discount'],2000),{wrappedOnly:true});
 let hours=pick(obj,['HourWeekName','HowweekName','HowWeekName','HoursPerWeek','HourPerWeek','HourWeek','HoursWeek']);
 if(typeof hours==='number'&&hours>0&&hours<=168)hours=hours+' hrs/week';
 if(typeof hours==='string'){hours=text(hours).replace(/^(\d+(?:[.,]\d+)?)\s*(?:giờ\s*\/\s*tuần|hours?\s*per\s*week)$/i,(_,n)=>n.replace(',','.')+' hrs/week');if(/^\d+(?:\.\d+)?$/.test(hours))hours+=' hrs/week';}
 if(typeof hours!=='string'||!/^\d+(?:\.\d+)?\s*(?:hrs?|hours?)\s*\/\s*week$/i.test(hours)||!(parseFloat(hours)>0&&parseFloat(hours)<=168))hours=null;
 return {courseFee:scalar(obj,['PriceName','CourseFeeKOC']),hoursPerWeek:hours,package:scalar(obj,['PackageBeforeDiscountName','PackageBeforeDiscount','ProductPackageName','PackageName','ProductPackage']),
  giftcode:giftcodeValue(obj),
  discount:namedDiscount&&namedDiscount!=='0'?namedDiscount:displayedDiscount??namedDiscount,
  groupKoc:scalar(obj,['GroupKOC','ProductGroupName']),contractType:scalar(obj,['ContractTypeName'])};
}
// Project only the requested course facts. No address, seller, receipt, token,
// cookie, or full JSON response crosses from the page into Promotion.
export function projectContractDetail(value,sourceURL,detailURL){
 const source=courseDetailEndpoint(sourceURL,detailURL);if(!source)return null;
 const root=contractRoot(value);
 if(root){
   const lists=['ListCourseInfo','CourseInfos'].map(k=>listValue(pick(root,[k]),20)).filter(Boolean),list=lists.find(l=>l.length)??lists[0];
   const id=pick(root,['ContractId','Id']),ct=scalar(root,['ContractNo','ContractCode','ContractNumber']),student=scalar(root,['StudentCode','StudentNo','StudentNumber','KidCode']);
   if(id!=null&&!numberId(id))return null;
   const facts=projectHubContract(root),rootFields=fields(root),discountPending=['ListDiscount','Discounts'].some(k=>root[k]!=null)&&rootFields.discount==null;
   return {source,contractId:id==null?null:numberId(id),ct:ct?.toUpperCase()??null,student,fields:rootFields,courses:list.map(row=>fields(row)),...(discountPending?{discountPending:true}:{}),...(facts?{hubContract:facts}:{})};
 }
 return null;
}
export function parseContractDetailProjection(projection,expected,domPayload=null){
 const request=courseRequest(expected);if(!request||!projection||!courseDetailEndpoint(projection.source,request.url))return {error:'identity'};
 const detailId=/\/([1-9]\d*)\/?$/.exec(request.url)[1];
 if(projection.contractId!=null&&projection.contractId!==detailId||projection.ct&&projection.ct!==request.ct)return {error:'identity'};
 if(projection.student&&projection.student!==request.student)return {error:'student'};
 if(!projection.ct&&!coursePayload(domPayload,request))return {error:'identity'};
 if(!Array.isArray(projection.courses)||projection.courses.length>1)return {error:projection.courses?.length?'conflict':'empty',fields:['courseFee','hoursPerWeek','package']};
 const root=projection.fields??{},course=projection.courses[0]??{},values={};
 for(const key of COURSE_FIELDS){
  if(key==='discount'){
   const offers=[course[key],root[key],domPayload?.[key]].filter(v=>v&&v!=='0');
   values[key]=offers.length?normalizeHubDiscount(offers.join(';')):projection.discountPending?null:[course[key],root[key],domPayload?.[key]].includes('0')?'0':null;
  }else if(key==='giftcode'){
   const codes=[...new Set([course[key],root[key],domPayload?.[key]].filter(v=>v&&v!=='0'))];
   if(codes.length>1)return {error:'conflict',fields:['giftcode']};
   values[key]=codes[0]??([course[key],root[key],domPayload?.[key]].includes('0')?'0':null);
  }else values[key]=course[key]??root[key]??domPayload?.[key]??null;
 }
 const empty=projection.courses.length===0;
 if(empty){for(const key of ['courseFee','hoursPerWeek','package'])values[key]=null;for(const key of ['giftcode','discount'])if(values[key]==='0')values[key]=null;}
 const payload=coursePayload({...request,...values,...(empty?{courseState:'empty'}:{}),...(projection.hubContract?{hubContract:projection.hubContract}:{}),...(projection.hubPolicy?{hubPolicy:projection.hubPolicy}:{}),...(projection.hubPolicyError?{hubPolicyError:projection.hubPolicyError}:{})},request);return payload?{payload,via:domPayload?'network+dom':'network'}:{error:'format'};
}
