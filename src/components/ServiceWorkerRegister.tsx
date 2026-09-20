"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const swUrl = `${basePath}/sw.js`;
      
      navigator.serviceWorker
        .register(swUrl, { scope: `${basePath}/` })
        .then((reg) => {
          console.log("BRUTAL CASH Service Worker registered successfully, scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker registration notice:", err);
        });
    }
  }, []);

  return null;
}
