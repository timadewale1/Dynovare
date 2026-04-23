"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { usePublicTheme } from "@/components/public/usePublicTheme";

export default function PublicThemeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { theme, toggleTheme, mounted } = usePublicTheme();
  const dark = !mounted || theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-full border p-2.5 transition ${
        dark
          ? "border-white/14 bg-white/7 text-white hover:bg-white/10"
          : "border-[#cfe0ef] bg-white/88 text-[#003869] hover:bg-[#eef6ff]"
      } ${compact ? "w-full" : "h-10 w-10"}`}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
    >
      <span className="relative flex items-center justify-center">
        <SunMedium size={15} className={`absolute transition ${dark ? "scale-100 opacity-100" : "scale-75 opacity-0"}`} />
        <MoonStar size={15} className={`transition ${dark ? "scale-75 opacity-0" : "scale-100 opacity-100"}`} />
      </span>
    </button>
  );
}
