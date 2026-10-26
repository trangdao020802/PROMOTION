import {ContractEngine,packageKey} from '../core/contracts.mjs';
import {financialResult} from '../core/reconcile.mjs';
import {discountPolicyMatch,discountPolicyCheck,promotionResult,regularTwoMonthPrice} from '../core/promotions.mjs';
import {voucherCode,customVoucherIssue,withVoucherRegistry} from '../core/vouchers.mjs';
import {dateSerial,fullPaymentDay} from '../core/verification.mjs';
import {reviewAccepted,applyReviews} from '../core/reviews.mjs';
const own=(o,k)=>Object.hasOwn(o,k),number=x=>typeof x==='number'&&Number.isFinite(x);
const between=(d,a,b)=>number(d)&&d>=dateSerial(a)&&d<dateSerial(b)+1;
const difference=(a,b)=>number(a)&&number(b)?a-b:null;
const text=x=>String(x??'').trim();
const unique=a=>[...new Set(a.filter(x=>x!==null&&x!==undefined&&x!==''))];

export function priceFor(data,cells,context){
 const course=text(cells.H),hours=Number(/^([34])\s*(?:hrs|hours|giờ)/i.exec(text(cells.I))?.[1]),pkg=packageKey(cells.J),date=cells.D;
 const layer=Number(/^(?:ATLS|AGLS) - New Price 2026 - Layer ([123])$/i.exec(course)?.[1]);
 const row=data.policy.roadmap.find(r=>r.A===`${layer}|${hours}|${pkg}`);
 const phase=between(date,'2026-10-06','2026-12-31')?'q4':between(date,'2026-10-01','2026-10-05')?'october':between(date,'2026-03-01','2026-09-30')?'base':null;
 if(row&&phase)return {row,hours,pkg,layer,phase,months:row.E,gross:row.G,maxTerms:phase==='q4'?row.Z:phase==='october'?row.S:row.J,discount:phase==='q4'?row.U:phase==='october'?row.P:row.H,straight:phase==='q4'?row.W:phase==='october'?row.R:0,loyalty:phase==='q4'?row.X:0,referral:phase==='q4'?row.Y:0,refs:[{file:'Lo_trinh_san_pham_CTKM_ATLS_2026.xlsx',sheet:'BẢNG GIÁ',row:row.row}]};
 if(layer&&hours&&pkg===2&&phase){const trial=regularTwoMonthPrice(data,{course,hours:cells.I,package:cells.J,group:context.group});if(trial)return {hours,pkg,layer,phase,months:2,gross:trial.amount,maxTerms:0,discount:0,straight:0,loyalty:0,referral:0,refs:trial.refs}}
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
  const context={method:options.raw?.AH??raw['AH'+rawRow],term:options.raw?.AJ??group.raw.AJ??null,bank:raw['AI'+rawRow],contractType:group.raw?.G??raw['G'+rawRow],source:raw['T'+rawRow],fullStatus:raw['J'+rawRow],group:raw['X'+rawRow]};
  const account=options.account||group.account;const pricing=priceFor(data,cells,context),label=text(cells.L),match=discountPolicyMatch(label,cells.D),checks=[];
  const reviewed=id=>reviewAccepted(patch,id,{cells,context,reconciliation:account});
  cells.AJ=pricing?.hours??null;cells.AK=pricing?.pkg??packageKey(cells.J);cells.AO=pricing?.phase==='q4'?'BBQ426':pricing?.phase==='october'?'OCT_BASE':'BASE2026';
  cells.M=pricing?.gross??null;cells.N=label&&label!=='0'?null:pricing?0:null;cells.O=0;cells.S=pricing?.maxTerms??null;cells.BD=pricing?'OK':'CHECK - CHƯA CÓ RULE / ĐỦ ĐẦU VÀO';
  cells.AL=label&&label!=='0'?match.ruleKey||'OTHER':'NONE';cells.BO=match.issues[0]||'OK';cells.CH='OK';
  let bonus=0,loyaltyMissing=false;
  if(label&&label!=='0'&&pricing){
   const terms=label.split(';').map(s=>s.trim()).filter(Boolean),matches=terms.map(s=>discountPolicyMatch(s,cells.D));
   const base=/học bổng (đồng hành|ghi danh)|new price 2026.*(đồng hành|ghi danh)/i.test(label)&&pricing.phase==='base';
   const september=/Big Bang Sep/i.test(label)&&between(cells.D,'2026-09-01','2026-09-30');
   const special=/Special (?:30%|Support)/i.test(label)&&between(cells.D,'2026-06-24','2026-12-31');
   const supported=terms.length<=4&&matches.every((m,i)=>!!m.ruleKey||/học bổng (đồng hành|ghi danh)|Special (?:30%|Support)|Big Bang Sep|Flash Sale/i.test(terms[i]));
   if(supported&&(base||september||special||matches.some(m=>m.ruleKey))){
    cells.N=september&&pricing.row?pricing.row.K:special?Math.round(cells.M*.3):pricing.discount;
    cells.AL=special?'SPECIAL30':base?'BASE2026':september?'BBSEP26_CASH':match.ruleKey||matches.find(m=>m.ruleKey)?.ruleKey||'OTHER';
    if(september&&pricing.row)cells.S=pricing.row.N;
    if(special){cells.S=0;if(!/RGI|TPU|LNQ|LBB/i.test(text(cells.B)))checks.push('CHECK - NGOÀI 4 TRUNG TÂM');checks.push('XÁC MINH - HỌC BỔNG ĐẶC BIỆT: cần căn cứ cấp code đúng học viên/gói.');}
    if(/Flash Sale/i.test(label)){
     if(Math.floor(cells.D)!==dateSerial('2026-08-26'))checks.push('CHECK - NGOÀI NGÀY FLASH SALE');
     else if(number(cells.N))cells.N+=Math.round((cells.M-cells.N)*.1);
     checks.push('XÁC MINH - FLASH SALE: kiểm tra EPP, đặt cọc và thời hạn full.');
    }
    if(matches.some(m=>m.kind==='referral')){
     const v=patch.verification,proven=v?.siblingRelationship==='yes'&&text(v.partnerContract)&&text(v.partnerStudentId)&&v.evidenceIds?.length&&dateSerial(v.ownFullDate)!==null&&dateSerial(v.partnerFullDate)!==null;
     if(!proven)checks.push('XÁC MINH - REFERRAL/SIBLING: bổ sung CT đối ứng, quan hệ, ngày full và minh chứng.');
     if([3,6,9].includes(pricing.pkg)&&number(cells.N))cells.N+=pricing.layer===3?800000:1000000;
     else if(proven||reviewed('referral'))bonus+=pricing.referral||0;
    }
    if(/On Top 5%/i.test(label)){
     const v=patch.verification,proven=v?.evidenceIds?.length&&number(v.priorFees)&&v.priorFees>100000000;
     if((proven||reviewed('ontop'))&&number(cells.N))cells.N+=Math.round((cells.M-cells.N)*.05);
     if(!proven)checks.push('XÁC MINH - ON TOP 5%: chưa đủ lịch sử học phí trên 100 triệu và căn cứ.');
    }
    if(pricing.phase==='q4'&&!/^new$/i.test(text(context.contractType))&&[18,24,36,'36 SPLIT'].includes(pricing.pkg)){
     if(options.cells?.BB===0){}else if(reviewed('loyalty')||number(options.cells?.AR)&&options.cells.AR>30000000&&number(options.cells?.AS)&&options.cells.AS<=120)bonus+=pricing.loyalty||0;else loyaltyMissing=true;
    }
    if(!/installment/i.test(text(context.method))&&text(context.method)&&fullPaymentDay(account)!==null)bonus+=september?(pricing.row?.M||0):pricing.straight||0;
   }else {cells.N=null;cells.BO='CHECK - DISCOUNT CHƯA CÓ RULE ĐẦY ĐỦ';checks.push(cells.BO);}
   if(match.period==='september'&&pricing.phase!=='base'||match.period==='q4'&&pricing.phase!=='q4'||match.period==='october'&&!['q4','october'].includes(pricing.phase)){cells.BO='CHECK - NGOÀI THỜI KỲ DISCOUNT';checks.push(cells.BO)}
  }
  if(!pricing)checks.push(cells.BD);
  const code=voucherCode(cells.K),voucher=data.extensions.customVouchers?.find(v=>voucherCode(v.code)===code);
  cells.CI=code?'CHECK - GIFTCODE CHƯA ĐƯỢC DUYỆT / ĐỦ HỒ SƠ':'NO GIFTCODE';
  if(code){
   cells.O=null;let issue=voucher?customVoucherIssue(voucher,cells.F):cells.CI;
   if(!issue&&(!between(cells.D,voucher.startDate,voucher.endDate)))issue='CHECK - GIFTCODE NGOÀI NGÀY HIỆU LỰC';
   if(!issue&&!/^(?:all|toàn quốc)$/i.test(text(voucher.center))&&!text(voucher.center).split(/[,;|]/).map(s=>s.trim().toUpperCase()).includes(text(cells.B).toUpperCase()))issue='CHECK - GIFTCODE SAI CENTER';
   if(!issue&&number(cells.M)&&number(cells.N)){
    const base=cells.M-cells.N;let amount=voucher.type==='percent'?Math.round(base*voucher.rate):voucher.amount;
    if(number(voucher.minimum))amount=Math.max(amount,voucher.minimum);if(voucher.maximum>0)amount=Math.min(amount,voucher.maximum);
    if(!number(amount)||amount<0||amount>base+1)issue='CHECK - GIFTCODE VƯỢT CƠ SỞ TÍNH';else {cells.O=amount;cells.CI='OK'}
   }else if(!issue)issue='CHECK - CHƯA CÓ CƠ SỞ TÍNH GIFTCODE';
   if(issue)cells.CI=issue;
  }
  cells.P=number(account.transferIn)?account.transferIn:0;
  cells.Q=number(cells.M)&&number(cells.N)&&number(cells.O)?cells.M-cells.N-cells.O:null;
  cells.R=pricing&&number(pricing.months)&&number(pricing.hours)&&!loyaltyMissing&&(pricing.pkg!=='36 SPLIT'||options.cells?.AT==='YES'||reviewed('sibling'))?(pricing.months+bonus)*pricing.hours*data.policy.hourFactor:null;
  cells.W=number(account.net)?account.net:null;cells.Y=group.raw.AJ??null;
  const actualTerm=typeof cells.Y==='number'?cells.Y:/^\d+(?:\.\d+)?/.test(text(cells.Y))?parseFloat(cells.Y):null;
  if(!text(context.method))cells.AE='CHECK - THIẾU PHƯƠNG THỨC';
  else if(!/installment/i.test(text(context.method)))cells.AE='OK';
  else if(!number(actualTerm)||actualTerm<=0)cells.AE='CHECK - THIẾU KỲ TRẢ GÓP';
  else if(!number(cells.S))cells.AE='CHECK - CHƯA CÓ GIỚI HẠN KỲ';
  else if(cells.S===0)cells.AE='CHECK - KHÔNG ÁP DỤNG TRẢ GÓP';
  else if(actualTerm>cells.S)cells.AE=patch.approved===true?'OK':'CHECK - VƯỢT KỲ';else cells.AE='OK';
  cells.AG=patch.approved===true?'APPROVED':'';
  cells.Z=difference(cells.T,cells.M);cells.AA=difference(cells.U,cells.N);cells.AB=difference(cells.V,cells.O);cells.AC=difference(cells.W,cells.Q);cells.AD=difference(cells.X,cells.R);
  const reconciliation={...account,...financialResult(account,cells,1)};
  const native=promotionResult(cells,context,account,data.extensions.catalogue.programs);
  const promotion={...native,checks:unique([...native.checks,...checks]),blocking:false,status:'OK'};
  promotion.blocking=promotion.checks.length>0;promotion.status=promotion.checks.some(c=>c.startsWith('CHECK'))?'CHECK - ĐIỀU KIỆN / THỜI HẠN':promotion.blocking?'XÁC MINH - ĐIỀU KIỆN ÁP DỤNG':'OK';
  cells.ctCheck=reconciliation.status;cells.promoCheck=promotion.status;cells.contractTotal=account.ct||'';cells.ctNet=account.ct?account.net:null;
  const complete=['Z','AA','AB','AC','AD'].every(k=>number(cells[k])&&Math.abs(cells[k])<=1);
  cells.AF=complete&&cells.AE==='OK'&&cells.BD==='OK'&&cells.BO==='OK'&&['OK','NO GIFTCODE'].includes(cells.CI)&&!promotion.blocking&&!reconciliation.blocking?'OK':'CHECK';
  cells.AN=unique([pricing?pricing.refs.map(r=>r.file+' · '+r.sheet+' · dòng '+r.row).join('; '):'Chưa có quy tắc giá đúng Course fee / giờ / gói / ngày.',number(cells.Q)?'Phải đóng = giá niêm yết − discount − giftcode. Transfer là phân bổ tiền, không trừ học phí lần hai.':'Chưa đủ dữ liệu để tính; ô trống không được coi là 0.',code?'Giftcode phần trăm tính trên Before − Discount theo Bảng giá chung / Giftcode dòng 2.':'',loyaltyMissing?'Cần lịch sử học phí và ngày dừng học để xét loyalty.':'',...promotion.checks]).join(' | ');
  return {...record,cells,context,errors:[],reconciliation,promotion,pricing};
 }
}
export class AuditEngine extends ContractEngine{
 constructor(data){super(data);this.engine=new IndependentCalculator(data)}
 setVouchers(vouchers){this.data=withVoucherRegistry(this.data,vouchers);this.engine=new IndependentCalculator(this.data)}
 calculate(record,patch={}){this.data._calculating=record.id;return applyReviews(super.calculate(record,patch),patch)}
}
