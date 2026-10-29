import {voucherCode,voucherInput,voucherMissing} from './vouchers.mjs';
import {mergeHubVoucher,voucherRecordProfile,voucherDetailURL} from './hub-voucher.mjs';
const blank=v=>v==null||String(v).trim()==='';
export function newCompletionRequest(scope='filtered',crypto=globalThis.crypto){
 const bytes=crypto.getRandomValues(new Uint8Array(16));return {id:'complete-'+Array.from(bytes,v=>v.toString(16).padStart(2,'0')).join(''),scope};
}
export function voucherNeedsRead(voucher){
 return !voucher||!!voucherMissing(voucherInput(voucher))||(!voucherDetailURL(voucher.hubUrl)&&voucher.status==='PENDING');
}
export function rowNeedsVoucher(row,vouchers=[]){
 const code=voucherCode(row.cells?.K);return !!code&&voucherNeedsRead(vouchers instanceof Map?vouchers.get(code):vouchers.find(v=>voucherCode(v.code)===code));
}
// Enrich only the receiving CT's saved/manual-effective code. A source write is
// checkpointed only after its voucher read has also finished or is already known.
export async function completeContractVoucher(row,payload,saved,io){
 const current=saved?.row??row,code=voucherCode(current.cells?.K??payload.giftcode);
 if(!code){if(Number(current.cells?.V)>0)throw Object.assign(Error('CT có tiền Giftcode nhưng chưa xác định được Giftcode No đầy đủ.'),{code:'course_unavailable'});return {state:'none'};}
 const previous=await io.loadVoucher(code);
 if(!voucherNeedsRead(previous))return {state:'known',code};
 io.progress?.('Đang đọc Voucher '+code+' trong nền…');
 const source=await io.readVoucher(code);if(io.signal?.aborted)throw Object.assign(Error('Đã dừng tra Voucher.'),{code:'cancelled'});
 const initial=voucherInput({...previous,code}),merged=mergeHubVoucher(initial,source,voucherRecordProfile(current));
 // Automatic completion fills gaps. Explicit values remain visible for review.
 const conflicts=[];
 for(const key of ['label','studentId','studentName','center','startDate','endDate','type','amount','rate','minimum','maximum']){
  if(!blank(initial[key])&&initial[key]!==merged[key]){if(!['label','studentName'].includes(key))conflicts.push(key);merged[key]=initial[key];}
 }
 if(conflicts.length){merged.status='PENDING';merged.approvalNote=(merged.approvalNote+'\nHub khác giá trị đang giữ: '+conflicts.join(', ')+'. Cần đối chiếu trước khi duyệt.').slice(-2000);}
 const result=await io.saveVoucher(merged,previous?.version??0);
 return {state:conflicts.length?'review':'saved',code,status:result.status??merged.status};
}
