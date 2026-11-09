---
name: pbrer-section-draft
description: Draft the four PBRER sections (Executive Summary; Worldwide MA Status + Actions Taken for Safety Reasons; Estimated Exposure; Signal & Risk Evaluation + Benefit-Risk Conclusion) for a new reporting period from that period's source inputs and the prior report. Validates inputs, consolidates data, drafts, and runs quality-bar checks before delivering.
---

# PBRER Section Draft

Draft a concise, credible first pass of the four sections in `template_pbrer-sections.md` for the current reporting period. Build off the prior report in `prior-report/`, use the current period's source data in `working-input/`, follow the template's directions for content, and match the prior report's style (format, tone and length).

All paths are relative to the project root, which is the folder that holds `working-input/`, `prior-report/` and `template_pbrer-sections.md`.

Work through the steps in order, and do not skip a step:

1. Validate inputs
2. Consolidate data
3. Draft the sections
4. Run quality checks and revise until every check passes
5. Deliver

---

## Step 1 — Validate inputs

Before drafting anything, confirm that every required input is accessible.

### Required inputs

Inputs 1–5 are this period's source data in `working-input/`. Input 6 is last period's report in `prior-report/`.

1. **`01_product-admin-facts.md`** — product and administrative facts. Covers active substance, therapeutic class / ATC, formulations and strengths, brand names, MAH(s), IBD, EURD, approved indication, and clinical-trial exposure. Feeds Sections 1 and 3.
2. **`02_ma-status-and-regulatory.md`** — worldwide marketing-authorisation status and this interval's regulatory events. Covers countries authorised and marketed, new authorisations, withdrawals, suspensions or revocations, and actions taken for safety reasons. Feeds Sections 1 and 2.
3. **`03_sales-exposure.md`** — regional dispensed-pack sales for the interval and cumulatively, with data caveats. Feeds Sections 1, 3 and 4 (the reporting rate).
4. **`04_reference-safety-information.md`** — the RSI / label: the safety concerns, their status (identified or potential) and their risk minimisation. Feeds Section 4.
5. **`05_case-data.md`** — adverse-reaction totals (serious and non-serious, interval and cumulative) and the serious-case line listing. Feeds Sections 1 and 4.
6. **Prior PBRER (`prior-report/prior-pbrer-No<N-1>_<year>.md`)** — last period's finished report, for example `prior-pbrer-No2_2024.md` when drafting No. 3. It supplies the cumulative baselines: cumulative exposure, cumulative case counts, and the prior interval's figures, reporting rate and conclusions. It is also the model for structure, tone and length. Confirm that its report number is N−1 and that its interval ends the day before the current interval starts. Feeds all four sections, through the consolidation in Step 2.

### Reference files (check them the same way)

- **`working-input/00_brief.md`** (optional) — report number, reporting interval, data lock point, the safety topic for Section 4, and the exposure conversion assumption. If there is no brief, derive these from the inputs: the report number is the prior report's number plus one; the interval and data lock point are the period the source files cover; the safety topic is the topic of the case-data export, checked against the RSI's important risks; and the exposure conversion is the one the sales file states. Record each derived value and its source in the consolidated sheet.
- **`template_pbrer-sections.md`** — the required structure and content of the four sections.

### Procedure

1. For each file above, confirm three things: it exists, it is readable and not empty, and it covers the reporting interval (stated in the brief, or derived as above). A missing brief is not a gap.
2. **If everything is present,** continue to Step 2.
3. **If anything is missing, unreadable or for the wrong period,** stop before drafting. Tell the user which file is affected, what it supplies and which sections depend on it. Ask them to add it to `working-input/` (or give its location), or to confirm that they do not have it.
4. **If the user confirms an input is unavailable,** go ahead and draft, under these rules:
   - Every template-required element that the missing input would have supplied appears in the draft as a single bullet (in a prose section, a single sentence): "**DATA MISSING:** <element> — `<file>` not provided."
   - Carry the gap downstream into every required element that depends on it. For example, if sales data are missing, then interval exposure, cumulative exposure and the reporting rate are all tagged.
   - Never fill a gap with a prior-period value, an estimate or an assumption.
   - Data the template does not require is never tagged in the draft, even when it is missing; record it in the sheet and report it in chat. Examples are a regional cumulative figure that the roll-forward method makes unnecessary, the name of a requesting authority, and case-level detail beyond the template's "key features".
