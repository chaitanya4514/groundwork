# Groundwork
.NET 10 API and Angular 21 credit-card cost explainer.

## Run
1. `cd web && npm ci && npm run build`
2. Copy `web/dist/borrowing-lens-web/browser/` contents into `api/wwwroot/`.
3. `dotnet run --project api --urls http://localhost:5098`
4. Open http://localhost:5098.

API checks: `python3 tests/check_api.py` while the app runs.

## Scope
- Fixed dollar monthly payments, fixed purchase APR, no additional purchases or fees.
- Compare current payment against extra monthly payments; inspect amortization schedule.
- Import plain text statements or paste text; find explicitly labeled balance, purchase APR and minimum payment, show matching source snippets, then require review and calculation. Missing fields retain previous inputs.
- Statement text stays in browser memory; calculator API receives only numeric scenario inputs. No persistence, analytics or account connection.
- Offer analyzer: true introductory card APR, post-promotion rate, percentage transfer fee, recurring annual fee, and fixed-rate loans with origination fees withheld from proceeds. Numeric terms are entered manually; defaults are illustrative, not live lender offers.
- PDF/OCR, multiple APR buckets, deferred-interest calculations, variable rates, live lender feeds and daily ledger reconciliation are not implemented.
- Monthly approximation using APR/12 and decimal arithmetic, rounding half up to cents. Not an issuer-exact daily calculation. No claim of product novelty.

## Architecture and deployment
The ASP.NET application serves Angular's production files and the same-origin API. Deploy together to a .NET 10 capable host. Sites uses Cloudflare Workers and cannot host this .NET process; no nonfunctional static-only deployment is supplied.

## Source
CFPB: https://www.consumerfinance.gov/ask-cfpb/how-does-my-credit-card-company-calculate-the-amount-of-interest-i-owe-en-51/

## Payroll transparency
Compare client billing, promised gross pay, retained salary cuts, employee deductions, take-home pay and employer remainder. Payroll inputs are calculated locally in browser memory. Employer remainder is not verified profit. Annual estimates use the entered paid weeks and identical employee scenarios.

Restored from the October 28 session on October 29, 2026.

## Audience and learning guides
Designed for international students and contract employees in the U.S. Includes plain-language APR basics, credit card, auto and education borrowing checklists, OPT/STEM OPT/H-1B starting points, and a temporary employer-terms checklist. Work authorization is not inferred from calculator results. The general employee category is selected initially. Education and car guides are educational; the existing fixed-rate offer model does not model in-school deferment, variable rates, financed vehicle add-ons or currency changes. Official references are linked in the page.

## Employer and visa guide
Added a default document-first guide with unknown answers, work authorization, remote/hybrid/onsite choices, optional home/office ZIPs and duties, category-specific next steps, and a copyable employer request. ZIPs are validated for format only: no geographic/wage lookup or LCA compliance determination is performed. The full fictional payroll calculator is collapsed separately; missing values should not be replaced with zero. Answers are ephemeral.

Official-source update summaries were checked October 29, 2026 against USCIS H-1B and STEM OPT pages and DOL wage/worksite/recordkeeping guidance. These are dated curated summaries, not an automatic news feed. Recheck sources before relying on them. The current .NET hosting limitation still applies.

## Homepage USCIS ticker
The homepage polls the same-origin /api/uscis-updates endpoint every 30 minutes. The API reads the official USCIS Alerts RSS feed, caches successful responses for 30 minutes and retries failures after five minutes. Headlines are selected by visa, OPT, employment, fee, court, rule and policy keywords, not an exhaustive assessment of major changes. Only HTTPS www.uscis.gov links are accepted. An October 29, 2026 feed snapshot provides clearly labeled saved headlines if live fetch fails. Scrolling pauses on hover/focus, pauses while hovered or focused and respects reduced-motion preferences. Existing detailed update cards remain dated curated guidance.

## Employer verification
Employer checks organizes self-reported scam warning signs and missing evidence into a copyable action plan. It does not perform company lookups or certify legitimacy. Includes official FTC, E-Verify, identity recovery and reporting links. Answers are ephemeral. Navigation uses a reactive signal so native hash changes trigger Angular rendering without reloads.

## Employer search
Employer checks includes a company-name shortcut to MyVisaJobs employer search using its verified `?e=` query parameter. The user explicitly opens the external result link; no request is made while typing. Company names are trimmed, validated and URL-encoded. Results remain on the provider’s website; there is no scraping, API integration, cached employer dataset or legitimacy score. No public MyVisaJobs API documentation was located on October 29, 2026. Official E-Verify and DOL cross-check links are included.

## LCA wage check
Work tools now include #lca-wage: optional user-triggered ZIP city/state lookup via Zippopotam.us (disclosed before use), official USPS/DOL lookup handoff, wage-source/area/occupation context, and a same-unit gross wage comparison. No automatic DOL wage retrieval, county mapping, wage-level assignment or compliance finding. Unknown actual wage remains explicitly incomplete. Source reviewed: DOL Fact Sheet 62G and FLAG wage search, October 29, 2026.

The quick wage comparison requires only two amounts and a shared unit. ZIP lookup, actual wage and context notes are optional expandable sections; unknown actual wage still marks the result incomplete.

## Worker protection and official LCA search
The primary wage journey now searches 426,952 H-1B records from DOL's FY2026 Q3 disclosure (determinations October 1, 2025–June 30, 2026), imported October 29, 2026. Search by employer substring or exact case number, with optional main-worksite ZIP and job/SOC filters. Returns 25 records ordered by employment start date with total match count. The compressed server-only snapshot contains selected public employer/job/wage fields, not worker names. Rebuild it with `python3 scripts/import_lca.py downloaded.xlsx api/Data/lca-2026-q3.ndjson`, gzip the output, and review the source period before updating labels.

Selecting a possible filing fills the prevailing wage automatically; only gross pay is needed for comparison. Hourly/yearly wages are supported without speculative conversions. Employer actual wage is not public in this dataset, so reaching the prevailing wage never yields a compliance verdict. Status, dates, case number and worksite are visible. No personal LCA match is asserted. Additional worksites, other fiscal years and more recent decisions are excluded; no matches never means fake employer or absent LCA. Recovery guidance links DOL complaints and payroll deductions. Search queries are GET requests to this server and may appear in normal server logs; the page does not persist inputs. `python3 tests/check_lca.py [base URL]` verifies search behavior.
