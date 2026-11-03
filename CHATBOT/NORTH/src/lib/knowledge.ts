import fs from 'fs';
import path from 'path';

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  sourceUrl: string;
  status: 'approved' | 'draft_verify' | 'fallback_until_verified';
}

export interface FAQItem {
  id: string;
  intent: string;
  question: string;
  answer: string;
  source_url: string;
  release_status: string;
}

export interface FacultyMember {
  name: string;
  role: string;
  department: string;
  qualification: string;
  experience: string;
  status: string;
}

export interface CollegeEvent {
  title: string;
  url: string;
  year: string;
  status: string;
}

// In-memory cached knowledge base
let cachedKnowledge: KnowledgeItem[] | null = null;
let cachedFAQs: FAQItem[] | null = null;
let cachedFaculty: FacultyMember[] | null = null;
let cachedEvents: CollegeEvent[] | null = null;

function parseMarkdownSections(filePath: string, sourceUrl: string, prefix: string): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const sections = content.split(/\n##\s+/);

      sections.forEach((sec, idx) => {
        if (!sec.trim()) return;
        const lines = sec.split('\n');
        const title = lines[0].replace(/^#+\s*/, '').trim();
        const body = lines.slice(1).join('\n').trim();

        if (title && body) {
          items.push({
            id: `${prefix}_${idx}`,
            category: title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            title: title,
            content: body,
            sourceUrl: sourceUrl,
            status: body.toLowerCase().includes('hold') || body.toLowerCase().includes('verify') ? 'draft_verify' : 'approved',
          });
        }
      });
    }
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err);
  }
  return items;
}

export function loadKnowledgeBase(): KnowledgeItem[] {
  if (cachedKnowledge) return cachedKnowledge;

  const items: KnowledgeItem[] = [];
  const knowledgeDir = path.join(process.cwd(), 'knowledge');

  // 1. College Knowledge Base (Yelahanka Campus)
  items.push(
    ...parseMarkdownSections(
      path.join(knowledgeDir, 'college_knowledge_base.md'),
      'https://gopalanpucnorth.com/',
      'kb_north'
    )
  );

  // 2. Courses & Curriculum
  items.push(
    ...parseMarkdownSections(
      path.join(knowledgeDir, 'courses_and_curriculum.md'),
      'https://gopalanpucnorth.com/courses-offered/',
      'curriculum'
    )
  );

  // 3. Rules & Regulations
  items.push(
    ...parseMarkdownSections(
      path.join(knowledgeDir, 'rules_and_regulations.md'),
      'https://gopalanpucnorth.com/rules-and-regulations/',
      'rules'
    )
  );

  // 4. College Events & Activities
  const events = loadEvents();
  if (events.length > 0) {
    items.push({
      id: 'kb_sec_events',
      category: 'events_and_activities',
      title: 'College Events & Activities',
      content: `Gopalan Pre-University College (Yelahanka Campus) events published on the website: ${events.map((e) => e.title).join(', ')}.`,
      sourceUrl: 'https://gopalanpucnorth.com/events/',
      status: 'approved',
    });
  }

  cachedKnowledge = items;
  return items;
}

export function loadFAQs(): FAQItem[] {
  if (cachedFAQs) return cachedFAQs;

  const knowledgeDir = path.join(process.cwd(), 'knowledge');
  const faqPath = path.join(knowledgeDir, 'faq_seed.json');

  try {
    if (fs.existsSync(faqPath)) {
      const raw = fs.readFileSync(faqPath, 'utf8');
      cachedFAQs = JSON.parse(raw);
      return cachedFAQs || [];
    }
  } catch (err) {
    console.error('Error loading faq_seed.json:', err);
  }

  return [];
}

export function loadFaculty(): FacultyMember[] {
  if (cachedFaculty) return cachedFaculty;

  const knowledgeDir = path.join(process.cwd(), 'knowledge');
  const facultyPath = path.join(knowledgeDir, 'faculty_directory.csv');
  const list: FacultyMember[] = [];

  try {
    if (fs.existsSync(facultyPath)) {
      const raw = fs.readFileSync(facultyPath, 'utf8');
      const lines = raw.split('\n').filter((l) => l.trim().length > 0);
      // Header: Name,Designation,Department,Qualification,Experience,Campus
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
          list.push({
            name: parts[0] || '',
            role: parts[1] || 'Faculty',
            department: parts[2] || 'Academics',
            qualification: parts[3] || '',
            experience: parts[4] || '',
            status: 'approved',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error loading faculty_directory.csv:', err);
  }

  cachedFaculty = list;
  return list;
}

export function loadEvents(): CollegeEvent[] {
  if (cachedEvents) return cachedEvents;

  const knowledgeDir = path.join(process.cwd(), 'knowledge');
  const eventsPath = path.join(knowledgeDir, 'event_archive.csv');
  const list: CollegeEvent[] = [];

  try {
    if (fs.existsSync(eventsPath)) {
      const raw = fs.readFileSync(eventsPath, 'utf8');
      const lines = raw.split('\n').filter((l) => l.trim().length > 0);
      // Header: Event_Name,Category,Campus,Status
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
          list.push({
            title: parts[0] || '',
            url: 'https://gopalanpucnorth.com/events/',
            year: '2025-2026',
            status: parts[3] || 'approved',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error loading event_archive.csv:', err);
  }

  cachedEvents = list;
  return list;
}

export function searchKnowledge(query: string, limit: number = 4): KnowledgeItem[] {
  const items = loadKnowledgeBase();
  const lowerQuery = query.toLowerCase();
  const queryTokens = lowerQuery.split(/\s+/).filter((t) => t.length > 2);

  const scored = items.map((item) => {
    let score = 0;
    const lowerTitle = item.title.toLowerCase();
    const lowerContent = item.content.toLowerCase();

    if (lowerTitle.includes(lowerQuery)) score += 10;
    if (lowerContent.includes(lowerQuery)) score += 5;

    for (const token of queryTokens) {
      if (lowerTitle.includes(token)) score += 3;
      if (lowerContent.includes(token)) score += 1;
    }

    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}
