import { Suspense } from "react";
import UploadPolicyClient from "./UploadPolicyClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function UploadPolicyPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <UploadPolicyClient />
    </Suspense>
  );
}
