import {priceText,pricingIdentity,weeklyHours} from './pricing-key.mjs';

const priceFile='price(1).txt';
const discountFile='GetApplicableGroupDiscount.txt';
const money=value=>value.toLocaleString('vi-VN')+' ₫';
const courseKey=value=>priceText(value).replace(/^atls\b\s*-?\s*/, '');
const packageKey=value=>priceText(value).replace(/\b(?:months?|thang)\b/g,'month').replace(/\b(?:weeks?|tuan)\b/g,'week');
const lookupKey=(course,hours,pkg)=>JSON.stringify([courseKey(course),hours,packageKey(pkg)]);
const priceKey=row=>lookupKey(row.course,row.hours,row.package);
const labelFor=row=>row.groupName+' - '+row.name;
const unitFor={1:'months',2:'weeks',3:'hours',4:'hour-package'};
const sourceFor=row=>({file:row.sourceFile??priceFile,sheet:'GetCoursePrice',row:row.priceId,cell:`${row.priceCode} · PriceTypeId ${row.typeId} · PackageId ${row.packageId}${row.hourWeekId?` · HourWeekId ${row.hourWeekId}`:''}`});

const indexes=new WeakMap();
function indexFor(config){
 if(indexes.has(config))return indexes.get(config);
 const prices=new Map(),report=new Map();
 for(const row of config.prices){
  const key=priceKey(row);
  if(!prices.has(key))prices.set(key,[]);
  prices.get(key).push(row);
 }
 for(const row of config.report){
  const key=lookupKey(row.course,weeklyHours(row.hours),row.package);
  if(!report.has(key))report.set(key,[]);
  report.get(key).push(row);
 }
 const index={prices,report};
 indexes.set(config,index);
 return index;
}

// A file export has no request parameters for center, contract type or date.
// It can corroborate a price, but never substitute for a scoped calculation.
export function configuredHubEvidence(config,cells,context,identity){
 if(!config||identity.conflicts.length||!['ATLS','AHP'].includes(identity.group))return null;
 const group=priceText(context.group);
 if(group&&!['atls','ahp'].includes(group))return null;
 const pkg=String(cells.J??'').trim();
 const hours=weeklyHours(cells.I);
 if(!pkg||hours===null&&String(cells.I??'').trim())return null;
 const rows=indexFor(config).prices.get(lookupKey(cells.H,hours,pkg))??[];
 if(!rows.length)return null;
 const values=[...new Set(rows.map(grossFor))];
 const labels=String(cells.L??'').split(';').map(priceText);
 const discounts=config.discounts.filter(d=>rows.some(p=>d.productGroupId===p.groupId&&d.priceTypeId===p.typeId)&&labels.includes(priceText(labelFor(d))));
 return {values,codes:[...new Set(rows.map(row=>row.priceCode))],discountCodes:[...new Set(discounts.map(row=>row.discountCode))]};
}

