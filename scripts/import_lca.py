"""Import a downloaded official FY2026 Q3 LCA workbook; no worker identifiers retained."""
import sys,zipfile,xml.etree.ElementTree as E,json,datetime
z=zipfile.ZipFile(sys.argv[1]); ns='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
strings=[]
for _,e in E.iterparse(z.open('xl/sharedStrings.xml'),events=['end']):
 if e.tag==ns+'si': strings.append(''.join(e.itertext()));e.clear()
fields={'A':'caseNumber','B':'status','F':'visa','G':'job','H':'soc','T':'employer','K':'begin','L':'end','BR':'city','BS':'county','BT':'state','BU':'zip','BV':'offered','BX':'offeredUnit','BY':'prevailing','BZ':'prevailingUnit','CB':'level','CH':'worksites'}
n=0
with open(sys.argv[2],'w') as out:
 context=E.iterparse(z.open('xl/worksheets/sheet1.xml'),events=['start','end']); _,root=next(context)
 for event,e in context:
  if event!='end' or e.tag!=ns+'row': continue
  if e.get('r')=='1': e.clear();continue
  r={}
  for c in e:
   col=c.get('r','').rstrip('0123456789')
   if col not in fields: continue
   v=c.find(ns+'v'); value=v.text if v is not None else ''
   if c.get('t')=='s' and value: value=strings[int(value)]
   if col in ('K','L') and value:
    value=(datetime.datetime(1899,12,30)+datetime.timedelta(days=float(value))).date().isoformat()
   r[fields[col]]=value
  if r.get('visa')=='H-1B': out.write(json.dumps(r,separators=(',',':'))+'\n');n+=1
  e.clear(); root.clear()
print('Imported',n,'H-1B records')
