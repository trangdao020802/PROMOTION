const clean=value=>value.trim().replace(/\s+/g,' ');
const benefit=/^\d[\d.,]*(?:[ \t]+\d{3})*\s*(?:%|months?|tháng|vnd|vnđ|đ|₫)\s*/iu;
const amountOnly=/^\d[\d.,\s]*(?:%|months?|tháng|vnd|vnđ|đ|₫)?$/iu;
const noOffer=/^(?:0|[-—]+|none|no discount|n\/a)$/i;

// Hub decorates offer names with a benefit, e.g. "1 Months (Offer (TRẢ THẲNG))".
// Only that leading benefit allows unwrapping; parentheses in a name stay intact.
export function normalizeHubDiscount(value,{wrappedOnly=false}={}){
 if(typeof value!=='string'||value.length>2000)return null;
 const entries=[];let depth=0,start=0;
 for(let i=0;i<value.length;i++){
  if(value[i]==='(')depth++;
  else if(value[i]===')')depth=Math.max(0,depth-1);
  else if(depth===0&&/[;\r\n]/.test(value[i])){entries.push(value.slice(start,i));start=i+1;}
 }
 entries.push(value.slice(start));
 const names=[];let zero=false;
 for(const entry of entries){
  let rest=entry.trim();if(!rest)continue;
  if(noOffer.test(rest)){zero=true;continue;}
  if(amountOnly.test(rest))continue;
  if(!benefit.test(rest)){
   if(!wrappedOnly)names.push(clean(rest));
   continue;
  }
  while(rest){
   const prefix=benefit.exec(rest);if(!prefix||rest[prefix[0].length]!=='(')return null;
   const open=prefix[0].length;let nested=1,close=open+1;
   for(;close<rest.length&&nested;close++){if(rest[close]==='(')nested++;else if(rest[close]===')')nested--;}
   if(nested)return null;
   const name=clean(rest.slice(open+1,close-1));if(!name)return null;
   names.push(name);rest=rest.slice(close).trim();
  }
 }
 const unique=[...new Set(names)];
 if(unique.length>100)return null;
 return unique.length?unique.join(';'):zero&&!wrappedOnly?'0':null;
}
