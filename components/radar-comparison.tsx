"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Activity } from "lucide-react";
import { buildRadarData } from "@/lib/metrics";
import type { GuildStats } from "@/lib/types";
import type { RadarDatum } from "@/lib/metrics";

interface RadarComparisonProps {
  left: GuildStats;
  right: GuildStats;
}

export function RadarComparison({ left, right }: RadarComparisonProps) {
  const data = buildRadarData(left, right);

  return (
    <section className="panel radar-panel" aria-labelledby="radar-title">
      <div className="section-heading">
        <div className="section-icon"><Activity size={18} /></div>
        <div>
          <p className="eyebrow">Shape of the matchup</p>
          <h2 id="radar-title">Guild profile</h2>
        </div>
        <p>Each axis is normalized to the larger guild value. Hover for raw totals.</p>
      </div>

      <div className="radar-wrap" role="img" aria-label={`Radar comparison of ${left.name} and ${right.name}`}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke="rgba(148, 163, 184, 0.2)" radialLines />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#aab6c7", fontSize: 12, fontWeight: 650 }}
              tickLine={false}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const datum = payload?.[0]?.payload as RadarDatum | undefined;
                if (!active || !datum) return null;
                return (
                  <div className="radar-tooltip">
                    <strong>{datum.metric}</strong>
                    <span><i className="legend-dot cyan" /> {left.name}: {datum.leftDisplay}</span>
                    <span><i className="legend-dot amber" /> {right.name}: {datum.rightDisplay}</span>
                  </div>
                );
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ color: "#cbd5e1", fontSize: 12, paddingTop: 8 }}
            />
            <Radar
              name={left.name}
              dataKey="left"
              stroke="#22d3ee"
              fill="#22d3ee"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ r: 3, fill: "#071119", stroke: "#67e8f9", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Radar
              name={right.name}
              dataKey="right"
              stroke="#fbbf24"
              fill="#fbbf24"
              fillOpacity={0.16}
              strokeWidth={2}
              dot={{ r: 3, fill: "#071119", stroke: "#fcd34d", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        The detailed table below contains the same six raw values and does not rely on the chart.
      </p>
    </section>
  );
}
