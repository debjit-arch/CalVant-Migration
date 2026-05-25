/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WIDGET: TrendLineChart
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-series recharts LineChart.
 *
 * resolvedData.points – [{ name, seriesKey1, seriesKey2, … }]
 * kpiConfig.props.series – [{ key, label, color }]
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { memo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartShell, CustomTooltip, EmptyChart } from "./ChartShell";

const TrendLineChart = memo(function TrendLineChart({ kpiConfig, resolvedData, loading }) {
const series = resolvedData?.expandedSeries ?? kpiConfig.props?.series ?? [];
const points = resolvedData?.points ?? [];

  return (
    <ChartShell title={kpiConfig.title} loading={loading} hasData={points.length > 0}>
      {points.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
              interval={points.length > 6 ? Math.floor(points.length / 6) : 0}
              angle={-25} textAnchor="end" height={44} />
            <YAxis axisLine={false} tickLine={false} width={30} allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#64748b", paddingTop: 4 }} iconType="circle" iconSize={7} />
            {series.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label}
                stroke={s.color} strokeWidth={2.5} dot={false}
                activeDot={{ r: 5, fill: s.color, stroke: "#fff", strokeWidth: 2 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
});

export default TrendLineChart;