"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, History, Calendar, BarChart3, Settings, Plus } from "lucide-react";
import { useExpense } from "@/context/ExpenseContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { openAddModal } = useExpense();

  const navItems = [
    { href: "/", label: "Home", icon: Wallet },
    { href: "/history", label: "History", icon: History },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFF9E8] border-t-3 border-[#111111] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around relative">
        {/* Navigation buttons */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl transition-all ${
                isActive
                  ? "bg-[#FFD84D] border-2 border-[#111111] brutal-shadow-sm font-extrabold text-[#111111]"
                  : "text-[#111111]/70 hover:text-[#111111] font-bold"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Quick Add Button (Neo-Brutalist Floating Action Style) */}
        <button
          onClick={() => openAddModal()}
          aria-label="Add Transaction"
          className="relative -top-5 flex items-center justify-center w-14 h-14 bg-[#FF8FAB] hover:bg-[#FF6B6B] text-[#111111] rounded-2xl border-3 border-[#111111] brutal-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all group"
        >
          <Plus className="w-8 h-8 stroke-[3.5] transition-transform group-hover:rotate-90 duration-200" />
        </button>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl transition-all ${
                isActive
                  ? "bg-[#FFD84D] border-2 border-[#111111] brutal-shadow-sm font-extrabold text-[#111111]"
                  : "text-[#111111]/70 hover:text-[#111111] font-bold"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
