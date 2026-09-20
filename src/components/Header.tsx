"use client";

import React, { useState } from "react";
import { useExpense } from "@/context/ExpenseContext";
import { ArrowLeftRight, CloudCheck, CloudOff, RefreshCw, Zap } from "lucide-react";
import TransferModal from "./TransferModal";

export default function Header() {
  const { syncState, triggerCloudSync, settings } = useExpense();
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const handleSyncClick = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await triggerCloudSync();
    setIsSyncing(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FFF9E8] border-b-3 border-[#111111] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="bg-[#FFD84D] border-2.5 border-[#111111] brutal-shadow-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 transform -rotate-1">
              <Zap className="w-4 h-4 fill-[#111111] stroke-[#111111]" />
              <span className="font-extrabold text-sm tracking-tight text-[#111111]">BRUTAL CASH</span>
            </div>
            <span className="text-xs font-bold text-[#111111]/70 bg-white/80 border-2 border-[#111111] px-2 py-0.5 rounded-md hidden sm:inline-block">
              {todayFormatted}
            </span>
          </div>

          {/* Quick Actions: Transfer & Sync Status */}
          <div className="flex items-center gap-2">
            {/* Cash <-> UPI Transfer quick button */}
            <button
              onClick={() => setIsTransferOpen(true)}
              title="Transfer between Cash & UPI"
              className="brutal-btn-sm bg-white hover:bg-[#80BFFF]/20 text-[#111111] px-2.5 py-1 text-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="font-bold">Transfer</span>
            </button>

            {/* Sync Badge */}
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              title={
                settings.supabaseUrl
                  ? `Cloud Sync: ${syncState}`
                  : "Offline-First Local Mode (Configure Supabase in Settings)"
              }
              className={`brutal-badge cursor-pointer transition-all ${
                syncState === "synced"
                  ? "bg-[#7BF1A8] text-[#111111]"
                  : syncState === "syncing" || isSyncing
                  ? "bg-[#FFD84D] text-[#111111]"
                  : syncState === "error"
                  ? "bg-[#FF6B6B] text-white"
                  : "bg-white text-[#111111]"
              }`}
            >
              {syncState === "synced" ? (
                <>
                  <CloudCheck className="w-3 h-3 stroke-[2.5]" />
                  <span>Synced</span>
                </>
              ) : syncState === "syncing" || isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin stroke-[2.5]" />
                  <span>Syncing</span>
                </>
              ) : settings.supabaseUrl ? (
                <>
                  <RefreshCw className="w-3 h-3 stroke-[2.5]" />
                  <span>Sync</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3 h-3 stroke-[2.5]" />
                  <span>Local</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Transfer modal between Cash and UPI */}
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
    </>
  );
}
