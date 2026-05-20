

"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Zap,
  CheckCircle2,
  PauseCircle,
  AlertOctagon,
  Search,
  ClipboardCheck,
} from "lucide-react";
import taskService from "../services/taskService";

// ─── Constants ────────────────────────────────────────────────
const STATUS_CONFIG = {
  "To-Do":       { bg: "#f1f3f5", color: "#495057", dot: "#868e96" },
  "In Progress": { bg: "#e7f5ff", color: "#1971c2", dot: "#339af0" },
  "Done":        { bg: "#ebfbee", color: "#2f9e44", dot: "#40c057" },
  "On Hold":     { bg: "#fff5f5", color: "#c92a2a", dot: "#fa5252" },
};

const PRIORITY_CONFIG = {
  Low:      { color: "#2f9e44", bg: "#ebfbee", icon: "▼" },
  Medium:   { color: "#f59f00", bg: "#fff9db", icon: "■" },
  High:     { color: "#e8590c", bg: "#fff4e6", icon: "▲" },
  Critical: { color: "#c92a2a", bg: "#fff5f5", icon: "⚑" },
};

const COLUMNS = [
  { key: "id",          label: "Task ID",    width: 110 },
  { key: "description", label: "Description", width: 320 },
  { key: "assignee",    label: "Assignee",   width: 150 },
  { key: "priority",    label: "Priority",   width: 110 },
  { key: "startDate",   label: "Start Date", width: 110 },
  { key: "endDate",     label: "End Date",   width: 110 },
  { key: "status",      label: "Status",     width: 150 },
];
const TOTAL_WIDTH = COLUMNS.reduce((a, c) => a + c.width, 0);

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  const s = d.split("T")[0].split("-");
  return `${s[2]}-${s[1]}-${s[0]}`;
}
function initials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
const AV_COLORS = [
  "#7950f2",
  "#1971c2",
  "#0ca678",
  "#e8590c",
  "#c2255c",
  "#f59f00",
  "#364fc7",
];
function avColor(name) {
  return AV_COLORS[(name || "").charCodeAt(0) % AV_COLORS.length];
}

function Avatar({ name, size = 24 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avColor(name),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

function StatusPill({ status }) {
  const c =
    STATUS_CONFIG[status] || {
      bg: "#f1f3f5",
      color: "#495057",
      dot: "#868e96",
    };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        background: c.bg,
        color: c.color,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
        }}
      />
      {status || "—"}
    </span>
  );
}

function PriorityPill({ priority }) {
  const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG["Medium"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 4,
        background: c.bg,
        color: c.color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <span style={{ fontSize: 9 }}>{c.icon}</span>
      {priority || "—"}
    </span>
  );
}

function resolveSubStartDate(sub) {
  if (sub.startDate) return sub.startDate;
  if (sub.createdAt) return sub.createdAt;
  return null;
}
function resolveSubEndDate(sub) {
  return sub.endDate || sub.dueDate || null;
}

// ─── Stat Card (Lucide, same theme as RA MyTasks) ─────────────
const STAT_STYLES = {
  Total:       { gradient: "from-blue-400 to-blue-500",      Icon: ClipboardList },
  "In Progress": { gradient: "from-sky-400 to-sky-500",      Icon: Zap },
  Done:        { gradient: "from-emerald-400 to-emerald-500", Icon: CheckCircle2 },
  "On Hold":   { gradient: "from-amber-400 to-amber-500",    Icon: PauseCircle },
  Critical:    { gradient: "from-red-400 to-red-500",        Icon: AlertOctagon },
};

