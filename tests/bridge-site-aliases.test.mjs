import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {execFileSync} from 'node:child_process';
const sites=['https://promotion-hub-2026.quanghuym24.chatgpt.site','https://promotion-hub-2026.roundskunk11.chatgpt.site','https://promotion-hub-2026.vercel.app'];
test('both verified Site aliases can connect, while replies and page events stay on their requesting origin',()=>{
 for(const origin of sites){
  const listeners=[],replies=[],context=vm.createContext({URL,console,location:{origin}});
  context.window={addEventListener:(type,fn)=>listeners.push(fn),postMessage:(packet,target)=>replies.push({packet,target})};context.window.top=context.window;
  context.chrome={runtime:{onMessage:{addListener:()=>{}}}};
  const core=fs.readFileSync(new URL('../reference/hub/core.js',import.meta.url),'utf8').replace('const SITES = [SITE];','const SITES = '+JSON.stringify(sites)+';');vm.runInContext(core,context);
  for(const host of sites)assert.equal(context.PromotionHub.source(host+'/'),true);
  for(const host of ['https://example.com','https://promotion-hub-2026.quanghuym24.chatgpt.site.evil.test','https://promotion-hub-2026.vercel.app.evil.test','http://promotion-hub-2026.vercel.app','http://promotion-hub-2026.quanghuym24.chatgpt.site'])assert.equal(context.PromotionHub.source(host),false);
  vm.runInContext(fs.readFileSync(new URL('../reference/hub/promotion.js',import.meta.url),'utf8'),context);
  const data={channel:'promotion-hub/v1',direction:'request',action:'ping',id:'qa-alias'};
  listeners[0]({source:context.window,origin,data});assert.equal(replies.length,1);assert.equal(replies[0].target,origin);assert.equal(replies[0].packet.type,'ready');
  listeners[0]({source:context.window,origin:sites.find(s=>s!==origin),data});assert.equal(replies.length,1);
 }
});

test('downloadable Chrome bridge allows the exact production Vercel origin and keeps unrelated websites blocked',()=>{
 const zipPath=new URL('../dist/downloads/promotion-hub-bridge.zip',import.meta.url).pathname;
 const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
 const script="import sys,json,zipfile; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({'manifest':json.loads(z.read('manifest.json')),'core':z.read('core.js').decode('utf-8')}))";
 const archive=JSON.parse(execFileSync(python,['-c',script,zipPath],{encoding:'utf8'}));
 const manifest=archive.manifest;
 const matches=manifest.content_scripts[0].matches;
 for(const origin of sites){
  assert.ok(matches.includes(origin+'/*'),origin+' missing content-script match');
  assert.ok(manifest.host_permissions.includes(origin+'/*'),origin+' missing host permission');
  assert.ok(archive.core.includes(origin),origin+' missing from background origin allowlist');
 }
 assert.ok(manifest.host_permissions.includes('https://hub24.apollo.vn/*'));
 assert.equal(manifest.version,'1.6.19');
 assert.ok(archive.core.includes("const VERSION = '1.6.19'"));
 assert.ok(!matches.includes('https://*.vercel.app/*'),'Do not allow unrelated Vercel tenants');
 assert.ok(!matches.includes('<all_urls>'));
});
