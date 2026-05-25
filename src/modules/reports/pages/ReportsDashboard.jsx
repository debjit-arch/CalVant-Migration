import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  CheckSquare,
  ShieldCheck,
  FileText,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Calendar,
  BarChart3,
  Plus,
  ChevronRight,
  Download,
  FileJson,
  FileSpreadsheet,
  Settings2,
  HelpCircle,
} from "lucide-react";
import Joyride, { STATUS } from "react-joyride";

import DashboardEngine from "../components/DashboardEngine";
import {
  DASHBOARD_TEMPLATES,
  TEMPLATE_ORDER,
} from "../components/dashboardSchema";
import { useDashboardData } from "../../../hooks/useDashboardData";
import { useDashboardExport } from "../../../hooks/useDashboardExport";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const INTERVALS = [
  { key: "7d", label: "7 Days" },
  { key: "14d", label: "14 Days" },
  { key: "90d", label: "90 Days" },
  { key: "custom", label: "Custom" },
];

const SIDEBAR_ICONS = {
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  CheckSquare,
  ShieldCheck,
  FileText,
  Activity,
  BarChart3,
  Settings2,
};

// ─── ORG INIT ─────────────────────────────────────────────────────────────────
function getDefaultOrg() {
  try {
    return (
      sessionStorage.getItem("orgId") ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organization ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organizationId ||
      ""
    );
  } catch {
    return "";
  }
}

