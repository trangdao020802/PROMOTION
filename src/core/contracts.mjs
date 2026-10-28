import {WorkbookEngine} from './engine.mjs';
import {discountPolicyMatch} from './promotions.mjs';
import {unionReceipts,unionTransfers,invoiceEligible,invoiceFunding} from './reconcile.mjs';
import {verificationMetadata,calculationIssues} from './verification.mjs';
import {withVoucherRegistry} from './vouchers.mjs';
import {applyCourseInfo,withCourseSources} from './course-info.mjs';
import {upstreamTransfers} from './payment-trace.mjs';
import {contractSettlements} from './contract-settlements.mjs';
import {auditPackageKey} from './audit-policy.mjs';

const fields=['H','I','J','K','L'];
const rawFields={A:'B',B:'C',C:'E',D:'O',E:'P',F:'R',G:'S',H:'Z',I:'AA',J:'AB',K:'AO',L:'AQ',T:'AC',U:'AD',V:'AE',X:'AG'};
const uniq=values=>[...new Set(values.filter(v=>v!==null&&v!==undefined&&v!==''))];
const sum=rows=>rows.reduce((n,r)=>n+r.amount,0);
const isCT=value=>/-CT-/i.test(value??'');
const own=(obj,key)=>Object.hasOwn(obj,key);

// Package is the course bought by this CT. A promotion name containing 36/36
// does not change a plain "36 months" course into half a course.
export function packageKey(value){
 const text=String(value??'').trim(),match=text.match(/^(\d+(?:\.\d+)?)\b/);
 if(!match)return 0;
 if(/^(?:6|9|12|18)\s+(?:months?|tháng)\s+siblings?\b/i.test(text))return `${Number(match[1])*2} SPLIT`;
 return /SPLIT|chia đôi|siblings/i.test(text)?`${Number(match[1])} SPLIT`:Number(match[1]);
}

