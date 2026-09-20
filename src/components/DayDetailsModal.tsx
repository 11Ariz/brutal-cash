"use client";

import React from "react";
import { Transaction } from "@/types";
import { useExpense } from "@/context/ExpenseContext";
import { formatMoney } from "@/lib/calculations";
import { X, Plus, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface DayDetailsModalProps {
  date: string | null;
  onClose: () => void;
}

export default function DayDetailsModal({ date, onClose }: DayDetailsModalProps) {
  const { transactions, settings, openAddModal, deleteTransaction } = useExpense();

  if (!date) return null;

  const dayTransactions = transactions.filter((t) => t.date === date);
  const totalExpense = dayTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = dayTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date + "T00:00:00"));

  const handleAddForThisDay = () => {
    onClose();
    openAddModal({ date });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#FFF9E8] border-4 border-[#111111] rounded-3xl brutal-shadow-lg p-5 z-10 animate-slideUp max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b-2 border-[#111111]">
          <div>
            <h3 className="font-extrabold text-base uppercase text-[#111111]">{formattedDate}</h3>
            <p className="text-xs font-bold text-gray-600">
              {totalExpense === 0 ? (
                <span className="text-green-700 font-black">🔥 Zero Spend Day!</span>
              ) : (
                `Spent ${formatMoney(totalExpense, settings.currency)}`
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border-2 border-[#111111] brutal-shadow-sm flex items-center justify-center hover:bg-[#FF6B6B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Day Summary Cards */}
        <div className="grid grid-cols-2 gap-2 my-2">
          <div className="bg-[#FF8FAB] border-2 border-[#111111] p-2.5 rounded-xl brutal-shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#111111]/70">Total Spent</span>
            <div className="font-extrabold text-base text-[#111111]">
              {formatMoney(totalExpense, settings.currency)}
            </div>
          </div>
          <div className="bg-[#7BF1A8] border-2 border-[#111111] p-2.5 rounded-xl brutal-shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#111111]/70">Total Income</span>
            <div className="font-extrabold text-base text-[#111111]">
              {formatMoney(totalIncome, settings.currency)}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto my-2 space-y-2">
          {dayTransactions.length === 0 ? (
            <div className="text-center py-8 bg-white border-2 border-[#111111] rounded-2xl brutal-shadow-sm p-4">
              <span className="text-3xl mb-1 block">🏖️</span>
              <p className="font-extrabold text-sm text-[#111111]">No transactions on this day</p>
              <p className="text-xs text-gray-500 font-bold mt-1">
                Zero expenses helped fuel your streak!
              </p>
            </div>
          ) : (
            dayTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white border-2 border-[#111111] p-3 rounded-xl brutal-shadow-sm flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border-2 border-[#111111] flex items-center justify-center shrink-0 ${
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
                    <div className="font-extrabold text-xs text-[#111111] line-clamp-1">
                      {tx.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="brutal-badge text-[9px] py-0 px-1 bg-yellow-100">
                        {tx.category}
                      </span>
                      <span className="brutal-badge text-[9px] py-0 px-1 uppercase bg-blue-100">
                        {tx.account}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-black text-sm ${
                      tx.type === "income" ? "text-green-700" : "text-[#111111]"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {settings.currency}
                    {tx.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Add for this day */}
        <div className="pt-2 border-t-2 border-[#111111]">
          <button
            onClick={handleAddForThisDay}
            className="w-full brutal-btn bg-[#FFD84D] hover:bg-[#7BF1A8] py-2.5 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Expense / Money for This Day</span>
          </button>
        </div>
      </div>
    </div>
  );
}
