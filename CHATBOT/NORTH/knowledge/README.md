# Gopalan Pre-University College, Yelahanka (North Campus): Chatbot Source Pack

Crawl date: 28 October 2026
Scope: https://gopalanpucnorth.com/ only. This pack is for the North Campus (Yelahanka) chatbot. It must not contain or be mixed with facts about any other Gopalan campus or institution.

## Contents
- `college_knowledge_base.md`: topic-based knowledge base (institution, contacts, courses, facilities, transport, hostel, admissions, fees policy, leadership, events, vision and mission, campus visits). Parsed by the app on `## ` headings.
- `courses_and_curriculum.md`: detailed Science and Commerce course content, integrated coaching, languages and career paths. Parsed on `## ` headings.
- `rules_and_regulations.md`: rules published on the North website. Parsed on `## ` headings.
- `faq_seed.json`: approved FAQ answers looked up by id (campus "Yelahanka").
- `faculty_directory.csv`: leadership, faculty and administrative staff from the Our Faculties and About pages.
- `event_archive.csv`: events published on the North website.
- `source_registry.csv`: every North page crawled, with fetch status and notes.
- `full_site_content_snapshot.md`: page-by-page notes of the North website.
- `chatbot_guardrails.md`: scope, grounding and campus-boundary rules for the bot.
- `data_gaps_and_verification.md`: open gaps and inconsistencies on the North website that staff should resolve.

## Method
Pages were discovered from the site navigation, /sitemap.xml, /sitemap_index.xml and /page-sitemap.xml, downloaded as HTML and converted to text. Banner images on the home page were viewed to read their text. Forms were not submitted. Only facts present on the North website were used; where the site gives no information (fees, office hours, transport routes, hostel, document checklist), the files say so and direct users to the North help desk.

## Format notes for editors
- In the three `.md` knowledge files, any section whose body contains the word "verify" or "hold" (any case) is treated by the app as unconfirmed. Use VERIFY only for facts that genuinely need staff confirmation.
- `faculty_directory.csv` header: Name,Designation,Department,Qualification,Experience,Campus. Quote fields that contain commas.
- `event_archive.csv` header: Event_Name,Category,Campus,Status.
