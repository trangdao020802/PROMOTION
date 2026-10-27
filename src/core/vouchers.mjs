import {dateSerial} from './verification.mjs';
export const voucherCode=value=>{const code=String(value??'').trim().toUpperCase();return code==='0'?'':code;};
export const EMPTY_VOUCHER={code:'',label:'',studentId:'',studentName:'',center:'',startDate:'',endDate:'',type:'',amount:null,rate:null,minimum:null,maximum:null,status:'PENDING',approvalNote:''};
const fields=new Set(Object.keys(EMPTY_VOUCHER));
export function validateVoucher(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!fields.has(k)))return 'Thông tin voucher không hợp lệ.';
 if(typeof v.code!=='string'||!voucherCode(v.code)||v.code.length>150||/[\x00-\x1f\x7f]/.test(v.code))return 'Giftcode No cần từ 1 đến 150 ký tự, không xuống dòng.';
 for(const k of ['label','studentId','studentName','center','approvalNote'])if(typeof v[k]!=='string'||v[k].length>(k==='approvalNote'?2000:200))return 'Tên, học viên, trung tâm hoặc căn cứ voucher không hợp lệ.';
 for(const k of ['startDate','endDate'])if(v[k]!==''&&dateSerial(v[k])===null)return 'Ngày hiệu lực voucher không hợp lệ.';
 if(v.startDate&&v.endDate&&v.startDate>v.endDate)return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc voucher.';
 if(!['','amount','percent'].includes(v.type)||!['PENDING','APPROVED','REJECTED','CLOSED','INACTIVE'].includes(v.status))return 'Loại giảm/trạng thái voucher không hợp lệ.';
 for(const k of ['amount','rate','minimum','maximum'])if(v[k]!==null&&(typeof v[k]!=='number'||!Number.isFinite(v[k])||v[k]<0||v[k]>(k==='rate'?1:1e13)))return 'Số tiền không âm; tỷ lệ từ 0 đến 100%.';
 if(v.maximum>0&&v.minimum>v.maximum)return 'Mức sàn không được vượt mức trần voucher.';
 if(['APPROVED','CLOSED'].includes(v.status))return voucherMissing(v);
 return null;
}
export function voucherMissing(v){
 if(!v.studentId.trim()||!v.studentName.trim())return 'Cần Student ID và tên học viên đã đối chiếu trước khi duyệt voucher.';
 if(!v.center.trim())return 'Cần trung tâm/phạm vi áp dụng trước khi duyệt voucher.';
 if(!v.startDate||!v.endDate)return 'Cần đủ ngày bắt đầu và kết thúc voucher.';
 if(v.type==='amount'?!(v.amount>0):v.type==='percent'?!(v.rate>0&&v.rate<=1):true)return 'Cần loại và mức giảm hợp lệ trước khi duyệt voucher.';
 if(!v.approvalNote.trim())return 'Ghi căn cứ/phê duyệt voucher trước khi chuyển sang Đã duyệt.';
 return null;
}
export function voucherInput(v){return Object.fromEntries(Object.entries({...EMPTY_VOUCHER,...v}).filter(([k])=>fields.has(k)));}
export function nativeVoucherCodes(data){return new Set(Object.entries(data.grids.PROMO_VOUCHER).filter(([key])=>/^AH\d+$/.test(key)&&Number(key.slice(2))>=3&&Number(key.slice(2))<=2500).map(([,v])=>voucherCode(v)).filter(Boolean));}
export function voucherReference(v,i){const row=2501+i;return {row,M:v.label||v.code,AH:v.code,U:v.studentName,O:v.center,P:dateSerial(v.startDate),Q:dateSerial(v.endDate),R:v.status,Z:v.type==='amount'?'SỐ TIỀN':v.type==='percent'?'PHẦN TRĂM':'',AA:v.amount,V:v.rate,AB:v.minimum,AC:v.maximum,studentId:v.studentId,approvalNote:v.approvalNote,custom:true,version:v.version,updatedAt:v.updatedAt};}
export function withVoucherRegistry(base,vouchers){
 const native=nativeVoucherCodes(base),entries=vouchers.filter(v=>!native.has(voucherCode(v.code))).map((v,i)=>({...v,code:voucherCode(v.code),row:2501+i}));
 const grid=Object.fromEntries(Object.entries(base.grids.PROMO_VOUCHER).filter(([k])=>Number(k.replace(/^[A-Z]+/,''))<=2500));
 entries.forEach((v,i)=>{for(const [col,value]of Object.entries(voucherReference(v,i)))if(/^[A-Z]+$/.test(col))grid[col+v.row]=value??'';grid['X'+v.row]=v.row;});
 const end=Math.max(2500,2500+entries.length),names={...base.names};for(const [key,value]of Object.entries(names))if(key.startsWith('GC_'))names[key]=value.replace(/\$2500\b/g,'$'+end);
 return {...base,names,grids:{...base.grids,PROMO_VOUCHER:grid},choices:{...base.choices,K:[...new Set([...base.choices.K,...entries.map(v=>v.code)])]},extensions:{...base.extensions,customVouchers:entries}};
}
export function customVoucherIssue(v,studentId){
 if(!['APPROVED','CLOSED'].includes(v.status))return 'CHECK - VOUCHER MỚI CHƯA ĐƯỢC DUYỆT / KHÔNG ÁP DỤNG';
 const missing=voucherMissing(v);if(missing)return 'CHECK - '+missing;
 if(voucherCode(v.studentId)!==voucherCode(studentId))return 'CHECK - SAI STUDENT ID VOUCHER';
 return null;
}

// The voucher system calls Times City HN24.TCY; PaymentList/Export call it
// HN24.TC. This is an explicit alias, never a match on a contract/code prefix.
const centerKey=value=>voucherCode(value).normalize('NFC').replace(/[\s._-]+/g,'');
const centerAliases=new Map([['HN24TCY','HN24TC'],['TIMESCITY','HN24TC']]);
export const voucherCenterKey=value=>{const key=centerKey(value);return centerAliases.get(key)??key;};
// Region matching retains the approved Audit voucher-center formula.
export function voucherCenterApplies(scope,center){
 const value=voucherCode(scope),code=voucherCenterKey(center),parts=value.split(/[,;|\n]/).map(s=>s.trim()).filter(Boolean);
 if(!value||!code)return false;
 if(['ALL','TOÀN QUỐC'].includes(value)||parts.includes('NORTH')&&parts.includes('SOUTH'))return true;
 if(parts.some(part=>voucherCenterKey(part)===code))return true;
 return parts.includes('NORTH')&&/^(HN|BN|HY|VP|VI|QN)/.test(code);
}
