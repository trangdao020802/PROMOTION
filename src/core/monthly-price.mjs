const text=value=>String(value??'').trim();
const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;

// A month before discount is the regular three-month schedule's monthly
// price. The Audit trial/promotion price is never a multiplication base.
export function regularMonthlyPrice(data,{course,hours,group}){
 const match=/^(ATLS|AGLS) - New Price 2026 - Layer ([123])$/i.exec(text(course));
 const weekly=/^([34])\s*(?:hrs|hours|giờ)\s*\/\s*(?:week|tuần)$/i.exec(text(hours));
 if(!match||!weekly||!['ATLS','AGLS'].includes(text(group).toUpperCase()))return null;
 const policy=data.policy??data.extensions??{},layer=Number(match[2]),hour=Number(weekly[1]);
 const rows=(policy.roadmap??[]).filter(r=>r.A===`${layer}|${hour}|3`),row=rows[0];
 if(rows.length!==1||!positive(row.F)||row.E!==3||row.G!==row.F*3)return null;
 const corrected=(policy.monthlyRates??[]).filter(r=>r.layer===layer&&r.hours===hour);
 if(policy.monthlyRates&&(corrected.length!==1||corrected[0].monthly!==row.F))return null;
 const prices=(policy.prices??[]).filter(r=>text(r.C).toUpperCase()===text(course).toUpperCase()&&text(r.D)===`${hour} hrs/week`&&/^3\s+months?$/i.test(text(r.E))&&positive(r.J));
 if(prices.some(r=>r.J!==row.G))return null;
 return {kind:'regular-monthly',layer,hours:hour,monthly:row.F,refs:corrected[0]?.refs??[{file:'Lo_trinh_san_pham_CTKM_ATLS_2026.xlsx',sheet:'BẢNG GIÁ',row:row.row,cell:'F'+row.row}]};
}
