import {priceText} from './pricing-key.mjs';
// The old fee book (tab 2025, rows 11/18/24/35–90) has fixed money
// scholarships, not Q4 rates. Only recognized labels activate a component.
export function legacyDiscountFor(pricing,offers,context={}){
 if(pricing?.identity?.year!==2024||!String(pricing.policyKey??'').startsWith('LEGACY'))return null;
 let amount=0,scholarships=0,unknown=false;const checks=[],components=[];
 const split=String(pricing.pkg).endsWith('SPLIT'),short=pricing.policyKey==='LEGACY_SHORT';
 for(const label of offers){
  const s=priceText(label),hour=/\b([34])\s*(?:hrs?|gio)\b/.exec(s);
  if(/hoc bong ghi danh|hoc bong dong hanh/.test(s)&&(!/new price 20\d{2}/.test(s)||/new price 2024/.test(s))||split&&/new price 2024.*siblings.*split payment/.test(s)){
   scholarships++;if(hour&&Number(hour[1])!==pricing.hours)checks.push('CHECK - HỌC BỔNG 2024 SAI GIỜ/TUẦN');
   if(short)checks.push('CHECK - GÓI NGẮN 2024 KHÔNG CÓ HỌC BỔNG GHI DANH');
   amount+=pricing.discount;components.push({label,kind:'cash',ruleKey:'LEGACY2024',amount:pricing.discount});
   checks.push('XÁC MINH - GHI DANH 2024: đúng ngày ghi danh hoặc điều kiện tái phí trước hạn theo bản giá cũ.');
  }else if(/^hoc bong tai phi som/.test(s)){
   if(split||![6,9,12,18].includes(pricing.pkg))checks.push('CHECK - TÁI PHÍ SỚM 2024 KHÔNG ÁP DỤNG GÓI NÀY');
   if(/^new$/i.test(context.contractType??''))checks.push('CHECK - TÁI PHÍ SỚM 2024 CHỈ CHO CURRENT');
   const cash=pricing.hours===3?750000:1000000;amount+=cash;components.push({label,kind:'cash',ruleKey:'LEGACY_EARLY',amount:cash});checks.push('XÁC MINH - TÁI PHÍ SỚM: đối chiếu ngày hết phí và full trước 2 tháng theo chính sách 2024.');
  }else if(/^(?:referral|siblings?)\s*-/.test(s)&&/(?:1[.,]000[.,]000|800[.,]000|1000000|800000)\s*vnd/.test(s)){
   const cash=pricing.layer===3?800000:1000000,stated=/(?:1[.,]000[.,]000|1000000)\s*vnd/.test(s)?1000000:800000;
   if(stated!==cash)checks.push('CHECK - REFERRAL/SIBLING 2024 SAI SỐ TIỀN THEO LAYER');
   if(split)checks.push('CHECK - GÓI CHIA ĐÔI 2024 KHÔNG CỘNG REFERRAL/SIBLING GIẢM TIỀN');
   if(!/^new$/i.test(context.contractType??''))checks.push('CHECK - REFERRAL/SIBLING GIẢM TIỀN 2024 CẦN HỌC VIÊN NEW');
   amount+=cash;components.push({label,kind:'sibling-cash',ruleKey:'LEGACY_REFERRAL',amount:cash});checks.push('XÁC MINH - REFERRAL/SIBLING: cần CT/học viên đối ứng và minh chứng đúng đối tượng của bản giá 2024.');
  }else unknown=true;
 }
 if(scholarships>1)checks.push('CHECK - NHIỀU HỌC BỔNG GHI DANH 2024 TRÙNG NHAU');
 return {amount:unknown?null:amount,checks:[...checks,...(unknown?['CHECK - ƯU ĐÃI 2024 CẦN QUY TẮC RIÊNG: không cộng nhãn chưa xác định vào học bổng cũ.']:[])],components};
}
