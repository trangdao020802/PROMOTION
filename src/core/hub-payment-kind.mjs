export const hubPaymentType=p=>String(p?.PaymentTypeName||p?.PaymentType||p?.type||'').trim();
export const outgoingHubPayment=p=>Number(p?.PaymentTypeId??p?.typeId)===8||/\b(?:moving|transfer)[\s-]*out\b/i.test(hubPaymentType(p));

// A method such as Online Payments also appears on internal Hub movements.
export function internalHubPayment(p){
 const type=hubPaymentType(p);
 return outgoingHubPayment(p)||Number(p?.PaymentTypeId??p?.typeId)===10||
  /^other$/i.test(type)||/transfer|moving|deposit[\s-]+to[\s-]+contract/i.test(type+' '+String(p?.method??''));
}