export function buildContractGroups(data,input,{paymentTrace=false}={}){
 const raw=data.grids.RAW_REPORT,main=data.grids.CHECK_INSTALLMENT;
 const rawRows=Object.keys(raw).filter(k=>/^D\d+$/.test(k)).map(k=>Number(k.slice(1))).filter(r=>r>=2);
 const rawByPayment=new Map(rawRows.map(r=>[raw['D'+r],r]));
 const cash=unionReceipts(input.cashSources).rows.filter(r=>!r.cancelled&&r.date<input.cutoff+1);
 const transfers=unionTransfers(input.transferSources).rows.filter(r=>r.date<input.cutoff+1);
 const funded=invoiceFunding(cash,transfers,input.links);
 const aliases=data.contractSettlements??contractSettlements(input,data.extensions.accounts,{cash,transfers,funded});
 data.contractSettlements=aliases;
 const atContract=(record,ct)=>{const a=data.extensions.accounts.records[record.id];return a.ct===ct||a.candidates?.length===1&&a.candidates[0]===ct;};
 const destination=account=>{const candidates=account.ct?[account.ct]:account.candidates??[],resolved=uniq(candidates.map(ct=>aliases[ct]?.target??ct));return resolved.length===1&&candidates.every(ct=>ct===resolved[0]||aliases[ct])?resolved[0]:null;};
 const buckets=new Map();
 for(const record of data.records){
  const account=data.extensions.accounts.records[record.id];
  const ct=destination(account),id=ct?`CT::${ct}`:record.id;
  const bucket=buckets.get(id)??[];bucket.push(record);buckets.set(id,bucket);
 }
 return [...buckets].map(([id,members])=>{
  const first=members[0],ct=destination(data.extensions.accounts.records[first.id]);
  const anchor=members.find(r=>main['C'+r.sheetRow]===ct)??members.find(r=>atContract(r,ct))??first;
  const sourceContracts=ct?Object.keys(aliases).filter(code=>aliases[code].target===ct):[];
  const sourceAccount=(ct?data.extensions.accounts.contracts?.[ct]:null)??data.extensions.accounts.records[anchor.id];
  const student=sourceAccount.paid?.student??main['F'+anchor.sheetRow];
  const ctRows=ct?rawRows.filter(r=>raw['E'+r]===ct&&raw['R'+r]===student):[];
  const rawRow=ctRows.includes(anchor.rawRow)?anchor.rawRow:ctRows[0]??anchor.rawRow;
  const warnings=[],contractContext={},cells=Object.fromEntries(Object.entries(rawFields).map(([c,r])=>[c,raw[r+rawRow]??null]));
  if(ct){
   cells.C=ct;cells.AH=rawRow;
   const candidates=ctRows.length?ctRows:members.filter(r=>!sourceContracts.length||atContract(r,ct)).map(r=>r.rawRow);
   for(const key of fields){
    const values=uniq(candidates.map(r=>raw[rawFields[key]+r]));
    cells[key]=values.length===1?values[0]:null;
    if(values.length>1)warnings.push(`${key}: thông tin khóa học/ưu đãi khác nhau trong cùng CT; cần chọn lại tại dòng tổng`);
   }
   if(!ctRows.length){cells.T=null;cells.U=null;cells.V=null;}
  }else{
   for(const key of ['H','I','J'])cells[key]=null;
  }
  const account=ct?{...sourceAccount,ct,candidates:[ct],scope:'contract',origin:ct,contribution:sourceAccount.net,otherPayments:0,
   warnings:uniq([...(sourceContracts.length?sourceAccount.warnings:[]),...members.filter(r=>!sourceContracts.length||atContract(r,ct)).flatMap(r=>data.extensions.accounts.records[r.id].contractWarnings??data.extensions.accounts.records[r.id].warnings)]),
   unallocatedDeposit:0}:sourceAccount;
  if(ct)account.cashBefore=sum(cash.filter(r=>invoiceEligible(r)&&r.student===student&&r.date<Math.floor(cells.D)));
  const events=account.events;
  if(sourceContracts.length){account.sourceContracts=sourceContracts;account.movementHistory=transfers.filter(t=>[ct,...sourceContracts].includes(t.from)||[ct,...sourceContracts].includes(t.to)).map(t=>({kind:t.type,amount:t.amount,date:t.date,payment:t.id,...(t.paymentCodes.length?{transferPayments:t.paymentCodes}:{}),from:t.from,to:t.to,refs:t.refs,invoiceBacked:funded.has(t.id),invoiceIds:funded.get(t.id)??[]}));}
  // A wider read-only lineage must not widen the course-input candidates.
  // In particular, a pending invoice behind an old CT is history for review.
  const courseDepositOrigins=uniq([...(account.movementHistory??[]),...events].filter(e=>e.from&&!isCT(e.from)).map(e=>e.from));
  const courseDocument=d=>ct?(d.contract===ct||sourceContracts.includes(d.contract)||courseDepositOrigins.includes(d.contract)||events.some(e=>e.invoiceIds?.includes(d.id)||e.payment===d.payment&&e.vat===d.vat)):members.some(m=>m.id===d.payment);
  if(ct&&paymentTrace){
   account.movementHistory=upstreamTransfers(ct,transfers).map(t=>({kind:t.type,amount:t.amount,date:t.date,payment:t.id,...(t.paymentCodes.length?{transferPayments:t.paymentCodes}:{}),from:t.from,to:t.to,refs:t.refs,invoiceBacked:funded.has(t.id),invoiceIds:funded.get(t.id)??[]}));
   account.transferIn=events.filter(e=>e.to===ct&&e.from&&e.invoiceBacked).reduce((total,event)=>total+event.amount,0);
  }
  const depositOrigins=uniq([...(account.movementHistory??[]),...events].filter(e=>e.from&&!isCT(e.from)).map(e=>e.from));
  if(ct)account.unallocatedDeposit=depositOrigins.reduce((total,origin)=>total+Math.max(0,
   sum(cash.filter(d=>d.contract===origin&&invoiceEligible(d)))+sum(transfers.filter(t=>t.to===origin&&funded.has(t.id)))-
   transfers.filter(t=>t.from===origin).reduce((n,t)=>n+t.out,0)-
   sum(events.filter(e=>e.from===origin&&e.kind==='Thu cọc gắn CT'))),0);
  const traceOrigins=paymentTrace?uniq((account.movementHistory??[]).map(event=>event.from)):[];
  const included=cash.filter(d=>ct?(d.contract===ct||sourceContracts.includes(d.contract)||traceOrigins.includes(d.contract)||depositOrigins.includes(d.contract)||events.some(e=>e.invoiceIds?.includes(d.id)||e.payment===d.payment&&e.vat===d.vat)):members.some(m=>m.id===d.payment));
  const receipts=included.map(d=>{
   let allocated=null;
   if(ct&&invoiceEligible(d)&&(d.contract===ct||events.some(e=>e.invoiceBacked&&e.payment===d.payment&&e.vat===d.vat)))allocated=d.amount;
   else if(ct&&invoiceEligible(d)){
    const documents=cash.filter(r=>r.contract===d.contract),out=transfers.filter(t=>t.from===d.contract),incoming=transfers.filter(t=>t.to===d.contract);
    const credited=events.filter(e=>e.from===d.contract&&e.to===ct&&e.invoiceBacked).reduce((n,e)=>n+e.amount,0);
    if(credited&&documents.length===1&&!incoming.length)allocated=credited;
    else if(credited&&!incoming.length&&out.every(t=>t.to===ct)&&Math.abs(sum(documents)-sum(out.map(t=>({amount:t.out}))))<=1)allocated=d.amount;
   }
   const r=rawByPayment.get(d.payment);
   return {id:d.id,payment:d.payment,contract:d.contract,ct,date:d.date,vat:d.vat,amount:d.amount,allocated,
    method:r?raw['AH'+r]??null:data.receiptMeta?.[d.payment]?.method??null,term:r?raw['AJ'+r]??null:data.receiptMeta?.[d.payment]?.term??null,refs:d.refs,
    cells:{H:null,I:null,J:null},verified:invoiceEligible(d)};
  });
  for(const member of members)if(!receipts.some(d=>d.payment===member.id)){
   const r=member.rawRow;
   receipts.push({id:`raw:${member.id}`,payment:member.id,contract:raw['E'+r],ct,date:raw['O'+r],vat:raw['P'+r],amount:raw['AF'+r]??null,allocated:null,
    method:raw['AH'+r]??null,term:raw['AJ'+r]??null,refs:[{file:data.source,sheet:data.importInfo?.sheetName??'RAW_REPORT',row:data.sourceRows?.[r]??r}],cells:{H:null,I:null,J:null},verified:false});
   if(ct)warnings.push(`Chưa xác minh chứng từ thu ${member.id} trong nguồn tiền`);
  }
  receipts.sort((a,b)=>a.date-b.date||a.payment.localeCompare(b.payment));
  const methods=uniq(receipts.map(r=>r.method));
  const installment=receipts.filter(r=>/installment/i.test(String(r.method)));
  // Multiple installment providers do not themselves violate policy. The
  // maximum valid term below checks every contributing installment receipt.
  // Any installment receipt remains visible to policy checks at CT scope.
  const method=methods.join('; '),terms=installment.map(r=>r.term);
  const numericTerms=terms.map(v=>/^\d+(?:\.\d+)?(?:\s|$)/.test(String(v??''))?parseFloat(String(v)):null);
  if(installment.length&&numericTerms.some(n=>n===null))warnings.push('Có khoản trả góp chưa có kỳ hợp lệ; cần xác minh chứng từ');
  if(receipts.some(r=>r.method===null))warnings.push('Có chứng từ chưa có phương thức thanh toán trong RAW_REPORT');
  const term=installment.length?(numericTerms.every(n=>n!==null)?`${Math.max(...numericTerms)} month`:null):raw['AJ'+rawRow]??null;
  const group={id,kind:ct?'contract':'unlinked',ct,anchor,rawRow,memberIds:members.map(r=>r.id),...(sourceContracts.length?{sourceContracts,legacyMemberIds:members.filter(r=>atContract(r,ct)).map(r=>r.id)}:{}),cells,account,receipts,
   warnings:uniq(warnings),raw:{AH:method||(raw['AH'+rawRow]??null),AJ:term,...contractContext},paymentCode:anchor.paymentCode};
  if(ct){
   const candidates=uniq([...ctRows,...members.filter(r=>!sourceContracts.length||atContract(r,ct)).map(r=>r.rawRow),...included.filter(d=>courseDocument(d)&&!sourceContracts.length&&!isCT(d.contract)&&d.student===student).map(d=>rawByPayment.get(d.payment)).filter(Boolean)]);
   group.noCTInvoice=!ctRows.length;
   group.courseCandidates=candidates.map(r=>({...Object.fromEntries(fields.map(k=>[k,raw[rawFields[k]+r]??null])),fallback:raw['E'+r]!==ct,ref:{file:data.source,sheet:data.importInfo?.sheetName??'RAW_REPORT',row:data.sourceRows?.[r]??r}}));
   applyCourseInfo(data,group);
  }
  return group;
 });
}

