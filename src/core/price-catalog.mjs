// The calculator and reference tables read the same typed schedule. Report
// observations and Audit results never supply a missing financial value.
import {priceFor,typedPriceInputs} from './price-resolver.mjs';
import {dateSerial} from './verification.mjs';
import {PRICE_PHASES} from './price-schedule.mjs';
export {PRICE_PHASES,roadmapSchedule} from './price-schedule.mjs';
import {pricingIdentity} from './pricing-key.mjs';
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>String(x??'').trim();
const key=x=>text(x).toUpperCase().replace(/\s+/g,' ');
const metadata=(policy,course,hours,pkg)=>(policy.priceEvidence?.master??[]).filter(r=>key(r.course)===key(course)&&key(r.hours)===key(hours)&&key(r.package)===key(pkg));
const kocNames=(meta,fallback)=>[...new Set(meta.map(m=>m.koc).filter(Boolean))].join(' / ')||fallback;
const financial=['monthly','months','gross','discount','net','maxTerms','straight','loyalty','referral'];
const iso=serial=>num(serial)?new Date(Date.UTC(1899,11,30)+serial*86400000).toISOString().slice(0,10):null;
function calculated(policy,inputs){
 const result=priceFor({policy},inputs.cells,inputs.context),identity=result?.identity??pricingIdentity(inputs.cells.H,inputs.cells.I,inputs.cells.J,inputs.context);
 const issue=result?.issue??(result?null:'CHECK - CHƯA CÓ GIÁ CHÍNH SÁCH ĐÃ XÁC MINH');
 return {...Object.fromEntries(financial.map(k=>[k,result?.[k]??(k==='months'?identity.months:null)])),pricingKey:result?.key??identity.key,variant:identity.variant,
  unit:result?.unit??identity.unit,weeks:result?.weeks??identity.weeks,unitPrice:result?.unitPrice??result?.monthly??null,issue,refs:result?.refs??[],resolution:inputs,
  status:/NHIỀU RULE|MÂU THUẪN|BẢNG GIÁ KHÔNG THỐNG NHẤT/.test(issue??'')?'conflict':!num(result?.gross)?'missing':issue?.startsWith('XÁC MINH')?'manual-policy':issue?'conflict':'ready'};
}
export function courseIdentity(course,hours){
 const c=pricingIdentity(course,hours,'');return {...c,group:c.group||text(course).split(' - ')[0]};
}
export function explicitPackage(value){
 const s=text(value),m=/^(\d+)\s*(?:months?|tháng)(?:\s+(siblings?))?$/i.exec(s);
 if(m)return m[2]?Number(m[1])===18?'36 SPLIT':null:Number(m[1]);
 if(/^36 SPLIT$/i.test(s))return '36 SPLIT';
 return null; // weeks, trial/upgrade and named products own separate policies
}
export function buildPriceCatalogue(policy){
 const rows=[],seen=new Set(),published={...policy,typedPrices:(policy.typedPrices??[]).filter(r=>!r.override)};
 for(const row of policy.roadmap??[])for(const phase of Object.keys(PRICE_PHASES)){
  const id=`ATLS|2026|${row.A}|${phase}`;if(seen.has(id))continue;seen.add(id);
  const spec=PRICE_PHASES[phase],course=`ATLS - New Price 2026 - Layer ${row.B}`,pkg=row.D==='36 SPLIT'?'18 months siblings':row.D+' months';
  const resolution={cells:{H:course,I:row.C+' hrs/week',J:pkg,D:dateSerial(spec.from),L:phase==='september'?`Big Bang Sep 2026 - Giảm Tiền - Layer ${row.B} - ${row.D==='36 SPLIT'?'36 months (chia đôi)':pkg} - ${row.C}hrs/week`:'0'},context:{group:'ATLS',contractType:'New'}};
  const r=calculated(published,resolution),meta=metadata(policy,course,row.C+' hrs/week',pkg);
  rows.push({id,group:'ATLS',year:2026,course:`ATLS - New Price 2026 - Layer ${row.B}`,layer:row.B,hours:row.C,package:row.D==='36 SPLIT'?'18 months siblings':row.D+' months',packageKey:row.D,
   regime:phase,regimeLabel:spec.label,from:spec.from,renewFrom:spec.renewFrom??spec.from,to:spec.to,currency:'VND',
   ...r,
   status:r.issue?'conflict':phase==='september'&&row.E<12?'not-applicable':'ready',note:r.issue??(phase==='september'&&row.E<12?'Có giá gốc; Big Bang Sep không có ưu đãi cho gói này.':'Giảm theo chương trình đã chọn; tháng tặng chỉ cộng khi đủ điều kiện. Voucher tính riêng.'),refs:r.refs,sourceRow:row.row,
   conditions:row.D==='36 SPLIT'?'Hai con ruột, hai CT khác học viên, full cùng ngày; Q4 mỗi con 18 tháng.':'New: ghi danh trong ngày / Current: điều kiện thanh toán và lịch sử tương ứng. ATLS/AGLS dùng chung khung 2026; AHP dùng Layer 2 từ 17/03.',
   observedPrice:meta.at(-1)?.observedGross??null,masterRefs:meta.map(m=>({file:m.file,sheet:m.sheet,row:m.row,source:m.source,statedGross:m.statedGross,observedGross:m.observedGross})),koc:kocNames(meta,row.C===3?'Kindergarten':'Primary / Secondary')});
 }
 for(const [i,r]of (policy.typedPrices??[]).entries()){
  const resolution=typedPriceInputs(r),selected=calculated(r.override?policy:published,resolution);
  rows.push({...r,...selected,id:r.override?'update-'+r.revision+'-'+i:'supplement-'+i,course:resolution.cells.H,package:resolution.cells.J,packageKey:r.packageKey??r.months,koc:r.koc??(r.variant==='weekly'?'Giá tuần toàn quốc':['vtdh','ahp'].includes(r.variant)?'All KOC':['IELTS','PREMIUM'].includes(r.group)?r.group:r.hours===3?'Kindergarten':'Primary / Secondary'),
   regime:r.regime??'supplement',regimeLabel:r.override?'Chính sách cập nhật · '+(r.revisionTitle||'Bản đang dùng'):'Chính sách bổ sung · '+r.variant,
   note:[selected.issue,r.approval,r.override?'Ưu tiên trong đúng khóa, ngày và phạm vi của bản cập nhật.':''].filter(Boolean).join(' ')});
 }
 for(const row of policy.prices??[]){
  const c=courseIdentity(row.C,row.D),pkg=explicitPackage(row.E);
  const identity=pricingIdentity(row.C,row.D,row.E),canonical=['standard','ahp','split'].includes(identity.variant)&&['ATLS','AGLS','AHP'].includes(c.group)&&c.year===2026&&pkg!==null&&rows.some(r=>r.layer===c.layer&&r.hours===c.hours&&String(r.packageKey)===String(pkg));
  if(canonical)continue;
  if((policy.typedPrices??[]).some(r=>!r.override&&(!r.center||r.center==='*')&&r.year===identity.year&&r.layer===identity.layer&&r.hours===identity.hours&&r.variant===identity.variant&&String(r.packageKey??r.months)===String(identity.packageKey)&&(r.group===identity.group||r.group==='ATLS/AGLS'&&['ATLS','AGLS'].includes(identity.group))))continue;
  const displayKey=[row.C,row.D,row.E].map(key).join('|');if(seen.has(displayKey))continue;seen.add(displayKey);
  const short=c.year===2026&&identity.variant==='standard'&&Number.isInteger(pkg)&&pkg>0&&pkg<=120&&!['12','18','24','36'].includes(String(pkg));
  const from=short?iso(policy.auditPolicy?.shortFrom):null,to=short?iso(policy.auditPolicy?.shortTo):null;
  const selected=calculated(policy,{cells:{H:row.C,I:row.D,J:row.E,L:'0',D:dateSerial(from)},context:{group:c.group,contractType:'New'}}),meta=metadata(policy,row.C,row.D,row.E);
  rows.push({id:'master-'+row.row,group:c.group,koc:kocNames(meta,null),year:c.year,course:row.C,layer:c.layer,hours:c.hours,package:row.E,packageKey:identity.packageKey,
   regime:'reference',regimeLabel:short?'Gói lẻ · giá tháng chưa giảm':'Chưa có chính sách đúng gói',from,to,currency:'VND',...selected,
   note:selected.issue??'Giá và quyền lợi dùng cùng quy tắc với bộ tính theo Contract. Voucher và điều kiện hồ sơ được xét riêng.',
   refs:selected.refs.length?selected.refs:[{file:'Bang_gia_chung_doi_chieu_Report.xlsx',sheet:'Bảng giá chung',row:row.row}],sourceRow:row.row,observedPrice:meta.at(-1)?.observedGross??(num(row.K)?row.K:null),masterRefs:meta.map(m=>({file:m.file,sheet:m.sheet,row:m.row,source:m.source,statedGross:m.statedGross,observedGross:m.observedGross}))});
 }
 const updates=rows.filter(r=>r.override);
 for(const r of rows.filter(r=>!r.override&&r.regime!=='reference')){
  const variant=r.variant??(String(r.packageKey).endsWith('SPLIT')?'split':'standard');
  const replacements=updates.filter(u=>(u.group===r.group||[u.group,r.group].includes('ATLS/AGLS')&&['ATLS','AGLS','ATLS/AGLS'].includes(u.group)&&['ATLS','AGLS','ATLS/AGLS'].includes(r.group))&&u.year===r.year&&u.layer===r.layer&&u.hours===r.hours&&u.variant===variant&&String(u.packageKey)===String(r.packageKey)&&u.from<=r.to&&r.from<=u.to);
  if(replacements.length){r.status='overridden';r.note='Giá phát hành. Phần được thay thế: '+replacements.map(u=>`${u.from}–${u.to}, ${u.group}, center ${u.center||'*'}, đối tượng ${u.contractType||'*'}: dùng ${u.revisionTitle||'bản cập nhật'}`).join('; ')+'. Ngoài phạm vi này tiếp tục dùng giá phát hành.';}
 }
 return rows;
}
export function policyRuleCatalogue(policy,prices=buildPriceCatalogue(policy)){
 const months=n=>num(n)?'+'+n+' tháng':'chưa xác định';
 return [...prices.map(r=>({...r,id:'rule-'+r.id,ruleKey:[r.regime,r.pricingKey??[r.layer,r.hours,r.packageKey].join('|')].join('|'),benefit:`Giảm ${num(r.discount)?r.discount.toLocaleString('vi-VN')+' VND':'chưa xác định'}; trả thẳng ${months(r.straight)}; loyalty tối đa ${months(r.loyalty)}; referral ${months(r.referral)} theo điều kiện.`,conditions:r.conditions??r.issue??'Cần chính sách đúng khóa/gói và kỳ hiệu lực.',stacking:policy.policyRegister?.stacking?.[r.regime]??'Theo chính sách của từng kỳ.'})),...(policy.policyRegister?.rules??[])];
}
