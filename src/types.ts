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
}
