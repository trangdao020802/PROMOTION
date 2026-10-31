import {loadWorkbook} from './api.mjs';
import {AuditEngine} from './calculation.mjs';
import {rememberCalculation} from './contract-memory.mjs';
let engine,patches={};
const remember=rows=>Promise.all(rows.map(row=>rememberCalculation(engine.data,row,patches)));
self.onmessage=async({data})=>{try{
 if(data.type==='init'){engine=new AuditEngine(await loadWorkbook(data.datasetId));self.postMessage({type:'ready'});return}
 if(!engine)throw Error('Bộ tính chưa sẵn sàng.');
 if(data.type==='patches'){patches=data.patches;engine.setPatches(patches);return}
 if(data.type==='vouchers'){engine.setVouchers(data.vouchers);self.postMessage({type:'vouchers-ready',requestId:data.requestId});return}
 if(data.type==='course-sources'){engine.setCourseSources(data.sources);self.postMessage({type:'course-sources-ready',requestId:data.requestId});return}
 if(data.type==='course-source'){
  engine.updateCourseSource(data.source);engine.setVouchers(data.vouchers);
  const baseline=engine.calculate(data.record,{});engine.setPatches(patches);
  const row=engine.calculate(data.record,patches[data.record.id]||{}),relatedRows=engine.dependentIds(data.record.id).map(id=>engine.calculate({id},patches[id]||{}));
  await remember([row,...relatedRows]);
  self.postMessage({type:'course-sources-ready',requestId:data.requestId,baseline,row,relatedRows});return;
 }
 patches[data.record.id]=data.patch;const row=engine.calculate(data.record,data.patch);const relatedRows=engine.dependentIds(data.record.id).map(id=>engine.calculate({id},patches[id]||{}));await remember([row,...relatedRows]);self.postMessage({type:'result',requestId:data.requestId,row,relatedRows});
}catch(e){self.postMessage({type:'error',requestId:data.requestId,message:e.message})}};
