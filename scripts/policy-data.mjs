import fs from 'node:fs';
export function policyData(){
 const read=name=>JSON.parse(fs.readFileSync(new URL('../reference/'+name,import.meta.url),'utf8'));
 const base=read('rules-source.json'),policyRegister=read('policy-register.json');
 const programs=[...new Map([...base.programs,...policyRegister.programs].map(p=>[p.id,p])).values()];
 const supplement=read('policy-supplement.json');
 return {...base,programs,priceEvidence:read('price-evidence.json'),policyRegister,typedPrices:supplement.rows,policySupplement:supplement};
}
