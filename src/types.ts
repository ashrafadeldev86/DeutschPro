export interface Sentence {
  id: string;
  german: string;
  arabic: string;
  level: number; // Mastery spacing level (0 to 5)
  langLevel?: "A1" | "A2" | "B1" | "B2" | "C1"; // CEFR level
  nextReview: string; // ISO String format
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  correction?: string;
  translation?: string;
  praise?: string; // encouraging note
}

export enum Tab {
  Training = "training",
  Writing = "writing",
  Conversation = "conversation",
  AddSentence = "add_sentence",
  Dashboard = "dashboard",
  Premium = "premium",
  Admin = "admin",
  Settings = "settings",
  Stats = "stats",
  Achievements = "achievements",
  Lessons = "lessons",
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
  isPremium?: boolean;
  premiumExpiry?: string;
  premiumStatus?: "pending" | "approved" | "rejected" | "none";
  premiumPlan?: string;
  targetLevel?: string;
}

export interface PremiumRequest {
  id: string;
  userName: string;
  planName: string;
  price: string;
  paymentMethod: "vodafone" | "paypal";
  paypalAccount?: string;
  transactionId?: string;
  screenshot?: string; // base64 string
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  expiryDate?: string;
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
