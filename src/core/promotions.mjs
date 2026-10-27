import {regularMonthlyPrice} from './monthly-price.mjs';
export const normalize = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
const serial = value => value ? (Date.parse(value+'T00:00:00Z') - Date.UTC(1899,11,30)) / 86400000 : null;
const inWindow = (p, date) => (p.from == null || date >= serial(p.from)) && (p.to == null || date < serial(p.to)+1);

// Business keys identify a policy family; the literal PaymentList label is
// retained. Duration here is descriptive and never supplies Package/AK.
export const discountLabelKey = value => normalize(value).trim().replace(/\s+/g,' ');
export function discountPolicyMatch(label,date,regime){
 const text=discountLabelKey(label).replace(/[–—_:·-]/g,' ').replace(/\s+/g,' '),keys=[];
 const years=[...new Set(text.match(/\b20\d{2}\b/g)??[])];
 const year2026=years.length===1&&years[0]==='2026';
 const q4=/\b(?:q\s*4|quy\s*4|bbq\s*4(?:26)?)\b/.test(text);
 const fromOctober=/\b(?:from|tu)\s*0?6\s*[/. ]\s*10\b/.test(text);
 const october=/\b(?:october|oct)\b|\bthang\s*10\b|\b10\s*[/ .]\s*2026\b/.test(text);
 // Sep/Oct is a shared add-on window, not a second Big Bang base regime.
 const september=/\b(?:september|sept?|thang\s*9)\b/.test(text.replace(/\bsep\s*\/\s*oct\b/g,'oct'));
 const cash=/\bdiscount\b|\bgiam\s+(?:tien|gia)\b/.test(text);
 const explicitMonths=/\bpromotion\s+months?\b|\bloyal(?:ty)?\b/.test(text);
 const months=explicitMonths||/\b(?:tang|gift|bonus)\s+(?:\d+\s*)?(?:months?|thang)\b/.test(text);
 const straight=/\btra\s+thang\b|\bstraight\s+payment\b/.test(text);
 const siblingAddon=text.split(';').some(offer=>/\bpromotion\s+siblings?\s*\(\s*months?\s*\)/.test(offer)||/\bsiblings?\b/.test(offer)&&/\b\d+\s+months?\s+add\s+on\b/.test(offer));
 const referral=/\breferral\b|\bsibling\s+new\b/.test(text)||siblingAddon;
 const siblings=/\bsiblings?\b|\banh\s+chi\s+em\b/.test(text);
 const duration=/\b(\d{1,2})\s*(?:\/\s*\1|months?\b|thang\b)/.exec(text);
 if(siblings)keys.push('siblings');if(duration)keys.push(duration[0].trim());
 const kind=cash?'cash':referral?'referral':explicitMonths?'months':straight?'straight':months?'months':/\bpromotion\b/.test(text)?'cash':null;
 if(kind)keys.unshift({cash:'Promotion Discount',months:'Promotion Month',straight:'Trả thẳng',referral:'Referral'}[kind]);
 const dated2026=typeof date==='number'&&date>=serial('2026-01-01')&&date<serial('2027-01-01');
 const currentYear=year2026||!years.length&&dated2026;
 const issues=[];
 if((q4||fromOctober||october)&&years.some(y=>y!=='2026'))issues.push('CHECK - KEY DISCOUNT KHÁC NĂM: không áp dụng quy tắc tháng 10/Q4 2026 cho năm ghi trong Discount.');
 if(currentYear&&september&&(october||q4||fromOctober))issues.push('CHECK - KEY DISCOUNT MÂU THUẪN: có cả kỳ tháng 9 và tháng 10/Q4.');
 const period=currentYear&&!issues.length?(q4||fromOctober?'q4':october?'october':september&&/\bbig\s*bang\b/.test(text)?'september':null):null;
 if(period)keys.unshift(period==='q4'?'Q4/2026':period==='october'?'October 2026':'September 2026');
 if(fromOctober)keys.push('From 06/10');
 const requiresPeriod=siblings&&(cash||months)&&!period;
 if(requiresPeriod&&!issues.length)issues.push('XÁC MINH - KEY DISCOUNT: cần kỳ chính sách cho ưu đãi siblings; không tự coi giảm tiền/tặng tháng là referral.');
 const base=regime==='OCT_BASE'||regime==='OCT_DUYET'||regime===undefined&&typeof date==='number'&&date<serial('2026-10-06');
 let ruleKey=null,programIds=[];
 if(period&&kind){
  if(period==='september'){if(kind==='cash')ruleKey='BBSEP26_CASH';programIds=['sep-bigbang'];}
  else {
   ruleKey=kind==='months'?'BBQ426_LOYALTY':kind==='straight'?'BBQ426_STRAIGHT':kind==='referral'?'REFQ426':base?'OCT26_BASE':'BBQ426_CASH';
   programIds=kind==='referral'?['ref-q4']:[period==='q4'||!base?'q4':'oct-base'];
  }
 }
 if(siblingAddon&&period&&period!=='september'&&!programIds.includes('ref-q4'))programIds.push('ref-q4');
 return {keys,kind,period,ruleKey,programIds,issues,siblings,siblingAddon};
}

