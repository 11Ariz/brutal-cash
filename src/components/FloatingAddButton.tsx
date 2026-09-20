"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useExpense } from "@/context/ExpenseContext";

export default function FloatingAddButton() {
  const { openAddModal } = useExpense();

  return (
    <div className="hidden sm:block fixed sm:right-8 sm:bottom-24 z-30">
      <button
        onClick={() => openAddModal()}
        aria-label="Add transaction"
        className="brutal-btn bg-[#FFD84D] hover:bg-[#FF8FAB] text-[#111111] px-5 py-3 rounded-2xl flex items-center gap-2 group transition-all"
      >
        <Plus className="w-6 h-6 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
        <span className="font-extrabold text-sm">Add Cash / Expense</span>
      </button>
    </div>
  );
}
