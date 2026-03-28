"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const PWA_INSTALL_KEY = "dynovare_pwa_install_hidden";

export default function PwaInstallButton({
  className = "",
  variant = "outline",
}: {
  className?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const hidden = window.localStorage.getItem(PWA_INSTALL_KEY) === "1";
    setIsInstalled(standalone || hidden);

    const handler = (event: Event) => {
      event.preventDefault();
      if (window.localStorage.getItem(PWA_INSTALL_KEY) === "1") return;
      setPromptEvent(event as InstallPromptEvent);
    };

    const installedHandler = () => {
      window.localStorage.setItem(PWA_INSTALL_KEY, "1");
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (isInstalled || !promptEvent) return null;

  return (
    <Button
      variant={variant}
      className={className}
      onClick={async () => {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice.catch(() => null);
        if (choice?.outcome === "accepted") {
          window.localStorage.setItem(PWA_INSTALL_KEY, "1");
          setIsInstalled(true);
        }
        setPromptEvent(null);
      }}
    >
      <Download size={14} />
      Install app
    </Button>
  );
}
