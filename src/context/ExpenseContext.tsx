"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Transaction,
  Category,
  AppSettings,
  AccountBalances,
  SpendingStats,
  StreakInfo,
  SafeSpendInfo,
  AverageSpendSinceStartInfo,
  CategorySpendItem,
  AnomalyInfo,
  SyncState,
  AccountType,
} from "@/types";
import { db, initDatabaseDefaults } from "@/lib/db";
import { DEFAULT_CATEGORIES, generateSampleData } from "@/lib/constants";
import {
  calculateBalances,
  calculateSpendingStats,
  calculateSafeSpend,
  calculateAverageSpendSinceStart,
  calculateCategoryBreakdown,
  calculateStreak,
  calculateAnomaly,
  getLocalDateString,
} from "@/lib/calculations";
import { playPop, playChaChing, playThud, triggerHaptic } from "@/lib/sound";
import { CloudSyncService } from "@/lib/sync";

interface AddModalState {
  isOpen: boolean;
  defaults?: Partial<Transaction>;
}

interface ExpenseContextType {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  balances: AccountBalances;
  stats: SpendingStats;
  safeSpend: SafeSpendInfo;
  averageSpendSinceStart: AverageSpendSinceStartInfo;
  categoryBreakdown: CategorySpendItem[];
  streak: StreakInfo;
  anomaly: AnomalyInfo;
  syncState: SyncState;
  isLoaded: boolean;

  // Transaction mutations
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  transferBetweenAccounts: (amount: number, from: AccountType, to: AccountType, note?: string) => Promise<void>;

  // Category mutations
  addCategory: (cat: Omit<Category, "id">) => Promise<Category>;
  updateCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Settings & DB mutations
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loadSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  importData: (txs: Transaction[], cats?: Category[]) => Promise<void>;
  triggerCloudSync: () => Promise<{ success: boolean; message: string }>;

  // Modal State for Quick Add
  addModalState: AddModalState;
  openAddModal: (defaults?: Partial<Transaction>) => void;
  closeAddModal: () => void;
}