5. **Partial gaps and caveats inside files that are present** go only into the consolidated sheet's caveats log and the chat summary, never into the draft. Examples are a region not supplied, a blank field, shipments rather than dispensed packs, a partial year, or a conflict between sources. The one exception is a gap that leaves a template-required element unfilled: tag that element **DATA MISSING:** in the draft.

---

## Step 2 — Consolidate data

Before drafting, build a consolidated data sheet. It is the single source for every figure in the draft. Use `template_pbrer-sections.md` as the checklist: work through every element in every section of the template, and make sure each data point it asks for has an entry.

### For each data point, record:

- **Prior-report value** — extracted from the prior PBRER. Extract every data point the prior report contains, even when the current inputs also supply it. The prior values are the baseline for roll-forward, comparison and cross-checks.
- **Current-period value** — taken from the current inputs.
- **Source** — the file, plus the row or field it came from.
- **Status** — one of: present, derived (show the calculation), caveated (state the caveat), or missing (say whether the template requires it).

### Data points to capture (from the template)

- **Section 1 / admin:** active substance; therapeutic class / ATC; formulation(s) and strength(s); brand name(s); MAH(s); IBD; EURD; report number; reporting interval; data lock point.
- **Section 1 / summary figures:** countries authorised; countries marketed; new authorisations; withdrawals, suspensions and revocations (count); actions taken for safety reasons; interval and cumulative exposure (patient-years); adverse reactions, interval and cumulative, serious and non-serious; overall benefit-risk statement.
- **Section 2:** representative country list; each new authorisation (country, brand, date, MAH); each withdrawal, suspension or revocation (country, date, whether for safety reasons); each action taken for safety reasons (date, who acted, the trigger, what was done, current status, whether the RSI changed).
- **Section 3:** interval packs by region, each with its caveat; interval patient-years; prior-report cumulative patient-years; current cumulative patient-years (derived); cumulative clinical-trial subjects; subjects enrolled during the interval.
- **Section 4 (safety topic from the brief):** risk status per the RSI; labeled reactions; routine and additional risk minimisation; prior-report interval and cumulative topic case counts; prior reporting rate; prior evaluation and conclusion (kept for comparison only); current interval topic cases (unique Case IDs, key features, latest outcomes); fatal or otherwise notable cases; current cumulative topic case count; interval reporting rate.

### Caveats log

The sheet ends with a caveats log. It lists every caveat, partial gap, source conflict, exclusion and deduplication decision. Each entry gives the source and the likely effect on the figures, for example whether exposure is overestimated or underestimated. This log and the chat summary are the only places caveats appear.

### Consolidation rules

- **Prior values are baselines, not current values.** Never present a prior-period figure or conclusion as this period's, and never use one to fill a gap in the current data.

### Exposure rules

- **Conversion:** 1 dispensed pack = 1 patient-month, so **patient-years = packs ÷ 12**. If the brief states a different conversion, use the brief's and say so.
- **Interval exposure:** sum every region's interval packs, and then convert. Record each region's packs and patient-years in the sheet, and log every caveated or partial region. Do not drop a region from the total.
- **Cumulative exposure:** prior-report cumulative patient-years + current interval patient-years.
  - Use any regional cumulative table only as a cross-check, recorded in the sheet.
  - If the prior report is unavailable, tag cumulative exposure **DATA MISSING:** in the draft, and record any partial regional sum in the sheet.
- **Rounding:** keep exact values in the sheet. In the draft, round to the nearest 1,000 patient-years with "≈", as the prior report does, and use the same rounded figure everywhere it appears.

### Case-counting rules

- **Topic filter:** count only cases whose event (Preferred Term) belongs to the safety topic named in the brief. A line listing pulled by a broad filter (for example SOC) can contain unrelated events. Treat any data-management note asking for a relevance review as an instruction to filter. Log each excluded row and the reason it was excluded.
- **Deduplicate by Case ID:** each Case ID is one case. A follow-up updates its initial report, so use the most recent report's outcome and details.
- **Interval vs cumulative:**
  - Interval cases are those with onset inside the reporting interval.
  - Cumulative cases are all unique topic cases up to the data lock point.
- **Cross-checks** (recorded in the sheet):
  - Prior-report cumulative + current interval should equal the line-listing cumulative count.
  - Topic serious counts must not exceed the all-event serious adverse-reaction totals for the same period.
