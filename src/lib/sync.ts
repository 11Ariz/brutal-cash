import { Transaction } from "@/types";

export interface SyncConfig {
  url: string;
  anonKey: string;
}

export class CloudSyncService {
  private static sanitizeConfig(config: SyncConfig): { url: string; anonKey: string } {
    let cleanUrl = (config.url || "").trim().replace(/\/$/, "");
    if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }
    const cleanKey = (config.anonKey || "").trim().replace(/^Bearer\s+/i, "");
    return { url: cleanUrl, anonKey: cleanKey };
  }

  private static getHeaders(anonKey: string) {
    return {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: "return=representation",
    };
  }

  // Test connection to Supabase instance
  static async testConnection(config: SyncConfig): Promise<{ success: boolean; message: string; tableReady?: boolean }> {
    const { url, anonKey } = this.sanitizeConfig(config);

    if (!url || !anonKey) {
      return { success: false, message: "URL and API Key are required." };
    }

    try {
      // Step 1: Verify API Key against root PostgREST endpoint
      const res = await fetch(`${url}/rest/v1/`, {
        method: "GET",
        headers: this.getHeaders(anonKey),
      });

      if (!res.ok && res.status !== 200) {
        if (res.status === 401) {
          return {
            success: false,
            message: "HTTP 401: Invalid API Key. Make sure you copy the 'anon' 'public' key (starts with 'eyJh...') from Supabase Project Settings > API, not your database password or personal access token.",
          };
        }

        let detail = "";
        try {
          const errJson = await res.json();
          if (errJson?.message) detail = errJson.message;
          if (errJson?.hint) detail += ` (${errJson.hint})`;
        } catch {
          // ignore json parse error
        }

        return {
          success: false,
          message: `Server returned HTTP ${res.status}: ${detail || res.statusText || "Connection error"}`,
        };
      }

      // Step 2: Check if 'transactions' table exists
      try {
        const tableCheckRes = await fetch(`${url}/rest/v1/transactions?limit=1`, {
          method: "GET",
          headers: this.getHeaders(anonKey),
        });

        if (tableCheckRes.ok) {
          return {
            success: true,
            tableReady: true,
            message: "Connected! Supabase database and 'transactions' table are ready.",
          };
        } else if (tableCheckRes.status === 404 || tableCheckRes.status === 400) {
          return {
            success: true,
            tableReady: false,
            message: "API Key verified! Note: The 'transactions' table was not found yet. Run the SQL setup script below in your Supabase SQL Editor.",
          };
        }
      } catch {
        // non-blocking
      }

      return { success: true, tableReady: true, message: "Connected successfully to Supabase!" };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      return { success: false, message: `Connection failed: ${msg}. Check your network and URL.` };
    }
  }

  // Upload local transactions to Supabase (upsert)
  static async syncPush(config: SyncConfig, transactions: Transaction[]): Promise<{ count: number; error?: string }> {
    const { url, anonKey } = this.sanitizeConfig(config);
    if (!url || !anonKey) return { count: 0, error: "Sync not configured" };

    if (transactions.length === 0) {
      return { count: 0 };
    }

    try {
      const res = await fetch(`${url}/rest/v1/transactions`, {
        method: "POST",
        headers: {
          ...this.getHeaders(anonKey),
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(transactions),
      });

      if (!res.ok) {
        let errDetail = await res.text();
        try {
          const errObj = JSON.parse(errDetail);
          if (errObj.message) {
            errDetail = errObj.message + (errObj.hint ? ` (${errObj.hint})` : "");
          }
        } catch {
          // ignore
        }
        throw new Error(`Push failed (${res.status}): ${errDetail}`);
      }

      return { count: transactions.length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync error";
      return { count: 0, error: msg };
    }
  }

  // Pull remote transactions from Supabase
  static async syncPull(config: SyncConfig): Promise<{ transactions: Transaction[]; error?: string }> {
    const { url, anonKey } = this.sanitizeConfig(config);
    if (!url || !anonKey) return { transactions: [], error: "Sync not configured" };

    try {
      const res = await fetch(`${url}/rest/v1/transactions?select=*&order=createdAt.desc`, {
        method: "GET",
        headers: this.getHeaders(anonKey),
      });

      if (!res.ok) {
        let errDetail = await res.text();
        try {
          const errObj = JSON.parse(errDetail);
          if (errObj.message) {
            errDetail = errObj.message + (errObj.hint ? ` (${errObj.hint})` : "");
          }
        } catch {
          // ignore
        }
        throw new Error(`Pull failed (${res.status}): ${errDetail}`);
      }

      const data = await res.json();
      return { transactions: data as Transaction[] };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync error";
      return { transactions: [], error: msg };
    }
  }
}
