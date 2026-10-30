import {discountOffers,discountPolicyMatch,discountLabelKey} from './promotions.mjs';
import {dateSerial,fullPaymentDay} from './verification.mjs';
const text=x=>String(x??'').trim();
const num=x=>typeof x==='number'&&Number.isFinite(x);
const window=(d,a,b)=>num(d)&&d>=dateSerial(a)&&d<dateSerial(b)+1;
const center=value=>/^(?:[A-Z0-9]+[._-])?(RGI|TPU|LNQ|LBB)$/i.exec(text(value))?.[1]?.toUpperCase()??null;

export function offerConsistencyChecks(cells,context,pricing){
 const offers=discountOffers(cells.L),matches=offers.map(s=>discountPolicyMatch(s,cells.D)),checks=[];
 if(!context.hubRules&&offers.length>4)checks.push('CHECK - QUÁ 4 ƯU ĐÃI');
 const cash=matches.filter(m=>m.kind==='cash'&&m.ruleKey);
 if(!context.hubRules&&cash.length>1)checks.push('CHECK - NHIỀU ƯU ĐÃI GIẢM NỀN: chỉ một mức giảm theo gói; cần điều chỉnh các nhãn trùng/xung đột.');
 for(const [i,m]of matches.entries()){
  const label=discountLabelKey(offers[i]);if(!context.customPolicy)checks.push(...m.issues);
  if(m.siblingAddon&&pricing?.pkg==='36 SPLIT')checks.push('XÁC MINH - REFERRAL/SIBLING: gói 36 chia đôi có câu hỏi Sibling New tặng thêm chưa được trả lời tại Q4 dòng 112; cần căn cứ riêng.');
  if(m.monthAddon&&pricing&&!context.customPolicy){
   const expected=m.kind==='months'?pricing.loyalty:m.kind==='referral'?pricing.referral:m.sharedSepOct&&pricing.regime==='base'?pricing.row?.M:pricing.straight;
   if(!num(expected)||m.addonMonths!==expected)checks.push('CHECK - SỐ THÁNG TẶNG KHÁC RULE CỦA GÓI: '+offers[i]);
   if(m.kind==='months'&&/^new$/i.test(text(context.contractType)))checks.push('CHECK - THÁNG LOYALTY CHỈ DÀNH CHO HỌC VIÊN CURRENT ĐỦ ĐIỀU KIỆN');
  }
  if(['sibling-cash','referral'].includes(m.kind)||/on\s*top|flash\s*sale/.test(label))continue;
  const layer=/\blayer\s*([123])\b/.exec(label),hours=/\b([34])\s*(?:hrs?|hours?|gio)\s*\/\s*(?:week|tuan)\b/.exec(label);
  if(layer&&Number(layer[1])!==pricing?.layer)checks.push('CHECK - LAYER TRONG DISCOUNT KHÁC COURSE FEE KOC: '+offers[i]);
  if(hours&&Number(hours[1])!==pricing?.hours)checks.push('CHECK - GIỜ TRONG DISCOUNT KHÁC HOUR/WEEK: '+offers[i]);
  const duration=/\b(\d+)\s*(?:\/\s*\1\b|months?\b|thang\b)/.exec(label.replace(/\btra\s+gop\b.*$/,''));
  if(duration&&pricing&&!m.monthAddon){
   const split=/^(12|18|24|36) SPLIT$/.exec(String(pricing.pkg)),allowed=split?[Number(split[1])/2,Number(split[1])]:[Number(pricing.pkg)];
   if(!allowed.includes(Number(duration[1])))checks.push('CHECK - GÓI TRONG DISCOUNT KHÁC PACKAGE: '+offers[i]);
  }
  if(m.sharedSepOct&&!window(cells.D,'2026-09-01','2026-10-31'))checks.push('CHECK - ƯU ĐÃI TẶNG THÁNG SEP/OCT NGOÀI THỜI KỲ 01/09–31/10/2026');
  if(m.kind==='straight'&&/installment/i.test(text(context.method)))checks.push('CHECK - TẶNG THÁNG TRẢ THẲNG KHÔNG ÁP DỤNG TRẢ GÓP');
  if(m.ruleKey==='BBSEP26_STRAIGHT'&&/installment/i.test(text(context.method)))checks.push('CHECK - BIG BANG SEP TẶNG THÁNG YÊU CẦU TRẢ THẲNG');
  if(['BBSEP26_CASH','BBSEP26_STRAIGHT'].includes(m.ruleKey)&&pricing&&![12,18,24,36,'36 SPLIT'].includes(pricing.pkg))checks.push('CHECK - BIG BANG SEP CHỈ ÁP DỤNG GÓI 12 / 18 / 24 / 36 THÁNG VÀ 36 CHIA ĐÔI');
 }
 return [...new Set(checks)];
}

