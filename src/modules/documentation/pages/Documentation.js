"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import documentationService from "../services/documentationService";
import controlService from "../services/controlService";
import { useFramework, ALL_FRAMEWORKS } from "../../../context/FrameworkContex";
import Joyride from "react-joyride";
import CompactFrameworkFilter from "./CompactFrameworkFilter";
import { captureActivity, ACTIONS } from "../../../services/activities";

import {
  FileText,
  CheckCircle,
  AlertCircle,
  BarChart3,
  HelpCircle,
  FolderOpen,
  Archive,
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
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Documentation dashboard
// ---------------------------------------------------------------------------

const Documentation = () => {
  const router = useRouter();
  const chartsContainerRef = useRef(null);

  const [user] = useState(() => JSON.parse(sessionStorage.getItem("user")));
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
  const isRoot = user?.role?.some((r) => {
    const s = (typeof r === "string" ? r : r?.name || r?.roleName || "")
      .toLowerCase()
      .replace(/[\s_-]/g, "");
    return ["root", "ciso", "aio", "dpo"].some((role) => s.includes(role));
  });
  const deptLabel = isRoot
    ? "All"
    : (user?.departments || []).map((d) => d.name).join(", ") || "Your";

  const [documentStats, setDocumentStats] = useState({
    total: 0,
    uploaded: 0,
    pending: 0,
    archived: 0,
  });
  const [allDocuments, setAllDocuments] = useState([]);
  const [run, setRun] = useState(false);

  const {
    selectedFrameworks,
    toggleFramework,
    isAllSelected,
    availableFrameworks,
  } = useFramework();

  const steps = [
    {
      target: "#dashboard-header",
      content: `Welcome to your ${deptLabel} documentation dashboard.`,
    },
    {
      target: "#stats-grid",
      content: "Document compliance metrics at a glance.",
    },
    {
      target: "#charts-container",
      content: "Visual document status and detailed upload trends.",
    },
    {
      target: "#action-cards",
      content: "Quick access to document management tools.",
    },
  ];

  useEffect(() => {
    captureActivity({
      action: ACTIONS.PAGE_LOAD,
      item: [{ detail: "Documentation · Viewed dashboard" }],
      url: window.pathname,
    });
  }, []);

  // ── ResizeObserver for recharts ───────────────────────────────────────────
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 150);
    });
    if (chartsContainerRef.current)
      resizeObserver.observe(chartsContainerRef.current);
    return () => {
      if (chartsContainerRef.current)
        resizeObserver.unobserve(chartsContainerRef.current);
      clearTimeout(window.resizeTimeout);
    };
  }, []);

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  // ── Count total required docs from backend controls ───────────────────────
  const getTotalFromBackendControls = (controls, currentUser, userIsAdmin) => {
    const userDeptNames = (currentUser?.departments || []).map((d) =>
      (d.name || "").toLowerCase(),
    );
    const docsSet = new Set();
    controls.forEach((ctrl) => {
      if (!ctrl.documents?.length) return;
      const ctrlDepts = (ctrl.departmentIds || []).map((d) =>
        (d || "").toLowerCase(),
      );
      const docDepts = ctrl.documents
        .map((d) => (d.dept || "").toLowerCase())
        .filter(Boolean);
      const allDepts = [...ctrlDepts, ...docDepts];
      const hasAccess =
        userIsAdmin ||
        allDepts.length === 0 ||
        allDepts.some((d) => userDeptNames.includes(d));
      if (!hasAccess) return;
      ctrl.documents.forEach(({ doc }) => {
        if (doc) docsSet.add(doc);
      });
    });
    return docsSet.size;
  };

  // ── Load stats ─────────────────────────────────────────────────────────────
  const loadDocumentStats = useCallback(async () => {
    if (!user) return;
    try {
      const [docs, soaList, ...controlResults] = await Promise.all([
        documentationService.getDocuments().catch(() => []),
        documentationService.getSoAEntries().catch(() => []),
        ...availableFrameworks.map((fw) =>
          controlService.getControlsByFramework(fw.code).catch(() => []),
        ),
      ]);

      const normalize = (fw) => {
        if (!fw) return "";
        return fw.replace(/[\s_-]/g, "").toUpperCase();
      };

      const selectedFW = isAllSelected
        ? availableFrameworks.map((fw) => normalize(fw.code))
        : selectedFrameworks.map(normalize);

      const soaFrameworkMap = {};
      (soaList || []).forEach((soa) => {
        if (soa.id) soaFrameworkMap[String(soa.id)] = soa.framework;
      });

      const orgDocs = (docs || [])
        .filter((d) => d.organization === user?.organization)
        .map((doc) => ({
          ...doc,
          framework:
            soaFrameworkMap[String(doc.soaId)] || doc.framework || null,
        }));

      const frameworkDocs = orgDocs.filter((doc) =>
        selectedFW.includes(normalize(doc.framework)),
      );

      setAllDocuments(frameworkDocs.filter((d) => !d.deleted));

      const frameworkControls = availableFrameworks
        .flatMap((fw, i) =>
          (controlResults[i] || []).map((c) => ({
            ...c,
            _fw: normalize(fw.code),
          })),
        )
        .filter((ctrl) => selectedFW.includes(ctrl._fw));

      const totalRequired = getTotalFromBackendControls(
        frameworkControls,
        user,
        isRoot,
      );

      const uploaded = frameworkDocs.filter(
        (doc) => !!doc.url && !doc.deleted,
      ).length;

      // Count archived (soft-deleted) docs
      const archived = frameworkDocs.filter(
        (doc) => doc.deleted === true,
      ).length;

      setDocumentStats({
        total: totalRequired,
        uploaded,
        pending: Math.max(0, totalRequired - uploaded),
        archived,
      });
    } catch (error) {
      console.error("Error loading document stats:", error);
      setDocumentStats({ total: 0, uploaded: 0, pending: 0, archived: 0 });
    }
  }, [user, selectedFrameworks, isAllSelected, isRoot, availableFrameworks]);

  useEffect(() => {
    captureActivity({
      action: ACTIONS.PAGE_LOAD,
      item: "Documentation Dashboard",
      url: "/documentation",
    });
    loadDocumentStats();
  }, [loadDocumentStats]);

  if (!user) return null;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const pieData = [
    {
      name: "Uploaded",
      value: documentStats.uploaded,
      color: "#10b981",
      desc: `${documentStats.uploaded} documents`,
    },
    {
      name: "Pending",
      value: documentStats.pending,
      color: "#f59e0b",
      desc: `${documentStats.pending} documents`,
    },
  ].filter((d) => d.value > 0);

  const getMonthFromDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short" });
  };

  const monthlyDetailedData = allDocuments.reduce((acc, doc) => {
    const month = getMonthFromDate(doc.createdAt || doc.created_at);
    if (month) {
      if (!acc[month]) acc[month] = { count: 0, dates: [], docs: [] };
      acc[month].count++;
      acc[month].dates.push(
        new Date(doc.createdAt || doc.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      );
      acc[month].docs.push(doc.name || doc.title || "Document");
    }
    return acc;
  }, {});

  const barData = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].map((m) => ({
    name: m,
    value: monthlyDetailedData[m]?.count || 0,
    details: monthlyDetailedData[m],
  }));

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg min-w-[200px]">
          <div className="font-semibold text-slate-800 text-sm mb-1">
            {data.name}
          </div>
          <div className="text-xl font-bold text-slate-900 mb-1">
            {data.value}
          </div>
          <div className="text-xs text-slate-600">{data.desc}</div>
          <div className="text-xs text-slate-500 mt-1">
            {((data.value / (documentStats.total || 1)) * 100).toFixed(1)}% of
            total
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      const details = data.details;
      if (!details || details.count === 0) {
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
            <div className="font-semibold text-slate-800 text-sm mb-1">
              {data.name}
            </div>
            <div className="text-xl font-bold text-slate-900 mb-1">
              {data.value}
            </div>
            <div className="text-xs text-slate-500">No uploads</div>
          </div>
        );
      }
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg max-w-sm max-h-60 overflow-y-auto">
          <div className="font-semibold text-slate-800 text-sm mb-3">
            {data.name}{" "}
            <span className="text-slate-600">({data.value} docs)</span>
          </div>
          {details.dates.slice(0, 5).map((date, index) => (
            <div
              key={index}
              className="flex items-center gap-2 py-1 border-b border-slate-100 last:border-b-0 text-xs"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
              <div>
                <div className="font-medium text-slate-900">
                  {details.docs[index] || "Document"}
                </div>
                <div className="text-slate-500 text-[10px]">{date}</div>
              </div>
            </div>
          ))}
          {details.dates.length > 5 && (
            <div className="text-xs text-slate-500 mt-2">
              +{details.dates.length - 5} more uploads
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const actionCards = [
    {
      id: "mld",
      icon: FolderOpen,
      title: "Master List of Documents",
      subtitle: "MLD",
      path: "/documentation/mld",
      color: "from-emerald-400 to-emerald-500",
      primary: true,
    },
    {
      id: "upload",
      icon: FolderOpen,
      title: "Upload",
      subtitle: "Documents",
      path: "/documentation/mld",
      color: "from-blue-500 to-blue-600",
      primary: true,
    },
    {
      id: "view",
      icon: FolderOpen,
      title: "View",
      subtitle: "Documents",
      path: "/documentation/mld",
      color: "from-orange-400 to-red-500",
      primary: true,
    },
    {
      id: "archived",
      icon: Archive,
      title: "Archived",
      subtitle: `${documentStats.archived} document${documentStats.archived !== 1 ? "s" : ""}`,
      path: "/documentation/archived",
      color: "from-slate-400 to-slate-600",
      primary: true,
      badge: documentStats.archived > 0 ? documentStats.archived : null,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-8 pb-24 lg:pb-28 overflow-hidden">
        <Joyride
          steps={steps}
          run={run}
          continuous
          showSkipButton
          scrollToFirstStep
          styles={{ options: { primaryColor: "#3b82f6", width: 300 } }}
        />

        {/* Header */}
        <motion.header
          id="dashboard-header"
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-6 p-6"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800 leading-tight">
                  Policies Dashboard
                </h1>
                <p className="text-base text-slate-600 mt-1">
                  {deptLabel} •{" "}
                  <span className="font-bold text-2xl text-slate-900">
                    {documentStats.total}
                  </span>{" "}
                  total policies
                </p>
              </div>
            </div>
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
              onClick={() => {
                setRun(false);
                setTimeout(() => setRun(true), 100);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <HelpCircle size={18} />
              <span>Tutorial</span>
            </motion.button>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 h-full">
          {/* LEFT */}
          <div className="space-y-10">
            {/* Stats Grid */}
            <motion.section
              id="stats-grid"
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {[
                {
                  Icon: FileText,
                  value: documentStats.total,
                  label: "Total",
                  color: "from-blue-400 to-blue-500",
                  id: "total-docs",
                  path: "/documentation/mld",
                },
                {
                  Icon: CheckCircle,
                  value: documentStats.uploaded,
                  label: "Uploaded",
                  color: "from-emerald-400 to-emerald-500",
                  id: "uploaded-docs",
                  path: "/documentation/mld",
                },
                {
                  Icon: AlertCircle,
                  value: documentStats.pending,
                  label: "Pending",
                  color: "from-orange-400 to-orange-500",
                  id: "pending-docs",
                  path: "/documentation/mld",
                },
                {
                  Icon: Archive,
                  value: documentStats.archived,
                  label: "Archived",
                  color: "from-slate-400 to-slate-600",
                  id: "archived-docs",
                  path: "/documentation/archived",
                },
              ].map(
                ({ Icon: IconComponent, value, label, color, id, path }, i) => (
                  <motion.div className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg px-3 py-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-2 h-20 hover:bg-white">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}
                    >
                      <IconComponent
                        size={18}
                        className="text-white drop-shadow-sm"
                      />
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <span className="text-2xl font-semibold text-slate-800 block leading-tight">
                        {value}
                      </span>
                      <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                        {label}
                      </span>
                    </div>
                  </motion.div>
                ),
              )}
            </motion.section>

            {/* Action Cards */}
            <motion.section
              id="action-cards"
              className="space-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-slate-800 mb-6">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <AnimatePresence>
                  {actionCards.map(
                    (
                      {
                        id,
                        icon: Icon,
                        title,
                        subtitle,
                        path,
                        color,
                        primary,
                        badge,
                      },
                      index,
                    ) => (
                      <motion.div
                        key={`${id}-${index}`}
                        className={`group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-6 h-full flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer relative ${primary ? "ring-2 ring-emerald-200/50 bg-gradient-to-br " + color : ""}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.4 + index * 0.06,
                        }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => router.push(path)}
                      >
                        {/* Badge for archived count */}
                        {badge != null && badge > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              background: "#ef4444",
                              color: "white",
                              borderRadius: "50%",
                              width: "22px",
                              height: "22px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {badge}
                          </span>
                        )}
                        <div
                          className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-md flex-shrink-0 ${primary ? "bg-white/20 backdrop-blur-sm" : `bg-gradient-to-br ${color}`}`}
                        >
                          <Icon
                            size={24}
                            className="text-white drop-shadow-sm"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h4 className="text-lg font-semibold text-center text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors duration-200">
                            {title}
                          </h4>
                          <p className="text-sm font-bold text-center text-slate-600">
                            {subtitle}
                          </p>
                        </div>
                      </motion.div>
                    ),
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

          {/* RIGHT — Charts */}
          <div
            ref={chartsContainerRef}
            id="charts-container"
            className="space-y-3"
          >
            {/* Pie Chart */}
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400 h-80 flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-6">
                Document Status
              </h3>
              <div className="flex-1 flex items-center justify-center min-h-0">
                {documentStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={75}
                        paddingAngle={2}
                        stroke="white"
                        strokeWidth={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <text
                        x="50%"
                        y="42%"
                        textAnchor="middle"
                        dominantBaseline="left"
                        className="fill-slate-700 text-sm font-semibold"
                      >
                        Total
                      </text>
                      <text
                        x="50%"
                        y="52%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-900 text-2xl font-bold"
                      >
                        {documentStats.total}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <FileText
                      size={48}
                      className="text-slate-400 mb-4"
                      strokeWidth={1.5}
                    />
                    <p className="text-xl font-semibold text-slate-500 mb-2">
                      No Policies
                    </p>
                    <p className="text-base text-slate-500 max-w-xs">
                      Start by uploading documents
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Bar Chart */}
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-72"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  Upload Trends
                </h3>
                <p className="text-xs text-slate-500">
                  Documents by month{" "}
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                    {barData.reduce((s, d) => s + d.value, 0)} total
                  </span>
                </p>
              </div>
              {barData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={barData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#f8fafc"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={24}>
                      {barData.map((entry, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={
                            [
                              "#3b82f6",
                              "#60a5fa",
                              "#93c5fd",
                              "#bfdbfe",
                              "#dbeafe",
                              "#eff6ff",
                              "#e0f2fe",
                              "#bae6fd",
                              "#7dd3fc",
                              "#38bdf8",
                              "#0ea5e9",
                              "#0284c7",
                            ][index % 12]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <BarChart3
                    size={40}
                    className="text-slate-300 mb-3"
                    strokeWidth={1.5}
                  />
                  <p className="text-base font-semibold text-slate-400 mb-1">
                    No Upload Data
                  </p>
                  <p className="text-sm text-slate-400">
                    Documents need to be uploaded to display trends
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-8 py-5 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-base text-slate-600 font-medium">
            © {new Date().getFullYear()} CalVant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Documentation;
