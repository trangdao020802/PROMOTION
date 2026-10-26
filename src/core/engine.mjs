import {financialResult} from './reconcile.mjs';
import {promotionResult,regularTwoMonthPrice,discountPolicyMatch,discountPolicyCheck} from './promotions.mjs';
import {voucherCode,customVoucherIssue} from './vouchers.mjs';
// A small, deterministic interpreter for the functions present in the supplied
// workbook. Formula text is parsed into an AST, never executed as JavaScript.
export class FormulaError extends Error {}
const err = (s) => { throw new FormulaError(s); };
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
export const columnName = n => { let s=''; for (;n;n=Math.floor((n-1)/26)) s=String.fromCharCode(65+(n-1)%26)+s; return s; };
const columnNumber = s => [...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
const refParts = s => { const m=/^(\$?)([A-Z]{1,3})(\$?)(\d+)$/.exec(s); if(!m) err('Invalid reference '+s); return {col:columnNumber(m[2]),row:+m[4],fixedRow:!!m[3]}; };
const str = v => v==null?'':typeof v==='boolean'?(v?'TRUE':'FALSE'):String(v);
const num = v => { if(v==null||v===''||v===false)return 0; if(v===true)return 1; const n=Number(v); return Number.isFinite(n)?n:err('#VALUE! '+str(v)); };
const logical = v => typeof v==='string' ? (v===''?false:/^true$/i.test(v)?true:/^false$/i.test(v)?false:err('#VALUE! logical')) : !!v;
const excelRound = (v,p=0) => { const t=10**num(p); const n=num(v)*t; return Math.sign(n)*Math.round(Math.abs(n)+Number.EPSILON)/t; };
const excelEpoch=Date.UTC(1899,11,30);
const equal=(a,b)=> a==null?(b==null||b===''||b===0):b==null?equal(b,a):typeof a===typeof b?(typeof a==='string'?a.toUpperCase()===b.toUpperCase():a===b):false;
const compare=(a,b)=> {if(equal(a,b))return 0;if(a==null)a=typeof b==='string'?'':0;if(b==null)b=typeof a==='string'?'':0;if(typeof a!==typeof b){const rank=x=>typeof x==='number'?0:typeof x==='string'?1:2;return rank(a)-rank(b);}return typeof a==='string'?(a.toUpperCase()<b.toUpperCase()?-1:1):(a<b?-1:1);};

function tokenize(s){
  const re=/\s*("(?:[^"]|"")*"|'(?:[^']|'')*'|(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?|\$?[A-Za-z_][A-Za-z_0-9.$]*|<>|<=|>=|[()+\-*/^&=<>%,!:])/gy;
  const out=[];let i=0;
  while(i<s.length){re.lastIndex=i;const m=re.exec(s);if(!m){if(!s.slice(i).trim())break;err('Unexpected formula token at '+s.slice(i,i+40));}out.push(m[1]);i=re.lastIndex;}
  return out;
}
export function parseFormula(s){
  const ts=tokenize(s.replace(/^=/,'')); let i=0;
  const peek=()=>ts[i], take=()=>ts[i++], expect=t=>{if(take()!==t)err('Expected '+t+' in formula');};
  const cell=(token,sheet)=>{refParts(token);return {t:'cell',ref:token,sheet};};
  const atom=()=>{
    const t=take(); if(t===undefined)err('Incomplete formula'); let a;
    if(t==='('){a=expr(0);expect(')');}
    else if(t==='+'||t==='-')a={t:'unary',op:t,a:expr(5)};
    else if(t.startsWith('"'))a={t:'lit',v:t.slice(1,-1).replace(/""/g,'"')};
    else if(/^\d|^\.\d/.test(t))a={t:'lit',v:+t};
    else if(peek()==='('){take();const args=[];if(peek()!==')'){do{if(peek()===',')args.push({t:'lit',v:null});else args.push(expr(0));if(peek()!==',')break;take();}while(true);}expect(')');a={t:'call',name:t.toUpperCase().replace(/^_XLFN\./,''),args};}
    else if(peek()==='!'){take();a=cell(take(),t.replace(/^'|'$/g,'').replace(/''/g,"'"));}
    else if(/^\$?[A-Z]{1,3}\$?\d+$/.test(t))a=cell(t);
    else if(t==='TRUE'||t==='FALSE')a={t:'lit',v:t==='TRUE'};
    else a={t:'name',name:t};
    if(peek()===':'){take();const end=take();if(a.t!=='cell')err('Unsupported range');a={t:'range',start:a,end:cell(end,a.sheet)};}
    while(peek()==='%'){take();a={t:'percent',a};}
    return a;
  };
  const precedence={'=':1,'<>':1,'<':1,'>':1,'<=':1,'>=':1,'&':2,'+':3,'-':3,'*':4,'/':4,'^':5};
  const expr=min=>{let a=atom();while(own(precedence,peek())&&precedence[peek()]>=min){const op=take();a={t:'op',op,a,b:expr(precedence[op]+(op==='^'?0:1))};}return a;};
  const ast=expr(0);if(i!==ts.length)err('Unconsumed formula: '+ts.slice(i).join(' '));return ast;
}

