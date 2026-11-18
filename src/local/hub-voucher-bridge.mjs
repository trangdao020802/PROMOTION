import {voucherRequest,voucherPayload,voucherDetailURL} from '../core/hub-voucher.mjs';
import {HUB_BRIDGE_VERSION,bridgeVersionAtLeast} from '../core/hub-bridge-version.mjs';
import {HUB_BRIDGE_MISSING} from '../core/hub-connection.mjs';
const CHANNEL='promotion-hub/v1';
export const VOUCHER_BRIDGE_VERSION=HUB_BRIDGE_VERSION;
const voucherReady=ready=>bridgeVersionAtLeast(ready.version)&&Array.isArray(ready.capabilities)&&['voucher','background-voucher','no-new-tabs'].every(c=>ready.capabilities.includes(c));
const error=(message,code)=>Object.assign(Error(message),{code});
const recentMs=5*60_000,lookups=new WeakMap();
export function voucherBridgeMessage(action,voucher,{window:target=globalThis.window,signal,onProgress=()=>{},timeoutMs,deadline}={}){
 return new Promise((resolve,reject)=>{
  const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16)),id='voucher-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');let timer,incompatible;
  const cancel=()=>target.postMessage({channel:CHANNEL,direction:'request',action:'cancel',id},target.location.origin);
  const clear=()=>{clearTimeout(timer);target.removeEventListener('message',listener);signal?.removeEventListener('abort',abort);};
  const abort=()=>{cancel();clear();reject(error('Đã dừng tra Voucher.','cancelled'));};
  const timeout=()=>{if(action!=='ping')cancel();clear();reject(error(action==='ping'?incompatible?'Cầu nối đang kết nối chưa hỗ trợ tra Voucher trong nền. Dùng cầu nối Hub '+HUB_BRIDGE_VERSION+' chung với Input và gắn link; tải lại Promotion và Hub.':HUB_BRIDGE_MISSING+' Nếu đã cài bản '+HUB_BRIDGE_VERSION+', bật tiện ích cho trang này và tải lại Promotion.':'Hub chưa trả đủ thông tin Voucher; các ô đang nhập được giữ lại.',action==='ping'?'bridge':'timeout'));};
  const reset=ms=>{clearTimeout(timer);timer=setTimeout(timeout,Math.max(0,Math.min(timeoutMs??ms,Number.isFinite(deadline)?deadline-Date.now():Infinity)));};
  const listener=event=>{
   const packet=event.data;if(event.source!==target||event.origin!==target.location.origin||!packet||packet.channel!==CHANNEL||packet.direction!=='response'||packet.id!==id)return;
   if(packet.type==='progress'){onProgress(String(packet.message??'Đang đọc Voucher trên Hub…'));reset(packet.phase==='login'?10*60_000:120_000);return;}
   if(packet.type==='error'){clear();reject(error(String(packet.message??'Chưa đọc được Voucher Hub.'),action!=='ping'&&(!packet.code||packet.code==='bridge')?'hub_unavailable':packet.code??'bridge'));return;}
   // An older extension may also answer the ping. Wait for the shared current
   // bridge instead of letting an obsolete ready packet win the handshake.
   if(action==='ping'&&packet.type==='ready'&&!voucherReady(packet)){incompatible=packet;return;}
   if(packet.type===(action==='ping'?'ready':'voucher-result')){clear();resolve(packet);}
  };
  target.addEventListener('message',listener);signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted){abort();return;}
  reset(action==='ping'?1400:120_000);target.postMessage({channel:CHANNEL,direction:'request',action,id,...(action==='voucher'?{voucher}:{})},target.location.origin);
 });
}
async function fetchVoucher(request,options){
 await voucherBridgeMessage('ping',null,options);
 const result=await voucherBridgeMessage('voucher',request,options),payload=voucherPayload(result.payload,request);
 if(!payload)throw error('Kết quả Hub không khớp Giftcode đầy đủ hoặc link chi tiết.','voucher_invalid');
 return payload;
}
// Each reader can stop independently while identical live lookups share one
// bridge job. The last reader leaving also releases the Hub frame.
function subscribe(entry,options){
 return new Promise((resolve,reject)=>{
  let timer,finished=false;
  const progress=message=>options.onProgress?.(message);
  const finish=(value,problem)=>{
   if(finished)return;finished=true;clearTimeout(timer);
   options.signal?.removeEventListener('abort',abort);entry.readers.delete(progress);
   if(!entry.readers.size)entry.controller.abort();
   if(problem)reject(problem);else resolve({...value});
  };
  const abort=()=>finish(null,error('Đã dừng tra Voucher.','cancelled'));
  entry.readers.add(progress);options.signal?.addEventListener('abort',abort,{once:true});
  entry.promise.then(value=>{
   const url=voucherDetailURL(options.url);
   if(url&&value.url!==url)finish(null,error('Kết quả Hub khác link Voucher đang đọc.','voucher_invalid'));
   else finish(value);
  },problem=>finish(null,problem));
  if(options.signal?.aborted){abort();return;}
  let deadline=options.deadline;
  if(Number.isFinite(options.budgetMs)&&options.budgetMs>0)deadline=Math.min(deadline??Infinity,Date.now()+Math.min(options.budgetMs,60000));
  if(Number.isFinite(deadline))timer=setTimeout(()=>finish(null,error('Hub chưa trả đủ thông tin Voucher; các ô đang nhập được giữ lại.','timeout')),Math.max(0,deadline-Date.now()));
 });
}
export async function readHubVoucher(code,options={}){
 const request=voucherRequest({code});if(!request)throw error('Nhập Giftcode No đầy đủ trước khi tìm.','voucher_invalid');
 if(options.signal?.aborted)throw error('Đã dừng tra Voucher.','cancelled');
 const target=options.window??globalThis.window;
 let state=lookups.get(target);if(!state){state={recent:new Map(),active:new Map()};lookups.set(target,state);}
 const previous=state.recent.get(request.code),age=previous?Date.now()-previous.savedAt:Infinity;
 const complete=previous?.payload.center&&previous.payload.startDate&&previous.payload.endDate&&(previous.payload.type==='percent'?previous.payload.rate>0:previous.payload.type==='amount'&&previous.payload.amount>0);
 if(!options.force&&age>=0&&age<recentMs&&complete&&(!options.url||voucherDetailURL(options.url)===previous.payload.url)){options.onProgress?.('Đang điền từ Giftcode vừa xác minh trên Hub…');return {...previous.payload};}
 if(options.force)state.recent.delete(request.code);
 let entry=state.active.get(request.code);
 if(!entry||entry.controller.signal.aborted){
  const url=voucherDetailURL(options.url)||previous?.payload.url;
  const expected=voucherRequest({...request,...(url?{url}:{})});
  entry={controller:new AbortController(),readers:new Set()};
  const current=entry;
  state.active.set(request.code,current);
  current.promise=fetchVoucher(expected,{window:target,signal:current.controller.signal,timeoutMs:options.timeoutMs,onProgress:message=>{for(const reader of current.readers)reader(message);}})
   .then(payload=>{
    if(!current.controller.signal.aborted){
     state.recent.delete(request.code);state.recent.set(request.code,{payload,savedAt:Date.now()});
     if(state.recent.size>128)state.recent.delete(state.recent.keys().next().value);
    }
    return payload;
   }).finally(()=>{if(state.active.get(request.code)===current)state.active.delete(request.code);});
 }
 return subscribe(entry,options);
}
