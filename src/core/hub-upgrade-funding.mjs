import {unionReceipts,unionTransfers,invoiceFunding,invoiceEligible} from './reconcile.mjs';
const day=value=>(Date.parse(String(value)+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000;
const reaches=(from,to,edges)=>{
 const queue=[from],seen=new Set();
 for(let i=0;i<queue.length&&seen.size<200;i++){const node=queue[i];if(node===to)return true;if(seen.has(node))continue;seen.add(node);for(const e of edges)if(e.from===node)queue.push(e.to);}
 return false;
};
// An explicit Upgrade is an allocation, even when Hub omits its date. An
// undated edge is valued as of this report's cutoff, never a claimed full date.
export function upgradeFunding(input,edges){
 const cash=unionReceipts(input.cashSources??[]).rows,raw=unionTransfers(input.transferSources??[]).rows,moves=[],pending=[],notes=[],pairs=new Map();
 const warn=(e,reason)=>pending.push({from:e.from,to:e.to,reason:'Upgrade '+e.from+' → '+e.to+': '+reason});
 for(const e of edges){const key=e.from+'|'+e.to,list=pairs.get(key)??[];list.push(e);pairs.set(key,list);}
 const candidates=[...pairs.values()].map(list=>({...list[0],dates:[...new Set(list.map(e=>e.date).filter(Boolean))]})),ordered=[],remaining=[...candidates];
 while(remaining.length){const i=remaining.findIndex(e=>!remaining.some(p=>p.to===e.from));if(i<0){ordered.push(...remaining);break;}ordered.push(...remaining.splice(i,1));}
 const effective=e=>e.dates.length?day(e.dates[0]):input.cutoff;
 ordered.sort((a,b)=>effective(a)-effective(b));
 const reported=new Set([...(input.paid??[]).map(p=>p.ct),...(input.records??[]).filter(r=>r.date<input.cutoff+1).map(r=>r.contract)]);
 for(const e of ordered){
  if(new Set(candidates.filter(x=>x.from===e.from).map(x=>x.to)).size!==1){warn(e,'CT nguồn có nhiều CT nâng cấp nhận tiền; cần đối chiếu riêng.');continue;}
  if(reaches(e.to,e.from,[...raw,...edges])){warn(e,'Liên kết tạo vòng chuyển tiền; chưa cộng.');continue;}
  if(reaches(e.from,e.to,raw))continue; // Transfer already describes this path.
  if(e.dates.length>1){warn(e,'Mâu thuẫn ngày nâng cấp / ngày tạo CT nhận.');continue;}
  const asOf=!e.dates.length;
  if(asOf&&(!Number.isFinite(input.cutoff)||![...reported].some(ct=>reaches(e.to,ct,edges)))){warn(e,'Chưa có kỳ đối chiếu và CT nhận trong bộ nguồn để ghi nhận Upgrade chưa có ngày.');continue;}
  const date=effective(e);if(!Number.isFinite(date)||date>=input.cutoff+1){warn(e,'Ngày nâng cấp ngoài kỳ đang đối chiếu.');continue;}
  const receipts=cash.filter(r=>r.date<date+1),transfers=unionTransfers([{rows:[...raw,...moves]}]).rows.filter(m=>m.date<date+1),funded=invoiceFunding(receipts,transfers,input.links??[]);
  const available=receipts.filter(r=>r.contract===e.from&&invoiceEligible(r)).reduce((n,r)=>n+r.amount,0)+transfers.filter(m=>m.to===e.from&&funded.has(m.id)).reduce((n,m)=>n+m.amount,0)-transfers.filter(m=>m.from===e.from).reduce((n,m)=>n+m.out,0);
  if(!(available>1)){warn(e,'Chưa có số dư từ hóa đơn Paid gốc để phân bổ.');continue;}
  // Later recorded outflows reserve their own funds. Do not spend them again.
  const reserved=raw.filter(m=>m.from===e.from&&m.date>=date+1&&m.date<input.cutoff+1).reduce((n,m)=>n+m.out,0);
  const amount=available-reserved;if(!(amount>1)){warn(e,'Tiền nguồn đã có chặng chuyển khác; cần đối chiếu.');continue;}
  moves.push({type:'Upgrade',date,...(asOf?{dateBasis:'period-end'}:{}),from:e.from,to:e.to,fromStudent:'',toStudent:'',out:amount,amount,ref:{file:'Hub · '+e.from,sheet:'Upgrade from contract',row:1,url:e.url}});
  if(asOf)notes.push({from:e.from,to:e.to,reason:'Đã ghi nhận phân bổ theo liên kết Upgrade tại kỳ đối chiếu. Hub chưa cung cấp ngày nâng cấp; không dùng ngày chốt kỳ làm ngày full hoặc xét hạn ưu đãi.'});
 }
 return {moves,pending,notes};
}
