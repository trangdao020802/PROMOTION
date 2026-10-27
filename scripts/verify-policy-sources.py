"""Read policy workbooks without changing them; emit prices and source hashes only.

Usage: python scripts/verify-policy-sources.py <source_dir> [new_master.xlsx] [new_roadmap.xlsx]
Only pricing-sheet aggregates are exported; no student/transaction records.
"""
import ast, hashlib, json, pathlib, sys

root=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(sys.argv[1])
tree=ast.parse((root/'scripts/extract_sources.py').read_text())
nodes=[n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.FunctionDef)) or isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in ('N','REL') for t in n.targets)]
env={'__file__':str(root/'scripts/extract_sources.py')}
exec(compile(ast.Module(body=nodes,type_ignores=[]),'read_policy_xml','exec'),env)
paths=sorted(source.glob('*.xlsx'))
files={int(p.name[:2]):p for p in paths if p.name[:2].isdigit() and int(p.name[:2])<=16}
books={i:env['read_book'](p) for i,p in files.items()}
grid=lambda s:{c['a']:c['v'] for r in s['rows'] for c in r['c']}
road=next(s for s in books[13] if s['name']=='BẢNG GIÁ')
primary=books[3]
q4=grid(next(s for s in primary if s['name']=='Big bang promotion 6.10 - 31.12'))
sep=grid(next(s for s in primary if s['name']=='Big bang promotion 1.9.2026 - 3'))
out=[]
for raw in road['rows']:
 values={c['a'].rstrip('0123456789'):c['v'] for c in raw['c']}
 if not isinstance(values.get('A'),str) or '|' not in values['A']:continue
 layer,hours,pkg=values['B'],values['C'],str(values['D'])
 months=values['E']; long=36 if pkg=='36 SPLIT' else int(pkg)
 columns={1:['C','D','E','F','G'],2:['I','J','K','L','M'],3:['O','P','Q','R','S']}
 col=columns[layer][{36:0,24:1,18:2,12:3}.get(long,4)]
 issues=[];refs={phase:[] for phase in ('base','september','october','q4')}
 monthrow=33 if hours==4 else 50
 if values['F']!=q4[col+str(monthrow)]:issues.append('giá tháng khác chính sách Q4 gốc')
 refs['q4']=[{'file':'2026 Price & Promotion - update 10.10.26.xlsx','sheet':'Big bang promotion 6.10 - 31.12','row':monthrow,'cell':col+str(monthrow)}, {'file':'2026 Price & Promotion - update 10.10.26.xlsx','sheet':'Big bang promotion 6.10 - 31.12','row':25 if pkg=='36 SPLIT' else 36 if hours==4 else 53}]
 expected=round(values['G']*(q4[col+str(36 if hours==4 else 53)] if long>=12 else 0))
 if values['U']!=expected:issues.append('giảm Q4 khác tỷ lệ trên giá gốc trong chính sách')
 if long>=12:
  cashrow=23 if hours==4 else 40
  cash=sep[col+str(cashrow)]/(2 if pkg=='36 SPLIT' else 1)
  if values['K']!=cash:issues.append('giảm Big Bang Sep khác khoản tiền trong chính sách')
  refs['september']=[{'file':'2026 Price & Promotion - update 10.10.26.xlsx','sheet':'Big bang promotion 1.9.2026 - 3','row':cashrow,'cell':col+str(cashrow)}]
 out.append({'key':values['A'],'values':{k:values[k] for k in ('B','C','D','E','F','G','H','I','J','K','L','M','N','P','Q','R','S','U','V','W','X','Y','Z')},'refs':refs,'issues':issues})
sources=[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'role':'policy-and-reference' if i not in (2,14,15,16) else 'case-evidence-not-general-price','sheets':[s['name'] for s in books[i]]} for i,p in files.items()]
master=[]
def master_rows(sheets,filename,new=False):
 sheet=next(s for s in sheets if s['name']=='Bảng giá chung')
 for raw in sheet['rows']:
  c={cell['a'].rstrip('0123456789'):cell['v'] for cell in raw['c']}
  if raw['r']<(4 if new else 5) or not c.get('C'):continue
  master.append({'file':filename,'sheet':sheet['name'],'row':raw['r'],'group':c.get('A'),'koc':c.get('B'),'course':c['C'],'hours':c.get('D'),'package':c.get('E'),'layer':c.get('F'),'statedGross':c.get('J'),'observedGross':c.get('L' if new else 'K'),'source':c.get('K' if new else 'I'),'approvedPrice':False})
master_rows(books[6],'Bang_gia_chung_doi_chieu_Report.xlsx')
for pos,role in ((2,'master-pricing-reference'),(3,'roadmap-price-source')):
 if len(sys.argv)<=pos:continue
 p=pathlib.Path(sys.argv[pos]);sheets=env['read_book'](p)
 sources.append({'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'role':role,'sheets':[s['name'] for s in sheets]})
 if pos==2:master_rows(sheets,p.name,True)
 else:
  newer=next(s for s in sheets if s['name']=='BẢNG GIÁ')
  values=[{c['a'].rstrip('0123456789'):c['v'] for c in r['c']} for r in newer['rows']]
  for r in out:
   found=[v for v in values if v.get('A')==r['key']]
   if len(found)!=1 or any(found[0].get(col)!=value for col,value in r['values'].items()):r['issues'].append('file lộ trình mới khác bộ giá chuẩn')
output={'version':1,'sources':sources,'roadmap':out,'master':master,'checkedRows':len(out),'conflicts':sum(bool(r['issues']) for r in out),'scope':'48 lộ trình giá; đối chiếu giá tháng/Q4 và khoản tiền Big Bang Sep với văn bản gốc. Danh sách case không được dùng làm quy tắc chung.'}
(root/'reference/price-evidence.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sources':len(sources),'roadmapRows':len(out),'conflicts':output['conflicts']}))
if output['conflicts']:sys.exit(1)
