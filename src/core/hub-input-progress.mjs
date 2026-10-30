import {COURSE_FIELDS,missingContractInputs} from './hub-course.mjs';
const columns={H:'courseFee',I:'hoursPerWeek',J:'package',K:'giftcode',L:'discount'};
export const INPUT_READER_REVISION='contract-offers-v2';
export const inputRunRequiresRefresh=run=>!!run&&run.inputRevision!==INPUT_READER_REVISION;
export const inputKey=(ct,student)=>String(ct)+'|'+String(student);
export function inputTargets(rows,refresh=false){return rows.map(row=>{const required=[...new Set([...(refresh?['courseFee','hoursPerWeek','package']:[]),...missingContractInputs(row).map(k=>columns[k])])];return {ct:row.ct||row.cells.contractTotal,student:String(row.cells.F),required:required.length?required:['giftcode']};});}
export function validInputTargets(targets){return Array.isArray(targets)&&targets.length>0&&targets.length<=20000&&targets.every(t=>t&&/^[A-Z0-9]+-CT-\d{4,20}$/.test(t.ct)&&/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(t.student)&&Array.isArray(t.required)&&t.required.length>0&&t.required.length<=7&&t.required.every(k=>COURSE_FIELDS.includes(k)))&&new Set(targets.map(t=>inputKey(t.ct,t.student))).size===targets.length;}
export function newInputRun(old,targets,refresh,runId,reset=false){
 if(!validInputTargets(targets))throw Error('Danh sách CT / trường cần đọc không hợp lệ.');
 const reuse=old&&old.refresh===refresh&&!reset&&!inputRunRequiresRefresh(old);
 return {runId:reuse?old.runId:runId,inputRevision:INPUT_READER_REVISION,refresh,targets,completed:reuse?[...old.completed]:[]};
}
export function inputSourceMissing(source,target){return target.required.filter(k=>source?.ct!==target.ct||source?.student!==target.student||source[k]==null||String(source[k]).trim()===''||['courseFee','hoursPerWeek','package'].includes(k)&&String(source[k]).trim()==='0');}
export function completeInputRun(run,ct,student,source){
 const key=inputKey(ct,student),target=run.targets.find(t=>inputKey(t.ct,t.student)===key);if(!target)throw Error('CT không thuộc lượt đọc đang lưu.');
 const missing=inputSourceMissing(source,target);return {run:{...run,completed:missing.length?run.completed:[...new Set([...run.completed,key])]},complete:!missing.length,missing};
}
export function completedInputs(run,refresh){return run?.refresh===refresh&&!inputRunRequiresRefresh(run)?run.completed??[]:[];}
