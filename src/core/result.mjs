const labels={H:'Course fee KOC',I:'Hour/week',J:'Package',M:'Giá niêm yết CALC',N:'Discount CALC',O:'Giftcode CALC',Q:'Phải đóng CALC',R:'Tổng giờ CALC',Z:'Giá niêm yết',AA:'Discount',AB:'Giftcode',AC:'Tiền CT',AD:'Giờ học'};
const number=v=>typeof v==='number'&&Number.isFinite(v);
// Called once, after manual decisions are applied. Display-only legacy flags
// and intermediate AF values cannot leave a resolved case stuck in CHECK.
export function resultReasons(row){
 const c=row.cells??{},reasons=[],add=s=>{if(s&&!reasons.includes(s))reasons.push(s)};
 if(row.kind!=='contract')add('Chưa gắn CT nhận tiền duy nhất.');
 for(const k of ['H','I','J'])if(!String(c[k]??'').trim())add('Thiếu '+labels[k]+'.');
 for(const k of ['M','N','O','Q','R'])if(!number(c[k]))add('Chưa đủ dữ liệu tính '+labels[k]+'.');
 for(const k of ['Z','AA','AB','AC','AD'])if(number(c[k])&&Math.abs(c[k])>(k==='AD'?(row.tolerance?.hours??1):(row.tolerance?.money??1)))add(labels[k]+' còn chênh lệch '+c[k].toLocaleString('vi-VN')+'.');
 for(const [k,label]of [['BD','Quy tắc giá'],['BO','Discount'],['AE','Trả góp']])if(c[k]!=='OK')add(label+': '+String(c[k]||'Chưa đủ dữ liệu'));
 if(!['OK','NO GIFTCODE'].includes(c.CI))add(String(c.CI||'Chưa đủ dữ liệu giftcode.'));
 if(row.reconciliation?.blocking)add(row.reconciliation.status);
 for(const item of row.reviewItems??[])if(!item.approved)add('Chờ duyệt '+item.label+'.');
 for(const message of row.verification?.pending??[])add(message);
 for(const message of row.promotion?.checks??[])add(message);
 for(const warning of row.groupWarnings??[])add(warning);
 for(const error of row.errors??[])add(typeof error==='string'?error:error.message||'Có phép tính chưa thực hiện được.');
 return reasons;
}
