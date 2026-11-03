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

## 🗂️ Repository Layout

North and South are separate colleges, so each has its own self-contained chatbot app. Each app knows only its own campus.

```
CHATBOT/
  SOUTH/        Whitefield campus chatbot (port 3000), source site: https://www.gopalancolleges.com/gpuc/
  NORTH/        Yelahanka campus chatbot (port 3002), source site: https://gopalanpucnorth.com/
GPUC-SOUTH/     South website copy (loads the widget from localhost:3000)
GPUC-NORTH/     North WordPress site (mu-plugin loads the widget from localhost:3002)
```

Inside each app:
- `src/`, `public/`, `package.json`: the Next.js app (chat widget, Claude bot, API routes)
- `knowledge/`: campus knowledge the bot reads (`college_knowledge_base.md`, `courses_and_curriculum.md`, `rules_and_regulations.md`, `faq_seed.json`, `faculty_directory.csv`, `event_archive.csv`), crawled from that campus's website only
- `data/db.json`: leads (`inquiries`), `appointments`, `slots`, `feedback` and `messages` for that campus; `data/leads_chat_analysis.json` holds the questions each lead asked

Code is duplicated on purpose: a fix or feature must be applied to both apps.

---

## 🚀 Getting Started

Prerequisites: Node.js 18+.

```bash
git clone https://github.com/Hari9885/GPUC-ChatBot.git
cd GPUC-ChatBot/CHATBOT/SOUTH   # or CHATBOT/NORTH
npm install
```

Create `.env.local` in the app folder (see `.env.example`):
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

```bash
npm run dev
```
South opens at [http://localhost:3000](http://localhost:3000), North at [http://localhost:3002](http://localhost:3002).

---

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (High-contrast, responsive, glassmorphic design)
- **AI / LLM**: Anthropic Claude API (`claude-haiku-5-5`) with Hybrid RAG & Tool Calling
- **Icons**: Lucide React
