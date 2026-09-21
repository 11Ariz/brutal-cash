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

    // Step 0: Client-side inspection of JWT payload if applicable
    try {
      const parts = anonKey.split(".");
      if (parts.length === 3) {
        const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadJson);
        const urlMatch = url.match(/https?:\/\/([^.]+)\.supabase\.co/i);
        if (urlMatch && payload.ref && payload.ref.toLowerCase() !== urlMatch[1].toLowerCase()) {
          return {
            success: false,
            message: `⚠️ Project Mismatch! Your API Key belongs to project "${payload.ref}", but the Project URL is "${urlMatch[1]}". Please copy the key from project "${urlMatch[1]}".`,
          };
        }
      }
    } catch {
      // non-blocking if not standard JWT or parsing fails
    }

    try {
      // Step 1: Verify API Key against Supabase Auth Settings endpoint (officially accessible by anon key)
      const res = await fetch(`${url}/auth/v1/settings`, {
        method: "GET",
        headers: this.getHeaders(anonKey),
      });

      if (!res.ok && res.status !== 200) {
        let detail = "";
        try {
          const errJson = await res.json();
          if (errJson?.message) detail = errJson.message;
          if (errJson?.hint) detail += ` (${errJson.hint})`;
        } catch {
          // ignore json parse error
        }

        if (res.status === 401) {
          return {
            success: false,
            message: `HTTP 401: Invalid API Key. Supabase rejected this key (${detail || "Unauthorized"}). Please double-check you copied the 'anon' 'public' key for this project.`,
          };
        }

        return {
          success: false,
          message: `Server returned HTTP ${res.status}: ${detail || res.statusText || "Connection error"}`,
        };
      }

      // Step 2: Check if 'transactions' table exists in database
      try {
        const tableCheckRes = await fetch(`${url}/rest/v1/transactions?select=id&limit=1`, {
          method: "GET",
          headers: this.getHeaders(anonKey),
        });

        if (tableCheckRes.ok) {
          return {
            success: true,
            tableReady: true,
            message: "Connected! Supabase database and 'transactions' table are ready to sync.",
          };
        } else if (tableCheckRes.status === 404 || tableCheckRes.status === 400) {
          return {
            success: true,
            tableReady: false,
            message: "API Key verified! Note: 'transactions' table was not found. Please run the SQL setup script below in your Supabase SQL Editor.",
          };
        } else if (tableCheckRes.status === 403) {
          return {
            success: true,
            tableReady: false,
            message: "API Key verified! Table exists but Row Level Security is blocking access. Run the SQL setup script below.",
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

    // PostgREST requirement: In batch POST requests, EVERY object in the array MUST contain the exact same keys.
    // If 'note' is undefined on some objects, JSON.stringify omits it, causing 'All object keys must match' error.
    const normalizedTransactions = transactions.map((tx) => ({
      id: String(tx.id),
      type: tx.type,
      amount: Number(tx.amount),
      title: String(tx.title || ""),
      category: String(tx.category || "Other"),
      account: tx.account || "cash",
      note: tx.note !== undefined && tx.note !== null && tx.note !== "" ? String(tx.note) : null,
      date: String(tx.date),
      createdAt: String(tx.createdAt),
    }));

    try {
      const res = await fetch(`${url}/rest/v1/transactions`, {
        method: "POST",
        headers: {
          ...this.getHeaders(anonKey),
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(normalizedTransactions),
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
      const res = await fetch(`${url}/rest/v1/transactions?select=*`, {
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
      const transactions: Transaction[] = (data as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        type: (row.type as "income" | "expense") || "expense",
        amount: Number(row.amount) || 0,
        title: String(row.title || ""),
        category: String(row.category || "Other"),
        account: (row.account as "cash" | "upi") || "cash",
        note: row.note ? String(row.note) : undefined,
        date: String(row.date),
        createdAt: String(row.createdAt || new Date().toISOString()),
      }));

      // Sort descending by date then createdAt
      transactions.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      });

      return { transactions };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync error";
      return { transactions: [], error: msg };
    }
  }

  // Delete single transaction from Supabase
  static async deleteRemote(config: SyncConfig, id: string): Promise<{ success: boolean; error?: string }> {
    const { url, anonKey } = this.sanitizeConfig(config);
    if (!url || !anonKey || !id) return { success: false };

    try {
      const res = await fetch(`${url}/rest/v1/transactions?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: this.getHeaders(anonKey),
      });
      return { success: res.ok };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete error";
      return { success: false, error: msg };
    }
  }
}