const defaultSettings: AppSettings = {
  currency: "₹",
  soundEnabled: true,
  hapticsEnabled: true,
};

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [syncState, setSyncState] = useState<SyncState>("local");
  const [isLoaded, setIsLoaded] = useState(false);
  const [addModalState, setAddModalState] = useState<AddModalState>({ isOpen: false });

  // Load from IndexedDB on mount
  useEffect(() => {
    async function loadData() {
      try {
        await initDatabaseDefaults();

        const [loadedTxs, loadedCats, loadedSettingsRecord] = await Promise.all([
          db.transactions.toArray(),
          db.categories.toArray(),
          db.settings.get("app_settings"),
        ]);

        // Sort descending by date, then createdAt
        const sortedTxs = loadedTxs.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.createdAt.localeCompare(a.createdAt);
        });

        setTransactions(sortedTxs);
        if (loadedCats && loadedCats.length > 0) {
          setCategories(loadedCats);
        }
        if (loadedSettingsRecord?.value) {
          setSettings(loadedSettingsRecord.value as AppSettings);
        }
      } catch (err) {
        console.error("IndexedDB load error, falling back to local defaults:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();
  }, []);

  // Recalculate derived financial figures
  const balances = useMemo(() => calculateBalances(transactions), [transactions]);
  const stats = useMemo(() => calculateSpendingStats(transactions), [transactions]);
  const safeSpend = useMemo(() => calculateSafeSpend(balances.total), [balances.total]);
  const averageSpendSinceStart = useMemo(
    () => calculateAverageSpendSinceStart(transactions),
    [transactions]
  );
  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, categories, "all"),
    [transactions, categories]
  );
  const streak = useMemo(() => calculateStreak(transactions), [transactions]);
  const anomaly = useMemo(() => calculateAnomaly(transactions, stats), [transactions, stats]);

  // Transaction Actions
  const addTransaction = useCallback(
    async (txInput: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> => {
      const newTx: Transaction = {
        ...txInput,
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };

      // Tactile feedback
      if (newTx.type === "income") {
        playChaChing(settings.soundEnabled);
      } else {
        playThud(settings.soundEnabled);
      }
      triggerHaptic(settings.hapticsEnabled, "medium");

      // Update state immediately for zero-lag response
      setTransactions((prev) => {
        const next = [newTx, ...prev];
        return next.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.createdAt.localeCompare(a.createdAt);
        });
      });

      // Persist to IndexedDB
      try {
        await db.transactions.add(newTx);
      } catch (err) {
        console.error("Failed to save transaction to IndexedDB:", err);
      }

      // Background sync to Supabase if configured
      if (settings.supabaseUrl && settings.supabaseKey) {
        CloudSyncService.syncPush(
          { url: settings.supabaseUrl, anonKey: settings.supabaseKey },
          [newTx]
        ).catch((err) => console.error("Background sync push failed:", err));
      }

      return newTx;
    },
    [settings]
  );

  const updateTransaction = useCallback(
    async (tx: Transaction): Promise<void> => {
      playPop(settings.soundEnabled);
      triggerHaptic(settings.hapticsEnabled, "light");

      setTransactions((prev) =>
        prev.map((item) => (item.id === tx.id ? tx : item)).sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.createdAt.localeCompare(a.createdAt);
        })
      );

      try {
        await db.transactions.put(tx);
      } catch (err) {
        console.error("Failed to update transaction in IndexedDB:", err);
      }

      // Background sync to Supabase if configured
      if (settings.supabaseUrl && settings.supabaseKey) {
        CloudSyncService.syncPush(
          { url: settings.supabaseUrl, anonKey: settings.supabaseKey },
          [tx]
        ).catch((err) => console.error("Background sync update failed:", err));
      }
    },
    [settings]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      playThud(settings.soundEnabled);
      triggerHaptic(settings.hapticsEnabled, "medium");

      setTransactions((prev) => prev.filter((item) => item.id !== id));

      try {
        await db.transactions.delete(id);
      } catch (err) {
        console.error("Failed to delete transaction from IndexedDB:", err);
      }

      // Background delete from Supabase if configured
      if (settings.supabaseUrl && settings.supabaseKey) {
        CloudSyncService.deleteRemote(
          { url: settings.supabaseUrl, anonKey: settings.supabaseKey },
          id
        ).catch((err) => console.error("Background sync delete failed:", err));
      }
    },
    [settings]
  );

  // Transfer between accounts (e.g. Cash to UPI or UPI to Cash)
  const transferBetweenAccounts = useCallback(
    async (amount: number, from: AccountType, to: AccountType, note?: string): Promise<void> => {
      if (from === to || amount <= 0) return;

      const dateStr = getLocalDateString();
      const transferId = Date.now().toString(36);

      const outTx: Transaction = {
        id: `tx_xfer_out_${transferId}`,
        type: "expense",
        amount,
        title: `Transfer to ${to.toUpperCase()}`,
        category: "Other",
        account: from,
        note: note || `Account transfer to ${to.toUpperCase()}`,
        date: dateStr,
        createdAt: new Date().toISOString(),
      };

      const inTx: Transaction = {
        id: `tx_xfer_in_${transferId}`,
        type: "income",
        amount,
        title: `Transfer from ${from.toUpperCase()}`,
        category: "Other",
        account: to,
        note: note || `Account transfer from ${from.toUpperCase()}`,
        date: dateStr,
        createdAt: new Date(Date.now() + 100).toISOString(),
      };

      playChaChing(settings.soundEnabled);
      triggerHaptic(settings.hapticsEnabled, "medium");

      setTransactions((prev) => [inTx, outTx, ...prev]);

      try {
        await db.transactions.bulkAdd([outTx, inTx]);
      } catch (err) {
        console.error("Failed to persist transfer:", err);
      }

      // Background sync to Supabase if configured
      if (settings.supabaseUrl && settings.supabaseKey) {
        CloudSyncService.syncPush(
          { url: settings.supabaseUrl, anonKey: settings.supabaseKey },
          [outTx, inTx]
        ).catch((err) => console.error("Background sync transfer failed:", err));
      }
    },
    [settings]
  );

  // Category Actions
  const addCategory = useCallback(
    async (catInput: Omit<Category, "id">): Promise<Category> => {
      const newCat: Category = {
        ...catInput,
        id: `cat_${Date.now()}`,
        isCustom: true,
      };

      playPop(settings.soundEnabled);
      setCategories((prev) => [...prev, newCat]);

      try {
        await db.categories.add(newCat);
      } catch (err) {
        console.error("Failed to save category to IndexedDB:", err);
      }

      return newCat;
    },
    [settings]
  );

  const updateCategory = useCallback(
    async (cat: Category): Promise<void> => {
      playPop(settings.soundEnabled);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));

      try {
        await db.categories.put(cat);
      } catch (err) {
        console.error("Failed to update category in IndexedDB:", err);
      }
    },
    [settings]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      playThud(settings.soundEnabled);
      setCategories((prev) => prev.filter((c) => c.id !== id));

      try {
        await db.categories.delete(id);
      } catch (err) {
        console.error("Failed to delete category from IndexedDB:", err);
      }
    },
    [settings]
  );

  // Settings Actions
  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>): Promise<void> => {
      setSettings((prev) => {
        const merged = { ...prev, ...newSettings };
        db.settings.put({ key: "app_settings", value: merged }).catch(console.error);
        return merged;
      });
    },
    []
  );

  // Sample Data & Clear Actions
  const loadSampleData = useCallback(async (): Promise<void> => {
    const samples = generateSampleData();
    setTransactions(samples);
    playChaChing(settings.soundEnabled);
    triggerHaptic(settings.hapticsEnabled, "heavy");

    try {
      await db.transactions.clear();
      await db.transactions.bulkAdd(samples);
    } catch (err) {
      console.error("Failed to load sample data:", err);
    }
  }, [settings]);

  const clearAllData = useCallback(async (): Promise<void> => {
    playThud(settings.soundEnabled);
    setTransactions([]);

    try {
      await db.transactions.clear();
    } catch (err) {
      console.error("Failed to clear transactions:", err);
    }
  }, [settings]);

  const importData = useCallback(
    async (txs: Transaction[], cats?: Category[]): Promise<void> => {
      setTransactions(txs);
      if (cats && cats.length > 0) {
        setCategories(cats);
        await db.categories.clear();
        await db.categories.bulkAdd(cats);
      }
      playChaChing(settings.soundEnabled);
      try {
        await db.transactions.clear();
        await db.transactions.bulkAdd(txs);
      } catch (err) {
        console.error("Failed to import data into IndexedDB:", err);
      }
    },
    [settings]
  );

  // Cloud Sync Action (Full 2-Way Bidirectional Sync)
  const triggerCloudSync = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.supabaseUrl || !settings.supabaseKey) {
      return { success: false, message: "Configure Supabase URL and API Key in Settings first!" };
    }

    setSyncState("syncing");
    const config = { url: settings.supabaseUrl, anonKey: settings.supabaseKey };

    try {
      // 1. Pull remote transactions from Supabase
      const pullResult = await CloudSyncService.syncPull(config);
      if (pullResult.error) {
        setSyncState("error");
        return { success: false, message: `Pull failed: ${pullResult.error}` };
      }

      const remoteTxs = pullResult.transactions || [];

      // 2. Read latest local transactions from IndexedDB
      const localTxs = await db.transactions.toArray();

      // 3. Merge by ID (union of remote + local)
      const txMap = new Map<string, Transaction>();
      for (const tx of remoteTxs) {
        txMap.set(tx.id, tx);
      }

      let hasNewLocalToPush = false;
      for (const tx of localTxs) {
        const existing = txMap.get(tx.id);
        if (!existing) {
          txMap.set(tx.id, tx);
          hasNewLocalToPush = true;
        } else {
          // If local has a newer timestamp, keep local
          const existingTime = new Date(existing.createdAt).getTime();
          const localTime = new Date(tx.createdAt).getTime();
          if (localTime > existingTime) {
            txMap.set(tx.id, tx);
            hasNewLocalToPush = true;
          }
        }
      }

      const mergedTxs = Array.from(txMap.values()).sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      });

      // 4. Push merged transactions back to Supabase if there are new local records or difference
      if (mergedTxs.length > 0 && (hasNewLocalToPush || remoteTxs.length < mergedTxs.length)) {
        const pushResult = await CloudSyncService.syncPush(config, mergedTxs);
        if (pushResult.error) {
          setSyncState("error");
          return { success: false, message: `Push failed: ${pushResult.error}` };
        }
      }

      // 5. Update local IndexedDB and React state
      await db.transactions.clear();
      if (mergedTxs.length > 0) {
        await db.transactions.bulkAdd(mergedTxs);
      }
      setTransactions(mergedTxs);

      const nowIso = new Date().toISOString();
      await updateSettings({ lastSyncedAt: nowIso });
      setSyncState("synced");
      playChaChing(settings.soundEnabled);

      return {
        success: true,
        message: `Synced! ${mergedTxs.length} transactions total (${remoteTxs.length} from cloud).`,
      };
    } catch (err: unknown) {
      setSyncState("error");
      const msg = err instanceof Error ? err.message : "Sync error";
      return { success: false, message: `Sync error: ${msg}` };
    }
  }, [settings, updateSettings]);

  // Auto-sync on startup once local storage is loaded and credentials exist
  const hasAutoSyncedRef = useRef(false);
  useEffect(() => {
    if (isLoaded && settings.supabaseUrl && settings.supabaseKey && !hasAutoSyncedRef.current) {
      hasAutoSyncedRef.current = true;
      triggerCloudSync();
    }
  }, [isLoaded, settings.supabaseUrl, settings.supabaseKey, triggerCloudSync]);

  // Modal Control
  const openAddModal = useCallback((defaults?: Partial<Transaction>) => {
    playPop(settings.soundEnabled);
    triggerHaptic(settings.hapticsEnabled, "light");
    setAddModalState({ isOpen: true, defaults });
  }, [settings]);

  const closeAddModal = useCallback(() => {
    playPop(settings.soundEnabled);
    setAddModalState({ isOpen: false, defaults: undefined });
  }, [settings]);

  const value = useMemo(
    () => ({
      transactions,
      categories,
      settings,
      balances,
      stats,
      safeSpend,
      averageSpendSinceStart,
      categoryBreakdown,
      streak,
      anomaly,
      syncState,
      isLoaded,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      transferBetweenAccounts,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      loadSampleData,
      clearAllData,
      importData,
      triggerCloudSync,
      addModalState,
      openAddModal,
      closeAddModal,
    }),
    [
      transactions,
      categories,
      settings,
      balances,
      stats,
      safeSpend,
      averageSpendSinceStart,
      categoryBreakdown,
      streak,
      anomaly,
      syncState,
      isLoaded,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      transferBetweenAccounts,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      loadSampleData,
      clearAllData,
      importData,
      triggerCloudSync,
      addModalState,
      openAddModal,
      closeAddModal,
    ]
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpense() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) {
    throw new Error("useExpense must be used within an ExpenseProvider");
  }
  return ctx;
}
