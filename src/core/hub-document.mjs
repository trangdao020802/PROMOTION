const HUB='https://hub24.apollo.vn:7777';
export const hubDocumentCode=value=>{
 const code=String(value??'').trim().toUpperCase();
 return /^[A-Z0-9]+-(?:CT|DEP)-\d{4,20}$/.test(code)?code:null;
};
export function hubDocumentId(value,code){
 try{
  const u=new URL(value),kind=hubDocumentCode(code)?.includes('-DEP-')?'deposit':'contract';
  if(!hubDocumentCode(code)||u.origin!==HUB||u.username||u.password||u.hash)return null;
  const match=new RegExp('^/'+kind+'/(?:'+(kind==='deposit'?'detail|view':'detail')+')/([1-9]\\d{0,14})/?$','i').exec(u.pathname);
  if(match&&!u.search)return match[1];
  if(kind==='deposit'&&/^\/deposit\/(?:detail|view)\/?$/i.test(u.pathname)&&u.searchParams.size===1){const id=u.searchParams.get('id')??u.searchParams.get('depositId');if(/^[1-9]\d{0,14}$/.test(id??''))return id;}
  return null;
 }catch{return null;}
}
