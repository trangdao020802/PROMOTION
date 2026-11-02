import {loadWorkbook} from './api.mjs';
import {AuditEngine} from './calculation.mjs';
import {rememberCalculation} from './contract-memory.mjs';
import {hubFundingSources} from '../core/hub-proven-funding.mjs';
import {childFactKey} from '../core/child-hub-evidence.mjs';
let engine,patches={};
const remember=rows=>Promise.all(rows.map(row=>rememberCalculation(engine.data,row,patches)));
self.onmessage=async({data})=>{try{
 if(data.type==='init'){engine=new AuditEngine(await loadWorkbook(data.datasetId));self.postMessage({type:'ready'});return}
 if(!engine)throw Error('Bộ tính chưa sẵn sàng.');
 if(data.type==='funding-refresh'){
  engine=new AuditEngine(await loadWorkbook(data.datasetId));engine.setPatches(patches);
  const rows=engine.data.contractGroups.map(g=>engine.calculate({id:g.id},patches[g.id]??{}));
  await remember(rows);self.postMessage({type:'funding-ready',requestId:data.requestId,rows});return;
 }
 if(data.type==='patches'){patches=data.patches;engine.setPatches(patches);return}
 if(data.type==='vouchers'){engine.setVouchers(data.vouchers);self.postMessage({type:'vouchers-ready',requestId:data.requestId});return}
 if(data.type==='course-sources'){engine.setCourseSources(data.sources);self.postMessage({type:'course-sources-ready',requestId:data.requestId});return}
 if(data.type==='course-source'){
  const source=data.source,context={datasetId:data.datasetId,masterCt:source.ct,ct:source.ct,student:source.student};
  const evidence={...context,url:source.url,hubContract:source.hubContract,id:childFactKey(context)};
  const needsFunding=!!source.hubContract&&!!engine.data.input&&hubFundingSources(engine.data.input,{datasetId:data.datasetId,facts:[evidence],links:[{ct:source.ct,url:source.url}]}).changed;
  if(needsFunding){engine=new AuditEngine(await loadWorkbook(data.datasetId));engine.setPatches(patches);}
  engine.updateCourseSource(data.source);engine.setVouchers(data.vouchers);
  const baseline=engine.calculate(data.record,{});engine.setPatches(patches);
  const row=engine.calculate(data.record,patches[data.record.id]||{}),relatedIds=needsFunding?engine.data.contractGroups.filter(g=>g.id!==data.record.id).map(g=>g.id):engine.dependentIds(data.record.id),relatedRows=relatedIds.map(id=>engine.calculate({id},patches[id]||{}));
  await remember([row,...relatedRows]);
  self.postMessage({type:'course-sources-ready',requestId:data.requestId,baseline,row,relatedRows});return;
 }
 patches[data.record.id]=data.patch;const row=engine.calculate(data.record,data.patch);const relatedRows=engine.dependentIds(data.record.id).map(id=>engine.calculate({id},patches[id]||{}));await remember([row,...relatedRows]);self.postMessage({type:'result',requestId:data.requestId,row,relatedRows});
}catch(e){self.postMessage({type:'error',requestId:data.requestId,message:e.message})}};
