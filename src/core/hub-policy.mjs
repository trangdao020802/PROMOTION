import {pricingIdentity,priceText,weeklyHours} from './pricing-key.mjs';
export const HUB_POLICY_SCHEMA='apollo-hub-policy/v1';
export const HUB_POLICY_ERRORS=['context','price','groups','timeout','permission','unsupported','format'];
const num=x=>typeof x==='number'&&Number.isFinite(x),id=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<1e15?Number(x):null;
const text=x=>typeof x==='string'?x.trim().replace(/\s+/g,' '):'';
const name=x=>text(x).length<=2000?text(x):'';
const fold=x=>priceText(x).replace(/[^a-z0-9]+/g,' ').trim();
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keys=(o,allowed)=>plain(o)&&Object.keys(o).every(k=>allowed.includes(k));
const day=x=>{if(typeof x!=='string'||x.length>50||!/^\d{4}-\d{2}-\d{2}(?:$|T| )/.test(x))return null;const d=x.slice(0,10),n=new Date(d+'T00:00:00Z');return Number.isFinite(+n)&&n.toISOString().slice(0,10)===d?d:null;};
const list=(x,max=500)=>{if(typeof x==='string'&&x.length<=1e6){try{x=JSON.parse(x);}catch{return null;}}return Array.isArray(x)&&x.length<=max?x:null;};
const single=(rows,fn)=>{const found=rows?.filter(fn)??[];return found.length===1?found[0]:null;};
const fail=code=>{throw Object.assign(Error(code),{policyCode:code});};

// Only lookup parameters enter the bridge. Neither the whole contract nor its
// saved financial totals, personal fields, authentication or Angular models do.
export function hubPolicyRequest(detail,info=null){
 if(!plain(detail)||!id(detail.ContractId)||!name(detail.ContractNo))return null;
 const courses=list(detail.ListCourseInfo,20),course=courses?.length===1?courses[0]:null;
 if(!course)return null;
 if(info&&(!plain(info)||id(info.ContractId)!==id(detail.ContractId)||info.ContractNo&&info.ContractNo!==detail.ContractNo||info.KidId&&detail.KidId&&info.KidId!==detail.KidId||info.CenterId&&info.CenterId!==detail.CenterId))return null;
 const products=list(info?.listProduct??info?.ListProduct,20),product=single(products,p=>id(p.PriceId)===id(course.PriceId)&&id(p.ProductPackageId)===id(course.ProductPackageId)&&id(p.HourWeekId)===id(course.HourWeekId));
 if(products&&!product)return null;
 const root=info??detail,p=product??course;
 const groupIds=[...new Set((list(detail.ListDiscount,100)??[]).map(d=>id(d.ProductGroupId)).filter(Boolean))];
 const groupId=id(p.ProductGroupId??root.ProductGroupId)??(groupIds.length===1?groupIds[0]:null);
 const context={centerId:id(root.CenterId),groupPeopleId:id(root.GroupPeopleId),productTypeId:id(root.ProductTypeId),contractTypeId:id(root.ContractTypeId),bundleId:root.BundleId==null?null:id(root.BundleId),giftCodeTypeId:id(p.GiftCodeTypeId??root.GiftCodeTypeId),installment:root.IsInstallment,upgrade:!!(detail.IsUpgrade||detail.UpgradeFromContractId>0||detail.ParentContractId>0)};
 const productInfo={groupId,priceId:id(course.PriceId),typeId:id(course.PriceTypeId),packageId:id(course.ProductPackageId),hourWeekId:id(course.HourWeekId),priceName:name(course.PriceName),packageName:name(course.ProductPackageName),hourWeekName:name(course.HourWeekName??course.HowWeekName)};
 const createdDate=day(root.CreatedDate),centerCode=name(detail.CenterCode??root.CenterCode);
 if(!createdDate||!centerCode||Object.entries(context).some(([k,v])=>!['bundleId','giftCodeTypeId','installment','upgrade'].includes(k)&&!v)||typeof context.installment!=='boolean'||Object.values(productInfo).some(v=>v==null||v==='')||![1,2].includes(productInfo.typeId))return null;
 const selected=list(p.discounts,100)??list(detail.ListDiscount,100)??[];
 return {ct:detail.ContractNo,contractId:id(detail.ContractId),centerCode,createdDate,dateValue:root.CreatedDate,context,product:productInfo,firstGroupId:id(selected[0]?.GroupDiscountId)};
}

