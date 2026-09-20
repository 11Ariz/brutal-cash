"use client";

import React, { useState, useEffect, useRef } from "react";
import { useExpense } from "@/context/ExpenseContext";
import { TransactionType, AccountType } from "@/types";
import { QUICK_AMOUNTS, TITLE_SUGGESTIONS } from "@/lib/constants";
import { getLocalDateString } from "@/lib/calculations";
import { tactileFeedback } from "@/lib/sound";
import { X, Check, Plus, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import CategoryManagerModal from "./CategoryManagerModal";

export default function AddTransactionModal() {
  const { addModalState, closeAddModal, addTransaction, categories, settings } = useExpense();
  const { isOpen, defaults } = addModalState;

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("Food");
  const [account, setAccount] = useState<AccountType>("upi");
  const [date, setDate] = useState<string>(getLocalDateString());
  const [note, setNote] = useState<string>("");
  const [dateMode, setDateMode] = useState<"today" | "yesterday" | "custom">("today");
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or defaults change
  useEffect(() => {
    if (isOpen) {
      const todayStr = getLocalDateString();
      const targetDate = defaults?.date || todayStr;
      
      setDate(targetDate);
      
      // Calculate yesterday
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yesterdayStr = getLocalDateString(yest);

      if (targetDate === todayStr) {
        setDateMode("today");
      } else if (targetDate === yesterdayStr) {
        setDateMode("yesterday");
      } else {
        setDateMode("custom");
      }

      setType(defaults?.type || "expense");
      setAmount(defaults?.amount ? defaults.amount.toString() : "");
      setTitle(defaults?.title || "");
      setCategory(defaults?.category || (defaults?.type === "income" ? "Salary" : "Food"));
      setAccount(defaults?.account || "upi");
      setNote(defaults?.note || "");
      setIsSubmitting(false);

      // Auto-focus amount
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaults]);

  // Handle Quick Date switches
  const handleDateModeChange = (mode: "today" | "yesterday" | "custom") => {
    tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
    setDateMode(mode);
    if (mode === "today") {
      setDate(getLocalDateString());
    } else if (mode === "yesterday") {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      setDate(getLocalDateString(yest));
    }
  };

  // Add quick amount chips
  const handleAddQuickAmount = (val: number) => {
    tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const cleanTitle = title.trim() || category;

    setIsSubmitting(true);
    try {
      await addTransaction({
        type,
        amount: numAmount,
        title: cleanTitle,
        category,
        account,
        date,
        note: note.trim() || undefined,
      });
      closeAddModal();
    } catch (err) {
      console.error("Failed to add transaction:", err);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-[1px] animate-fadeIn">
        {/* Backdrop dismiss */}
        <div className="absolute inset-0" onClick={closeAddModal} />

        {/* Modal Window */}
        <div className="relative w-full max-w-md bg-[#FFF9E8] border-t-4 sm:border-4 border-[#111111] sm:rounded-3xl brutal-shadow-lg max-h-[92vh] flex flex-col overflow-hidden z-10 animate-slideUp">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b-3 border-[#111111]">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h2 className="font-extrabold text-lg uppercase tracking-wider text-[#111111]">
                Quick Entry
              </h2>
            </div>
            <button
              onClick={closeAddModal}
              className="w-9 h-9 rounded-xl bg-[#FFF9E8] hover:bg-[#FF6B6B] border-2 border-[#111111] brutal-shadow-sm flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Form Scroll Area */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
            
            {/* 1. Type Switcher: Income vs Expense */}
            <div className="grid grid-cols-2 gap-2 bg-[#111111] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
                  setType("expense");
                  if (category === "Salary" || category === "Freelance") setCategory("Food");
                }}
                className={`py-2.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  type === "expense"
                    ? "bg-[#FF8FAB] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span>💸</span>
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
                  setType("income");
                  if (category === "Food" || category === "Travel") setCategory("Salary");
                }}
                className={`py-2.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  type === "income"
                    ? "bg-[#7BF1A8] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span>💰</span>
                <span>Income</span>
              </button>
            </div>

            {/* 2. Amount Input (Big Neo-Brutalist Display) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1.5">
                Amount ({settings.currency})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#111111]">
                  {settings.currency}
                </span>
                <input
                  ref={amountInputRef}
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full brutal-input pl-12 text-3xl font-black text-[#111111] placeholder:text-gray-300"
                  required
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddQuickAmount(val)}
                    className="brutal-btn-sm bg-white hover:bg-[#FFD84D] text-[#111111] px-2.5 py-1 text-xs"
                  >
                    +{val}
                  </button>
                ))}
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount("")}
                    className="brutal-btn-sm bg-[#FF6B6B]/20 text-[#111111] px-2 py-1 text-xs ml-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* 3. Account Selector: Cash vs UPI */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1.5">
                Paid Via / Deposited Into
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
                    setAccount("cash");
                  }}
                  className={`brutal-btn py-2 text-xs uppercase ${
                    account === "cash"
                      ? "bg-[#7BF1A8] text-[#111111]"
                      : "bg-white text-[#111111]/70"
                  }`}
                >
                  <span className="text-base">💵</span>
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
                    setAccount("upi");
                  }}
                  className={`brutal-btn py-2 text-xs uppercase ${
                    account === "upi"
                      ? "bg-[#80BFFF] text-[#111111]"
                      : "bg-white text-[#111111]/70"
                  }`}
                >
                  <span className="text-base">📱</span>
                  <span>UPI</span>
                </button>
              </div>
            </div>

            {/* 4. Title Input + Quick Suggestions */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1.5">
                Description / Title
              </label>
              <input
                type="text"
                placeholder={type === "expense" ? "e.g. Chai, Lunch, Groceries" : "e.g. Salary, Client Payout"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full brutal-input text-base"
              />

              {/* Suggestions */}
              <div className="flex gap-1.5 overflow-x-auto py-1.5 no-scrollbar">
                {TITLE_SUGGESTIONS.slice(0, 7).map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => {
                      tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
                      setTitle(sugg);
                    }}
                    className="whitespace-nowrap px-2.5 py-1 text-xs font-bold bg-white border-2 border-[#111111] rounded-lg brutal-shadow-sm hover:bg-[#FFD84D] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Category Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111111]">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => {
                    tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
                    setIsCategoryManagerOpen(true);
                  }}
                  className="text-xs font-bold text-[#111111] underline hover:text-[#FF8FAB]"
                >
                  + Edit Categories
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        tactileFeedback(settings.soundEnabled, settings.hapticsEnabled);
                        setCategory(cat.name);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 border-[#111111] transition-all ${
                        isSelected
                          ? "bg-[#FFD84D] brutal-shadow scale-105 font-black"
                          : "bg-white hover:bg-yellow-50 brutal-shadow-sm font-bold text-[#111111]/80"
                      }`}
                    >
                      <span className="text-xl mb-0.5">{cat.icon}</span>
                      <span className="text-[11px] truncate w-full text-center">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Date Selection (Past & Custom Dates!) */}
            <div className="bg-white border-3 border-[#111111] p-3 rounded-2xl brutal-shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Transaction Date
                </label>
                <span className="text-xs font-bold bg-[#FFD84D] border-2 border-[#111111] px-2 py-0.5 rounded-md">
                  {date}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDateModeChange("today")}
                  className={`brutal-btn-sm py-1.5 text-xs ${
                    dateMode === "today" ? "bg-[#FFD84D] text-[#111111]" : "bg-[#FFF9E8] text-[#111111]/70"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDateModeChange("yesterday")}
                  className={`brutal-btn-sm py-1.5 text-xs ${
                    dateMode === "yesterday" ? "bg-[#FFD84D] text-[#111111]" : "bg-[#FFF9E8] text-[#111111]/70"
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => handleDateModeChange("custom")}
                  className={`brutal-btn-sm py-1.5 text-xs ${
                    dateMode === "custom" ? "bg-[#80BFFF] text-[#111111]" : "bg-[#FFF9E8] text-[#111111]/70"
                  }`}
                >
                  Past Date...
                </button>
              </div>

              {dateMode === "custom" && (
                <div className="pt-1">
                  <input
                    type="date"
                    value={date}
                    max={getLocalDateString()}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full brutal-input py-2 text-sm bg-[#FFF9E8]"
                  />
                  <p className="text-[10px] font-bold text-gray-500 mt-1">
                    ⚡ Pick any past date. Balances, streaks, and charts update retroactively.
                  </p>
                </div>
              )}
            </div>

            {/* 7. Optional Note */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="Add extra context or tag..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full brutal-input text-sm py-2"
              />
            </div>

            {/* Big Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full brutal-btn bg-[#FFD84D] hover:bg-[#7BF1A8] text-[#111111] py-3.5 text-base font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>
                  {isSubmitting
                    ? "Recording..."
                    : type === "income"
                    ? `Add +${settings.currency}${amount || "0"} Income`
                    : `Record -${settings.currency}${amount || "0"} Expense`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </>
  );
}
