# GPUC-SOUTH — Gopalan Pre-University College (Whitefield Campus) Knowledge & Data Extraction Repository

This repository contains the complete extracted data, institutional ground truths, academic rules, curriculum details, faculty directory, event archives, and chatbot guardrails for **Gopalan Pre-University College (GPUC), Whitefield Campus (South)**.

> [!IMPORTANT]
> **Complete North Campus Isolation:**  
> This directory (`GPUC-SOUTH`) is entirely self-contained and **does not affect or modify** any files of the North Campus (`GPUC-NORTH`, `src/`, `data/`, or `Gopalan_PU_Chatbot_Sources 2`). Both campus datasets remain clean, segregated, and independent.

---

## 1. Quick Campus Comparison (North vs. South/Whitefield)

| Feature / Detail | North Campus (Yelahanka) | South Campus (Whitefield) |
| :--- | :--- | :--- |
| **Location** | No. 79, Mavallipura, Hesaragatta Hobli, Yelahanka | 181/1, 182/1, Behind SAP Labs, Seetharam Palya, Hoodi, Whitefield |
| **Primary Region** | Bengaluru North | Bengaluru East |
| **Principal** | Mr. M. Mahesh | Dr. Kanchana A S |
| **Academic Head** | — | Mr. Mahesh (Chemistry, MSc, MPhil, BEd - 21 Years) |
| **Science Coordinator** | — | Mr. Krishna Murthy Goud (Chemistry, MSc, SET - 14 Years) |
| **Admin SPOC** | Help Desk Team | Mr. Aravind (+91 63621 66945 / admin@gopalanpucollege.com) |
| **Admissions Helpline**| +91 81053 88193 / +91 81230 40418 / +91 96320 70209 | +91 96069 41908 / +91 96069 41907 / (080) 41280227 |
| **Admissions WhatsApp**| North Campus Support | +91 8105131098 |
| **Admissions Email** | `gpuc.north@gopalanpucollege.com` | `admission_gpuc@gopalanpucollege.com` |
| **Website** | `https://gopalanpucnorth.com/` | `https://www.gopalancolleges.com/gpuc/` |
| **Science Streams** | PCMB, PCMC | PCMB, PCMC |
| **Integrated Coaching**| NEET, JEE (Main & Adv), KCET | NEET, JEE (Main & Adv), KCET |
| **Commerce Streams** | CEBA | **CEBA, SEBA, MEBA** |
| **CA Preparation** | Referral / External | **Integrated CA Foundation Coaching** |
| **Languages Offered** | English + Kannada, Hindi | English + **Kannada, Hindi, Sanskrit, French** |
| **Value-Added Courses**| Standard Campus Enrichment | **NATA, Advanced Excel Data Analytics, Tally, Data Science, Coursera** |
| **Sports Arena** | Sports Field & Courts | **Dedicated Football Ground, Cricket Ground, Lawn Tennis, Badminton, Table Tennis** |
| **Cell Phone Policy** | Strict Campus Prohibition | **Confiscation until course end OR Rs. 1,000 fine** |
| **Vehicle Policy** | No student vehicles permitted | **Two-wheelers and four-wheelers strictly prohibited for PUC students** |
| **Late Attendance** | Regular PU Board Rules | **Late reporting recorded as ABSENT for the day** |

---

## 2. Directory Structure & Extracted Artifacts

```
GPUC-SOUTH/
├── README.md                           <- Master overview, campus comparison, and integration guide (this file)
├── college_knowledge_base.md           <- Comprehensive verified knowledge base (leadership, streams, infrastructure)
├── chatbot_guardrails.md               <- Chatbot behavioral rules, domain boundaries, refusal logic & privacy
├── rules_and_regulations.md            <- Verbatim code of conduct, cell phone confiscation/fine, attendance, vehicles
├── courses_and_curriculum.md           <- In-depth syllabus breakdown: Science, Commerce, CA Foundation, Languages
├── faculty_directory.csv               <- Complete CSV directory of 38 verified faculty & leadership staff
├── event_archive.csv                   <- CSV archive of 18 campus events, orientations, ceremonies, and fests
├── faq_seed.json                       <- 18 production-ready JSON Q&A pairs tailored for Whitefield chatbot
├── source_registry.csv                 <- Registry of all 20 crawled pages, URLs, byte counts, and HTTP codes
├── web_link_and_control_audit.csv      <- Audit of 108 internal/external links, emails, and phone channels
├── data_gaps_and_verification.md       <- Analysis of web template noise (discarding "GoFly"), shared degree college links
└── raw_pages/                          <- 20 raw HTML snapshots downloaded directly from gopalancolleges.com/gpuc/
    ├── index.html
    ├── about-us.html
    ├── admission.html
    ├── campus-life.html
    ├── commerce-courses.html
    ├── contact-us.html
    ├── contact.html
    ├── director-message.html
    ├── events.html
    ├── facilities.html
    ├── faculty.html
    ├── gallery.html
    ├── placement.html
    ├── principal-message.html
    ├── rules-regulations.html
    ├── science-courses.html
    ├── testimonial.html
    ├── value-added-courses.html
    ├── vision-mission.html
    └── why-choose-us.html
```

---

## 3. Next Steps & Ready-for-Integration
When the user provides the index page and additional frontend/backend files:
1. The **Knowledge Base** (`college_knowledge_base.md`) and **FAQ Seed** (`faq_seed.json`) can be loaded directly into the AI retrieval layer.
2. The **Guardrails** (`chatbot_guardrails.md`) can be plugged into the system prompt.
3. The **Lead Capture** and appointment booking endpoints can route to Whitefield SPOC (`admin@gopalanpucollege.com` / `+91 96069 41908`).
4. All contact channels, phone numbers, and location details are verified and pre-formatted for click-to-call and click-to-chat links.
