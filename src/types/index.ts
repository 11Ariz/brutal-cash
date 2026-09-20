export type AccountType = "cash" | "upi";
export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  category: string;
  account: AccountType;
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO string
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Emoji
  color: string; // Neo-brutalist hex
  isCustom?: boolean;
}

export interface AccountBalances {
  cash: number;
  upi: number;
  total: number;
}

export interface SpendingStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isTodayNoSpend: boolean;
}

export interface SafeSpendInfo {
  safeDailyAmount: number;
  remainingBalance: number;
  remainingDaysInMonth: number;
  status: "surplus" | "healthy" | "warning" | "broke";
  message: string;
}

export interface AverageSpendSinceStartInfo {
  averageDailySpend: number;
  totalExpenses: number;
  totalIncome: number;
  daysActive: number;
  startDate: string | null;
  message: string;
}

export interface CategorySpendItem {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
  count: number;
}

export interface AnomalyInfo {
  isAnomaly: boolean;
  type: "high_spend" | "low_spend" | "normal";
  averageDailySpend: number;
  todaySpend: number;
  message: string;
}

export interface AppSettings {
  currency: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
  lastSyncedAt?: string;
}

export type SyncState = "local" | "syncing" | "synced" | "error";