export class ContractEngine{
 constructor(data){this.data=data;this.groups=new Map(data.contractGroups.map(g=>[g.id,g]));this.engine=new WorkbookEngine(data);this.patches=new Map();}
 setPatches(patches){this.patches=new Map(Object.entries(patches));}
 setVouchers(vouchers){this.data=withVoucherRegistry(this.data,vouchers);this.engine=new WorkbookEngine(this.data);}
 setCourseSources(sources){withCourseSources(this.data,sources);}
 updateCourseSource(source){const group=this.groups.get('CT::'+source.ct);if(group&&String(group.cells.F)===source.student)applyCourseInfo(this.data,group,[source]);}
 dependentIds(id){const ct=this.groups.get(id)?.ct;return [...this.patches].filter(([key,p])=>key!==id&&ct&&String(p.verification?.partnerContract??'').toUpperCase()===ct.toUpperCase()).map(([key])=>key);}
 calculate(record,patch={}){
  // Resolve geometry from trusted source, never from the client-supplied row.
  const group=this.groups.get(record.id);if(!group)throw new Error('Không tìm thấy Contract tổng. Hãy tải lại trang.');
  const {anchor,kind,receipts}=group;
  this.patches.set(group.id,patch);
  if(kind==='unlinked'){
   return {...anchor,id:group.id,paymentCode:group.paymentCode,kind,memberIds:group.memberIds,receipts,groupWarnings:group.warnings,errors:[],
    cells:{...group.cells,H:null,I:null,J:null,receiptCount:receipts.length,W:group.cells.W??receipts[0]?.amount??null,contractTotal:'',ctNet:null,ctCheck:'XÁC MINH - LIÊN KẾT CT',AF:'CHECK',AG:'',AN:'Chưa gắn CT duy nhất: giữ chứng từ thu, chưa gắn khóa học hoặc tính học phí.'},
    reconciliation:{...group.account,status:'XÁC MINH - LIÊN KẾT CT',blocking:true,target:null,calcTarget:null,overpaid:null},context:{method:group.raw.AH}};
  }
  const packageValue=own(patch,'J')?patch.J:group.cells.J,discountValue=own(patch,'L')?patch.L:group.cells.L;
  const packageRule=auditPackageKey(packageValue,discountValue,group.cells.D,packageKey(packageValue),this.data.policy?.auditPolicy);
  const verification=verificationMetadata(this.data,group,patch.verification,packageRule,this.patches);
  const row=this.engine.calculate(anchor,patch,{rawRow:group.rawRow,raw:group.raw,account:group.account,
   cells:{...group.cells,...group.sourceCells,AK:packageRule,W:group.account.net,Y:group.raw.AJ,...verification.overrides}});
  // Q and its differences were evaluated at the whole-CT grain with no receipt
  // offset. P now reports funded incoming transfers; it is not a second fee
  // deduction. Keep the independent formula-only regression path unchanged.
  if(typeof group.account.transferIn==='number')row.cells.P=group.account.transferIn;
  // A pending date/proof is not a denial of the recorded relationship. Keep the
  // policy non-OK and the funding/eligibility gates intact, with an honest label.
  if(verification.siblingRelationshipConfirmed&&!verification.siblingVerified&&/THIẾU XÁC NHẬN 2 CON RUỘT|ĐIỀU KIỆN CHIA ĐÔI|THIẾU\/SAI COURSE CON CÒN LẠI|THIẾU FULL PHÍ CÙNG NGÀY/.test(String(row.cells.BD))){
   const previous=String(row.cells.BD);row.cells.BD='ĐÃ XÁC NHẬN SIBLING · CÒN ĐIỀU KIỆN';row.cells.AN=String(row.cells.AN??'').replace(previous,row.cells.BD);
  }
  row.cells.receiptCount=receipts.length;
  const warnings=group.warnings.filter(w=>!fields.some(k=>w.startsWith(`${k}:`)&&own(patch,k)&&String(patch[k]).trim())&&!(verification.courseVerified&&w.startsWith('Chưa có dòng hóa đơn CT trong RAW_REPORT')));
  if(warnings.length||['H','I','J'].some(k=>!String(row.cells[k]??'').trim()))row.cells.AF='CHECK';
  // Plain 36-month inputs retain a sibling-proof check even though package
  // selection no longer halves the course from a promotion label alone.
  if((discountPolicyMatch(row.cells.L,row.cells.D).siblings||/36\/36/i.test(String(row.cells.L)))&&!/SPLIT$/.test(String(row.cells.AK))){
   const message='XÁC MINH - SIBLINGS: đối chiếu hồ sơ quan hệ và điều kiện duyệt; Package là số tháng của CT này';
   row.promotion.checks=uniq([...row.promotion.checks,message]);row.promotion.blocking=true;
   if(!row.promotion.checks.some(c=>c.startsWith('CHECK')))row.promotion.status='XÁC MINH - ĐIỀU KIỆN ÁP DỤNG';
   row.cells.promoCheck=row.promotion.status;row.cells.AF='CHECK';
  }
  if(verification.siblingRequired&&verification.siblingVerified){
   row.promotion.checks=row.promotion.checks.filter(c=>!c.startsWith('XÁC MINH - 36 tháng chia đôi · sibling:'));
   row.promotion.blocking=row.promotion.checks.length>0;
   row.promotion.status=row.promotion.checks.some(c=>c.startsWith('CHECK'))?'CHECK - ĐIỀU KIỆN / THỜI HẠN':row.promotion.blocking?'XÁC MINH - ĐIỀU KIỆN ÁP DỤNG':'OK';row.cells.promoCheck=row.promotion.status;
  }
  if(verification.pending.length)row.cells.AF='CHECK';
  else if(!warnings.length&&['H','I','J'].every(k=>String(row.cells[k]??'').trim())&&!row.errors.length){
   const tolerance=this.data.grids.HUONG_DAN.B9??1,c=row.cells;
   const diffs=['Z','AA','AB','AC'].every(k=>typeof c[k]==='number'&&Math.abs(c[k])<=tolerance)&&typeof c.AD==='number'&&Math.abs(c.AD)<=1;
   if(diffs&&['BD','BO','AE'].every(k=>c[k]==='OK')&&['OK','NO GIFTCODE'].includes(c.CI)&&c.CH==='OK'&&!row.reconciliation.blocking&&!row.promotion.blocking)row.cells.AF='OK';
  }
  const suggestions=(this.data.extensions.courseEvidence??[]).filter(e=>e.ct===group.ct&&e.student===String(group.cells.F));
  const {overrides,...verificationState}=verification;
  const issues=calculationIssues(row,verification);
  row.cells.verificationCheck=verification.pending.length?`CẦN BỔ SUNG (${verification.pending.length})`:verification.hasInput?'ĐÃ GHI NHẬN':'THEO DỮ LIỆU NGUỒN';
  row.cells.calcNote=issues.map(i=>i.message+' '+i.action).join(' | ');
  row.cells.verificationNote=verification.pending.join(' | ');
  return {...row,id:group.id,paymentCode:group.paymentCode,kind,memberIds:group.memberIds,...(group.sourceContracts?{sourceContracts:group.sourceContracts}:{}),receipts,courseInfo:group.courseInfo,groupWarnings:warnings,verification:verificationState,calculationIssues:issues,courseSuggestions:suggestions};
 }
}

