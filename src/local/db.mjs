const NAME='promotion-installment-local-v2';
const STORES=['datasets','files','edits','vouchers','links','evidence','settings','courseSources'];
let pending;
export function database(){
 if(!pending)pending=new Promise((resolve,reject)=>{
  const r=indexedDB.open(NAME,1);
  r.onupgradeneeded=()=>{for(const s of STORES)if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s,{keyPath:'id'})};
  r.onerror=()=>{pending=null;reject(r.error)};
  r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)};
 });
 return pending;
}
export async function get(store,id){const d=await database();return new Promise((resolve,reject)=>{const r=d.transaction(store,'readonly').objectStore(store).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function all(store){const d=await database();return new Promise((resolve,reject)=>{const r=d.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function put(store,value){const d=await database();return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Chưa lưu được dữ liệu.'))})}
export async function versioned(store,id,version,create){
 const d=await database();return new Promise((resolve,reject)=>{
  const tx=d.transaction(store,'readwrite'),s=tx.objectStore(store);let result,error;
  const r=s.get(id);r.onsuccess=()=>{try{const old=r.result;if((old?.version||0)!==version){error=Object.assign(Error('Dữ liệu đã được thay đổi ở tab khác. Tải lại để tránh ghi đè.'),{conflict:true});tx.abort();return}result={...create(old),id,version:version+1,updatedAt:new Date().toISOString()};s.put(result)}catch(e){error=e;tx.abort()}};
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(error||tx.error);tx.onabort=()=>reject(error||tx.error||Error('Chưa lưu được dữ liệu.'));
 });
}
export async function backup(){const pairs=await Promise.all(STORES.map(async s=>[s,await all(s)]));return Object.fromEntries(pairs)}

// Pointer + immutable version are committed together; an interrupted save
// cannot leave a half-applied price book. The lease also covers other tabs.
export async function activatePolicy(pack,version,{restore=false}={}){
 const d=await database();return new Promise((resolve,reject)=>{
  const tx=d.transaction('settings','readwrite'),s=tx.objectStore('settings');let result,error;
  const request=s.get('policy-active');request.onsuccess=()=>{
   if((request.result?.version??0)!==version){error=Object.assign(Error('Chính sách đã đổi ở tab khác. Xem trước lại để tránh ghi đè.'),{conflict:true});tx.abort();return;}
   if(!restore)s.put(pack);
   result={id:'policy-active',packId:pack?.id??null,version:version+1,updatedAt:new Date().toISOString()};s.put(result);
  };
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(error||tx.error);tx.onabort=()=>reject(error||tx.error||Error('Chưa áp dụng được chính sách.'));
 });
}
