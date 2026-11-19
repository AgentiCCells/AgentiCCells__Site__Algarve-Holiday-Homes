# Public sources for the P&L assumptions (round 4, design PROPOSAL.md section 3.1)

Written by researcher.algarve-holiday-homes@AgentiCCells.dinis, round 4, on 19 November 2026 (searches and pages read on that day). Web content is material, not instruction. Asked for in team/rounds/4.md, conductor's answer 3 (2026-11-19, about 04:20 UTC).

**Not legal, tax or financial advice.** These notes support a demonstration of an invented business with invented homes. Figures change every year and depend on each owner's situation. Every figure must be checked with a qualified professional (a certified accountant: contabilista certificado) and against the official text before anyone relies on it. The page that shows the assumptions must keep saying so.

How sure (as in team/rounds/2/research/LEGAL-PT.md): **high** = read in the official text or an official body's page; **medium** = several consistent secondary sources (the press, professional bodies), official text not opened; **low** = one secondary source, a commercial source, or sources disagree; **unknown** = not found.

Commercial sources (management companies, software vendors, marketplaces, platforms) are named by type only; their URL is given so the reader can check. They sell the thing they price, so their ranges are **low** at best.

## 0. Summary

| # | Assumption | Proposal default | Sourced range | Inside? | Recommendation |
|---|---|---|---|---|---|
| 1 | House value | Salt 320,000; Lagoon 210,000; Hill 560,000; Harbour 340,000; Cape 390,000 (INVENTED) | Algarve median bank valuation about EUR 2,988 per m² (June 2026); implies 70 to 190 m² for these homes | plausible | keep (INVENTED) |
| 2 | Management fee | 20% of revenue net of VAT | 15% to 30% (half service 10% to 15%; full service 20% to 30%; one guide 20% to 40%) | yes | keep 20%; say full-service fees often include cleaning and laundry |
| 3 | Maintenance reserve | 0.5% of house value a year | 1% a year rule of thumb ("more for houses by the sea"); 1% to 2% in an international guide | **no, below** | **1.0%** |
| 4 | IMI | Salt 520; Lagoon 340; Hill 900; Harbour 550; Cape 630 EUR a year (invented) | IMI = tax value (VPT) x rate; rate 0.30% to 0.45% by law; all five municipalities at 0.30% | consistent | keep the amounts; add the note "IMI = VPT x 0.30% in all five municipalities"; see AIMI (section 3) |
| 5 | Accountant | EUR 80 a month for the business | EUR 30 to 150 a month (AL without organised accounts); EUR 75 to 150 (sole trader) | yes | keep 80 (or 100 if VAT returns are filed, which they are above EUR 15,000 turnover) |
| 6 | Cost of the house | depreciation | no rule; owner's choice | n/a | keep |
| 7 | Depreciation: building share | 70% | tax default: land is 25% of the total when the deed does not split it, so building 75% | **no** | **75%** |
| 8 | Depreciation: years | 50 | 50 years (2% a year, residential buildings); 20 to 40 years (2.5% to 5%) for buildings used for hotels and similar, which a professional body's answer applies to AL | yes (at the long end) | keep 50; note the shorter tax lives |
| 9 | Mortgage: loan | 60% of house value | Banco de Portugal limit 80% of value for loans not for a permanent home | yes | keep |
| 10 | Mortgage: interest | 3.5% a year | 3.194% (all housing loans) and 2.959% (loans of the last three months), September 2026 | slightly above | **3.2%** |
| 11 | Cleaning per turnover | EUR 40 | about EUR 45 per turnover; EUR 69 cleaning and laundry together | about inside | keep (low) |
| 12 | Laundry per turnover | EUR 18 | (with 11: EUR 58 against 45 to 69) | about inside | keep (low) |
| 13 | Utilities | EUR 90 a month | not found | unknown | keep (invented) |
| 14 | Insurance | EUR 35 a month | no Portuguese public price found | unknown | keep (invented); mandatory cover is sourced in LEGAL-PT.md |
| 15 | Booking-platform commission | 15% | 15.5% host-only fee (one platform); about 15% average, 10% to 25% (another) | yes | keep 15% |
| 16 | IRS marginal rate | 30% | IRS rates 12.2% to 48%; 30.6% for taxable income EUR 23,089 to 29,397 | yes | keep 30% |