// Validate each offer against policy keys, not the PaymentList observation
// catalogue. A listed observation alone never supplies a financial rule.
export function discountPolicyCheck(label,date,regime,grid){
 const offers=[...new Map(String(label??'').split(';').map(s=>s.trim()).filter(s=>s&&s!=='0').map(s=>[discountLabelKey(s),s])).values()];
 if(offers.length>4)return 'CHECK - QUÁ 4 ƯU ĐÃI';
 const known=new Set(Object.entries(grid??{}).filter(([key])=>/^B\d+$/.test(key)&&Number(key.slice(1))>=3&&Number(key.slice(1))<=500).map(([,value])=>discountLabelKey(value)));
 for(const offer of offers){
  const match=discountPolicyMatch(offer,date,regime);
  if(match.issues.length)return match.issues[0];
  if(!match.ruleKey&&!known.has(discountLabelKey(offer))&&!/^(?:Big Bang Sep 2026 - (?:Giảm Tiền|Tặng tháng)|Special 30%)/i.test(offer))return 'CHECK - DISCOUNT CHƯA CÓ RULE: '+offer;
 }
 return 'OK';
}

// Kept for the original engine: the same pre-discount monthly source is used
// for a regular two-month package. No trial rate or invoice supplies a price.
export function regularTwoMonthPrice(data,{course,hours,package:pkg,group}){
 if(!/^2\s+months?$/i.test(String(pkg??'').trim()))return null;
 const unit=regularMonthlyPrice(data,{course,hours,group});
 return unit?{...unit,kind:'regular-two-month',amount:unit.monthly*2}:null;
}

export function matchingPrograms(label, programs, date) {
  if (!label || label === '0') return [];
  const match=discountPolicyMatch(label,date),text=discountLabelKey(label).replace(/[–—_:-]/g,' ').replace(/\s+/g,' ');
  let found = programs.filter(p => p.match.some(pattern => new RegExp(pattern,'iu').test(label)||new RegExp(normalize(pattern).replace(/ - /g,' ').replace(/ /g,'\\s+'),'iu').test(text)));
  if(match.programIds.length){found=found.filter(p=>!['oct-base','q4','sep-bigbang'].includes(p.id));for(const id of match.programIds){const p=programs.find(p=>p.id===id);if(p&&!found.includes(p))found.push(p);}}
  if(match.issues.length)found=[];
  if (/2024/.test(label)) found = found.filter(p => ['legacy','summer','premium-legacy'].includes(p.id));
  if (!match.period&&/2026 October - Promotion/i.test(label)) {
    found = found.filter(p => !['q4','oct-base'].includes(p.id) || p.id === (date >= serial('2026-10-06') ? 'q4' : 'oct-base'));
  }
  const datedRef = found.filter(p => ['ref-jun-aug','ref-q4'].includes(p.id));
  if (datedRef.some(p => inWindow(p,date))) found = found.filter(p => !datedRef.includes(p) || inWindow(p,date));
  return found.length ? found : programs.filter(p => p.id === 'manual');
}

