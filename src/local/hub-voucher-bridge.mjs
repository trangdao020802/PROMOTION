import {voucherRequest,voucherPayload} from '../core/hub-voucher.mjs';
const CHANNEL='promotion-hub/v1';
export const VOUCHER_BRIDGE_VERSION='1.6.14';
const error=(message,code)=>Object.assign(Error(message),{code});
export function voucherBridgeMessage(action,voucher,{window:target=globalThis.window,signal,onProgress=()=>{},timeoutMs,deadline}={}){
 return new Promise((resolve,reject)=>{
  const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16)),id='voucher-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');let timer;
  const cancel=()=>target.postMessage({channel:CHANNEL,direction:'request',action:'cancel',id},target.location.origin);
  const clear=()=>{clearTimeout(timer);target.removeEventListener('message',listener);signal?.removeEventListener('abort',abort);};
  const abort=()=>{cancel();clear();reject(error('Đã dừng tra Voucher.','cancelled'));};
  const timeout=()=>{if(action!=='ping')cancel();clear();reject(error(action==='ping'?'Cần cập nhật cầu nối Hub 1.6.14 để tự tìm Voucher.':'Hub chưa trả đủ thông tin Voucher; các ô đang nhập được giữ lại.',action==='ping'?'bridge':'timeout'));};
  const reset=ms=>{clearTimeout(timer);timer=setTimeout(timeout,Math.max(0,Math.min(timeoutMs??ms,Number.isFinite(deadline)?deadline-Date.now():Infinity)));};
  const listener=event=>{
   const packet=event.data;if(event.source!==target||event.origin!==target.location.origin||!packet||packet.channel!==CHANNEL||packet.direction!=='response'||packet.id!==id)return;
   if(packet.type==='progress'){onProgress(String(packet.message??'Đang đọc Voucher trên Hub…'));reset(packet.phase==='login'?10*60_000:120_000);return;}
   if(packet.type==='error'){clear();reject(error(String(packet.message??'Chưa đọc được Voucher Hub.'),packet.code??'bridge'));return;}
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
 const ready=await voucherBridgeMessage('ping',null,options);
 const parts=/^(\d+)\.(\d+)\.(\d+)$/.exec(String(ready.version??'')),version=parts?Number(parts[1])*1e6+Number(parts[2])*1e3+Number(parts[3]):0;
 if(!ready.capabilities?.includes('voucher')||version<1006014)throw error('Cần cầu nối 1.6.14 để đọc đúng đơn vị giảm và Center code. Cập nhật rồi tải lại Promotion và Hub.','bridge');
 const result=await voucherBridgeMessage('voucher',request,options),payload=voucherPayload(result.payload,request);
 if(!payload)throw error('Kết quả Hub không khớp Giftcode đầy đủ hoặc link chi tiết.','voucher_invalid');
 return payload;
}
