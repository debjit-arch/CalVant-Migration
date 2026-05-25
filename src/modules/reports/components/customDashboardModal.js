/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CustomDashboardModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Fully dropdown-driven panel builder.
 * All options sourced from AVAILABLE_COMPONENTS and AVAILABLE_EXTRACTORS
 * in dashboardSchema.js — no freetext needed for normal use.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AVAILABLE_COMPONENTS, AVAILABLE_EXTRACTORS } from "./dashboardSchema";

// ─── constants ────────────────────────────────────────────────────────────────

const SERIES_COLORS = [
  "#6366f1",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#a855f7",
  "#06b6d4",
  "#f97316",
];

const TREND_TYPES = new Set([
  "TrendLineChart",
  "TrendAreaChart",
  "TrendBarChart",
]);

const CHART_META = {
  StatCard: { icon: "🔢", hint: "Single number with optional trend" },
  ScoreGauge: { icon: "🎯", hint: "Circular gauge — good for scores/%" },
  TrendLineChart: { icon: "📈", hint: "Multi-series line over time" },
  TrendAreaChart: { icon: "🌊", hint: "Filled area — good for volumes" },
  TrendBarChart: { icon: "📊", hint: "Grouped bars for comparisons" },
  DonutStatusChart: { icon: "🍩", hint: "Status/category breakdown" },
  DepartmentBreakdown: { icon: "🏢", hint: "Per-department bar list" },
  TableWidget: { icon: "📋", hint: "Tabular rows from an array path" },
};

// ─── sub-components ───────────────────────────────────────────────────────────

function Label({ children, hint }) {
  return (
    <div className="mb-1.5">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
        {children}
      </span>
      {hint && (
        <span className="ml-2 text-[11px] text-slate-400 normal-case font-normal tracking-normal">
          {hint}
        </span>
      )}
    </div>
  );
}

