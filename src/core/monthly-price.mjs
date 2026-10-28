import {pricingIdentity} from './pricing-key.mjs';
const text=value=>String(value??'').trim();
const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;

// A month before discount is the regular three-month schedule's monthly
// price. The Audit trial/promotion price is never a multiplication base.
export function regularMonthlyPrice(data,{course,hours,group}){
 const identity=pricingIdentity(course,hours,'3 months',{group});
 if(identity.year!==2026||!['standard','ahp'].includes(identity.variant)||identity.conflicts.length||!['ATLS','AGLS','AHP'].includes(identity.group)||![3,4].includes(identity.hours))return null;
 const policy=data.policy??data.extensions??{},layer=identity.layer,hour=identity.hours;
 const rows=(policy.roadmap??[]).filter(r=>r.A===`${layer}|${hour}|3`),row=rows[0];
 if(rows.length!==1||!positive(row.F)||row.E!==3||row.G!==row.F*3)return null;
 const corrected=(policy.monthlyRates??[]).filter(r=>r.layer===layer&&r.hours===hour);
 if(policy.monthlyRates&&(corrected.length!==1||corrected[0].monthly!==row.F))return null;
 if(policy.priceEvidence){const evidence=policy.priceEvidence.roadmap.filter(r=>r.key===row.A);if(evidence.length!==1||evidence[0].values.F!==row.F||evidence[0].values.G!==row.G||evidence[0].issues.length)return null;}
 const prices=(policy.prices??[]).filter(r=>text(r.C).toUpperCase()===text(course).toUpperCase()&&text(r.D)===`${hour} hrs/week`&&/^3\s+months?$/i.test(text(r.E))&&positive(r.J));
 if(prices.some(r=>r.J!==row.G))return null;
 return {kind:'regular-monthly',layer,hours:hour,monthly:row.F,refs:corrected[0]?.refs??[{file:'Lo_trinh_san_pham_CTKM_ATLS_2026.xlsx',sheet:'BẢNG GIÁ',row:row.row,cell:'F'+row.row}]};
}