// Read-only projection of old per-payment overlays. New CT overlays take
// precedence, including {} after Restore. Legacy D1 rows are never rewritten.
export function resolveContractEdits(groups,stored){
 const rows=new Map(stored.map(r=>[r.record_id,{patch:typeof r.patch==='string'?JSON.parse(r.patch):r.patch,version:r.version,updatedAt:r.updated_at??r.updatedAt}]));
 const edits={};
 for(const group of groups){
  if(group.kind!=='contract')continue;
  const legacyIds=group.legacyMemberIds??group.memberIds;
  const sourceHistory=[...(group.sourceContracts??[]).map(ct=>'CT::'+ct),...group.memberIds.filter(id=>!legacyIds.includes(id))].filter(id=>rows.has(id)).map(id=>({id,...rows.get(id)}));
  const history=sourceHistory.length?{sourceHistory}:{};
  if(rows.has(group.id)){edits[group.id]={...rows.get(group.id),...history};continue;}
  const previous=legacyIds.map(id=>rows.get(id)).filter(Boolean);if(!previous.length){if(sourceHistory.length)edits[group.id]={patch:{},version:0,updatedAt:'',...history};continue;}
  const patch={},notes=[];
  for(const field of fields){
   const values=[...new Set(previous.filter(e=>own(e.patch,field)).map(e=>e.patch[field]))];
   if(values.length===1)patch[field]=values[0];
   if(values.length>1){patch[field]='';notes.push(`${field}: sửa cũ theo chứng từ khác nhau (${values.join(' / ')}); chọn lại tại CT tổng`);}
  }
  const approved=legacyIds.map(id=>rows.get(id)?.patch.approved);
  if(approved.every(v=>v===true))patch.approved=true;
  else if(approved.some(v=>v!==undefined)){patch.approved=false;if(approved.some(v=>v===true))notes.push('Approved cũ chỉ áp dụng một số chứng từ; cần duyệt lại ngoại lệ ở CT tổng');}
  edits[group.id]={patch,version:0,updatedAt:previous.map(e=>e.updatedAt).sort().at(-1),notes,...history,
   inherited:true,legacy:legacyIds.filter(id=>rows.has(id)).map(id=>({id,...rows.get(id)}))};
 }
 return edits;
}
