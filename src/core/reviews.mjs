import {fullPaymentDay,calculationIssues} from './verification.mjs';
import {resultReasons} from './result.mjs';

export const REVIEW_LABELS={ceo:'CEO / RCM',registration:'Ghi danh trong ngày',sibling:'Gói sibling',loyalty:'Loyalty',course:'Thông tin khóa học',referral:'Referral / Sibling',flash:'Flash Sale',special:'Học bổng đặc biệt',ontop:'On Top 5%',bigbang:'Big Bang Sep',clc:'CLC','early-renew':'Tái phí sớm',ielts:'IELTS',upgrade:'Upgrade','gift-basis':'Cơ sở % giftcode','source-comparison':'Đối chiếu thông số gốc'};
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return(n>>>0).toString(16)};
export function manualCheckKey(message){
 if(!/^XÁC MINH - /.test(message))return null;
 for(const [pattern,id]of [[/CEO:/,'ceo'],[/FLASH SALE/i,'flash'],[/SPECIAL 30%|HỌC BỔNG ĐẶC BIỆT/,'special'],[/REFERRAL\/SIBLING/,'referral'],[/ON TOP 5%/,'ontop'],[/BIG BANG SEP/,'bigbang'],[/CLC:/,'clc'],[/TÁI PHÍ SỚM/,'early-renew'],[/IELTS:/,'ielts'],[/UPGRADE:/,'upgrade'],[/CƠ SỞ % GIFTCODE/,'gift-basis'],[/36 tháng chia đôi/i,'sibling']])if(pattern.test(message))return id;
 return 'policy-'+hash(message);
}
export function reviewScope(row){
 const c=row.cells??{},a=row.reconciliation??row.account,context=row.context??{};
 return JSON.stringify(['review-v1',a?.ct??c.contractTotal??c.C,String(c.F??''),c.D,...['H','I','J','K','L'].map(k=>String(c[k]??'').trim()),context.method??'',context.term??'',context.contractType??'',fullPaymentDay(a),a?.paid?.target??a?.snapshot?.target??null,a?.net??null,...(context.voucherPolicyScope?[context.voucherPolicyScope]:[])]);
}
const itemScope=(row,id)=>reviewScope(row)+(id==='source-comparison'?JSON.stringify(['T','U','V','X'].map(k=>row.cells[k]??null)):'');
export const reviewAccepted=(patch,id,row)=>patch?.reviews?.[id]?.approved===true&&patch.reviews[id].scope===itemScope(row,id);
export function validateReviews(reviews){
 if(!reviews||typeof reviews!=='object'||Array.isArray(reviews)||Object.keys(reviews).length>60)return 'Các mục duyệt không hợp lệ.';
 for(const [id,value]of Object.entries(reviews))if(!(Object.hasOwn(REVIEW_LABELS,id)||/^policy-[a-f0-9]{1,8}$/.test(id))||!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['approved','scope'].includes(k))||typeof value.approved!=='boolean'||typeof value.scope!=='string'||value.scope.length>6000)return 'Mục duyệt cần đúng điều kiện, trạng thái và phạm vi CT/học viên.';
 return null;
}
export function applyReviews(row,patch={}){
 if(row.kind!=='contract')return {...row,reviews:{},reviewItems:[]};
 const scope=reviewScope(row),items=new Map(),add=(id,label,messages)=>{
  const item=items.get(id)??{id,label:label||REVIEW_LABELS[id]||'Chính sách riêng',messages:[],scope:itemScope(row,id),approved:reviewAccepted(patch,id,row)};
  item.messages=[...new Set([...item.messages,...messages])];items.set(id,item);
 };
 for(const condition of row.verification?.conditions??[])add(condition.id,REVIEW_LABELS[condition.id],condition.messages);
 for(const message of row.promotion?.checks??[]){const id=manualCheckKey(message);if(id)add(id,REVIEW_LABELS[id]??message.replace(/^XÁC MINH - /,'').split(':')[0], [message]);}
 const absent=[['T','Giá trước giảm'],['U','Discount'],['V','Giftcode'],['X','Tổng giờ']].filter(([k])=>typeof row.cells[k]!=='number');
 if(absent.length)add('source-comparison',REVIEW_LABELS['source-comparison'],['Báo cáo chưa có thông số tổng CT riêng cho '+absent.map(([,label])=>label).join(', ')+'. Đối chiếu hợp đồng/Export và phê duyệt thông số gốc. Ô thiếu tiếp tục để Chưa tính; chênh lệch đã có số vẫn được kiểm tra.']);
 const approved=id=>items.get(id)?.approved===true,verification={...row.verification};
 for(const [id,field]of [['registration','registrationVerified'],['sibling','siblingVerified'],['loyalty','loyaltyVerified'],['course','courseVerified']])if(approved(id))verification[field]=true;
 const removed=new Set((verification.conditions??[]).filter(c=>approved(c.id)).flatMap(c=>c.messages));
 verification.pending=(verification.pending??[]).filter(message=>!removed.has(message));
 const reviewItems=[...items.values()].map(item=>({...item,description:item.messages.join(' ')}));
 verification.hasInput=verification.hasInput||reviewItems.some(i=>i.approved);
 const promotion={...row.promotion,checks:(row.promotion?.checks??[]).filter(message=>!approved(manualCheckKey(message)))};
 promotion.blocking=promotion.checks.length>0;
 promotion.status=promotion.checks.some(c=>c.startsWith('CHECK'))?'CHECK - ĐIỀU KIỆN / THỜI HẠN':promotion.blocking?'XÁC MINH - ĐIỀU KIỆN ÁP DỤNG':'OK';
 const groupWarnings=(row.groupWarnings??[]).filter(w=>!(approved('course')&&['H','I','J'].every(k=>String(row.cells[k]??'').trim())&&w.startsWith('Chưa có dòng hóa đơn CT trong RAW_REPORT'))&&!(approved('source-comparison')&&/^[TUV]:/.test(w)));
 const cells={...row.cells,promoCheck:promotion.status};
 const pending=reviewItems.filter(i=>!i.approved&&i.messages.length);
 cells.verificationCheck=pending.length?`CHỜ DUYỆT (${pending.length})`:reviewItems.some(i=>i.approved)?'Đã duyệt':verification.pending.length?`CẦN BỔ SUNG (${verification.pending.length})`:'THEO DỮ LIỆU NGUỒN';
 cells.verificationNote=verification.pending.join(' | ');
 const issueRow={...row,cells,verification};
 const issues=calculationIssues(issueRow,verification);
 cells.calcNote=issues.map(i=>i.message+' '+i.action).join(' | ');
 for(const item of reviewItems)cells['review:'+item.id]=item.approved?'Đã duyệt':'Chờ duyệt';
 cells.reviewSummary=reviewItems.map(i=>i.label+': '+(i.approved?'Đã duyệt':'Chờ duyệt')).join(' | ');
 cells.AN=String(cells.AN??'').split(' | ').filter(message=>!approved(manualCheckKey(message))).concat(reviewItems.filter(i=>i.approved).map(i=>i.label+': Đã duyệt')).join(' | ');
 const result={...row,cells,verification,promotion,groupWarnings,reviewItems,reviews:patch.reviews??{},calculationIssues:issues};
 result.resultReasons=resultReasons(result);cells.AF=result.resultReasons.length?'CHECK':'OK';cells.resultNote=result.resultReasons.join(' | ');
 return result;
}
export function reviewTableColumns(columns,rows){
 const items=new Map();for(const row of rows)for(const item of row.reviewItems??[])items.set(item.id,item);
 const extra=[...items.values()].sort((a,b)=>a.label.localeCompare(b.label,'vi')).map(item=>({key:'review:'+item.id,reviewId:item.id,label:item.label+' · Duyệt',group:4,width:200,kind:'review'}));
 const at=columns.findIndex(c=>c.key==='AF');return [...columns.slice(0,at),...extra,...columns.slice(at)];
}
export function updateReview(row,id,approved){const item=row.reviewItems?.find(i=>i.id===id);if(!item)return row.reviews??{};return {...row.reviews,[id]:{approved,scope:item.scope}};}