function Select({ value, onChange, children, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm
        text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300
        focus:border-indigo-400 transition-all cursor-pointer appearance-none
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 fill%3D%22none%22 viewBox%3D%220 0 20 20%22%3E%3Cpath stroke%3D%22%236b7280%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22 stroke-width%3D%221.5%22 d%3D%22m6 8 4 4 4-4%22%2F%3E%3C%2Fsvg%3E')]
        bg-[position:right_0.5rem_center] bg-[size:1.25rem] pr-8"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

// Extractors that return objects/maps — not suitable for trend series
const MAP_EXTRACTORS = new Set([
  "risks.byStatus",
  "risks.byDepartment",
  "audit.byStatus",
  "audit.byDepartment",
  "tasks.byStatus",
  "tasks.byDepartment",
  "dpia.byStatus",
  "dpia.byDepartment",
]);

function ExtractorSelect({
  value,
  onChange,
  placeholder = "Select a data field…",
  scalarOnly = false,
  mapOnly = false,
}) {
  const filteredExtractors = scalarOnly
    ? AVAILABLE_EXTRACTORS.filter((e) => !MAP_EXTRACTORS.has(e.extractor))
    : mapOnly
      ? AVAILABLE_EXTRACTORS.filter((e) => MAP_EXTRACTORS.has(e.extractor))
      : AVAILABLE_EXTRACTORS;
  // Group by module prefix
  const groups = useMemo(() => {
    const map = {};
    for (const e of filteredExtractors) {
      const mod = e.extractor.split(".")[0];
      const key = mod.charAt(0).toUpperCase() + mod.slice(1);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm
        text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300
        focus:border-indigo-400 transition-all cursor-pointer appearance-none
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 fill%3D%22none%22 viewBox%3D%220 0 20 20%22%3E%3Cpath stroke%3D%22%236b7280%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22 stroke-width%3D%221.5%22 d%3D%22m6 8 4 4 4-4%22%2F%3E%3C%2Fsvg%3E')]
        bg-[position:right_0.5rem_center] bg-[size:1.25rem] pr-8"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {Object.entries(groups).map(([mod, items]) => (
        <optgroup key={mod} label={`── ${mod}`}>
          {items.map((e) => (
            <option key={e.extractor} value={e.extractor}>
              {e.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// ─── Series row (for trend charts) ───────────────────────────────────────────

function SeriesRow({ series, index, onChange, onRemove, canRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-2"
    >
      {/* label + color row */}
      <div className="flex gap-2 items-center">
        <input
          value={series.label}
          onChange={(e) => onChange(index, "label", e.target.value)}
          placeholder="Series label"
          className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs
            focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        <div className="relative flex items-center gap-1">
          <div
            className="w-6 h-6 rounded-md border-2 border-white shadow-sm cursor-pointer"
            style={{ backgroundColor: series.color }}
          />
          <input
            type="color"
            value={series.color}
            onChange={(e) => onChange(index, "color", e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            title="Pick color"
          />
        </div>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="w-6 h-6 rounded-full bg-rose-100 text-rose-500
              hover:bg-rose-200 flex items-center justify-center text-sm font-bold
              transition-colors flex-shrink-0"
          >
            ×
          </button>
        )}
      </div>
      {/* extractor dropdown */}
      <ExtractorSelect
        value={series.extractor}
        scalarOnly={false} // ← allow map types, they will auto-expand
        onChange={(v) => {
          const autoKey = v.replace(/\./g, "_");
          onChange(index, "extractor", v);
          if (!series.key || series.key.startsWith("series")) {
            onChange(index, "key", autoKey);
          }
        }}
        placeholder="Select data field for this series…"
      />
    </motion.div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300
            ${i < current ? "bg-indigo-500 w-4" : i === current ? "bg-indigo-400 w-6" : "bg-slate-200 w-4"}`}
        />
      ))}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function CustomDashboardModal({ onClose, onSave }) {
  const [step, setStep] = useState(0); // 0 = type, 1 = data, 2 = confirm

  // step 0
  const [title, setTitle] = useState("");
  const [chartType, setChart] = useState("");

  // step 1
  const [series, setSeries] = useState([
    {
      key: "series1",
      label: "Series 1",
      extractor: "",
      color: SERIES_COLORS[0],
    },
  ]);
  const [singleExtractor, setSingleExtractor] = useState("");

  const isTrend = TREND_TYPES.has(chartType);
  const isDonut = chartType === "DonutStatusChart";
  const isSingle = ["StatCard", "ScoreGauge"].includes(chartType);
  const isTable = ["TableWidget", "DepartmentBreakdown"].includes(chartType);

  const selectedMeta = CHART_META[chartType] ?? {};

  // series helpers
  const addSeries = () =>
    setSeries((prev) => [
      ...prev,
      {
        key: `series${prev.length + 1}`,
        label: `Series ${prev.length + 1}`,
        extractor: "",
        color: SERIES_COLORS[prev.length % SERIES_COLORS.length],
      },
    ]);

  const updateSeries = (i, field, value) =>
    setSeries((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );

  const removeSeries = (i) =>
    setSeries((prev) => prev.filter((_, idx) => idx !== i));

  // validation per step
  const step0Valid = title.trim().length > 0 && chartType !== "";
  const step1Valid = isTrend
    ? series.some((s) => s.extractor)
    : singleExtractor !== "";

  const handleSave = () => {
    const panelId = `custom_${Date.now()}`;
    const panel = {
      id: panelId,
      componentType: chartType,
      title: title.trim(),
      props: isTrend
        ? { series: series.filter((s) => s.extractor && s.key) }
        : { extractor: singleExtractor },
    };
    onSave(panel);
    onClose();
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
      bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* ── header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Custom Panel
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 0 && "Give it a name and pick a chart type"}
                {step === 1 && "Choose the data fields to display"}
                {step === 2 && "Review and add to your dashboard"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-slate-500 text-2xl leading-none mt-0.5"
            >
              ×
            </button>
          </div>
          <Steps current={step} total={3} />
        </div>

        {/* ── body ── */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-5">
          <AnimatePresence mode="wait">
            {/* STEP 0 — Name + Chart Type */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div>
                  <Label>Panel Title</Label>
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Open Risks by Status"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                  />
                </div>

                <div>
                  <Label>Chart Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_COMPONENTS.map((c) => {
                      const meta = CHART_META[c.type] ?? {};
                      const active = chartType === c.type;
                      return (
                        <button
                          key={c.type}
                          onClick={() => setChart(c.type)}
                          className={`rounded-xl border-2 p-3 text-left transition-all
                            ${
                              active
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-slate-150 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/40"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-lg">{meta.icon ?? "📦"}</span>
                            <span
                              className={`text-xs font-semibold ${active ? "text-indigo-700" : "text-slate-700"}`}
                            >
                              {c.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight pl-7">
                            {meta.hint}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1 — Data selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* chart type reminder pill */}
                <div
                  className="flex items-center gap-2 bg-indigo-50 border border-indigo-100
                  rounded-xl px-3 py-2"
                >
                  <span className="text-base">{selectedMeta.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-indigo-700">
                      {chartType}
                    </p>
                    <p className="text-[10px] text-indigo-400">
                      {selectedMeta.hint}
                    </p>
                  </div>
                </div>

                {/* Trend charts — series list */}
                {isTrend && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label hint="each series = one line/bar/area">
                        Data Series
                      </Label>
                      <button
                        onClick={addSeries}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800
                          flex items-center gap-1"
                      >
                        <span className="text-base leading-none">+</span> Add
                        Series
                      </button>
                    </div>
                    <AnimatePresence>
                      {series.map((s, i) => (
                        <div key={i} className="mb-2">
                          <SeriesRow
                            series={s}
                            index={i}
                            onChange={updateSeries}
                            onRemove={removeSeries}
                            canRemove={series.length > 1}
                          />
                        </div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Single-value types */}
                {(isSingle || isDonut || isTable) && (
                  <div>
                    <Label
                      hint={
                        isDonut
                          ? "should point to an object map like risks.byStatus"
                          : isTable
                            ? "should point to an array like risks.byDepartment"
                            : "scalar value e.g. risks.total"
                      }
                    >
                      Data Field
                    </Label>
                    <ExtractorSelect
                      value={singleExtractor}
                      onChange={setSingleExtractor}
                      mapOnly={isTable}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2 — Review */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100">
                  <ReviewRow label="Title" value={title} />
                  <ReviewRow
                    label="Chart Type"
                    value={`${selectedMeta.icon} ${chartType}`}
                  />
                  {isTrend ? (
                    <div className="px-4 py-3">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Series
                      </p>
                      {series
                        .filter((s) => s.extractor)
                        .map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 mb-1.5"
                          >
                            <div
                              className="w-3 h-3 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-xs font-medium text-slate-700">
                              {s.label}
                            </span>
                            <span className="text-xs text-slate-400 ml-auto font-mono">
                              {s.extractor}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <ReviewRow label="Extractor" value={singleExtractor} mono />
                  )}
                </div>

                <p className="text-xs text-slate-400 text-center">
                  This panel will be saved to your{" "}
                  <strong className="text-slate-600">Custom</strong> tab and
                  persisted across sessions.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={step === 0 ? onClose : () => setStep(step - 1)}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium px-2 py-1"
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 ? !step0Valid : !step1Valid}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold
                hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-95 transition-all shadow-sm"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold
                hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center gap-2"
            >
              <span>✓</span> Add Panel
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── tiny review row ──────────────────────────────────────────────────────────

function ReviewRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <span
        className={`text-xs text-slate-700 text-right ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}