- **Reporting rate:** interval topic serious cases ÷ interval patient-years × 1,000, expressed per 1,000 patient-years to two decimals. Compare it with the prior period's rate.

Save the consolidated sheet to `output/pbrer-No<N>_<YYYY>_consolidated-data.md` (see Step 5 for how `<N>` and `<YYYY>` are set). The sheet is a working file, so the draft's formatting and caveat rules do not apply to it.

---

## Step 3 — Draft the sections

### Content rules

- **The template decides what each section says.**
  - Each section contains the elements `template_pbrer-sections.md` lists for it, in the template's order, and nothing else.
  - The only additions allowed are the ones the section specs below require: the EU grouping and the withdrawal count in Section 2; the clinical-trial interval enrolment and the closing disclosure in Section 3; and the topic case counts in the Section 1 adverse-reaction bullet.
  - If these specs and the template disagree on content, follow the template. The one exception is caveats, covered in the next rule.
  - If the prior report leaves out an element the template requires, include it anyway, written in the prior report's style.
- **Keep caveats out of the draft.**
  - Caveats, data-quality notes, source conflicts, case-handling notes (deduplication, exclusions) and cross-check results never appear in the PBRER draft. This overrides the template's Section 3 instruction to flag caveated figures.
  - All of these belong in the caveats log and the chat summary.

### Formatting and length rules

The prior report decides how each section reads: its form (prose or bullets), tone, phrasing, level of detail and length.

- Start the document with a title header: `# PBRER No. <N> — <active substance> — Sections 1–4 (first-pass draft)`. Under it, add one line giving the reporting interval and the data lock point.
- Give each section a header, `## Section <n> — <name>`, and **write it in the same form the prior report uses for that section**: prose where the prior report uses prose, and single-level bullets only where it uses bullets. For example, in PBRER No. 2, Section 1 is bullets, Sections 2 and 3 are prose paragraphs, and Section 4 is six short paragraphs, each led by a bold sub-heading.
  - **No sub-bullets or indented bullets anywhere.**
  - No tables, blockquotes, code blocks, horizontal rules or images.
  - In a prose section, read "bullet" in the section specs below as "a sentence or a short group of sentences".
- Each bullet, and each Section 4 paragraph, begins with a **bold header** that names its template element. Bold is allowed only for these headers and the **DATA MISSING:** label.
- **One bullet (or, in prose, one sentence group) per template element.**
  - Keep each element to one to three sentences.
  - The Section 4 "New information in the interval" bullet may run to four sentences.
  - Keep the whole draft close to the prior report's length, and no more than 1.5× its word count for the same four sections.
- Write in a professional regulatory tone and match the prior report's phrasing.
- Write dates as DD-Mon-YYYY.
- Every figure must come from the consolidated sheet.

Draft Sections 2, 3 and 4 first, then Section 1. The Executive Summary must pull its figures from the finished sections.

### Section 1 — Executive Summary

Use one bullet for each element of the template, in template order:

- **Active substance / class / formulation:** substance; therapeutic class and ATC; formulation(s) and strength(s).
- **Brand names.**
- **Marketing authorisation holder(s).**
- **IBD / EURD / report / interval.**
- **Worldwide MA status:** countries authorised and marketed, in one line. This must match Section 2.
- **Regulatory highlights this interval:** new authorisations; the number of withdrawals, suspensions and revocations; actions taken for safety reasons, in brief. All of these must match Section 2.
- **Estimated exposure:** interval and cumulative patient-years. These must be identical to Section 3.
- **Adverse reactions:** all-event serious and non-serious counts, interval and cumulative. Add the serious topic case counts (interval, cumulative and fatal), which must be identical to Section 4.
- **Overall benefit-risk:** one line, consistent with Section 4's benefit-risk conclusion.

### Section 2 — Worldwide MA Status + Actions Taken for Safety Reasons

- **Worldwide MA status:**
  - Countries authorised and marketed as of the data lock point, plus a representative list.
  - In the list, group EU member states as one entry with the countries in parentheses, for example "EU (Germany, France, Spain, Italy)", and list the other countries individually.
