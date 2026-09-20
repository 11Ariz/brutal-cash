import Dexie, { Table } from "dexie";
import { Transaction, Category, AppSettings } from "@/types";
import { DEFAULT_CATEGORIES } from "./constants";

export class BrutalCashDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super("BrutalCashDB");
    this.version(1).stores({
      transactions: "id, type, amount, category, account, date, createdAt",
      categories: "id, name",
      settings: "key",
    });
  }
}

export const db = new BrutalCashDB();

// Initialize defaults if database is freshly created
export async function initDatabaseDefaults() {
  try {
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
      await db.categories.bulkAdd(DEFAULT_CATEGORIES);
    }

    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      const defaultSettings: AppSettings = {
        currency: "₹",
        soundEnabled: true,
        hapticsEnabled: true,
      };
      await db.settings.add({ key: "app_settings", value: defaultSettings });
    }
  } catch (error) {
    console.error("Failed to initialize database defaults:", error);
  }
}