// ─── SIDEBAR ITEM ─────────────────────────────────────────────────────────────
function SidebarItem({ template, isActive, onClick }) {
  const Icon = SIDEBAR_ICONS[template.icon] ?? LayoutDashboard;
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
        isActive
          ? "bg-white shadow-sm text-slate-800"
          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
          isActive
            ? `bg-gradient-to-br ${template.gradient} shadow-md`
            : "bg-slate-100 group-hover:bg-slate-200"
        }`}
      >
        <Icon
          size={14}
          className={isActive ? "text-white" : "text-slate-500"}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-semibold truncate ${isActive ? "text-slate-800" : "text-slate-600"}`}
        >
          {template.label}
        </p>
      </div>
      {isActive && (
        <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
      )}
    </motion.button>
  );
}
// ─── EXPORT DROPDOWN ─────────────────────────────────────────────────────────
function ExportDropdown({ onConfig, onSnapshot, onCSV, onPDF }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-600 transition-colors"
      >
        <Download size={13} />
        Export
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
          >
            <div className="p-1.5 flex flex-col gap-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5">
                Export As
              </p>

              {/* Config JSON */}
              <button
                onClick={() => {
                  onConfig();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Settings2 size={13} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Dashboard Config
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JSON schema · layout + KPIs
                  </p>
                </div>
              </button>

              {/* Snapshot JSON */}
              <button
                onClick={() => {
                  onSnapshot();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <FileJson size={13} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Data Snapshot
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JSON · resolved KPI values
                  </p>
                </div>
              </button>

              {/* CSV */}
              <button
                onClick={() => {
                  onCSV();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet size={13} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Raw Data CSV
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Flat table · all data points
                  </p>
                </div>
              </button>

              {/* ✅ ADDED PDF BUTTON HERE */}
              <button
                onClick={() => {
                  onPDF();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={13} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Download PDF
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Visual screenshot
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ReportsDashboard() {
  const [organization, setOrganization] = useState(getDefaultOrg());
  const [activeDashboardId, setActiveDashboardId] = useState(TEMPLATE_ORDER[0]);
  const [interval, setInterval] = useState("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [user] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });
  const userRoles = useMemo(() => {
    if (!user) return [];
    return Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];
  }, [user]);
  const isRoot = userRoles.includes("root");

  const [run, setRun] = useState(false);
  const steps = [
    {
      target: "#dashboard-header",
      content: "Welcome to your Reports Dashboard. Access detailed visual reports across different compliance modules.",
    },
    {
      target: "#sidebar-navigation",
      content: "Switch between different visual report templates using this sidebar menu.",
    },
    {
      target: "#kpis-container",
      content: "A quick snapshot of the key performance indicators for the active module.",
    },
    {
      target: "#charts-container",
      content: "Detailed charts and tables visualizing compliance data points.",
    },
  ];

  // ✅ 1. CREATE THE REF
  const exportAreaRef = useRef(null);

  const activeConfig = useMemo(
    () =>
      DASHBOARD_TEMPLATES[activeDashboardId] ??
      DASHBOARD_TEMPLATES[TEMPLATE_ORDER[0]],
    [activeDashboardId],
  );

  const filters = useMemo(
    () => ({ interval, customFrom, customTo }),
    [interval, customFrom, customTo],
  );

  const { results, loading, error, refetch, lastFetched, online } =
    useDashboardData(activeConfig, organization, filters);

  // ✅ 2. EXTRACT exportPDF
  const { exportConfig, exportSnapshot, exportCSV, exportPDF } =
    useDashboardExport({
      config: activeConfig,
      results: results,
    });

  const customRangeLabel = useMemo(() => {
    if (!customFrom) return "Custom";
    const from = new Date(customFrom).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    if (!customTo) return `From ${from}`;
    const to = new Date(customTo).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    return `${from} – ${to}`;
  }, [customFrom, customTo]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/20 flex"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        scrollToFirstStep
        styles={{ options: { primaryColor: "#3b82f6", width: 300 } }}
        callback={(data) => {
          if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status))
            setRun(false);
        }}
      />

      {/* ── SIDEBAR (Remains exactly the same) ── */}
      <aside id="sidebar-navigation" className="w-56 flex-shrink-0 bg-white/60 backdrop-blur-md border-r border-slate-100/60 flex flex-col gap-2 p-3 sticky top-0 h-screen overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">
          Dashboards
        </p>
        <nav className="flex flex-col gap-0.5">
          {TEMPLATE_ORDER.map((id) => (
            <SidebarItem
              key={id}
              template={DASHBOARD_TEMPLATES[id]}
              isActive={activeDashboardId === id}
              onClick={() => setActiveDashboardId(id)}
            />
          ))}
        </nav>

        {/* <div className="mt-auto pt-3 border-t border-slate-100">
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-white/60 transition-all"
            onClick={() => {}}
          >
            <Plus size={14} />
            Custom Dashboard
          </button>
        </div> */}
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header id="dashboard-header" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100/60 px-6 py-4" style={{ textAlign: "left" }}>
          <div className="flex items-center justify-between gap-4 flex-wrap" style={{ width: "100%", justifyContent: "space-between" }}>
            {/* Dashboard title */}
            <div className="flex items-center gap-3" style={{ justifyContent: "flex-start", textAlign: "left" }}>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center shadow-md flex-shrink-0`}
              >
                {React.createElement(
                  SIDEBAR_ICONS[activeConfig.icon] ?? BarChart3,
                  { size: 18, className: "text-white" },
                )}
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-tight">
                  {activeConfig.label}
                </h1>
                <p className="text-xs text-slate-500">
                  {activeConfig.description}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status pill */}
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                  online
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {online ? (
                  <>
                    <Wifi size={11} /> Live
                  </>
                ) : (
                  <>
                    <WifiOff size={11} /> Offline
                  </>
                )}
              </span>

              {/* Last synced */}
              {lastFetched && (
                <span className="text-xs text-slate-400 hidden sm:block">
                  Synced {lastFetched.toLocaleTimeString()}
                </span>
              )}

              {/* Refresh */}
              <motion.button
                onClick={refetch}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 disabled:opacity-60 flex items-center justify-center"
              >
                <RefreshCw
                  size={14}
                  className="text-slate-500"
                  style={
                    loading ? { animation: "spin 1s linear infinite" } : {}
                  }
                />
              </motion.button>

              {/* ✅ 3. PASS onPDF to EXPORT DROPDOWN */}
              <ExportDropdown
                onConfig={exportConfig}
                onSnapshot={exportSnapshot}
                onCSV={exportCSV}
                onPDF={() => exportPDF(exportAreaRef)}
              />

              {/* Interval selector */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
                {INTERVALS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setInterval(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      interval === key
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {key === "custom" && <Calendar size={10} />}
                    {key === "custom" && interval === "custom"
                      ? customRangeLabel
                      : label}
                  </button>
                ))}
              </div>

              {/* User badge, Name, and Guide button */}
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isRoot ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                {isRoot ? "Root" : (userRoles[0] ? userRoles[0].replace("_", " ") : "User")}
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {user?.name || "User"}
              </span>

              <motion.button
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1.5"
                onClick={() => {
                  setRun(false);
                  setTimeout(() => setRun(true), 100);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HelpCircle size={14} />
                <span>Guide</span>
              </motion.button>
            </div>
          </div>

          {/* ... Date pickers code remains exactly the same ... */}

          {/* Custom date range picker */}
          <AnimatePresence>
            {interval === "custom" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                  <Calendar
                    size={13}
                    className="text-slate-400 flex-shrink-0"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-slate-500 font-medium">
                        From
                      </label>
                      <input
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-slate-500 font-medium">
                        To
                      </label>
                      <input
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        min={customFrom}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    {customFrom && customTo && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => {
                          setCustomFrom("");
                          setCustomTo("");
                          setInterval("7d");
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                      >
                        Clear
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ✅ 4. ATTACH THE REF TO THE MAIN CONTAINER */}
        {/* ✅ 4. ATTACH THE REF TO AN INNER WRAPPER, NOT THE SCROLLABLE MAIN */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div ref={exportAreaRef} className="pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDashboardId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardEngine
                  config={activeConfig}
                  results={results}
                  loading={loading}
                  error={error}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="bg-white/80 backdrop-blur-md border-t border-slate-100/60 px-6 py-4">
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} CalVant · Reports Dashboard ·{" "}
            {Object.keys(DASHBOARD_TEMPLATES).length} modules configured
          </p>
        </footer>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
