/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DASHBOARD ENGINE  (fixed)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes:
 *   1. KpiWrapper data resolution — trend/series extractors now correctly
 *      produce { points: [...] } instead of { value, delta }
 *   2. Custom Dashboard button opens a real config modal; saved configs are
 *      stored in localStorage and rendered as extra views.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  Suspense,
  memo,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveComponent } from "./kpiRegistry";
import {
  resolveSingleValue,
  resolveTrendSeries,
  resolveMapValue,
  resolveTableRows,
} from "./dataExtractors";
import { useDashboardData } from "../../../hooks/useDashboardData";
import { useDashboardExport } from "../../../hooks/useDashboardExport";
import CustomDashboardModal from "./customDashboardModal";

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Decide how to resolve extractor string based on what the KPI needs.
 * componentType is the ground truth — not the leaf value heuristic.
 */
function resolveKpiData(kpiConfig, result) {
  const { componentType, props = {} } = kpiConfig;

  switch (componentType) {
    case "StatCard":
    case "ScoreGauge": {
      const extractor = props.extractor ?? kpiConfig.extractor ?? "";
      return resolveSingleValue(result, extractor);
    }

    case "TrendLineChart":
    case "TrendAreaChart":
    case "TrendBarChart": {
      // props.series = [{ key, label, color, extractor }]
      // props.labelExtractor = path to x-axis label array
      const series = props.series ?? [];
      return resolveTrendSeries(result, series, props.labelExtractor);
    }

    case "DonutStatusChart": {
      const extractor = props.extractor ?? kpiConfig.extractor ?? "";
      if (props.staticSlices) return { slices: props.staticSlices };
      return resolveMapValue(result, extractor);
    }

    case "DepartmentBreakdown": {
      const extractor = props.extractor ?? kpiConfig.extractor ?? "";
      return resolveMapValue(result, extractor);
    }
    case "TableWidget": {
      const extractor = props.extractor ?? kpiConfig.extractor ?? "";
      return resolveTableRows(result, extractor);
    }

    default:
      return {};
  }
}

// ─── KpiWrapper ───────────────────────────────────────────────────────────────

const KpiWrapper = memo(function KpiWrapper({ kpiConfig, results, loading }) {
  const Component = useMemo(
    () => resolveComponent(kpiConfig.componentType),
    [kpiConfig.componentType],
  );

  // Find the correct result object for this KPI's reportId
  const result = useMemo(() => {
    if (!results || results.length === 0) return null;
    const reportId = kpiConfig.reportId;
    if (!reportId) return results[0] ?? null;
    return results.find((r) => r?.reportId === reportId) ?? results[0] ?? null;
  }, [results, kpiConfig.reportId]);

  const resolvedData = useMemo(() => {
    if (!result) return null;
    try {
      return resolveKpiData(kpiConfig, result);
    } catch (err) {
      console.error("[KpiWrapper] resolution error", kpiConfig.id, err);
      return null;
    }
  }, [result, kpiConfig]);

  return (
    <Suspense fallback={<SkeletonCard />}>
      <Component
        kpiConfig={kpiConfig}
        resolvedData={resolvedData}
        loading={loading || !result}
      />
    </Suspense>
  );
});

// ─── PanelGrid ────────────────────────────────────────────────────────────────

function PanelGrid({ panels, results, loading, columns = 3 }) {
  // Use the view's declared column count so colSpan values work correctly.
  // auto-fill would ignore span N because it doesn't know total column count.
  const gridCols = `repeat(${columns}, minmax(0, 1fr))`;
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: gridCols }}>
      {panels.map((panel) => {
        // Schema: panel.kpis[] holds actual KPI configs.
        // Custom panels (added via modal) are flat — componentType lives on the panel directly.
        const kpiList = panel.kpis?.length ? panel.kpis : [panel];
        const colSpan = Math.min(panel.colSpan ?? 1, columns);
        return (
          <div
            key={panel.id}
            className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden"
            style={{ gridColumn: `span ${colSpan}` }}
          >
            {kpiList.map((kpiConfig) => (
              <KpiWrapper
                key={kpiConfig.id}
                kpiConfig={kpiConfig}
                results={results}
                loading={loading}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// CustomDashboardModal is now in ./CustomDashboardModal.jsx (dropdown-driven)

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="h-48 rounded-2xl bg-slate-50 animate-pulse flex flex-col gap-3 p-5">
      <div className="h-3 w-1/3 bg-slate-200 rounded-full" />
      <div className="flex-1 bg-slate-100 rounded-xl" />
    </div>
  );
}

// ─── DashboardEngine (main) ───────────────────────────────────────────────────

const CUSTOM_PANELS_KEY = "calvant_custom_panels";

export default function DashboardEngine({
  config,
  results, // 👈 Receive data from parent
  loading, // 👈 Receive loading state from parent
  error, // 👈 Receive error state from parent
}) {
  // ── custom panels (persisted) ──────────────────────────────────────────────
  const [customPanels, setCustomPanels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_PANELS_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  const [showModal, setShowModal] = useState(false);

  const savePanel = useCallback((panel) => {
    setCustomPanels((prev) => {
      const updated = [...prev, panel];
      localStorage.setItem(CUSTOM_PANELS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeCustomPanel = useCallback((id) => {
    setCustomPanels((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(CUSTOM_PANELS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── active view tab ────────────────────────────────────────────────────────
  // ── active view tab ────────────────────────────────────────────────────────
  const views = config?.views ?? [];
  const [activeViewId, setActiveViewId] = useState(views[0]?.id ?? null);

  // 1. allViews MUST be defined BEFORE activeView so it knows about the Custom tab
  const allViews = useMemo(() => {
    if (customPanels.length === 0) return views;
    return [
      ...views,
      {
        id: "custom",
        label: "Custom",
        panels: customPanels,
      },
    ];
  }, [views, customPanels]);

  // 2. activeView MUST search allViews (not 'views')
  const activeView = allViews.find((v) => v.id === activeViewId) ?? allViews[0];

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 text-sm">
        Failed to load dashboard data: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Tab bar + actions ───────────────────────────────────────────────── */}
      <div
        id="kpis-container"
        data-html2canvas-ignore="true"
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {allViews.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveViewId(view.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${
                  (activeViewId ?? views[0]?.id) === view.id
                    ? "bg-white shadow text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {view.label ?? view.id}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
        >
          <span className="text-base leading-none">＋</span> Custom Panel
        </button>
      </div>

      {/* ── Panel grid ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          id="charts-container"
          key={activeViewId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {/* ✅ Render standard template panels ONLY if not on Custom tab */}
          {activeView && activeView.id !== "custom" && (
            <PanelGrid
              panels={activeView.panels ?? []}
              results={results}
              loading={loading}
              columns={activeView.layout?.columns ?? 3}
            />
          )}

          {/* ✅ Render custom view panels explicitly with the remove button */}
          {activeView?.id === "custom" && (
            <div
              className="mt-2 grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              }}
            >
              {customPanels.map((panel) => (
                <div
                  key={panel.id}
                  className="relative rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden group"
                >
                  <button
                    onClick={() => removeCustomPanel(panel.id)}
                    title="Remove panel"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity
                      w-6 h-6 rounded-full bg-rose-100 text-rose-500 hover:bg-rose-200 text-xs font-bold flex items-center justify-center"
                  >
                    ×
                  </button>
                  <KpiWrapper
                    kpiConfig={panel}
                    results={results}
                    loading={loading}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Custom panel modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <CustomDashboardModal
            onClose={() => setShowModal(false)}
            onSave={savePanel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
