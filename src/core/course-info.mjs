// Course evidence is independent of receipts. Never infer hours from cash or
// total hours, nor copy the package of a retired/intermediate CT.
import {pricingIdentity,weeklyHours,priceText,packageIdentity,isWeeklyCourse} from './pricing-key.mjs';
import {normalizeHubDiscount} from './hub-discount.mjs';
import {validateHubPolicy} from './hub-policy.mjs';
import {validateHubContract} from './hub-contract.mjs';
const columns={H:'courseFee',I:'hoursPerWeek',J:'package',K:'giftcode',L:'discount'};
const text=v=>String(v??'').trim();
const present=v=>v!==null&&v!==undefined&&!['','0','-','—','N/A'].includes(text(v).toUpperCase());
const NO_CT='Chưa có dòng hóa đơn CT trong RAW_REPORT';
function valueKey(col,value,course){
 if(col==='H'){const c=pricingIdentity(value,'','');if(c.group&&c.year&&(c.layer!=null||c.variant==='weekly')&&!c.conflicts.length)return [c.group,c.year,c.layer??0,c.variant,weeklyHours(value)??''].join('|');}
 if(col==='I'){const h=weeklyHours(value);if(h)return String(h);}
 if(col==='J'){const p=packageIdentity(value,{weekly:isWeeklyCourse(course)});if(p.key!=null)return p.variant+'|'+p.key;}
 if(col==='L')return (normalizeHubDiscount(value)??text(value)).split(';').map(priceText).sort().join(';');
 return text(value);
}
export function resolveCourseInfo(candidates){
 const values={},fields={},warnings=[];
 for(const col of Object.keys(columns)){
  const available=candidates.filter(r=>present(r[col])||['K','L'].includes(col)&&text(r[col])==='0');
  let rows=available.some(r=>!r.fallback)?available.filter(r=>!r.fallback):available;
  const hubRows=['K','L'].includes(col)?rows.filter(r=>r.hub):[];
  // Never promote an intermediary CT's offer over the receiving CT. Within
  // that CT, a named program/code can fill a source's empty applied list.
  const applied=rows.filter(r=>present(r[col]));if(['K','L'].includes(col)&&applied.length&&!hubRows.length)rows=applied;
  const distinct=[...new Set(rows.map(r=>valueKey(col,r[col],values.H??r.H)))];
  const named=col==='H'?[...new Set(rows.map(r=>pricingIdentity(r.H,'','').courseMonths).filter(v=>v!=null))]:[];
  const best=col==='H'?[...rows].sort((a,b)=>Number(!!pricingIdentity(b.H,'','').courseMonths)-Number(!!pricingIdentity(a.H,'','').courseMonths))[0]:rows[0];
  const latestHub=rows.filter(r=>r.hub);
  // Keep the current receiving CT's offer visible when an older report differs.
  // Retain both references and the blocking conflict for explicit verification.
  values[col]=latestHub.length===1?text(latestHub[0][col]):distinct.length===1&&named.length<2?text(best[col]):null;
  fields[col]=rows.map(r=>({value:text(r[col]),ref:r.ref}));
  if(distinct.length>1||named.length>1)warnings.push(`${col}: thông tin khóa học/ưu đãi khác nhau trong cùng CT; cần đối chiếu nguồn tại dòng tổng`);
 }
 const identity=pricingIdentity(values.H,values.I,values.J);if(identity.unit==='weeks'&&identity.weeks)values.J=identity.weeks+' weeks';
 if(!values.J&&identity.paymentMode==='once'&&identity.courseMonths&&identity.variant==='standard'){values.J=identity.courseMonths+' months';fields.J=fields.H.map(f=>({...f,value:values.J,derivedFrom:'Course fee KOC'}));}
 return {values,fields,warnings,complete:['H','I','J'].every(k=>present(values[k]))};
}
export function applyCourseInfo(book,group,hubSources=[]){
 if(!group.ct)return;
 if(!group.hubInputBase)group.hubInputBase={G:group.raw.G,X:group.raw.X};
 Object.assign(group.raw,group.hubInputBase);
 const exact=(book.extensions.courseEvidence??[]).filter(e=>e.ct===group.ct&&e.student===String(group.cells.F));
 const candidates=[...(group.courseCandidates??[]),...exact.map(e=>({...Object.fromEntries(Object.entries(columns).map(([col,key])=>[col,e[key]??null])),ref:e.ref})),
  ...hubSources.filter(e=>e.ct===group.ct&&e.student===String(group.cells.F)).map(e=>({H:e.courseFee,I:e.hoursPerWeek,J:e.package,K:e.giftcode,L:normalizeHubDiscount(e.discount),hub:true,ref:{file:'Hub · '+e.ct,sheet:'Contract inputs',url:e.url}}))];
 const course=resolveCourseInfo(candidates);
 Object.assign(group.cells,course.values);group.courseInfo=course;
 group.warnings=group.warnings.filter(w=>!w.startsWith(NO_CT)&&!Object.keys(columns).some(k=>w.startsWith(k+':'))&&!/^(?:groupKoc|contractType):/.test(w));
 group.warnings.push(...course.warnings);
 group.hubOfferPending=hubSources.some(e=>e.ct===group.ct&&e.student===String(group.cells.F))?{discount:!text(course.values.L),giftcode:!text(course.values.K)}:null;
 if(group.noCTInvoice&&!course.complete)group.warnings.push(NO_CT+'; bổ sung các trường khóa học còn thiếu từ CT nhận / Export');
 if(exact.length===1){const e=exact[0];if(e.center)group.cells.B=e.center;if(e.centerName)group.cells.A=e.centerName;if(e.contractType)group.raw.G=e.contractType;}
 const hub=hubSources.filter(e=>e.ct===group.ct&&e.student===String(group.cells.F));
 const policies=hub.filter(e=>validateHubPolicy(e.hubPolicy)&&e.hubPolicy.ct===group.ct);
 group.hubPolicy=policies.length===1?policies[0].hubPolicy:null;
 group.hubPolicyError=hub.find(e=>e.hubPolicyError)?.hubPolicyError??null;
 group.hubReadMissing=hub.length===1?(hub[0].lastReadMissing??[]):[];
 group.hubContract=hub.length===1&&validateHubContract(hub[0].hubContract)?hub[0].hubContract:null;
 for(const [field,col]of [['groupKoc','X'],['contractType','G']]){const known=[...new Set(hub.map(e=>text(e[field])).filter(Boolean))];if(known.length===1&&!text(group.raw[col]))group.raw[col]=known[0];else if(known.length>1||known.length===1&&text(group.raw[col])&&text(group.raw[col])!==known[0])group.warnings.push(field+': thông tin trên Hub khác nguồn CT; cần đối chiếu.');}
}
export function withCourseSources(book,sources){
 // Callers load their own freshly built workbook. Original source grids and
 // stored manual patches remain untouched; sources are scoped before this call.
 const indexed=new Map();for(const source of sources){const key=source.ct+'|'+source.student;const bucket=indexed.get(key)??[];bucket.push(source);indexed.set(key,bucket);}
 for(const group of book.contractGroups)applyCourseInfo(book,group,indexed.get(group.ct+'|'+String(group.cells.F))??[]);
 return book;
}
