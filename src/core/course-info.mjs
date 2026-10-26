// Course evidence is independent of receipts. Never infer hours from cash or
// total hours, nor copy the package of a retired/intermediate CT.
const columns={H:'courseFee',I:'hoursPerWeek',J:'package',K:'giftcode',L:'discount'};
const text=v=>String(v??'').trim();
const present=v=>v!==null&&v!==undefined&&!['','0','-','—','N/A'].includes(text(v).toUpperCase());
const NO_CT='Chưa có dòng hóa đơn CT trong RAW_REPORT';
export function resolveCourseInfo(candidates){
 const values={},fields={},warnings=[];
 for(const col of Object.keys(columns)){
  const available=candidates.filter(r=>present(r[col]));
  const rows=available.some(r=>!r.fallback)?available.filter(r=>!r.fallback):available,distinct=[...new Set(rows.map(r=>text(r[col])))];
  values[col]=distinct.length===1?distinct[0]:null;
  fields[col]=rows.map(r=>({value:text(r[col]),ref:r.ref}));
  if(distinct.length>1)warnings.push(`${col}: thông tin khóa học/ưu đãi khác nhau trong cùng CT; cần đối chiếu nguồn tại dòng tổng`);
 }
 return {values,fields,warnings,complete:['H','I','J'].every(k=>present(values[k]))};
}
export function applyCourseInfo(book,group,hubSources=[]){
 if(!group.ct)return;
 const exact=(book.extensions.courseEvidence??[]).filter(e=>e.ct===group.ct&&e.student===String(group.cells.F));
 const candidates=[...(group.courseCandidates??[]),...exact.map(e=>({...Object.fromEntries(Object.entries(columns).map(([col,key])=>[col,e[key]??null])),ref:e.ref})),
  ...hubSources.filter(e=>e.ct===group.ct&&e.student===String(group.cells.F)).map(e=>({H:e.courseFee,I:e.hoursPerWeek,J:e.package,ref:{file:'Hub · '+e.ct,sheet:'Course info',url:e.url}}))];
 const course=resolveCourseInfo(candidates);
 Object.assign(group.cells,course.values);group.courseInfo=course;
 group.warnings=group.warnings.filter(w=>!w.startsWith(NO_CT)&&!Object.keys(columns).some(k=>w.startsWith(k+':')));
 group.warnings.push(...course.warnings);
 if(group.noCTInvoice&&!course.complete)group.warnings.push(NO_CT+'; bổ sung các trường khóa học còn thiếu từ CT nhận / Export');
 if(exact.length===1){const e=exact[0];if(e.center)group.cells.B=e.center;if(e.centerName)group.cells.A=e.centerName;if(e.contractType)group.raw.G=e.contractType;}
}
export function withCourseSources(book,sources){
 // Callers load their own freshly built workbook. Original source grids and
 // stored manual patches remain untouched; sources are scoped before this call.
 for(const group of book.contractGroups)applyCourseInfo(book,group,sources);
 return book;
}