export function promotionResult(cells, context, account, programs) {
  const label = String(cells.L ?? '').trim();
  const found = matchingPrograms(label,programs,Number(cells.D));
  const match=discountPolicyMatch(label,cells.D,cells.AO),checks=[...match.issues];
  if(match.kind==='straight'&&/installment/i.test(String(context.method??'')))checks.push('CHECK - TRẢ GÓP KHÔNG TẶNG TRẢ THẲNG');
  if(label&&label!=='0'&&cells.AL==='OTHER')checks.push('XÁC MINH - CHƯA ĐỦ BỘ GIÁ/CÔNG THỨC CHO DISCOUNT NÀY; xem quy tắc và chứng từ');
  if(context.voucherType==='PHẦN TRĂM'&&Number(cells.N)>0&&cells.CI==='OK')checks.push('XÁC MINH - CƠ SỞ % GIFTCODE: Bảng giá chung / Giftcode dòng 2 dùng Before − Discount; công thức Audit dùng Before. Cần đối chiếu điều kiện duyệt của mã khi cộng giảm tiền.');
  for (const p of found) {
    if (p.state !== 'confirmed') checks.push(`XÁC MINH - ${p.title}: ${p.state === 'unverified' ? 'chưa đủ chính sách được duyệt' : 'cần căn cứ thời kỳ/phê duyệt riêng'}`);
    if (typeof cells.D !== 'number') checks.push('CHECK - THIẾU NGÀY ÁP DỤNG PROMOTION');
    else {
      const current = !/^new$/i.test(String(context.contractType ?? ''));
      const from = serial(current && p.renewFrom ? p.renewFrom : p.from), to = serial(p.to);
      if (from !== null && cells.D < from || to !== null && cells.D >= to+1)
        checks.push(`CHECK - NGOÀI HẠN ${p.title}`);
    }
    if (p.id === 'clc') checks.push('XÁC MINH - CLC: đăng ký trước 30/06, trường hợp lệ và danh sách học bổng; hoàn tất trước 20/09');
    if (['early-renew','ielts-early'].includes(p.id)) checks.push('XÁC MINH - TÁI PHÍ SỚM: cần ngày hết phí và chứng từ full trước 2 tháng');
    if (p.id === 'ielts2026') checks.push('XÁC MINH - IELTS: đúng khóa/giờ, ghi danh trong ngày hoặc tái phí trước 30 ngày');
    if (p.id.startsWith('ref-')) checks.push('XÁC MINH - REFERRAL/SIBLING: cần hồ sơ quan hệ và thời điểm nhận thưởng');
    if (p.id === 'four-centers') {
      if (!/RGI|TPU|LNQ|LBB/i.test(String(cells.B))) checks.push('CHECK - NGOÀI 4 TRUNG TÂM ĐƯỢC HỖ TRỢ');
      if (/installment/i.test(String(context.method))) checks.push('XÁC MINH - SPECIAL 30%: cần suất trả góp cụm được duyệt');
      checks.push('XÁC MINH - SPECIAL 30%: đối tượng, gói và cấp coupon theo danh sách');
    }
    if (p.id === 'flash-aug') checks.push('XÁC MINH - FLASH SALE: full 26/08 hoặc cọc ≥2 tháng 26/08 rồi full ≤31/08; kiểm tra EPP');
    if (p.id === 'sep-bigbang') {
      if (/On Top 5%/i.test(label) && !(account?.cashBefore > 100000000)) checks.push('XÁC MINH - ON TOP 5%: chưa có đủ chứng từ thu >100 triệu cho một con');
      checks.push('XÁC MINH - BIG BANG SEP: EPP, full trong 14 ngày và thời điểm chương trình còn hiệu lực');
    }
    if (p.id === 'upgrade') checks.push('XÁC MINH - UPGRADE: đối chiếu danh sách gói 2/3 tháng đã mua tháng 4–6 và ngày bắt đầu học');
  }
  // A voucher is checked by the original voucher evaluator. Its prefix alone
  // never supplies proof of eligibility for a CEO or other student-specific case.
  if (/CEOAP/i.test(String(cells.K))) checks.push('XÁC MINH - CEO: cần case RCM duyệt đúng học viên, EPP và ngày full; không suy điều kiện từ tiền tố mã');
  return {programIds:found.map(p => p.id), checks:[...new Set(checks)], blocking:checks.length > 0,
    status:checks.some(x => x.startsWith('CHECK')) ? 'CHECK - ĐIỀU KIỆN / THỜI HẠN' : checks.length ? 'XÁC MINH - ĐIỀU KIỆN ÁP DỤNG' : 'OK'};
}

export function promotionCatalogue(master, programs) {
  const entries = master.promotions.map(row => {
    const found = matchingPrograms(row.A,programs,Number(row.H) || 0);
    return {id:`master-${row.row}`,label:row.A,masterRow:row.row,family:row.B,observedMethod:row.C,observedValue:row.D ?? null,
      observedFrom:row.H ?? null,observedTo:row.I ?? null,observedCount:row.G ?? 0,
      programIds:found.map(p => p.id),state:found.every(p => p.state === 'confirmed') ? 'confirmed' : found.some(p => p.state === 'unverified') ? 'unverified' : 'partial'};
  });
  return {programs,entries};
}
