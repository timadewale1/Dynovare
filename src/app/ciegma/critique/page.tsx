import { Suspense } from "react";
import CritiqueClient from "./CritiqueClient";

export const dynamic = "force-dynamic"; // ✅ prevents static prerender
export const revalidate = 0;

export default function CritiquePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <CritiqueClient />
    </Suspense>
  );
}
