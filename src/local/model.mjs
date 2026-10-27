import {buildAccounts} from '../core/reconcile.mjs';
import {buildContractGroups} from '../core/contracts.mjs';
import {dateSerial} from '../core/verification.mjs';
import {discountPolicyMatch} from '../core/promotions.mjs';
const fields={A:'B',B:'C',C:'E',D:'O',E:'P',F:'R',G:'S',H:'Z',I:'AA',J:'AB',K:'AO',L:'AQ',T:'AC',U:'AD',V:'AE',X:'AG'};
export const identity=row=>[row.kind==='contract'?row.ct:row.paymentCode,String(row.cells.F??'')].join('|');
const uniq=a=>[...new Set(a.filter(x=>x!==null&&x!==undefined&&x!==''))];
const ref=(bundle,r)=>{const s=bundle.sources.find(s=>s.key===r.sourceKey);return {file:s?.fileName||'Nguồn',sheet:s?.sheetName||'',row:r.sourceRow}};
export function buildModel(bundle,p){
 const data={source:bundle?'Bộ nguồn '+bundle.scope.from+' → '+bundle.scope.to:'Bảng giá & quy tắc 2026',grids:{RAW_REPORT:{},CHECK_INSTALLMENT:{},PROMO_VOUCHER:{},HUONG_DAN:{B9:p.auditPolicy?.moneyTolerance??1},RULE:{Z83:dateSerial('2026-10-06'),Z84:dateSerial('2026-12-31'),Z87:p.loyaltyThreshold,Z88:p.stoppedDays}},records:[],names:{},formulas:{},templates:[],choices:{H:uniq(p.prices.map(r=>r.C)),I:uniq(p.prices.map(r=>r.D)),J:uniq(p.prices.map(r=>r.E)),K:[],L:[]},extensions:{prices:p.prices,roadmap:p.roadmap,catalogue:{programs:p.programs,entries:[]},courseEvidence:[],customVouchers:[]},contractGroups:[],policy:p};
 if(!bundle){data.extensions.accounts={records:{},contracts:{},statistics:{receipts:0,resolved:0,unresolved:0}};return data}
 const raw=data.grids.RAW_REPORT,main=data.grids.CHECK_INSTALLMENT,rows=new Map(),cashSources=[];
 for(const source of bundle.sources.filter(s=>s.role==='payment')){
  const sourceRows=bundle.cash.filter(r=>r.sourceKey===source.key);const financial=[];
  for(const item of sourceRows){const c=item.cells,row=rows.size+2,key=c.D;if(!rows.has(key)){rows.set(key,row);for(const [k,v]of Object.entries(c))raw[k+row]=v}
   financial.push({payment:c.D,contract:c.E,student:c.R,vat:String(c.P??''),date:c.O,amount:/refund|hoàn tiền/i.test(String(c.F))?-Math.abs(c.AF):c.AF,cancelled:/cancel|void|hủy/i.test(String(c.I)),paid:/^paid$/i.test(String(c.I)),ref:ref(bundle,item)});
  }cashSources.push({rows:financial});
 }
 for(const [i,r]of bundle.records.entries()){
  const sr=i+5,rr=rows.get(r.cells.D);const record={id:r.cells.D,paymentCode:r.cells.D,sheetRow:sr,rawRow:rr,sourceRow:r.sourceRow};data.records.push(record);
  for(const [c,k]of Object.entries(fields))main[c+sr]=r.cells[k]??null;
 }
 const paid=bundle.exports.map(e=>({ct:e.ct,student:e.student,target:e.target,ledger:e.paid,ref:ref(bundle,e)}));
 const links=bundle.cash.filter(r=>r.cells.CT_TOTAL&&r.cells.CT_TOTAL!==r.cells.E).map(r=>({origin:r.cells.E,ct:r.cells.CT_TOTAL,cashLink:true,ref:ref(bundle,r)}));
 const input={cutoff:bundle.cutoff,moneyTolerance:p.auditPolicy?.moneyTolerance??1,moneyToleranceWindow:p.auditPolicy?.coverage??null,cashSources,transferSources:bundle.sources.filter(s=>s.role==='transfer').map(s=>({rows:bundle.transfers.filter(t=>t.sourceKey===s.key).map(t=>({...t,ref:ref(bundle,t)}))})),links,paid,snapshots:paid,records:bundle.records.map(r=>({id:r.cells.D,contract:r.cells.E,student:r.cells.R,date:r.cells.O}))};
 data.extensions.accounts=buildAccounts(input,{contractSummaries:true});
 data.extensions.courseEvidence=bundle.exports.map(e=>({ct:e.ct,student:e.student,courseFee:e.courseFee,hoursPerWeek:e.hoursPerWeek,package:e.package,center:e.center,centerName:e.centerName,contractType:e.contractType,ref:ref(bundle,e)}));
 data.input=input;data.bundle=bundle;data.cutoff=bundle.cutoff;
 data.contractGroups=buildContractGroups(data,input,{paymentTrace:true});
 data.extensions.accounts.statistics.resolved=data.contractGroups.filter(g=>g.kind==='contract').reduce((n,g)=>n+g.memberIds.length,0);
 data.extensions.accounts.statistics.unresolved=data.records.length-data.extensions.accounts.statistics.resolved;
 // Distinct observed values are never added together or silently selected.
 for(const group of data.contractGroups){
  const direct=bundle.cash.filter(r=>r.cells.E===group.ct&&r.cells.R===group.cells.F);
  for(const [col,source]of Object.entries({T:'AC',U:'AD',V:'AE'})){
   const values=uniq(direct.map(r=>r.cells[source]));
   group.cells[col]=values.length===1&&typeof values[0]==='number'?values[0]:null;
   if(values.length>1)group.warnings.push(col+': giá trị trong các PaymentList khác nhau; đối chiếu hóa đơn gốc.');
  }
  const exp=bundle.exports.find(e=>e.ct===group.ct&&e.student===String(group.cells.F));group.export=exp;
  group.cells.X=typeof exp?.totalHours==='number'?exp.totalHours:group.cells.X??null;
 }
 const labels=uniq(bundle.cash.map(r=>r.cells.AQ));data.choices.K=uniq(bundle.cash.map(r=>r.cells.AO));data.choices.L=labels;
 data.extensions.catalogue.entries=labels.map((label,i)=>{const found=bundle.cash.filter(r=>r.cells.AQ===label),m=discountPolicyMatch(label,found[0]?.cells.O);return {id:'payment-'+i,label,masterRow:null,family:m.kind||'Cần xác minh',state:m.ruleKey?'confirmed':'unverified',programIds:m.programIds,observedMethod:'PaymentList',observedValue:null,observedFrom:Math.min(...found.map(r=>r.cells.O)),observedTo:Math.max(...found.map(r=>r.cells.O)),observedCount:found.length,paymentObservation:{labels:[label],count:found.length,from:Math.min(...found.map(r=>r.cells.O)),to:Math.max(...found.map(r=>r.cells.O)),refs:found.slice(0,5).map(r=>ref(bundle,r))},policyMatch:m}});
 return data;
}