- **New authorisations:** country, brand and authorisation date for each. If there were none, say "None."
- **Withdrawals, suspensions and revocations:** state the count explicitly, including when it is zero. For each one, give the country, the date and whether it was for safety reasons.
- **Actions taken for safety reasons:**
  - Always include this bullet.
  - Use one bullet per action. Each gives the date, who acted, the trigger, what was done, the current status (ongoing or implemented) and whether the RSI changed.
  - Do not describe an ongoing review as "no action".
  - Only if there were none, state: "No actions were taken for safety reasons during the interval."

### Section 3 — Estimated Exposure

- **Interval patient exposure:** total patient-years, with the method stated: 1 dispensed pack = 1 patient-month; patient-years = total packs ÷ 12.
- **Cumulative patient exposure:** total patient-years, with its derivation: prior-report cumulative + interval.
- **Clinical-trial exposure:** cumulative subjects exposed, and the number enrolled during the interval.
- **Final bullet, verbatim:** "Exposure figures are estimates derived from sales and should be interpreted with caution."

The regional breakdown, the caveated regions and the cross-checks go in the sheet and chat, not in this section.

### Section 4 — Signal & Risk Evaluation + Benefit-Risk Conclusion (<safety topic>)

Use exactly six short paragraphs, in this order, each beginning with its bold sub-heading, as the prior report does:

- **1. Risk and current status:** the risk's status per the RSI, and current risk minimisation.
- **2. New information in the interval:** the number of unique serious topic cases with onset in the interval; their key features (Case IDs, Preferred Terms, outcomes); and explicit mention of any fatal or notable case.
- **3. Cumulative experience:** the cumulative unique serious topic case count and its pattern, and how the interval compares with the prior interval.
- **4. Reporting rate:**
   - The interval rate calculated from the Section 3 exposure, and the prior period's rate.
   - The prior report's standard limitation statement: spontaneous reports under-estimate true incidence, so interpret with caution.
   - If the rate cannot be computed, say so.
- **5. Evaluation:** what the interval data mean, and what is new or changed compared with the prior period.
- **6. Benefit-risk conclusion:** the effect, if any, on the benefit-risk balance, and the proposed action or a reasoned statement that none is warranted.

### Benefit-risk rules

- **Never copy the prior evaluation or conclusion.** Re-derive both from this period's data every time.
- **When the conclusion must change:** in any of the situations below, the conclusion must say what happened, and must not state "no new safety concerns" or "no change proposed" without qualification. It must state what is pending.
  - The interval has a fatal or life-threatening topic case.
  - A health authority made a request about the topic, or a safety action was taken on it.
  - The reporting rate increased.
  - A review of the RSI or of risk minimisation is still ongoing.
- **Keep the conclusion measured.** Don't overstate it; for example, don't declare a change in the benefit-risk balance that the data do not support. Don't understate it either.

---

## Step 4 — Quality checks (all must pass before output)

Run every check below against the full draft, and record pass or fail with the evidence in the sheet.

- If any check fails, revise the draft and then re-run **all** the checks, because a fix in one section can break reconciliation in another. Repeat until every check passes.
- Do not deliver a draft with a failing check.
- A check that depends on an input the user confirmed is unavailable passes only under two conditions: every template-required element affected is tagged **DATA MISSING:**, and no value has been invented.

### A. Across all four sections (quality bar)

- [ ] **A1 — Numbers reconcile across sections.** This is the most important check.
  - [ ] Interval exposure in Section 1 = Section 3.
  - [ ] Cumulative exposure in Section 1 = Section 3.
  - [ ] Serious topic case counts (interval, cumulative and fatal) in Section 1 = Section 4.
  - [ ] The safety action in Section 1 = Section 2.
  - [ ] MA counts and new authorisations in Section 1 = Section 2.
  - [ ] The reporting rate in Section 4 = the interval case count ÷ the Section 3 interval patient-years × 1,000.
  - [ ] The Section 1 benefit-risk line is consistent with Section 4.
  - [ ] Topic serious counts are ≤ the all-event serious adverse-reaction totals for the same period.
- [ ] **A2 — Follows the template.**
  - [ ] All four sections are present, in order.
  - [ ] Each section contains every template element (or the element is tagged **DATA MISSING:**). The one exception is the template's Section 3 "flag caveated figures" element: as the Step 3 content rules specify, it is met by the caveats log and the chat summary, not by the draft.
  - [ ] Nothing beyond the template's elements appears, apart from the additions this skill allows.
