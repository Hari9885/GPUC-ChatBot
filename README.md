# GPUC-ChatBot: Official AI Assistant for Gopalan Pre-University College

An intelligent, grounded conversational assistant and admissions inquiry management system built for **Gopalan Pre-University College (GPUC)**, Bengaluru.

---

## 🌟 Overview

The **GPUC AI Assistant** provides parents and prospective students with real-time, verified information about admissions, academic streams, integrated coaching, campus facilities, and appointments.

### Key Capabilities
- **Direct Informational Responses**: Basic questions (location, courses, fees, timings, hostel, facilities) are answered directly without gating users behind a lead capture form.
- **Strict Response Guardrails**: Every answer strictly conforms to a **maximum of 3 lines** with **zero asterisks** (`*` or `**`) and non-breaking phone formatting.
- **Natural Interaction**: Includes a 1.5-second bouncing dots typing indicator for a natural, humanized conversational cadence.
- **3-Step Appointment & Inquiry Funnel**: When users explicitly request a campus visit, consultation, or application, a streamlined step-by-step funnel captures:
  1. Student Name
  2. Parent / Guardian Name & 10-digit Mobile Number
  3. Target Class (1st PU / 2nd PU) & Inquiry Purpose
- **Local CRM & Appointment Booking**: Complete database backend tracking student inquiries, scheduled campus visit slots, parent feedback, and messaging logs.

---

## 🏛️ Official Academic Offerings

### Science Stream
- **PCMB**: Physics, Chemistry, Mathematics, Biology
- **PCMC**: Physics, Chemistry, Mathematics, Computer Science
- **Integrated Coaching**:
  - NEET Coaching (for PCMB students)
  - JEE & KCET Coaching (for PCMB & PCMC students)

### Commerce Stream
- **CEBA**: Computer Science, Economics, Business Studies, Accountancy
- **SEBA**: Statistics, Economics, Business Studies, Accountancy
- **MEBA**: Mathematics, Economics, Business Studies, Accountancy
- **Professional Preparation**: Integrated CA Foundation coaching

### Languages
- **Mandatory I Language**: English
- **Elective II Language**: Kannada, Hindi, Sanskrit, or French

---

## 📞 Admissions & Contact Details

- **Campus Address**: 181/1, 182/1, Behind SAP Labs, Seetharam Palya, Basavanagar, Hoodi, Bengaluru – 560048
- **Admissions Help Desk**: `+91 96069 41908`
- **Help Desk Working Hours**: Monday to Friday, 8:30 AM to 5:00 PM
- **Campus Visiting Hours**: Monday to Saturday, 9:00 AM to 4:00 PM
- **Official Email**: `admin@gopalanpucollege.com`

---

## 🗄️ Database & Knowledge Base Architecture

### 1. School Data & Sources (`Gopalan_PU_Chatbot_Sources 2/`)
- `college_knowledge_base.md`: Grounded factual information about GPUC vision, streams, eligibility, and facilities.
- `faq_seed.json`: Approved institutional FAQs with verified responses.
- `faculty_directory.csv`: Directory of faculty members, departments, qualifications, and experience.
- `event_archive.csv`: Archive of college events, ceremonies, and co-curricular activities.
- `chatbot_guardrails.md`: Institutional policy and truth hierarchy guardrails.

### 2. CRM Database (`data/db.json`)
- **`inquiries`**: Lead records including student name, parent contact, class preference, and interaction notes.
- **`appointments`**: Confirmed campus visit and consultation bookings.
- **`slots`**: Real-time availability for admission and academic consultation slots.
- **`feedback`**: User feedback ratings and comments.
- **`messages`**: Log of dispatched SMS/WhatsApp and email notifications.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
git clone https://github.com/Hari9885/GPUC-ChatBot.git
cd GPUC-ChatBot
npm install
```

### Environment Setup
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_COLLEGE_NAME="Gopalan Pre-University College"
NEXT_PUBLIC_COLLEGE_CODE="GPUC"
NEXT_PUBLIC_CAMPUS_LOCATION="Hoodi, Whitefield, Bengaluru"
```

### Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the college portal and chat widget.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (High-contrast, responsive, glassmorphic design)
- **AI / LLM**: Google Gemini API (`gemini-flash-lite-latest`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`) with Hybrid RAG & Tool Calling
- **Icons**: Lucide React
