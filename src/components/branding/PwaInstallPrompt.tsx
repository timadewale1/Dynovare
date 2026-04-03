"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const PWA_INSTALL_KEY = "dynovare_pwa_install_hidden";

export default function PwaInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const installed = window.localStorage.getItem(PWA_INSTALL_KEY) === "1";
    if (standalone || installed) return;

    let revealTimer: number | null = null;

    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      revealTimer = window.setTimeout(() => setVisible(true), 900);
    };

    const installedHandler = () => {
      window.localStorage.setItem(PWA_INSTALL_KEY, "1");
      setVisible(false);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      if (revealTimer) window.clearTimeout(revealTimer);
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (!promptEvent || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-lg rounded-[1.75rem] border border-white/70 bg-white/94 p-5 shadow-[0_30px_80px_rgba(0,56,105,0.16)] backdrop-blur-xl fade-up">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Install Dynovare</p>
            <h3 className="mt-2 text-xl font-black text-blue-deep">Keep the platform one tap away.</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Install Dynovare for faster access to drafting, critique, simulations, and your workspace.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-slate-100"
            onClick={() => setVisible(false)}
            aria-label="Close install prompt"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            className="rounded-full bg-[#0073d1] hover:bg-[#003869]"
            onClick={async () => {
              await promptEvent.prompt();
              const choice = await promptEvent.userChoice.catch(() => null);
              if (choice?.outcome === "accepted") {
                window.localStorage.setItem(PWA_INSTALL_KEY, "1");
                setVisible(false);
                setPromptEvent(null);
              }
            }}
          >
            <Download size={15} />
            Install app
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => setVisible(false)}>
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
