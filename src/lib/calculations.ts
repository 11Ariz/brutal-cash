import {
  Transaction,
  Category,
  AccountBalances,
  SpendingStats,
  StreakInfo,
  SafeSpendInfo,
  AverageSpendSinceStartInfo,
  CategorySpendItem,
  AnomalyInfo,
} from "@/types";

// Format date as YYYY-MM-DD in local time
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format currency
export function formatMoney(amount: number, symbol = "₹"): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Format with standard Indian/International commas
  const formatted = absAmount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

  return `${isNegative ? "-" : ""}${symbol}${formatted}`;
}

// 1. Calculate Dynamic Balances
export function calculateBalances(transactions: Transaction[]): AccountBalances {
  let cash = 0;
  let upi = 0;

  for (const t of transactions) {
    const val = t.type === "income" ? t.amount : -t.amount;
    if (t.account === "cash") {
      cash += val;
    } else {
      upi += val;
    }
  }

  return {
    cash,
    upi,
    total: cash + upi,
  };
}

// 2. Calculate Spending Stats: Today, This Week, This Month
export function calculateSpendingStats(transactions: Transaction[]): SpendingStats {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Start of week (Monday)
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const mondayStr = getLocalDateString(monday);

  // Start of month (YYYY-MM-01)
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;

  for (const t of transactions) {
    if (t.type !== "expense") continue;

    if (t.date === todayStr) {
      today += t.amount;
    }
    if (t.date >= mondayStr && t.date <= todayStr) {
      thisWeek += t.amount;
    }
    if (t.date >= monthStartStr && t.date <= todayStr) {
      thisMonth += t.amount;
    }
  }

  return { today, thisWeek, thisMonth };
}

// 3. Daily Spending Limit ("Safe Spend Today")
// Formula: Remaining Balance ÷ Remaining Days In Month
export function calculateSafeSpend(totalBalance: number): SafeSpendInfo {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  
  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);

  if (totalBalance <= 0) {
    return {
      safeDailyAmount: 0,
      remainingBalance: totalBalance,
      remainingDaysInMonth: remainingDays,
      status: "broke",
      message: "🚨 Negative or Zero Balance! Freeze all non-essential spends.",
    };
  }

  const safeDailyAmount = Math.floor(totalBalance / remainingDays);

  let status: SafeSpendInfo["status"] = "healthy";
  let message = "You're pacing well for the month.";

  if (safeDailyAmount > 1500) {
    status = "surplus";
    message = "💰 Healthy surplus! Plenty of runway left this month.";
  } else if (safeDailyAmount < 300) {
    status = "warning";
    message = "⚠️ Tight daily budget. Stick to essentials!";
  }

  return {
    safeDailyAmount,
    remainingBalance: totalBalance,
    remainingDaysInMonth: remainingDays,
    status,
    message,
  };
}

