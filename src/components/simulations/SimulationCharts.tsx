"use client";

import {
  ResponsiveContainer,
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
    { name: "Low", value: riskValue === "low" ? 1 : 0 },
    { name: "Medium", value: riskValue === "medium" ? 1 : 0 },
    { name: "High", value: riskValue === "high" ? 1 : 0 },
  ];

  const pieColors = ["#56c7a3", "#f0cf84", "#c9836f"];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-[1.3rem] border p-4">
        <p className="font-bold text-blue-deep mb-3">Impact overview</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#125669" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">Summary values from the current simulation run.</p>
      </div>

      <div className="rounded-[1.3rem] border p-4">
        <p className="font-bold text-blue-deep mb-3">Risk level</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" outerRadius={90}>
                {riskData.map((_, idx) => (
                  <Cell key={idx} fill={pieColors[idx]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">The highlighted band reflects the current scenario risk profile.</p>
      </div>

      <div className="rounded-[1.3rem] border p-4 xl:col-span-1">
        <p className="font-bold text-blue-deep mb-3">Year-by-year trend</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="access" stroke="#125669" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="reliability" stroke="#1c7ed6" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="emissions" stroke="#c9836f" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Uses the actual year-by-year simulation output when it is available.
        </p>
      </div>
    </div>
  );
}