function discountDetail(d,groupId){
 const rate=x=>num(x)&&x>=0&&x<=100?x:null,money=x=>num(x)&&x>=0&&x<=1e13?x:null,months=x=>num(x)&&x>=0&&x<=120?x:null;
 return {groupId:id(d.ProductGroupId)??groupId,rule:['default','last'].includes(d.ApplyRule)?d.ApplyRule:null,installment:typeof d.IsInstallment==='boolean'?d.IsInstallment:null,
  percent:rate(d.PercentDiscount),amount:money(d.AmountDiscount),months:months(d.GiftMonths),installmentPercent:rate(d.InstallmentPercentDiscount),installmentAmount:money(d.InstallmentAmountDiscount),installmentMonths:months(d.InstallmentGiftMonths)};
}
export function projectHubPolicy(request,prices,groups,capturedAt=new Date().toISOString(),voucher=null){
 if(!request)return null;
 const {product:p}=request,price=single(list(prices),r=>id(r.PriceId)===p.priceId&&id(r.ProductGroupId)===p.groupId);
 const type=single(list(price?.ListPriceType,20),r=>id(r.PriceTypeId)===p.typeId),pkg=single(list(type?.ListPackage,500),r=>id(r.ProductPackageId)===p.packageId),hour=single(list(pkg?.ListHourWeek,100),r=>id(r.HourWeekId)===p.hourWeekId);
 if(!price||!type||!pkg||!hour)return null;
 const sourceKey=pricingIdentity(p.priceName,p.hourWeekName,p.packageName),catalogKey=pricingIdentity(price.PriceName,hour.HourWeekName,pkg.ProductPackageName);
 if(sourceKey.conflicts.length||catalogKey.conflicts.length||sourceKey.key!==catalogKey.key||(!sourceKey.group||!sourceKey.year)&&fold(price.PriceName)!==fold(p.priceName)||weeklyHours(hour.HourWeekName)!==weeklyHours(p.hourWeekName))return null;
 const units=p.typeId===1?pkg.CourseMonth:pkg.CourseWeek,unitPrice=hour.Price;
 if(!num(units)||units<=0||units>520||!num(unitPrice)||unitPrice<=0||unitPrice>1e10)return null;
 const sourceGroups=list(groups,100);if(!sourceGroups)return null;
 const normalized=[];
 for(const group of sourceGroups){
  const discounts=list(group.ListDiscount,200);if(!discounts||!id(group.GroupDiscountId)||!name(group.GroupDiscountName)||![1,2,3].includes(group.GroupDiscountTypeId))return null;
  const items=[];
  for(const d of discounts){const details=list(d.ListDetail,100);if(!id(d.DiscountId)||!name(d.DiscountName)||!details)return null;const detail=single(details,r=>id(r.ProductGroupId)===p.groupId);if(detail)items.push({id:id(d.DiscountId),name:name(d.DiscountName),detail:discountDetail(detail,p.groupId)});}
  normalized.push({id:id(group.GroupDiscountId),name:name(group.GroupDiscountName),type:group.GroupDiscountTypeId,priority:group.Priority,sort:group.SortOrder,max:group.MaxDiscount,with:group.ApplyGroupDiscountIds==null?null:list(group.ApplyGroupDiscountIds,100)?.map(id),discounts:items});
 }
 const result={schema:HUB_POLICY_SCHEMA,ct:request.ct,contractId:request.contractId,centerCode:request.centerCode,createdDate:request.createdDate,capturedAt,context:{...request.context,...(voucher?.typeId?{giftCodeTypeId:voucher.typeId}:{})},firstGroupId:request.firstGroupId,voucher,
  product:{...p,units,unitPrice,monthHours:num(hour.HourMonthDuration)&&hour.HourMonthDuration>0?hour.HourMonthDuration:null,weekHours:num(hour.HourWeekDuration)&&hour.HourWeekDuration>0?hour.HourWeekDuration:null},groups:normalized};
 return validateHubPolicy(result)?result:null;
}
export function validateHubPolicy(v){
 if(!keys(v,['schema','ct','contractId','centerCode','createdDate','capturedAt','context','firstGroupId','voucher','product','groups'])||v.schema!==HUB_POLICY_SCHEMA||!/^\w+-CT-\d{4,20}$/.test(v.ct)||id(v.contractId)!==v.contractId||!name(v.centerCode)||v.centerCode.length>200||day(v.createdDate)!==v.createdDate||typeof v.capturedAt!=='string'||!Number.isFinite(Date.parse(v.capturedAt))||v.firstGroupId!==null&&!id(v.firstGroupId))return false;
 if(v.voucher!==null&&(!keys(v.voucher,['code','type','amount','rate','maximum','typeId'])||!name(v.voucher.code)||v.voucher.code.length>150||!['amount','percent'].includes(v.voucher.type)||!num(v.voucher.maximum)||v.voucher.maximum<0||v.voucher.maximum>1e13||v.voucher.typeId!==null&&id(v.voucher.typeId)!==v.voucher.typeId||v.voucher.type==='amount'&&(!num(v.voucher.amount)||v.voucher.amount<=0||v.voucher.amount>1e13||v.voucher.rate!==null)||v.voucher.type==='percent'&&(!num(v.voucher.rate)||v.voucher.rate<=0||v.voucher.rate>1||v.voucher.amount!==null)))return false;
 const c=v.context,p=v.product;
 if(!keys(c,['centerId','groupPeopleId','productTypeId','contractTypeId','bundleId','giftCodeTypeId','installment','upgrade'])||['centerId','groupPeopleId','productTypeId','contractTypeId'].some(k=>id(c[k])!==c[k])||['bundleId','giftCodeTypeId'].some(k=>c[k]!==null&&id(c[k])!==c[k])||typeof c.installment!=='boolean'||typeof c.upgrade!=='boolean')return false;
 if(!keys(p,['groupId','priceId','typeId','packageId','hourWeekId','priceName','packageName','hourWeekName','units','unitPrice','monthHours','weekHours'])||['groupId','priceId','packageId','hourWeekId'].some(k=>id(p[k])!==p[k])||![1,2].includes(p.typeId)||['priceName','packageName','hourWeekName'].some(k=>!name(p[k])||p[k].length>200)||!num(p.units)||p.units<=0||p.units>520||!num(p.unitPrice)||p.unitPrice<=0||p.unitPrice>1e10||['monthHours','weekHours'].some(k=>p[k]!==null&&(!num(p[k])||p[k]<=0||p[k]>1000)))return false;
 if(!list(v.groups,100)||new Set(v.groups.map(g=>g?.id)).size!==v.groups.length||JSON.stringify(v).length>300000)return false;
 return v.groups.every(g=>keys(g,['id','name','type','priority','sort','max','with','discounts'])&&id(g.id)===g.id&&!!name(g.name)&&[1,2,3].includes(g.type)&&num(g.priority)&&Math.abs(g.priority)<1e6&&num(g.sort)&&Math.abs(g.sort)<1e6&&num(g.max)&&g.max>=0&&g.max<=100&&(g.with===null||!!list(g.with,100)&&g.with.every(n=>id(n)===n))&&!!list(g.discounts,200)&&new Set(g.discounts.map(d=>d?.id)).size===g.discounts.length&&g.discounts.every(d=>keys(d,['id','name','detail'])&&id(d.id)===d.id&&!!name(d.name)&&keys(d.detail,['groupId','rule','installment','percent','amount','months','installmentPercent','installmentAmount','installmentMonths'])&&d.detail.groupId===p.groupId&&(d.detail.rule===null||['default','last'].includes(d.detail.rule))&&(d.detail.installment===null||typeof d.detail.installment==='boolean')&&['percent','amount','months','installmentPercent','installmentAmount','installmentMonths'].every(k=>d.detail[k]===null||num(d.detail[k])&&d.detail[k]>=0&&d.detail[k]<=(k.toLowerCase().includes('percent')?100:k.toLowerCase().includes('months')?120:1e13))));
}
export function policyMatchesInputs(v,cells,context={}){
 if(!validateHubPolicy(v)||v.context.upgrade)return false;
 const p=v.product,a=pricingIdentity(p.priceName,p.hourWeekName,p.packageName),b=pricingIdentity(cells.H,cells.I,cells.J,context);
 if(a.key!==b.key||(!a.group||!a.year)&&fold(p.priceName)!==fold(cells.H)||a.conflicts.length||b.conflicts.length||weeklyHours(cells.I)!==weeklyHours(p.hourWeekName))return false;
 const center=x=>String(x??'').toUpperCase().replace(/[\s._-]+/g,'').replace(/^HN24TCY$/,'HN24TC');
 if(!center(cells.B)||center(cells.B)!==center(v.centerCode))return false;
 if(typeof context.method==='string'&&context.method.trim()&&/installment/i.test(context.method)!==v.context.installment)return false;
 return true;
}
export function hubPolicyMissing(row){if(!policyMatchesInputs(row?.hubPolicy,row?.cells??{},row?.context??{}))return true;const calculated=calculateHubPolicy(row.hubPolicy,row.cells,row.context??{});return !!calculated?.error;}
export function hubPolicyRevision(v){if(!validateHubPolicy(v))return '';let n=2166136261;for(const c of JSON.stringify({...v,capturedAt:null}))n=Math.imul(n^c.charCodeAt(0),16777619);return 'hub-'+(n>>>0).toString(16);}
export const roundHubMoney=x=>Math.round(x/1000)*1000;
export function policyVoucher(v,code){return validateHubPolicy(v)&&v.voucher?.code===String(code??'').trim().toUpperCase()?v.voucher:null;}

