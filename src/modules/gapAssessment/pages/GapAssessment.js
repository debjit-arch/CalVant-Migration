"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ClipboardList,
  BarChart3,
  Users,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";

import {
  PlanAuditModal,
  ManageAuditsModal,
  AuditReportsModal,
  ConductAuditModal,
  ReviewFindingsModal,
} from "../components/modals";
import { CustomPieTooltip, CustomBarTooltip } from "../components/charts";
import { getSessionUser } from "../utils/helpers";
import auditService from "../services/auditService";
import { useFramework } from "../../../context/FrameworkContex";
import CompactFrameworkFilter from "../../documentation/pages/CompactFrameworkFilter";
import { captureActivity, ACTIONS } from "../../../services/activities";

// ─────────────────────────────────────────────────────────────────────────────
// Normalize a raw framework code string for comparison
// "ISO 27001" → "ISO27001", "iso_27001" → "ISO27001", "SOC 2" → "SOC2"
// ─────────────────────────────────────────────────────────────────────────────
function normalizeFw(raw) {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Returns true if the audit's frameworkCode matches any of the pre-normalized selected codes
function auditMatchesFrameworks(audit, normalizedSelectedFW) {
  if (!audit) return false;
  const raw = audit.frameworkCode || audit.framework;
  if (!raw) return false;
  const rawValues = Array.isArray(raw) ? raw : [raw];
  const auditCodes = rawValues.map(normalizeFw).filter(Boolean);
  return normalizedSelectedFW.some(fw => auditCodes.some(code => code === fw));
}

// ─────────────────────────────────────────────────────────────────────────────
// Month labels
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function AuditDashboard() {
  const router = useRouter();
  const sessionUser = getSessionUser();
  const chartsContainerRef = useRef(null);

  // ── Role detection ────────────────────────────────────────────────────────
  const userRoles = Array.isArray(sessionUser.role) ? sessionUser.role : [sessionUser.role || ""];
  const isRoot = userRoles.some(r => {
    const s = (typeof r === "string" ? r : r?.name || r?.roleName || "").toLowerCase().replace(/[\s_-]/g, "");
    return ["root","ciso","aio","dpo"].some(role => s.includes(role));
  });

  // ── Local state ───────────────────────────────────────────────────────────
  const [modal, setModal] = useState(null);
  const [auditors, setAuditors] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [allAudits, setAllAudits] = useState([]);

  // ── Framework context — fully dynamic ─────────────────────────────────────
  const { selectedFrameworks, toggleFramework, isAllSelected, availableFrameworks } = useFramework();

  const fwKey = selectedFrameworks.join(",");

  // Pre-normalized selected framework codes for audit matching
  const normalizedSelectedFW = useMemo(() => {
    if (isAllSelected) return availableFrameworks.map(fw => normalizeFw(fw.code));
    return selectedFrameworks.map(label => {
      const fw = availableFrameworks.find(f => f.id === label);
      return fw ? normalizeFw(fw.code) : normalizeFw(label);
    });
  }, [fwKey, isAllSelected, availableFrameworks]);

  const filteredAudits = useMemo(() => {
    if (isAllSelected) return allAudits;
    if (allAudits.length === 0) return [];
    return allAudits.filter(a => auditMatchesFrameworks(a, normalizedSelectedFW));
  }, [allAudits, isAllSelected, normalizedSelectedFW]);

  // ── Stats derived from filteredAudits ─────────────────────────────────────
  const filteredStats = useMemo(() => {
    const totalFindings = filteredAudits.reduce(
      (sum, a) => sum + (Array.isArray(a.findings) ? a.findings.length : 0), 0,
    );
    return {
      total: filteredAudits.length,
      planned: filteredAudits.filter(a => a.status === "PLANNED").length,
      inProgress: filteredAudits.filter(a => a.status === "IN_PROGRESS").length,
      completed: filteredAudits.filter(a => a.status === "COMPLETED").length,
      findings: totalFindings,
    };
  }, [filteredAudits]);

  // ── Year selector ─────────────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const availableYears = useMemo(() => [
    ...new Set(
      filteredAudits
        .map(a => { const d = a.createdAt || a.startDate; return d ? new Date(d).getFullYear() : null; })
        .filter(Boolean),
    ),
  ], [filteredAudits]);

  // ── Monthly bar data ──────────────────────────────────────────────────────
  const barData = useMemo(() => {
    const counts = new Array(12).fill(0);
    filteredAudits.forEach(audit => {
      const dateField = audit.openingMeetingDate;
      if (!dateField) return;
      const d = new Date(dateField);
      if (isNaN(d.getTime())) return;
      if (d.getFullYear() !== selectedYear) return;
      counts[d.getMonth()] += 1;
    });
    return MONTHS.map((name, i) => ({ name, value: counts[i] }));
  }, [filteredAudits, selectedYear]);

  // ── Pie data ──────────────────────────────────────────────────────────────
  const pieData = useMemo(() => [
    { name: "Planned",     value: filteredStats.planned,    color: "#f59e0b" },
    { name: "In Progress", value: filteredStats.inProgress, color: "#6366f1" },
    { name: "Completed",   value: filteredStats.completed,  color: "#10b981" },
  ].filter(d => d.value > 0), [filteredStats]);

  // ── ResizeObserver ────────────────────────────────────────────────────────
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
    });
    if (chartsContainerRef.current) ro.observe(chartsContainerRef.current);
    return () => {
      if (chartsContainerRef.current) ro.unobserve(chartsContainerRef.current);
      clearTimeout(window.resizeTimeout);
    };
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    setLoadingStats(true);
    auditService.getAllUsers().then(users => {
      const filtered = (users || []).filter(u => {
        const roles = Array.isArray(u.role) ? u.role : [u.role || ""];
        const hasAuditorRole = roles.some(r => {
          const roleString = (typeof r === "string" ? r : r?.name || r?.roleName || "").toLowerCase();
          return roleString === "auditor";
        });
        return hasAuditorRole || u.isAuditor;
      });
      setAuditors(filtered);
    }).catch(() => {});

    auditService.getAudits().then(data => {
      setAllAudits(data || []);
      setLoadingStats(false);
    }).catch(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    captureActivity({ action: ACTIONS.PAGE_LOAD, item: "Gap Assessment Dashboard", url: "/gap-assessment" });
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (fwKey) {
      captureActivity({ action: ACTIONS.SELECT, item: "Gap Assessment Filter · Selected: " + (isAllSelected ? "All Frameworks" : selectedFrameworks.join(", ")), url: "/gap-assessment" });
    }
  }, [fwKey, isAllSelected, selectedFrameworks]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const rootActions = [
    { key: "plan",    Icon: ClipboardList, title: "Plan Audit",      subtitle: "Schedule & assign controls",   color: "from-blue-400 to-blue-600"    },
    { key: "manage",  Icon: Layers,        title: "Manage Audits",   subtitle: "View & edit existing audits",  color: "from-violet-400 to-violet-600" },
    { key: "reports", Icon: BarChart3,     title: "Audit Reports",   subtitle: "View findings & scores",       color: "from-emerald-400 to-emerald-600" },
  ];
  const auditorActions = [
    { key: "conduct",  Icon: ClipboardList, title: "Conduct Audit",    subtitle: "Submit scores for assigned controls", color: "from-blue-400 to-blue-600" },
    { key: "findings", Icon: AlertCircle,   title: "Review Findings",  subtitle: "View findings & create CAP",          color: "from-rose-400 to-rose-600"  },
  ];
  const actions = isRoot ? rootActions : auditorActions;

  const statCards = [
    { label: "Total",       value: filteredStats.total,      Icon: FileText,    color: "from-blue-400 to-blue-500"     },
    { label: "Planned",     value: filteredStats.planned,    Icon: Clock,       color: "from-amber-400 to-amber-500"   },
    { label: "In Progress", value: filteredStats.inProgress, Icon: RefreshCw,   color: "from-violet-400 to-violet-500" },
    { label: "Completed",   value: filteredStats.completed,  Icon: CheckCircle2,color: "from-emerald-400 to-emerald-500" },
    { label: "Findings",    value: filteredStats.findings,   Icon: AlertCircle, color: "from-rose-400 to-rose-500"     },
  ];

  // Derive active framework labels for header badges — from context, no hardcoded map
  const activeFwBadges = useMemo(() => {
    if (isAllSelected) return [];
    return selectedFrameworks.map(label => {
      const fw = availableFrameworks.find(f => f.id === label);
      return fw ? { label: fw.label, color: fw.color } : null;
    }).filter(Boolean);
  }, [selectedFrameworks, isAllSelected, availableFrameworks]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden" style={{ fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-28">

        {/* HEADER */}
        <motion.header
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-6 p-6"
          initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <ShieldCheck className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                {/* Title row — dynamic framework badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold text-slate-800 leading-tight">Audit Management</h1>
                  {activeFwBadges.map(fw => (
                    <span
                      key={fw.label}
                      title={`Showing audits filtered by ${fw.label}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: fw.color + "18", color: fw.color, border: `1px solid ${fw.color}55`, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: fw.color, flexShrink: 0 }} />
                      {fw.label}
                    </span>
                  ))}
                </div>
                <p className="text-base text-slate-600 mt-1">
                  {isRoot ? "Root Dashboard" : "Auditor Dashboard"} •{" "}
                  <span className="font-bold text-2xl text-slate-900">{filteredStats.total}</span>{" "}
                  <span className="text-slate-400 text-xs ml-1">{isAllSelected ? "Total Audits" : "Filtered Audits"}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isRoot ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                {isRoot ? "Root" : "Auditor"}
              </span>
              <span className="text-sm font-semibold text-slate-600">{sessionUser.name || "User"}</span>
              <motion.button onClick={loadData} title="Refresh" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <RefreshCw size={15} className="text-slate-500" />
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* LEFT COLUMN */}
          <div className="space-y-8">

            {/* Stat Cards */}
            {isRoot && (
              <motion.section className="grid grid-cols-2 sm:grid-cols-3 gap-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                {statCards.map((stat, i) => {
                  const Icon = stat.Icon;
                  return (
                    <motion.div key={stat.label} className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3 h-20 hover:bg-white" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }} whileHover={{ scale: 1.02 }}>
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                        <Icon size={20} className="text-white drop-shadow-sm" />
                      </div>
                      <div>
                        <span className="text-2xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">{loadingStats ? "—" : stat.value}</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.section>
            )}

            {/* Auditor summary */}
            {!isRoot && (
              <motion.div className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-5 shadow-sm" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center shadow-md">
                    <Users size={18} className="text-white" />
                  </div>
                  <h3 className="text-sm text-slate-700 font-semibold">Controls assigned to {sessionUser.name || "you"}</h3>
                </div>
                <p className="text-sm text-slate-500">Open "Conduct Audit" to view and score your assigned controls.</p>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
              <div className={`grid gap-4 ${isRoot ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                <AnimatePresence>
                  {actions.map((action, i) => {
                    const Icon = action.Icon;
                    return (
                      <motion.div
                        key={action.key}
                        className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
                        initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }} whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          captureActivity({ action: ACTIONS.CLICK, item: "Gap Assessment · Opened modal: " + action.title, url: "/gap-assessment" });
                          setModal(action.key);
                        }}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md mb-4`}>
                          <Icon size={22} className="text-white drop-shadow-sm" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{action.title}</p>
                        <p className="text-xs text-slate-500">{action.subtitle}</p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

          {/* RIGHT COLUMN: CHARTS */}
          <div ref={chartsContainerRef} className="space-y-6">

            {/* PIE CHART */}
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-72 flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} whileHover={{ scale: 1.01 }}
            >
              <h3 className="text-base font-semibold text-slate-800 mb-4">Audit Status</h3>
              <div className="flex-1 flex items-center justify-center min-h-0">
                {filteredStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={75} paddingAngle={3} stroke="white" strokeWidth={3}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip total={filteredStats.total} />} />
                      <text x="50%" y="43%" textAnchor="middle" dominantBaseline="middle" style={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}>Total</text>
                      <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" style={{ fill: "#1e293b", fontSize: 22, fontWeight: 800 }}>{filteredStats.total}</text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <ShieldCheck size={40} className="text-slate-300 mb-3" strokeWidth={1.5} />
                    <p className="text-base font-semibold text-slate-400 mb-1">{isAllSelected ? "No Audits Yet" : "No Matching Audits"}</p>
                    <p className="text-sm text-slate-400">
                      {isAllSelected ? "Plan your first audit to get started" : `No audits found for ${selectedFrameworks.join(" + ")}`}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* BAR CHART */}
            <motion.div
              style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)", border: "1px solid rgba(241,245,249,0.6)", borderRadius: "16px", padding: "24px", height: "288px", boxShadow: "0 8px 20px rgba(0,0,0,0.05)", transition: "all 0.4s ease", display: "flex", flexDirection: "column" }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} whileHover={{ scale: 1.01 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "2px" }}>Audit Trends</h3>
                  <p style={{ fontSize: "12px", color: "#475569" }}>
                    Audits created each month{" "}
                    <span style={{ marginLeft: 4, padding: "1px 8px", borderRadius: 12, background: "#dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 700 }}>
                      {barData.reduce((s, d) => s + d.value, 0)} total
                    </span>
                  </p>
                </div>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ fontSize: "12px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 8px", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", cursor: "pointer" }}>
                  {availableYears.length > 0
                    ? availableYears.map(year => <option key={year} value={year}>{year}</option>)
                    : <option value={selectedYear}>{selectedYear}</option>}
                </select>
              </div>

              <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
                {barData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 15, right: 15, left: -5, bottom: 10 }}>
                      <defs>
                        <linearGradient id="auditBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.9} />
                          <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} />
                      <YAxis hide />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="value" fill="url(#auditBarGradient)" radius={[5,5,0,0]} barSize={24} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
                    <BarChart3 size={40} style={{ color: "#cbd5e1", marginBottom: 12 }} strokeWidth={1.5} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>No Trend Data</p>
                    <p style={{ fontSize: 12, color: "#94a3b8" }}>
                      {isAllSelected ? "Audits need a date field (createdAt or startDate) for trends" : `No audits found for ${selectedFrameworks.join(" + ")}`}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-8 py-5 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500 font-medium">© {new Date().getFullYear()} CalVant. All rights reserved.</p>
        </div>
      </footer>

      {/* MODALS */}
      {modal === "plan"    && <PlanAuditModal    onClose={() => setModal(null)} onSaved={loadData} auditors={auditors} />}
      {modal === "manage"  && <ManageAuditsModal  onClose={() => setModal(null)} onSaved={loadData} auditors={auditors} />}
      {modal === "reports" && <AuditReportsModal  onClose={() => setModal(null)} />}
      {modal === "conduct" && <ConductAuditModal  onClose={() => setModal(null)} router={router} />}
      {modal === "findings"&& <ReviewFindingsModal onClose={() => setModal(null)} auditors={auditors} />}
    </div>
  );
}

export default AuditDashboard;