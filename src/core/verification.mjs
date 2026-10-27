import {discountPolicyMatch} from './promotions.mjs';
const own=(value,key)=>Object.hasOwn(value,key);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const code=/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/;
const identifier=value=>String(value??'').trim().toUpperCase();
const displayDay=day=>new Date(Date.UTC(1899,11,30)+day*86400000).toISOString().slice(0,10).split('-').reverse().join('/');
export const MAX_EVIDENCE_BYTES=5*1024*1024;
export const EMPTY_VERIFICATION={siblingRelationship:'',partnerContract:'',partnerStudentId:'',partnerCourse:'',ownFullDate:'',partnerFullDate:'',registrationDate:'',placementDate:'',priorFees:null,stoppedDays:null,courseConfirmed:'',evidenceIds:[],note:''};
export function dateSerial(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const date=new Date(value+'T00:00:00Z');return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value?(+date-Date.UTC(1899,11,30))/86400000:null;
}
export function fullPaymentDay(account){
 const target=account?.paid?.target>0?account.paid.target:account?.snapshot?.target;
 if(!(target>0)||account.warnings?.length)return null;
 const byDay=new Map();for(const e of account.events??[]){const day=Math.floor(e.date);byDay.set(day,(byDay.get(day)??0)+e.amount);}
 let balance=0,full=null;
 for(const [day,amount] of [...byDay].sort((a,b)=>a[0]-b[0])){const before=balance;balance+=amount;if(balance<target-1)full=null;else if(before<target-1)full=day;}
 return balance>=target-1?full:null;
}
export function validateVerification(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!own(EMPTY_VERIFICATION,k)))return 'Thông tin xác minh không hợp lệ.';
 for(const key of ['siblingRelationship','courseConfirmed'])if(v[key]!==undefined&&!['','yes','no'].includes(v[key]))return 'Chọn Chưa xác nhận / Có / Không.';
 for(const key of ['partnerContract','partnerStudentId'])if(v[key]!==undefined&&(typeof v[key]!=='string'||v[key]!==''&&(!code.test(v[key])||Object.hasOwn(Object.prototype,v[key]))))return 'Mã CT/học viên đối ứng không hợp lệ.';
 if(v.partnerCourse!==undefined&&!['','ATLS','IELTS','OTHER'].includes(v.partnerCourse))return 'Chương trình đối ứng không hợp lệ.';
 for(const key of ['ownFullDate','partnerFullDate','registrationDate','placementDate'])if(v[key]!==undefined&&v[key]!==''&&dateSerial(v[key])===null)return 'Ngày xác minh phải có dạng YYYY-MM-DD hợp lệ.';
 if(v.priorFees!==undefined&&v.priorFees!==null&&(typeof v.priorFees!=='number'||!Number.isFinite(v.priorFees)||v.priorFees<0||v.priorFees>1e13))return 'Lịch sử học phí phải là số từ 0 đến 10.000 tỷ; để trống nếu chưa rõ.';
 if(v.stoppedDays!==undefined&&v.stoppedDays!==null&&(!Number.isSafeInteger(v.stoppedDays)||v.stoppedDays<0||v.stoppedDays>36500))return 'Số ngày ngừng học phải từ 0 đến 36.500; để trống nếu chưa rõ.';
 if(v.note!==undefined&&(typeof v.note!=='string'||v.note.length>4000))return 'Ghi chú xác minh tối đa 4.000 ký tự.';
 if(v.evidenceIds!==undefined&&(!Array.isArray(v.evidenceIds)||v.evidenceIds.length>8||new Set(v.evidenceIds).size!==v.evidenceIds.length||v.evidenceIds.some(id=>typeof id!=='string'||!uuid.test(id))))return 'Mỗi xác minh dùng tối đa 8 minh chứng hợp lệ, không trùng.';
 return null;
}
export function verificationInput(patch){return {...EMPTY_VERIFICATION,...patch,evidenceIds:[...(patch?.evidenceIds??[])]};}
export function verificationMetadata(data,group,input,packageValue,patches=new Map()){
 const v=verificationInput(input),hasInput=!!input,proof=v.evidenceIds.length>0,pending=[],overrides={},conditions=[];
 let conditionId='sibling';
 const key=packageValue,split=key==='36 SPLIT',current=!/^new$/i.test(String(group.raw?.G??data.grids.RAW_REPORT['G'+group.rawRow]??''));
 const date=Number(group.cells.D),rule=data.grids.RULE,guide=data.grids.HUONG_DAN,payment=data.grids.RAW_REPORT['D'+group.rawRow];
 const guideRows=Object.keys(guide).filter(k=>/^E\d+$/.test(k)&&guide[k]===payment).map(k=>k.slice(1));
 const oldPolicyApproved=guideRows.length===1&&guide['P'+guideRows[0]]==='YES'&&String(guide['Q'+guideRows[0]]??'').trim();
 const q4=date>=rule.Z83&&date<rule.Z84+1&&!oldPolicyApproved;
 const ownPatch=patches.get(group.id)??{},label=own(ownPatch,'L')?ownPatch.L:group.cells.L;
 const policyMatch=discountPolicyMatch(label,date);
 const needsLoyalty=q4&&current&&!['straight','referral'].includes(policyMatch.kind)&&[18,24,36,'36 SPLIT'].includes(key)&&(policyMatch.period==='q4'||policyMatch.period==='october'||/Q4|Quý 4|From 06\/10|2026 October - Promotion/i.test(String(label??'')));
 const missing=(message)=>{pending.push(message);let c=conditions.find(c=>c.id===conditionId);if(!c){c={id:conditionId,messages:[]};conditions.push(c);}c.messages.push(message);};
 let siblingVerified=false,loyaltyVerified=false,courseVerified=false;
 const partner=data.contractGroups.find(g=>g.kind==='contract'&&identifier(g.ct)===identifier(v.partnerContract)),partnerPatch=partner?patches.get(partner.id)??{}:{};
 if(split){
  if(v.siblingRelationship!=='yes')missing(v.siblingRelationship==='no'?'Hồ sơ xác nhận không phải hai con ruột; gói sibling chưa đủ điều kiện.':'Xác nhận quan hệ hai con ruột và đính kèm căn cứ.');
  if(!v.partnerContract||!/-CT-/i.test(v.partnerContract)||identifier(v.partnerContract)===identifier(group.ct))missing('Chọn CT đối ứng khác CT đang kiểm tra.');
  if(!v.partnerStudentId||identifier(v.partnerStudentId)===identifier(group.cells.F))missing('Ghi mã học viên đối ứng khác học viên hiện tại.');
  if(v.partnerCourse!=='ATLS')missing('Gói chia đôi cần học viên đối ứng học ATLS; không ghép ATLS với IELTS.');
  if(partner&&identifier(partner.cells.F)!==identifier(v.partnerStudentId))missing('Student ID đối ứng không khớp CT trong nguồn.');
  if(partner){
   const course=String(own(partnerPatch,'H')?partnerPatch.H:partner.cells.H??'').trim();
   if(!/^ATLS/i.test(course))missing('Course fee tại CT đối ứng không phải ATLS trong dữ liệu đang dùng.');
   const pkg=String(own(partnerPatch,'J')?partnerPatch.J:partner.cells.J??'').trim();
   if(!/^(?:18\s+(?:months?|tháng)\s+siblings|36\b.*(?:SPLIT|chia đôi|siblings))/i.test(pkg))missing('CT đối ứng chưa được ghi nhận là nửa gói 36 tháng.');
  }
  const ownDay=dateSerial(v.ownFullDate),partnerDay=dateSerial(v.partnerFullDate);
  if(ownDay===null||partnerDay===null)missing('Ghi ngày đóng đủ phí của cả hai CT.');
  else if(ownDay!==partnerDay)missing('Hai CT đóng đủ phí khác ngày; chưa đủ điều kiện gói 36 chia đôi.');
  if(q4&&ownDay!==null&&(ownDay<rule.Z83||ownDay>=rule.Z84+1))missing('Ngày full nằm ngoài thời hạn Q4 của bảng giá đang dùng.');
  if(ownDay!==null&&ownDay>Math.floor(group.account.cutoff))missing('Ngày full sau ngày chốt dữ liệu; cập nhật PaymentList để đối chiếu đúng phạm vi.');
  const actualDay=fullPaymentDay(group.account),partnerActual=partner?fullPaymentDay(partner.account):null;
  if(ownDay!==null&&actualDay!==null&&ownDay!==actualDay)missing(`Ngày full CT này: nguồn ${displayDay(actualDay)}, đang nhập ${displayDay(ownDay)}.`);
  if(partnerDay!==null&&partnerActual!==null&&partnerDay!==partnerActual)missing(`Ngày full đối ứng: nguồn ${displayDay(partnerActual)}, đang nhập ${displayDay(partnerDay)}.`);
  if(!proof)missing('Đính kèm minh chứng cho xác nhận sibling.');
  siblingVerified=pending.length===0;
  if(hasInput){overrides.AT=siblingVerified?'YES':v.siblingRelationship==='no'?'NO':'';overrides.AU=siblingVerified?'ATLS':'';overrides.AV=siblingVerified?'YES':'';}
 }
 const siblingPending=split?[...pending]:[];
 const siblingRelationshipConfirmed=split&&v.siblingRelationship==='yes'&&!!v.partnerContract&&/-CT-/i.test(v.partnerContract)&&identifier(v.partnerContract)!==identifier(group.ct)&&!!v.partnerStudentId&&identifier(v.partnerStudentId)!==identifier(group.cells.F)&&(!partner||identifier(partner.cells.F)===identifier(v.partnerStudentId));
 conditionId='loyalty';
 if(needsLoyalty){
  const threshold=Number(rule.Z87),maxDays=Number(rule.Z88),knownFees=typeof v.priorFees==='number',knownGap=typeof v.stoppedDays==='number';
  // A proved ineligible condition is enough to establish zero; missing evidence never becomes zero.
  const ineligible=knownFees&&v.priorFees<threshold||knownGap&&v.stoppedDays>maxDays;
  const complete=proof&&(ineligible||knownFees&&knownGap&&v.priorFees>threshold);
  if(knownFees&&v.priorFees===threshold&&!ineligible)missing('Lịch sử đúng 30 triệu: bản Audit yêu cầu xác minh riêng ngưỡng loyalty trước khi chốt tháng tặng.');
  loyaltyVerified=complete;
  if(!knownFees&&!ineligible)missing('Bổ sung tổng học phí đã đóng trước đợt này để xét loyalty.');
  if(knownFees&&v.priorFees>threshold&&!knownGap)missing('Bổ sung số ngày ngừng học để xét loyalty.');
  if(!proof)missing('Đính kèm lịch sử học phí/ngày ngừng học làm căn cứ loyalty.');
  if(hasInput){overrides.AR=complete&&knownFees?v.priorFees:'';overrides.AS=complete&&knownGap?v.stoppedDays:'';if(complete&&ineligible)overrides.BB=0;}
 }
 conditionId='course';
 const noInvoice=group.warnings.some(w=>w.startsWith('Chưa có dòng hóa đơn CT trong RAW_REPORT'));
 if(noInvoice){const absent=[['H','Course fee KOC'],['I','Hour/week'],['J','Package']].filter(([k])=>!String(own(ownPatch,k)?ownPatch[k]:group.cells[k]??'').trim());courseVerified=v.courseConfirmed==='yes'&&proof&&!absent.length;if(!courseVerified)missing(absent.length?`Còn thiếu ${absent.map(([,label])=>label).join(', ')}. Web tự đọc CT nhận; chỉ bổ sung tay nếu nguồn chưa có, rồi xác nhận theo hợp đồng và chọn căn cứ.`:'Xác nhận trường khóa học bổ sung tay theo hợp đồng / Export và chọn minh chứng.');}
 const registrationRequired=q4&&!current&&[12,18,24,36,'36 SPLIT'].includes(key)&&!!policyMatch.ruleKey;
 let registrationVerified=!registrationRequired;
 conditionId='registration';
 if(registrationRequired){
  const registered=dateSerial(v.registrationDate),placement=dateSerial(v.placementDate),before=pending.length;
  if(registered===null||placement===null)missing('Bổ sung ngày ghi danh và ngày kiểm tra trình độ để xét học bổng học viên mới.');
  else if(registered!==placement)missing('Ngày ghi danh khác ngày kiểm tra trình độ; chưa đủ điều kiện học bổng ghi danh trong ngày.');
  if(registered!==null&&(registered<rule.Z83||registered>Math.floor(group.account.cutoff)))missing('Ngày ghi danh ngoài kỳ chính sách/ngày chốt dữ liệu.');
  if(!proof)missing('Đính kèm căn cứ kiểm tra trình độ và ghi danh trong ngày.');
  registrationVerified=pending.length===before;
 }
 return {input:v,hasInput,proof,conditions,siblingRequired:split,loyaltyRequired:needsLoyalty,courseRequired:noInvoice,registrationRequired,registrationVerified,siblingVerified,...(hasInput&&split?{siblingRelationshipConfirmed,siblingPending}:{}),loyaltyVerified,courseVerified,partnerKnown:!!partner,pending:[...new Set(pending)],overrides};
}
export function calculationIssues(row,verification){
 const issues=[],c=row.cells,add=(code,columns,message,action)=>issues.push({code,columns,message,action});
 const inputs=[['H','Course fee KOC'],['I','Hour/week'],['J','Package']].filter(([col])=>!String(c[col]??'').trim());
 if(inputs.length)add('inputs',['M','N','Q','R','S'],`Thiếu ${inputs.map(([,label])=>label).join(', ')}.`, 'Bổ sung tại Course info; đối chiếu thông tin khóa học với hợp đồng / Export.');
 if(String(c.BD).includes('CHƯA CÓ RULE')&&!inputs.length)add('rule',['M','N','Q','R','S'],'Chưa tìm được quy tắc đúng loại giá, giờ và gói.','Kiểm tra ba trường đầu vào và bảng RULE đúng thời kỳ.');
 if(verification.loyaltyRequired&&!verification.loyaltyVerified)add('loyalty',['R'],'Chưa đủ lịch sử học phí để chốt tháng loyalty và tổng giờ.','Đối chiếu lịch sử học phí/ngày ngừng học rồi tích cột Loyalty · Duyệt.');
 if(verification.siblingRequired&&!verification.siblingVerified)add('sibling',['R'],verification.siblingRelationshipConfirmed?'Sibling đã xác nhận; còn điều kiện gói học.':'Gói sibling còn điều kiện cần xác minh.',verification.siblingRelationshipConfirmed?'Đối chiếu ngày full rồi tích cột Gói sibling · Duyệt.':'Đối chiếu CT/học viên đối ứng, quan hệ và ngày full cùng ngày rồi tích cột Gói sibling · Duyệt.');
 if(c.CI&&c.CI!=='OK'&&c.CI!=='NO GIFTCODE')add('giftcode',['O','Q'],String(c.CI),'Kiểm tra mã, học viên, thời hạn và phê duyệt giftcode.');
 if(c.AL==='OTHER')add('discount',['N','Q'],'Discount apply chưa có công thức được xác minh.','Đối chiếu đúng tên chương trình và điều kiện trong bộ nguồn.');
 for(const col of ['M','N','O','P','Q','R','S'])if((c[col]==null||c[col]==='')&&!issues.some(i=>i.columns.includes(col)))add('missing-'+col,[col],'Chưa đủ dữ liệu để tính chỉ tiêu này.',String(c.BD??'Xem ghi chú kiểm tra và nguồn tham chiếu.'));
 return issues;
}
