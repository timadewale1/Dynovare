"use client";

import * as React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { NIGERIA_COUNTRY, NIGERIA_STATES } from "@/lib/ngStates";
import { createUploadedPolicy } from "@/lib/policyWrites";
import { getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { FileUp } from "lucide-react";
import { extractPolicyText } from "@/lib/extractText";

const SECTORS = [
  "Electricity",
  "Renewable Energy",
  "Oil & Gas",
  "Clean Cooking",
  "Transport",
  "Industry",
  "Buildings",
  "Agriculture",
  "Waste",
  "Climate & Emissions",
];

export default function UploadPolicyPage() {
  const router = useRouter();
  const { user, profile } = useUser();

  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect"); // e.g. "/critique" or "/simulations"

  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");

  const [jurisdictionLevel, setJurisdictionLevel] = React.useState<
    "federal" | "state"
  >("federal");
  const [stateValue, setStateValue] = React.useState<string>("");

  // ✅ NEW: Sector (single)
  const [sector, setSector] = React.useState<string>("Electricity");

  const [policyYear, setPolicyYear] = React.useState<string>("");
  const [tags, setTags] = React.useState<string>("");

  const [sourcePublisher, setSourcePublisher] = React.useState("");
  const [sourceUrl, setSourceUrl] = React.useState("");

  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<number>(0);

  const tagArray = React.useMemo(() => {
    return tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }, [tags]);

  const yearNumber = React.useMemo(() => {
    const n = Number(policyYear);
    return Number.isFinite(n) && n > 1900 && n < 2200 ? n : null;
  }, [policyYear]);

  const validate = () => {
    if (!user || !profile) {
      toast.error("Please sign in first");
      router.push("/login");
      return false;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!sector) {
      toast.error("Please select a sector");
      return false;
    }
    if (jurisdictionLevel === "state" && !stateValue) {
      toast.error("Please select a state");
      return false;
    }
    if (!file) {
      toast.error("Please upload a PDF or DOCX file");
      return false;
    }

    const okTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!okTypes.includes(file.type)) {
      toast.error("Only PDF or Word (DOC/DOCX) is allowed");
      return false;
    }

    if (policyYear && !yearNumber) {
      toast.error("Policy year must be a valid year (e.g. 2022)");
      return false;
    }

    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl.trim())) {
      toast.error("Source link must start with http:// or https://");
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!validate()) return;

    try {
      setUploading(true);
      setProgress(0);

      const tmpId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const ext = file!.name.split(".").pop() ?? "file";
      const storagePath = `policies/uploads/${user!.uid}/${tmpId}.${ext}`;

      // Upload to Storage
      const storage = getStorage();
      const storageRef = ref(storage, storagePath);

      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file!);
        task.on(
          "state_changed",
          (snap) => {
            const pct = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100
            );
            setProgress(pct);
          },
          reject,
          () => resolve()
        );
      });

      // Extract text for critique/simulation
      const extractedText = await extractPolicyText(file!);

      // Write Firestore (global + user tracking)
      const result = await createUploadedPolicy({
        uid: user!.uid,
        uploaderName: profile!.fullName,
        email: user!.email,

        title: title.trim(),
        summary: summary.trim(),

        country: NIGERIA_COUNTRY,
        jurisdictionLevel,
        state: jurisdictionLevel === "state" ? stateValue : undefined,
        policyYear: yearNumber ?? undefined,

        // ✅ NEW: Sector saved
        sector,

        tags: tagArray,

        sourcePublisher: sourcePublisher.trim(),
        sourceUrl: sourceUrl.trim(),
        contentText: extractedText,

        storagePath,
        type: "uploaded",
      });

      toast.success("Policy uploaded successfully");

      if (redirect) {
        router.push(`${redirect}?policyId=${result.policyId}`);
      } else {
        router.push(`/policies/${result.slug}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-deep">Upload Policy</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Uploaded policies appear in the global repository and are tracked
              under your account.
            </p>
          </div>

          <Button variant="outline" onClick={() => router.push("/policies")}>
            Back to Repository
          </Button>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Policy title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lagos State Electricity Market Law"
            />
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short description of what this policy covers…"
            />
          </div>

          {/* Jurisdiction + State + Year */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Jurisdiction *</Label>
              <Select
                value={jurisdictionLevel}
                onValueChange={(v) =>
                  setJurisdictionLevel(v as "federal" | "state")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="federal">Federal</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>State {jurisdictionLevel === "state" ? "*" : ""}</Label>
              <Select
                value={stateValue}
                onValueChange={setStateValue}
                disabled={jurisdictionLevel !== "state"}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      jurisdictionLevel === "state"
                        ? "Select state"
                        : "Federal policy"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIA_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Policy year</Label>
              <Input
                value={policyYear}
                onChange={(e) => setPolicyYear(e.target.value)}
                placeholder="e.g., 2022"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* ✅ NEW: Sector */}
          <div className="space-y-2">
            <Label>Sector *</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger>
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., mini-grid, tariff, renewable, emissions"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source publisher (optional)</Label>
              <Input
                value={sourcePublisher}
                onChange={(e) => setSourcePublisher(e.target.value)}
                placeholder="e.g., Ministry of Power / IEA / IRENA"
              />
            </div>
            <div className="space-y-2">
              <Label>Source link (optional)</Label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Upload file (PDF/DOCX) *</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {uploading && (
              <p className="text-sm text-[var(--text-secondary)]">
                Uploading… {progress}%
              </p>
            )}
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="gap-2">
            <FileUp size={16} />
            {uploading ? "Uploading…" : "Upload policy"}
          </Button>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
