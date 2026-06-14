import { Sentence } from "./types";

const LOCAL_STORAGE_KEY = "deutsch_spaced_rep_sentences";

const DEFAULT_SENTENCES: Sentence[] = [
  {
    id: "init1",
    german: "Ich lerne jeden Tag Deutsch",
    arabic: "أنا أتعلم اللغة الألمانية كل يوم",
    level: 0,
    nextReview: new Date().toISOString(),
  },
  {
    id: "init2",
    german: "Wie viel Uhr ist es?",
    arabic: "كم الساعة الآن؟",
    level: 0,
    nextReview: new Date().toISOString(),
  },
  {
    id: "init3",
    german: "Es freut mich, dich kennenzulernen",
    arabic: "يسعدني جداً التعرف عليك",
    level: 0,
    nextReview: new Date().toISOString(),
  },
  {
    id: "init4",
    german: "Wo ist die nächste Bushaltestelle?",
    arabic: "أين تقع أقرب محطة حافلات؟",
    level: 0,
    nextReview: new Date().toISOString(),
  }
];

export function getStoredSentences(): Sentence[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SENTENCES));
    return DEFAULT_SENTENCES;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse stored sentences", e);
    return DEFAULT_SENTENCES;
  }
}

export function saveStoredSentences(sentences: Sentence[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sentences));
}

export function calculateNextReview(level: number): Date {
  const now = new Date();
  // Standard Spaced Repetition configuration in days:
  // Level 1: Delay 1 day
  // Level 2: Delay 3 days
  // Level 3: Delay 7 days
  // Level 4: Delay 14 days
  // Level 5+: Delay 30 days
  let days = 1;
  if (level === 1) days = 1;
  else if (level === 2) days = 3;
  else if (level === 3) days = 7;
  else if (level === 4) days = 14;
  else if (level >= 5) days = 30;

  // Note: For quick testing and immediate practice, users can toggle schedule override.
  now.setDate(now.getDate() + days);
  return now;
}

export function formatRelativeTime(isoString: string): string {
  const targetDate = new Date(isoString);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return "الآن - حان وقت المراجعة! ⏳";
  }
  
  const diffMins = Math.ceil(diffMs / (60 * 1000));
  if (diffMins < 60) {
    return `خلال ${diffMins} دقيقة`;
  }
  
  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) {
    return `خلال ${diffHours} ساعة`;
  }
  
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 1) {
    return "غداً";
  }
  return `خلال ${diffDays} أيام`;
}