function StatCard({ value, label, index }) {
  const s = STAT_STYLES[label] || STAT_STYLES["Total"];
  return (
    <div
      className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg p-4 lg:p-3.5 shadow-sm hover:shadow-md transition-all duration-300 cursor-default flex items-center gap-2 hover:bg-white"
      style={{ animation: `cardIn 0.4s ease ${index * 0.05}s both` }}
    >
      <div
        className={`w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md flex-shrink-0`}
      >
        <s.Icon size={16} className="text-white drop-shadow-sm" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-lg lg:text-xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
          {value}
        </span>
        <span className="text-xs lg:text-sm font-medium text-slate-600 uppercase tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
const MyTasks = () => {
  const router = useRouter();
  const rawUser = sessionStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const currentUserName = user?.name || user?.username || "";

  const [tasks, setTasks] = useState([]);
  const [subtasksMap, setSubtasksMap] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 15;
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user || hasFetched.current) {
      setLoading(false);
      return;
    }
    hasFetched.current = true;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const all = await taskService.getAllTasks();
        const userOrgId = user?.organization?._id || user?.organization;
        const mine = all.filter(
          (t) =>
            String(t.organization) === String(userOrgId) &&
            t.employee === currentUserName
        );
        setTasks(mine);

        const subMap = {};
        await Promise.all(
          mine.map(async (t) => {
            try {
              const subs = await taskService.getSubTasks(t.taskId);
              if (subs && subs.length > 0) subMap[t.taskId] = subs;
            } catch (_) {}
          })
        );
        setSubtasksMap(subMap);
      } catch (e) {
        console.error("Failed to fetch tasks:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []); // logic unchanged

  const toggleExpand = (taskId) =>
    setExpanded((p) => ({ ...p, [taskId]: !p[taskId] }));

  const filteredTasks = useMemo(() => {
    let r = tasks;
    if (statusFilter !== "all") r = r.filter((t) => t.status === statusFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      r = r.filter(
        (t) =>
          (t.description || "").toLowerCase().includes(q) ||
          (t.taskId || "").toLowerCase().includes(q)
      );
    }
    return [...r].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [tasks, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE
  );

  const statusCount = useMemo(() => {
    const c = {};
    tasks.forEach((t) => {
      c[t.status] = (c[t.status] || 0) + 1;
    });
    return c;
  }, [tasks]);

  const allStatuses = Object.keys(STATUS_CONFIG).filter((s) => statusCount[s]);

  if (!user) {
    return (
      <div className="p-10 text-center text-slate-500">
        Please log in to view your tasks.
      </div>
    );
  }

  const cell = (extra = {}) => ({
    padding: "8px 14px",
    borderRight: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    ...extra,
  });
  const cellL = (extra = {}) => ({
    padding: "11px 14px",
    borderRight: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    ...extra,
  });
  const cellEnd = () => ({
    padding: "8px 14px",
    display: "flex",
    alignItems: "center",
  });

  // stats data (logic same, just feeding StatCard)
  const statsData = [
    { label: "Total",       value: tasks.length },
    { label: "In Progress", value: statusCount["In Progress"] || 0 },
    { label: "Done",        value: statusCount["Done"] || 0 },
    { label: "On Hold",     value: statusCount["On Hold"] || 0 },
    {
      label: "Critical",
      value: tasks.filter((t) => t.priority === "Critical").length,
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-8 pb-24 lg:pb-28 overflow-hidden">
          {/* Back button – themed */}
          <div className="mb-3">
            <button
              onClick={() => router.push("/task-management")}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              ← Back to Task Management
            </button>
          </div>

          {/* Header card – same as RA MyTasks */}
          <header className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-4 lg:mb-4 p-4 lg:p-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ClipboardCheck className="w-6 h-6 lg:w-7 lg:h-7 text-white drop-shadow-sm" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-semibold text-slate-800 leading-tight">
                    My Tasks
                  </h1>
                  <p className="text-sm lg:text-base text-slate-600 mt-1">
                    Task Management •{" "}
                    <span className="font-bold text-lg text-slate-900">
                      {filteredTasks.length}
                    </span>{" "}
                    task{filteredTasks.length !== 1 ? "s" : ""} assigned to you
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Stat cards – Lucide theme */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
            {statsData.map((s, i) => (
              <StatCard key={s.label} {...s} index={i} />
            ))}
          </section>

          {/* Filter bar – themed */}
          <div
            className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl shadow-sm mb-4 px-4 py-3 flex flex-wrap gap-2 items-center"
            style={{ animation: "fadeUp 0.4s ease 0.2s both" }}
          >
            <div
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 20,
                cursor: "pointer",
                background: statusFilter === "all" ? "#f3f0ff" : "#f8fafc",
                border: `1.5px solid ${
                  statusFilter === "all" ? "#7950f2" : "transparent"
                }`,
                fontSize: 12,
                fontWeight: 700,
                color: statusFilter === "all" ? "#7950f2" : "#64748b",
                boxShadow:
                  statusFilter === "all" ? "0 0 0 3px #7950f225" : "none",
                transition: "all 0.15s",
              }}
            >
              {tasks.length} All
            </div>

            {allStatuses.map((st) => {
              const c = STATUS_CONFIG[st];
              const active = statusFilter === st;
              return (
                <div
                  key={st}
                  onClick={() => {
                    setStatusFilter(active ? "all" : st);
                    setCurrentPage(1);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 20,
                    cursor: "pointer",
                    background: active ? c.bg : "#f8fafc",
                    border: `1.5px solid ${
                      active ? c.dot : "transparent"
                    }`,
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? c.color : "#64748b",
                    boxShadow: active ? `0 0 0 3px ${c.dot}25` : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: active ? c.dot : "#94a3b8",
                    }}
                  />
                  {statusCount[st]} {st}
                </div>
              );
            })}

            <div
              style={{
                width: 1,
                height: 26,
                background: "#e2e8f0",
                flexShrink: 0,
              }}
            />

            <div
              style={{
                position: "relative",
                flex: "1 1 200px",
                maxWidth: 280,
              }}
            >
              <Search
                size={13}
                color="#94a3b8"
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search tasks..."
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 30px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.background = "#f8fafc";
                }}
              />
            </div>

            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1.5px solid #fecaca",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-20">
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "3px solid #e2e8f0",
                  borderTop: "3px solid #3b82f6",
                  borderRadius: "50%",
                  margin: "0 auto 14px",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p className="text-slate-500 text-sm font-medium">
                Loading your tasks...
              </p>
            </div>
          ) : (
            <div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl shadow-md overflow-x-auto mb-5"
              style={{ animation: "fadeUp 0.4s ease 0.25s both" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: COLUMNS.map(
                    (c) => c.width + "px"
                  ).join(" "),
                  minWidth: TOTAL_WIDTH,
                  background: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                }}
              >
                {COLUMNS.map((col, i) => (
                  <div
                    key={col.key}
                    style={{
                      padding: "9px 14px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      borderRight:
                        i < COLUMNS.length - 1
                          ? "1px solid #e2e8f0"
                          : "none",
                      userSelect: "none",
                    }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {paginatedTasks.length === 0 && (
                <div className="text-center py-16 px-5 text-slate-400">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-md">
                      <ClipboardList
                        size={22}
                        className="text-white"
                        strokeWidth={1.8}
                      />
                    </div>
                  </div>
                  <p className="text-base font-bold text-slate-600 mb-1">
                    No tasks assigned to you
                  </p>
                  <p className="text-sm text-slate-400">
                    Tasks assigned to you will appear here
                  </p>
                </div>
              )}

              {paginatedTasks.map((task, idx) => {
                const subs = subtasksMap[task.taskId] || [];
                const hasSubtasks = subs.length > 0;
                const isExpanded = !!expanded[task.taskId];
                const isOverdue =
                  task.endDate &&
                  new Date(task.endDate) < new Date() &&
                  task.status !== "Done";
                const notLastRow = idx < paginatedTasks.length - 1;

                return (
                  <React.Fragment key={task.taskId}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: COLUMNS.map(
                          (c) => c.width + "px"
                        ).join(" "),
                        minWidth: TOTAL_WIDTH,
                        borderBottom:
                          notLastRow || isExpanded
                            ? "1px solid #f1f5f9"
                            : "none",
                        background: "transparent",
                        borderLeft: "3px solid transparent",
                        transition: "all 0.1s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.9)";
                        e.currentTarget.style.borderLeft =
                          "3px solid #cbd5e1";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderLeft =
                          "3px solid transparent";
                      }}
                    >
                      <div style={cellL({ gap: 6 })}>
                        {hasSubtasks && (
                          <span
                            onClick={() => toggleExpand(task.taskId)}
                            style={{
                              cursor: "pointer",
                              fontSize: 10,
                              color: "#94a3b8",
                              userSelect: "none",
                              display: "inline-block",
                              transform: isExpanded
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.15s",
                            }}
                          >
                            ▶
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#7c3aed",
                            background: "#f3f0ff",
                            padding: "2px 6px",
                            borderRadius: 4,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.taskId}
                        </span>
                        {hasSubtasks && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#94a3b8",
                              fontWeight: 600,
                            }}
                          >
                            {subs.length}
                          </span>
                        )}
                      </div>

                      <div style={cellL()}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.description || "—"}
                        </span>
                      </div>

                      <div style={cell({ gap: 6 })}>
                        <Avatar name={task.employee} size={22} />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 100,
                          }}
                        >
                          {task.employee || "—"}
                        </span>
                      </div>

                      <div style={cell()}>
                        <PriorityPill priority={task.priority} />
                      </div>

                      <div style={cell()}>
                        <span
                          style={{ fontSize: 12, color: "#64748b" }}
                        >
                          {formatDate(task.startDate)}
                        </span>
                      </div>

                      <div style={cell()}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: isOverdue ? "#dc2626" : "#475569",
                          }}
                        >
                          {isOverdue && (
                            <span
                              title="Overdue"
                              style={{ marginRight: 4 }}
                            >
                              ⚠
                            </span>
                          )}
                          {formatDate(task.endDate)}
                        </span>
                      </div>

                      <div style={cellEnd()}>
                        <StatusPill status={task.status} />
                      </div>
                    </div>

                    {isExpanded &&
                      subs.map((sub, si) => {
                        const subStartDate = resolveSubStartDate(sub);
                        const subEndDate = resolveSubEndDate(sub);
                        const subOverdue =
                          subEndDate &&
                          new Date(subEndDate) < new Date() &&
                          sub.status !== "Done";
                        const subIsLast =
                          si === subs.length - 1 && !notLastRow;

                        return (
                          <div
                            key={sub.subTaskId}
                            style={{
                              display: "grid",
                              gridTemplateColumns: COLUMNS.map(
                                (c) => c.width + "px"
                              ).join(" "),
                              minWidth: TOTAL_WIDTH,
                              borderBottom: subIsLast
                                ? "none"
                                : "1px solid #f1f5f9",
                              background: "rgba(250,251,255,0.8)",
                              borderLeft:
                                "3px solid rgba(124,58,237,0.12)",
                              transition: "background 0.1s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(245,243,255,0.95)")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(250,251,255,0.8)")
                            }
                          >
                            <div
                              style={{
                                padding: "9px 14px 9px 32px",
                                borderRight: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#7c3aed",
                                  background: "#f3f0ff",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {sub.subTaskId}
                              </span>
                            </div>

                            <div
                              style={{
                                padding: "9px 14px 9px 18px",
                                borderRight: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span
                                style={{ color: "#94a3b8", fontSize: 11 }}
                              >
                                └
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#475569",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {sub.description || "—"}
                              </span>
                            </div>

                            <div style={cell({ gap: 6 })}>
                              {sub.assignee ? (
                                <>
                                  <Avatar
                                    name={sub.assignee}
                                    size={20}
                                  />
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "#475569",
                                      maxWidth: 90,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {sub.assignee}
                                  </span>
                                </>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#94a3b8",
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </div>

                            <div style={cell()}>
                              {sub.priority ? (
                                <PriorityPill priority={sub.priority} />
                              ) : (
                                <span
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: 12,
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </div>

                            <div style={cell()}>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#64748b",
                                }}
                              >
                                {formatDate(subStartDate)}
                              </span>
                            </div>

                            <div style={cell()}>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: subOverdue
                                    ? "#dc2626"
                                    : "#64748b",
                                }}
                              >
                                {subOverdue && (
                                  <span style={{ marginRight: 3 }}>
                                    ⚠
                                  </span>
                                )}
                                {formatDate(subEndDate)}
                              </span>
                            </div>

                            <div style={cellEnd()}>
                              <StatusPill status={sub.status} />
                            </div>
                          </div>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 flex-wrap">
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage === 1}
                style={{
                  padding: "6px 12px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#fff",
                  cursor:
                    currentPage === 1 ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  color:
                    currentPage === 1 ? "#94a3b8" : "#475569",
                }}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      padding: "6px 12px",
                      border: "1.5px solid",
                      borderRadius: 8,
                      borderColor:
                        currentPage === p
                          ? "#3b82f6"
                          : "#e2e8f0",
                      background:
                        currentPage === p ? "#3b82f6" : "#fff",
                      color:
                        currentPage === p ? "#fff" : "#475569",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={currentPage === totalPages}
                style={{
                  padding: "6px 12px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#fff",
                  cursor:
                    currentPage === totalPages
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 700,
                  color:
                    currentPage === totalPages
                      ? "#94a3b8"
                      : "#475569",
                }}
              >
                ›
              </button>
            </div>
          )}
        </main>

        <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-6 py-4 lg:px-8 lg:py-5 sticky bottom-0 z-50">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm lg:text-base text-slate-600 font-medium">
              © {new Date().getFullYear()} CalVant. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f8fafc; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </>
  );
};

export default MyTasks;
