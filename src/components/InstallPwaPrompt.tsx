"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || isDismissed || !deferredPrompt) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-40 max-w-md mx-auto animate-bounceIn">
      <div className="bg-[#FFD84D] border-3 border-[#111111] brutal-shadow rounded-2xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-white border-2 border-[#111111] rounded-xl flex items-center justify-center shrink-0">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <h4 className="font-extrabold text-xs uppercase text-[#111111]">Install Brutal Cash</h4>
            <p className="text-[11px] font-bold text-[#111111]/80">Use offline on your home screen!</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="brutal-btn-sm bg-[#7BF1A8] hover:bg-white text-[#111111] px-2.5 py-1 text-xs font-black uppercase"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-[#111111]/70 hover:text-[#111111]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
