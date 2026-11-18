import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {policyData} from '../scripts/policy-data.mjs';
import {priceFor} from '../src/core/price-resolver.mjs';
import {buildPriceCatalogue,policyRuleCatalogue} from '../src/core/price-catalog.mjs';
import {dateSerial} from '../src/core/verification.mjs';

const snapshot=JSON.parse(fs.readFileSync(new URL('../reference/policy-snapshots/tuition-2026-11.json',import.meta.url),'utf8'));
const policy=policyData();

test('November Contract prices agree with all 84 workbook cases and cached net amounts',()=>{
 let checked=0;
 for(const [index,sheet] of snapshot.sheets.entries()){
  const values=Object.fromEntries(sheet.rows.flatMap(row=>row.c.map(cell=>[cell.a,cell.v])));
  assert.match(values.B3,/11\/2026/);
  assert.match(values.K3,/11\/2026/);
  const current=index%2===1,layer=Math.floor(index/2)+1;
  const monthlyRow=current?8:9,rateRow=current?9:10;
  for(const [hours,columns] of [[3,['C','D','E','F','G']],[4,['L','M','N','O','P']]]){
   for(const [packageIndex,months] of [36,24,18,12,9,6,3].entries()){
    const column=columns[Math.min(packageIndex,4)];
    const monthly=values[column+monthlyRow],gross=monthly*months;
    const discount=Math.round(gross*values[column+rateRow]);
    const term=values[column+'13'];
    const result=priceFor({policy},{H:`ATLS - New Price 2026 - Layer ${layer}`,I:hours+' hrs/week',J:months+' months',D:dateSerial('2026-11-18'),L:'0'},{group:'ATLS',contractType:current?'Renew':'New'});
    const label=sheet.name+' · '+hours+' hours · '+months+' months';
    assert.equal(result.issue,null,label);
    assert.deepEqual([result.monthly,result.gross,result.discount,result.net,result.maxTerms,result.straight],
     [monthly,gross,discount,gross-discount,typeof term==='number'?term:0,months>=12?1:0],label);
    if(months>=12)assert.equal(result.net,values[column+'12'],label+' cached net');
    if(current)assert.equal(result.loyalty,values[column+'11'],label+' loyalty');
    assert.ok(result.refs.some(ref=>ref.file===snapshot.source.file&&ref.sheet===sheet.name),label+' source');
    checked++;
   }
  }
 }
 assert.equal(checked,84);
 assert.equal(snapshot.checkedCases,checked);
});

test('November evidence is available in the price table, RULE and source manifest',()=>{
 const source=policy.priceEvidence.sources.find(item=>item.file===snapshot.source.file);
 assert.deepEqual(source,snapshot.source);
 assert.match(source.sha256,/^[a-f0-9]{64}$/);
 assert.deepEqual([source.from,source.to],['2026-11-01','2026-11-30']);
 const catalogue=buildPriceCatalogue(policy);
 const rows=catalogue.filter(row=>row.regime==='q4'&&row.refs.some(ref=>ref.file===source.file));
 assert.equal(rows.length,42);
 assert.equal(new Set(rows.map(row=>row.pricingKey)).size,42);
 for(const row of rows){
  const refs=row.refs.filter(ref=>ref.file===source.file);
  assert.equal(refs.length,2);
  assert.ok(refs.every(ref=>ref.from===source.from&&ref.to===source.to));
 }
 assert.equal(policyRuleCatalogue(policy,catalogue).filter(row=>row.regime==='q4'&&row.refs.some(ref=>ref.file===source.file)).length,42);
 const program=policy.programs.find(item=>item.id==='tuition-2026-11');
 assert.equal(program.title,'Học phí tháng 11/2026');
 assert.equal(program.refs.length,6);
 assert.deepEqual([program.from,program.to],[source.from,source.to]);
});
