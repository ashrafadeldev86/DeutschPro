import { Sentence } from "./types";

const LOCAL_STORAGE_KEY = "deutsch_spaced_rep_sentences";

const DEFAULT_SENTENCES: Sentence[] = [
  // A1 Sentences
  {
    id: "a1_1",
    german: "Ich lerne jeden Tag Deutsch",
    arabic: "أنا أتعلم اللغة الألمانية كل يوم",
    level: 0,
    langLevel: "A1",
    nextReview: new Date().toISOString(),
  },
  {
    id: "a1_2",
    german: "Wie viel Uhr ist es?",
    arabic: "كم الساعة الآن؟",
    level: 0,
    langLevel: "A1",
    nextReview: new Date().toISOString(),
  },
  {
    id: "a1_3",
    german: "Es freut mich, dich kennenzulernen",
    arabic: "يسعدني جداً التعرف عليك",
    level: 0,
    langLevel: "A1",
    nextReview: new Date().toISOString(),
  },
  {
    id: "a1_4",
    german: "Wo ist die nächste Bushaltestelle?",
    arabic: "أين تقع أقرب محطة حافلات؟",
    level: 0,
    langLevel: "A1",
    nextReview: new Date().toISOString(),
  },
  // A2 Sentences
  {
    id: "a2_1",
    german: "Ich suche eine gemütliche Wohnung in der Stadt",
    arabic: "أنا أبحث عن شقة مريحة في المدينة",
    level: 0,
    langLevel: "A2",
    nextReview: new Date().toISOString(),
  },
  {
    id: "a2_2",
    german: "Gestern habe ich ein interessantes Buch gelesen",
    arabic: "بالأمس قرأت كتاباً مشوقاً",
    level: 0,
    langLevel: "A2",
    nextReview: new Date().toISOString(),
  },
  {
    id: "a2_3",
    german: "Darf ich dich zum Kaffeetrinken einladen?",
    arabic: "هل يمكنني دعوتك لتناول القهوة معي؟",
    level: 0,
    langLevel: "A2",
    nextReview: new Date().toISOString(),
  },
  // B1 Sentences
  {
    id: "b1_1",
    german: "Es ist wichtig, die Grammatik regelmäßig zu wiederholen",
    arabic: "من المهم مراجعة القواعد النحوية بانتظام",
    level: 0,
    langLevel: "B1",
    nextReview: new Date().toISOString(),
  },
  {
    id: "b1_2",
    german: "Obwohl das Wetter schlecht war, sind wir spazieren gegangen",
    arabic: "على الرغم من أن الطقس كان سيئاً، فقد ذهبنا للتنزه",
    level: 0,
    langLevel: "B1",
    nextReview: new Date().toISOString(),
  },
  {
    id: "b1_3",
    german: "Ich würde gerne wissen, wann der nächste Sprachkurs beginnt",
    arabic: "أود أن أعرف متى تبدأ دورة اللغة القادمة",
    level: 0,
    langLevel: "B1",
    nextReview: new Date().toISOString(),
  },
  // B2 Sentences
  {
    id: "b2_1",
    german: "Erfolgreiches Lernen erfordert viel Ausdauer und Konzentration",
    arabic: "التعلم الناجح يتطلب الكثير من المثابرة والتركيز",
    level: 0,
    langLevel: "B2",
    nextReview: new Date().toISOString(),
  },
  {
    id: "b2_2",
    german: "Je mehr Sprachen man spricht, desto besser sind die Karrierechancen",
    arabic: "كلما تحدث المرء لغات أكثر، كانت الفرص المهنية أفضل",
    level: 0,
    langLevel: "B2",
    nextReview: new Date().toISOString(),
  },
  {
    id: "b2_3",
    german: "Wir müssen alternative Lösungen für dieses Problem in Betracht ziehen",
    arabic: "يجب علينا أن نأخذ في الاعتبار حلولاً بديلة لهذه المشكلة",
    level: 0,
    langLevel: "B2",
    nextReview: new Date().toISOString(),
  },
  // C1 Sentences
  {
    id: "c1_1",
    german: "Die Globalisierung übt einen erheblichen Einfluss auf den Arbeitsmarkt aus",
    arabic: "تمارس العولمة تأثيراً كبيراً على سوق العمل",
    level: 0,
    langLevel: "C1",
    nextReview: new Date().toISOString(),
  },
  {
    id: "c1_2",
    german: "Angesichts der geopolitischen Entwicklungen müssen wir Strategien anpassen",
    arabic: "في ظل التطورات الجيوسياسية، يتعين علينا تعديل استراتيجياتنا",
    level: 0,
    langLevel: "C1",
    nextReview: new Date().toISOString(),
  },
  {
    id: "c1_3",
    german: "Es bedarf einer wissenschaftlichen Analyse, um die Ursachen zu erforschen",
    arabic: "يتطلب الأمر تحليلاً علمياً من أجل استكشاف الأسباب الكامنة",
    level: 0,
    langLevel: "C1",
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
