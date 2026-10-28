import fs from 'node:fs/promises';
import {build} from 'esbuild';
import {policyData} from './policy-data.mjs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const basePath=process.env.BASE_PATH||'/';
if(!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(basePath)||basePath.split('/').some(s=>s==='.'||s==='..'))throw Error('BASE_PATH must start/end with /, for example /PROMOTION/.');
const define={__APP_BASE_PATH__:JSON.stringify(basePath)};
await fs.mkdir('dist',{recursive:true});
for(const name of await fs.readdir('dist'))await fs.rm('dist/'+name,{recursive:true,force:true});
await fs.mkdir('dist/assets',{recursive:true});
await fs.mkdir('dist/downloads',{recursive:true});
await build({entryPoints:['src/core/hub-voucher.mjs'],bundle:true,format:'iife',globalName:'PromotionHubVoucher',target:'es2022',outfile:'reference/hub/voucher-core.js'});
await build({entryPoints:['src/core/hub-course.mjs'],bundle:true,format:'iife',globalName:'PromotionHubCourse',target:'es2022',outfile:'reference/hub/course-core.js'});
await build({entryPoints:['src/core/hub-course-network.mjs'],bundle:true,format:'iife',globalName:'PromotionHubCourseNetwork',target:'es2022',outfile:'reference/hub/course-network-core.js'});
await fs.writeFile('dist/rules.json',JSON.stringify(policyData()));
const contentHash=createHash('sha256');
async function hashSource(directory){
 for(const entry of (await fs.readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  const path=directory+'/'+entry.name;
  if(entry.isDirectory())await hashSource(path);
  else contentHash.update(path).update(await fs.readFile(path));
 }
}
await hashSource('src');
const version=contentHash.update(basePath).update(await fs.readFile('dist/rules.json')).digest('hex').slice(0,12);
await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'esm',target:'es2022',define,outfile:'dist/assets/app-'+version+'.js',jsx:'automatic',plugins:[{name:'version-worker-urls',setup(b){b.onLoad({filter:/supplied\/dashboard\.js$/},async a=>({contents:(await fs.readFile(a.path,'utf8')).replace('/calculator.worker.mjs',basePath+'calculator.worker.mjs?v='+version).replace('/source-parser.worker.mjs',basePath+'source-parser.worker.mjs?v='+version).replaceAll('/downloads/promotion-hub-bridge.zip',basePath+'downloads/promotion-hub-bridge.zip').replace('href: `/`','href: `'+basePath+'`'),loader:'js'}))}}]});
await build({entryPoints:['src/local/calculator.worker.mjs'],bundle:true,minify:true,format:'esm',target:'es2022',define,outfile:'dist/calculator.worker.mjs'});
await fs.copyFile('src/supplied/source-parser.worker.mjs','dist/source-parser.worker.mjs');
await fs.copyFile('src/supplied/style.css','dist/assets/original-style.css');
await fs.copyFile('src/repair.css','dist/assets/app.css');
await fs.writeFile('dist/index.html',(await fs.readFile('src/index.html','utf8')).replace('/assets/app.js','/assets/app-'+version+'.js').replace('/assets/original-style.css','/assets/original-style.css?v='+version).replace('/assets/app.css','/assets/app.css?v='+version).replace(/((?:href|src)=")\//g,'$1'+basePath));
await fs.writeFile('dist/.nojekyll','');
execFileSync(process.env.PYTHON||(process.platform==='win32'?'python':'python3'),['scripts/build-extension.py'],{stdio:'inherit',env:{...process.env,BASE_PATH:basePath,SITE_ORIGIN:process.env.SITE_ORIGIN||process.env.CF_PAGES_URL||process.env.URL||'https://promotion-hub-2026.roundskunk11.chatgpt.site'}});
console.log('Built source-driven contract audit; transaction files remain browser-local.');
