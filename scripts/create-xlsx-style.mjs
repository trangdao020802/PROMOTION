// Run with the Codex primary runtime from a temporary directory containing
// its node_modules symlink. The exported workbook supplies browser styles.
import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const outputDir=process.argv[2];
if(!outputDir?.startsWith('/'))throw Error('An absolute output directory is required.');
await fs.mkdir(outputDir,{recursive:true});
const workbook=Workbook.create(),sheet=workbook.worksheets.add('Table');
sheet.showGridLines=false;
sheet.getRange('A1:C3').values=[['Contract','Amount','Hours'],['QA2610-CT-000004',34830000,12.5],['QA2610-CT-000005',0,null]];
sheet.getRange('A1:C3').format={font:{name:'Arial',size:10,color:'#24352C'},numberFormat:'General',verticalAlignment:'center',columnWidth:25,rowHeight:24,wrapText:true};
sheet.getRange('A1:C1').format={fill:'#2C493C',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},numberFormat:'General',horizontalAlignment:'center',rowHeight:34};
sheet.getRange('A3:C3').format.fill='#F1F7F5';
sheet.freezePanes.freezeRows(1);
workbook.recalculate();
console.log((await workbook.inspect({kind:'region',sheetId:'Table',range:'A1:C3',maxChars:1800,tableMaxRows:3,tableMaxCols:3})).ndjson);
await (await SpreadsheetFile.exportXlsx(workbook)).save(outputDir+'/xlsx-style.xlsx');
const preview=await workbook.render({sheetName:'Table',range:'A1:C3',scale:1.5,format:'png'});
await fs.writeFile(outputDir+'/xlsx-style.png',new Uint8Array(await preview.arrayBuffer()));
