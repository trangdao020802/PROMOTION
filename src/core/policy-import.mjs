import {normalizePolicyRow} from './policy-pack.mjs';
import {priceText,pricingIdentity} from './pricing-key.mjs';
export const POLICY_COLUMNS=['group','year','layer','hours','variant','months','weeks','packageKey','monthly','gross','discount','maxTerms','straight','loyalty','referral','from','to','center','contractType','source','approval','discountLabels','conditions'];
const aliases={course:['course','course fee','course fee koc','ma / ten gia he thong (key name)'],group:['group','chuong trinh'],year:['year','nam'],layer:['layer','khu vuc (layer)'],hours:['hours','hour/week','gio/tuan','thoi luong (gio/tuan)'],variant:['variant','loai goi'],months:['months','so thang'],weeks:['weeks','so tuan','tuan'],packageKey:['packagekey','khoa goi'],monthly:['monthly','gia thang chua giam','don gia chua giam (vnd/thang)'],gross:['gross','gia goc','gia goc niem yet (vnd)'],discount:['discount','giam tien'],maxTerms:['maxterms','ky tra gop'],straight:['straight','thang tra thang'],loyalty:['loyalty'],referral:['referral'],from:['from','tu ngay'],to:['to','den ngay'],center:['center'],contractType:['contracttype','doi tuong'],source:['source','nguon'],approval:['approval','can cu duyet'],discountLabels:['discountlabels','nhan discount'],conditions:['conditions','dieu kien']};
const numbers=s=>String(s??'').match(/\d+(?:[.,]\d+)?/g)?.map(v=>Number(v.replace(',','.')))??[];
export function policyTableRows(table,defaults={}){
 const matrix=table.rows??table,index=matrix.slice(0,20).findIndex(r=>r.some(c=>['gross','gia goc','gia goc niem yet (vnd)'].includes(priceText(c))));
 if(index<0)throw Error('Không tìm thấy hàng tiêu đề giá. Dùng file mẫu CSV hoặc sheet Bảng Tra Cứu Giá Promotion 2026.');
 const headers=matrix[index].map(priceText),lookup=headers.some(s=>s.includes('(key name)'));
 const mapping=Object.fromEntries(Object.entries(aliases).map(([k,names])=>[k,headers.findIndex(h=>names.includes(h))]));
 return matrix.slice(index+1).filter(r=>r.some(c=>c!==null&&c!==undefined&&String(c).trim())&&!(lookup&&/^ghi chu|^notes?\b/.test(priceText(r[0]))&&!(Number(r[5])>0))).map((row,i)=>{
  const raw=Object.fromEntries(Object.entries(mapping).filter(([,col])=>col>=0&&row[col]!==null&&row[col]!==undefined&&row[col]!=='').map(([k,col])=>[k,row[col]]));
  if(lookup){
   const course=String(row[0]??''),description=String(row[1]??''),combined=course+' '+description,weekly=numbers(row[3])[0],layer=numbers(row[2])[0];
   const months=/\b(\d+)\s*(?:months?|tháng|T)\b/i.exec(course)?.[1]??(/VTDH/i.test(description)?'2':null);
   const identity=pricingIdentity(course,weekly,months?months+' months'+(/siblings/i.test(course)?' siblings':''):'',{group:'ATLS'});
   Object.assign(raw,{group:/AHP|@Home/i.test(combined)?'AHP':/IELTS/i.test(combined)?'IELTS':'ATLS/AGLS',year:identity.year??defaults.year??2026,layer,hours:weekly,months:months?Number(months):null,packageKey:identity.packageKey,variant:identity.variant,course,conditions:row[12]??''});
   const cash=Number(row[defaults.regime==='base'?6:7]);raw.discount=Number.isFinite(cash)?cash:null;
   const terms=String(row[11]??''),termMatch=new RegExp('(\\d+)\\s*tháng\\s*\\('+ (defaults.regime==='base'?'Base':'Q4')+'\\)','i').exec(terms);
   raw.maxTerms=termMatch?Number(termMatch[1]):/không trả góp|tra thang/i.test(priceText(terms))?0:numbers(terms).length===1?numbers(terms)[0]:null;
   const gifts=String(row[10]??'');raw.straight=Number(/Trả thẳng:\s*\+(\d+(?:[.,]\d+)?)/i.exec(gifts)?.[1]?.replace(',','.')??0);raw.loyalty=Number(/Loyalty[^:]*:\s*\+(\d+(?:[.,]\d+)?)/i.exec(gifts)?.[1]?.replace(',','.')??0);raw.referral=Number(/Ref New:\s*\+(\d+(?:[.,]\d+)?)/i.exec(gifts)?.[1]?.replace(',','.')??0);
   // One row mentions two possible short packages / two installment limits.
   // Leave them unresolved for the preview instead of choosing a convenient one.
   if(/2\s*tháng\s*\/\s*3\s*tháng/i.test(course))raw.months=null;
   if(/2024.*\/.*VTDH/i.test(course))raw.variant='unresolved';
  }
  return normalizePolicyRow(raw,{...defaults,source:defaults.source||table.name||'Chính sách nhập',approval:defaults.approval||'',row:index+i+2});
 });
}
export function policyTemplateCSV(){return '\uFEFF'+POLICY_COLUMNS.join(',')+'\r\n'+['ATLS',2027,1,4,'standard',12,12,4300000,51600000,5160000,6,1,0,1,'2027-01-01','2027-03-31','*','*','Ten file chinh sach da duyet','So quyet dinh / nguoi duyet','Ten Discount apply duoc phep','Dieu kien hoc vien can xac minh'].join(',')+'\r\n';}
