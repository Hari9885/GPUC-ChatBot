# Gopalan PU College (Whitefield) — Data Gaps & Verification Audit

**Audited Website:** https://www.gopalancolleges.com/gpuc/  
**Audit Date:** Current Session  
**Objective:** Document verified ground truths, resolve cross-domain template artifacts, and highlight data points requiring operational verification.

---

## 1. Verified Core Ground Truths (Approved for Chatbot)
The following facts are verified across multiple live pages and institutional documents:

| Category | Verified Ground Truth |
| :--- | :--- |
| **Institution Name** | Gopalan Pre-University College (GPUC), Whitefield Campus |
| **Address** | 181/1, 182/1, Behind SAP Labs, Seetharam Palya, Basavanagar, Hoodi Village, Sonnenahalli, K.R. Puram, Whitefield, Bengaluru - 560048 |
| **Landmark** | Behind SAP Labs / Near Hoodi Junction |
| **Principal** | Dr. Kanchana A S |
| **Academic Head** | Mr. Mahesh (MSc, MPhil, BEd - Chemistry, 21+ Years Experience) |
| **Science Coordinator** | Mr. Krishna Murthy Goud (MSc, SET - Chemistry, 14+ Years Experience) |
| **Admin SPOC** | Mr. Aravind (+91 63621 66945 / admin@gopalanpucollege.com) |
| **Admissions Helpline** | +91 96069 41908 / +91 96069 41907 / (080) 41280227 |
| **Admissions WhatsApp** | +91 8105131098 |
| **Admissions Email** | admission_gpuc@gopalanpucollege.com |
| **Science Streams** | PCMB, PCMC (with integrated NEET, JEE Main/Advanced, KCET coaching) |
| **Commerce Streams** | CEBA, SEBA, MEBA (with CA Foundation coaching) |
| **Languages** | Part I: English (Mandatory) \| Part II: Kannada, Hindi, Sanskrit, French |
| **Value-Added Courses** | NATA Coaching, Data Analytics with Advanced Excel, Tally, Introduction to Data Science, Coursera |
| **Eligibility** | 10th Standard / SSLC / CBSE / ICSE pass |
| **Cell Phone Policy** | Strictly prohibited in academic areas; confiscation or Rs. 1,000 fine |
| **Vehicle Policy** | Two-wheelers and four-wheelers strictly NOT permitted for PUC students |
| **Late Attendance** | Late reporting recorded as ABSENT for the day |
| **Sports Arena** | Football Ground, Cricket Ground, Lawn Tennis, Badminton, Table Tennis |

---

## 2. Template Artifacts & Noise to Discard (CRITICAL)

During the website extraction, several residue elements from a commercial WordPress/HTML travel agency template ("GoFly") were identified in the source code of `about-us.html`, `director-message.html`, and `principal-message.html`.

### Elements to STRICTLY Exclude & Reject:
1. **"GoFly Travel Agency" / "Robert Harringson"**:
   - Residue text: *"Welcome to GoFly Travel Agency... Robert Harringson Founder at GoFly... Skyline Plaza, 5th Floor, 123 Main Street Los Angeles, CA 90001, USA"*.
   - **Resolution:** This is commercial web template placeholder dummy text. The chatbot must strictly never mention or confirm travel agency services.
2. **"Flat 30% Discounts All Packages" / "1986 Thomas Cook History"**:
   - Residue text in `about-us.html` describing travel agency milestones.
   - **Resolution:** Discard completely.
3. **London UK Address Placeholder**:
   - `contact-us.html` contains: *"3rd Floor, 15 Bedford Street Covent Garden, London, WC2E 9HE, UK"*.
   - **Resolution:** Discard. The only physical campus is in Hoodi, Whitefield, Bengaluru.

---

## 3. Cross-Institutional Linkages & Shared Campus Resources
- **Co-Located Degree College (Gopalan College of Commerce - GCC):**
  - Gopalan College of Commerce operates on the same Whitefield educational enclave.
  - The website footer references `gccprincipal@gopalancolleges.com` and `We are Gopalan College of Commerce`.
  - **Resolution:** When answering queries regarding Pre-University College admissions, always cite the dedicated PU admissions email `admission_gpuc@gopalanpucollege.com` and phone numbers `+91 96069 41908` / `+91 96069 41907`.

---

## 4. Fee Data Policy
- The official website does not publish static rupee figures for tuition fees, as fees depend on the subject combination, integrated coaching options (NEET/JEE/KCET/CA Foundation), and second language choices (e.g., French/Sanskrit).
- **Resolution:** The chatbot must never invent fee amounts or installment numbers. It must always direct parents to contact the Admissions Desk directly:
  - Phone: `+91 96069 41908` / `+91 96069 41907`
  - Email: `admission_gpuc@gopalanpucollege.com`
  - Visiting Hours: Monday to Saturday, 8:30 AM to 5:00 PM.

---

## 5. Transportation Logistics
- The college operates dedicated GPS-tracked buses across Whitefield, Hoodi, K.R. Puram, Mahadevapura, Marathahalli, CV Raman Nagar, Indiranagar, and Kadugodi.
- Exact stop-by-stop fee stages and pickup timings are allocated via the official Transportation Application Form submitted during formal admission.
