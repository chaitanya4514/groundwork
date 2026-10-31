import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { calculatePayroll } from './payroll';
interface Row {number:number; payment:number; interest:number; principal:number; balance:number}
interface Projection {paidOff:boolean; warning:string|null; schedule:Row[]; totalInterest:number; totalPaid:number}
interface Result {current:Projection; increased:Projection; assumptions:string}
@Component({selector:'app-root', imports:[CommonModule,FormsModule], templateUrl:'./app.html', styleUrl:'./app.css'})
export class App {
 tickerItems=signal<{title:string;url:string;date:string}[]>([]);
 tickerStatus=signal('Checking USCIS alerts…');
 private tickerTimer?:ReturnType<typeof setInterval>;
 async refreshUscis(){
  try {
   const response=await fetch('/api/uscis-updates');
   if(!response.ok)throw new Error('Unavailable');
   const feed=await response.json();
   this.tickerItems.set(feed.items);
   this.tickerStatus.set(feed.stale?'Saved · last checked Oct 29, 2026 · live refresh unavailable':'Last checked '+new Date(feed.checkedAt).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}));
  }catch{this.tickerStatus.set('Live updates unavailable · check USCIS directly');}
 }
 private currentPage=signal('home');
 get page(){return this.currentPage();}
 set page(value:string){this.currentPage.set(value);}
 get isWork(){return ['work-guide','employer-check','lca-wage','before-signing','payroll'].includes(this.page);}
 get isMoney(){return ['card','offers','basics'].includes(this.page);}
 private syncPage=()=>{const hash=location.hash.slice(1);this.page=['home','work-guide','employer-check','lca-wage','before-signing','payroll','card','offers','basics','visa-updates'].includes(hash)?hash:'home';window.scrollTo(0,0);};
 ngOnInit(){void this.refreshUscis();this.tickerTimer=setInterval(()=>void this.refreshUscis(),30*60*1000);this.syncPage();window.addEventListener('hashchange',this.syncPage);}
 ngOnDestroy(){clearInterval(this.tickerTimer);window.removeEventListener('hashchange',this.syncPage);}

 lcaQuery={employer:'',zip:'',job:''};
 lcaBusy=signal(false); lcaError=signal(''); lcaResults=signal<any>(null); selectedLca=signal<any>(null);
 async searchLca(){
  this.lcaError.set('');this.lcaResults.set(null);this.selectedLca.set(null);this.wageResult=null;
  if(this.lcaQuery.employer.trim().length<2 || (this.lcaQuery.zip && !/^\d{5}$/.test(this.lcaQuery.zip))){this.lcaError.set('Enter an employer name or case number and, if used, a five-digit ZIP.');return;}
  this.lcaBusy.set(true);
  try{const r=await fetch('/api/lca-search?'+new URLSearchParams(this.lcaQuery));const d=await r.json();if(!r.ok)throw new Error(d.error||'Search unavailable.');this.lcaResults.set({...d,query:{...this.lcaQuery}});}
  catch(e){this.lcaError.set(e instanceof Error?e.message:'Search unavailable.');}finally{this.lcaBusy.set(false);}
 }
 selectLca(r:any){
  this.selectedLca.set(r);this.wageResult=null;this.wage.actual=null;this.wage.pay=null;
  this.wage.prevailing=Number(r.prevailing)>0?Number(r.prevailing):null;
  this.wage.unit=r.prevailingUnit==='Hour'?'hour':r.prevailingUnit==='Year'?'year':'unsupported';
 }
 wage={zip:'',job:'',area:'',period:'',level:'unknown',prevailing:null as number|null,actual:null as number|null,pay:null as number|null,unit:'year'};
 wageLocation=signal(''); wageLookupError=signal(''); wageBusy=signal(false); wageError='';
 wageResult:{floor:number;pay:number;unit:string;complete:boolean}|null=null;
 async locateWage(){
  this.wageLocation.set('');this.wageLookupError.set('');
  if(!/^\d{5}$/.test(this.wage.zip)){this.wageLookupError.set('Enter a five-digit U.S. work ZIP.');return;}
  this.wageBusy.set(true);
  try{const r=await fetch('https://api.zippopotam.us/us/'+this.wage.zip);if(!r.ok)throw new Error();const d=await r.json();this.wageLocation.set(d.places.map((p:any)=>p['place name']+', '+p['state abbreviation']).join(' / '));}
  catch{this.wageLookupError.set('ZIP lookup unavailable or ZIP not found. Confirm the city, state and county using USPS, then continue with DOL.');}
  finally{this.wageBusy.set(false);}
 }
 compareWage(){
  this.wageResult=null;this.wageError='';
  const w=this.wage;
  if(w.prevailing===null||w.pay===null||![w.prevailing,w.pay].every(n=>Number.isFinite(n)&&n>0)|| (w.actual!==null&&(!Number.isFinite(w.actual)||w.actual<=0))){this.wageError='Enter positive prevailing wage and gross pay. Leave actual wage blank if unknown; do not replace it with zero.';return;}
  this.wageResult={floor:Math.max(w.prevailing,w.actual??0),pay:w.pay,unit:w.unit,complete:w.actual!==null};
 }
 employerSearch=''; employerSearchName=''; employerSearchError='';
 get myVisaJobsUrl(){return 'https://www.myvisajobs.com/employers/search.aspx?e='+encodeURIComponent(this.employerSearchName);}
 prepareEmployerSearch(){
  this.employerSearchName='';
  const name=this.employerSearch.trim();
  this.employerSearchError=name.length<2?'Enter at least two characters of the employer’s legal name.':'';
  if(!this.employerSearchError)this.employerSearchName=name;
 }

 employerQuestions=[
 {id:'money',label:'They ask me to pay to get the job, unlock tasks, or reserve a placement.',action:'Do not pay. Independently contact the company through a phone number you found yourself.',critical:true},
 {id:'check',label:'They sent a check and want me to buy equipment or send money elsewhere.',action:'Do not deposit the check or send money. If already deposited, contact your bank’s fraud team immediately.',critical:true},
 {id:'records',label:'They want fake experience, false training records, or wages returned in cash.',action:'Do not create false records or return wages. Preserve the request and speak with an independent adviser or your DSO.',critical:true},
 {id:'identity',label:'The company confirmed this recruiter and opening through an independently found contact.',action:'Find the company website yourself and call its published number. Confirm the recruiter, job ID and offer; a real company can be impersonated.',critical:false},
 {id:'entity',label:'The legal employer name and business registration match the written offer.',action:'Check the Secretary of State business registry for the incorporation state. Compare legal name, address and status. Registration does not authenticate the recruiter or job.',critical:false},
 {id:'terms',label:'I have written pay, duties, hours, work location and the actual employer’s name.',action:'Request written terms and clarify whether a staffing company or end client employs, pays and supervises you.',critical:false},
 {id:'privacy',label:'I verified the onboarding portal and why sensitive documents are needed.',action:'Verify the employer and secure onboarding process before sharing SSN, bank or identity documents. Do not send them through an unverified chat or email.',critical:false}
 ];
 employerAnswers:Record<string,string>={}; employerReviewed=false; employerCopy='';
 get employerAlerts(){return this.employerQuestions.filter(q=>q.critical&&this.employerAnswers[q.id]==='yes');}
 get employerGaps(){return this.employerQuestions.filter(q=>q.critical?this.employerAnswers[q.id]!== 'no':this.employerAnswers[q.id]!== 'yes');}
 get employerPlan(){return 'EMPLOYER VERIFICATION PLAN\n'+(this.employerAlerts.length?'Urgent warning signs reported. Pause before proceeding.':'Verification is still needed; these answers do not establish legitimacy.')+'\n\n'+this.employerGaps.map(q=>q.label+'\nNext step: '+q.action).join('\n\n')+'\n\nConfirm the recruiter independently. Keep original offers, messages and payment records. No company or recruiter was checked by this tool.';}
 async copyEmployerPlan(){try{await navigator.clipboard.writeText(this.employerPlan);this.employerCopy='Plan copied.';}catch{this.employerCopy='Select and copy the plan below.';}}
 resetEmployer(){this.employerAnswers={};this.employerReviewed=false;this.employerCopy='';}
 guide={status:'unknown',mode:'unknown',home:'',office:'',job:'',stub:'unknown'};
 guideError=''; guideResult:typeof this.guide|null=null;
 buildGuide(){
 this.guideResult=null;
 this.guideError=[this.guide.home,this.guide.office].some(z=>z!==''&&!/^\d{5}$/.test(z))?'Enter a five-digit ZIP code, or leave it blank if unknown.':'';
 if(!this.guideError)this.guideResult={...this.guide};
 }
 get requestText(){
 const g=this.guideResult||this.guide;
 return 'Hello, before I join / for my employment records, please provide:\n\n1. My legal employer, job duties, written gross pay, guaranteed hours, pay schedule and payroll portal access.\n2. Itemized wage statements for each pay period, showing hours, gross pay, every deduction and net pay; please explain any missing statements.\n3. Written terms for benefits, deductions, training or immigration charges, repayment clauses and pay between client assignments.\n4. Approved physical work locations and the process before moving or changing remote/onsite days.'+(g.status==='h1b'?'\n5. My certified LCA, occupation/SOC code, wage source and level (if applicable), validity dates, covered work locations, and an explanation of actual versus prevailing wage. Please confirm worksite notice and whether a location change requires a new LCA or amended petition.':g.status==='stem'?'\n5. E-Verify participation, the employer signing my I-983, my training supervisor, training location, compensation and reporting/evaluation process.':g.status==='opt'?'\n5. Written duties, hours and supervisor details so I can review the degree relationship and reporting requirements with my DSO.':'\n5. The work authorization documents and employer responsibilities relevant to my category.')+'\n\nPlease send copies I can retain. Thank you.';
 }
 copyMessage='';
 async copyRequest(){try{await navigator.clipboard.writeText(this.requestText);this.copyMessage='Copied. Review and send it yourself when ready.';}catch{this.copyMessage='Select and copy the text below.';}}
 payroll={billRate:80,wage:50,hours:40,weeks:52,employees:1,cutPercent:10,fee:0,withholding:300,ficaWithheld:0,benefits:100,employerCosts:200};
 payrollStatus='general'; ficaStatus='unknown'; payrollError=signal(''); payrollStale=signal(false);
 payrollResult=signal<ReturnType<typeof calculatePayroll>|null>(null);
 payrollSnapshot={...this.payroll};
 payrollChanged(){this.payrollStale.set(true);}
 analyzePayroll(){this.payrollError.set('');this.payrollResult.set(null);try{this.payrollResult.set(calculatePayroll(this.payroll));this.payrollSnapshot={...this.payroll};this.payrollStale.set(false);}catch(e){this.payrollError.set(e instanceof Error?e.message:'Check your inputs.');}}

 offer={kind:'card',amount:5000,rate:24,introRate:0,introMonths:12,feePercent:3,annualFee:0,payment:150,term:36};
 offerResult=signal<any>(null); offerError=signal(''); offerStale=signal(false); offerBusy=signal(false);
 offerChanged(){this.offerStale.set(true);}
 async analyzeOffer(){this.offerBusy.set(true);this.offerError.set('');this.offerResult.set(null);
 try{const response=await fetch('/api/offer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(this.offer)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not analyze offer.');this.offerResult.set({...data,kind:this.offer.kind});this.offerStale.set(false);}catch(e){this.offerError.set(e instanceof Error?e.message:'Could not connect.');}finally{this.offerBusy.set(false);}}
 balance=5000; apr=24; payment=150; extra=50;
 result=signal<Result|null>(null); error=signal(''); busy=signal(false); stale=signal(false);
 calculated={balance:5000,payment:150,extra:50}; statement=''; evidence=signal<{label:string;value:string}[]>([]); note=signal('');
 constructor(){this.calculate();this.analyzePayroll();}
 changed(){this.stale.set(true);}
 async calculate(){
 this.error.set('');this.busy.set(true);
 try {const response=await fetch('/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({balance:this.balance,apr:this.apr,payment:this.payment,extra:this.extra})});
 const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not calculate. Check your inputs.');this.calculated={balance:this.balance,payment:this.payment,extra:this.extra};this.result.set(data);this.stale.set(false);
 }catch(e){this.error.set(e instanceof Error?e.message:'Could not connect to the calculator.');}finally{this.busy.set(false);}}
 async upload(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;if(file.size>1000000){this.note.set('Use a text file smaller than 1 MB.');return;}this.statement=await file.text();this.extract();}
 extract(){
 const matches:{label:string;value:string}[]=[];
 const terms=[{label:'Balance',pattern:/(?:new balance|statement balance)\s*[:$\s]*([\d,]+\.\d{2})/i,assign:(n:number)=>this.balance=n},{label:'Purchase APR',pattern:/(?:purchase apr|purchases apr|annual percentage rate)\s*[:\s]*([\d.]+)\s*%/i,assign:(n:number)=>this.apr=n},{label:'Minimum payment',pattern:/(?:minimum payment(?: due)?)\s*[:$\s]*([\d,]+\.\d{2})/i,assign:(n:number)=>this.payment=n}];
 for(const term of terms){const found=this.statement.match(term.pattern);if(found){term.assign(Number(found[1].replaceAll(',','')));matches.push({label:term.label,value:found[0]});}}
 this.evidence.set(matches);this.note.set(matches.length?'Review each detected value against your statement before calculating. Unmatched fields keep their previous values.':'No supported labels found. Enter the values manually.');this.changed();
 }
 money(n:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);}
}
