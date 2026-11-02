// Invoice identifiers and printed invoice numbers are different facts. Keep
// leading zeroes and never turn a GUID, a payment code or an amount into a VAT no.
const clean=v=>typeof v==='string'?v.trim().replace(/\s+/g,' '):'';
export const invoiceNumber=v=>{const s=typeof v==='number'&&Number.isSafeInteger(v)?String(v):clean(v);return /^\d{1,20}$/.test(s)&&/[1-9]/.test(s)?s:null;};
export const eInvoiceKey=v=>{const s=clean(v);return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)?s:null;};
export const invoiceReference=v=>invoiceNumber(v)??eInvoiceKey(v);
export const eInvoicePDFURL=value=>{const key=eInvoiceKey(value);return key?'https://hub24.apollo.vn:7777/Downloads/EInvoice/'+key+'.pdf':null;};
export function invoiceKeyFromURL(value){
 try{const u=new URL(value,'https://hub24.apollo.vn:7777');if(u.origin!=='https://hub24.apollo.vn:7777'||u.username||u.password||u.search||u.hash)return null;const m=/^\/Downloads\/EInvoice\/([^/]+)\.pdf$/i.exec(u.pathname);return eInvoiceKey(m?.[1]);}catch{return null;}
}
export function invoiceDay(v){
 const s=clean(v);let day=/^(\d{4}-\d{2}-\d{2})(?:$|T| )/.exec(s)?.[1];
 const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
 if(!day&&m)day=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
 return day&&Number.isFinite(Date.parse(day))&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day?day:null;
}
const money=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e13?v:null;
export function validateInvoice(v){
 return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>['number','date','amount','source','conflicts'].includes(k))&&invoiceNumber(v.number)===v.number&&
  (v.date===null||invoiceDay(v.date)===v.date)&&(v.amount===null||money(v.amount)===v.amount)&&['payment-api','learner-payments','e-invoice-pdf'].includes(v.source)&&
  Array.isArray(v.conflicts)&&v.conflicts.length<=4&&v.conflicts.every(k=>['number','date','amount','key'].includes(k));
}
export function projectPaymentInvoice(raw,source='payment-api'){
 const key=eInvoiceKey(raw?.EInvoiceFKey??raw?.EInvoiceGuid??raw?.EInvoiceId??raw?.EInvoice);
 let number=invoiceNumber(raw?.InvoiceNo??raw?.InvoiceNumber);
 // Hub's EInvoiceCode explicitly contains its FKey followed by _<InvoiceNo>.
 // Only accept the complete observed shape bound to this exact FKey.
 if(!number&&key&&typeof raw.EInvoiceCode==='string'){
  const suffix=raw.EInvoiceCode.split(key+'_');
  if(suffix.length===2)number=invoiceNumber(suffix[1]);
 }
 const ref=number??key??invoiceReference(raw?.EInvoiceId??raw?.EInvoice);
 return {...(ref?{invoiceRef:ref}:{}),...(key?{eInvoiceKey:key}:{}),...([1,2].includes(raw?.EInvoiceVersion)?{eInvoiceVersion:raw.EInvoiceVersion}:{}),
  ...(number?{invoice:{number,date:invoiceDay(raw.InvoiceDate??raw.EInvoiceDate??raw.IssueDate),amount:money(raw.InvoiceAmount??raw.InvoiceTotal),source,conflicts:[]}}:{})};
}
export function mergePaymentInvoice(row,extra){
 const a=row.invoice,b=extra?.invoice;let invoice=a??b;
 const conflicts=[...(a?.conflicts??[]),...(b?.conflicts??[])];
 if(a&&b){
  if(a.number.replace(/^0+/,'')!==b.number.replace(/^0+/,''))conflicts.push('number');
  if(a.date&&b.date&&a.date!==b.date)conflicts.push('date');
  if(a.amount!==null&&b.amount!==null&&Math.abs(a.amount-b.amount)>1)conflicts.push('amount');
  invoice={...a,number:b.source==='e-invoice-pdf'?b.number:a.number,date:a.date??b.date,amount:a.amount??b.amount,source:b.source==='e-invoice-pdf'?b.source:a.source};
 }
 if(row.eInvoiceKey&&extra?.eInvoiceKey&&row.eInvoiceKey!==extra.eInvoiceKey)conflicts.push('key');
 if(invoice)invoice={...invoice,conflicts:[...new Set(conflicts)]};
 return {...row,...(!row.invoiceRef&&extra?.invoiceRef?{invoiceRef:extra.invoiceRef}:{}),
  ...(!row.eInvoiceKey&&extra?.eInvoiceKey?{eInvoiceKey:extra.eInvoiceKey}:{}),
  ...(!row.eInvoiceVersion&&extra?.eInvoiceVersion?{eInvoiceVersion:extra.eInvoiceVersion}:{}),...(invoice?{invoice}:{})};
}
export const paymentInvoiceNumber=p=>validateInvoice(p?.invoice)?p.invoice.number:invoiceNumber(p?.invoiceRef);
export const invoiceReadsComplete=f=>f?.payments?.state==='read'&&f.payments.rows.every(p=>p.complete!==true||p.amount<=0||/transfer|moving/i.test(p.method+' '+p.type)||!!paymentInvoiceNumber(p));
export const financeReadsComplete=f=>f?.financeRevision===2&&f.movements?.state==='read'&&invoiceReadsComplete(f);
export const displayedInvoiceNo=value=>eInvoiceKey(value)?'Chưa đọc số hóa đơn':value||'Chưa có số VAT';
export const invoiceLabel=p=>paymentInvoiceNumber(p)??invoiceNumber(p?.invoiceNumber)??displayedInvoiceNo(p?.vat??p?.invoiceRef);
const folded=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[Đđ]/g,'d').toLowerCase();
function printedMoney(value){
 const s=clean(value).replace(/\s/g,'');if(!/^\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?$/.test(s))return null;
 let x=s;const decimal=/^(.*)[.,](\d{1,2})$/.exec(x);if(decimal)x=decimal[1].replace(/[.,]/g,'')+'.'+decimal[2];else x=x.replace(/[.,]/g,'');
 return money(Number(x));
}
export function parseInvoiceText(value){
 if(typeof value!=='string'||value.length>150000)return null;
 const text=folded(value).replace(/\s+/g,' ');
 if(!/hoa don gia tri gia tang|vat\s*invoice/.test(text))return null;
 const nos=[...text.matchAll(/(?:so\s*\(\s*invoice\s*no\.?\s*\)|invoice\s*(?:no\.?|number)|so\s*hoa\s*don)\s*[:：]?\s*(\d{1,20})\b/g)].map(m=>m[1]);
 if(!nos.length||new Set(nos.map(n=>n.replace(/^0+/,''))).size!==1)return null;
 const number=nos.reduce((a,b)=>a.length>=b.length?a:b),dates=[];
 for(const m of text.matchAll(/(?:ngay\s*\(\s*date\s*\)|invoice\s*date|ngay\s*(?:lap\s*)?hoa\s*don)\s*[:：]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/g)){const d=invoiceDay(m[1]);if(d)dates.push(d);}
 const parts=/(?:ngay\s*(?:\(date\))?\s*[:：]?\s*)(\d{1,2})\s*(?:thang|month)(?:\s*\(month\))?\s*(\d{1,2})\s*(?:nam|year)(?:\s*\(year\))?\s*(\d{4})/.exec(text);
 if(parts){const d=invoiceDay(parts[1]+'/'+parts[2]+'/'+parts[3]);if(d)dates.push(d);}
 const amounts=[...text.matchAll(/(?:tong\s*cong\s*tien\s*thanh\s*toan\s*(?:\(grand\s*total\))?|grand\s*total)\s*(?:\(\s*\d\s*\))?\s*[:：]?\s*([\d][\d.,]*(?:\s*[.,]\s*\d{3})*)/g)].map(m=>printedMoney(m[1])).filter(v=>v!==null);
 const uniqueDate=[...new Set(dates)],uniqueAmount=[...new Set(amounts)];
 const result={number,date:uniqueDate.length===1?uniqueDate[0]:null,amount:uniqueAmount.length===1?uniqueAmount[0]:null,source:'e-invoice-pdf',conflicts:[...(uniqueDate.length>1?['date']:[]),...(uniqueAmount.length>1?['amount']:[])]};
 return validateInvoice(result)?result:null;
}
