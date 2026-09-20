"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useExpense } from "@/context/ExpenseContext";
import { formatMoney, calculateCategoryBreakdown } from "@/lib/calculations";
import {
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Wallet,
  Smartphone,
  PlusCircle,
  MinusCircle,
  Trophy,
  PieChart,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function DashboardPage() {
  const {
    balances,
    stats,
    averageSpendSinceStart,
    streak,
    anomaly,
    transactions,
    categories,
    settings,
    openAddModal,
    deleteTransaction,
    loadSampleData,
    isLoaded,
  } = useExpense();

  const [categoryFilter, setCategoryFilter] = useState<"all" | "month">("all");

  const dashboardCategoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(transactions, categories, categoryFilter);
  }, [transactions, categories, categoryFilter]);

  const handleStreakClick = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#FFD84D", "#7BF1A8", "#FF8FAB", "#80BFFF"],
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-12 h-12 border-4 border-[#111111] border-t-[#FFD84D] rounded-full animate-spin" />
        <span className="font-black text-sm uppercase tracking-wider text-[#111111]">
          Loading Brutal Cash...
        </span>
      </div>
    );
  }

  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="space-y-4 pb-6">
      {/* 1. TOTAL BALANCE CARD (Hero Card) */}
      <div className="bg-[#FFD84D] border-3 border-[#111111] rounded-3xl p-5 brutal-shadow relative overflow-hidden">
        {/* Background accent badge */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black uppercase tracking-widest text-[#111111]">
            Total Balance
          </span>
          <span className="brutal-badge bg-white text-[#111111] text-[10px]">
            Combined Cash + UPI
          </span>
        </div>

        {/* Large Dominant Balance Amount */}
        <div className="my-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111111]">
            {formatMoney(balances.total, settings.currency)}
          </h1>
        </div>

        {/* Account Split Breakdown: Cash & UPI */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t-2 border-[#111111]">
          {/* Cash Account */}
          <div className="bg-white border-2 border-[#111111] rounded-xl p-2.5 brutal-shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">💵</span>
              <div>
                <span className="text-[10px] font-black uppercase text-gray-500 block leading-none">
                  Cash
                </span>
                <span className="text-xs font-black text-[#111111] block mt-0.5">
                  {formatMoney(balances.cash, settings.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* UPI Account */}
          <div className="bg-white border-2 border-[#111111] rounded-xl p-2.5 brutal-shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">📱</span>
              <div>
                <span className="text-[10px] font-black uppercase text-gray-500 block leading-none">
                  UPI
                </span>
                <span className="text-xs font-black text-[#111111] block mt-0.5">
                  {formatMoney(balances.upi, settings.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick 1-Tap Add Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => openAddModal({ type: "income" })}
            className="brutal-btn-sm bg-[#7BF1A8] hover:bg-white text-[#111111] py-2 rounded-xl text-xs font-black uppercase tracking-wider"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Money</span>
          </button>
          <button
            onClick={() => openAddModal({ type: "expense" })}
            className="brutal-btn-sm bg-[#FF8FAB] hover:bg-white text-[#111111] py-2 rounded-xl text-xs font-black uppercase tracking-wider"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 2. STATS SECTION (Today, This Week, This Month Expense Totals) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#111111]">
            Spending Overview
          </h2>
          <span className="text-[10px] font-bold text-gray-500">Expenses Only</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Today */}
          <div className="bg-white border-2.5 border-[#111111] rounded-2xl p-2.5 brutal-shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase text-gray-500">Today</span>
            <div className="text-base font-black text-[#111111] mt-1">
              {formatMoney(stats.today, settings.currency)}
            </div>
            <div className="h-1.5 w-full bg-[#FF8FAB] border border-[#111111] rounded-full mt-1.5" />
          </div>

          {/* This Week */}
          <div className="bg-white border-2.5 border-[#111111] rounded-2xl p-2.5 brutal-shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase text-gray-500">This Week</span>
            <div className="text-base font-black text-[#111111] mt-1">
              {formatMoney(stats.thisWeek, settings.currency)}
            </div>
            <div className="h-1.5 w-full bg-[#80BFFF] border border-[#111111] rounded-full mt-1.5" />
          </div>

          {/* This Month */}
          <div className="bg-white border-2.5 border-[#111111] rounded-2xl p-2.5 brutal-shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase text-gray-500">This Month</span>
            <div className="text-base font-black text-[#111111] mt-1">
              {formatMoney(stats.thisMonth, settings.currency)}
            </div>
            <div className="h-1.5 w-full bg-[#FFD84D] border border-[#111111] rounded-full mt-1.5" />
          </div>
        </div>
      </div>

      {/* 3. AVERAGE DAILY SPEND CARD (Calculated from the day money was first put in) */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">📈</span>
            <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
              Average Daily Spend
            </span>
          </div>
          <span className="brutal-badge text-[10px] bg-[#FFD84D] text-[#111111]">
            {averageSpendSinceStart.daysActive} Day{averageSpendSinceStart.daysActive === 1 ? "" : "s"} Tracked
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <div className="text-3xl font-black text-[#111111]">
              {formatMoney(averageSpendSinceStart.averageDailySpend, settings.currency)}
              <span className="text-xs font-bold text-gray-500"> / day</span>
            </div>
            <p className="text-xs font-bold text-gray-700 mt-0.5">
              {averageSpendSinceStart.startDate
                ? `Since money was first logged on ${averageSpendSinceStart.startDate}`
                : "Add money to start tracking your daily average"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Total Spent</span>
            <span className="text-[11px] font-bold text-[#111111] bg-pink-100 border border-[#111111] px-1.5 py-0.5 rounded inline-block">
              {formatMoney(averageSpendSinceStart.totalExpenses, settings.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. NO SPEND STREAK CARD & SMART INSIGHTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Streak Card */}
        <div
          onClick={handleStreakClick}
          className="bg-[#7BF1A8] border-3 border-[#111111] rounded-2xl p-4 brutal-shadow cursor-pointer active:translate-x-1 active:translate-y-1 transition-all group"
          title="Tap for confetti celebration!"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
              No-Spend Streak
            </span>
            <span className="text-lg animate-bounce">🔥</span>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-[#111111] flex items-center gap-2">
              <span>{streak.currentStreak} Day{streak.currentStreak === 1 ? "" : "s"}</span>
            </div>
            <p className="text-[11px] font-bold text-[#111111]/80 mt-0.5">
              {streak.isTodayNoSpend
                ? "✨ Zero expenses so far today! Tap to celebrate."
                : "Expenses logged today. Keep tomorrow zero!"}
            </p>
          </div>

          <div className="pt-2 border-t-2 border-[#111111] flex items-center justify-between text-[11px] font-extrabold text-[#111111]">
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Best Streak
            </span>
            <span className="bg-white border border-[#111111] px-1.5 py-0.2 rounded">
              {streak.longestStreak} days
            </span>
          </div>
        </div>

        {/* Smart Insights / Anomaly Card */}
        <div
          className={`border-3 border-[#111111] rounded-2xl p-4 brutal-shadow flex flex-col justify-between ${
            anomaly.type === "high_spend"
              ? "bg-[#FF8FAB]"
              : anomaly.type === "low_spend"
              ? "bg-[#80BFFF]"
              : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {anomaly.type === "high_spend" ? (
                <AlertTriangle className="w-4 h-4 text-[#111111]" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#111111]" />
              )}
              <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
                Smart Insight
              </span>
            </div>
            <span className="brutal-badge text-[9px] bg-white">Anomaly Radar</span>
          </div>

          <div className="my-2">
            <p className="text-xs font-black text-[#111111] leading-snug">
              {anomaly.message}
            </p>
          </div>

          <div className="pt-2 border-t-2 border-[#111111] flex items-center justify-between text-[10px] font-bold text-[#111111]/80">
            <span>Daily Burn Avg</span>
            <span className="font-black text-[#111111]">
              {formatMoney(anomaly.averageDailySpend, settings.currency)}/day
            </span>
          </div>
        </div>
      </div>

      {/* 5. CATEGORY-WISE SPENDS (How much on Food, Travel, etc.) */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🏷️</span>
            <h3 className="font-black text-xs uppercase tracking-wider text-[#111111]">
              Category-Wise Spends
            </h3>
          </div>
          <div className="flex bg-[#FFF9E8] border-2 border-[#111111] rounded-lg p-0.5">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-2 py-0.5 text-[10px] font-black uppercase rounded transition-all ${
                categoryFilter === "all"
                  ? "bg-[#FFD84D] border border-[#111111] brutal-shadow-sm text-[#111111]"
                  : "text-gray-500"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setCategoryFilter("month")}
              className={`px-2 py-0.5 text-[10px] font-black uppercase rounded transition-all ${
                categoryFilter === "month"
                  ? "bg-[#FFD84D] border border-[#111111] brutal-shadow-sm text-[#111111]"
                  : "text-gray-500"
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {dashboardCategoryBreakdown.length === 0 ? (
          <p className="text-xs font-bold text-gray-500 py-3 text-center">
            No expenses recorded yet in this period.
          </p>
        ) : (
          <div className="space-y-2.5">
            {dashboardCategoryBreakdown.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{cat.icon}</span>
                    <span className="font-extrabold text-[#111111]">{cat.name}</span>
                    <span className="text-[10px] font-bold text-gray-500">
                      ({cat.count} spend{cat.count === 1 ? "" : "s"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#111111]">
                      {formatMoney(cat.amount, settings.currency)}
                    </span>
                    <span className="brutal-badge text-[9px] bg-white py-0 px-1">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>

                {/* Colored Progress Bar */}
                <div className="h-3 w-full bg-[#FFF9E8] border-2 border-[#111111] rounded-lg overflow-hidden">
                  <div
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                    className="h-full border-r border-[#111111] transition-all duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. RECENT TRANSACTIONS (Latest 10) */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#111111]">
            Recent Transactions
          </h3>
          <Link
            href="/history"
            className="text-xs font-black text-[#111111] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-6 px-2 bg-[#FFF9E8] border-2 border-[#111111] rounded-xl">
            <span className="text-3xl block mb-2">⚡</span>
            <h4 className="font-black text-sm uppercase text-[#111111]">No Transactions Yet</h4>
            <p className="text-xs font-bold text-gray-600 max-w-xs mx-auto mt-1 mb-3">
              Add your first income or expense, or load sample data to explore right away!
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => openAddModal()}
                className="brutal-btn-sm bg-[#FFD84D] hover:bg-[#7BF1A8] py-2 px-3 text-xs"
              >
                + Add Transaction
              </button>
              <button
                onClick={() => loadSampleData()}
                className="brutal-btn-sm bg-white hover:bg-yellow-100 py-2 px-3 text-xs"
              >
                🎲 Load Sample Data
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y-2 divide-[#111111]/10">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between gap-2 hover:bg-[#FFF9E8] px-1 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border-2 border-[#111111] brutal-shadow-sm flex items-center justify-center shrink-0 ${
                      tx.type === "income" ? "bg-[#7BF1A8]" : "bg-[#FF8FAB]"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-[#111111] line-clamp-1">
                      {tx.title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-500">{tx.date}</span>
                      <span className="text-[10px] font-extrabold uppercase px-1 py-0.2 rounded border border-[#111111] bg-white">
                        {tx.account}
                      </span>
                      <span className="text-[10px] font-bold text-gray-600 bg-yellow-100 px-1 rounded">
                        {tx.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-black text-sm ${
                      tx.type === "income" ? "text-green-700" : "text-[#111111]"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {settings.currency}
                    {tx.amount.toLocaleString()}
                  </div>
                  {tx.note && (
                    <span className="text-[10px] font-bold text-gray-400 truncate max-w-[120px] block">
                      {tx.note}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
