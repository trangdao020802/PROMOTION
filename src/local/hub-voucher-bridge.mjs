import {voucherRequest,voucherPayload} from '../core/hub-voucher.mjs';
import {HUB_BRIDGE_VERSION,bridgeVersionAtLeast} from '../core/hub-bridge-version.mjs';
const CHANNEL='promotion-hub/v1';
export const VOUCHER_BRIDGE_VERSION=HUB_BRIDGE_VERSION;
const voucherReady=ready=>bridgeVersionAtLeast(ready.version)&&Array.isArray(ready.capabilities)&&['voucher','background-voucher','no-new-tabs'].every(c=>ready.capabilities.includes(c));
const error=(message,code)=>Object.assign(Error(message),{code});
export function voucherBridgeMessage(action,voucher,{window:target=globalThis.window,signal,onProgress=()=>{},timeoutMs,deadline}={}){
 return new Promise((resolve,reject)=>{
  const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16)),id='voucher-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');let timer,incompatible;
  const cancel=()=>target.postMessage({channel:CHANNEL,direction:'request',action:'cancel',id},target.location.origin);
  const clear=()=>{clearTimeout(timer);target.removeEventListener('message',listener);signal?.removeEventListener('abort',abort);};
  const abort=()=>{cancel();clear();reject(error('Đã dừng tra Voucher.','cancelled'));};
  const timeout=()=>{if(action!=='ping')cancel();clear();reject(error(action==='ping'?incompatible?'Cầu nối đang kết nối chưa hỗ trợ tra Voucher trong nền. Dùng cầu nối Hub '+HUB_BRIDGE_VERSION+' chung với Input và gắn link; tải lại Promotion và Hub.':'Chưa kết nối cầu nối Hub. Nếu đã cài bản '+HUB_BRIDGE_VERSION+', kiểm tra tiện ích được bật cho trang này và tải lại Promotion.':'Hub chưa trả đủ thông tin Voucher; các ô đang nhập được giữ lại.',action==='ping'?'bridge':'timeout'));};
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
export async function readHubVoucher(code,options={}){
 if(Number.isFinite(options.budgetMs)&&options.budgetMs>0)options={...options,deadline:Date.now()+Math.min(options.budgetMs,60000)};
 const request=voucherRequest({code});if(!request)throw error('Nhập Giftcode No đầy đủ trước khi tìm.','voucher_invalid');
 await voucherBridgeMessage('ping',null,options);
 const result=await voucherBridgeMessage('voucher',request,options),payload=voucherPayload(result.payload,request);
 if(!payload)throw error('Kết quả Hub không khớp Giftcode đầy đủ hoặc link chi tiết.','voucher_invalid');
 return payload;
}
