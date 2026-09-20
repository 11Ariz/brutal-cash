import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ExpenseProvider } from "@/context/ExpenseContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import FloatingAddButton from "@/components/FloatingAddButton";
import AddTransactionModal from "@/components/AddTransactionModal";
import InstallPwaPrompt from "@/components/InstallPwaPrompt";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#FFF9E8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "BRUTAL CASH | Playful Neo-Brutalist Expense & Balance Tracker",
  description: "Mobile-first, offline-first balance money tracker with instant speed and neo-brutalist charm.",
  manifest: `${basePath}/manifest.json`,
  icons: {
    icon: `${basePath}/icons/icon.svg`,
    shortcut: `${basePath}/icons/icon-192.png`,
    apple: `${basePath}/icons/apple-touch-icon.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Brutal Cash",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FFF9E8] text-[#111111] font-sans selection:bg-[#FFD84D] selection:text-[#111111]">
        <ExpenseProvider>
          <div className="flex flex-col min-h-screen max-w-md mx-auto w-full border-x-0 sm:border-x-3 border-[#111111] bg-[#FFF9E8] shadow-2xl relative">
            <ServiceWorkerRegister />
            <Header />
            <InstallPwaPrompt />
            <main className="flex-1 pb-24 px-4 pt-3 overflow-x-hidden">
              {children}
            </main>
            <FloatingAddButton />
            <BottomNav />
            <AddTransactionModal />
          </div>
        </ExpenseProvider>
      </body>
    </html>
  );
}
