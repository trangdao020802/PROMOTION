// The calculator and reference tables read the same typed schedule. Report
// observations and Audit results never supply a missing financial value.
import {regularMonthlyPrice} from './monthly-price.mjs';
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>String(x??'').trim();
const key=x=>text(x).toUpperCase().replace(/\s+/g,' ');
const metadata=(policy,course,hours,pkg)=>(policy.priceEvidence?.master??[]).filter(r=>key(r.course)===key(course)&&key(r.hours)===key(hours)&&key(r.package)===key(pkg));
const kocNames=(meta,fallback)=>[...new Set(meta.map(m=>m.koc).filter(Boolean))].join(' / ')||fallback;
export const PRICE_PHASES={
 base:{label:'Giá nền 2026',from:'2026-03-01',renewFrom:'2026-03-17',to:'2026-09-30',discount:'H',net:'I',terms:'J',straight:null},
 september:{label:'Big Bang Sep 2026',from:'2026-09-01',to:'2026-09-30',discount:'K',net:'L',terms:'N',straight:'M'},
 october:{label:'Giá nền tháng 10',from:'2026-10-01',to:'2026-10-05',discount:'P',net:'Q',terms:'S',straight:'R'},
 q4:{label:'Big Bang Q4 2026',from:'2026-10-06',to:'2026-12-31',discount:'U',net:'V',terms:'Z',straight:'W'}
};
export function courseIdentity(course,hours){
 const c=/^(ATLS|AGLS) - New Price (2024|2026) - Layer ([123])$/i.exec(text(course));
 const h=/^([34])\s*(?:hrs|hours|giờ)\s*\/\s*(?:week|tuần)$/i.exec(text(hours));
 return {group:c?.[1]?.toUpperCase()??text(course).split(' - ')[0],year:c?Number(c[2]):null,layer:c?Number(c[3]):null,hours:h?Number(h[1]):null};
}
export function explicitPackage(value){
 const s=text(value),m=/^(\d+)\s*(?:months?|tháng)(?:\s+(siblings?))?$/i.exec(s);
 if(m)return m[2]?Number(m[1])===18?'36 SPLIT':null:Number(m[1]);
 if(/^36 SPLIT$/i.test(s))return '36 SPLIT';
 return null; // weeks, trial/upgrade and named products own separate policies
}
export function roadmapSchedule(policy,{layer,hours,pkg,phase}){
 const spec=PRICE_PHASES[phase];if(!spec)return null;
 const rows=(policy.roadmap??[]).filter(r=>r.A===`${layer}|${hours}|${pkg}`);
 if(!rows.length)return null;
 const row=rows[0],issues=[];
 if(rows.length!==1)issues.push('trùng khóa giá');
 if(row.B!==layer||row.C!==hours||String(row.D)!==String(pkg))issues.push('khóa và cột Layer/giờ/gói không thống nhất');
 if(!num(row.F)||row.F<=0||!num(row.E)||row.E<=0||!num(row.G)||Math.round(row.F*row.E)!==row.G)issues.push('giá tháng × số tháng khác giá gốc');
 const discount=row[spec.discount],net=row[spec.net],terms=row[spec.terms];
 if(!num(discount)||discount<0||discount>row.G||!num(net)||row.G-discount!==net)issues.push('giá gốc − giảm tiền khác tiền sau giảm');
 if(!num(terms)||!Number.isInteger(terms)||terms<0)issues.push('thiếu/sai giới hạn trả góp');
 const evidence=policy.priceEvidence?.roadmap?.filter(r=>r.key===row.A)??[];
 if(policy.priceEvidence&&evidence.length!==1)issues.push('thiếu căn cứ nguồn duy nhất');
 if(evidence.length===1){
  for(const col of ['B','C','D','E','F','G',spec.discount,spec.net,spec.terms,...(spec.straight?[spec.straight]:[]),...(phase==='q4'?['X','Y']:[])])
   if(evidence[0].values[col]!==row[col])issues.push('cột '+col+' khác file lộ trình đã đối chiếu');
  if(evidence[0].issues?.length)issues.push(...evidence[0].issues);
 }
 const refs=[{file:'Lo_trinh_san_pham_CTKM_ATLS_2026.xlsx',sheet:'BẢNG GIÁ',row:row.row,cell:spec.discount+row.row},...(evidence[0]?.refs?.[phase]??[])];
 return {row,layer,hours,pkg,phase:phase==='september'?'base':phase,regime:phase,months:row.E,monthly:row.F,
  gross:issues.length?null:row.G,discount:issues.length?null:discount,net:issues.length?null:net,maxTerms:issues.length?null:terms,
  straight:spec.straight?row[spec.straight]??0:0,loyalty:phase==='q4'?row.X??0:0,referral:phase==='q4'?row.Y??0:0,
  issue:issues.length?'CHECK - BẢNG GIÁ KHÔNG THỐNG NHẤT: '+[...new Set(issues)].join('; '):null,refs};
}
export function buildPriceCatalogue(policy){
 const rows=[],seen=new Set();
 for(const row of policy.roadmap??[])for(const phase of Object.keys(PRICE_PHASES)){
  const id=`ATLS|2026|${row.A}|${phase}`;if(seen.has(id))continue;seen.add(id);
  const r=roadmapSchedule(policy,{layer:row.B,hours:row.C,pkg:row.D,phase}),spec=PRICE_PHASES[phase];
   const meta=metadata(policy,`ATLS - New Price 2026 - Layer ${row.B}`,row.C+' hrs/week',row.D==='36 SPLIT'?'18 months siblings':row.D+' months');
  rows.push({id,group:'ATLS',year:2026,course:`ATLS - New Price 2026 - Layer ${row.B}`,layer:row.B,hours:row.C,package:row.D==='36 SPLIT'?'18 months siblings':row.D+' months',packageKey:row.D,
   regime:phase,regimeLabel:spec.label,from:spec.from,renewFrom:spec.renewFrom??spec.from,to:spec.to,currency:'VND',
   monthly:r.monthly,months:r.months,gross:r.gross,discount:r.discount,net:r.net,straight:r.straight,loyalty:r.loyalty,referral:r.referral,maxTerms:r.maxTerms,
   status:r.issue?'conflict':phase==='september'&&row.E<12?'not-applicable':'ready',note:r.issue??(phase==='september'&&row.E<12?'Có giá gốc; Big Bang Sep không có ưu đãi cho gói này.':'Giảm theo chương trình đã chọn; tháng tặng chỉ cộng khi đủ điều kiện. Voucher tính riêng.'),refs:r.refs,sourceRow:row.row,
   conditions:row.D==='36 SPLIT'?'Hai con ruột, hai CT khác học viên, full cùng ngày; Q4 mỗi con 18 tháng.':'New: ghi danh trong ngày / Current: điều kiện thanh toán và lịch sử tương ứng.',
   observedPrice:meta.at(-1)?.observedGross??null,masterRefs:meta.map(m=>({file:m.file,sheet:m.sheet,row:m.row,source:m.source,statedGross:m.statedGross,observedGross:m.observedGross})),koc:kocNames(meta,row.C===3?'Kindergarten':'Primary / Secondary')});
 }
 for(const row of policy.prices??[]){
  const c=courseIdentity(row.C,row.D),pkg=explicitPackage(row.E);
  const canonical=c.group==='ATLS'&&c.year===2026&&pkg!==null&&rows.some(r=>r.layer===c.layer&&r.hours===c.hours&&String(r.packageKey)===String(pkg));
  if(canonical)continue;
  const monthly=c.year===2026&&pkg!==null&&Number.isInteger(pkg)&&pkg>0&&pkg<=120?regularMonthlyPrice({policy},{course:row.C,hours:row.D,group:c.group}):null;
  // AGLS aliases in the reference file establish a gross price only. They do
  // not acquire ATLS Q4 discount/terms merely because their numbers coincide.
  const grossOnly=c.year===2026&&num(row.J)&&row.J>0&&!/Report.*chưa có/i.test(text(row.I));
  const gross=monthly&&!['12','18','24','36','36 SPLIT'].includes(String(pkg))?Math.round(monthly.monthly*pkg):grossOnly?row.J:null;
  const meta=metadata(policy,row.C,row.D,row.E);
  rows.push({id:'master-'+row.row,group:c.group,koc:kocNames(meta,null),year:c.year,course:row.C,layer:c.layer,hours:c.hours,package:row.E,packageKey:pkg,
   regime:'reference',regimeLabel:monthly&&[1,2].includes(pkg)?'Gói lẻ · giá tháng chưa giảm':'Giá gốc / cần chính sách riêng',from:null,to:null,currency:'VND',monthly:monthly?.monthly??null,months:typeof pkg==='number'?pkg:null,
   gross,discount:monthly&&[1,2].includes(pkg)?0:null,net:monthly&&[1,2].includes(pkg)?gross:null,maxTerms:monthly&&[1,2].includes(pkg)?0:null,straight:0,loyalty:0,referral:0,
   status:gross!==null?'gross-only':'missing',note:gross!==null?'Có giá gốc; ưu đãi và thời kỳ phải có chính sách đúng loại khóa/gói.':'Chưa có giá chính sách đã xác minh cho đúng khóa/phiên bản/gói. Không lấy giá Report để tính.',
   refs:[{file:'Bang_gia_chung_doi_chieu_Report.xlsx',sheet:'Bảng giá chung',row:row.row}],sourceRow:row.row,observedPrice:meta.at(-1)?.observedGross??(num(row.K)?row.K:null),masterRefs:meta.map(m=>({file:m.file,sheet:m.sheet,row:m.row,source:m.source,statedGross:m.statedGross,observedGross:m.observedGross}))});
 }
 return rows;
}
export function policyRuleCatalogue(policy,prices=buildPriceCatalogue(policy)){
 return [...prices.filter(r=>r.regime!=='reference').map(r=>({...r,id:'rule-'+r.id,ruleKey:[r.regime,r.layer,r.hours,r.packageKey].join('|'),benefit:`Giảm ${r.discount?.toLocaleString('vi-VN')??'Chưa tính'} VND; trả thẳng +${r.straight} tháng; loyalty tối đa +${r.loyalty} tháng; referral +${r.referral} tháng theo điều kiện.`,stacking:policy.policyRegister?.stacking?.[r.regime]??'Theo chính sách của từng kỳ.'})),...(policy.policyRegister?.rules??[])];
}
