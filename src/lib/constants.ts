import { Category, Transaction } from "@/types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food", icon: "🍔", color: "#FFD84D" },
  { id: "travel", name: "Travel", icon: "🚕", color: "#80BFFF" },
  { id: "shopping", name: "Shopping", icon: "🛍️", color: "#FF8FAB" },
  { id: "bills", name: "Bills", icon: "⚡", color: "#FF6B6B" },
  { id: "health", name: "Health", icon: "💊", color: "#7BF1A8" },
  { id: "education", name: "Education", icon: "📚", color: "#D0BFFF" },
  { id: "entertainment", name: "Entertainment", icon: "🎮", color: "#FFB347" },
  { id: "other", name: "Other", icon: "📦", color: "#E2E8F0" },
  // Default income categories
  { id: "salary", name: "Salary", icon: "💼", color: "#7BF1A8" },
  { id: "freelance", name: "Freelance", icon: "💻", color: "#80BFFF" },
  { id: "gift", name: "Gift", icon: "🎁", color: "#FF8FAB" },
  { id: "investment", name: "Investment", icon: "📈", color: "#FFD84D" },
];

export const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000];

export const TITLE_SUGGESTIONS = [
  "Chai & Snacks",
  "Lunch",
  "Groceries",
  "Dinner",
  "Uber / Auto",
  "Metro Card",
  "Coffee",
  "Electricity Bill",
  "Wifi Bill",
  "Medicine",
  "Movies",
  "Amazon Order",
  "Salary Credit",
  "UPI Refund",
];

export const BRUTAL_PALETTE = [
  "#FFD84D", // Yellow
  "#7BF1A8", // Green
  "#FF8FAB", // Pink
  "#80BFFF", // Blue
  "#FF6B6B", // Red
  "#D0BFFF", // Purple
  "#FFB347", // Orange
  "#A7F3D0", // Mint
];

export const EMOJI_OPTIONS = [
  "🍔", "🍕", "☕", "🚕", "✈️", "🛍️", "⚡", "💊", 
  "📚", "🎮", "🎬", "🏋️", "💻", "💼", "🎁", "📈", 
  "📦", "💈", "🐾", "🎵", "🛒", "🔑", "🏠", "🍻"
];

export const CURRENCY_OPTIONS = [
  { symbol: "₹", code: "INR", label: "Indian Rupee (₹)" },
  { symbol: "$", code: "USD", label: "US Dollar ($)" },
  { symbol: "€", code: "EUR", label: "Euro (€)" },
  { symbol: "£", code: "GBP", label: "British Pound (£)" },
  { symbol: "¥", code: "JPY", label: "Japanese Yen (¥)" },
  { symbol: "AED ", code: "AED", label: "UAE Dirham (AED)" },
];

// Generates rich, realistic sample data for instant demo
export function generateSampleData(): Transaction[] {
  const today = new Date();
  const formatDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split("T")[0];
  };

  return [
    {
      id: "sample-1",
      type: "income",
      amount: 45000,
      title: "Monthly Salary",
      category: "Salary",
      account: "upi",
      note: "Direct bank deposit",
      date: formatDate(10),
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: "sample-2",
      type: "income",
      amount: 5000,
      title: "Cash ATM Withdrawal",
      category: "Salary",
      account: "cash",
      note: "Cash pocket money",
      date: formatDate(8),
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: "sample-3",
      type: "expense",
      amount: 3200,
      title: "Weekly Grocery Haul",
      category: "Food",
      account: "upi",
      note: "Supermarket veggies & dairy",
      date: formatDate(6),
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: "sample-4",
      type: "expense",
      amount: 450,
      title: "Uber Ride to Office",
      category: "Travel",
      account: "upi",
      note: "Rain surge pricing",
      date: formatDate(5),
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "sample-5",
      type: "expense",
      amount: 180,
      title: "Chai & Samosa for Team",
      category: "Food",
      account: "cash",
      note: "Corner stall",
      date: formatDate(4),
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: "sample-6",
      type: "expense",
      amount: 1499,
      title: "Broadband Internet",
      category: "Bills",
      account: "upi",
      note: "Fiber high speed",
      date: formatDate(3),
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "sample-7",
      type: "expense",
      amount: 850,
      title: "Movie Tickets & Popcorn",
      category: "Entertainment",
      account: "upi",
      note: "Weekend IMAX show",
      date: formatDate(2),
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "sample-8",
      type: "expense",
      amount: 250,
      title: "Street Food Snack",
      category: "Food",
      account: "cash",
      date: formatDate(1),
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: "sample-9",
      type: "expense",
      amount: 120,
      title: "Morning Cold Coffee",
      category: "Food",
      account: "upi",
      date: formatDate(0),
      createdAt: new Date().toISOString(),
    },
  ];
}
