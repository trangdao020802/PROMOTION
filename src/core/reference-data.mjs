import {voucherCode,voucherReference} from './vouchers.mjs';

// Each tab owns its source schema. In particular, a policy's label/price can
// never be interpreted as Giftcode No, student, dates or voucher amount.
export function referenceRows(data,section){
 if(section==='master')return data.priceCatalogue??data.prices??[];
 if(section==='prices')return data.ruleCatalogue??(data.rules??[]).filter(row=>row.K||row.A);
 if(section==='vouchers')return (data.customVouchers??[])
  .filter(v=>typeof v.code==='string'&&voucherCode(v.code))
  .map(voucherReference);
 return [];
}

export function updateVoucherCatalogue(data,vouchers){
 const customVouchers=vouchers.filter(v=>typeof v.code==='string'&&voucherCode(v.code));
 return {...data,customVouchers,vouchers:referenceRows({customVouchers},'vouchers'),
  choices:{...data.choices,K:[...new Set([...(data.choices?.K??[]),...customVouchers.map(v=>v.code)])]}};
}
