import fs from 'node:fs';
export function policyData(){return JSON.parse(fs.readFileSync(new URL('../reference/rules-source.json',import.meta.url),'utf8'));}
