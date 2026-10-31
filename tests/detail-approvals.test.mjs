import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {build} from 'esbuild';
const bundled=build({entryPoints:['src/local/DetailApprovals.tsx'],bundle:true,write:false,format:'cjs',platform:'node',jsx:'transform',plugins:[{name:'qa-react',setup(b){b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export const useState=v=>[v,()=>{}];export default {createElement:(type,props,...children)=>({type,props:{...props,children},children})};',loader:'js'}));}}]});
function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);if(typeof node.type==='function')return nodes(node.type(node.props));return [node,...(node.children??[]).flatMap(nodes)];}
const row={kind:'contract',cells:{F:'QA-STUDENT',G:'HỌC VIÊN GIẢ',K:'QA-VOUCHER',AG:'',AE:'CHECK - VƯỢT KỲ'},reviews:{},reviewItems:[{id:'ceo',label:'CEO / RCM',description:'Đúng học viên, EPP và ngày full',scope:'qa-ceo',approved:false},{id:'registration',label:'Ghi danh trong ngày',description:'Đối chiếu ngày',scope:'qa-registration',approved:false},{id:'policy-1234',label:'Điều kiện riêng',description:'Căn cứ riêng',scope:'qa-policy',approved:false}]};
const voucher={code:'QA-VOUCHER',studentId:'QA-STUDENT',studentName:'HỌC VIÊN GIẢ',center:'HN1',startDate:'2026-10-01',endDate:'2026-10-31',type:'amount',amount:1000000,status:'PENDING',approvalNote:'QA đã đối chiếu',version:4};
test('all dynamic condition checkboxes in detail use the same scoped reviews as the reconciliation table',async()=>{
 const code=await bundled;const module={exports:{}};vm.runInNewContext(code.outputFiles[0].text,{module,exports:module.exports,console});const calls=[];
 const list=nodes(module.exports.default({row,onEdit:(...v)=>calls.push(v),voucher,onVoucherSave:async()=>{}})),inputs=list.filter(n=>n.type==='input');assert.equal(inputs.length,5);
 for(const item of row.reviewItems){const input=inputs.find(n=>n.props['aria-label']==='Duyệt '+item.label+' – '+row.cells.G);assert.ok(input);input.props.onChange({target:{checked:true}});const [key,reviews]=calls.at(-1);assert.equal(key,'reviews');assert.equal(reviews[item.id].approved,true);assert.equal(reviews[item.id].scope,item.scope);}
 inputs.find(n=>n.props['aria-label'].startsWith('Duyệt vượt kỳ')).props.onChange({target:{checked:true}});assert.deepEqual(calls.at(-1),['approved',true]);
});
test('detail Voucher approval requires complete matching metadata and saves the current version',async()=>{
 const code=await bundled;const module={exports:{}};vm.runInNewContext(code.outputFiles[0].text,{module,exports:module.exports,console});let saved;
 const props={row,onEdit:()=>{},voucher,onVoucherSave:async(...args)=>{saved=args;}};
 let list=nodes(module.exports.default(props));let input=list.find(n=>n.type==='input'&&n.props['aria-label'].startsWith('Duyệt voucher'));assert.equal(!!input.props.disabled,false);input.props.onChange({target:{checked:true}});await Promise.resolve();assert.equal(saved[0].status,'APPROVED');assert.equal(saved[1],4);
 for(const patch of [{endDate:''},{type:''}]){list=nodes(module.exports.default({...props,voucher:{...voucher,...patch}}));input=list.find(n=>n.type==='input'&&n.props['aria-label'].startsWith('Duyệt voucher'));assert.equal(input.props.disabled,true);}
 list=nodes(module.exports.default({...props,row:{...row,cells:{...row.cells,AG:'APPROVED'}},voucher:{...voucher,status:'APPROVED'}}));input=list.find(n=>n.type==='input'&&n.props['aria-label'].startsWith('Duyệt voucher'));assert.equal(input.props.checked,true);input.props.onChange({target:{checked:false}});await Promise.resolve();assert.equal(saved[0].status,'PENDING');
});
test('detail shows one checkbox per condition and names its Contract/student; irrelevant installment approval is absent',async()=>{
 const module={exports:{}};vm.runInNewContext((await bundled).outputFiles[0].text,{module,exports:module.exports,console});
 const current={...row,ct:'QA2610-CT-000722',cells:{...row.cells,AG:'',AE:'OK',K:'0'},reviewItems:[row.reviewItems[0],row.reviewItems[0]]};
 const list=nodes(module.exports.default({row:current,onEdit:()=>{}}));assert.equal(list.filter(n=>n.type==='input').length,1);
 const text=JSON.stringify(list);assert.ok(text.includes('QA2610-CT-000722'));assert.ok(text.includes('QA-STUDENT'));assert.ok(text.includes('Đúng học viên, EPP và ngày full'));
});
