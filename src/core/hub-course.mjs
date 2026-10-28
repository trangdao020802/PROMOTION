const HUB='https://hub24.apollo.vn:7777';
const text=v=>String(v??'').trim().replace(/\s+/g,' ');
const label=v=>text(v).replace(/\s*[:*]\s*$/,'').toLowerCase();
export const courseLabel=v=>COURSE_LABELS[label(v)]??null;
export const COURSE_FIELDS=['courseFee','hoursPerWeek','package','giftcode','discount','groupKoc','contractType'];
export const COURSE_LABELS={
 'price name':'courseFee','course fee koc':'courseFee','course fee':'courseFee','hour/week':'hoursPerWeek','hours/week':'hoursPerWeek','hours per week':'hoursPerWeek',
 'package':'package','package before discount':'package','package (before discount)':'package','student id':'student','student code':'student',
 'giftcode no':'giftcode','giftcode no.':'giftcode','giftcode':'giftcode','gift code':'giftcode','discount apply':'discount','promotion apply':'discount',
 'group koc':'groupKoc','contract type':'contractType'
};
export function courseRequest(v){
 if(!v||typeof v!=='object'||typeof v.ct!=='string'||typeof v.student!=='string'||typeof v.url!=='string')return null;
 const ct=v.ct.trim().toUpperCase(),student=v.student.trim();
 if(!/^[A-Z0-9]+-CT-\d{4,20}$/.test(ct)||!/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(student)||Object.hasOwn(Object.prototype,student))return null;
 try{const u=new URL(v.url);if(u.origin!==HUB||u.username||u.password||u.hash||u.search||!/^\/contract\/detail\/[1-9]\d{0,14}\/?$/i.test(u.pathname))return null;return {ct,student,url:u.href};}catch{return null;}
}
export function coursePayload(v,expected){
 const request=courseRequest(expected);
 if(!request||!v||typeof v!=='object'||Object.keys(v).some(k=>!['ct','student','url',...COURSE_FIELDS].includes(k))||v.ct!==request.ct||v.student!==request.student||v.url!==request.url)return null;
 const result={...request};
 for(const key of COURSE_FIELDS){
  if(v[key]!=null&&(typeof v[key]!=='string'||!text(v[key])||text(v[key]).length>(key==='discount'?2000:200)))return null;
  result[key]=v[key]==null?null:text(v[key]);
 }
 if(!COURSE_FIELDS.some(k=>result[k]!==null))return null;
 if(result.hoursPerWeek&&!/^\d+(?:\.\d+)?\s*(?:hrs?|hours?)\s*\/\s*week$/i.test(result.hoursPerWeek))return null;
 if(result.hoursPerWeek&&!(parseFloat(result.hoursPerWeek)>0&&parseFloat(result.hoursPerWeek)<=168))return null;
 return result;
}
export function parseCoursePage(page,expected){
 const request=courseRequest(expected);if(!request||page.url!==request.url)return {error:'identity'};
 const codes=[...new Set((page.titles??[]).flatMap(t=>text(t).match(/[A-Z0-9]+-CT-\d{4,20}\b/gi)??[]).map(v=>v.toUpperCase()))];
 if(codes.length!==1||codes[0]!==request.ct)return {error:'identity'};
 const pairs=page.pairs??[],hasBefore=pairs.some(p=>/before discount/i.test(p.label)&&COURSE_LABELS[label(p.label)]==='package'),values={};
 for(const pair of pairs){
  const key=COURSE_LABELS[label(pair.label)];if(!key||hasBefore&&key==='package'&&!/before discount/i.test(pair.label))continue;
  let value=text(pair.value);if(!value)continue;
  if(['giftcode','discount'].includes(key)&&/^(?:0|[-—]+|none|no (?:giftcode|discount)|n\/a)$/i.test(value))value='0';
  else if(/^[-—]+$/.test(value)||value==='0')continue;
  (values[key]??=new Set()).add(value);
 }
 if(Object.entries(values).some(([k,s])=>k!=='discount'&&s.size>1))return {error:'conflict'};
 if(values.student&&[...values.student][0]!==request.student)return {error:'identity'};
 const payload=coursePayload({...request,...Object.fromEntries(COURSE_FIELDS.map(k=>[k,values[k]?[...values[k]].join(k==='discount'?';':''):null]))},request);
 return payload?{payload}:{error:'empty'};
}
export function missingContractInputs(row){
 if(row?.kind!=='contract'||!String(row.ct||row.cells?.contractTotal||'').includes('-CT-'))return [];
 const c=row.cells??{},missing=['H','I','J'].filter(k=>!text(c[k]));
 if(!text(c.K)&&(Number(c.V)>0||text(row.context?.voucherDescription)&&text(row.context.voucherDescription)!=='0'))missing.push('K');
 if(!text(c.L)&&Number(c.U)>0)missing.push('L');
 return missing;
}
export function contractInputPlan(rows,{refresh=false}={}){
 const unique=new Map(),students=new Map();
 for(const row of rows??[]){const ct=text(row.ct||row.cells?.contractTotal),student=text(row.cells?.F);if(row.kind!=='contract'||!/^[A-Z0-9]+-CT-\d{4,20}$/.test(ct)||!/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(student)||Object.hasOwn(Object.prototype,student))continue;(students.get(ct)??(students.set(ct,new Set()),students.get(ct))).add(student);unique.set(ct+'|'+student,row);}
 return [...unique.values()].filter(r=>(refresh||missingContractInputs(r).length>0)&&students.get(text(r.ct||r.cells.contractTotal)).size===1);
}
export async function fillContractInputs(rows,io){
 const results=[];
 for(const row of rows){
  if(io.signal?.aborted)break;
  const ct=text(row.ct||row.cells.contractTotal),student=text(row.cells.F);
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
   await io.save(row,payload);results.push({ct,status:'saved',fields:COURSE_FIELDS.filter(k=>payload[k]!==null)});io.saved?.(row,payload);
  }catch(e){
   if(io.signal?.aborted)break;
   results.push({ct,status:'check',message:String(e.message??e)});
   if(!['index_unresolved','not_found','course_invalid','course_empty','course_unavailable'].includes(e.code))break;
  }
  io.update?.([...results]);
 }
 return results;
}
