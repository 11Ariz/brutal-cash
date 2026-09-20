"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useExpense } from "@/context/ExpenseContext";
import { formatMoney, getLocalDateString } from "@/lib/calculations";
import { tactileFeedback } from "@/lib/sound";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Calendar,
  X,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

export default function HistoryPage() {
  const { transactions, categories, settings, deleteTransaction, openAddModal } = useExpense();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [selectedAccount, setSelectedAccount] = useState<"all" | "cash" | "upi">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Pagination State (loads 10 at once)
  const [visibleCount, setVisibleCount] = useState(10);

  // Reset pagination whenever search or filter criteria change
  useEffect(() => {
    setVisibleCount(10);
  }, [
    searchQuery,
    selectedType,
    selectedAccount,
    selectedCategory,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  // Compute filtered transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    // Week start (Monday)
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const mondayStr = getLocalDateString(monday);

    // Month start
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    return transactions.filter((t) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (t.title || "").toLowerCase().includes(q);
        const matchCat = (t.category || "").toLowerCase().includes(q);
        const matchNote = (t.note || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchNote) return false;
      }

      // 2. Type
      if (selectedType !== "all" && t.type !== selectedType) return false;

      // 3. Account
      if (selectedAccount !== "all" && t.account !== selectedAccount) return false;

      // 4. Category
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;

      // 5. Date Filter
      if (dateFilter === "today") {
        if (t.date !== todayStr) return false;
      } else if (dateFilter === "week") {
        if (t.date < mondayStr || t.date > todayStr) return false;
      } else if (dateFilter === "month") {
        if (t.date < monthStartStr || t.date > todayStr) return false;
      } else if (dateFilter === "custom") {
        if (customStartDate && t.date < customStartDate) return false;
        if (customEndDate && t.date > customEndDate) return false;
      }

      return true;
    });
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedAccount,
    selectedCategory,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  // Slice to visible page count (10 at a time)
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  // Group visible transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: typeof paginatedTransactions } = {};

    for (const t of paginatedTransactions) {
      if (!groups[t.date]) {
        groups[t.date] = [];
      }
      groups[t.date].push(t);
    }

    // Sort group dates descending
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date,
        transactions: groups[date],
        totalExpense: groups[date]
          .filter((t) => t.type === "expense")
          .reduce((sum, item) => sum + item.amount, 0),
        totalIncome: groups[date]
          .filter((t) => t.type === "income")
          .reduce((sum, item) => sum + item.amount, 0),
      }));
  }, [paginatedTransactions]);

  const activeFilterCount =
    (selectedType !== "all" ? 1 : 0) +
    (selectedAccount !== "all" ? 1 : 0) +
    (selectedCategory !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedType("all");
    setSelectedAccount("all");
    setSelectedCategory("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSearchQuery("");
  };

  const formatDateHeader = (dateStr: string) => {
    const today = getLocalDateString();
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = getLocalDateString(yest);

    if (dateStr === today) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";

    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr + "T00:00:00"));
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Title & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#111111]">
            Transaction Log
          </h1>
          <p className="text-xs font-bold text-gray-600">
            Showing {Math.min(visibleCount, filteredTransactions.length)} of {filteredTransactions.length} entries
            {filteredTransactions.length !== transactions.length ? ` (filtered from ${transactions.length})` : ""}
          </p>
        </div>

        <button
          onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          className={`brutal-btn-sm py-1.5 px-3 rounded-xl text-xs font-black uppercase ${
            activeFilterCount > 0 ? "bg-[#FF8FAB] text-[#111111]" : "bg-white text-[#111111]"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#111111] text-white text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search by title, category, or note..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full brutal-input pl-10 pr-9 py-2.5 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filter Pill Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {/* Date Shortcuts */}
        {[
          { id: "all", label: "All Time" },
          { id: "today", label: "Today" },
          { id: "week", label: "This Week" },
          { id: "month", label: "This Month" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setDateFilter(f.id as typeof dateFilter)}
            className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-extrabold border-2 border-[#111111] transition-all ${
              dateFilter === f.id
                ? "bg-[#FFD84D] brutal-shadow-sm text-[#111111]"
                : "bg-white text-[#111111]/70 hover:bg-yellow-50"
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Account Filters */}
        <button
          onClick={() => setSelectedAccount((prev) => (prev === "cash" ? "all" : "cash"))}
          className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-extrabold border-2 border-[#111111] ${
            selectedAccount === "cash"
              ? "bg-[#7BF1A8] brutal-shadow-sm text-[#111111]"
              : "bg-white text-[#111111]/70"
          }`}
        >
          💵 Cash Only
        </button>

        <button
          onClick={() => setSelectedAccount((prev) => (prev === "upi" ? "all" : "upi"))}
          className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-extrabold border-2 border-[#111111] ${
            selectedAccount === "upi"
              ? "bg-[#80BFFF] brutal-shadow-sm text-[#111111]"
              : "bg-white text-[#111111]/70"
          }`}
        >
          📱 UPI Only
        </button>
      </div>

      {/* Detailed Filter Expandable Drawer */}
      {showFilterDrawer && (
        <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-3 animate-slideDown">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#111111]">
            <h3 className="font-black text-xs uppercase tracking-wider text-[#111111]">
              Advanced Filters
            </h3>
            <button
              onClick={clearAllFilters}
              className="text-xs font-black text-red-600 hover:underline"
            >
              Reset All
            </button>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#111111] mb-1">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "all", label: "All" },
                { id: "expense", label: "💸 Expense" },
                { id: "income", label: "💰 Income" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id as typeof selectedType)}
                  className={`brutal-btn-sm py-1 text-xs ${
                    selectedType === t.id
                      ? "bg-[#FFD84D] text-[#111111]"
                      : "bg-[#FFF9E8] text-[#111111]/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#111111] mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full brutal-input py-2 text-xs"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#111111] mb-1">
              Custom Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-gray-500">From</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setDateFilter("custom");
                  }}
                  className="w-full brutal-input py-1.5 text-xs bg-[#FFF9E8]"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500">To</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setDateFilter("custom");
                  }}
                  className="w-full brutal-input py-1.5 text-xs bg-[#FFF9E8]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date-Grouped Transaction List */}
      {groupedTransactions.length === 0 ? (
        <div className="text-center py-12 bg-white border-3 border-[#111111] rounded-2xl brutal-shadow p-6">
          <span className="text-4xl mb-2 block">🔍</span>
          <h3 className="font-black text-base uppercase text-[#111111]">No Transactions Found</h3>
          <p className="text-xs font-bold text-gray-600 max-w-xs mx-auto mt-1 mb-4">
            Try adjusting your search or filters, or log a new transaction.
          </p>
          <button
            onClick={clearAllFilters}
            className="brutal-btn-sm bg-[#FFD84D] hover:bg-[#7BF1A8] py-2 px-4 text-xs font-black uppercase"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map((group) => (
            <div
              key={group.date}
              className="bg-white border-3 border-[#111111] rounded-2xl brutal-shadow overflow-hidden"
            >
              {/* Group Date Header */}
              <div className="bg-[#FFF9E8] px-4 py-2.5 border-b-2 border-[#111111] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#111111]" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-[#111111]">
                    {formatDateHeader(group.date)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">({group.date})</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-black">
                  {group.totalExpense > 0 && (
                    <span className="text-pink-700 bg-pink-100 border border-[#111111] px-1.5 py-0.2 rounded text-[10px]">
                      -{settings.currency}{group.totalExpense.toLocaleString()}
                    </span>
                  )}
                  {group.totalIncome > 0 && (
                    <span className="text-green-700 bg-green-100 border border-[#111111] px-1.5 py-0.2 rounded text-[10px]">
                      +{settings.currency}{group.totalIncome.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions in Group */}
              <div className="divide-y-2 divide-[#111111]/10 px-3">
                {group.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
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

                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-[#111111] truncate">
                          {tx.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="brutal-badge text-[9px] py-0 px-1 bg-yellow-100">
                            {tx.category}
                          </span>
                          <span className="brutal-badge text-[9px] py-0 px-1 uppercase bg-blue-100">
                            {tx.account}
                          </span>
                          {tx.note && (
                            <span className="text-[10px] font-bold text-gray-500 truncate max-w-[100px]">
                              {tx.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`font-black text-sm text-right ${
                          tx.type === "income" ? "text-green-700" : "text-[#111111]"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {settings.currency}
                        {tx.amount.toLocaleString()}
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Delete "${tx.title}" (${settings.currency}${tx.amount})?`)) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg border border-[#111111] bg-white hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load 10 More Pagination Button */}
          {visibleCount < filteredTransactions.length && (
            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
                  setVisibleCount((prev) => prev + 10);
                }}
                className="w-full brutal-btn bg-[#FFD84D] hover:bg-[#FFE57F] text-[#111111] py-3 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <span>⚡ Load 10 More</span>
                <span className="text-[11px] bg-[#111111] text-white px-2 py-0.5 rounded-full font-black">
                  {filteredTransactions.length - visibleCount} left
                </span>
              </button>
            </div>
          )}

          {visibleCount >= filteredTransactions.length && filteredTransactions.length > 10 && (
            <div className="text-center py-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
              ✓ All {filteredTransactions.length} entries loaded
            </div>
          )}
        </div>
      )}
    </div>
  );
}
