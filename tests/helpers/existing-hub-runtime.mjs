import fs from 'node:fs';
import vm from 'node:vm';
export function backgroundRuntime({tabs=[{id:20,url:'https://hub24.apollo.vn:7777/home',windowId:1}],ready=true,accepted=true}={}){
 const mutations=[],messages=[],store={},listeners=[],updated=[],removed=[];
 const chrome={storage:{session:{get:async key=>({[key]:store[key]}),set:async value=>Object.assign(store,value),remove:async key=>delete store[key]}},tabs:{
  query:async()=>tabs,
  create:async options=>{mutations.push({type:'create',options});throw Error('No tabs allowed');},
  update:async(id,options)=>{mutations.push({type:'update',id,options});throw Error('No navigation allowed');},
  remove:async id=>{mutations.push({type:'remove',id});throw Error('No close allowed');},
  sendMessage:async(tab,m)=>{messages.push({tab,...m});return m.type==='hub-agent-ping'?(ready?{ready:true,version:'1.6.10',agentKey:'qa-agent'}:{}):m.type==='hub-agent-run'?{accepted}:{};},
  onRemoved:{addListener:fn=>removed.push(fn)},onUpdated:{addListener:fn=>updated.push(fn)}},runtime:{onMessage:{addListener:fn=>listeners.push(fn)}}};
 const context=vm.createContext({chrome,URL,Date,Promise,TextEncoder,TextDecoder,console,setTimeout,clearTimeout});
 context.importScripts=(...names)=>{for(const name of names)vm.runInContext(fs.readFileSync(new URL('../../reference/hub/'+name,import.meta.url),'utf8').replaceAll('https://promotion-installment.trangdao2802.chatgpt.site','https://promotion-hub-2026.roundskunk11.chatgpt.site'),context);};
 vm.runInContext(fs.readFileSync(new URL('../../reference/hub/background.js',import.meta.url),'utf8'),context);
 const send=(m,tab=10,url='https://promotion-hub-2026.roundskunk11.chatgpt.site/',extra={})=>new Promise(resolve=>listeners[0](m,{frameId:0,tab:{id:tab,windowId:1},documentId:'qa-doc',url,...extra},resolve));
 const flush=()=>vm.runInContext('serial',context);
 return {send,flush,mutations,messages,store,updated,removed,tabs};
}
