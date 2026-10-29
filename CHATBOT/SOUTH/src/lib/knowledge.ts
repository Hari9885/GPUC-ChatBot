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

export function loadKnowledgeBase(): KnowledgeItem[] {
  if (cachedKnowledge) return cachedKnowledge;

  const items: KnowledgeItem[] = [];
  const baseDir = path.join(process.cwd(), 'Gopalan_PU_Chatbot_Sources 2');

  try {
    const kbPath = path.join(baseDir, 'college_knowledge_base.md');
    if (fs.existsSync(kbPath)) {
      const content = fs.readFileSync(kbPath, 'utf8');
      const sections = content.split(/\n##\s+/);

      sections.forEach((sec, idx) => {
        if (!sec.trim()) return;
        const lines = sec.split('\n');
        const title = lines[0].trim();
        const body = lines.slice(1).join('\n').trim();

        items.push({
          id: `kb_sec_${idx}`,
          category: title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          title: title,
          content: body,
          sourceUrl: 'https://www.gopalancolleges.com/gpuc/',
          status: body.toLowerCase().includes('hold') || body.toLowerCase().includes('verify') ? 'draft_verify' : 'approved',
        });
      });
    }

    const events = loadEvents();
    if (events.length > 0) {
      items.push({
        id: 'kb_sec_events',
        category: 'events_and_activities',
        title: 'College Events & Activities',
        content: `Gopalan Pre-University College organises numerous academic, cultural, and sports events including: ${events.map((e) => e.title).join(', ')}.`,
        sourceUrl: 'https://www.gopalancolleges.com/gpuc/events.html',
        status: 'approved',
      });
    }
  } catch (err) {
    console.error('Error loading college_knowledge_base.md:', err);
  }

  cachedKnowledge = items;
  return items;
}

export function loadFAQs(): FAQItem[] {
  if (cachedFAQs) return cachedFAQs;

  const baseDir = path.join(process.cwd(), 'Gopalan_PU_Chatbot_Sources 2');
  const faqPath = path.join(baseDir, 'faq_seed.json');

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

  const baseDir = path.join(process.cwd(), 'Gopalan_PU_Chatbot_Sources 2');
  const facultyPath = path.join(baseDir, 'faculty_directory.csv');
  const list: FacultyMember[] = [];

  try {
    if (fs.existsSync(facultyPath)) {
      const raw = fs.readFileSync(facultyPath, 'utf8');
      const lines = raw.split('\n').filter((l) => l.trim().length > 0);
      // Skip header: name_as_published,role_as_published,department_as_published,qualification_as_published,experience_as_published,source_url,status
      for (let i = 1; i < lines.length; i++) {
        // Parse CSV handling quotes
        const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
          list.push({
            name: parts[0] || '',
            role: parts[1] || 'Faculty',
            department: parts[2] || 'Academics',
            qualification: parts[3] || '',
            experience: parts[4] || '',
            status: parts[6] || 'draft_transcription',
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

  const baseDir = path.join(process.cwd(), 'Gopalan_PU_Chatbot_Sources 2');
  const eventsPath = path.join(baseDir, 'event_archive.csv');
  const list: CollegeEvent[] = [];

  try {
    if (fs.existsSync(eventsPath)) {
      const raw = fs.readFileSync(eventsPath, 'utf8');
      const lines = raw.split('\n').filter((l) => l.trim().length > 0);
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
          list.push({
            title: parts[0] || '',
            url: parts[1] || '',
            year: parts[2] || '',
            status: parts[4] || 'archive_only',
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