const grossFor=row=>Math.round(row.typeId===4?row.rate:row.rate*row.quantity);
export function configuredHubPriceRows(config,policyRows){
 if(!config)return [];
 const index=indexFor(config),policyByKey=new Map();
 for(const row of policyRows){
  // The published 36T split and a Hub package named siblings are different
  // until the Contract identifies the actual split program.
  if(row.status!=='ready'||!Number.isFinite(row.gross)||row.variant==='split')continue;
  const key=lookupKey(row.course,row.hours,row.package);
  if(!policyByKey.has(key))policyByKey.set(key,[]);
  policyByKey.get(key).push(row);
 }
 return config.prices.map((row,i)=>{
  const {groupId,course,hours,package:pkg,typeId,quantity,rate,priceCode}=row;
  const identity=pricingIdentity(course,hours,pkg),gross=grossFor(row),key=priceKey(row);
  const conflicts=new Set(index.prices.get(key).map(grossFor)).size>1;
  const published=policyByKey.get(key)??[];
  const report=index.report.get(key)??[];
  const differences=published.filter(p=>Math.abs(p.gross-gross)>1);
  const policyTotals=[...new Set(published.map(p=>p.gross))];
  const comparisons=policyTotals.map(total=>({gross:total,delta:gross-total,
   periods:[...new Set(published.filter(p=>p.gross===total).map(p=>p.regimeLabel))]}));
  return {id:`hub-config-${row.priceId}-${i}`,hubConfig:true,priceCode,group:config.groups.find(g=>g.id===groupId)?.name??String(groupId),
   course,year:identity.year,layer:identity.layer,hours,package:pkg,packageKey:identity.packageKey,unit:unitFor[typeId],unitPrice:rate,
   months:typeId===1?quantity:null,weeks:typeId===2?quantity:null,packageHours:[3,4].includes(typeId)?quantity:null,monthly:typeId===1?rate:null,
   gross,discount:null,net:null,straight:null,loyalty:null,referral:null,maxTerms:null,regime:'hub-config',regimeLabel:'Giá cài trên Hub',
   from:null,to:null,status:conflicts||differences.length?'conflict':'gross-only',comparisons,
   note:conflicts?'Hub có nhiều mức giá cho cùng khóa. Cần kiểm tra giá trên đúng CT.':differences.length?'Giá cài trên Hub khác giá theo chính sách. Kiểm tra kỳ và phạm vi trên đúng CT.':'Cần xác minh kỳ, trung tâm và loại hợp đồng trước khi áp dụng.',
   conditions:'Tham chiếu cấu hình Hub. Chưa xác nhận phạm vi áp dụng.',refs:[sourceFor(row),...(published[0]?.refs??[])],
   masterRefs:report.map(r=>({file:config.reportFile,sheet:'Bảng giá chung',row:r.row,source:r.koc,statedGross:r.audit,observedGross:r.observed}))};
 });
}

export function configuredHubRuleRows(config){
 if(!config)return [];
 const benefit=(row,values)=>row.kind===1?`${values[0]}%`:row.kind===2?money(values[1]):`${values[2]} tháng tặng`;
 return config.discounts.map((row,i)=>{
  const type=config.groups.find(g=>g.id===row.productGroupId)?.name??row.productGroupId;
  return {id:`hub-config-rule-${row.detailId}-${i}`,hubConfig:true,ruleKey:row.discountCode,course:labelFor(row),group:type,
   package:row.priceTypeId===1?'Gói tháng':`PriceTypeId ${row.priceTypeId}`,regime:'hub-config',regimeLabel:'Ưu đãi cài trên Hub',
   from:null,to:null,status:'manual-policy',
   benefit:`Trả thẳng ${benefit(row,row.direct)}. ${row.hasInstallmentRate?`Mức trả góp cài trên Hub: ${benefit(row,row.installment)}.`:'Chưa có mức trả góp riêng trong tệp.'}`,
   conditions:`${type} · ${row.category}. Đối chiếu ngày, gói, trung tâm và loại CT trên Hub.`,
   stacking:`${row.applyRule==='last'?'Áp dụng cuối':'Thứ tự mặc định'} · ưu tiên ${row.priority} · thứ tự ${row.sort} · trần ${row.max}%. ${row.combinations.length?'Nhóm đi kèm trong Hub: '+row.combinations.join(', ')+'.':'Không có nhóm đi kèm trong phản hồi này.'}`,
   requiredEvidence:'Discount apply trên CT và căn cứ duyệt theo từng chính sách.',
   refs:[{file:discountFile,sheet:`Phản hồi ${row.captures.join(', ')}`,row:row.detailId,cell:`GroupDiscountId ${row.groupId} · DiscountId ${row.discountId} · DetailId ${row.detailId}`}],
   note:row.autoTick?'Hub có cấu hình đánh dấu sẵn. Kiểm tra điều kiện trước khi áp dụng.':null};
 });
}
