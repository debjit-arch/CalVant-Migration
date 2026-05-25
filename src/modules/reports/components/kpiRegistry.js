/**
 * ─────────────────────────────────────────────────────────────────────────────
 * KPI WIDGET REGISTRY  (FIXED)
 * ─────────────────────────────────────────────────────────────────────────────
 * BUG FIXED: DepartmentBreakdown and TableWidget were both pointing to
 * "./ScoreGauge" — they are named exports from the same file so they need
 * the `.then(m => ({ default: m.NamedExport }))` pattern for React.lazy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { lazy } from "react";

export const KPI_REGISTRY = {
  StatCard:            lazy(() => import("./StatCard")),
  TrendLineChart:      lazy(() => import("./TrendLineChart")),
  TrendAreaChart:      lazy(() => import("./TrendAreaChart")),
  TrendBarChart:       lazy(() => import("./TrendBarChart")),
  DonutStatusChart:    lazy(() => import("./DonutStatusChart")),

  // ScoreGauge is the default export
  ScoreGauge:          lazy(() => import("./ScoreGauge")),

  // DepartmentBreakdown and TableWidget are NAMED exports from ScoreGauge.jsx
  // React.lazy requires a module with a `default` export, so we re-wrap them:
  DepartmentBreakdown: lazy(() =>
    import("./ScoreGauge").then((m) => ({ default: m.DepartmentBreakdown }))
  ),
  TableWidget: lazy(() =>
    import("./ScoreGauge").then((m) => ({ default: m.TableWidget }))
  ),
};

/**
 * Resolve a componentType string to a React component.
 * Returns a fallback placeholder if the type is not registered.
 */
export function resolveComponent(componentType) {
  const Component = KPI_REGISTRY[componentType];
  if (!Component) {
    console.warn(`[KPI Registry] Unknown componentType: "${componentType}". Rendering fallback.`);
    return UnknownWidget;
  }
  return Component;
}

// ─── FALLBACK FOR UNREGISTERED TYPES ─────────────────────────────────────────
function UnknownWidget({ kpiConfig }) {
  return (
    <div className="h-full flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unknown Widget</p>
        <code className="text-[10px] text-rose-500 mt-1 block">{kpiConfig?.componentType}</code>
      </div>
    </div>
  );
}