// 3b. Average Daily Spend From The Day Money Was Put In
// Calculates: Total Expenses ÷ Days Since First Income/Transaction
export function calculateAverageSpendSinceStart(transactions: Transaction[]): AverageSpendSinceStartInfo {
  const incomes = transactions.filter((t) => t.type === "income");
  const referenceTransactions = incomes.length > 0 ? incomes : transactions;

  if (referenceTransactions.length === 0) {
    return {
      averageDailySpend: 0,
      totalExpenses: 0,
      totalIncome: 0,
      daysActive: 1,
      startDate: null,
      message: "Add money to start tracking your daily average burn.",
    };
  }

  // Sort dates ascending
  const dates = referenceTransactions.map((t) => t.date).sort();
  const startDateStr = dates[0];
  const startDate = new Date(startDateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Number of days since start date, including today
  const diffTime = Math.max(0, today.getTime() - startDate.getTime());
  const daysActive = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  let totalExpenses = 0;
  let totalIncome = 0;

  for (const t of transactions) {
    if (t.type === "expense") {
      totalExpenses += t.amount;
    } else {
      totalIncome += t.amount;
    }
  }

  const averageDailySpend = Math.round(totalExpenses / daysActive);

  return {
    averageDailySpend,
    totalExpenses,
    totalIncome,
    daysActive,
    startDate: startDateStr,
    message: `Averaging ₹${averageDailySpend.toLocaleString()}/day across ${daysActive} day${daysActive > 1 ? "s" : ""} of tracking.`,
  };
}

// 3c. Category-Wise Spending Breakdown
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  filter: "all" | "month" = "all"
): CategorySpendItem[] {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const map: { [name: string]: { amount: number; count: number } } = {};
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (filter === "month" && t.date < monthStart) continue;

    if (!map[t.category]) {
      map[t.category] = { amount: 0, count: 0 };
    }
    map[t.category].amount += t.amount;
    map[t.category].count += 1;
    totalExpense += t.amount;
  }

  return Object.entries(map)
    .map(([catName, data]) => {
      const catObj = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      return {
        name: catName,
        amount: data.amount,
        percentage: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0,
        color: catObj?.color || "#FFD84D",
        icon: catObj?.icon || "🏷️",
        count: data.count,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

// 4. No Spend Streak System
// Definition: A day with zero expenses, tracking ONLY from the day money was first added
export function calculateStreak(transactions: Transaction[]): StreakInfo {
  const incomes = transactions.filter((t) => t.type === "income");
  const referenceList = incomes.length > 0 ? incomes : transactions;

  // If no transactions or money added yet, streak is 0
  if (referenceList.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isTodayNoSpend: true,
    };
  }

  // Earliest date money was added
  const earliestMoneyDateStr = referenceList.map((t) => t.date).sort()[0];

  const expenseDates = new Set(
    transactions.filter((t) => t.type === "expense").map((t) => t.date)
  );

  const todayStr = getLocalDateString(new Date());
  const isTodayNoSpend = !expenseDates.has(todayStr);

  let currentStreak = 0;
  
  // Check backwards day by day, stopping if we hit an expense OR before first money was added
  let cursor = new Date();
  if (expenseDates.has(getLocalDateString(cursor))) {
    // Today has expense, so current active streak is 0
    currentStreak = 0;
  } else {
    // Today has no expense yet, count it and look backwards
    while (true) {
      const dateStr = getLocalDateString(cursor);
      
      // Stop if date is prior to when money was first added
      if (dateStr < earliestMoneyDateStr) {
        break;
      }

      if (!expenseDates.has(dateStr)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
      // Safety limit 365 days
      if (currentStreak > 365) break;
    }
  }

  // Calculate longest streak historically in the dataset (bounded from earliest money date to today)
  let longestStreak = currentStreak;
  const minDate = new Date(earliestMoneyDateStr + "T00:00:00");
  const maxDate = new Date();
  maxDate.setHours(0, 0, 0, 0);

  let tempStreak = 0;
  const scan = new Date(minDate);
  while (scan <= maxDate) {
    const dStr = getLocalDateString(scan);
    if (!expenseDates.has(dStr)) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
    scan.setDate(scan.getDate() + 1);
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    isTodayNoSpend,
  };
}

// 5. Smart Insights: Spending Anomaly Detection
export function calculateAnomaly(transactions: Transaction[], stats: SpendingStats): AnomalyInfo {
  const now = new Date();
  const daysPassed = Math.max(1, now.getDate());
  const averageDailySpend = Math.round(stats.thisMonth / daysPassed);
  const todaySpend = stats.today;

  if (transactions.length < 2) {
    return {
      isAnomaly: false,
      type: "normal",
      averageDailySpend,
      todaySpend,
      message: "Add more transactions to unlock AI spending insights!",
    };
  }

  if (todaySpend === 0) {
    return {
      isAnomaly: true,
      type: "low_spend",
      averageDailySpend,
      todaySpend: 0,
      message: `Zero expenses today! Average burn is ₹${averageDailySpend}/day. Excellent discipline!`,
    };
  }

  if (averageDailySpend > 0 && todaySpend > averageDailySpend * 1.8 && todaySpend > 300) {
    return {
      isAnomaly: true,
      type: "high_spend",
      averageDailySpend,
      todaySpend,
      message: `Heads up! You usually spend ₹${averageDailySpend}/day. Today you spent ₹${todaySpend}!`,
    };
  }

  return {
    isAnomaly: false,
    type: "normal",
    averageDailySpend,
    todaySpend,
    message: `Normal spending day. Avg: ₹${averageDailySpend}/day vs Today: ₹${todaySpend}.`,
  };
}
