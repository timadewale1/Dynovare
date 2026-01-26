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
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";

function buildTrendData(horizonYears: number, accessImpactPct: number) {
  // Simple linear ramp to final impact (MVP)
  const arr: { year: string; access: number }[] = [];
  for (let y = 0; y <= horizonYears; y++) {
    const v = (accessImpactPct * y) / Math.max(1, horizonYears);
    arr.push({ year: `Year ${y}`, access: Number(v.toFixed(1)) });
  }
  return arr;
}

export default function SimulationCharts(props: {
  horizonYears: number;
  accessImpactPct: number;
  reliabilityImpactPct: number;
  emissionsChangePct: number;
  riskLevel: "Low" | "Medium" | "High";
}) {
  const bars = [
    { name: "Access", value: props.accessImpactPct },
    { name: "Reliability", value: props.reliabilityImpactPct },
    // Emissions could be negative; chart should show direction
    { name: "Emissions", value: props.emissionsChangePct },
  ];

  const trend = buildTrendData(props.horizonYears, props.accessImpactPct);

  const riskData = [
    { name: "Low", value: props.riskLevel === "Low" ? 1 : 0 },
    { name: "Medium", value: props.riskLevel === "Medium" ? 1 : 0 },
    { name: "High", value: props.riskLevel === "High" ? 1 : 0 },
  ];

  // Recharts requires colors, but you asked for blue theme.
  // We'll keep it minimal and brand-consistent (soft blue palette).
  const pieColors = ["#1E88E5", "#90CAF9", "#0D47A1"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar chart */}
      <div className="border rounded-xl p-4">
        <p className="font-bold text-blue-deep mb-3">Impact overview</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          Values are percentage impact estimates (MVP model).
        </p>
      </div>

      {/* Risk pie */}
      <div className="border rounded-xl p-4">
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
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          Highlight shows the current risk band.
        </p>
      </div>

      {/* Trend area */}
      <div className="border rounded-xl p-4">
        <p className="font-bold text-blue-deep mb-3">Projected access trend</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" hide />
              <YAxis />
              <Tooltip />
              <Area dataKey="access" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          Linear ramp to end-of-horizon estimate (will become model-based later).
        </p>
      </div>
    </div>
  );
}
