"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

function buildFallbackTrendData(horizonYears: number, accessImpactPct: number, reliabilityImpactPct: number, emissionsChangePct: number) {
  const arr: { year: string; access: number; reliability: number; emissions: number }[] = [];
  for (let y = 1; y <= horizonYears; y++) {
    const progress = y / Math.max(1, horizonYears);
    arr.push({
      year: `Y${y}`,
      access: Number((accessImpactPct * progress).toFixed(1)),
      reliability: Number((reliabilityImpactPct * progress).toFixed(1)),
      emissions: Number((emissionsChangePct * progress).toFixed(1)),
    });
  }
  return arr;
}

function ChartSurface({
  height,
  children,
}: {
  height: number;
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const nextWidth = Math.floor(node.getBoundingClientRect().width);
      setWidth(nextWidth > 0 ? nextWidth : 0);
    };

    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-[260px] min-w-0 w-full">
      {width > 0 ? children({ width, height }) : null}
    </div>
  );
}

export default function SimulationCharts(props: {
  horizonYears: number;
  accessImpactPct: number;
  reliabilityImpactPct: number;
  emissionsChangePct: number;
  riskLevel: "Low" | "Medium" | "High" | "low" | "medium" | "high";
  yearByYear?: Array<{
    year: number;
    accessImpactPct: number;
    reliabilityImpactPct: number;
    emissionsChangePct: number;
    investmentNeedUSD?: number;
  }>;
}) {
  const bars = [
    { name: "Access", value: props.accessImpactPct },
    { name: "Reliability", value: props.reliabilityImpactPct },
    { name: "Emissions", value: props.emissionsChangePct },
  ];

  const trend =
    Array.isArray(props.yearByYear) && props.yearByYear.length > 0
      ? props.yearByYear.map((row) => ({
          year: `Y${row.year}`,
          access: row.accessImpactPct,
          reliability: row.reliabilityImpactPct,
          emissions: row.emissionsChangePct,
          investment: Number(row.investmentNeedUSD ?? 0),
        }))
      : buildFallbackTrendData(
          props.horizonYears,
          props.accessImpactPct,
          props.reliabilityImpactPct,
          props.emissionsChangePct
        );

  const riskValue = String(props.riskLevel).toLowerCase();
  const riskData = [
    { name: "Low", value: riskValue === "low" ? 1 : 0.001 },
    { name: "Medium", value: riskValue === "medium" ? 1 : 0.001 },
    { name: "High", value: riskValue === "high" ? 1 : 0.001 },
  ];

  const pieColors = ["#56c7a3", "#f0cf84", "#c9836f"];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="min-w-0 rounded-[1.3rem] border p-4">
        <p className="mb-3 font-bold text-blue-deep">Impact overview</p>
        <ChartSurface height={260}>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={bars} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0073d1" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ChartSurface>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">Summary values from the current simulation run.</p>
      </div>

      <div className="min-w-0 rounded-[1.3rem] border p-4">
        <p className="mb-3 font-bold text-blue-deep">Risk level</p>
        <ChartSurface height={260}>
          {({ width, height }) => (
            <PieChart width={width} height={height}>
              <Pie data={riskData} dataKey="value" nameKey="name" outerRadius={90}>
                {riskData.map((_, idx) => (
                  <Cell key={idx} fill={pieColors[idx]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ChartSurface>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">The highlighted band reflects the current scenario risk profile.</p>
      </div>

      <div className="min-w-0 rounded-[1.3rem] border p-4 xl:col-span-1">
        <p className="mb-3 font-bold text-blue-deep">Year-by-year trend</p>
        <ChartSurface height={260}>
          {({ width, height }) => (
            <LineChart width={width} height={height} data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="access" stroke="#0073d1" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="reliability" stroke="#0073d1" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="emissions" stroke="#c9836f" strokeWidth={3} dot={false} />
            </LineChart>
          )}
        </ChartSurface>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Uses the actual year-by-year simulation output when it is available.
        </p>
      </div>
    </div>
  );
}