- [ ] **A3 — Only states what the sources support.**
  - [ ] Every figure and fact traces to the consolidated sheet.
  - [ ] No invented numbers or facts.
  - [ ] Gaps are recorded in the sheet and in chat, not filled.
- [ ] **A4 — Builds off the prior report.**
  - [ ] Cumulative exposure = prior cumulative + interval.
  - [ ] Cumulative topic cases = prior cumulative + interval (or the discrepancy is logged).

### B. Section-specific (quality bar)

- [ ] **B1 — Exposure.**
  - [ ] All regions are aggregated in the total.
  - [ ] Packs ÷ 12 is applied.
  - [ ] Every caveated or missing region is in the caveats log and the chat summary; none is silently dropped.
- [ ] **B2 — MA status / actions.**
  - [ ] New authorisation(s) are picked up.
  - [ ] Withdrawals are stated explicitly, with a count, even when the count is zero.
  - [ ] Every action taken for safety reasons in the interval is surfaced.
- [ ] **B3 — Risk section.**
  - [ ] Each case is counted once (deduplicated by Case ID, using the latest follow-up).
  - [ ] Only topic cases are counted, and exclusions are logged in the sheet.
  - [ ] Interval and cumulative counts are separated.
  - [ ] Fatal cases are surfaced.
  - [ ] The reporting rate is computed from the Section 3 exposure.
- [ ] **B4 — Benefit-risk conclusion.**
  - [ ] It is measured and true to this period's data.
  - [ ] No prior conclusion is carried forward when this period's data contradict it.

### C. Format and required content (this skill)

- [ ] **C1 — Format.**
  - [ ] Each section uses the same form as the prior report's section: prose where it uses prose, single-level bullets where it uses bullets.
  - [ ] No sub-bullets or indented lines, tables, blockquotes, code blocks or rules.
  - [ ] Bold appears only on bullet headers, Section 4 sub-headings and **DATA MISSING:** labels.
- [ ] **C2 — No caveats in the draft.**
  - [ ] No "DATA CAVEAT" anywhere in the draft.
  - [ ] No data-quality notes, source conflicts, case-handling notes or cross-check results in the draft.
  - [ ] Every **DATA MISSING:** tag is for a template-required element of an input the user confirmed is unavailable.
- [ ] **C3 — Length.**
  - [ ] There is one bullet per template element.
  - [ ] Each element is three sentences or fewer (four for Section 4's "New information").
  - [ ] The draft is no more than 1.5× the prior report's word count for the same sections.
- [ ] **C4 — Section 2.**
  - [ ] EU member states are grouped as "EU (…)".
  - [ ] A withdrawal / suspension / revocation count is present.
  - [ ] Every safety action is called out, with its date, actor, trigger, status and RSI impact, or the explicit "none" statement is present when the file confirms there were none.
- [ ] **C5 — Section 3.**
  - [ ] Exposure is stated in patient-years (packs ÷ 12).
  - [ ] Cumulative clinical-trial exposure and interval enrolment are present.
  - [ ] The section ends with exactly "Exposure figures are estimates derived from sales and should be interpreted with caution."
- [ ] **C6 — Section 4.** Exactly six paragraphs, in order, with the exact sub-heading names above.
- [ ] **C7 — Prior report.** The prior PBRER was validated as input 6 (report number N−1, contiguous interval), and its baseline values appear in the sheet.

---

## Step 5 — Deliver

- Save the draft as **`output/pbrer-No<N>_<YYYY>.md`**.
  - `<N>` is the number of this report, from the brief or, without one, the prior report's number plus one.
  - `<YYYY>` is the year of this report's reporting interval (the year of the data lock point).
  - For example, PBRER No. 3 with an interval of 01-Jan-2025 to 31-Dec-2025 is saved as `output/pbrer-No3_2025.md`.
  - The consolidated sheet uses the same stem, `output/pbrer-No<N>_<YYYY>_consolidated-data.md`, and is already in `output/` from Step 2.
- In chat, give the user:
  - **File locations:** where the draft and the consolidated sheet are saved.
  - **Check results:** confirmation that all checks pass, and how many revision rounds it took.
  - **Missing inputs:** every input the user confirmed is unavailable.
  - **Caveats:** every entry in the caveats log. The chat and the sheet are the only places caveats are reported, so list them all.
  - **Judgment calls for human review:** for example, which line-listing rows were excluded from the topic and why, and the benefit-risk wording.
