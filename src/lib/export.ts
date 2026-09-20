import { Transaction, Category, AppSettings } from "@/types";

export function exportToCSV(transactions: Transaction[], filename = "brutal_cash_transactions.csv") {
  const headers = ["ID", "Type", "Amount", "Title", "Category", "Account", "Date", "Note", "CreatedAt"];
  const rows = transactions.map((t) => [
    t.id,
    t.type,
    t.amount.toString(),
    `"${(t.title || "").replace(/"/g, '""')}"`,
    `"${(t.category || "").replace(/"/g, '""')}"`,
    t.account,
    t.date,
    `"${(t.note || "").replace(/"/g, '""')}"`,
    t.createdAt,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  // \uFEFF BOM ensures Excel parses UTF-8 correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export function exportToJSON(data: { transactions: Transaction[]; categories: Category[]; settings?: AppSettings }) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  downloadBlob(blob, `brutal_cash_backup_${new Date().toISOString().split("T")[0]}.json`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseJSONImport(file: File): Promise<{
  transactions?: Transaction[];
  categories?: Category[];
  settings?: AppSettings;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed.transactions) && !Array.isArray(parsed)) {
          throw new Error("Invalid format: File does not contain transactions array");
        }
        if (Array.isArray(parsed)) {
          resolve({ transactions: parsed as Transaction[] });
        } else {
          resolve(parsed);
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
