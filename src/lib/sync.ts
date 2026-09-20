import { Transaction, Category, SyncState } from "@/types";

export interface SyncConfig {
  url: string;
  anonKey: string;
}

export class CloudSyncService {
  private static getHeaders(anonKey: string) {
    return {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: "return=representation",
    };
  }

  // Test connection to Supabase instance
  static async testConnection(config: SyncConfig): Promise<{ success: boolean; message: string }> {
    if (!config.url || !config.anonKey) {
      return { success: false, message: "URL and API Key are required" };
    }

    try {
      const cleanUrl = config.url.replace(/\/$/, "");
      const res = await fetch(`${cleanUrl}/rest/v1/`, {
        method: "GET",
        headers: this.getHeaders(config.anonKey),
      });

      if (res.ok || res.status === 200) {
        return { success: true, message: "Connected successfully to Supabase!" };
      }
      return { success: false, message: `Server returned HTTP ${res.status}: ${res.statusText}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      return { success: false, message: `Connection failed: ${msg}` };
    }
  }

  // Upload local transactions to Supabase (upsert)
  static async syncPush(config: SyncConfig, transactions: Transaction[]): Promise<{ count: number; error?: string }> {
    if (!config.url || !config.anonKey) return { count: 0, error: "Sync not configured" };

    try {
      const cleanUrl = config.url.replace(/\/$/, "");
      const res = await fetch(`${cleanUrl}/rest/v1/transactions`, {
        method: "POST",
        headers: {
          ...this.getHeaders(config.anonKey),
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(transactions),
      });

      if (!res.ok) {
        throw new Error(`Sync push failed (${res.status}): ${await res.text()}`);
      }

      return { count: transactions.length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync error";
      return { count: 0, error: msg };
    }
  }

  // Pull remote transactions from Supabase
  static async syncPull(config: SyncConfig): Promise<{ transactions: Transaction[]; error?: string }> {
    if (!config.url || !config.anonKey) return { transactions: [], error: "Sync not configured" };

    try {
      const cleanUrl = config.url.replace(/\/$/, "");
      const res = await fetch(`${cleanUrl}/rest/v1/transactions?select=*&order=createdAt.desc`, {
        method: "GET",
        headers: this.getHeaders(config.anonKey),
      });

      if (!res.ok) {
        throw new Error(`Sync pull failed (${res.status}): ${await res.text()}`);
      }

      const data = await res.json();
      return { transactions: data as Transaction[] };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync error";
      return { transactions: [], error: msg };
    }
  }
}
