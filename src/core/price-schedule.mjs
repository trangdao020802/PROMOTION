// Verified source schedules shared by catalogue and Contract pricing.
const num=x=>typeof x==='number'&&Number.isFinite(x);
export const PRICE_PHASES={
 base:{label:'Giá nền 2026',from:'2026-03-01',renewFrom:'2026-03-17',to:'2026-09-30',discount:'H',net:'I',terms:'J',straight:null},
 september:{label:'Big Bang Sep 2026',from:'2026-09-01',to:'2026-09-30',discount:'K',net:'L',terms:'N',straight:'M'},
 october:{label:'Giá nền tháng 10',from:'2026-10-01',to:'2026-10-05',discount:'P',net:'Q',terms:'S',straight:'R'},
 q4:{label:'Big Bang Q4 2026',from:'2026-10-06',to:'2026-12-31',discount:'U',net:'V',terms:'Z',straight:'W'}
};
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
