import {COURSE_FIELDS,missingContractInputs} from './hub-course.mjs';
import {validateHubPolicy} from './hub-policy.mjs';
import {validateHubContract} from './hub-contract.mjs';
import {resolveTransferCourseInfo,courseSourceCandidate} from './course-info.mjs';
const columns={H:'courseFee',I:'hoursPerWeek',J:'package',K:'giftcode',L:'discount'};
export const INPUT_READER_REVISION='transfer-course-v3';
export const inputRunRequiresRefresh=run=>!!run&&run.inputRevision!==INPUT_READER_REVISION;
export const inputKey=(ct,student)=>String(ct)+'|'+String(student);
export function inputTargets(rows,refresh=false,{policy=false,facts=false}={}){return rows.map(row=>{const required=[...new Set([...(refresh?['courseFee','hoursPerWeek','package','giftcode','discount']:[]),...missingContractInputs(row).map(k=>columns[k]),'giftcode','discount'])];return {ct:row.ct||row.cells.contractTotal,student:String(row.cells.F),required,...(policy?{policy:true}:{}),...(facts?{facts:true}:{})};});}
export function validInputTargets(targets){return Array.isArray(targets)&&targets.length>0&&targets.length<=20000&&targets.every(t=>t&&(t.policy===undefined||typeof t.policy==='boolean')&&(t.facts===undefined||typeof t.facts==='boolean')&&/^[A-Z0-9]+-CT-\d{4,20}$/.test(t.ct)&&/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(t.student)&&Array.isArray(t.required)&&t.required.length>0&&t.required.length<=7&&t.required.every(k=>COURSE_FIELDS.includes(k)))&&new Set(targets.map(t=>inputKey(t.ct,t.student))).size===targets.length;}
export function newInputRun(old,targets,refresh,runId,reset=false){
 if(!validInputTargets(targets))throw Error('Danh sách CT / trường cần đọc không hợp lệ.');
 const reuse=old&&old.refresh===refresh&&!reset&&!inputRunRequiresRefresh(old);
 return {runId:reuse?old.runId:runId,inputRevision:INPUT_READER_REVISION,refresh,targets,completed:reuse?[...old.completed]:[]};
}
export function inputSourceMissing(source,target){
 const inherited=source?.inheritedCourses??[],resolved=source?resolveTransferCourseInfo([courseSourceCandidate(source)],inherited.map(courseSourceCandidate)):null,col=Object.fromEntries(Object.entries(columns).map(([a,b])=>[b,a]));
 return [...target.required.filter(k=>{const c=col[k],value=c?resolved?.values[c]:source?.[k],fromSource=c&&resolved?.inheritedFields[c]?.length;return source?.ct!==target.ct||source?.student!==target.student||fromSource&&(source.inheritedReadComplete===false||resolved.warnings.length)||['giftcode','discount'].includes(k)&&source?.lastReadMissing?.includes(k)&&!fromSource||value==null||String(value).trim()===''||['courseFee','hoursPerWeek','package'].includes(k)&&String(value).trim()==='0';}),...(target.policy&&(!validateHubPolicy(source?.hubPolicy)||source.hubPolicy.ct!==target.ct)?['hubPolicy']:[]),...(target.facts&&(!validateHubContract(source?.hubContract)||source.hubContract.ct!==target.ct)?['hubContract']:[]),...(target.facts&&validateHubContract(source?.hubContract)&&source.hubContract.payments.state!=='read'?['payments']:[])];
}
export function completeInputRun(run,ct,student,source){
 const key=inputKey(ct,student),target=run.targets.find(t=>inputKey(t.ct,t.student)===key);if(!target)throw Error('CT không thuộc lượt đọc đang lưu.');
 const missing=inputSourceMissing(source,target);return {run:{...run,completed:missing.length?run.completed:[...new Set([...run.completed,key])]},complete:!missing.length,missing};
}
export function completedInputs(run,refresh){return run?.refresh===refresh&&!inputRunRequiresRefresh(run)?run.completed??[]:[];}
