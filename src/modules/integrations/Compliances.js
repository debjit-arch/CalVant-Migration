import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Joyride from "react-joyride";
import axios from "axios";
import {
  HelpCircle,
  Eye,
  BarChart3,
  Lock,
  AlertTriangle,
  Circle,
  CheckCircle2,
  Clock,
  Users,
  Brain,
  ShieldCheck, // ✅ Added for KSA PDPL
} from "lucide-react";
import { PieChart, Pie, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { motion } from "framer-motion";
import { NetworkLockedSharp } from "@material-ui/icons";
import { useFramework } from "../../context/FrameworkContex";
import {
  getFrameworkCompliance,
  getTenantId,
} from "../integrations/complianceData";
import {
  captureActivity,
  ACTIONS,
  logSelect,
  logClick,
} from "../../services/activities";



// ── Per-framework mini card ───────────────────────────────────────────────────
const CompactFrameworkChart = ({ frameworkObj, complianceData, isLoading }) => {
  const cfg = frameworkObj || { label: "Unknown", color: "#64748b", description: "Unknown Framework" };
  const Icon = cfg.riskTypes?.includes("Privacy") ? Lock : (cfg.riskTypes?.includes("Artificial Intelligence") ? Brain : AlertTriangle);

  const pieData = [
    {
      name: "Compliant",
      value: complianceData.compliant ?? 0,
      color: "#10b981",
    },
    {
      name: "Non-compliant",
      value: complianceData.nonCompliant ?? 0,
      color: "#ef4444",
    },
  ].filter((d) => d.value > 0);

  const total = complianceData.totalControls || 0;
  const score =
    total > 0 ? Math.round(((complianceData.compliant ?? 0) / total) * 100) : 0;

  return (
    <motion.div
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between"
      style={{ minHeight: 260 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="p-2 rounded-md"
          style={{ background: cfg.color + "20", color: cfg.color }}
        >
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-800">{cfg.label}</h4>
          <p className="text-xs text-slate-500">{cfg.description}</p>
        </div>
        <span className="text-lg font-bold" style={{ color: cfg.color }}>
          {isLoading ? "…" : `${score}%`}
        </span>
      </div>

      {/* Pie chart */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1 text-slate-300 text-xs py-6">
          Loading…
        </div>
      ) : total === 0 ? (
        <div className="flex items-center justify-center flex-1 text-slate-400 text-xs py-6">
          No data — sync first
        </div>
      ) : (
        <div style={{ height: 90 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={20}
                outerRadius={40}
                paddingAngle={2}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} requirements`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer breakdown */}
      <div className="border-t pt-2 space-y-1">
        <div className="flex justify-between text-xs text-slate-600">
          <span>Total requirements</span>
          <span className="font-semibold">{isLoading ? "…" : total}</span>
        </div>
        {!isLoading && total > 0 && (
          <>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Compliant
              </span>
              <span className="font-semibold text-emerald-700">
                {complianceData.compliant ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1 text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Non-compliant
              </span>
              <span className="font-semibold text-red-700">
                {complianceData.nonCompliant ?? 0}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const Compliances = () => {
  const { availableFrameworks, selectedFrameworks, isAllSelected } = useFramework();
  const router = useRouter();
  const [user] = useState(() => JSON.parse(sessionStorage.getItem("user")));
  const [run, setRun] = useState(false);
  const [tenantReady, setTenantReady] = useState(false);


  const emptyStats = {
    totalControls: 0,
    compliant: 0,
    nonCompliant: 0,
  };

  const initialStats = useMemo(() => {
    return (availableFrameworks || []).reduce((acc, fw) => {
      acc[fw.code] = emptyStats;
      return acc;
    }, {});
  }, [availableFrameworks]);

  const initialLoading = useMemo(() => {
    return (availableFrameworks || []).reduce((acc, fw) => {
      acc[fw.code] = true;
      return acc;
    }, {});
  }, [availableFrameworks]);

  const [frameworkData, setFrameworkData] = useState({});
  const [loadingFrameworks, setLoadingFrameworks] = useState({});

  useEffect(() => {
    if (availableFrameworks && availableFrameworks.length > 0) {
      setFrameworkData(prev => ({ ...initialStats, ...prev }));
      setLoadingFrameworks(prev => ({ ...initialLoading, ...prev }));
    }
  }, [availableFrameworks, initialStats, initialLoading]);
  const steps = [
    {
      target: "#dashboard-header",
      content: "Welcome to the Compliance Dashboard.",
    },
    { target: "#stats-row", content: "Key compliance statistics." },
    { target: "#framework-section", content: "Framework level compliance." },
  ];

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  // ── Step 1: Resolve tenant + warm localStorage cache ─────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
        const orgId = userData.organization?._id ?? userData.organization;
        if (!orgId) {
          setTenantReady(true);
          return;
        }

        const tenantRes = await axios.get(
          `https://api.calvant.com/user-service/api/organizations/${orgId}/tenant`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          },
        );
        const tenantId = tenantRes.data;
        sessionStorage.setItem("tenantId", tenantId);

        const cached = localStorage.getItem("risk_assessment_cache_v1");
        if (!cached) {
          const requirementsRes = await axios.get(
            `https://api.calvant.com/compliance-brain/compliance/requirements?tenantId=${tenantId}`,
            {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
            },
          );
          const results = requirementsRes.data || [];

          const iso27001 = results.filter(
            (i) =>
              !i.controlId?.startsWith("A.") &&
              !i.controlId?.match(/^[A-Z]{1,2}\.\d/),
          );
          const iso27701 = results.filter((i) => i.controlId?.startsWith("A."));
          const iso42001 = results.filter((i) => i.framework === "ISO42001");

          localStorage.setItem(
            "risk_assessment_cache_v1",
            JSON.stringify(iso27001),
          );
          localStorage.setItem(
            "risk_assessment_cache_27701_v1",
            JSON.stringify(iso27701),
          );
          localStorage.setItem(
            "risk_assessment_cache_soc2_v1",
            JSON.stringify(results),
          );
          localStorage.setItem(
            "risk_assessment_cache_iso42001_v1",
            JSON.stringify(iso42001),
          );
        }
      } catch (err) {
        console.error("Failed to init compliance page:", err);
      } finally {
        setTenantReady(true);
      }
    };

    init();
  }, []);

  // ── Step 2: Load each framework after cache is warmed ────────────────────
  const loadFramework = useCallback(async (fw) => {
    setLoadingFrameworks((p) => ({ ...p, [fw]: true }));
    try {
      const result = await getFrameworkCompliance(fw);
      setFrameworkData((p) => ({ ...p, [fw]: result }));
    } catch (err) {
      console.error(`Failed to load ${fw} compliance`, err);
      setFrameworkData((p) => ({ ...p, [fw]: emptyStats }));
    } finally {
      setLoadingFrameworks((p) => ({ ...p, [fw]: false }));
    }
  }, []);

  useEffect(() => {
    if (!tenantReady || !availableFrameworks || availableFrameworks.length === 0) return;
    availableFrameworks.forEach(fw => {
      loadFramework(fw.code);
    });
  }, [tenantReady, loadFramework, availableFrameworks]);

  // ── FILTERED DATA ─────────────────────────────────────────────────────────
  const filteredFrameworkData = useMemo(() => {
    if (isAllSelected) return frameworkData;

    const activeKeys = selectedFrameworks
      .map((fwId) => availableFrameworks?.find(f => f.id === fwId)?.code)
      .filter(Boolean);

    return Object.fromEntries(
      Object.entries(frameworkData).filter(([fwKey]) =>
        activeKeys.includes(fwKey),
      ),
    );
  }, [frameworkData, selectedFrameworks, isAllSelected, availableFrameworks]);

  // ── Aggregated overall stats from FILTERED data ───────────────────────────
  const overall = Object.values(filteredFrameworkData).reduce(
    (acc, f) => ({
      totalControls: acc.totalControls + (f.totalControls ?? 0),
      compliant: acc.compliant + (f.compliant ?? 0),
      nonCompliant: acc.nonCompliant + (f.nonCompliant ?? 0),
    }),
    {
      totalControls: 0,
      compliant: 0,
      nonCompliant: 0,
    },
  );

  const overallScore =
    overall.totalControls > 0
      ? Math.round((overall.compliant / overall.totalControls) * 100)
      : 0;

  const pieData = [
    {
      name: "Compliant",
      value: overall.compliant,
      color: "#10b981",
    },
    {
      name: "Non-compliant",
      value: overall.nonCompliant,
      color: "#ef4444",
    },
  ].filter((d) => d.value > 0);

  const statsCards = [
    {
      Icon: BarChart3,
      value: overall.totalControls,
      label: "Total Controls",
      color: "from-blue-400 to-blue-500",
    },
    {
      Icon: CheckCircle2,
      value: overall.compliant,
      label: "Compliant",
      color: "from-emerald-400 to-emerald-500",
    },
    {
      Icon: Circle,
      value: overall.nonCompliant,
      label: "Non-Compliant",
      color: "from-red-400 to-red-500",
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Joyride steps={steps} run={run} continuous showSkipButton />

      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <motion.header
          id="dashboard-header"
          className="bg-white border rounded-xl p-5 shadow-sm flex justify-between items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-slate-800 leading-tight">
                Compliance Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                {overall.totalControls} total requirements · {overallScore}%
                overall compliant
              </p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={() => {
              setRun(false);
              setTimeout(() => setRun(true), 200);
              logClick(
                "Compliance · Start Tutorial",
                {},
                window.pathname,
              );
            }}
          >
            <HelpCircle size={16} /> Tutorial
          </button>
        </motion.header>

        {/* Stat cards */}
        <section
          id="stats-row"
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {statsCards.map(({ Icon, value, label, color }, i) => (
            <motion.div
              key={label}
              className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}
              >
                <Icon size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-lg font-semibold text-slate-800 block">
                  {value}
                </span>
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  {label}
                </span>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Framework cards + overall pie */}
        <section
          id="framework-section"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {Object.keys(filteredFrameworkData).length === 0 ? (
            <motion.div
              className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center shadow-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-slate-400 mb-2">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-25" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">
                No frameworks selected
              </h3>
              <p className="text-sm text-slate-500">
                Select frameworks from the global filter to view compliance data
              </p>
            </motion.div>
          ) : (
            <>
              {Object.keys(filteredFrameworkData).map((fwCode) => {
                const fwObj = availableFrameworks?.find(f => f.code === fwCode);
                return (
                  <CompactFrameworkChart
                    key={fwCode}
                    frameworkObj={fwObj}
                    complianceData={filteredFrameworkData[fwCode]}
                    isLoading={loadingFrameworks[fwCode]}
                  />
                );
              })}

              {/* Overall pie chart */}
              <div
                className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between"
                style={{ minHeight: 260 }}
              >
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Overall Control Status
                </h3>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={35}
                        outerRadius={70}
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} requirements`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="border-t pt-3 mt-2 space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                      {overall.compliant} Compliant
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" />
                      {overall.nonCompliant} Non-compliant
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-800 pt-1">
                    <span>{overallScore}% Score</span>
                    <span>{overall.totalControls} Total</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        <div>
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2"
            onClick={() => router.push("/compliances/detailed")}
          >
            <Eye size={16} /> Detailed View
          </button>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-gray-200 mt-auto px-4 py-5">
        <div className="text-center text-gray-400 text-[13px]">
          © {new Date().getFullYear()} CalVant. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Compliances;
