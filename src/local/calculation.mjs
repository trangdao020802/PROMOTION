import {courseHourTotals} from '../core/course-hours.mjs';
import {ContractEngine,packageKey} from '../core/contracts.mjs';
import {financialResult} from '../core/reconcile.mjs';
import {discountPolicyMatch,discountPolicyCheck,discountOffers,promotionResult,regularTwoMonthPrice} from '../core/promotions.mjs';
import {voucherCode,customVoucherIssue,withVoucherRegistry,voucherCenterApplies} from '../core/vouchers.mjs';
import {dateSerial,fullPaymentDay} from '../core/verification.mjs';
import {reviewAccepted,applyReviews} from '../core/reviews.mjs';
import {auditPriceFor,toleranceFor,auditPolicyChecks,auditPackageKey,voucherBasisFor} from '../core/audit-policy.mjs';
import {roadmapSchedule} from '../core/price-catalog.mjs';
import {offerConsistencyChecks,voucherPolicyChecks} from '../core/policy-consistency.mjs';
const own=(o,k)=>Object.hasOwn(o,k),number=x=>typeof x==='number'&&Number.isFinite(x);
const between=(d,a,b)=>number(d)&&d>=dateSerial(a)&&d<dateSerial(b)+1;
const difference=(a,b)=>number(a)&&number(b)?a-b:null;
const text=x=>String(x??'').trim();
const unique=a=>[...new Set(a.filter(x=>x!==null&&x!==undefined&&x!==''))];

