# Gopalan PU College (Whitefield) — Data Gaps & Verification Audit

**Audited Website:** https://www.gopalancolleges.com/gpuc/
**Audit Date:** 28 October 2026 (live re-crawl)
**Objective:** Record the facts confirmed on the live site, what the site does not publish, template noise to ignore, and items that need staff confirmation.

---

## 1. Facts Confirmed on the Live Website

| Category | Value | Source page |
| :--- | :--- | :--- |
| **Institution Name** | Gopalan Pre-University College, Whitefield, Bangalore | about-us.html |
| **Address** | 181/1, 182/1, Behind SAP Labs, Seetharam Palya, Basavanagar, Hoodi, Bangalore - 560 048 | contact-us.html |
| **Footer Address** | 181/1, 182/1, Hoodi Village, Sonnenahalli, K.R. Puram, Bangalore - 560 048 | all pages |
| **Director** | Mrs. Sunita Prabhakar, Director, Gopalan Foundation | director-message.html |
| **Principal** | Dr. Kanchana A S | principal-message.html, faculty.html |
| **Academic Head** | Mr. Mahesh (MSc, MPhil, BEd — Chemistry, 21 years) | faculty.html |
| **Science Coordinator** | Mr. Krishna Murthy Goud (MSc, SET — Chemistry, 14 years) | faculty.html |
| **Commerce Co-ordinator** | Ms. Lekha K S (M.Com, B.Ed — Business Studies, 8 years) | faculty.html |
| **SPOC** | Mr. Aravind, +91 63621 66945, admin@gopalanpucollege.com | contact-us.html |
| **Admissions Phone** | +91 96069 41908, (080) 41280227 | contact-us.html |
| **Header Phone** | +91 96069 41907 | all pages |
| **WhatsApp** | +91 81051 31098 | floating button, all pages |
| **Admissions Email** | admission_gpuc@gopalanpucollege.com | email icon, all pages |
| **Careers Email** | careers@gopalancolleges.com | career.html |
| **Science** | PCMB, PCMC; NEET (PCMB), JEE & KCET (PCMB & PCMC) coaching | science-courses.html |
| **Commerce** | CEBA, SEBA, MEBA; CA Foundation coaching | commerce-courses.html |
| **Languages** | I: English (mandatory); II: Kannada / Hindi / Sanskrit / French | course pages |
| **Value-Added Courses** | NATA, Data Analytics with Advanced Excel, Tally, Introduction to Data Science, Coursera | value-added-courses.html |
| **Eligibility** | Karnataka SSLC or equivalent recognised by the Department of PU Education, Karnataka | admission.html |
| **Facilities** | Football, cricket, cafeteria, table tennis, lawn tennis, badminton, science labs, library, gymnastics, girls-only hostel, amphitheatre, GPS transport | facilities.html |
| **Admissions Cycle** | "Admissions Open for the Academic Year 2027-2028" | index.html |

---

## 2. Not Published on the Website (do not invent)
- **Office / visiting hours** — none on any page. Earlier files stated "Monday to Saturday, 8:30 AM to 5:00 PM"; this is not on the site and was removed. VERIFY with the college before publishing any hours.
- **Fee amounts** (tuition, coaching, transport, hostel) — none published. Merit-based scholarships are mentioned without criteria.
- **Bus routes, stops and timings** — the site only says "GPS-enabled transport ... across key city routes". Earlier files listed specific localities; these were not on the site and were removed.
- **Hostel fees / capacity** — only "exclusively for girls" is published.
- **Principal's qualification and experience** — present only inside an HTML comment on faculty.html (M.Sc, M.Ed; Biology/Chemistry; 12 years); not shown to visitors, so not used. VERIFY before using.
- **Event dates and descriptions** — event pages are photo galleries only.
- **Affiliation / recognition statement, seat counts, results, admission dates** — not published.

---

## 3. Template Artifacts & Noise to Discard
- **Travel-agency template text** ("GoFly Travel Agency", "Robert Harringson", "Thomas Cook", "Flat 30% Discounts", London address) remains inside HTML comments ("GoFly" on almost every page; "Robert Harringson" on about-us, director-message and principal-message; "Thomas Cook" / "Flat 30%" on about-us; the London address on contact-us and index). It is not visible to visitors and must never be used.
- **Facilities page, Football Ground caption** reads "Nature, Culture & Thrill: Travel Stories Inspire is a collection of experiences from explorers." — visible template text; ignore.
- **tripadvisor.com / trustpilot.com links** in the theme — not GPUC channels.
- **Redirecting links:** campus-life.html, contact.html, placement.html, testimonial.html, travel-package-01.html, travel-package-details.html all redirect (HTTP 302) to the group home page.

---

## 4. Conflicting or Out-of-Place Pages (not used)
- **leadership-message.html** — not linked from the site menu (the "Leadership Message" menu item opens director-message.html and principal-message.html). It shows an older principal's message signed "Mrs. Sangeeta Upadhyaya, Principal". The linked principal page and the faculty page both name **Dr. Kanchana A S**, which is used. VERIFY that the orphan page is retired.
- **how-to-apply.html** — not linked from the menu (the "How to Apply" link goes to admission.html). Its content is for Gopalan College of Commerce degree admissions (Class 12 eligibility, NRI/PIO documents), not for PU admissions. Not used.
- **Pop-up footer text** says "We are Gopalan College of Commerce..." on most pages and shows **gccprincipal@gopalancolleges.com**. This is the degree college's email, not a PU contact; the bot should use admission_gpuc@gopalanpucollege.com instead.
- **Fee Payment link** points to https://gcc.pupilpod.net/home.php (a shared Gopalan portal).

---

## 5. Items for Staff to Confirm
1. VERIFY official office/visiting hours so they can be added.
2. VERIFY whether +91 96069 41907 (header) and +91 96069 41908 (contact page) are both admissions lines.
3. VERIFY transport routes and hostel details if the bot should give more than the website states.
4. VERIFY that leadership-message.html and how-to-apply.html can be removed from the live site.
