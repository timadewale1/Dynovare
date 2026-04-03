"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Expand, X } from "lucide-react";

type StateScore = {
  state: string;
  score: number | null;
  policies: number;
};

type LabelPoint = {
  state: string;
  x: number;
  y: number;
  label?: string;
  capital?: string;
  capitalX?: number;
  capitalY?: number;
  small?: boolean;
};

type RegionPlate = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

const LABEL_POINTS: LabelPoint[] = [
  { state: "Sokoto", x: 22.4, y: 8.7, capital: "Sokoto", capitalX: 22.8, capitalY: 13.2 },
  { state: "Kebbi", x: 9.2, y: 23.2, capital: "Birnin\nKebbi", capitalX: 10.4, capitalY: 17.5 },
  { state: "Zamfara", x: 31.2, y: 22.4, capital: "Gusau", capitalX: 31.8, capitalY: 17.3 },
  { state: "Katsina", x: 43.2, y: 18.5, capital: "Katsina", capitalX: 42.5, capitalY: 12.5 },
  { state: "Jigawa", x: 57.2, y: 21.2, capital: "Dutse", capitalX: 57.7, capitalY: 23.7 },
  { state: "Yobe", x: 72.1, y: 20.7, capital: "Damaturu", capitalX: 73.8, capitalY: 24.1 },
  { state: "Borno", x: 88.2, y: 19.1, capital: "Maiduguri", capitalX: 87.4, capitalY: 26.2 },
  { state: "Kano", x: 47.6, y: 28.5, capital: "Kano", capitalX: 47.2, capitalY: 21.1 },
  { state: "Kaduna", x: 46.1, y: 39.5, capital: "Kaduna", capitalX: 45.9, capitalY: 45.1 },
  { state: "Bauchi", x: 59.1, y: 40.6, capital: "Bauchi", capitalX: 62.1, capitalY: 44.1 },
  { state: "Gombe", x: 72.1, y: 40.3, capital: "Gombe", capitalX: 72.3, capitalY: 43.8 },
  { state: "Adamawa", x: 83.9, y: 50.1, capital: "Yola", capitalX: 82.1, capitalY: 56.3 },
  { state: "Taraba", x: 69.1, y: 56.2, capital: "Jalingo", capitalX: 70.1, capitalY: 59.2 },
  { state: "Plateau", x: 56.7, y: 45.9, capital: "Jos", capitalX: 54.7, capitalY: 49.3 },
  { state: "Nasarawa", x: 47.8, y: 50.9, capital: "Lafia", capitalX: 47.7, capitalY: 56.8 },
  { state: "FCT", x: 40.8, y: 47.1, label: "ABUJA", capital: "FEDERAL\nCAPITAL\nTERRITORY", capitalX: 37.8, capitalY: 52.7, small: true },
  { state: "Niger", x: 29.8, y: 36.7, capital: "Minna", capitalX: 30.7, capitalY: 44.8 },
  { state: "Kwara", x: 10.7, y: 43.6, capital: "Ilorin", capitalX: 18.2, capitalY: 52.7 },
  { state: "Kogi", x: 33.5, y: 57.2, capital: "Lokoja", capitalX: 37.4, capitalY: 61.3 },
  { state: "Benue", x: 51.6, y: 65.1, capital: "Makurdi", capitalX: 54.7, capitalY: 61.0 },
  { state: "Oyo", x: 9.8, y: 55.9, capital: "Ibadan", capitalX: 8.7, capitalY: 63.1 },
  { state: "Ogun", x: 4.8, y: 72.0, capital: "Abeokuta", capitalX: 8.2, capitalY: 68.6, small: true },
  { state: "Lagos", x: 2.7, y: 80.2, capital: "Ikeja", capitalX: 9.2, capitalY: 77.3, small: true },
  { state: "Osun", x: 19.1, y: 64.2, capital: "Oshogbo", capitalX: 20.0, capitalY: 62.9, small: true },
  { state: "Ekiti", x: 24.0, y: 60.8, capital: "Ado-Ekiti", capitalX: 28.3, capitalY: 64.7, small: true },
  { state: "Ondo", x: 18.8, y: 72.0, capital: "Akure", capitalX: 22.6, capitalY: 69.3, small: true },
  { state: "Edo", x: 31.3, y: 70.1, capital: "Benin\nCity", capitalX: 23.4, capitalY: 72.1 },
  { state: "Delta", x: 28.3, y: 86.0, capital: "Asaba", capitalX: 31.3, capitalY: 80.8 },
  { state: "Bayelsa", x: 21.1, y: 93.8, capital: "Yenagoa", capitalX: 24.6, capitalY: 94.5, small: true },
  { state: "Rivers", x: 35.5, y: 92.9, capital: "Port\nHarcourt", capitalX: 36.1, capitalY: 97.0, small: true },
  { state: "Akwa Ibom", x: 44.1, y: 95.0, label: "AKWA\nIBOM", capital: "Uyo", capitalX: 44.2, capitalY: 88.3, small: true },
  { state: "Cross River", x: 48.7, y: 82.0, label: "CROSS\nRIVER", capital: "Calabar", capitalX: 51.6, capitalY: 90.4, small: true },
  { state: "Enugu", x: 40.2, y: 72.8, capital: "Enugu", capitalX: 41.2, capitalY: 75.0, small: true },
  { state: "Ebonyi", x: 48.1, y: 82.8, capital: "Abakaliki", capitalX: 48.6, capitalY: 74.2, small: true },
  { state: "Anambra", x: 36.1, y: 79.5, capital: "Awka", capitalX: 36.1, capitalY: 77.7, small: true },
  { state: "Imo", x: 34.7, y: 89.5, capital: "Owerri", capitalX: 35.2, capitalY: 84.8, small: true },
  { state: "Abia", x: 40.0, y: 86.6, capital: "Umuahia", capitalX: 43.7, capitalY: 86.0, small: true },
];