// Calculate from lookup unit prices and eligible program definitions. Saved
// Contract Price/Discount/FinalPrice values are never accepted by this function.
export function calculateHubPolicy(v,cells,context={},voucher=null){
 if(!policyMatchesInputs(v,cells,context))return null;
 const original=policyVoucher(v,cells.K);
 if(original){
  if(voucher&&['type','amount','rate','maximum'].some(k=>voucher[k]!=null&&voucher[k]!==''&&voucher[k]!==original[k]))return {error:'CHECK - VOUCHER ĐANG NHẬP KHÁC CẤU HÌNH HUB'};
  voucher={...voucher,...original};
 }
 const p=v.product,gross=p.unitPrice*p.units,labels=String(cells.L??'').split(';').map(text).filter(s=>s&&s!=='0');
 if(!String(cells.L??'').trim())return {error:'CHECK - HUB CHƯA XÁC NHẬN DISCOUNT APPLY'};
 const selected=[];
 for(const label of labels){const matches=v.groups.flatMap(g=>g.discounts.filter(d=>fold(g.name+' - '+d.name)===fold(label)).map(d=>({g,d})));if(matches.length!==1)return {error:'CHECK - HUB KHÔNG CÓ ƯU ĐÃI DUY NHẤT: '+label};if(selected.some(s=>s.g.id===matches[0].g.id))return {error:'CHECK - HUB CHỌN NHIỀU ƯU ĐÃI TRONG MỘT NHÓM'};selected.push(matches[0]);}
 if(selected.length>1){const first=selected.find(s=>s.g.id===v.firstGroupId);if(!first)return {error:'CHECK - HUB CHƯA XÁC ĐỊNH NHÓM ƯU ĐÃI CHỌN ĐẦU'};if(first.g.with&&selected.some(s=>s.g.id!==first.g.id&&!first.g.with.includes(s.g.id)))return {error:'CHECK - HUB NHÓM KHUYẾN MÃI KHÔNG ĐƯỢC CỘNG CHUNG'};}
 selected.sort((a,b)=>a.g.priority-b.g.priority||a.g.sort-b.g.sort);
 const components=[],checks=[];let discount=0,giftMonths=0,last=0;
 const fixed=voucher?.type==='amount'&&num(voucher.amount)?roundHubMoney(voucher.amount):0;
 if(fixed>0&&v.context.giftCodeTypeId===null&&selected.some(s=>s.g.type===1))return {error:'CHECK - HUB THIẾU LOẠI GIFTCODE ĐỂ XÁC ĐỊNH THỨ TỰ GIẢM'};
 for(const rule of ['default','last'])for(const {g,d}of selected){
  const detail=d.detail;if(!detail.rule||typeof detail.installment!=='boolean')return {error:'CHECK - HUB THIẾU THỨ TỰ / NHÁNH KHUYẾN MÃI'};
  if(detail.rule!==rule)continue;
  const installment=detail.installment&&v.context.installment,prefix=installment?'installment':'';
  const field=k=>detail[prefix?prefix+k[0].toUpperCase()+k.slice(1):k];
  const rate=field('percent'),amount=field('amount'),months=field('months');
  if(g.type===1&&!num(rate)||g.type===2&&!num(amount)||g.type===3&&!num(months))return {error:'CHECK - HUB THIẾU MỨC ƯU ĐÃI'};
  let value=0;
  if(g.type!==3){const voucherFirst=rule==='last'||![7,8].includes(v.context.giftCodeTypeId);const base=Math.max(0,gross-discount-(voucherFirst?fixed:0));value=Math.min(g.max/100*gross,g.type===1?rate/100*base:amount);discount+=value;if(rule==='last')last+=value;}
  else giftMonths+=months;
  components.push({label:g.name+' - '+d.name,kind:g.type===3?'months':'cash',amount:value,months:g.type===3?months:0,rule,groupId:g.id,discountId:d.id});
 }
 discount=roundHubMoney(discount);
 const max=selected.length?Math.min(...selected.map(s=>s.g.max)):100;if(discount>gross*max/100)checks.push('CHECK - HUB TỔNG KHUYẾN MÃI VƯỢT TRẦN NHÓM');
 let monthHours=p.monthHours,baseHours=null,extraHours=null;
 if(p.typeId===1){const h=weeklyHours(p.hourWeekName),special=[367,368].includes(p.priceId),adjust=h===3?(special?p.units+giftMonths>=12:[9,12,18].includes(p.units)):h===4?(special?p.units+giftMonths>=8:[9,12,18].includes(p.units)):false;if(adjust)monthHours=h===3?12.5:16.6666;if(num(monthHours)){baseHours=p.units*monthHours;extraHours=giftMonths*monthHours;}}
 else if(num(p.weekHours)){baseHours=p.units*p.weekHours;if(giftMonths===0)extraHours=0;else checks.push('XÁC MINH - HUB GÓI TUẦN CÓ THÁNG TẶNG: cần căn cứ quy đổi giờ');}
 for(const {g,d}of selected)if([83,248,261].includes(g.id)&&baseHours!==null)baseHours-=[1525,1527].includes(d.id)?16:[1526,1528].includes(d.id)?12:20;
 let giftcode=0;
 if(String(cells.K??'').trim()&&String(cells.K).trim()!=='0'){
  if(!voucher||voucher.type==='percent'&&(!num(voucher.rate)||!num(voucher.maximum)))giftcode=null;
  else if(voucher.type==='amount')giftcode=fixed;
  else if(voucher.type==='percent'){const base=Math.max(0,gross-discount+last);const expected=Math.floor(base*voucher.rate);giftcode=roundHubMoney(voucher.maximum>0?Math.min(expected,voucher.maximum):Math.min(expected,base));}
  else giftcode=null;
 }
 if(discount+(giftcode??0)>gross)checks.push('CHECK - HUB TỔNG GIẢM VƯỢT GIÁ GỐC');
 return {gross,discount,giftcode,giftMonths,monthHours,baseHours,extraHours,totalHours:baseHours!==null&&extraHours!==null?Math.round(baseHours+extraHours):null,components,checks,lastDiscount:last};
}