export function priceFor(data,cells,context){
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

class IndependentCalculator{
 constructor(data){this.data=data}
 calculate(record,patch={},options={}){
  const data=this.data,g=data.contractGroups.find(g=>g.anchor.id===record.id&&g.rawRow===options.rawRow)||data.contractGroups.find(g=>g.id===data._calculating),group=g||data.contractGroups.find(g=>g.anchor.id===record.id);
  if(!group)throw Error('Không tìm thấy dòng CT tổng để tính.');
  const cells={...group.cells,...options.cells};for(const k of ['H','I','J','K','L'])if(own(patch,k))cells[k]=patch[k];
  const raw=data.grids.RAW_REPORT,rawRow=group.rawRow;
  const context={method:options.raw?.AH??raw['AH'+rawRow],term:options.raw?.AJ??group.raw.AJ??null,bank:raw['AI'+rawRow],contractType:group.raw?.G??raw['G'+rawRow],source:raw['T'+rawRow],fullStatus:raw['J'+rawRow],group:group.raw?.X??raw['X'+rawRow],voucherDescription:raw['AP'+rawRow]};
  const code=voucherCode(cells.K),hasDescription=!!text(context.voucherDescription)&&text(context.voucherDescription)!=='0',voucher=data.extensions.customVouchers?.find(v=>voucherCode(v.code)===code);
  if(voucher){context.voucherType=voucher.type==='percent'?'PHẦN TRĂM':'SỐ TIỀN';context.voucherBasis=voucher.percentBasis??'policy-default';if(voucher.policyId&&voucher.policyId!=='case-specific'||voucher.percentBasis&&voucher.percentBasis!=='policy-default')context.voucherPolicyScope=JSON.stringify([voucher.policyId,voucher.percentBasis,voucher.type,voucher.amount,voucher.rate,voucher.startDate,voucher.endDate,voucher.center,voucher.approvalNote]);}
  const account=options.account||group.account;const pricing=priceFor(data,cells,context),label=text(cells.L),match=discountPolicyMatch(label,cells.D),checks=[];
  const reviewed=id=>reviewAccepted(patch,id,{cells,context,reconciliation:account});
  cells.AJ=pricing?.hours??null;cells.AK=pricing?.pkg??packageKey(cells.J);cells.AO=pricing?.phase==='q4'?'BBQ426':pricing?.phase==='october'?'OCT_BASE':'BASE2026';
  cells.M=pricing?.gross??null;cells.N=pricing?.short?pricing.discount:label&&label!=='0'?null:pricing?0:null;cells.O=0;cells.S=pricing?(/installment/i.test(text(context.method))?pricing.maxTerms:0):null;cells.BD=pricing?.issue??(pricing?'OK':/VTDH|vững tin/i.test([cells.H,cells.J,cells.L].join(' '))?'CHECK - VTDH CÓ POLICY RIÊNG':'CHECK - CHƯA CÓ RULE / ĐỦ ĐẦU VÀO');
  cells.AL=label&&label!=='0'?match.ruleKey||'OTHER':'NONE';cells.BO=match.issues[0]||'OK';cells.CH='OK';
  let loyaltyMissing=false,straightMissing=false;const discountComponents=[],monthComponents=[];
  const awardMonths=(kind,months)=>{if(number(months)&&months>0)monthComponents.push({kind,months});};
  if(label&&label!=='0'&&pricing&&!pricing.short){
   const terms=discountOffers(label),matches=terms.map(s=>discountPolicyMatch(s,cells.D));
   const base=/học bổng (đồng hành|ghi danh)|new price 2026.*(đồng hành|ghi danh)/i.test(label)&&pricing.phase==='base';
   const september=pricing.policyKey==='BBSEP26_CASH';
   const special=/Special (?:30%|Support)/i.test(label)&&between(cells.D,'2026-06-24','2026-12-31');
   const supported=terms.length<=4&&matches.every((m,i)=>!!m.ruleKey||/học bổng (đồng hành|ghi danh)|Special (?:30%|Support)|Big Bang Sep|Flash Sale/i.test(terms[i]));
   if(supported&&(base||september||special||matches.some(m=>m.ruleKey))){
    const cashOffer=base||september||special||matches.some(m=>m.kind==='cash');
    cells.N=special?Math.round(cells.M*.3):cashOffer?pricing.discount:0;
    cells.AL=special?'SPECIAL30':base?'BASE2026':september?'BBSEP26_CASH':match.ruleKey||matches.find(m=>m.ruleKey)?.ruleKey||'OTHER';
    if(match.sharedSepOct&&pricing.phase==='base'&&match.kind==='straight')cells.AL='BBSEP26_STRAIGHT';
    if(match.sharedSepOct&&pricing.phase==='october'&&match.kind==='straight')cells.AL='OCT26_BASE';
    for(const [i,m]of matches.entries())if(m.kind!=='sibling-cash')discountComponents.push({label:terms[i],ruleKey:m.ruleKey,kind:m.kind,amount:m.ruleKey==='BBSEP26_STRAIGHT'?cells.N:m.kind==='months'||m.kind==='straight'?0:m.kind==='cash'?cells.N:null});
    const fixed=[...new Map(matches.filter(m=>m.kind==='sibling-cash').map(m=>[m.ruleKey,m])).values()];
    if(fixed.length>1){cells.N=null;checks.push('CHECK - NHIỀU MỨC GIẢM SIBLINGS TRONG CÙNG HỒ SƠ');}
    for(const m of fixed){
     discountComponents.push({label:terms[matches.indexOf(m)],ruleKey:m.ruleKey,kind:m.kind,amount:m.fixedAmount});
     if(!/^new$/i.test(text(context.contractType)))checks.push('CHECK - SIBLINGS GIẢM TIỀN Q4 DÀNH CHO HỌC VIÊN NEW');
     if(m.fixedAmount!==(pricing.layer===3?800000:1000000))checks.push('CHECK - SỐ TIỀN SIBLINGS KHÔNG ĐÚNG LAYER');
     if(pricing.phase==='q4'&&![3,6,9].includes(pricing.pkg))checks.push('CHECK - SIBLINGS GIẢM TIỀN Q4: rule gói 3/6/9 tháng; gói dài/chia đôi cần đối chiếu chính sách, không tự đổi sang tiền giảm.');
     const v=patch.verification,proven=v?.siblingRelationship==='yes'&&text(v.partnerContract)&&text(v.partnerStudentId)&&v.evidenceIds?.length;
     if(!proven&&!reviewed('referral'))checks.push('XÁC MINH - REFERRAL/SIBLING: xác nhận học viên New, anh/chị/em đối ứng và thời điểm còn học/ngừng ≤120 ngày.');
    }
    if(special){cells.S=0;if(!/RGI|TPU|LNQ|LBB/i.test(text(cells.B)))checks.push('CHECK - NGOÀI 4 TRUNG TÂM');checks.push('XÁC MINH - HỌC BỔNG ĐẶC BIỆT: cần căn cứ cấp code đúng học viên/gói.');}
    if(/Flash Sale/i.test(label)){
     if(Math.floor(cells.D)!==dateSerial('2026-08-26'))checks.push('CHECK - NGOÀI NGÀY FLASH SALE');
     else if(number(cells.N))cells.N+=Math.round((cells.M-cells.N)*.1);
     checks.push('XÁC MINH - FLASH SALE: kiểm tra EPP, đặt cọc và thời hạn full.');
    }
    if(matches.some(m=>m.kind==='referral')){
     const v=patch.verification,proven=v?.siblingRelationship==='yes'&&text(v.partnerContract)&&text(v.partnerStudentId)&&v.evidenceIds?.length&&dateSerial(v.ownFullDate)!==null&&dateSerial(v.partnerFullDate)!==null;
     if(!proven)checks.push('XÁC MINH - REFERRAL/SIBLING: bổ sung CT đối ứng, quan hệ, ngày full và minh chứng.');
     if(!/^new$/i.test(text(context.contractType)))checks.push('CHECK - REFERRAL CẦN NEW VÀ XÁC NHẬN');
     else if([3,6,9].includes(Number(pricing.pkg))&&number(cells.N)&&(proven||reviewed('referral'))&&!fixed.length)cells.N+=pricing.layer===3?800000:1000000;
     else if(proven||reviewed('referral'))awardMonths('referral',pricing.referral||0);
    }
    if(/On Top 5%/i.test(label)){
     const v=patch.verification,proven=v?.evidenceIds?.length&&number(v.priorFees)&&v.priorFees>100000000;
     if(pricing.phase==='q4')checks.push('CHECK - Q4 KHÔNG CÓ ON TOP 5%');
     else if((proven||reviewed('ontop'))&&number(cells.N))cells.N+=Math.round((cells.M-cells.N)*.05);
     if(!proven)checks.push('XÁC MINH - ON TOP 5%: chưa đủ lịch sử học phí trên 100 triệu và căn cứ.');
    }
    // Fixed sibling money is subtracted after progressive offers (Flash row 19).
    if(fixed.length===1&&number(cells.N))cells.N+=fixed[0].fixedAmount;
    if(pricing.phase==='q4'&&['BBQ426_CASH','BBQ426_LOYALTY'].includes(cells.AL)&&!/^new$/i.test(text(context.contractType))&&[18,24,36,'36 SPLIT'].includes(pricing.pkg)){
     if(options.cells?.BB===0){}else if(reviewed('loyalty')||number(options.cells?.AR)&&options.cells.AR>30000000&&number(options.cells?.AS)&&options.cells.AS<=120)awardMonths('loyalty',pricing.loyalty||0);else loyaltyMissing=true;
    }
    const sharedStraight=matches.some(m=>m.sharedSepOct&&m.kind==='straight');
    const straightMonths=sharedStraight&&pricing.regime==='base'?pricing.row?.M??0:pricing.straight||0;
    const hasStraight=['BBQ426_CASH','BBQ426_LOYALTY','OCT26_BASE','BBQ426_STRAIGHT'].includes(cells.AL)||september||matches.some(m=>m.kind==='straight');
    if(hasStraight&&straightMonths>0&&!/installment/i.test(text(context.method))){
     if(text(context.method)&&fullPaymentDay(account)!==null)awardMonths('straight',straightMonths);
     else {straightMissing=true;checks.push('XÁC MINH - GIỜ TẶNG TRẢ THẲNG: cần phương thức thanh toán và ngày full từ chứng từ để chốt tháng tặng.');}
    }
   }else {cells.N=null;cells.BO='CHECK - DISCOUNT CHƯA CÓ RULE ĐẦY ĐỦ';checks.push(cells.BO);}
   if(!(match.sharedSepOct&&between(cells.D,'2026-09-01','2026-10-31'))&&(match.period==='september'&&pricing.phase!=='base'||match.period==='q4'&&pricing.phase!=='q4'||match.period==='october'&&!['q4','october'].includes(pricing.phase))){cells.BO='CHECK - NGOÀI THỜI KỲ DISCOUNT';checks.push(cells.BO)}
  }
  if(cells.BD!=='OK')checks.push(cells.BD);
  cells.CI=code||hasDescription?'CHECK - GIFTCODE CHƯA ĐƯỢC DUYỆT / ĐỦ HỒ SƠ':'NO GIFTCODE';
  if(!code&&hasDescription)cells.O=null;
  if(code){
   cells.O=null;let issue=voucher?customVoucherIssue(voucher,cells.F):cells.CI;
   if(!issue&&(!between(cells.D,voucher.startDate,voucher.endDate)))issue='CHECK - GIFTCODE NGOÀI NGÀY HIỆU LỰC';
   if(!issue&&!voucherCenterApplies(voucher.center,cells.B))issue=`CHECK - GIFTCODE SAI CENTER (voucher: ${voucher.center}; hồ sơ: ${cells.B??'chưa có'})`;
   if(!issue&&number(cells.M)&&number(cells.N)){
    const basis=voucher.percentBasis&&voucher.percentBasis!=='policy-default'?voucher.percentBasis:voucherBasisFor(data,cells.D);
    const base=basis==='gross'?cells.M:cells.M-cells.N;let amount=voucher.type==='percent'?Math.round(base*voucher.rate):voucher.amount;
    if(voucher.type==='percent'){if(number(voucher.minimum))amount=Math.max(amount,voucher.minimum);if(voucher.maximum>0)amount=Math.min(amount,voucher.maximum);}
    if(!number(amount)||amount<0)issue='CHECK - GIFTCODE SAI GIÁ TRỊ';else {cells.O=amount;cells.CI='OK'}
   }else if(!issue)issue='CHECK - CHƯA CÓ CƠ SỞ TÍNH GIFTCODE';
   if(issue)cells.CI=issue;
  }
  checks.push(...offerConsistencyChecks(cells,context,pricing),...voucherPolicyChecks({cells,context,pricing,patch,account,voucher}));
  if(number(cells.M)&&number(cells.N)&&number(cells.O)&&cells.N+cells.O>cells.M)checks.push('CHECK - TỔNG DISCOUNT VÀ GIFTCODE VƯỢT GIÁ GỐC: kiểm tra trùng học bổng hoặc sai cơ sở %.');
  cells.P=number(account.transferIn)?account.transferIn:0;
  cells.Q=number(cells.M)&&number(cells.N)&&number(cells.O)?Math.max(0,cells.M-cells.N-cells.O):null;
  const hoursPending=[];
  if(discountOffers(label).some(offer=>{const item=discountPolicyMatch(offer,cells.D);return ['straight','months','referral'].includes(item.kind)&&(!item.ruleKey||item.issues.length);}))hoursPending.push('Nhãn tháng tặng chưa khớp quy tắc được xác minh.');
  if(loyaltyMissing)hoursPending.push('Chưa chốt điều kiện tháng loyalty.');
  if(straightMissing)hoursPending.push('Chưa xác minh trả thẳng và ngày đóng đủ.');
  if(pricing?.pkg==='36 SPLIT'&&options.cells?.AT!=='YES'&&!reviewed('sibling'))hoursPending.push('Chưa đủ điều kiện gói sibling chia đôi.');
  const courseHours=courseHourTotals(pricing,monthComponents,data.policy.hourFactor,hoursPending);
  cells.extraHours=courseHours.extraHours;cells.R=courseHours.totalHours;
  cells.W=number(account.net)?account.net:null;cells.Y=group.raw.AJ??null;
  const actualTerm=typeof cells.Y==='number'?cells.Y:/^\d+(?:\.\d+)?/.test(text(cells.Y))?parseFloat(cells.Y):null;
  if(!text(context.method))cells.AE='CHECK - THIẾU PHƯƠNG THỨC';
  else if(!/installment/i.test(text(context.method)))cells.AE=text(cells.Y)&&actualTerm!==0?'CHECK - KỲ TRẢ THẲNG':'OK';
  else if(!number(actualTerm))cells.AE='CHECK - THIẾU KỲ TRẢ GÓP';
  else if(actualTerm<=0||!Number.isInteger(actualTerm))cells.AE='CHECK - SAI KỲ TRẢ GÓP';
  else if(!number(cells.S))cells.AE='CHECK - CHƯA CÓ GIỚI HẠN KỲ';
  else if(cells.S===0)cells.AE='CHECK - KHÔNG ÁP DỤNG TRẢ GÓP';
  else if(actualTerm>cells.S)cells.AE=patch.approved===true?'OK':'CHECK - VƯỢT KỲ';else cells.AE='OK';
  cells.AG=patch.approved===true?'APPROVED':'';
  cells.Z=difference(cells.T,cells.M);cells.AA=difference(cells.U,cells.N);cells.AB=difference(cells.V,cells.O);cells.AC=difference(cells.W,cells.Q);cells.AD=difference(cells.X,cells.R);
  const tolerance=toleranceFor(data,cells.D),reconciliation={...account,...financialResult(account,cells,tolerance.money)};
  checks.push(...auditPolicyChecks(data,cells,context,account,group.receipts));
  const native=promotionResult(cells,context,account,data.extensions.catalogue.programs);
  const promotion={...native,checks:unique([...native.checks,...checks]),blocking:false,status:'OK'};
  promotion.blocking=promotion.checks.length>0;promotion.status=promotion.checks.some(c=>c.startsWith('CHECK'))?'CHECK - ĐIỀU KIỆN / THỜI HẠN':promotion.blocking?'XÁC MINH - ĐIỀU KIỆN ÁP DỤNG':'OK';
  cells.ctCheck=reconciliation.status;cells.promoCheck=promotion.status;cells.contractTotal=account.ct||'';cells.ctNet=account.ct?account.net:null;
  const complete=['Z','AA','AB','AC','AD'].every(k=>number(cells[k])&&Math.abs(cells[k])<=1);
  cells.AF=complete&&cells.AE==='OK'&&cells.BD==='OK'&&cells.BO==='OK'&&['OK','NO GIFTCODE'].includes(cells.CI)&&!promotion.blocking&&!reconciliation.blocking?'OK':'CHECK';
  cells.AN=unique([pricing?pricing.refs.map(r=>r.file+' · '+r.sheet+' · dòng '+r.row+(r.cell?' · ô '+r.cell:'')).join('; '):'Chưa có quy tắc giá đúng Course fee / giờ / gói / ngày.',pricing?.short&&number(pricing.monthly)?'Giá gốc gói lẻ = '+pricing.monthly.toLocaleString('vi-VN')+' VND/tháng chưa giảm × '+pricing.months+' tháng. Discount và Giftcode tính riêng.':'',number(cells.Q)?'Phải đóng = giá niêm yết − discount − giftcode. Transfer là phân bổ tiền, không trừ học phí lần hai.':'Chưa đủ dữ liệu để tính; ô trống không được coi là 0.',code?((context.voucherBasis&&context.voucherBasis!=='policy-default'?context.voucherBasis:voucherBasisFor(data,cells.D))==='gross'?'Giftcode % trên giá gốc trước Discount; kiểm tra căn cứ phê duyệt của mã.':'Giftcode % trên giá gốc trừ Discount; theo căn cứ phê duyệt của mã.'):'',number(cells.extraHours)?'Giờ tặng = '+courseHours.bonusMonths+' tháng × '+courseHours.weeklyHours+' giờ/tuần × '+(courseHours.factor===25/6?'25/6':courseHours.factor)+'; tổng giờ làm tròn sau khi cộng, không cộng lại giờ tặng lần hai.':'',loyaltyMissing?'Cần lịch sử học phí và ngày dừng học để xét loyalty.':'',...promotion.checks]).join(' | ');
  return {...record,cells,context,errors:[],reconciliation,promotion,pricing,tolerance,discountComponents,courseHours};
 }
}
export class AuditEngine extends ContractEngine{
 constructor(data){super(data);this.engine=new IndependentCalculator(data)}
 setVouchers(vouchers){this.data=withVoucherRegistry(this.data,vouchers);this.engine=new IndependentCalculator(this.data)}
 calculate(record,patch={}){this.data._calculating=record.id;return applyReviews(super.calculate(record,patch),patch)}
}
