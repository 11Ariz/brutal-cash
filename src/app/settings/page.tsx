"use client";

import React, { useState, useRef } from "react";
import { useExpense } from "@/context/ExpenseContext";
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { exportToCSV, exportToJSON, parseJSONImport } from "@/lib/export";
import { CloudSyncService } from "@/lib/sync";
import {
  Download,
  Upload,
  Database,
  Cloud,
  Volume2,
  VolumeX,
  Vibrate,
  Coins,
  Trash2,
  Sparkles,
  Check,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Code2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function SettingsPage() {
  const {
    transactions,
    categories,
    settings,
    updateSettings,
    loadSampleData,
    clearAllData,
    importData,
    triggerCloudSync,
    syncState,
  } = useExpense();

  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || "");
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Currency change
  const handleCurrencyChange = (newCurrency: string) => {
    updateSettings({ currency: newCurrency });
  };

  // Sound toggle
  const handleToggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  // Haptics toggle
  const handleToggleHaptics = () => {
    updateSettings({ hapticsEnabled: !settings.hapticsEnabled });
  };

  const SUPABASE_SETUP_SQL = `-- Run in Supabase SQL Editor:
create table if not exists public.transactions (
  id text primary key,
  type text not null,
  amount numeric not null,
  title text not null,
  category text not null,
  account text not null,
  note text,
  date text not null,
  "createdAt" text not null
);

alter table public.transactions enable row level security;

create policy if not exists "Allow anon full access to transactions"
on public.transactions
for all
to anon
using (true)
with check (true);`;

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // fallback
    }
  };

  // Cloud Sync Save & Test
  const handleSaveSyncConfig = async () => {
    setIsTestingSync(true);
    setSyncFeedback("Testing connection to Supabase...");

    const testRes = await CloudSyncService.testConnection({
      url: supabaseUrl.trim(),
      anonKey: supabaseKey.trim(),
    });

    if (testRes.success) {
      await updateSettings({
        supabaseUrl: supabaseUrl.trim(),
        supabaseKey: supabaseKey.trim(),
      });
      setSyncFeedback(testRes.message);
      if (testRes.tableReady) {
        await triggerCloudSync();
      } else {
        setShowSqlGuide(true);
      }
    } else {
      setSyncFeedback(testRes.message);
    }
    setIsTestingSync(false);
  };

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(transactions, "brutal_cash_transactions.csv");
  };

  const handleExportExcel = () => {
    exportToCSV(transactions, "brutal_cash_excel.csv");
  };

  const handleExportJSON = () => {
    exportToJSON({ transactions, categories, settings });
  };

  // File Import handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await parseJSONImport(file);
      if (data.transactions && data.transactions.length > 0) {
        if (
          confirm(
            `Importing will merge/replace with ${data.transactions.length} transactions. Proceed?`
          )
        ) {
          await importData(data.transactions, data.categories);
          alert("✅ Data imported successfully!");
        }
      } else {
        alert("No valid transactions found in file");
      }
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : "Invalid JSON file"}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 pb-12">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#111111]">
          Settings & Data
        </h1>
        <p className="text-xs font-bold text-gray-600">
          Preferences, backup exports, and cloud sync configuration
        </p>
      </div>

      {/* 1. APP PREFERENCES */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#111111] pb-1 border-b border-[#111111]">
          Preferences
        </h2>

        {/* Currency Selector */}
        <div>
          <label className="block text-xs font-black uppercase text-[#111111] mb-1.5 flex items-center gap-1.5">
            <Coins className="w-4 h-4" />
            <span>Currency Symbol</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {CURRENCY_OPTIONS.map((c) => (
              <button
                key={c.code}
                onClick={() => handleCurrencyChange(c.symbol)}
                className={`brutal-btn-sm py-1.5 px-2 text-xs ${
                  settings.currency === c.symbol
                    ? "bg-[#FFD84D] text-[#111111]"
                    : "bg-[#FFF9E8] text-[#111111]/70"
                }`}
              >
                <span className="font-black text-sm">{c.symbol}</span>
                <span className="text-[10px]">{c.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Audio & Haptic Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`brutal-btn-sm p-2.5 rounded-xl text-xs flex items-center justify-between ${
              settings.soundEnabled ? "bg-[#7BF1A8]" : "bg-gray-100 text-gray-500"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>Sound Clicks</span>
            </div>
            <span className="text-[10px] uppercase font-black">
              {settings.soundEnabled ? "ON" : "OFF"}
            </span>
          </button>

          {/* Haptic Toggle */}
          <button
            onClick={handleToggleHaptics}
            className={`brutal-btn-sm p-2.5 rounded-xl text-xs flex items-center justify-between ${
              settings.hapticsEnabled ? "bg-[#80BFFF]" : "bg-gray-100 text-gray-500"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Vibrate className="w-4 h-4" />
              <span>Vibrations</span>
            </div>
            <span className="text-[10px] uppercase font-black">
              {settings.hapticsEnabled ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      </div>

      {/* 2. DATA BACKUP & EXPORT */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#111111] pb-1 border-b border-[#111111]">
          Data Export & Import
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="brutal-btn-sm bg-white hover:bg-[#FFD84D] py-2.5 rounded-xl flex flex-col items-center gap-1 text-[#111111]"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">CSV</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="brutal-btn-sm bg-white hover:bg-[#7BF1A8] py-2.5 rounded-xl flex flex-col items-center gap-1 text-[#111111]"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">Excel</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="brutal-btn-sm bg-white hover:bg-[#FF8FAB] py-2.5 rounded-xl flex flex-col items-center gap-1 text-[#111111]"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">JSON</span>
          </button>
        </div>

        {/* JSON Import Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full brutal-btn-sm bg-[#FFF9E8] hover:bg-[#FFD84D] py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 text-[#111111]"
          >
            <Upload className="w-4 h-4" />
            <span>{isImporting ? "Importing Data..." : "Restore From JSON Backup"}</span>
          </button>
        </div>
      </div>

      {/* 3. CLOUD SYNC (SUPABASE) */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#111111]">
          <div className="flex items-center gap-1.5">
            <Cloud className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">
              Cloud Sync (Supabase)
            </h2>
          </div>
          <span
            className={`brutal-badge text-[9px] ${
              syncState === "synced"
                ? "bg-[#7BF1A8]"
                : syncState === "syncing"
                ? "bg-[#FFD84D]"
                : "bg-gray-100"
            }`}
          >
            {syncState.toUpperCase()}
          </span>
        </div>

        <p className="text-[11px] font-bold text-gray-600">
          Sync seamlessly between your phone and other devices using your free Supabase PostgreSQL project.
        </p>

        <div className="space-y-2">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-500 mb-0.5">
              Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full brutal-input text-xs py-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[10px] font-black uppercase text-gray-500">
                Anon / Public API Key
              </label>
              {supabaseKey && (
                <span className={`text-[9px] font-bold ${supabaseKey.length < 60 ? "text-amber-600" : "text-emerald-600"}`}>
                  {supabaseKey.length} chars {supabaseKey.length < 60 ? "(Too short?)" : "✓"}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                placeholder="eyJh..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full brutal-input text-xs py-2 pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#111111]"
                title={showApiKey ? "Hide key" : "Show key"}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {supabaseKey && supabaseKey.length > 0 && supabaseKey.length < 60 && (
              <p className="mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 p-1.5 rounded-lg leading-tight">
                ⚠️ Key looks like an account token or password ({supabaseKey.length} chars). Supabase anon keys are long JWT strings (~180+ chars) starting with <code>eyJh...</code>.
              </p>
            )}
            <p className="mt-1 text-[9.5px] font-medium text-gray-500">
              📍 Find this in Supabase: <strong>Project Settings ⚙️ → API → &quot;anon&quot; &quot;public&quot;</strong>
            </p>
          </div>

          {syncFeedback && (
            <div className="text-xs font-bold text-[#111111] bg-yellow-100 p-2.5 rounded-xl border-2 border-[#111111] space-y-1">
              <p>{syncFeedback}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveSyncConfig}
              disabled={isTestingSync || !supabaseUrl}
              className="flex-1 brutal-btn bg-[#FFD84D] hover:bg-[#7BF1A8] py-2 text-xs font-black uppercase rounded-xl"
            >
              {isTestingSync ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save & Connect</span>
                </>
              )}
            </button>

            {settings.supabaseUrl && (
              <button
                onClick={async () => {
                  const res = await triggerCloudSync();
                  setSyncFeedback(res.message);
                }}
                className="brutal-btn bg-white hover:bg-yellow-50 py-2 px-3 text-xs font-black uppercase rounded-xl"
                title="Sync now"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Collapsible Supabase SQL Setup Drawer */}
          <div className="pt-2 border-t border-[#111111]/20">
            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="w-full flex items-center justify-between text-left text-[11px] font-black uppercase text-[#111111] py-1 hover:text-gray-700"
            >
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>Supabase SQL Table Setup</span>
              </div>
              {showSqlGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSqlGuide && (
              <div className="mt-2 bg-[#FFF9E8] border-2 border-[#111111] rounded-xl p-2.5 space-y-2 text-xs">
                <p className="text-[10px] font-bold text-gray-700">
                  Run this once in Supabase (<strong>SQL Editor → New Query</strong>) so BRUTAL CASH can store and sync transactions:
                </p>
                <pre className="bg-black text-[#7BF1A8] font-mono text-[10px] p-2 rounded-lg overflow-x-auto max-h-40 border border-[#111111]">
                  {SUPABASE_SETUP_SQL}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="w-full brutal-btn-sm bg-[#7BF1A8] hover:bg-[#FFD84D] py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy SQL Setup Script</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. DEMO DATA & RESET (Danger Zone) */}
      <div className="bg-white border-3 border-[#111111] rounded-2xl p-4 brutal-shadow space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#111111] pb-1 border-b border-[#111111]">
          Testing & Reset
        </h2>

        {/* Load Sample Data */}
        <button
          onClick={() => {
            if (confirm("Load realistic sample transactions to explore all features?")) {
              loadSampleData();
              alert("🎲 Sample data loaded!");
            }
          }}
          className="w-full brutal-btn bg-[#7BF1A8] hover:bg-yellow-200 text-[#111111] py-2.5 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Load Fun Sample Data</span>
        </button>

        {/* Clear All Data */}
        <button
          onClick={() => {
            if (confirm("⚠️ CAUTION: Are you sure you want to permanently delete all transactions?")) {
              clearAllData();
              alert("💥 All transactions cleared!");
            }
          }}
          className="w-full brutal-btn bg-white hover:bg-[#FF6B6B] text-[#FF6B6B] hover:text-white py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Reset / Clear All Data</span>
        </button>
      </div>

      {/* Footer credits */}
      <div className="text-center pt-2">
        <p className="font-extrabold text-xs text-[#111111]">⚡ BRUTAL CASH v1.0</p>
        <p className="text-[10px] font-bold text-gray-500">Playful Neo-Brutalist Balance Manager</p>
      </div>
    </div>
  );
}
