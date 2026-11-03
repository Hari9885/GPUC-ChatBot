# CHATBOT/SOUTH — Gopalan Pre-University College (Whitefield Campus) Knowledge Files

Knowledge files for the **Gopalan Pre-University College, Whitefield (Hoodi) campus** chatbot.
All content is taken only from the official campus website https://www.gopalancolleges.com/gpuc/ (re-crawled 28 October 2026).

> [!IMPORTANT]
> **Strict campus boundary:** This chatbot covers the Whitefield campus only. These files must not contain facts about any other Gopalan campus or institution.

---

## 1. Campus Snapshot (from the live website)

| Detail | Whitefield Campus |
| :--- | :--- |
| **Address** | 181/1, 182/1, Behind SAP Labs, Seetharam Palya, Basavanagar, Hoodi, Bangalore - 560 048 |
| **Director** | Mrs. Sunita Prabhakar (Director, Gopalan Foundation) |
| **Principal** | Dr. Kanchana A S |
| **Academic Head** | Mr. Mahesh (Chemistry; MSc, MPhil, BEd; 21 years) |
| **Admissions phone** | +91 96069 41908 / (080) 41280227 |
| **Header phone** | +91 96069 41907 |
| **WhatsApp** | +91 81051 31098 |
| **SPOC** | Mr. Aravind, +91 63621 66945, admin@gopalanpucollege.com |
| **Admissions email** | admission_gpuc@gopalanpucollege.com |
| **Office hours** | Not published on the website |
| **Science** | PCMB, PCMC + NEET (PCMB), JEE and KCET (PCMB & PCMC) coaching |
| **Commerce** | CEBA, SEBA, MEBA + CA Foundation coaching |
| **Languages** | English (I, mandatory) + Kannada / Hindi / Sanskrit / French (II) |
| **Value-added** | NATA, Data Analytics with Advanced Excel, Tally, Introduction to Data Science, Coursera |
| **Hostel** | Girls only |
| **Transport** | GPS-enabled, key city routes (routes not published) |
| **Fees** | Not published — contact the admissions desk |

---

## 2. Files

```
CHATBOT/SOUTH/knowledge/
├── README.md                       <- This overview
├── college_knowledge_base.md       <- Main knowledge base ("## " sections, parsed by src/lib/knowledge.ts)
├── courses_and_curriculum.md       <- Science, Commerce, coaching, languages, value-added courses
├── rules_and_regulations.md        <- Rules & regulations page, section by section
├── faq_seed.json                   <- 29 FAQ entries (ids used by src/lib/claude.ts)
├── faculty_directory.csv           <- 38 staff from the Faculty page
├── event_archive.csv               <- 18 events from the Events page
├── source_registry.csv             <- Every URL crawled, fetch result and notes
├── web_link_and_control_audit.csv  <- Links, phone and email channels found on the site
├── chatbot_guardrails.md           <- Behaviour rules, scope boundary, refusals, privacy
└── data_gaps_and_verification.md   <- What the website does not say, template noise, items for staff to confirm
```

Format notes for the app:
- Markdown files are split on `\n## `; a section whose body contains "verify" or "hold" is marked as unverified, so those words are avoided in the parsed markdown files unless a fact truly needs staff confirmation.
- `faculty_directory.csv` header: `Name,Designation,Department,Qualification,Experience,Campus`.
- `event_archive.csv` header: `Event_Name,Category,Campus,Status`.

---

## 3. Crawl Notes
- 19 content pages and 18 event pages fetched successfully (HTTP 200).
- campus-life.html, contact.html, placement.html, testimonial.html, travel-package-01.html and travel-package-details.html redirect (HTTP 302) to the group home page and contain no college content.
- leadership-message.html and how-to-apply.html exist but are not linked from the site menu and contain outdated or other-institution content; they were not used. See `data_gaps_and_verification.md`.
- Raw HTML was saved outside the repo (`/tmp/south_crawl/`); a local mirror also exists at `GPUC-SOUTH/gpuc/` but was not needed.