class Range {
  constructor(engine,sheet,c1,r1,c2,r2){Object.assign(this,{engine,sheet,c1,r1,c2,r2});}
  get length(){return (this.c2-this.c1+1)*(this.r2-this.r1+1);}
  at(i){const width=this.c2-this.c1+1;return this.engine.get(this.sheet,columnName(this.c1+i%width),this.r1+Math.floor(i/width));}
  values(){return Array.from({length:this.length},(_,i)=>this.at(i));}
}
const flat=v=>v instanceof Range?v.values():Array.isArray(v)?v:[v];
const scalar=v=>v instanceof Range?v.at(0):v;
function wildcard(pattern){
  let re='';for(let i=0;i<pattern.length;i++){let c=pattern[i];if(c==='~'&&i+1<pattern.length)c=pattern[++i];else if(c==='*'){re+='.*';continue;}else if(c==='?'){re+='.';continue;}re+=c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  return new RegExp('^'+re+'$','iu');
}
function criterion(c){
  const m=/^(<>|<=|>=|=|<|>)(.*)$/s.exec(str(c));const op=m?.[1]??'=';let rhs=m?m[2]:c;
  if(typeof rhs==='string'&&rhs.trim()!==''&&Number.isFinite(Number(rhs)))rhs=Number(rhs);
  const rx=typeof rhs==='string'&&/[?*~]/.test(rhs)?wildcard(rhs):null;
  return v=>{if(op==='='||op==='<>'){const match=rx?rx.test(str(v)):rhs===''?(v==null||v===''):typeof rhs==='number'?(typeof v==='number'?v===rhs:typeof v==='string'&&v.trim()!==''?Number(v)===rhs:false):equal(v,rhs);return op==='='?match:!match;}
    const cmp=typeof rhs==='number'?(typeof v==='number'?v-rhs:v==null?0-rhs:NaN):compare(v,rhs);
    return op==='<'?cmp<0:op==='>'?cmp>0:op==='<='?cmp<=0:cmp>=0;
  };
}

export class WorkbookEngine {
  constructor(data){this.data=data;this.asts=new Map();this.cache=new Map();this.ranges=new Map();this.busy=new Set();this.overrides=new Map();}
  reset(){this.cache.clear();this.busy.clear();this.overrides.clear();}
  get(sheet,col,row){
    const key=sheet+'!'+col+row;if(this.overrides.has(key))return this.overrides.get(key);if(this.cache.has(key))return this.cache.get(key);
    if(sheet==='CHECK_INSTALLMENT'&&col==='N'&&this.blockUnsupportedDiscount)return '';
    if(sheet==='CHECK_INSTALLMENT'&&col==='P'&&this.account)return this.account.ct&&this.account.warnings.length===0&&this.account.otherPayments!==null?this.account.otherPayments:'';
    const grid=this.data.grids[sheet];if(!grid)err('Missing sheet '+sheet);
    const tid=this.data.formulas[sheet]?.[col+row];
    // Original identifiers and source inputs are immutable. Only the five
    // requested editable fields and approval are overlaid on these cells.
    if(tid==null||(sheet==='CHECK_INSTALLMENT'&&(columnNumber(col)<=12||col==='AH'||col==='AG')))return grid[col+row]??null;
    if(this.busy.has(key))err('Circular formula '+key);this.busy.add(key);
    try {
      let ast=this.asts.get(tid);if(!ast){ast=parseFormula(this.data.templates[tid]);this.asts.set(tid,ast);}
      let value=this.eval(ast,sheet,row-5,row);
      if(sheet==='CHECK_INSTALLMENT'&&col==='AE'&&value==='CHECK - VƯỢT KỲ'&&this.approved)value='OK';
      this.cache.set(key,value);return value;
    } finally {this.busy.delete(key);}
  }
  range(sheet,c1,r1,c2,r2){const key=[sheet,c1,r1,c2,r2].join(':');if(!this.ranges.has(key))this.ranges.set(key,new Range(this,sheet,c1,r1,c2,r2));return this.ranges.get(key);}
  eval(a,sheet,delta,row){
    const ev=x=>this.eval(x,sheet,delta,row);
    switch(a.t){
      case 'lit':return a.v;
      case 'name':if(this.data.names[a.name])return ev(parseFormula(this.data.names[a.name]));return err('Unknown name '+a.name);
      case 'cell':{const p=refParts(a.ref);return this.get(a.sheet??sheet,columnName(p.col),p.row+(p.fixedRow?0:delta));}
      case 'range':{const p=refParts(a.start.ref),q=refParts(a.end.ref);return this.range(a.start.sheet??sheet,p.col,p.row+(p.fixedRow?0:delta),q.col,q.row+(q.fixedRow?0:delta));}
      case 'percent':return num(ev(a.a))/100;
      case 'unary':return (a.op==='-'?-1:1)*num(ev(a.a));
      case 'op':{const x=scalar(ev(a.a)),y=scalar(ev(a.b));switch(a.op){case '&':return str(x)+str(y);case '+':return num(x)+num(y);case '-':return num(x)-num(y);case '*':return num(x)*num(y);case '/':return num(y)===0?err('#DIV/0!'):num(x)/num(y);case '^':return num(x)**num(y);case '=':return equal(x,y);case '<>':return !equal(x,y);case '<':return compare(x,y)<0;case '>':return compare(x,y)>0;case '<=':return compare(x,y)<=0;case '>=':return compare(x,y)>=0;}break;}
      case 'call':{
        const name=a.name,args=a.args;
        if(name==='IF')return logical(scalar(ev(args[0])))?ev(args[1]):args[2]?ev(args[2]):false;
        if(name==='IFERROR'){try{return ev(args[0]);}catch(e){if(e instanceof FormulaError)return ev(args[1]);throw e;}}
        if(name==='ISNUMBER'){try{return typeof scalar(ev(args[0]))==='number';}catch(e){if(e instanceof FormulaError)return false;throw e;}}
        if(name==='AND'||name==='OR'){let yes=name==='AND';for(const arg of args){for(const v of flat(ev(arg))){const t=logical(v);yes=name==='AND'?yes&&t:yes||t;}}return yes;}
        if(name==='INDIRECT'){const val=str(ev(args[0]));const source=this.data.names[val]??val;return ev(parseFormula(source));}
        const v=args.map(ev), x=scalar(v[0]);
        if(name==='NOT')return !logical(x);
        if(name==='TRUE')return true;if(name==='FALSE')return false;
        if(name==='N')return typeof x==='number'?x:x===true?1:0;
        if(name==='VALUE')return num(x);
        if(name==='UPPER')return str(x).toUpperCase();
        if(name==='TRIM')return str(x).trim().replace(/ +/g,' ');
        if(name==='LEN')return str(x).length;
        if(name==='LEFT')return str(x).slice(0,v.length>1?Math.max(0,num(v[1])):1);
        if(name==='RIGHT'){const n=v.length>1?Math.max(0,num(v[1])):1;return n?str(x).slice(-n):'';}
        if(name==='MID')return str(x).slice(num(v[1])-1,num(v[1])-1+num(v[2]));
        if(name==='REPT')return str(x).repeat(Math.max(0,Math.floor(num(v[1]))));
        if(name==='SUBSTITUTE'){const text=str(x),find=str(v[1]),replace=str(v[2]);if(!find)return text;if(v.length<4)return text.split(find).join(replace);let n=0;return text.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),m=>++n===num(v[3])?replace:m);}
        if(name==='FIND'||name==='SEARCH'){const offset=v[2]==null?0:num(v[2])-1;if(offset<0)err('#VALUE! SEARCH');const hay=str(v[1]).slice(offset),needle=str(x);let ix;if(name==='FIND')ix=hay.indexOf(needle);else{const p=wildcard(needle).source.slice(1,-1);ix=hay.search(new RegExp(p,'iu'));}return ix<0?err('#VALUE! SEARCH'):ix+offset+1;}
        if(name==='ABS')return Math.abs(num(x));if(name==='INT')return Math.floor(num(x));if(name==='ROUND')return excelRound(x,v[1]);if(name==='MOD')return num(x)-num(v[1])*Math.floor(num(x)/num(v[1]));
        if(name==='SUM'||name==='MAX'||name==='MIN'||name==='COUNT'){const numbers=v.flatMap(flat).filter(y=>typeof y==='number');return name==='SUM'?numbers.reduce((s,y)=>s+y,0):name==='COUNT'?numbers.length:!numbers.length?0:name==='MAX'?Math.max(...numbers):Math.min(...numbers);}
        if(name==='ROWS')return v[0] instanceof Range?v[0].r2-v[0].r1+1:1;
        if(name==='ROW')return v[0] instanceof Range?v[0].r1:row;
        if(name==='INDEX'){const rr=Math.floor(num(v[1])),cc=v[2]==null?1:Math.floor(num(v[2]));if(!(v[0] instanceof Range)||rr<1||cc<1||rr>v[0].r2-v[0].r1+1||cc>v[0].c2-v[0].c1+1)err('#REF! INDEX '+rr);return v[0].at((rr-1)*(v[0].c2-v[0].c1+1)+cc-1);}
        if(name==='MATCH'){const items=flat(v[1]);const test=criterion(x);const ix=items.findIndex(test);return ix<0?err('#N/A MATCH'):ix+1;}
        if(['COUNTIF','COUNTIFS','SUMIF','SUMIFS','MINIFS','MAXIFS'].includes(name)){
          let sumRange,pairs;
          if(name==='COUNTIF')pairs=[v[0],v[1]];
          else if(name==='SUMIF'){sumRange=v[2]??v[0];pairs=[v[0],v[1]];}
          else if(name==='COUNTIFS')pairs=v;
          else {sumRange=v[0];pairs=v.slice(1);}
          const ranges=[],tests=[];for(let i=0;i<pairs.length;i+=2){ranges.push(flat(pairs[i]));tests.push(criterion(scalar(pairs[i+1])));}
          const sums=sumRange?flat(sumRange):null;let result=0,found=false;
          for(let i=0;i<ranges[0].length;i++){if(!tests.every((fn,j)=>fn(ranges[j][i])))continue;const z=sums?.[i];if(!sums){result++;continue;}if(typeof z!=='number')continue;result=name==='MINIFS'?(found?Math.min(result,z):z):name==='MAXIFS'?(found?Math.max(result,z):z):result+z;found=true;}
          return result;
        }
        if(name==='TEXT'){const format=str(v[1]);if(format.includes('#,##0'))return num(x).toLocaleString('en-US',{maximumFractionDigits:0});if(format.includes('0.0%'))return (num(x)*100).toFixed(1)+'%';const d=new Date(excelEpoch+Math.round(num(x)*86400)*1000),pad=n=>String(n).padStart(2,'0');return format.replace(/yyyy|yy|dd|hh|ss|mm/g,(token,offset)=>token==='yyyy'?String(d.getUTCFullYear()):token==='yy'?String(d.getUTCFullYear()).slice(-2):token==='dd'?pad(d.getUTCDate()):token==='hh'?pad(d.getUTCHours()):token==='ss'?pad(d.getUTCSeconds()):pad(format.indexOf('h')>=0&&offset>format.indexOf('h')?d.getUTCMinutes():d.getUTCMonth()+1));}
        if(name==='EDATE'){const d=new Date(excelEpoch+num(x)*86400000),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+num(v[1]));d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));return (d.getTime()-excelEpoch)/86400000;}
        if(name==='HYPERLINK')return v[1]??x;
        return err('Unsupported function '+name);
      }
    }
    return err('Unknown formula expression');
  }
  calculate(record,patch={},options={}){
    this.reset();
    // Internal contract projection. API patches still accept only H:L/approved;
    // original workbook grids and the default source-regression path stay intact.
    for(const [key,value] of Object.entries(options.cells??{}))this.overrides.set('CHECK_INSTALLMENT!'+key+record.sheetRow,value);
    for(const [key,value] of Object.entries(options.raw??{}))this.overrides.set('RAW_REPORT!'+key+(options.rawRow??record.rawRow),value);
    for(const key of ['H','I','J','K','L'])if(own(patch,key))this.overrides.set('CHECK_INSTALLMENT!'+key+record.sheetRow,patch[key]);
    this.approved=own(patch,'approved')?patch.approved:str(this.data.grids.CHECK_INSTALLMENT['AG'+record.sheetRow]).trim().toUpperCase()==='APPROVED';
    this.account=options.account??this.data.extensions?.accounts.records[record.id]??null;
    const customVoucher=this.data.extensions?.customVouchers?.find(v=>v.code===voucherCode(this.get('CHECK_INSTALLMENT','K',record.sheetRow)));
    if(customVoucher){
      this.overrides.set('CHECK_INSTALLMENT!AM'+record.sheetRow,customVoucher.row-1);
      const issue=customVoucherIssue(customVoucher,this.get('CHECK_INSTALLMENT','F',record.sheetRow));
      if(issue)this.overrides.set('CHECK_INSTALLMENT!CI'+record.sheetRow,issue);
    }
    this.blockUnsupportedDiscount=false;
    if(this.data.extensions){
      const match=discountPolicyMatch(this.get('CHECK_INSTALLMENT','L',record.sheetRow),this.get('CHECK_INSTALLMENT','D',record.sheetRow),this.get('CHECK_INSTALLMENT','AO',record.sheetRow));
      if(match.ruleKey||match.issues.length)this.overrides.set('CHECK_INSTALLMENT!AL'+record.sheetRow,match.ruleKey??'OTHER');
      this.overrides.set('CHECK_INSTALLMENT!BO'+record.sheetRow,discountPolicyCheck(this.get('CHECK_INSTALLMENT','L',record.sheetRow),this.get('CHECK_INSTALLMENT','D',record.sheetRow),this.get('CHECK_INSTALLMENT','AO',record.sheetRow),this.data.grids.PROMO_VOUCHER));
    }
    if(this.data.extensions&&this.get('CHECK_INSTALLMENT','AL',record.sheetRow)==='OTHER')this.blockUnsupportedDiscount=true;
    const pricing=regularTwoMonthPrice(this.data,{
      course:this.get('CHECK_INSTALLMENT','H',record.sheetRow),hours:this.get('CHECK_INSTALLMENT','I',record.sheetRow),
      package:this.get('CHECK_INSTALLMENT','J',record.sheetRow),group:this.get('RAW_REPORT','X',options.rawRow??record.rawRow)
    });
    if(pricing)this.overrides.set('CHECK_INSTALLMENT!M'+record.sheetRow,pricing.amount);
    const cells={};for(let n=1;n<=87;n++){const col=columnName(n);if(['CJ','CK','CL','CM','CN','CO','CP','CQ','CR'].includes(col))continue;try{cells[col]=scalar(this.get('CHECK_INSTALLMENT',col,record.sheetRow));}catch(e){if(e instanceof FormulaError)cells[col]='#ERROR: '+e.message;else throw e;}}
    const errors=Object.entries(cells).filter(([,v])=>typeof v==='string'&&v.startsWith('#ERROR'));
    cells.AG=this.approved?'APPROVED':'';
    if(pricing)cells.AN=str(cells.AN).replace(/ \| Gói lẻ:.*?(?= \| Giftcode:|$)/u,` | Giá thường 2 tháng: ${pricing.monthly.toLocaleString('en-US')}/tháng × 2; Lộ trình BẢNG GIÁ và Bảng giá chung`);
    const r=options.rawRow??record.rawRow;
    const context={method:this.get('RAW_REPORT','AH',r),bank:this.get('RAW_REPORT','AI',r),contractType:this.get('RAW_REPORT','G',r),source:this.get('RAW_REPORT','T',r),fullStatus:this.get('RAW_REPORT','J',r)};
    if(this.data.extensions&&typeof cells.AM==='number'&&cells.AM>0)context.voucherType=customVoucher?(customVoucher.type==='amount'?'SỐ TIỀN':'PHẦN TRĂM'):this.data.grids.PROMO_VOUCHER['Z'+cells.AM]??null;
    let reconciliation,promotion;
    if(this.data.extensions){
      reconciliation={...this.account,...financialResult(this.account,cells,this.data.grids.HUONG_DAN.B9??1)};
      promotion=promotionResult(cells,context,this.account,this.data.extensions.catalogue.programs);
      cells.contractTotal=this.account?.ct??'';cells.ctNet=this.account?.ct?this.account.net:null;cells.ctCheck=reconciliation.status;cells.promoCheck=promotion.status;
      const tolerance=this.data.grids.HUONG_DAN.B9??1;
      const diffs=['Z','AA','AB','AC'].every(c=>typeof cells[c]==='number'&&Math.abs(cells[c])<=tolerance)&&typeof cells.AD==='number'&&Math.abs(cells.AD)<=1;
      cells.AF=diffs&&['BD','BO','AE'].every(c=>cells[c]==='OK')&&['OK','NO GIFTCODE'].includes(cells.CI)&&cells.CH==='OK'&&!reconciliation.blocking&&!promotion.blocking?'OK':'CHECK';
    }
    if(errors.length)cells.AF='CHECK';
    return { ...record,cells,errors,context,...(pricing?{pricing}:{}),...(reconciliation?{reconciliation,promotion}:{}) };
  }
  baseline(record){const cells={};for(let n=1;n<=87;n++){const col=columnName(n);cells[col]=this.data.grids.CHECK_INSTALLMENT[col+record.sheetRow]??null;}return {...record,cells,errors:[]};}
}
