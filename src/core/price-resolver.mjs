// One selector owns the price, benefits, dates and unresolved-policy state.
// Catalogue rows and Contract calculations must both use priceFor().
import {packageKey} from './contracts.mjs';
import {discountOffers,discountPolicyMatch,regularTwoMonthPrice} from './promotions.mjs';
import {auditPriceFor,auditPackageKey} from './audit-policy.mjs';
import {dateSerial} from './verification.mjs';
import {pricingIdentity,canonicalCourseName,priceText,isWeeklyCourse} from './pricing-key.mjs';
import {matchTypedPrice} from './policy-pack.mjs';
import {PRICE_PHASES,roadmapSchedule} from './price-schedule.mjs';
import {policyMatchesInputs} from './hub-policy.mjs';
const number=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>String(x??'').trim();
const unique=a=>[...new Set(a.filter(x=>x!==null&&x!==undefined&&x!==''))];
const between=(d,a,b)=>number(d)&&d>=dateSerial(a)&&d<dateSerial(b)+1;
export function priceFor(data,cells,context={}){
 const selected=selectPrice(data,cells,context)??{issue:'CHECK - CHƯA CÓ RULE / ĐỦ ĐẦU VÀO'};
 const identity=selected.identity??pricingIdentity(cells.H,cells.I,cells.J,context),phase=PRICE_PHASES[selected.regime??selected.phase];
 const result={hours:identity.hours,layer:identity.layer,pkg:identity.packageKey,months:identity.months,monthly:null,gross:null,discount:null,net:null,maxTerms:null,straight:null,loyalty:null,referral:null,from:phase?.from??null,to:phase?.to??null,
  ...selected,identity,key:selected.key??identity.key};
 result.unit=identity.unit;result.weeks=identity.weeks;
 if(identity.variant==='weekly'){result.months=null;result.monthly=null;result.unitPrice=number(result.gross)&&identity.weeks>0?result.gross/identity.weeks:null;}
 result.net=number(result.gross)&&number(result.discount)?result.gross-result.discount:null;
 if(!result.override&&policyMatchesInputs(context.hubPolicy,cells,context)){
  const snapshot=context.hubPolicy,p=snapshot.product;
  const conflict=number(result.gross)&&Math.abs(result.gross-p.unitPrice*p.units)>1;
  const replaceable=/^CHECK - (?:CHƯA CÓ|GÓI ĐẶC THÙ GIÁ|COMBO SUMMER|VTDH:|ƯU ĐÃI GÓI LẺ CẦN RULE)/.test(result.issue??'');
  const guard=result.issue&&!replaceable?result.issue:null;
  return {...result,hub:true,short:false,unit:p.typeId===2?'weeks':'months',months:p.typeId===1?p.units:null,weeks:p.typeId===2?p.units:null,monthly:p.typeId===1?p.unitPrice:null,unitPrice:p.unitPrice,gross:p.unitPrice*p.units,
   issue:conflict?'CHECK - GIÁ HUB KHÁC CHÍNH SÁCH ĐANG ÁP DỤNG':guard,
   refs:[{file:'Hub · '+snapshot.ct,sheet:'GetCoursePrice',row:p.priceId,url:'https://hub24.apollo.vn:7777/contract/detail/'+snapshot.contractId},...(result.refs??[])],hubSnapshot:snapshot};
 }
 if(!result.refs?.length){
  const prices=data.policy.prices??[],exact=prices.filter(r=>r.C===cells.H&&r.D===cells.I&&r.E===cells.J);
  result.refs=(exact.length?exact:prices.filter(r=>pricingIdentity(r.C,r.D,r.E).key===identity.key)).map(r=>({file:'Bang_gia_chung_doi_chieu_Report.xlsx',sheet:'Bảng giá chung',row:r.row}));
 }
 return result;
}
// These are the same inputs a user can enter in the Contract detail form.
// Keep edition, trial, payment-stage and class-size facts in their own keys.
export function typedPriceInputs(row){
 const family=row.group==='ATLS/AGLS'?'ATLS':row.group;
 let course=row.course||(row.variant==='weekly'&&row.layer===0?`${family} - New Price ${row.year} (Nationwide)`:row.variant==='premium'&&row.layer===0?`${family} - New Price ${row.year}`:`${family} - New Price ${row.year} - Layer ${row.layer}`);
 if(row.variant==='vtdh'&&!/vtdh|vung tin dong hanh/.test(priceText(course)))course+=' VTDH';
 if(row.variant==='ahp'&&!/ahp/.test(priceText(course)))course+=' AHP';
 if(row.variant==='weekly'&&!isWeeklyCourse(course))course+=' (gói tuần)';
 if(row.variant==='premium')course+=' Group '+String(row.packageKey).split('|')[0]+' persons';
 const edition=/^([^|]+)\|[\d.]+M$/.exec(String(row.packageKey))?.[1];
 const pkg=row.package??(row.variant==='split'?`${row.months} months siblings`:row.variant==='weekly'?String(row.packageKey).replace('WEEKS','weeks'):`${row.months} months${row.variant==='trial'?' trial':row.variant==='upgrade'?' upgrade':row.variant==='summer'?' ('+(edition??'Summer')+')':''}`);
 return {cells:{H:course,I:row.hours+' hrs/week',J:pkg,D:dateSerial(row.from),L:row.discountLabels?.[0]??'0',B:row.center&&row.center!=='*'?row.center:null},
  context:{group:family,contractType:row.contractType&&row.contractType!=='*'?row.contractType:row.variant==='weekly'?'Renew':'New'}};
}
function selectPrice(data,cells,context){
 const identity=pricingIdentity(cells.H,cells.I,cells.J,context);
 if(/vtdh|vung tin dong hanh/.test(priceText(cells.L))&&identity.variant==='standard'){identity.variant='vtdh';identity.key=identity.key.replace('|standard|','|vtdh|');}
 const typed=matchTypedPrice(data.policy,identity,cells.D,{...context,center:cells.B});
 if(identity.conflicts.length)return {identity,key:identity.key,gross:null,discount:null,maxTerms:null,refs:[],issue:'CHECK - KHÓA GIÁ MÂU THUẪN: '+identity.conflicts.join(', ')};
 if(typed)return typed;
 const canonical=canonicalCourseName(identity);
 if(canonical&&identity.year===2026&&['standard','ahp','split'].includes(identity.variant)){
  const normalized={...cells,H:canonical,I:identity.hours+' hrs/week',J:identity.variant==='split'?String(identity.packageKey):identity.months+' months'};
  // AHP uses Layer 2 from 17/03/2026, explicitly stated in the primary policy.
  if(identity.variant==='ahp'&&cells.D<dateSerial('2026-03-17'))return {identity,key:identity.key,refs:[],gross:null,discount:null,issue:'CHECK - AHP LAYER 2 CHỈ ÁP DỤNG TỪ 17/03/2026'};
  const result=standardPriceFor(data,normalized,{...context,group:'ATLS'});
  if(result)return {...result,identity,key:identity.key,refs:[...result.refs,...(identity.variant==='ahp'?[{file:'2026 Price & Promotion - update 10.10.26.xlsx',sheet:'Thông tin khác (Trả góp,AHP,Đặc',row:93}]:[])]};
 }
 if(identity.variant==='summer')return {identity,key:identity.key,refs:[],gross:null,discount:null,maxTerms:null,issue:'CHECK - COMBO SUMMER: '+identity.key+'. Cần bảng đúng S26/S26-2, kỳ hiệu lực và phân bổ học phí hè; bảng đề xuất không thay bản đã duyệt. Bổ sung tại Cập nhật chính sách.'};
 if(identity.variant==='upgrade'||identity.year===2024&&identity.months===15)return {identity,key:identity.key,refs:[],gross:null,discount:null,maxTerms:null,issue:'CHECK - UPSELL 15 THÁNG: cần gói 18 tháng gốc, khoản gói trải nghiệm trước đó và căn cứ giá giữ lại; không nhân đơn giá 12/18 tháng tùy ý. Bổ sung quy tắc đúng CT tại Cập nhật chính sách.'};
 if(identity.year===2024&&identity.variant==='vtdh')return {identity,key:identity.key,refs:[],gross:null,discount:null,maxTerms:null,issue:'CHECK - VTDH2024: cần lịch thanh toán gốc P.12M/P.18M và căn cứ tiếp tục CT cũ. Văn bản 2025 ghi dừng áp dụng mới từ 14/01/2026; không thay bằng lộ trình VTDH2026.'};
 if(identity.year===2024)return {identity,key:identity.key,refs:[],gross:null,discount:null,maxTerms:null,issue:'CHECK - GÓI ĐẶC THÙ GIÁ 2024: '+identity.key+'. Các gói chuẩn đã có giá; bổ sung căn cứ đúng gói này tại Cập nhật chính sách.'};
 if(identity.variant==='vtdh')return {identity,key:identity.key,refs:[],gross:null,discount:null,maxTerms:null,issue:'CHECK - VTDH: cần năm/layer/giờ và gói CT 2 tháng hoặc kỳ cuối 10 tháng; gói 18 tháng đóng một lần dùng bảng thường.'};
 if(identity.year&&canonical)return {identity,key:identity.key,refs:[],gross:null,discount:null,maxTerms:null,issue:'CHECK - CHƯA CÓ GIÁ CHO KHÓA '+identity.key+': bổ sung đúng phiên bản, gói và ngày hiệu lực trong Cập nhật chính sách.'};
 return standardPriceFor(data,cells,context);
}
function standardPriceFor(data,cells,context){
 const course=text(cells.H),hours=Number(/^([34])\s*(?:hrs|hours|giờ)/i.exec(text(cells.I))?.[1]),date=cells.D,pkg=auditPackageKey(cells.J,cells.L,date,packageKey(cells.J),data.policy.auditPolicy);
 const layer=Number(/^(?:ATLS|AGLS) - New Price 2026 - Layer ([123])$/i.exec(course)?.[1]);
 // A named September cash offer owns its fixed VND column. An October
 // invoice can require approval, but cannot change that offer into Q4's rate.
 const septemberCash=discountOffers(cells.L).some(label=>['BBSEP26_CASH','BBSEP26_STRAIGHT'].includes(discountPolicyMatch(label,date).ruleKey));
 if(septemberCash){
  if(!/^ATLS\b/i.test(course)||text(context.group).toUpperCase()!=='ATLS'||/VTDH|vững tin/i.test([course,cells.J,cells.L].join(' ')))return null;
  const schedule=roadmapSchedule(data.policy,{layer,hours,pkg,phase:'september'});if(!schedule)return null;
  return {...schedule,policyKey:'BBSEP26_CASH',issue:schedule.issue??(between(date,'2026-09-01','2026-09-30')?null:'CHECK - NGOÀI THỜI KỲ DISCOUNT BIG BANG SEP')};
 }
 const separatePolicy=/VTDH|vững tin/i.test([course,cells.J,cells.L].join(' '));
 const phase=between(date,'2026-10-06','2026-12-31')?'q4':between(date,'2026-10-01','2026-10-05')?'october':between(date,'2026-03-01','2026-09-30')?'base':null;
 if(phase&&!separatePolicy&&/^ATLS\b/i.test(course)&&text(context.group).toUpperCase()==='ATLS'){
  const schedule=roadmapSchedule(data.policy,{layer,hours,pkg,phase});
  if(schedule){const tooEarly=phase==='base'&&date<dateSerial(/^new$/i.test(text(context.contractType))?'2026-03-01':'2026-03-17');return {...schedule,issue:schedule.issue??(tooEarly?'CHECK - CHƯA ĐẾN NGÀY ÁP DỤNG GIÁ 2026':null)};}
 }
 if(data.policy.auditPolicy){const matched=auditPriceFor(data,{course,hours,pkg,date,layer,cells,context});if(matched)return matched;}
 if(layer&&hours&&pkg===2&&phase&&!separatePolicy){const trial=regularTwoMonthPrice(data,{course,hours:cells.I,package:cells.J,group:context.group});if(trial)return {hours,pkg,layer,phase,months:2,gross:trial.amount,maxTerms:0,discount:0,straight:0,loyalty:0,referral:0,refs:trial.refs}}
 const choices=data.policy.prices.filter(r=>r.C===course&&r.D===text(cells.I)&&r.E===text(cells.J)&&number(r.J)&&r.J>0&&!/Report.*chưa có/i.test(r.I));
 if(choices.length&&unique(choices.map(r=>r.J)).length===1&&phase)return {hours,pkg,layer,phase,months:typeof pkg==='number'?pkg:null,gross:choices[0].J,maxTerms:null,discount:null,straight:0,loyalty:0,referral:0,refs:choices.map(r=>({file:'Bang_gia_chung_doi_chieu_Report.xlsx',sheet:'Bảng giá chung',row:r.row}))};
 return null;
}