// This bounded lookup uses only the named read services already shipped by Hub.
// Promise timeouts do not permit late results to mutate a source or a model.
export async function readHubPolicy(detail,client,{signal,budgetMs=5000,now=()=>Date.now(),schedule=setTimeout,unschedule=clearTimeout}={}){
 const deadline=now()+Math.min(10000,Math.max(100,budgetMs));
 const call=async(fn,args)=>{
  if(signal?.aborted)fail('timeout');if(typeof fn!=='function')fail('unsupported');
  let timer,pending,onAbort;
  try{return await new Promise((resolve,reject)=>{const rejectTimeout=()=>{try{pending?.abort?.();}catch{}reject(Object.assign(Error('timeout'),{policyCode:'timeout'}));};timer=schedule(rejectTimeout,Math.max(0,deadline-now()));onAbort=rejectTimeout;signal?.addEventListener('abort',onAbort,{once:true});try{pending=fn(args);Promise.resolve(pending).then(resolve,reject);}catch(e){reject(e);}});}finally{unschedule(timer);signal?.removeEventListener('abort',onAbort);}
 };
 try{
  let request=hubPolicyRequest(detail);
  if(!request){const info=await call(client.info,{contractId:detail.ContractId});request=hubPolicyRequest(detail,info);}
  if(!request)fail('context');if(request.context.upgrade||request.context.productTypeId!==1)fail('unsupported');
  const {context:c,product:p}=request,prices={centerId:c.centerId,productGroupIds:String(p.groupId),groupPeopleId:c.groupPeopleId},groups={productTypeId:c.productTypeId,productGroupId:p.groupId,bundleId:c.bundleId,contractTypeId:c.contractTypeId,centerId:c.centerId,listProductGroup:JSON.stringify([{productGroupId:p.groupId,hourWeekId:p.hourWeekId,packageId:p.packageId,priceTypeId:p.typeId}]),date:request.dateValue};
  const code=[detail.GiftCode,...(list(detail.ListCourseInfo,20)??[]).map(c=>c.GiftCode)].map(text).filter(s=>s&&s!=='0'),codes=[...new Set(code.map(c=>c.toUpperCase()))];
  const checkVoucher=codes.length===1&&id(detail.KidId)&&typeof client.voucher==='function'?call(client.voucher,{code:codes[0],centerId:c.centerId,kidId:id(detail.KidId)}):Promise.resolve(null);
  const results=await Promise.allSettled([call(client.prices,prices),call(client.groups,groups),checkVoucher]);
  if(signal?.aborted)fail('timeout');if(results[0].status!=='fulfilled')fail(results[0].reason?.policyCode??'price');if(results[1].status!=='fulfilled')fail(results[1].reason?.policyCode??'groups');
  let voucher=null;
  const checked=results[2].status==='fulfilled'?results[2].value:null;
  if(checked&&codes.length===1&&text(checked.GiftCode).toUpperCase()===codes[0]&&typeof checked.GiftCodeIsFixed==='boolean'&&num(checked.GiftCodeDiscountAmount)&&num(checked.GiftCodeDiscountAmountMax))voucher={code:codes[0],type:checked.GiftCodeIsFixed?'amount':'percent',amount:checked.GiftCodeIsFixed?checked.GiftCodeDiscountAmount:null,rate:checked.GiftCodeIsFixed?null:checked.GiftCodeDiscountAmount/100,maximum:checked.GiftCodeDiscountAmountMax,typeId:id(checked.GiftCodeTypeId)};
  const policy=projectHubPolicy(request,results[0].value,results[1].value,new Date().toISOString(),voucher);if(!policy)fail('format');return {policy,policyError:null};
 }catch(e){return {policy:null,policyError:HUB_POLICY_ERRORS.includes(e.policyCode)?e.policyCode:'permission'};}
}
