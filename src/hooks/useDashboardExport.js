/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useDashboardExport  (fixed — safe destructure)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  resolveSingleValue,
  resolveTrendSeries,
  resolveMapValue,
  resolveTableRows,
} from "../modules/reports/components/dataExtractors";

// ─── helpers ──────────────────────────────────────────────────────────────────

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, filename);
}

function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          return typeof val === "string" && val.includes(",")
            ? `"${val}"`
            : val;
        })
        .join(","),
    ),
  ].join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv" }), filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

function resolveKpiSnapshot(kpiConfig, results) {
  const result =
    results?.find((r) => r?.reportId === kpiConfig.reportId) ??
    results?.[0] ??
    null;
  if (!result) return null;

  const { componentType, props = {} } = kpiConfig;
  switch (componentType) {
    case "StatCard":
    case "ScoreGauge":
      return resolveSingleValue(
        result,
        props.extractor ?? kpiConfig.extractor ?? "",
      );
    case "TrendLineChart":
    case "TrendAreaChart":
    case "TrendBarChart":
      return resolveTrendSeries(
        result,
        props.series ?? [],
        props.labelExtractor,
      );
    case "DonutStatusChart":
      if (props.staticSlices) return { slices: props.staticSlices };
      return resolveMapValue(
        result,
        props.extractor ?? kpiConfig.extractor ?? "",
      );
    case "DepartmentBreakdown":
    case "TableWidget":
      return resolveTableRows(
        result,
        props.extractor ?? kpiConfig.extractor ?? "",
      );
    default:
      return null;
  }
}

// ─── hook ─────────────────────────────────────────────────────────────────────

/**
 * Safe to call even before config/results are ready.
 *
 * Usage:
 *   const { exportConfig, exportSnapshot, exportCSV } = useDashboardExport({ config, results });
 */
export function useDashboardExport(dashboardState) {
  // default to {} so destructure never throws when called with undefined
  const { config, results } = dashboardState ?? {};

  const slug = config?.id ?? "dashboard";

  const exportConfig = useCallback(() => {
    if (!config) return;
    downloadJSON(`calvant-config-${slug}-${timestamp()}.json`, config);
  }, [config, slug]);

  const exportSnapshot = useCallback(() => {
    if (!config) return;
    const snapshot = {
      exportedAt: new Date().toISOString(),
      dashboardId: config.id,
      title: config.title,
      views: (config.views ?? []).map((view) => ({
        id: view.id,
        label: view.label,
        panels: (view.panels ?? []).map((panel) => ({
          id: panel.id,
          title: panel.title,
          componentType: panel.componentType,
          data: resolveKpiSnapshot(panel, results ?? []),
        })),
      })),
    };
    downloadJSON(`calvant-snapshot-${slug}-${timestamp()}.json`, snapshot);
  }, [config, results, slug]);

  const exportCSV = useCallback(() => {
    if (!results || results.length === 0) return;
    const rows = results.map((r) => {
      const flat = { reportId: r?.reportId ?? "" };
      const data = r?.data ?? r ?? {};
      for (const [k, v] of Object.entries(data)) {
        flat[k] = typeof v === "object" ? JSON.stringify(v) : v;
      }
      return flat;
    });
    downloadCSV(`calvant-data-${slug}-${timestamp()}.csv`, rows);
  }, [results, slug]);

  const exportPDF = useCallback(
    async (dashboardRef) => {
      if (!dashboardRef.current) return;

      try {
        const element = dashboardRef.current;

        const canvas = await html2canvas(element, {
          scale: 2, // 2x scale for crisp text
          useCORS: true,
          logging: false,
          backgroundColor: "#f8fafc",
          // ✅ Add these three lines to force it to capture the hidden scrolled areas
          scrollY: -window.scrollY,
          windowHeight: element.scrollHeight,
          height: element.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");

        // The PDF will automatically scale its height to match your long canvas
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`calvant-report-${slug}-${timestamp()}.pdf`);
      } catch (error) {
        console.error("PDF Export failed:", error);
      }
    },
    [slug],
  );

  return { exportConfig, exportSnapshot, exportCSV, exportPDF };
}
