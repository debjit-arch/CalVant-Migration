/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WIDGET: StatCard
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays a single metric with an icon, optional trend delta, and colour.
 *
 * Receives from KpiWrapper (via DashboardEngine):
 *   kpiConfig.title        – display label
 *   kpiConfig.icon         – lucide icon name string
 *   kpiConfig.color        – Tailwind colour name ("rose", "amber", …)
 *   kpiConfig.props.format – "decimal" | "percent" | undefined (integer)
 *   kpiConfig.props.trend  – boolean, show delta badge
 *
 *   resolvedData.value     – current scalar value
 *   resolvedData.delta     – number | null
 *   loading                – boolean
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, AlertCircle, Clock, CheckCircle2, CheckSquare,
  ShieldCheck, FileText, Activity, BarChart3, ClipboardList,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";

// ─── ICON REGISTRY ────────────────────────────────────────────────────────────
const ICONS = {
  AlertTriangle, AlertCircle, Clock, CheckCircle2, CheckSquare,
  ShieldCheck, FileText, Activity, BarChart3, ClipboardList,
};

// ─── COLOUR MAPS ─────────────────────────────────────────────────────────────
const GRADIENTS = {
  rose:    "from-rose-400 to-rose-600",
  orange:  "from-orange-400 to-orange-600",
  amber:   "from-amber-400 to-amber-600",
  emerald: "from-emerald-400 to-emerald-600",
  blue:    "from-blue-400 to-blue-600",
  indigo:  "from-indigo-400 to-indigo-600",
  violet:  "from-violet-400 to-violet-600",
  purple:  "from-purple-400 to-purple-600",
  slate:   "from-slate-400 to-slate-600",
};

// ─── FORMAT VALUE ─────────────────────────────────────────────────────────────
function formatValue(value, format) {
  if (value == null) return "—";
  if (format === "decimal") return Number(value).toFixed(1);
  if (format === "percent") return `${Number(value).toFixed(0)}%`;
  return String(value);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const StatCard = memo(function StatCard({
  kpiConfig,
  resolvedData,
  loading,
}) {
  const { title, icon, color = "slate", props = {} } = kpiConfig;
  const { format, trend } = props;
  const { value, delta } = resolvedData ?? {};

  const IconComp   = ICONS[icon] ?? BarChart3;
  const gradient   = GRADIENTS[color] ?? GRADIENTS.slate;

  const DeltaIcon  = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta == null ? "text-slate-400"
    : delta > 0  ? "text-emerald-500"
    : delta < 0  ? "text-rose-500"
    : "text-slate-400";

  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -2 }}
      transition={{ duration: 0.2 }}
      className="h-full bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-4 shadow-sm hover:shadow-md flex items-center gap-3 transition-shadow"
    >
      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
        <IconComp size={18} className="text-white drop-shadow-sm" />
      </div>

      {/* Value */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="h-6 w-12 bg-slate-100 rounded animate-pulse mb-1" />
        ) : (
          <span className="text-2xl font-bold text-slate-800 block leading-tight">
            {formatValue(value, format)}
          </span>
        )}
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate block">
          {title}
        </span>
      </div>

      {/* Delta badge */}
      {trend && delta !== null && !loading && (
        <span className={`flex items-center gap-1 text-xs font-bold flex-shrink-0 ${deltaColor}`}>
          <DeltaIcon size={12} />
          {delta > 0 ? "+" : ""}{delta}
        </span>
      )}
    </motion.div>
  );
});

export default StatCard;