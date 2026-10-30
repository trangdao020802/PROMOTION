import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const sites=['https://promotion-hub-2026.quanghuym24.chatgpt.site','https://promotion-hub-2026.roundskunk11.chatgpt.site'];
test('both verified Site aliases can connect, while replies and page events stay on their requesting origin',()=>{
 for(const origin of sites){
  const listeners=[],replies=[],context=vm.createContext({URL,console,location:{origin}});
  context.window={addEventListener:(type,fn)=>listeners.push(fn),postMessage:(packet,target)=>replies.push({packet,target})};context.window.top=context.window;
  context.chrome={runtime:{onMessage:{addListener:()=>{}}}};
  const core=fs.readFileSync(new URL('../reference/hub/core.js',import.meta.url),'utf8').replace('const SITES = [SITE];','const SITES = '+JSON.stringify(sites)+';');vm.runInContext(core,context);
  for(const host of sites)assert.equal(context.PromotionHub.source(host+'/'),true);
  for(const host of ['https://example.com','https://promotion-hub-2026.quanghuym24.chatgpt.site.evil.test','http://promotion-hub-2026.quanghuym24.chatgpt.site'])assert.equal(context.PromotionHub.source(host),false);
  vm.runInContext(fs.readFileSync(new URL('../reference/hub/promotion.js',import.meta.url),'utf8'),context);
  const data={channel:'promotion-hub/v1',direction:'request',action:'ping',id:'qa-alias'};
  listeners[0]({source:context.window,origin,data});assert.equal(replies.length,1);assert.equal(replies[0].target,origin);assert.equal(replies[0].packet.type,'ready');
  listeners[0]({source:context.window,origin:sites.find(s=>s!==origin),data});assert.equal(replies.length,1);
 }
});
