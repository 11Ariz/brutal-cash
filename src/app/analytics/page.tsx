"use client";

import React, { useState, useMemo } from "react";
import { useExpense } from "@/context/ExpenseContext";
import { formatMoney, getLocalDateString } from "@/lib/calculations";
import { BRUTAL_PALETTE } from "@/lib/constants";
import { BarChart3, TrendingUp, Award, Calendar, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function AnalyticsPage() {
  const { transactions, categories, settings } = useExpense();
  const [trendRange, setTrendRange] = useState<7 | 30 | 90>(7);

  const now = new Date();
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const daysPassedInMonth = Math.max(1, now.getDate());

  // Current month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date >= currentMonthStart);
  }, [transactions, currentMonthStart]);

  // 1. Monthly Spending & Income
  const monthlySpending = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [monthTransactions]);

  const monthlyIncome = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [monthTransactions]);

  // 2. Average Daily Spending (Monthly Expenses ÷ Days Passed)
  const averageDailySpend = Math.round(monthlySpending / daysPassedInMonth);

  // 3. Highest Spending Day
  const highestSpendDay = useMemo(() => {
    const daySpends: { [date: string]: number } = {};
    for (const t of monthTransactions) {
      if (t.type === "expense") {
        daySpends[t.date] = (daySpends[t.date] || 0) + t.amount;
      }
    }

    let maxAmount = 0;
    let maxDate = "None";

    for (const [date, amount] of Object.entries(daySpends)) {
      if (amount > maxAmount) {
        maxAmount = amount;
        maxDate = date;
      }
    }

    return { amount: maxAmount, date: maxDate };
  }, [monthTransactions]);

  // 4. Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map: { [cat: string]: number } = {};
    let total = 0;

    for (const t of monthTransactions) {
      if (t.type === "expense") {
        map[t.category] = (map[t.category] || 0) + t.amount;
        total += t.amount;
      }
    }

    const catList = Object.entries(map).map(([name, amount], index) => {
      const catObj = categories.find((c) => c.name === name);
      return {
        name,
        amount,
        icon: catObj?.icon || "🏷️",
        color: catObj?.color || BRUTAL_PALETTE[index % BRUTAL_PALETTE.length],
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      };
    });

    return catList.sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, categories]);

  // 5. Account Split: Cash vs UPI this month
  const accountSplit = useMemo(() => {
    let cash = 0;
    let upi = 0;
    for (const t of monthTransactions) {
      if (t.type === "expense") {
        if (t.account === "cash") cash += t.amount;
        else upi += t.amount;
      }
    }
    const total = cash + upi;
    return {
      cash,
      upi,
      cashPct: total > 0 ? Math.round((cash / total) * 100) : 50,
      upiPct: total > 0 ? Math.round((upi / total) * 100) : 50,
    };
  }, [monthTransactions]);

  // 6. Spending Trend (7 days, 30 days, 90 days)
  const trendData = useMemo(() => {
    const points: Array<{ label: string; date: string; amount: number }> = [];
    const today = new Date();

    for (let i = trendRange - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);

      const daySpend = transactions
        .filter((t) => t.date === dateStr && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const label =
        trendRange === 7
          ? d.toLocaleDateString("en-US", { weekday: "narrow" })
          : trendRange === 30 && i % 5 === 0
          ? d.toLocaleDateString("en-US", { day: "numeric" })
          : trendRange === 90 && i % 15 === 0
          ? d.toLocaleDateString("en-US", { month: "narrow", day: "numeric" })
          : "";

      points.push({ label, date: dateStr, amount: daySpend });
    }

    const maxSpend = Math.max(...points.map((p) => p.amount), 100);

    return { points, maxSpend };
  }, [transactions, trendRange]);

  return (
    <div className="space-y-4 pb-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#111111]">
          Analytics & Trends
        </h1>
        <p className="text-xs font-bold text-gray-600">
          Monthly financial diagnostics and spending breakdown
        </p>
      </div>

      {/* 1. Monthly Overview Big Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monthly Spending */}
        <div className="bg-[#FF8FAB] border-3 border-[#111111] rounded-2xl p-4 brutal-shadow">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#111111]/70 block">
            This Month Spent
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#111111] mt-1">
            {formatMoney(monthlySpending, settings.currency)}
          </div>
          <span className="text-[10px] font-bold text-[#111111] bg-white/70 border border-[#111111] px-1.5 py-0.2 rounded mt-2 inline-block">
            {daysPassedInMonth} days logged
          </span>
        </div>

        {/* Monthly Income */}
        <div className="bg-[#7BF1A8] border-3 border-[#111111] rounded-2xl p-4 brutal-shadow">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#111111]/70 block">
            This Month Earned
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#111111] mt-1">
            {formatMoney(monthlyIncome, settings.currency)}
          </div>
          <span className="text-[10px] font-bold text-[#111111] bg-white/70 border border-[#111111] px-1.5 py-0.2 rounded mt-2 inline-block">
            Savings: {formatMoney(monthlyIncome - monthlySpending, settings.currency)}
          </span>
        </div>
      </div>

      {/* 2. Key Metrics: Highest Day & Average Daily Spend */}
      <div className="grid grid-cols-2 gap-3">
        {/* Highest Spending Day */}
        <div className="bg-white border-3 border-[#111111] rounded-2xl p-3.5 brutal-shadow">
          <div className="flex items-center gap-1 text-[#111111] mb-1">
            <Award className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-[10px] font-black uppercase text-gray-600">Peak Day</span>
          </div>
          <div className="text-lg font-black text-[#111111]">
            {formatMoney(highestSpendDay.amount, settings.currency)}
          </div>
          <span className="text-[10px] font-bold text-gray-500 truncate block mt-0.5">
            {highestSpendDay.date !== "None" ? highestSpendDay.date : "No peak recorded"}
          </span>
        </div>

        {/* Average Daily Spending */}
        <div className="bg-white border-3 border-[#111111] rounded-2xl p-3.5 brutal-shadow">
          <div className="flex items-center gap-1 text-[#111111] mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] font-black uppercase text-gray-600">Daily Average</span>
          </div>
          <div className="text-lg font-black text-[#111111]">
            {formatMoney(averageDailySpend, settings.currency)}
            <span className="text-[10px] font-bold text-gray-500"> /day</span>
          </div>
          <span className="text-[10px] font-bold text-gray-500 block mt-0.5">
            Expenses ÷ {daysPassedInMonth} days
          </span>
        </div>
      </div>

      {/* 3. SPENDING TREND CHART (7, 30, 90 Days) */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#111111]" />
            <h3 className="font-black text-xs uppercase tracking-wider text-[#111111]">
              Spending Trend
            </h3>
          </div>

          {/* Range Switcher */}
          <div className="flex bg-[#FFF9E8] border-2 border-[#111111] rounded-lg p-0.5">
            {[7, 30, 90].map((r) => (
              <button
                key={r}
                onClick={() => setTrendRange(r as 7 | 30 | 90)}
                className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                  trendRange === r ? "bg-[#FFD84D] border border-[#111111] brutal-shadow-sm" : "text-gray-600"
                }`}
              >
                {r}D
              </button>
            ))}
          </div>
        </div>

        {/* Neo-Brutalist SVG Bar Trend Chart */}
        <div className="h-44 flex items-end gap-1 pt-6 pb-2 border-b-2 border-[#111111]">
          {trendData.points.map((pt, i) => {
            const heightPct = Math.max(6, Math.round((pt.amount / trendData.maxSpend) * 100));
            const isToday = i === trendData.points.length - 1;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on hover/touch */}
                <div className="absolute -top-7 hidden group-hover:flex bg-[#111111] text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-20 pointer-events-none">
                  {settings.currency}{pt.amount} ({pt.date})
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-sm border border-[#111111] transition-all group-hover:opacity-80 ${
                    pt.amount === 0
                      ? "bg-gray-100"
                      : isToday
                      ? "bg-[#FF6B6B]"
                      : "bg-[#FFD84D]"
                  }`}
                />

                {/* X Axis Label */}
                {pt.label && (
                  <span className="text-[9px] font-black text-gray-500 mt-1 block">
                    {pt.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
          <span>{trendRange} days ago</span>
          <span>Peak: {formatMoney(trendData.maxSpend, settings.currency)}</span>
          <span>Today</span>
        </div>
      </div>

      {/* 4. CATEGORY BREAKDOWN */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-[#111111]" />
            <h3 className="font-black text-xs uppercase tracking-wider text-[#111111]">
              Category Breakdown
            </h3>
          </div>
          <span className="text-[10px] font-bold text-gray-500">
            {categoryBreakdown.length} Categories
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <p className="text-xs text-gray-500 font-bold py-4 text-center">
            No expenses recorded this month yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{cat.icon}</span>
                    <span className="font-extrabold text-[#111111]">{cat.name}</span>
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

                {/* Neo-brutalist progress bar */}
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

      {/* 5. Cash vs UPI Spending Split */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
            Payment Mode Split (This Month)
          </span>
          <span className="text-[10px] font-bold text-gray-500">Cash vs UPI</span>
        </div>

        {/* Dual Color Split Bar */}
        <div className="h-6 w-full bg-gray-100 border-2 border-[#111111] rounded-xl flex overflow-hidden">
          <div
            style={{ width: `${accountSplit.cashPct}%` }}
            className="bg-[#7BF1A8] border-r-2 border-[#111111] flex items-center justify-center text-[10px] font-black text-[#111111]"
          >
            {accountSplit.cashPct > 15 ? `Cash ${accountSplit.cashPct}%` : ""}
          </div>
          <div
            style={{ width: `${accountSplit.upiPct}%` }}
            className="bg-[#80BFFF] flex items-center justify-center text-[10px] font-black text-[#111111]"
          >
            {accountSplit.upiPct > 15 ? `UPI ${accountSplit.upiPct}%` : ""}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="flex items-center justify-between bg-green-50 border border-[#111111] rounded-lg px-2.5 py-1">
            <span className="font-extrabold text-[#111111]">💵 Cash:</span>
            <span className="font-black text-[#111111]">
              {formatMoney(accountSplit.cash, settings.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between bg-blue-50 border border-[#111111] rounded-lg px-2.5 py-1">
            <span className="font-extrabold text-[#111111]">📱 UPI:</span>
            <span className="font-black text-[#111111]">
              {formatMoney(accountSplit.upi, settings.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
