import style from './xlsx-style.json' with {type:'json'};
export const XLSX_MIME='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const encoder=new TextEncoder();
const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]/g,'');
export function columnName(index){let name='';for(index++;index;index=Math.floor((index-1)/26))name=String.fromCharCode(65+(index-1)%26)+name;return name;}
export function numericColumn(header){
 const h=fold(header);
 if(/(?:code|studentid|kidid|name|no$|number|phone|passport|giftcode|discountapply|contracttype|invoiceno|date|status|method)/.test(h))return false;
 return /(?:amount|fee|price|discount|hour|total|balance|paid|paymentdiff|chenhlech|phaidong|tien|sothang|weeks|months|year|layer|maxterms|monthly|gross|straight|loyalty|referral|detailrecords)/.test(h);
}
// Only declared quantity/amount columns are converted. Numeric identifiers and
// leading zeros stay text. General is a cell format, not a locale-formatted string.
export function spreadsheetNumber(value,header){
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 if(!numericColumn(header)||typeof value!=='string')return value;
 let s=value.trim().replace(/[\u00a0\u202f]/g,' ').replace(/\s*(?:VND|VNĐ|₫|đ)\s*$/i,'').trim();
 if(!s||/[%/:]/.test(s))return value;
 if(/^\([\d., ]+\)$/.test(s))s='-'+s.slice(1,-1);
 if(!/^[+-]?\d[\d., ]*$/.test(s))return value;
 s=s.replace(/ /g,'');
 if(s.includes(',')&&s.includes('.')){const decimal=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.',group=decimal===','?'.':',';s=s.split(group).join('').replace(decimal,'.');}
 else if(/^[+-]?\d{1,3}(?:[.,]\d{3})+$/.test(s)&&!/hour|gio/.test(fold(header)))s=s.replace(/[.,]/g,'');
 else s=s.replace(',','.');
 const n=Number(s);return Number.isFinite(n)&&Math.abs(n)<1e15?n:value;
}
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=bytes=>{let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;};
const concat=chunks=>{const result=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let offset=0;for(const c of chunks){result.set(c,offset);offset+=c.length;}return result;};
async function compressed(bytes){
 if(typeof CompressionStream!=='function')return {bytes,method:0};
 try{const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate')),zlib=new Uint8Array(await new Response(stream).arrayBuffer());
  if(zlib.length>6&&!(zlib[1]&32)&&zlib.length-6<bytes.length)return {bytes:zlib.slice(2,-4),method:8};
 }catch{}
 return {bytes,method:0};
}
async function zip(files){
 const local=[],central=[];let offset=0;
 for(const [path,text]of Object.entries(files)){
  const name=encoder.encode(path),raw=encoder.encode(text),data=await compressed(raw),crc=crc32(raw),header=new Uint8Array(30),h=new DataView(header.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(8,data.method,true);h.setUint32(14,crc,true);h.setUint32(18,data.bytes.length,true);h.setUint32(22,raw.length,true);h.setUint16(26,name.length,true);
  local.push(header,name,data.bytes);
  const entry=new Uint8Array(46),e=new DataView(entry.buffer);e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x800,true);e.setUint16(10,data.method,true);e.setUint32(16,crc,true);e.setUint32(20,data.bytes.length,true);e.setUint32(24,raw.length,true);e.setUint16(28,name.length,true);e.setUint32(42,offset,true);central.push(entry,name);offset+=header.length+name.length+data.bytes.length;
 }
 const directory=concat(central),end=new Uint8Array(22),v=new DataView(end.buffer),count=Object.keys(files).length;v.setUint32(0,0x06054b50,true);v.setUint16(8,count,true);v.setUint16(10,count,true);v.setUint32(12,directory.length,true);v.setUint32(16,offset,true);return concat([...local,directory,end]);
}
const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const main='http://schemas.openxmlformats.org/spreadsheetml/2006/main',rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
export async function tableWorkbook(sheets){
 if(!Array.isArray(sheets)||!sheets.length||sheets.length>20)throw Error('Cần 1–20 bảng để xuất Excel.');
 const files={'_rels/.rels':declaration+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+rel+'/officeDocument" Target="xl/workbook.xml"/></Relationships>','xl/styles.xml':style.xml};
 const sheetDefs=[],relationships=[],types=[],names=new Set();
 for(let index=0;index<sheets.length;index++){
  const sheet=sheets[index],headers=sheet.headers??sheet.rows?.[0],rows=sheet.headers?sheet.rows??[]:sheet.rows?.slice(1)??[];
  if(!Array.isArray(headers)||!headers.length||headers.length>256||rows.length>100000||rows.some(r=>!Array.isArray(r)||r.length>headers.length))throw Error('Bảng Excel có hàng/cột không hợp lệ.');
  let name=String(sheet.name||'Table '+(index+1)).replace(/[\\/*?:\[\]]/g,' ').slice(0,31).trim()||'Table';const base=name;let suffix=1;while(names.has(name.toLowerCase()))name=base.slice(0,26)+' '+(++suffix);names.add(name.toLowerCase());
  const values=[headers,...rows],end=columnName(headers.length-1)+(rows.length+1);
  const widths=headers.map((header,c)=>Math.min(60,Math.max(15,String(header??'').length+2,...rows.slice(0,100).map(r=>String(r[c]??'').split('\n').reduce((n,s)=>Math.max(n,s.length+2),0)))));
  const cells=values.map((row,r)=>'<row r="'+(r+1)+'" ht="'+Math.min(409,Math.max(r===0?44:24,...row.map((value,c)=>String(value??'').split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/(widths[c]||15))),0)*14+10)))+'" customHeight="1">'+headers.map((header,c)=>{
   const value=r&&sheet.numbers!==false?spreadsheetNumber(row[c],header):row[c],address=columnName(c)+(r+1),s=r===0?style.header:r%2?style.body:style.band;
   if(value==null||value==='')return '<c r="'+address+'" s="'+s+'"/>';
   if(typeof value==='number'&&Number.isFinite(value))return '<c r="'+address+'" s="'+s+'"><v>'+value+'</v></c>';
   if(String(value).length>32767)throw Error('Nội dung một ô vượt giới hạn Excel.');
   return '<c r="'+address+'" s="'+s+'" t="inlineStr"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>';
  }).join('')+'</row>').join('');
  const columns=headers.map((header,c)=>'<col min="'+(c+1)+'" max="'+(c+1)+'" width="'+widths[c]+'" customWidth="1"/>').join('');
  const unique=new Set(headers.map(h=>String(h).toLowerCase())).size===headers.length&&headers.every(h=>String(h??'').trim()),table=sheet.table!==false&&rows.length&&unique;
  const path='xl/worksheets/sheet'+(index+1)+'.xml';
  files[path]=declaration+'<worksheet xmlns="'+main+'" xmlns:r="'+rel+'"><dimension ref="A1:'+end+'"/><sheetViews><sheetView showGridLines="0" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="24"/><cols>'+columns+'</cols><sheetData>'+cells+'</sheetData>'+(!table?'<autoFilter ref="A1:'+end+'"/>':'')+(table?'<tableParts count="1"><tablePart r:id="rId1"/></tableParts>':'')+'</worksheet>';
  if(table){const t=index+1;files['xl/tables/table'+t+'.xml']=declaration+'<table xmlns="'+main+'" id="'+t+'" name="ReportTable'+t+'" displayName="ReportTable'+t+'" ref="A1:'+end+'" totalsRowShown="0"><autoFilter ref="A1:'+end+'"/><tableColumns count="'+headers.length+'">'+headers.map((h,c)=>'<tableColumn id="'+(c+1)+'" name="'+xml(h)+'"/>').join('')+'</tableColumns><tableStyleInfo name="TableStyleMedium4" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>';files['xl/worksheets/_rels/sheet'+t+'.xml.rels']=declaration+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+rel+'/table" Target="../tables/table'+t+'.xml"/></Relationships>';types.push('<Override PartName="/xl/tables/table'+t+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>');}
  sheetDefs.push('<sheet name="'+xml(name)+'" sheetId="'+(index+1)+'" r:id="rId'+(index+1)+'"/>');relationships.push('<Relationship Id="rId'+(index+1)+'" Type="'+rel+'/worksheet" Target="worksheets/sheet'+(index+1)+'.xml"/>');types.push('<Override PartName="/'+path+'" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
 }
 files['xl/workbook.xml']=declaration+'<workbook xmlns="'+main+'" xmlns:r="'+rel+'"><sheets>'+sheetDefs.join('')+'</sheets></workbook>';
 files['xl/_rels/workbook.xml.rels']=declaration+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+relationships.join('')+'<Relationship Id="rIdStyles" Type="'+rel+'/styles" Target="styles.xml"/></Relationships>';
 files['[Content_Types].xml']=declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+types.join('')+'</Types>';
 return zip(files);
}