const REGION_PLATES: RegionPlate[] = [
  { name: "North West", x: 27, y: 22, w: 40, h: 29, color: "rgba(232, 70, 58, 0.72)" },
  { name: "North East", x: 73, y: 28, w: 37, h: 31, color: "rgba(38, 126, 255, 0.68)" },
  { name: "North Central", x: 45, y: 49, w: 35, h: 25, color: "rgba(38, 166, 91, 0.66)" },
  { name: "South West", x: 16, y: 72, w: 26, h: 20, color: "rgba(247, 128, 34, 0.66)" },
  { name: "South East", x: 40, y: 81, w: 19, h: 15, color: "rgba(132, 70, 229, 0.68)" },
  { name: "South South", x: 34, y: 92, w: 35, h: 16, color: "rgba(0, 158, 146, 0.68)" },
];

function scoreTone(score: number | null) {
  if (score === null) return { fill: "rgba(247, 242, 231, 0.88)", text: "#805c30", accent: "#d5b483" };
  if (score >= 80) return { fill: "rgba(111, 190, 93, 0.9)", text: "#1d4f1e", accent: "#4f9a45" };
  if (score >= 65) return { fill: "rgba(0, 173, 181, 0.88)", text: "#073f47", accent: "#0697a0" };
  if (score >= 50) return { fill: "rgba(255, 184, 61, 0.9)", text: "#7a4200", accent: "#d88c18" };
  return { fill: "rgba(194, 130, 90, 0.88)", text: "#5f2513", accent: "#a85833" };
}