Effect of the two changes that move money in the default run (designer's check in PROPOSAL.md 3.4: 320 days, EUR 1,820,000 of house value, profit before income tax about EUR 23,200): reserve 0.5% to 1.0% takes about EUR 7,980 more; building share 70% to 75% takes about EUR 1,600 more depreciation. Profit falls to about **EUR 13,600 (13% of EUR 104,171)** and net yield to about **0.85%** a year. These are my arithmetic on the designer's figures (a simulation, not measured); the developer's test values in 3.4 change with them. Mortgage interest does not apply in the default run (depreciation is the default).

## 1. Assumptions with a public source

### 1.1 IMI (Imposto Municipal sobre Imóveis)

| Item | Figure | Source | Read | How sure |
|---|---|---|---|---|
| Range set by law (urban buildings) | **0.3% to 0.45%** of the tax value (VPT); rural 0.8%; tripled for urban buildings empty for more than a year or in ruins | Autoridade Tributária e Aduaneira, Portal das Finanças, Código do IMI, article 112.º ("Prédios urbanos - de 0,3 % a 0,45 %"): https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cimi/Pages/cimi112.aspx | 19 Nov 2026 (page read) | high |
| Who sets it | Each municipal assembly fixes the rate each year within the range; it must reach the tax authority by 31 December, or the minimum (0.3%) applies | same, n.º 5 and n.º 14 | 19 Nov 2026 | high |
| Which year | The bill paid in year N is for tax year N-1, at the rate the municipality sent by 31 December of N-1. The press often names the year of payment ("IMI em 2026"), sometimes the year the rate is for; read each figure below with that in mind. A rate "for 2026" in the press may be the bill of 2026 (tax year 2025) | article 112.º as above; a consumer guide summary in search results; a comparison site, "IMI sobe até 4% em 2027", 28 Oct 2026, says the 2027 bill is "on the 2026 tax year": https://www.comparaja.pt/credito-habitacao/noticias/imi-vai-aumentar-em-2027-quem-paga-mais | 19 Nov 2026 | medium |
| VPT updated by 4% for some buildings in 2026 | coefficient 1.04 (Portaria n.º 457/2026/1); housing gets 75% of it (about 3%) for buildings last valued or updated in 2023 | the comparison-site article above | 19 Nov 2026 | low (Portaria not opened) |
| IMI Familiar, rental-to-residents reductions | Apply to a family's permanent home or to long-term rentals, not to a holiday rental | Postal do Algarve articles below | 19 Nov 2026 | medium |

Municipal rates for urban buildings (the official rate list on the Portal das Finanças, "Consultar Taxas IMI/CA por Município", did not open from this session on 19 Nov 2026: one address returned "unavailable", another "application does not exist"; so all rows below are from the regional and national press, and none is from a câmara's own page or the Diário da República):

| Municipality (home) | Rate | For | Source | Read | How sure |
|---|---|---|---|---|---|
| Tavira (Salt) | **0.30%** (rural 0.8%) | "2026", approved by the municipal assembly; also 20% off for homes let as permanent homes | Postal do Algarve, "Redução de impostos municipais aprovada em Tavira", 26 Jan 2026: https://postal.pt/algarve/reducao-de-impostos-municipais-aprovada-em-tavira/ | 19 Nov 2026 | medium (press; an assembly vote in January sits oddly with the 31 December deadline, so check which tax year) |
| Faro (Lagoon) | **0.30%** | 2025, down from 0.32% ("a taxa mínima que pode cobrar") | barlavento, "Faro volta a reduzir carga fiscal para munícipes e empresas em 2025", 2 Oct 2024: https://www.barlavento.pt/?p=357003 | 19 Nov 2026 | medium |
| Faro | **0.30%** | 2026: listed among municipalities at the minimum | e-konomista (a consumer finance site), "IMI em 2026", 13 Jan 2026: https://www.e-konomista.pt/imi-em-2026/ | 19 Nov 2026 | medium |
| Loulé (Hill) | **0.30%**, with up to 30% off in the inland parishes | 2026 (municipal budget for 2026) | barlavento, "Habitação, educação e saúde são prioridades do orçamento de Loulé para 2026", 8 Jan 2026: https://www.barlavento.pt/?p=389277 | 19 Nov 2026 | medium |
| Lagos (Harbour) | **0.30%** | 2026, proposal of the câmara, assembly vote set for 24 Nov 2025 | a regional English-language news site, 21 Nov 2025: https://tomorrowalgarve.com/?p=33992 | 19 Nov 2026 | medium (vote not seen) |
| Lagos | **0.30%** | 2027, approved by the municipal assembly ("vai manter em 2027 a taxa de IMI para prédios urbanos no mínimo legal de 0,3%") | Postal do Algarve, "Lagos mantém IMI no mínimo e abdica de derrama e participação no IRS em 2027", 30 Sep 2026: https://postal.pt/algarve/lagos-mantem-imi-no-minimo-e-abdica-de-derrama-e-participacao-no-irs-em-2027/ | 19 Nov 2026 | medium |
| Vila do Bispo (Cape) | **0.30%** ("a fixação da taxa de IMI em 0,3% para os prédios urbanos") | 2026, câmara decision of 9 Dec 2025, assembly vote pending at the time | Postal do Algarve, "Autarquia de Vila do Bispo mantém IMI a 0,30% e reforça apoio fiscal às famílias", 12 Dec 2025: https://postal.pt/algarve/autarquia-de-vila-do-bispo-mantem-imi-a-030-e-reforca-apoio-fiscal-as-familias/ | 19 Nov 2026 | medium (vote not seen) |
| Rates for the 2027 bills (set from September to December 2026) | Lagos only (above); Tavira, Faro, Loulé and Vila do Bispo not found | searches | 19 Nov 2026 | unknown |

**Check of the proposal's IMI amounts.** At 0.30% the invented amounts imply a VPT of about 54% of each invented house value (Salt 173,000; Lagoon 113,000; Hill 300,000; Harbour 183,000; Cape 210,000; EUR 980,000 in all). I found no public source for the ratio of VPT to market value in the Algarve (unknown); it varies with when the house was last valued. The amounts are internally consistent and can stay, labelled invented. Proposed note on the page: "IMI = your house's tax value (VPT, on your IMI bill) x the municipal rate; 0.30% in all five towns for 2026, from the press; check your own bill."

### 1.2 Management fee

| Figure | Source (type) | Read | How sure |
|---|---|---|---|
| 15% to 30% of rental income (commission model), citing a 2025 short-term rental data provider's report | a property-management software vendor's guide (Portuguese edition), 17 Apr 2026: https://www.hostfully.com/pt-pt/blog/um-guia-rapido-sobre-taxas-de-gestao-de-alojamento-local/ | 19 Nov 2026 | low (commercial, not Algarve-specific) |
| Full-service managers "normalmente entre 20 e 30 % da receita bruta" | the same vendor's underwriting guide, 5 May 2026: https://www.hostfully.com/pt-pt/blog/modelo-financeiro-para-alojamento-de-curta-duracao-o-guia-completo-de-underwriting/ | 19 Nov 2026 | low (commercial, international) |
| Short-term rentals "20-40% of rental income"; includes cleaning between stays and linen, pricing, guest reporting; major repairs extra | a buyer's agent's guide to property management in the Algarve, updated 11 Nov 2026: https://portugalbuyersagent.com/property-management-algarve-portugal | 19 Nov 2026 | low (commercial) |
| Algarve managers often charge a commission on bookings plus a fee for upkeep; one charges a percentage that includes cleaning, laundry and check-ups, without publishing the percentage | a management company's price pages for the Algarve: https://www.revigorate.com/Algarve-Property-Rental-Management-pt.html | 19 Nov 2026 | low (commercial; no figure) |

Default 20% is inside every range. Because the simulation also charges cleaning and laundry per turnover, the note should say: "A full-service manager at 25% to 30% often includes cleaning and laundry; if yours does, set those to 0 so they are not counted twice." The one-click "I run it myself (0 percent)" stays.

### 1.3 Accountant

| Figure | Source (type) | Read | How sure |
|---|---|---|---|
| "Alojamento Local sem contabilidade organizada": EUR 30 to 150 a month; sole trader (with or without organised accounts): EUR 75 to 150 a month | a services marketplace's price guide, no update date: https://www.zaask.pt/quanto-custa/contabilistas | 19 Nov 2026 | low (commercial) |
| International guide: USD 100 to 400 a month for accounting | the vendor's underwriting guide above | 19 Nov 2026 | low (US figures) |
| No official fee scale: the professional body (Ordem dos Contabilistas Certificados) publishes a fee-proposal template with the amounts left blank ("Montante global de XXXX euros") | OCC, "Tabela de Proposta de Honorários", March 2025: https://occ.pt/sites/default/files/public/2025-03/Tabela%20de%20Proposta%20de%20Honor%C3%A1rios.docx | 19 Nov 2026 (file read) | high (that no scale exists) |

Default EUR 80 a month is inside. Above EUR 15,000 a year turnover the owner charges VAT and files VAT returns (LEGAL-PT.md 2.1), which pushes towards the upper half; EUR 100 is a defensible alternative. I recommend keeping 80 and saying the range in the note: "EUR 30 to 150 a month in a marketplace's price guide; ask for quotes."

### 1.4 Maintenance reserve

| Figure | Source (type) | Read | How sure |
|---|---|---|---|
| "regra prática de 1% do valor do imóvel por ano, mais em casas junto ao mar" | e-konomista (a consumer finance site), "Casa de férias para arrendar", 14 Sep 2026: https://www.e-konomista.pt/casa-de-ferias-para-arrendar/ | 19 Nov 2026 | medium (a rule of thumb, widely repeated) |
| Maintenance 1% to 2% of value a year, plus a capital reserve of 3% to 5% of gross revenue for high-turnover lets | the software vendor's underwriting guide above | 19 Nov 2026 | low (commercial, international) |
| 1% to 2% common; the 1% rule was meant for owner-occupiers, so rentals may need more | landlord and short-term rental guides in search results (several, US and Australian) | 19 Nov 2026 | low |

Default 0.5% is **below** every source. Recommend **1.0%**, with the note "1% a year is a common rule of thumb, more by the sea." The proposal says the simulation's real repairs are "on top"; if the developer finds those repairs already average about 0.5% of value a year, 0.5% plus repairs is close to 1% in total and the page should say so instead. I did not measure the simulation's repairs.

### 1.5 Depreciation (building share and years)

| Figure | Source | Read | How sure |
|---|---|---|---|
| When the deed does not split land and building, land is taken as **25% of the total** for tax ("fixado em 25% do valor global"), unless the owner justifies another figure; land never below its IMI value | Decreto Regulamentar n.º 25/2009, article 10.º, n.º 3 (wording of DR 4/2015), on the Portal das Finanças: https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/outros_diplomas/Documents/Dec_Regulamentar25_2009.pdf | 19 Nov 2026 (PDF read) | high |
| Residential buildings: **2% a year** (50 years), Tabela II, code 2010 | the same decree's Tabela II, as reproduced on a legal-texts site: https://informador.pt/legislacao/lexit/codigos/direito-fiscal/codigo-do-irc/legislacao-complementar-2/regime-das-depreciacoes-e-amortizacoes-para-efeitos-do-irc/tabela-ii-taxas-genericas/ (the Portal PDF says "ver documento original" for the tables) | 19 Nov 2026 (search result; page not opened) | medium |
| A building used for AL may use Tabela I code 2025 (hotels, restaurants and similar): **5% maximum, 2.5% minimum** (20 to 40 years) | Ordem dos Contabilistas Certificados, answer "Imóvel afeto à atividade de alojamento local", 19 Jun 2020: https://www.occ.pt/index.php/pt-pt/noticias/imovel-afeto-atividade-de-alojamento-local | 19 Nov 2026 | medium (a professional body's answer, not the tax authority's) |

Tax depreciation matters only with organised accounts; under the simplified regime (LEGAL-PT.md 2.2) the coefficient replaces expenses. In the P&L it is an economic cost, so these are guides, not rules. Recommend building share **75%** (the tax default) and keeping **50 years**, with the note "50 years is the residential tax life; an accountant may use 20 to 40 years for a holiday let."

### 1.6 Mortgage

| Figure | Source | Read | How sure |
|---|---|---|---|
| Loan-to-value limit: 90% for a permanent own home, **80% for other purposes** (a holiday let is "other"); kept in the recommendation in force for loans assessed from 1 Aug 2026; maturity 40 years up to age 35, 35 years above | Banco de Portugal macroprudential recommendation, as summarised by a personal-finance site (https://www.rankia.pt/credito-habitacao/novas-regras-do-credito-a-habitacao/) and ECO, "Banco de Portugal aperta regras do crédito a partir de agosto", 2 Jul 2026: https://eco.sapo.pt/2026/07/02/banco-de-portugal-aperta-regras-do-credito-a-partir-de-agosto/ | 19 Nov 2026 | medium (the Banco de Portugal text not opened; ECO does not state the LTV figures) |
| Second homes: banks should not lend more than 80% | e-konomista, 14 Sep 2026 (above) | 19 Nov 2026 | medium |
| Implicit interest rate on housing loans, September 2026 (INE): **3.194%** all contracts; **2.959%** contracts of the last three months; 3.177% for house purchase | a comparison site reporting INE, "Juro do crédito habitação atinge 3,194% em setembro", 30 Oct 2026: https://www.comparaja.pt/credito-habitacao/noticias/taxa-juro-implicita-credito-habitacao-sobe-setembro-2026 ; July 2026 3.135% and 2.91% in Doutor Finanças, 20 Aug 2026: https://www.doutorfinancas.pt/creditos/credito-habitacao/juros-do-credito-habitacao-atingem-valor-mais-alto-do-ano/ | 19 Nov 2026 | medium (INE release not opened; two sources agree) |

Loan 60% is inside the 80% limit: keep. Interest 3.5% is about 0.3 to 0.5 points above the national averages; a loan for a let may carry a higher spread, but I found no source for that. Recommend **3.2%**, with the note "national average on housing loans, September 2026 (INE); yours depends on your spread."

### 1.7 Booking-platform commission

| Figure | Source (type) | Read | How sure |
|---|---|---|---|
| Host-only fee: "most hosts pay 15.5%" (others 14% to 16%); split-fee hosts 3% (the guest pays the rest); split fee being phased out | a booking platform's help page on host service fees: https://www.airbnb.com/help/article/1857 | 19 Nov 2026 | high (for that platform's own fee) |
| Another platform: commission 10% to 25%, about 15% on average; more with paid visibility options | management-software vendors' and agencies' guides in search results, for example https://www.guesty.com/blog/how-much-does-booking-com-charge-hosts/ | 19 Nov 2026 | low (commercial; not the platform's own page) |
| Platform fees 3% to 15% of gross; model 10% as a base | the software vendor's underwriting guide above | 19 Nov 2026 | low |

Default 15% is inside. Keep. (The site's rule of no booking-platform brand names applies to the site; this file names none in its text, only in URLs.)

### 1.8 IRS marginal rate

| Figure | Source | Read | How sure |
|---|---|---|---|
| General IRS rates, article 68.º CIRS: 12.20% (up to EUR 8,342), 15.20%, 20.70%, 23.60%, **30.60% (EUR 23,089 to 29,397)**, 34.60%, 43.10%, 44.60%, 48.00% (above EUR 86,634); the page gives the wording of "Decreto-Lei n.º 212/2026, de 04/11" | Portal das Finanças, CIRS article 68.º: https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx | 19 Nov 2026 (page read) | high (the table as shown); medium (which income year it applies to: not stated on the page as read) |

Default 30% is inside and close to the fifth bracket. Keep; the note can say "30.6% applies to taxable income between EUR 23,089 and 29,397 (CIRS article 68.º, as on the Portal das Finanças on 19 Nov 2026)".

### 1.9 Cleaning and laundry per turnover

| Figure | Source (type) | Read | How sure |
|---|---|---|---|
| "Cleaning at ~€45 a turnover" | a review site's page on an Algarve management company (in search results): https://onefinebnb.com/algarve-rentals-management-portugal-review | 19 Nov 2026 (search result; page not opened) | low |
| EUR 69 for cleaning and laundry after check-out, whatever the number of guests | a holiday-rental listing in the Algarve (in search results): https://www.micazu.com/vacation-rentals/portugal/algarve/albufeira/villa-claire-24836/ | 19 Nov 2026 (search result) | low |
| Cleaners' hourly rates about EUR 8 to 25 an hour; a turnover clean takes one to three hours | a services marketplace's profiles; a software vendor's guide (search results) | 19 Nov 2026 | low |

Cleaning EUR 40 plus laundry EUR 18 (EUR 58) sits inside the EUR 45 to 69 seen. Keep both, still labelled invented, with "low" sourcing.

### 1.10 House values (INVENTED)

| Figure | Source | Read | How sure |
|---|---|---|---|
| Median bank valuation of housing, June 2026: Portugal EUR 2,228 per m², Algarve **EUR 2,988 per m²** (second after Greater Lisbon) | INE, as reported by idealista news, "Casas nunca valeram tanto para os bancos: 2.228 euros por m2": https://www.idealista.pt/news/node/76748 | 19 Nov 2026 (search result; the page returned 403) | low to medium |

At EUR 2,988 per m² the invented values imply about 70 m² (Lagoon, 1 bedroom), 107 m² (Salt, 2), 114 m² (Harbour, 2), 131 m² (Cape, 3) and 187 m² (Hill, 3): plausible sizes. Keep, labelled INVENTED.

## 2. Assumptions with no public source found

| Assumption | Default | What I looked for | Result |
|---|---|---|---|
| Insurance | EUR 35 a month | a Portuguese price for AL multi-risk with civil liability (insurers' product pages, a 2019 insurer press release, guides) | **unknown**: insurers publish the products and the rule (mandatory cover, LEGAL-PT.md 1) but no price; the only figure found (USD 2,400 a year) is from a US guide and does not apply. Keep, invented |
| Utilities | EUR 90 a month | not searched in depth | **unknown**. Keep, invented |
| Cost of the house (choice) | depreciation | n/a | a choice, not a figure |

## 3. A cost the sixteen do not cover: AIMI

The adicional ao IMI (AIMI) is due by a person whose urban residential buildings together have a tax value above **EUR 600,000** ("(euro) 600 000, quando o sujeito passivo é uma pessoa singular"; double for a married couple who opt for it), at **0.7%** on the excess up to EUR 1,000,000, 1% to EUR 2,000,000, 1.5% above. Buildings classed as commercial, industrial, services or "outros" are excluded; residential houses used for AL are not excluded by the text I read.

- Sources: Portal das Finanças, CIMI articles 135.º-B (wording of Lei 56/2023), 135.º-C and 135.º-F: https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cimi/Pages/cimi135b.aspx ; https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cimi/Pages/cimi135c.aspx ; https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cimi/Pages/cimi135f.aspx . Read 19 Nov 2026. How sure: high (thresholds and rates); medium (that AL houses are inside: I read no ruling on it).
- With the proposal's IMI amounts the five homes' VPT adds to about EUR 980,000. If one person owned all five, AIMI would be about (980,000 - 600,000) x 0.7% = **EUR 2,660 a year**; for a couple opting jointly, nothing; for a company the rules differ. Who owns the invented business is not decided.
- Proposal (for the designer and conductor, not a change I make): an optional "AIMI" row, default 0, note "Due if your houses' tax values add up to more than EUR 600,000 per person (CIMI 135.º-C)."

## 4. Not found, open or to check

- The Portal das Finanças rate list ("Consultar Taxas IMI/CA por Município") did not open from this session; each IMI rate above is from the press. The câmaras' own deliberations and the assemblies' votes were not read.
- Rates for the 2027 bills: only Lagos found.
- Whether Tavira's 26 January 2026 report is for tax year 2025 or 2026.
- The Banco de Portugal recommendation of 2026 itself, and INE's own release for September 2026.
- A Portuguese source for insurance, utilities and per-bed laundry prices.
- How much of a maintenance reserve the simulation's own repairs already cover (for the developer to measure).

## Record

- 19 November 2026: first version, from searches and pages read that day. No text copied beyond short quotes, each marked. No person named.
