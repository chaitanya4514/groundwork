"""Verify official-data search semantics against a running API."""
import json,sys,urllib.request,urllib.parse,urllib.error
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:5098'
def get(**params):
 return json.load(urllib.request.urlopen(base+'/api/lca-search?'+urllib.parse.urlencode(params)))
r=get(employer='Databricks',zip='94105')
assert r['total']>0 and len(r['records'])<=25
for row in r['records']:
 assert 'databricks' in row['employer'].lower() and row['zip'].split('-')[0]=='94105'
case=r['records'][0]
r=get(employer=case['caseNumber'])
assert r['total']==1 and r['records'][0]==case
assert get(employer='NoSuchEmployer-XYZ-987654321')['total']==0
assert get(employer='Databricks',job='NoSuchOccupation-987654')['total']==0
for params in [dict(employer='a'),dict(employer='Databricks',zip='abcde')]:
 try: get(**params);raise AssertionError('Expected invalid input rejection')
 except urllib.error.HTTPError as e: assert e.code==400
assert r['dataset'].startswith('FY2026 Q3')
print('LCA search: data, exact case, filters, no match and invalid inputs passed.')