export default function NigeriaPolicyMap({
  scores,
  onSelectState,
  compact = false,
  mapOnly = false,
}: {
  scores: StateScore[];
  onSelectState?: (state: string) => void;
  compact?: boolean;
  mapOnly?: boolean;
}) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const scoreMap = useMemo(() => new Map(scores.map((item) => [item.state, item])), [scores]);
  const topStates = useMemo(
    () =>
      [...scores]
        .filter((item) => typeof item.score === "number")
        .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
        .slice(0, 3),
    [scores]
  );

  return (
    <div className={`w-full max-w-full overflow-hidden ${mapOnly ? "" : `grid gap-5 rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,250,252,0.96)_100%)] p-4 md:p-6 shadow-[0_24px_80px_rgba(0,56,105,0.08)] ${compact ? "grid-cols-1" : "xl:grid-cols-[1fr_0.8fr]"}`}`}>
      <div>
        {!mapOnly ? (
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Nigeria policy map</p>
              <h3 className="mt-2 text-xl font-black text-blue-deep">Scan state performance at a glance</h3>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <Button variant="outline" className="rounded-full" onClick={() => setExpanded(true)}>
                <Expand size={14} />
                Open map
              </Button>
              <Badge variant="outline" className="border-0 bg-[rgba(111,190,93,0.9)] text-[#123c16]">Leading</Badge>
              <Badge variant="outline" className="border-0 bg-[rgba(0,173,181,0.88)] text-[#08393f]">Steady</Badge>
              <Badge variant="outline" className="border-0 bg-[rgba(255,184,61,0.9)] text-[#6d3c00]">Developing</Badge>
              <Badge variant="outline" className="border-0 bg-[rgba(194,130,90,0.88)] text-[#512010]">Gaps</Badge>
            </div>
          </div>
        ) : null}

        <div className={`overflow-hidden rounded-[1.75rem] border bg-[linear-gradient(180deg,#f9f5ee_0%,#f3f7fb_100%)] ${mapOnly ? "p-1 md:p-2" : "p-2 md:p-3"}`}>
          <div className={`relative mx-auto aspect-[5/4] w-full ${compact ? "max-w-[920px]" : "max-w-[760px]"}`}>
            <div className="pointer-events-none absolute inset-[6%_5%_4%_5%] rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(246,250,252,0.3)_45%,transparent_76%)]" />
            <img
              src="/nigeria-states-base.svg"
              alt="Nigeria states map"
              className="absolute inset-0 h-full w-full rounded-[1.25rem] object-contain shadow-[0_16px_40px_rgba(0,56,105,0.08)]"
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-0">
              {REGION_PLATES.map((region) => (
                <div
                  key={region.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[999px] blur-[3px] md:blur-[6px]"
                  style={{
                    left: `${region.x}%`,
                    top: `${region.y}%`,
                    width: `${region.w}%`,
                    height: `${region.h}%`,
                    background: `radial-gradient(circle, ${region.color} 0%, ${region.color.replace(/0\.\d+\)/, "0.42)")} 62%, rgba(255,255,255,0.05) 82%, rgba(255,255,255,0) 100%)`,
                    mixBlendMode: "normal",
                    opacity: 1,
                  }}
                />
              ))}
              <div className="absolute inset-[4.5%_6%_4%_6%] rounded-[1.35rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.05))]" />
            </div>

            {LABEL_POINTS.map((entry) => {
              const item = scoreMap.get(entry.state) ?? { state: entry.state, score: null, policies: 0 };
              const tone = scoreTone(item.score);
              const active = hoveredState === entry.state;

              return (
                <button
                  key={entry.state}
                  type="button"
                  onClick={() => onSelectState?.(entry.state)}
                  onMouseEnter={() => setHoveredState(entry.state)}
                  onMouseLeave={() => setHoveredState((current) => (current === entry.state ? null : current))}
                  onFocus={() => setHoveredState(entry.state)}
                  onBlur={() => setHoveredState((current) => (current === entry.state ? null : current))}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center transition duration-200 hover:scale-[1.04] focus:scale-[1.04]"
                  style={{ left: `${entry.x}%`, top: `${entry.y}%` }}
                  title={`${entry.state}: ${item.score === null ? "No score yet" : `${item.score.toFixed(1)} / 100`} (${item.policies} policies)`}
                >
                  <span
                    className={`inline-block whitespace-pre-line rounded-md px-1 py-0.5 font-black uppercase leading-none tracking-[0.07em] transition ${
                      entry.small ? "text-[8px] md:text-[9px]" : "text-[10px] md:text-[13px]"
                    }`}
                    style={{
                      backgroundColor: active ? "#003869" : tone.fill,
                      color: active ? "#ffffff" : tone.text,
                      border: active ? "1px solid rgba(0,56,105,0.85)" : `1px solid ${tone.accent}`,
                      textShadow: active ? "none" : "0 1px 0 rgba(255,255,255,0.75)",
                      boxShadow: active ? "0 14px 34px rgba(0,56,105,0.22)" : `0 8px 18px color-mix(in srgb, ${tone.accent} 18%, transparent)`,
                    }}
                  >
                    {entry.label ?? entry.state}
                  </span>
                </button>
              );
            })}

            {LABEL_POINTS.filter((entry) => entry.capital && entry.capitalX && entry.capitalY).map((entry) => (
              <div
                key={`${entry.state}-capital`}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${entry.capitalX}%`, top: `${entry.capitalY}%` }}
              >
                <div className="mx-auto mb-1 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-[#003869]/60 bg-white shadow-sm">
                  <div className="h-1 w-1 rounded-full bg-[#003869]" />
                </div>
              </div>
            ))}
            {hoveredState && !compact ? (
              <div className="pointer-events-none absolute right-[3%] top-[4%] hidden w-[220px] rounded-[1.25rem] border border-white/70 bg-white/92 p-4 text-left shadow-[0_18px_50px_rgba(0,56,105,0.14)] backdrop-blur md:block">
                {(() => {
                  const entry = LABEL_POINTS.find((item) => item.state === hoveredState);
                  const item = scoreMap.get(hoveredState) ?? { state: hoveredState, score: null, policies: 0 };
                  const tone = scoreTone(item.score);
                  return (
                    <>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">State profile</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tone.text }} />
                        <p className="text-lg font-black text-blue-deep">{hoveredState}</p>
                      </div>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Capital: <span className="font-semibold text-blue-deep">{String(entry?.capital || "N/A").replace(/\n/g, " ")}</span>
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Score</p>
                          <p className="mt-1 text-lg font-black text-blue-deep">{item.score === null ? "-" : item.score.toFixed(1)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Policies</p>
                          <p className="mt-1 text-lg font-black text-blue-deep">{item.policies}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!compact && !mapOnly ? (
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">What to do here</p>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Hover a state to see the quick profile, then click straight into that slice of the repository or rankings view.
          </p>
        </div>

        <div className="rounded-[1.5rem] border bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Top states right now</p>
          <div className="mt-4 space-y-3">
            {topStates.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No state-level scores yet.</p>
            ) : (
              topStates.map((item, index) => (
                <button
                  key={item.state}
                  type="button"
                  onClick={() => onSelectState?.(item.state)}
                  className="flex w-full items-center justify-between rounded-[1.25rem] border bg-white px-4 py-3 text-left transition hover:bg-blue-soft"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">#{index + 1}</p>
                    <p className="font-bold text-blue-deep">{item.state}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{item.policies} public policies</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-deep">{item.score?.toFixed(1) ?? "-"}</p>
                    <p className="text-xs text-[var(--text-secondary)]">score</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Geopolitical regions</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {REGION_PLATES.map((region) => (
              <div key={region.name} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-blue-deep">
                <span className="h-3 w-3 rounded-full border border-white/80 shadow-sm" style={{ backgroundColor: region.color.replace(/0\.\d+\)/, "0.75)") }} />
                <span className="font-semibold">{region.name}</span>
              </div>
            ))}
          </div>
          {/* <p className="mt-3 text-xs text-[var(--text-secondary)]">
            Region tints add context, while score chips still show the actual policy signal for each state.
          </p> */}
        </div>
      </div>
      ) : null}

      {expanded && !mapOnly ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(7,17,27,0.72)] p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/70">Expanded map</p>
                <h2 className="mt-1 text-2xl font-black text-white">Explore the national policy map without the tight layout.</h2>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={() => setExpanded(false)}
              >
                <X size={15} />
                Close
              </Button>
            </div>
            <NigeriaPolicyMap
              scores={scores}
              mapOnly
              onSelectState={(state) => {
                setExpanded(false);
                onSelectState?.(state);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