function specialChecks(cells,context,pricing,patch,offers,hasVoucher,voucher){
 const checks=[],code=center(cells.B),current=!/^new$/i.test(text(context.contractType));
 if(!code)checks.push('CHECK - SPECIAL30 NGOÀI 4 TRUNG TÂM ĐƯỢC HỖ TRỢ');
 if(text(context.group).toUpperCase()!=='ATLS')checks.push('CHECK - SPECIAL30 CHỈ ÁP DỤNG KHÓA ATLS');
 if(!window(cells.D,'2026-06-24','2026-12-31'))checks.push('CHECK - SPECIAL30 NGOÀI NGÀY 24/06–31/12/2026');
 if(current&&code==='LBB')checks.push('CHECK - SPECIAL30 CURRENT CHỈ ÁP DỤNG RGI / TPU / LNQ');
 if(![3,6,9].includes(Number(pricing?.pkg)))checks.push('CHECK - SPECIAL30 CHỈ CÓ GÓI 6/9 THÁNG; GÓI 3 CẦN DUYỆT RIÊNG');
 if(pricing?.hours!==4){
  if(pricing?.hours===3&&!current&&['RGI','TPU','LNQ'].includes(code))checks.push('XÁC MINH - SPECIAL 30%: lớp 3 giờ New tại 3 center mới cần RCM/GCM duyệt riêng.');
  else checks.push('CHECK - SPECIAL30 SAI ĐỐI TƯỢNG / GIỜ HỌC');
 }
 if(Number(pricing?.pkg)===3)checks.push('XÁC MINH - SPECIAL 30%: gói 3 tháng cần RCM/GCM duyệt và kế hoạch upsell.');
 const other=offers.filter(o=>!/Special (?:30%|Support)/i.test(o));
 const flashException=Math.floor(cells.D)===dateSerial('2026-08-26');
 if(other.some(o=>!(flashException&&/Flash Sale/i.test(o))))checks.push('CHECK - SPECIAL30 KHÔNG CỘNG ƯU ĐÃI KHÁC: chỉ điểm giới thiệu; Flash Sale có ngoại lệ ngày 26/08.');
 if(hasVoucher&&voucher?.policyId!=='referral-points'&&voucher?.policyId!=='four-centers')checks.push('CHECK - SPECIAL30 VÀ VOUCHER: cần căn cứ mã là điểm giới thiệu được phép cộng.');
 if(voucher?.policyId==='four-centers'&&offers.some(o=>/Special (?:30%|Support)/i.test(o)))checks.push('CHECK - TRÙNG HỌC BỔNG 30% Ở DISCOUNT VÀ VOUCHER');
 if(/installment/i.test(text(context.method)))checks.push('XÁC MINH - SPECIAL 30%: cần suất trả góp cụm được duyệt cho đúng hồ sơ.');
 return checks;
}

export function voucherPolicyChecks({cells,context,pricing,patch={},account,voucher}){
 const offers=discountOffers(cells.L),hasVoucher=!!text(cells.K)&&text(cells.K)!=='0',checks=[];
 const special=offers.some(o=>/Special (?:30%|Support)/i.test(o))||voucher?.policyId==='four-centers';
 if(special)checks.push(...specialChecks(cells,context,pricing,patch,offers,hasVoucher,voucher));
 if(voucher?.policyId==='four-centers'&&(voucher.type!=='percent'||voucher.rate!==.3))checks.push('CHECK - VOUCHER SPECIAL30 KHÔNG ĐÚNG LOẠI / TỶ LỆ 30%');
 if(voucher?.policyId==='ceo'){
  if(!window(cells.D,'2026-09-18','2026-10-31'))checks.push('CHECK - CEO NGOÀI KỲ 18/09–31/10/2026');
  const group=text(context.group).toUpperCase(),rate=group==='ATLS'?.3:group==='IELTS'?.45:null;
  if(rate===null||voucher.type!=='percent'||voucher.rate!==rate)checks.push('CHECK - CEO SAI KHÓA / TỶ LỆ: ATLS 30%, IELTS 45%');
  if(group==='ATLS'&&![6,9,12].includes(Number(pricing?.pkg)))checks.push('CHECK - CEO ATLS CHỈ ÁP DỤNG GÓI 6 / 9 / 12 THÁNG');
  if(offers.length)checks.push('CHECK - CEO KHÔNG CỘNG DISCOUNT KHÁC NGOÀI ĐIỂM GIỚI THIỆU ĐƯỢC DUYỆT');
  if(num(patch.verification?.stoppedDays)&&patch.verification.stoppedDays>120)checks.push('CHECK - CEO NGỪNG HỌC QUÁ 120 NGÀY');
  const full=fullPaymentDay(account);
  if(full!==null&&!window(full,'2026-09-18','2026-10-31'))checks.push('CHECK - CEO NGÀY FULL NGOÀI KỲ 18/09–31/10/2026');
  if(/installment/i.test(text(context.method))){
   const term=parseFloat(text(context.term));
   if(term!==3)checks.push('CHECK - CEO CHỈ CÓ NGOẠI LỆ TRẢ GÓP 3 THÁNG CỦA CỤM');
  }
  checks.push('XÁC MINH - CEO: cần case RCM duyệt đúng học viên, EPP tháng 5–8/2026, ngừng ≤120 ngày và ngày full; suất cụm 3 tháng nếu dùng.');
 }
 if(voucher?.policyId==='local-scholarship'||voucher?.policyId==='staff')checks.push('XÁC MINH - VOUCHER CHÍNH SÁCH RIÊNG: đối chiếu đúng đối tượng, gói và quyền cộng gộp theo căn cứ của mã.');
 const v=patch.verification;
 if(/^(12|18|24|36) SPLIT$/.test(String(pricing?.pkg))&&v){
  if(v.siblingRelationship==='no')checks.push('CHECK - GÓI CHIA ĐÔI: hồ sơ xác nhận không phải hai con ruột.');
  if(v.partnerCourse&&v.partnerCourse!=='ATLS')checks.push('CHECK - GÓI CHIA ĐÔI: học viên đối ứng không học ATLS.');
  if(v.partnerStudentId&&text(v.partnerStudentId).toUpperCase()===text(cells.F).toUpperCase())checks.push('CHECK - GÓI CHIA ĐÔI: hai CT cùng Student ID.');
  if(v.ownFullDate&&v.partnerFullDate&&v.ownFullDate!==v.partnerFullDate)checks.push('CHECK - GÓI CHIA ĐÔI: hai CT full khác ngày.');
 }
 return [...new Set(checks)];
}
