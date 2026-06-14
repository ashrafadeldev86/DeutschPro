export interface Sentence {
  id: string;
  german: string;
  arabic: string;
  level: number;
  nextReview: string; // ISO String format
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  correction?: string;
  translation?: string;
}

export enum Tab {
  AddSentence = "add_sentence",
  DailyQuiz = "daily_quiz",
  AIChat = "ai_chat",
  SpeakingPractice = "speaking_practice",
  Dashboard = "dashboard",
}

export interface UserProfile {
  name: string;
  age: number;
  email?: string;
  xp: number;
  level: number;
  streak: number;
  registered: boolean;
  theme: "light" | "dark";
  correctQuizzesCount?: number;
  successfulSpeechesCount?: number;
  chatTurnsCompleted?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string; // "Heart", "Star", "Flame", etc.
  xpAward: number;
  requirementType: "sentences" | "correct_quizzes" | "chat_turns" | "speaking_sentences" | "xp_milestone";
  requirementValue: number;
  unlocked: boolean;
}
