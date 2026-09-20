"use client";

import React, { useState } from "react";
import { useExpense } from "@/context/ExpenseContext";
import { AccountType } from "@/types";
import { ArrowLeftRight, X, Check } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { balances, transferBetweenAccounts, settings } = useExpense();
  const [from, setFrom] = useState<AccountType>("upi");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const to: AccountType = from === "upi" ? "cash" : "upi";

  const handleSwap = () => {
    setFrom((prev) => (prev === "upi" ? "cash" : "upi"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid transfer amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await transferBetweenAccounts(numAmount, from, to, note);
      onClose();
      setAmount("");
      setNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#FFF9E8] border-4 border-[#111111] rounded-3xl brutal-shadow-lg p-5 z-10 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#111111]">
          <div className="flex items-center gap-2">
            <div className="bg-[#FFD84D] border-2 border-[#111111] p-1.5 rounded-lg">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h3 className="font-black text-base uppercase text-[#111111]">Transfer Balance</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border-2 border-[#111111] brutal-shadow-sm flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Visual Transfer Direction */}
          <div className="bg-white border-3 border-[#111111] p-3 rounded-2xl brutal-shadow-sm flex items-center justify-between">
            <div className="flex-1 text-center">
              <span className="text-[10px] font-black uppercase text-gray-500">From</span>
              <div className="font-extrabold text-sm uppercase text-[#111111] mt-0.5">
                {from === "upi" ? "📱 UPI" : "💵 Cash"}
              </div>
              <div className="text-[11px] font-bold text-gray-600">
                {settings.currency}{from === "upi" ? balances.upi : balances.cash}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSwap}
              className="w-9 h-9 rounded-xl bg-[#FFD84D] border-2 border-[#111111] brutal-shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
              title="Click to switch direction"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <div className="flex-1 text-center">
              <span className="text-[10px] font-black uppercase text-gray-500">To</span>
              <div className="font-extrabold text-sm uppercase text-[#111111] mt-0.5">
                {to === "upi" ? "📱 UPI" : "💵 Cash"}
              </div>
              <div className="text-[11px] font-bold text-gray-600">
                {settings.currency}{to === "upi" ? balances.upi : balances.cash}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
              Transfer Amount ({settings.currency})
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 2000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full brutal-input text-xl font-black"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. ATM withdrawal, Bank deposit"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full brutal-input text-sm py-2"
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full brutal-btn bg-[#7BF1A8] hover:bg-[#FFD84D] text-[#111111] py-3 text-sm font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirm Transfer</span>
          </button>
        </form>
      </div>
    </div>
  );
}
