"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PublicPolicyListItem } from "@/lib/publicRepo";
import { Search, Filter } from "lucide-react";

const NIGERIA_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const SECTORS = [
  "All",
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

export default function PublicPoliciesClient({ initialItems }: { initialItems: PublicPolicyListItem[] }) {
  const [search, setSearch] = useState("");
  const [jurisdiction, setJurisdiction] = useState<"all" | "federal" | "state">("all");
  const [stateName, setStateName] = useState<string>("all");
  const [sector, setSector] = useState<string>("All");
  const [type, setType] = useState<string>("all");
  const [year, setYear] = useState<string>("all");

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const p of initialItems) if (typeof p.policyYear === "number") set.add(p.policyYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [initialItems]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return initialItems.filter((p) => {
      if (jurisdiction !== "all" && p.jurisdictionLevel !== jurisdiction) return false;
      if (jurisdiction === "state" && stateName !== "all" && (p.state ?? "") !== stateName) return false;

      if (sector !== "All" && (p.sector ?? "") !== sector) return false;
      if (type !== "all" && (p.type ?? "") !== type) return false;
      if (year !== "all" && String(p.policyYear ?? "") !== year) return false;

      if (!s) return true;

      const hay = [
        p.title,
        p.summary,
        p.country,
        p.state,
        p.jurisdictionLevel,
        p.type,
        p.sector,
        ...(Array.isArray(p.tags) ? p.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [initialItems, search, jurisdiction, stateName, sector, type, year]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Filters */}
      <div className="border rounded-2xl p-4 md:p-5 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-[var(--blue-deep)] font-bold mb-3">
          <Filter size={18} />
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white">
              <Search size={16} className="text-[var(--text-secondary)]" />
              <input
                className="w-full outline-none text-sm"
                placeholder="Search by title, state, sector, tags"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Jurisdiction */}
          <div className="md:col-span-2">
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
              value={jurisdiction}
              onChange={(e) => {
                const v = e.target.value as any;
                setJurisdiction(v);
                if (v !== "state") setStateName("all");
              }}
            >
              <option value="all">All levels</option>
              <option value="federal">Federal</option>
              <option value="state">State</option>
            </select>
          </div>

          {/* State */}
          <div className="md:col-span-2">
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              disabled={jurisdiction !== "state"}
            >
              <option value="all">All states</option>
              {NIGERIA_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div className="md:col-span-2">
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="md:col-span-1">
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="all">Year</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-[var(--text-secondary)]">
          Showing <span className="font-semibold text-[var(--blue-deep)]">{filtered.length}</span> policies
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const href = p.slug ? `/public/policies/${p.slug}` : null;
          return (
            <div key={p.id} className="border rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-[var(--blue-deep)] leading-snug">
                    {p.title || "Untitled"}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {p.country ?? "Nigeria"} · {p.jurisdictionLevel ?? "N/A"}
                    {p.state ? ` · ${p.state}` : ""}{p.policyYear ? ` · ${p.policyYear}` : ""}
                  </p>
                </div>

                {p.sector ? (
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[var(--blue-soft)] text-[var(--blue-deep)]">
                    {p.sector}
                  </span>
                ) : null}
              </div>

              {p.summary ? (
                <p className="text-sm text-[var(--text-secondary)] mt-3 line-clamp-3">
                  {p.summary}
                </p>
              ) : (
                <p className="text-sm text-[var(--text-secondary)] mt-3">
                  Open policy to view details, critique history, simulations, and downloads.
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                {href ? (
                  <Link
                    href={href}
                    className="text-sm font-semibold text-[var(--blue-deep)] hover:underline"
                  >
                    View details
                  </Link>
                ) : (
                  <span className="text-sm text-[var(--text-secondary)]">No public URL</span>
                )}

                <span className="text-xs text-[var(--text-secondary)]">
                  {p.publicPdfUrl || p.sourceUrl ? "Download available" : "No download"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer spacing */}
      <div className="h-10" />
    </section>
  );
}
