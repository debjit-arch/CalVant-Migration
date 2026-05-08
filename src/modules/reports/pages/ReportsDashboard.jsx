import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  Activity, FileText, ShieldCheck, AlertTriangle, CheckSquare,
  ClipboardList, ChevronDown, RefreshCw, Wifi, WifiOff,
  TrendingUp, TrendingDown, Minus, BarChart2, Layers, BarChart3,
  PieChart as PieIcon, AlertCircle, CheckCircle2, Clock, Calendar,
} from "lucide-react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BASE_URL = "https://api.calvant.com/reports-service/api/reports";

const INTERVAL_DAYS = { "7d": 7, "14d": 14, "90d": 90 };
const INTERVALS = [
  { key: "7d",     label: "7 Days"  },
  { key: "14d",    label: "14 Days" },
  { key: "90d",    label: "90 Days" },
  { key: "custom", label: "Custom"  },
];

const CHART_MODES = [
  { key: "line", label: "Line",  Icon: TrendingUp },
  { key: "area", label: "Area",  Icon: Layers     },
  { key: "bar",  label: "Bar",   Icon: BarChart2  },
  { key: "pie",  label: "Pie",   Icon: PieIcon    },
];

// ─── COLOURS ──────────────────────────────────────────────────────────────────
const PIE_PALETTE = ["#10b981","#6366f1","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#14b8a6","#f97316"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function filterByInterval(results, intervalKey, customFrom, customTo) {
  let cutoff;
  let end = new Date();

  if (intervalKey === "custom") {
    if (!customFrom) return [...results].sort((a, b) => new Date(a.generatedAt) - new Date(b.generatedAt));
    cutoff = new Date(customFrom);
    if (customTo) end = new Date(customTo);
    end.setHours(23, 59, 59, 999);
  } else {
    cutoff = new Date(Date.now() - (INTERVAL_DAYS[intervalKey] ?? 30) * 86400000);
  }

  return [...results]
    .filter((r) => {
      const d = new Date(r.generatedAt);
      return d >= cutoff && d <= end;
    })
    .sort((a, b) => new Date(a.generatedAt) - new Date(b.generatedAt));
}

function safeNum(v) {
  if (typeof v === "object" && v !== null && "$numberLong" in v) return Number(v.$numberLong);
  return Number(v) || 0;
}

function mapObj(obj) {
  if (!obj || typeof obj !== "object") return {};
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, safeNum(v)])
  );
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function fetchResultsByOrg(organization) {
  const token = sessionStorage?.getItem?.("token") || "";
  const res = await fetch(
    `${BASE_URL}/results?organization=${encodeURIComponent(organization)}`,
    { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

// ─── SOURCE DEFINITIONS ───────────────────────────────────────────────────────
const SOURCES = {

  risks: {
    label: "Risks",
    description: "Risk Register",
    icon: AlertTriangle,
    gradient: "from-rose-400 to-rose-600",
    accent: "#ef4444",
    badge: "bg-rose-100 text-rose-700",
    series: ["total", "open"],
    seriesColors: ["#ef4444", "#f97316"],
    transform: (results) => results.map((r) => ({
      name: fmtDate(r.generatedAt),
      total: safeNum(r.data?.risks?.total),
      open:  safeNum(mapObj(r.data?.risks?.byStatus)?.Open ?? 0),
      avg:   Number(r.data?.risks?.avgScore) || 0,
      max:   Number(r.data?.risks?.maxScore) || 0,
    })),
    pieData: (results) => {
      const last = results[results.length - 1];
      const by = mapObj(last?.data?.risks?.byStatus);
      return Object.entries(by).map(([k, v]) => ({ name: k, value: v })).filter(x => x.value > 0);
    },
    statCards: (results) => {
      const last = results[results.length - 1];
      const d = last?.data?.risks || {};
      return [
        { label: "Total",     value: safeNum(d.total),    color: "from-rose-400 to-rose-500",    Icon: AlertTriangle  },
        { label: "Avg Score", value: Number(d.avgScore || 0).toFixed(1), color: "from-orange-400 to-orange-500", Icon: BarChart3 },
        { label: "Max Score", value: safeNum(d.maxScore), color: "from-red-500 to-red-600",      Icon: AlertCircle    },
      ];
    },
    summaryFrom: (pts) => ({
      "Latest Total": pts[pts.length - 1]?.total ?? 0,
      "Latest Open":  pts[pts.length - 1]?.open  ?? 0,
      "Avg Score":    pts[pts.length - 1]?.avg ?? 0,
      "Max Score":    pts[pts.length - 1]?.max ?? 0,
      "Data points":  pts.length,
    }),
  },

  audit: {
    label: "Audit",
    description: "Compliance Audits",
    icon: ClipboardList,
    gradient: "from-amber-400 to-amber-600",
    accent: "#f59e0b",
    badge: "bg-amber-100 text-amber-700",
    series: ["total", "findings"],
    seriesColors: ["#f59e0b", "#ef4444"],
    transform: (results) => results.map((r) => ({
      name:     fmtDate(r.generatedAt),
      total:    safeNum(r.data?.audit?.total),
      findings: safeNum(r.data?.audit?.totalFindings),
    })),
    pieData: (results) => {
      const last = results[results.length - 1];
      const by = mapObj(last?.data?.audit?.byStatus);
      return Object.entries(by).map(([k, v]) => ({ name: k, value: v })).filter(x => x.value > 0);
    },
    statCards: (results) => {
      const last = results[results.length - 1];
      const d = last?.data?.audit || {};
      return [
        { label: "Total Audits", value: safeNum(d.total),        color: "from-amber-400 to-amber-500",  Icon: ClipboardList },
        { label: "Findings",     value: safeNum(d.totalFindings), color: "from-rose-400 to-rose-500",    Icon: AlertCircle   },
      ];
    },
    summaryFrom: (pts) => ({
      "Latest Total":    pts[pts.length - 1]?.total    ?? 0,
      "Latest Findings": pts[pts.length - 1]?.findings ?? 0,
      "Data points":     pts.length,
    }),
  },

  tasks: {
    label: "Tasks",
    description: "Action Items",
    icon: CheckSquare,
    gradient: "from-violet-400 to-violet-600",
    accent: "#8b5cf6",
    badge: "bg-violet-100 text-violet-700",
    series: ["total", "overdue"],
    seriesColors: ["#8b5cf6", "#ef4444"],
    transform: (results) => results.map((r) => ({
      name:    fmtDate(r.generatedAt),
      total:   safeNum(r.data?.tasks?.total),
      overdue: safeNum(r.data?.tasks?.overdue),
    })),
    pieData: (results) => {
      const last = results[results.length - 1];
      const by = mapObj(last?.data?.tasks?.byStatus);
      return Object.entries(by).map(([k, v]) => ({ name: k, value: v })).filter(x => x.value > 0);
    },
    statCards: (results) => {
      const last = results[results.length - 1];
      const d = last?.data?.tasks || {};
      return [
        { label: "Total",   value: safeNum(d.total),   color: "from-violet-400 to-violet-500", Icon: CheckSquare  },
        { label: "Overdue", value: safeNum(d.overdue),  color: "from-rose-400 to-rose-500",    Icon: AlertCircle  },
      ];
    },
    summaryFrom: (pts) => ({
      "Latest Total":   pts[pts.length - 1]?.total   ?? 0,
      "Latest Overdue": pts[pts.length - 1]?.overdue ?? 0,
      "Data points":    pts.length,
    }),
  },

  dpia: {
    label: "DPIA",
    description: "Data Protection Impact",
    icon: ShieldCheck,
    gradient: "from-blue-400 to-blue-600",
    accent: "#3b82f6",
    badge: "bg-blue-100 text-blue-700",
    series: ["total", "avgCompletion"],
    seriesColors: ["#3b82f6", "#10b981"],
    transform: (results) => results.map((r) => ({
      name:          fmtDate(r.generatedAt),
      total:         safeNum(r.data?.dpia?.total),
      avgCompletion: Number(r.data?.dpia?.avgCompletion) || 0,
    })),
    pieData: (results) => {
      const last = results[results.length - 1];
      const by = mapObj(last?.data?.dpia?.byStatus);
      return Object.entries(by).map(([k, v]) => ({ name: k, value: v })).filter(x => x.value > 0);
    },
    statCards: (results) => {
      const last = results[results.length - 1];
      const d = last?.data?.dpia || {};
      return [
        { label: "Total DPIAs",    value: safeNum(d.total),                         color: "from-blue-400 to-blue-500",    Icon: ShieldCheck  },
        { label: "Avg Completion", value: `${Number(d.avgCompletion || 0).toFixed(0)}%`, color: "from-emerald-400 to-emerald-500", Icon: BarChart3 },
      ];
    },
    summaryFrom: (pts) => ({
      "Latest Total":      pts[pts.length - 1]?.total ?? 0,
      "Avg Completion %":  pts[pts.length - 1]?.avgCompletion ?? 0,
      "Data points":       pts.length,
    }),
  },

  documents: {
    label: "Documents",
    description: "Document Registry",
    icon: FileText,
    gradient: "from-emerald-400 to-emerald-600",
    accent: "#10b981",
    badge: "bg-emerald-100 text-emerald-700",
    series: ["total", "approved", "pending"],
    seriesColors: ["#10b981", "#3b82f6", "#f59e0b"],
    transform: (results) => results.map((r) => ({
      name:     fmtDate(r.generatedAt),
      total:    safeNum(r.data?.documents?.total),
      approved: safeNum(r.data?.documents?.approved),
      pending:  safeNum(r.data?.documents?.pendingApproval),
    })),
    pieData: (results) => {
      const last = results[results.length - 1];
      const d = last?.data?.documents || {};
      return [
        { name: "Approved",         value: safeNum(d.approved) },
        { name: "Pending Approval", value: safeNum(d.pendingApproval) },
      ].filter(x => x.value > 0);
    },
    statCards: (results) => {
      const last = results[results.length - 1];
      const d = last?.data?.documents || {};
      return [
        { label: "Total",    value: safeNum(d.total),             color: "from-emerald-400 to-emerald-500", Icon: FileText     },
        { label: "Approved", value: safeNum(d.approved),          color: "from-blue-400 to-blue-500",       Icon: CheckCircle2 },
        { label: "Pending",  value: safeNum(d.pendingApproval),   color: "from-amber-400 to-amber-500",     Icon: Clock        },
      ];
    },
    summaryFrom: (pts) => ({
      "Latest Total":   pts[pts.length - 1]?.total    ?? 0,
      "Approved":       pts[pts.length - 1]?.approved  ?? 0,
      "Pending":        pts[pts.length - 1]?.pending   ?? 0,
      "Data points":    pts.length,
    }),
  },

  aiia: {
    label: "AIIA",
    description: "AI Impact Assessments",
    icon: Activity,
    gradient: "from-indigo-400 to-indigo-600",
    accent: "#6366f1",
    badge: "bg-indigo-100 text-indigo-700",
    series: ["stage1Total", "stage1Draft", "stage1Completed", "stage2Total"],
    seriesColors: ["#6366f1", "#f59e0b", "#10b981", "#a855f7"],
    transform: (results) => results.map((r) => ({
      name:            fmtDate(r.generatedAt),
      stage1Total:     safeNum(r.data?.aiia?.stage1Total),
      stage1Draft:     safeNum(r.data?.aiia?.stage1Draft),
      stage1Completed: safeNum(r.data?.aiia?.stage1Completed),
      stage2Total:     safeNum(r.data?.aiia?.stage2Total),
      stage2Assigned:  safeNum(r.data?.aiia?.stage2Assigned),
      stage2Completed: safeNum(r.data?.aiia?.stage2Completed),
    })),
    pieData: (results) => {
      const last = results[results.length - 1];
      const d = last?.data?.aiia || {};
      return [
        { name: "S1 Draft",     value: safeNum(d.stage1Draft)     },
        { name: "S1 Completed", value: safeNum(d.stage1Completed) },
        { name: "S2 Total",     value: safeNum(d.stage2Total)     },
        { name: "S2 Assigned",  value: safeNum(d.stage2Assigned)  },
        { name: "S2 Completed", value: safeNum(d.stage2Completed) },
      ].filter(x => x.value > 0);
    },
    statCards: (results) => {
      const last = results[results.length - 1];
      const d = last?.data?.aiia || {};
      return [
        { label: "Stage 1 Total", value: safeNum(d.stage1Total),     color: "from-indigo-400 to-indigo-500", Icon: Activity     },
        { label: "S1 Completed",  value: safeNum(d.stage1Completed), color: "from-emerald-400 to-emerald-500", Icon: CheckCircle2 },
        { label: "Stage 2 Total", value: safeNum(d.stage2Total),     color: "from-purple-400 to-purple-500", Icon: BarChart3    },
      ];
    },
    summaryFrom: (pts) => ({
      "S1 Total":     pts[pts.length - 1]?.stage1Total     ?? 0,
      "S1 Draft":     pts[pts.length - 1]?.stage1Draft     ?? 0,
      "S1 Completed": pts[pts.length - 1]?.stage1Completed ?? 0,
      "S2 Total":     pts[pts.length - 1]?.stage2Total     ?? 0,
      "Data points":  pts.length,
    }),
  },
};

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-xs min-w-[140px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500 flex-1">{p.name}</span>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-xs">
      <p className="font-bold text-slate-700">{d.name}</p>
      <p className="text-slate-500 mt-0.5">{d.value} items</p>
    </div>
  );
}

// ─── CHART VIEW ───────────────────────────────────────────────────────────────
function ChartView({ sourceKey, cfg, points, chartMode }) {
  const sharedAxis = (
    <>
      <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
      <XAxis dataKey="name" axisLine={false} tickLine={false}
        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
        interval={points.length > 6 ? Math.floor(points.length / 6) : 0}
        angle={-25} textAnchor="end" height={44} />
      <YAxis axisLine={false} tickLine={false} width={30} allowDecimals={false}
        tick={{ fill: "#94a3b8", fontSize: 10 }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: 10, color: "#64748b", paddingTop: 8 }} iconType="circle" iconSize={7} />
    </>
  );

  if (chartMode === "pie") return null;

  if (chartMode === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
          <defs>
            {cfg.series.map((s, i) => (
              <linearGradient key={s} id={`ag-${sourceKey}-${s}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={cfg.seriesColors[i]} stopOpacity={0.18} />
                <stop offset="95%" stopColor={cfg.seriesColors[i]} stopOpacity={0}    />
              </linearGradient>
            ))}
          </defs>
          {sharedAxis}
          {cfg.series.map((s, i) => (
            <Area key={s} type="monotone" dataKey={s} stroke={cfg.seriesColors[i]} strokeWidth={2}
              fill={`url(#ag-${sourceKey}-${s})`} dot={false}
              activeDot={{ r: 4, fill: cfg.seriesColors[i], strokeWidth: 2, stroke: "#fff" }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chartMode === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 10 }} barSize={14}>
          <defs>
            {cfg.series.map((s, i) => (
              <linearGradient key={s} id={`bg-${sourceKey}-${s}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={cfg.seriesColors[i]} stopOpacity={0.9}  />
                <stop offset="95%" stopColor={cfg.seriesColors[i]} stopOpacity={0.55} />
              </linearGradient>
            ))}
          </defs>
          {sharedAxis}
          {cfg.series.map((s, i) => (
            <Bar key={s} dataKey={s} fill={`url(#bg-${sourceKey}-${s})`}
              radius={[4, 4, 0, 0]} animationDuration={700} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
        {sharedAxis}
        {cfg.series.map((s, i) => (
          <Line key={s} type="monotone" dataKey={s} stroke={cfg.seriesColors[i]}
            strokeWidth={2.5} dot={false}
            activeDot={{ r: 5, fill: cfg.seriesColors[i], stroke: "#fff", strokeWidth: 2 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── SOURCE CARD ──────────────────────────────────────────────────────────────
function SourceCard({ sourceKey, allResults, interval, customFrom, customTo, loading, error }) {
  const cfg = SOURCES[sourceKey];
  const Icon = cfg.icon;
  const [expanded,  setExpanded]  = useState(false);
  const [chartMode, setChartMode] = useState("line");
  const chartsRef = useRef(null);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      clearTimeout(window[`ro_${sourceKey}`]);
      window[`ro_${sourceKey}`] = setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
    });
    if (chartsRef.current) ro.observe(chartsRef.current);
    return () => { if (chartsRef.current) ro.unobserve(chartsRef.current); };
  }, [sourceKey]);

  const relevant = allResults.filter((r) => r.data?.[sourceKey] !== undefined);
  const filtered  = filterByInterval(relevant, interval, customFrom, customTo);

  const points = cfg.transform(filtered).map((p, i) => ({
    ...p,
    _iso: filtered[i]?.generatedAt,
    _rawData: filtered[i]?.data,
  }));
  const summary = cfg.summaryFrom(points);
  const hasData = points.length > 0;

  const pieSlices = useMemo(() => {
    if (!hasData) return [];
    const lastRaw = filtered[filtered.length - 1];
    return cfg.pieData ? cfg.pieData([lastRaw]) : [];
  }, [filtered, hasData]);

  const kpiCards = useMemo(() => {
    if (!hasData) return [];
    return cfg.statCards ? cfg.statCards(filtered) : [];
  }, [filtered, hasData]);

  const mainKey = cfg.series[0];
  const latest  = points[points.length - 1]?.[mainKey] ?? null;
  const prev    = points[points.length - 2]?.[mainKey] ?? null;
  const d       = latest !== null && prev !== null ? latest - prev : null;
  const DeltaIcon  = d === null ? Minus : d > 0 ? TrendingUp : d < 0 ? TrendingDown : Minus;
  const deltaColor = d === null ? "text-slate-400" : d > 0 ? "text-emerald-500" : d < 0 ? "text-rose-500" : "text-slate-400";

  return (
    <motion.div
      layout
      className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
      style={{ borderColor: expanded ? cfg.accent + "40" : undefined }}
    >
      <div className="p-5 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
              <Icon size={20} className="text-white drop-shadow-sm" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">{cfg.label}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{cfg.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <span className="text-slate-400 text-xs">Loading…</span>
            ) : error ? (
              <span className="text-rose-500 text-xs font-semibold">Error</span>
            ) : (
              <div className="text-right">
                <span className="text-2xl font-semibold text-slate-800 block leading-tight">
                  {latest !== null ? latest : "—"}
                </span>
                {d !== null && (
                  <span className={`flex items-center justify-end gap-1 text-xs font-semibold mt-0.5 ${deltaColor}`}>
                    <DeltaIcon size={11} />
                    {d > 0 ? "+" : ""}{d}
                  </span>
                )}
              </div>
            )}
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors"
            >
              <ChevronDown size={14} className="text-slate-500" />
            </motion.div>
          </div>
        </div>

        {!expanded && hasData && !loading && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(summary).slice(0, 4).map(([k, v]) => (
              <span key={k} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                {k}: {v}
              </span>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className="h-px bg-slate-100 mb-4" />

              {kpiCards.length > 0 && !loading && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {kpiCards.map(({ label, value, color, Icon: KIcon }) => (
                    <div key={label} className={`rounded-xl bg-gradient-to-br ${color} p-3 flex items-center gap-2 shadow-sm`}>
                      <KIcon size={14} className="text-white flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-white text-base font-bold leading-tight">{value}</div>
                        <div className="text-white/80 text-[10px] font-medium uppercase tracking-wide truncate">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                  {CHART_MODES.map(({ key, label, Icon: MI }) => (
                    <button key={key}
                      onClick={(e) => { e.stopPropagation(); setChartMode(key); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        chartMode === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <MI size={11} />{label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {points.length} data point{points.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div ref={chartsRef} style={{ height: chartMode === "pie" ? 200 : 220 }}>
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-slate-400 text-sm">Fetching reports…</span>
                  </div>
                ) : error ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2">
                    <WifiOff size={28} className="text-slate-300" strokeWidth={1.5} />
                    <span className="text-rose-500 text-xs font-semibold">{error}</span>
                  </div>
                ) : !hasData ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-4">
                    <BarChart3 size={36} className="text-slate-300" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-slate-400">No results in this period</p>
                    <p className="text-xs text-slate-400">Try a wider interval or trigger a report run</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={chartMode} initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }} className="h-full">
                      {chartMode === "pie" ? (
                        pieSlices.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieSlices} dataKey="value" nameKey="name"
                                cx="50%" cy="50%" innerRadius={40} outerRadius={75}
                                paddingAngle={3} stroke="white" strokeWidth={2}>
                                {pieSlices.map((_, i) => (
                                  <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                                ))}
                              </Pie>
                              <Tooltip content={<PieTooltip />} />
                              <Legend wrapperStyle={{ fontSize: 10, color: "#64748b" }} iconType="circle" iconSize={7} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center gap-2">
                            <PieIcon size={28} className="text-slate-300" />
                            <span className="text-xs text-slate-400">No status breakdown available</span>
                          </div>
                        )
                      ) : (
                        <ChartView sourceKey={sourceKey} cfg={cfg} points={points} chartMode={chartMode} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {hasData && !loading && (() => {
                const last = filtered[filtered.length - 1];
                const byDept = mapObj(
                  last?.data?.[sourceKey === "documents" ? "documents" : sourceKey]?.byDepartment ||
                  last?.data?.risks?.byDepartment ||
                  {}
                );
                const entries = Object.entries(byDept).filter(([,v]) => v > 0);
                if (!entries.length || sourceKey === "documents" || sourceKey === "aiia") return null;
                return (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">By Department</p>
                    <div className="flex flex-wrap gap-2">
                      {entries.map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
                          <span className="text-xs text-slate-500 truncate max-w-[100px]">{k}</span>
                          <span className={`text-xs font-bold ${cfg.badge.split(" ")[1]}`}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {hasData && !loading && (
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                  {Object.entries(summary).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
                      <span className="text-xs text-slate-500">{k}</span>
                      <span className={`text-xs font-bold ${cfg.badge.split(" ")[1]}`}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function ReportsDashboard() {
  const defaultOrg = (() => {
    try {
      return (
        sessionStorage.getItem("orgId") ||
        JSON.parse(sessionStorage.getItem("user") || "{}").organization ||
        JSON.parse(sessionStorage.getItem("user") || "{}").organizationId ||
        ""
      );
    } catch { return ""; }
  })();

  const [organization, setOrganization] = useState(defaultOrg);
  const [interval,     setInterval]     = useState("7d");
  const [customFrom,   setCustomFrom]   = useState("");
  const [customTo,     setCustomTo]     = useState("");
  const [allResults,   setAllResults]   = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [lastFetched,  setLastFetched]  = useState(null);
  const [online,       setOnline]       = useState(true);

  const fetchAll = useCallback(async () => {
    if (!organization.trim()) return;
    setLoading(true); setError(null);
    try {
      const data = await fetchResultsByOrg(organization.trim());
      setAllResults(data);
      setLastFetched(new Date());
      setOnline(true);
    } catch (e) {
      setError(e.message || "Unknown error");
      setOnline(false);
    } finally { setLoading(false); }
  }, [organization]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const id = setInterval(fetchAll, 60_000); return () => clearInterval(id); }, [fetchAll]);

  const summaryStats = useMemo(() => {
    const filtered = filterByInterval(allResults, interval, customFrom, customTo);
    const last = filtered[filtered.length - 1];
    return {
      totalReports: allResults.length,
      inPeriod:     filtered.length,
      sources:      Object.keys(SOURCES).length,
      totalRisks:   safeNum(last?.data?.risks?.total)        || 0,
      totalAudits:  safeNum(last?.data?.audit?.total)        || 0,
      totalTasks:   safeNum(last?.data?.tasks?.total)        || 0,
      totalDpias:   safeNum(last?.data?.dpia?.total)         || 0,
      totalDocs:    safeNum(last?.data?.documents?.total)    || 0,
    };
  }, [allResults, interval, customFrom, customTo]);

  const statCards = [
    { label: "Total Reports", value: summaryStats.totalReports, Icon: BarChart3,     color: "from-blue-400 to-blue-500"    },
    { label: "In Period",     value: summaryStats.inPeriod,     Icon: Activity,      color: "from-emerald-400 to-emerald-500" },
    { label: "Risks",         value: summaryStats.totalRisks,   Icon: AlertTriangle, color: "from-rose-400 to-rose-500"    },
    { label: "Audits",        value: summaryStats.totalAudits,  Icon: ClipboardList, color: "from-amber-400 to-amber-500"  },
    { label: "Tasks",         value: summaryStats.totalTasks,   Icon: CheckSquare,   color: "from-violet-400 to-violet-500"},
    { label: "DPIAs",         value: summaryStats.totalDpias,   Icon: ShieldCheck,   color: "from-indigo-400 to-indigo-500"},
  ];

  // Format custom range label for display
  const customRangeLabel = useMemo(() => {
    if (!customFrom) return "Custom";
    const from = new Date(customFrom).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    if (!customTo) return `From ${from}`;
    const to = new Date(customTo).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    return `${from} – ${to}`;
  }, [customFrom, customTo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-28">

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <motion.header
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-6 p-6"
          initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <BarChart3 className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-slate-800 leading-tight">Reports Dashboard</h1>
                <p className="text-base text-slate-500 mt-1">
                  {lastFetched
                    ? <>Last synced {lastFetched.toLocaleTimeString()} · <span className="font-bold text-slate-700">{summaryStats.totalReports}</span> reports</>
                    : "Awaiting first sync…"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${online ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {online ? <><Wifi size={11} /> Live</> : <><WifiOff size={11} /> Offline</>}
              </span>
              <motion.button onClick={fetchAll} disabled={loading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 disabled:opacity-60"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <RefreshCw size={15} className="text-slate-500"
                  style={loading ? { animation: "spin 1s linear infinite" } : {}} />
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
        <motion.section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          {statCards.map(({ label, value, Icon, color }, i) => (
            <motion.div key={label}
              className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2.5 hover:bg-white"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }} whileHover={{ scale: 1.02 }}>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}>
                <Icon size={15} className="text-white drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <span className="text-lg font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
                  {loading ? "—" : value}
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* ── INTERVAL SELECTOR ────────────────────────────────────────────── */}
        <motion.div className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl p-4 mb-6 shadow-sm"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Time Period</p>
              <p className="text-xs text-slate-500 mt-0.5">Global filter — applies to all source cards</p>
            </div>
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              {INTERVALS.map(({ key, label }) => (
                <button key={key} onClick={() => setInterval(key)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    interval === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}>
                  {key === "custom" && <Calendar size={10} />}
                  {key === "custom" && interval === "custom" ? customRangeLabel : label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range picker — shown only when "Custom" is active */}
          <AnimatePresence>
            {interval === "custom" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 font-medium whitespace-nowrap">From</label>
                      <input
                        type="date"
                        value={customFrom}
                        max={customTo || undefined}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
                      />
                    </div>
                    <span className="text-slate-400 text-xs">—</span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 font-medium whitespace-nowrap">To</label>
                      <input
                        type="date"
                        value={customTo}
                        min={customFrom || undefined}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
                      />
                    </div>
                    {(customFrom || customTo) && (
                      <button
                        onClick={() => { setCustomFrom(""); setCustomTo(""); }}
                        className="text-xs text-slate-400 hover:text-rose-500 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-rose-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {customFrom && !customTo && (
                    <span className="text-xs text-slate-400 italic">No end date = up to today</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── SOURCE CARDS ─────────────────────────────────────────────────── */}
        <motion.div layout className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Object.keys(SOURCES).map((key, i) => (
            <motion.div key={key} layout
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}>
              <SourceCard
                sourceKey={key}
                allResults={allResults}
                interval={interval}
                customFrom={customFrom}
                customTo={customTo}
                loading={loading}
                error={error}
              />
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold flex items-center gap-3">
              <WifiOff size={16} />
              <span><strong>API Error:</strong> {error} — verify the reports service is up and org ID is correct.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-8 py-5 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500 font-medium">© {new Date().getFullYear()} CalVant. All rights reserved.</p>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}