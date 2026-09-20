"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if running as standalone app already
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  // If already installed or dismissed, do not render banner
  if (isStandalone || isDismissed) return null;

  // Render banner if either Android beforeinstallprompt is ready OR it's iOS Safari
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <div className="fixed top-16 left-3 right-3 z-40 max-w-md mx-auto animate-bounceIn">
        <div className="bg-[#FFD84D] border-3 border-[#111111] brutal-shadow rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 bg-white border-2 border-[#111111] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-xl">⚡</span>
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs uppercase text-[#111111] truncate">
                Install Brutal Cash
              </h4>
              <p className="text-[11px] font-bold text-[#111111]/80 truncate">
                {isIOS ? "Tap for iPhone install instructions" : "Fast offline home screen app"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="brutal-btn-sm bg-[#7BF1A8] hover:bg-white text-[#111111] px-3 py-1.5 text-xs font-black uppercase tracking-wider"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isIOS ? "How To" : "Install"}</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-[#111111]/70 hover:text-[#111111]"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] animate-fadeIn">
          <div className="relative w-full max-w-sm bg-[#FFF9E8] border-4 border-[#111111] rounded-3xl brutal-shadow-lg p-5 z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#111111]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍏</span>
                <h3 className="font-black text-sm uppercase text-[#111111]">Install on iPhone</h3>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-8 h-8 rounded-lg bg-white border-2 border-[#111111] brutal-shadow-sm flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-[#111111]">
              <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border-2 border-[#111111]">
                <div className="w-7 h-7 rounded-lg bg-[#FFD84D] border border-[#111111] flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  Tap the <strong className="font-black underline">Share button</strong>{" "}
                  <Share className="inline w-3.5 h-3.5 mb-0.5" /> in Safari's bottom toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border-2 border-[#111111]">
                <div className="w-7 h-7 rounded-lg bg-[#7BF1A8] border border-[#111111] flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  Scroll down and tap{" "}
                  <strong className="font-black underline">"Add to Home Screen"</strong>{" "}
                  <PlusSquare className="inline w-3.5 h-3.5 mb-0.5" />.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border-2 border-[#111111]">
                <div className="w-7 h-7 rounded-lg bg-[#FF8FAB] border border-[#111111] flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  Tap <strong className="font-black">"Add"</strong> in the top-right corner.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full brutal-btn bg-[#FFD84D] hover:bg-[#7BF1A8] py-2.5 text-xs font-black uppercase rounded-xl"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
