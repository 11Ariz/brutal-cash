"use client";

import React, { useState, useMemo } from "react";
import { useExpense } from "@/context/ExpenseContext";
import { formatMoney, getLocalDateString } from "@/lib/calculations";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame, Plus } from "lucide-react";
import DayDetailsModal from "@/components/DayDetailsModal";

export default function CalendarPage() {
  const { transactions, settings, openAddModal } = useExpense();

  // Current viewed month and year
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format header month name
  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  // Pre-calculate daily totals map for fast calendar rendering
  const dailyTotals = useMemo(() => {
    const map: { [dateStr: string]: { expense: number; income: number; count: number } } = {};

    for (const t of transactions) {
      if (!map[t.date]) {
        map[t.date] = { expense: 0, income: 0, count: 0 };
      }
      if (t.type === "expense") {
        map[t.date].expense += t.amount;
      } else {
        map[t.date].income += t.amount;
      }
      map[t.date].count += 1;
    }

    return map;
  }, [transactions]);

  // Generate calendar days grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust so Monday is 0
    const startOffset = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPastOrToday: boolean;
    }> = [];

    const todayStr = getLocalDateString(new Date());

    // 1. Previous month trailing days
    for (let i = startOffset - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevMonthDate = new Date(year, month - 1, dNum);
      const dateStr = getLocalDateString(prevMonthDate);
      days.push({
        dayNumber: dNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isPastOrToday: dateStr <= todayStr,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const dateStr = getLocalDateString(thisDate);
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isPastOrToday: dateStr <= todayStr,
      });
    }

    // 3. Next month leading days to complete grid (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextMonthDate = new Date(year, month + 1, n);
      const dateStr = getLocalDateString(nextMonthDate);
      days.push({
        dayNumber: n,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isPastOrToday: dateStr <= todayStr,
      });
    }

    return days;
  }, [year, month]);

  // Compute month summary statistics
  const monthSummary = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let noSpendDays = 0;

    const todayStr = getLocalDateString();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayData = dailyTotals[dStr];

      if (dayData) {
        totalExpense += dayData.expense;
        totalIncome += dayData.income;
        if (dayData.expense === 0 && dStr <= todayStr) {
          noSpendDays++;
        }
      } else if (dStr <= todayStr) {
        noSpendDays++;
      }
    }

    return { totalExpense, totalIncome, noSpendDays };
  }, [dailyTotals, year, month]);

  const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-3 pb-8">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#111111]">
            Spending Calendar
          </h1>
          <p className="text-xs font-bold text-gray-600">
            Tap any day to view transactions or log past expenses
          </p>
        </div>

        <button
          onClick={goToToday}
          className="brutal-btn-sm bg-white hover:bg-[#FFD84D] px-2.5 py-1 text-xs font-black uppercase"
        >
          Today
        </button>
      </div>

      {/* Month Navigation Card */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-3 brutal-shadow flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-xl bg-[#FFF9E8] border-2 border-[#111111] brutal-shadow-sm flex items-center justify-center hover:bg-[#FFD84D] active:translate-x-0.5"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="font-black text-base uppercase tracking-wider text-[#111111]">
            {monthName}
          </span>
        </div>

        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-xl bg-[#FFF9E8] border-2 border-[#111111] brutal-shadow-sm flex items-center justify-center hover:bg-[#FFD84D] active:translate-x-0.5"
          aria-label="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Monthly Summary Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#FF8FAB] border-2 border-[#111111] p-2 rounded-xl brutal-shadow-sm">
          <span className="text-[9px] font-black uppercase text-[#111111]/70 block">Spent</span>
          <span className="text-xs font-black text-[#111111] truncate block">
            {formatMoney(monthSummary.totalExpense, settings.currency)}
          </span>
        </div>

        <div className="bg-[#7BF1A8] border-2 border-[#111111] p-2 rounded-xl brutal-shadow-sm">
          <span className="text-[9px] font-black uppercase text-[#111111]/70 block">Earned</span>
          <span className="text-xs font-black text-[#111111] truncate block">
            {formatMoney(monthSummary.totalIncome, settings.currency)}
          </span>
        </div>

        <div className="bg-[#FFD84D] border-2 border-[#111111] p-2 rounded-xl brutal-shadow-sm">
          <span className="text-[9px] font-black uppercase text-[#111111]/70 block">No-Spend</span>
          <span className="text-xs font-black text-[#111111] block flex items-center gap-1">
            <span>🔥</span> {monthSummary.noSpendDays} Days
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-3 brutal-shadow">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2 pb-1 border-b-2 border-[#111111]">
          {weekDayLabels.map((lbl) => (
            <span key={lbl} className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              {lbl}
            </span>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, idx) => {
            const dayData = dailyTotals[cell.dateStr];
            const hasExpense = dayData && dayData.expense > 0;
            const hasIncome = dayData && dayData.income > 0;
            const isNoSpend = cell.isPastOrToday && (!dayData || dayData.expense === 0);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDayDate(cell.dateStr)}
                className={`min-h-[58px] p-1 rounded-xl border-2 flex flex-col justify-between items-center transition-all ${
                  cell.isToday
                    ? "bg-[#FFD84D] border-[#111111] ring-2 ring-[#111111] font-black"
                    : cell.isCurrentMonth
                    ? "bg-white border-[#111111] hover:bg-yellow-50"
                    : "bg-gray-100 border-gray-300 text-gray-400 opacity-60"
                } ${cell.isCurrentMonth ? "brutal-shadow-sm active:translate-x-0.5 active:translate-y-0.5" : ""}`}
              >
                {/* Day number */}
                <span
                  className={`text-[11px] font-black ${
                    cell.isToday ? "text-[#111111]" : cell.isCurrentMonth ? "text-[#111111]" : "text-gray-400"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* Spend badge or No-spend indicator */}
                <div className="w-full flex flex-col items-center">
                  {hasExpense ? (
                    <span className="w-full text-center text-[9px] font-black text-pink-700 bg-pink-100 border border-[#111111] rounded py-0.5 truncate leading-tight">
                      -{settings.currency}{dayData.expense > 9999 ? `${Math.round(dayData.expense/1000)}k` : dayData.expense}
                    </span>
                  ) : isNoSpend && cell.isCurrentMonth ? (
                    <span className="text-[10px]" title="No Spend Day!">
                      🔥
                    </span>
                  ) : null}

                  {/* Income dot indicator */}
                  {hasIncome && (
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-0.5" title="Income received" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Add helper text */}
      <div className="text-center">
        <p className="text-[11px] font-bold text-gray-600">
          💡 Click any past day to backdate transactions or see day details.
        </p>
      </div>

      {/* Day Details Inspection Modal */}
      <DayDetailsModal
        date={selectedDayDate}
        onClose={() => setSelectedDayDate(null)}
      />
    </div>
  );
}
