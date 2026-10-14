# Gopalan Pre-University College — Website Crawl Source Pack

**Crawl date:** 14 October 2026  
**Primary scope:** https://www.gopalancolleges.com/gpuc/  
**Chatbot target:** English-first, college-only assistant for parents and prospective/current students.

## Contents
- `full_site_content_snapshot.md` — page-by-page accessible content notes and link/control observations.
- `college_knowledge_base.md` — normalized topic-based knowledge base.
- `faculty_directory.csv` — faculty and non-teaching staff as listed on the accessible Faculty page.
- `event_archive.csv` — all event cards linked from the Events page and the linked detail-page URLs.
- `source_registry.csv` — source URLs and status/review notes.
- `web_link_and_control_audit.csv` — navigation, CTA, form, iframe, payment, brochure and event-link audit.
- `faq_seed.json` — initial FAQ intents, grounded draft answers, source URLs and release status.
- `chatbot_guardrails.md` — chatbot scope, grounding, action and privacy rules.
- `data_gaps_and_verification.md` — facts that must be confirmed by college staff.
- `legacy_application_form_extract.md` — search-indexed content from an older PDF; not authoritative for current admissions.

## Method and limitations
The site was reviewed page-by-page using the accessible rendered/indexed text, by opening page sections and following the event-card links, the contact map iframe, the image links sampled on the faculty/facilities pages, and the visible CTA destinations. Search was also used to locate the indexed legacy application-form PDF. The accessible page reader exposes rendered content rather than the original HTML/JavaScript source. Some dynamic form dropdown options and hidden destinations were not exposed. Public forms were not submitted; no contact details were entered; no payments were attempted.

This is a detailed crawl snapshot, not a guarantee that every hidden DOM element, script-generated URL, blocked external page, or site asset has been captured. Links whose destinations were inaccessible are explicitly marked. The live website may change after the crawl.

## Release warning
This pack is a draft source-of-truth for implementation, not an official institution-approved publication. The website has data-quality issues: generic Commerce College footer copy on GPUC pages, duplicate admission-banner text, differing phone numbers/emails, a football-facility caption that appears unrelated, and a legacy form that differs from current course information. Entries flagged `VERIFY` or `HOLD` must not be used as definitive answers until approved by an authorized college owner.

Do not use this pack as the live store for leads or appointments. Those require a secure database and working integrations.
