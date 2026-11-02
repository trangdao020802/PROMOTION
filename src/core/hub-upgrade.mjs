import {hubDocumentCode,hubDocumentId} from './hub-document.mjs';
const HUB='https://hub24.apollo.vn:7777';
const text=v=>typeof v==='string'?v.trim().replace(/\s+/g,' '):'';
const id=v=>/^[1-9]\d{0,14}$/.test(String(v??''))?String(v):null;
const ct=v=>hubDocumentCode(v)?.includes('-CT-')?hubDocumentCode(v):null;
export const upgradeDate=v=>{
 const s=text(v),m=/^(\d{2})\/(\d{2})\/(\d{4})/.exec(s),day=m?m[3]+'-'+m[2]+'-'+m[1]:/^\d{4}-\d\d-\d\d(?:$|T| )/.test(s)?s.slice(0,10):null;
 return day&&Number.isFinite(Date.parse(day))&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day?day:null;
};
export const upgradeDirection=value=>({'upgrade from contract':'from','upgraded from contract':'from','upgrade to contract':'to','upgraded to contract':'to'})[text(value).toLowerCase().replace(/[\s:*]+$/,'')]??null;
const urlFor=value=>HUB+'/contract/detail/'+value;
const linkId=value=>{try{return hubDocumentId(new URL(value,HUB).href,'QA-CT-000001');}catch{return null;}};
export function validUpgradeLinks(values){
 return Array.isArray(values)&&values.length<=20&&values.every(v=>v&&Object.keys(v).every(k=>['direction','ct','id','url','date'].includes(k))&&['from','to'].includes(v.direction)&&(v.ct===null||ct(v.ct)===v.ct)&&id(v.id)===v.id&&v.url===urlFor(v.id)&&(v.date===null||upgradeDate(v.date)===v.date));
}
export function projectUpgradeLinks(root){
 const rows=[];
 for(const [direction,prefixes]of [['from',['UpgradeFromContract','UpgradedFromContract']],['to',['UpgradeToContract','UpgradedToContract']]]){
  for(const prefix of prefixes){
   const nested=root?.[prefix],object=nested&&typeof nested==='object'?nested:{};
   const value=id(root?.[prefix+'Id']??object.ContractId??object.Id);
   if(!value)continue;
   const code=ct(root?.[prefix+'No']??root?.[prefix+'Code']??object.ContractNo??object.ContractCode??nested);
   const date=upgradeDate(root.UpgradeDate??root.UpgradedDate??(direction==='from'?root.CreatedDate??root.CreatedTime:null));
   rows.push({direction,ct:code,id:value,url:urlFor(value),date});
  }
 }
 return [...new Map(rows.map(r=>[r.direction+'|'+r.id,r])).values()];
}
export function upgradeLinksFromDocument(root,{staticDocument=false}={}){
 const visible=e=>!!e&&!e.hidden&&e.getAttribute?.('aria-hidden')!=='true'&&!e.closest?.('[hidden],[aria-hidden="true"],.ng-hide,script,template')&&(staticDocument||!e.getClientRects||e.getClientRects().length>0);
 const query=(e,s)=>[...e?.querySelectorAll?.(s)??[]],rows=[];
 for(const label of query(root,'label,dt,th,td,.control-label,.form-label,[class*="col-"]')){
  const direction=upgradeDirection(label.textContent);if(!direction||!visible(label))continue;
  let cursor=label;
  for(let depth=0;cursor&&depth<4;depth++,cursor=cursor.parentElement){
   const sibling=cursor.nextElementSibling;if(!sibling||!visible(sibling))continue;
   const links=query(sibling,'a[href]');if(sibling.tagName==='A')links.push(sibling);
   const choices=links.filter(visible).map(a=>{const code=ct(a.innerText??a.textContent),value=linkId(a.getAttribute?.('href')??a.href);return code&&value?{direction,ct:code,id:value,url:urlFor(value),date:null}:null;}).filter(Boolean);
   if(choices.length){rows.push(...choices);break;}
   if(query(sibling,'label,dt,th,.control-label').length)break;
  }
 }
 return [...new Map(rows.map(r=>[r.direction+'|'+r.id,r])).values()].slice(0,20);
}
export function mergeUpgradeLinks(facts,links){
 if(!facts||!validUpgradeLinks(links))return facts;
 const rows=[...(facts.upgrades??[]),...links],byKey=new Map();
 for(const row of rows){if(row.id===facts.contractId||row.ct===facts.ct)continue;const key=row.direction+'|'+row.id,prior=byKey.get(key);byKey.set(key,prior?{...prior,ct:prior.ct??row.ct,date:prior.date??row.date}:row);}
 return {...facts,upgrades:[...byKey.values()]};
}
// Only an explicit Upgrade pointer supplies this relationship. No Student ID,
// course text, code prefix, amount or breadcrumb alone establishes an upgrade.
export function upgradeEdges(facts){
 const docs=(facts??[]).filter(Boolean),byId=new Map(docs.map(f=>[f.contractId,f])),edges=[];
 for(const f of docs)for(const link of f.upgrades??[]){
  if(!validUpgradeLinks([link]))continue;
  const other=byId.get(link.id),otherCode=link.ct??other?.ct;
  if(!ct(otherCode)||other&&other.ct!==otherCode||otherCode===f.ct)continue;
  const from=link.direction==='from'?otherCode:f.ct,to=link.direction==='from'?f.ct:otherCode;
  const fromId=link.direction==='from'?link.id:f.contractId,toId=link.direction==='from'?f.contractId:link.id;
  const date=link.date??(link.direction==='from'?f.contractDate:other?.contractDate)??null;
  edges.push({from,to,fromId,toId,date,url:link.url});
 }
 return [...new Map(edges.map(e=>[JSON.stringify([e.from,e.to,e.date]),e])).values()];
}
export function upgradeAncestors(facts){
 const docs=[facts,...(facts?.relatedFinance??[])],edges=upgradeEdges(docs),known=new Set([facts?.ct]);
 for(let depth=0;depth<16;depth++){const n=known.size;for(const e of edges)if(known.has(e.to))known.add(e.from);if(known.size===n)break;}
 return known;
}
export function upgradeSourceMissing(facts){
 const docs=new Map([facts,...(facts?.relatedFinance??[])].filter(Boolean).map(f=>[f.contractId,f])),queue=[facts],seen=new Set();
 for(let i=0;i<queue.length&&seen.size<32;i++){
  const f=queue[i];if(!f||seen.has(f.contractId))continue;seen.add(f.contractId);
  for(const link of f.upgrades??[]){if(link.direction!=='from')continue;const other=docs.get(link.id);
   if(!other||link.ct&&other.ct!==link.ct||other.payments?.state!=='read')return true;
   if(other.payments.rows.some(p=>p.complete===true&&p.amount>0&&(!p.invoiceRef||p.invoice?.conflicts?.length)))return true;
   queue.push(other);
  }
 }
 return false;
}
