import { Suspense } from "react";
import SimulationsClient from "./SimulationsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SimulationsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <SimulationsClient />
    </Suspense>
  );
}
