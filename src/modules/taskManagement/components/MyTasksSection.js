// //C:\Users\ak192\Downloads\CalVant-Next-main\CalVant-Next-main\src\modules\taskManagement\components\MyTasksSection.js
// "use client";
// import React, { useEffect, useState, useMemo, useRef } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ClipboardList,
//   Zap,
//   CheckCircle2,
//   PauseCircle,
//   AlertOctagon,
//   Search,
//   ClipboardCheck,
// } from "lucide-react";
// import taskService from "../services/taskService";

// // ─── Constants ────────────────────────────────────────────────
// const STATUS_CONFIG = {
//   "To-Do":       { bg: "#f1f3f5", color: "#495057", dot: "#868e96" },
//   "In Progress": { bg: "#e7f5ff", color: "#1971c2", dot: "#339af0" },
//   "Done":        { bg: "#ebfbee", color: "#2f9e44", dot: "#40c057" },
//   "On Hold":     { bg: "#fff5f5", color: "#c92a2a", dot: "#fa5252" },
// };

// const PRIORITY_CONFIG = {
//   Low:      { color: "#2f9e44", bg: "#ebfbee", icon: "▼" },
//   Medium:   { color: "#f59f00", bg: "#fff9db", icon: "■" },
//   High:     { color: "#e8590c", bg: "#fff4e6", icon: "▲" },
//   Critical: { color: "#c92a2a", bg: "#fff5f5", icon: "⚑" },
// };

// const COLUMNS = [
//   { key: "id",          label: "Task ID",    width: 110 },
//   { key: "description", label: "Description", width: 320 },
//   { key: "assignee",    label: "Assignee",   width: 150 },
//   { key: "priority",    label: "Priority",   width: 110 },
//   { key: "startDate",   label: "Start Date", width: 110 },
//   { key: "endDate",     label: "End Date",   width: 110 },
//   { key: "status",      label: "Status",     width: 150 },
// ];
// const TOTAL_WIDTH = COLUMNS.reduce((a, c) => a + c.width, 0);

// // ─── Helpers ──────────────────────────────────────────────────
// function formatDate(d) {
//   if (!d) return "—";
//   const s = d.split("T")[0].split("-");
//   return `${s[2]}-${s[1]}-${s[0]}`;
// }
// function initials(name) {
//   return (name || "?")
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);
// }
// const AV_COLORS = [
//   "#7950f2",
//   "#1971c2",
//   "#0ca678",
//   "#e8590c",
//   "#c2255c",
//   "#f59f00",
//   "#364fc7",
// ];
// function avColor(name) {
//   return AV_COLORS[(name || "").charCodeAt(0) % AV_COLORS.length];
// }

// function Avatar({ name, size = 24 }) {
//   return (
//     <div
//       style={{
//         width: size,
//         height: size,
//         borderRadius: "50%",
//         background: avColor(name),
//         color: "#fff",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         fontSize: size * 0.38,
//         fontWeight: 700,
//         flexShrink: 0,
//       }}
//     >
//       {initials(name)}
//     </div>
//   );
// }

// function StatusPill({ status }) {
//   const c =
//     STATUS_CONFIG[status] || {
//       bg: "#f1f3f5",
//       color: "#495057",
//       dot: "#868e96",
//     };
//   return (
//     <span
//       style={{
//         display: "inline-flex",
//         alignItems: "center",
//         gap: 5,
//         padding: "3px 9px",
//         borderRadius: 20,
//         background: c.bg,
//         color: c.color,
//         fontSize: 11,
//         fontWeight: 700,
//         whiteSpace: "nowrap",
//       }}
//     >
//       <span
//         style={{
//           width: 6,
//           height: 6,
//           borderRadius: "50%",
//           background: c.dot,
//         }}
//       />
//       {status || "—"}
//     </span>
//   );
// }

// function PriorityPill({ priority }) {
//   const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG["Medium"];
//   return (
//     <span
//       style={{
//         display: "inline-flex",
//         alignItems: "center",
//         gap: 4,
//         padding: "3px 8px",
//         borderRadius: 4,
//         background: c.bg,
//         color: c.color,
//         fontSize: 11,
//         fontWeight: 700,
//       }}
//     >
//       <span style={{ fontSize: 9 }}>{c.icon}</span>
//       {priority || "—"}
//     </span>
//   );
// }

// function resolveSubStartDate(sub) {
//   if (sub.startDate) return sub.startDate;
//   if (sub.createdAt) return sub.createdAt;
//   return null;
// }
// function resolveSubEndDate(sub) {
//   return sub.endDate || sub.dueDate || null;
// }

// // ─── Stat Card (Lucide, same theme as RA MyTasks) ─────────────
// const STAT_STYLES = {
//   Total:       { gradient: "from-blue-400 to-blue-500",      Icon: ClipboardList },
//   "In Progress": { gradient: "from-sky-400 to-sky-500",      Icon: Zap },
//   Done:        { gradient: "from-emerald-400 to-emerald-500", Icon: CheckCircle2 },
//   "On Hold":   { gradient: "from-amber-400 to-amber-500",    Icon: PauseCircle },
//   Critical:    { gradient: "from-red-400 to-red-500",        Icon: AlertOctagon },
// };

// function StatCard({ value, label, index }) {
//   const s = STAT_STYLES[label] || STAT_STYLES["Total"];
//   return (
//     <div
//       className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg p-4 lg:p-3.5 shadow-sm hover:shadow-md transition-all duration-300 cursor-default flex items-center gap-2 hover:bg-white"
//       style={{ animation: `cardIn 0.4s ease ${index * 0.05}s both` }}
//     >
//       <div
//         className={`w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md flex-shrink-0`}
//       >
//         <s.Icon size={16} className="text-white drop-shadow-sm" strokeWidth={2} />
//       </div>
//       <div className="min-w-0 flex-1">
//         <span className="text-lg lg:text-xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
//           {value}
//         </span>
//         <span className="text-xs lg:text-sm font-medium text-slate-600 uppercase tracking-wide">
//           {label}
//         </span>
//       </div>
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────
// const MyTasks = () => {
//   const router = useRouter();
//   const rawUser = sessionStorage.getItem("user");
//   const user = rawUser ? JSON.parse(rawUser) : null;
//   const currentUserName = user?.name || user?.username || "";

//   const [tasks, setTasks] = useState([]);
//   const [subtasksMap, setSubtasksMap] = useState({});
//   const [expanded, setExpanded] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const TASKS_PER_PAGE = 15;
//   const hasFetched = useRef(false);

//   useEffect(() => {
//     if (!user || hasFetched.current) {
//       setLoading(false);
//       return;
//     }
//     hasFetched.current = true;

//     const fetchTasks = async () => {
//       try {
//         setLoading(true);
//         const all = await taskService.getAllTasks();
//         const userOrgId = user?.organization?._id || user?.organization;
//         const mine = all.filter(
//           (t) =>
//             String(t.organization) === String(userOrgId) &&
//             t.employee === currentUserName
//         );
//         setTasks(mine);

//         const subMap = {};
//         await Promise.all(
//           mine.map(async (t) => {
//             try {
//               const subs = await taskService.getSubTasks(t.taskId);
//               if (subs && subs.length > 0) subMap[t.taskId] = subs;
//             } catch (_) {}
//           })
//         );
//         setSubtasksMap(subMap);
//       } catch (e) {
//         console.error("Failed to fetch tasks:", e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTasks();
//   }, []); // logic unchanged

//   const toggleExpand = (taskId) =>
//     setExpanded((p) => ({ ...p, [taskId]: !p[taskId] }));

//   const filteredTasks = useMemo(() => {
//     let r = tasks;
//     if (statusFilter !== "all") r = r.filter((t) => t.status === statusFilter);
//     if (searchTerm.trim()) {
//       const q = searchTerm.toLowerCase();
//       r = r.filter(
//         (t) =>
//           (t.description || "").toLowerCase().includes(q) ||
//           (t.taskId || "").toLowerCase().includes(q)
//       );
//     }
//     return [...r].sort(
//       (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
//     );
//   }, [tasks, statusFilter, searchTerm]);

//   const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
//   const paginatedTasks = filteredTasks.slice(
//     (currentPage - 1) * TASKS_PER_PAGE,
//     currentPage * TASKS_PER_PAGE
//   );

//   const statusCount = useMemo(() => {
//     const c = {};
//     tasks.forEach((t) => {
//       c[t.status] = (c[t.status] || 0) + 1;
//     });
//     return c;
//   }, [tasks]);

//   const allStatuses = Object.keys(STATUS_CONFIG).filter((s) => statusCount[s]);

//   if (!user) {
//     return (
//       <div className="p-10 text-center text-slate-500">
//         Please log in to view your tasks.
//       </div>
//     );
//   }

//   const cell = (extra = {}) => ({
//     padding: "8px 14px",
//     borderRight: "1px solid #f1f5f9",
//     display: "flex",
//     alignItems: "center",
//     ...extra,
//   });
//   const cellL = (extra = {}) => ({
//     padding: "11px 14px",
//     borderRight: "1px solid #f1f5f9",
//     display: "flex",
//     alignItems: "center",
//     ...extra,
//   });
//   const cellEnd = () => ({
//     padding: "8px 14px",
//     display: "flex",
//     alignItems: "center",
//   });

//   // stats data (logic same, just feeding StatCard)
//   const statsData = [
//     { label: "Total",       value: tasks.length },
//     { label: "In Progress", value: statusCount["In Progress"] || 0 },
//     { label: "Done",        value: statusCount["Done"] || 0 },
//     { label: "On Hold",     value: statusCount["On Hold"] || 0 },
//     {
//       label: "Critical",
//       value: tasks.filter((t) => t.priority === "Critical").length,
//     },
//   ];

//   return (
//     <>
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
//         <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-8 pb-24 lg:pb-28 overflow-hidden">
//           {/* Back button – themed */}
//           <div className="mb-3">
//             <button
//               onClick={() => router.push("/task-management")}
//               className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
//             >
//               ← Back to Task Management
//             </button>
//           </div>

//           {/* Header card – same as RA MyTasks */}
//           <header className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-4 lg:mb-4 p-4 lg:p-5">
//             <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
//               <div className="flex items-center gap-4 flex-1">
//                 <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
//                   <ClipboardCheck className="w-6 h-6 lg:w-7 lg:h-7 text-white drop-shadow-sm" />
//                 </div>
//                 <div>
//                   <h1 className="text-xl lg:text-2xl font-semibold text-slate-800 leading-tight">
//                     My Tasks 
//                   </h1>
//                   <p className="text-sm lg:text-base text-slate-600 mt-1">
//                     Task Management •{" "}
//                     <span className="font-bold text-lg text-slate-900">
//                       {filteredTasks.length}
//                     </span>{" "}
//                     task{filteredTasks.length !== 1 ? "s" : ""} assigned to you
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </header>

//           {/* Stat cards – Lucide theme */}
//           <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
//             {statsData.map((s, i) => (
//               <StatCard key={s.label} {...s} index={i} />
//             ))}
//           </section>

//           {/* Filter bar – themed */}
//           <div
//             className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl shadow-sm mb-4 px-4 py-3 flex flex-wrap gap-2 items-center"
//             style={{ animation: "fadeUp 0.4s ease 0.2s both" }}
//           >
//             <div
//               onClick={() => {
//                 setStatusFilter("all");
//                 setCurrentPage(1);
//               }}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 5,
//                 padding: "5px 12px",
//                 borderRadius: 20,
//                 cursor: "pointer",
//                 background: statusFilter === "all" ? "#f3f0ff" : "#f8fafc",
//                 border: `1.5px solid ${
//                   statusFilter === "all" ? "#7950f2" : "transparent"
//                 }`,
//                 fontSize: 12,
//                 fontWeight: 700,
//                 color: statusFilter === "all" ? "#7950f2" : "#64748b",
//                 boxShadow:
//                   statusFilter === "all" ? "0 0 0 3px #7950f225" : "none",
//                 transition: "all 0.15s",
//               }}
//             >
//               {tasks.length} All
//             </div>

//             {allStatuses.map((st) => {
//               const c = STATUS_CONFIG[st];
//               const active = statusFilter === st;
//               return (
//                 <div
//                   key={st}
//                   onClick={() => {
//                     setStatusFilter(active ? "all" : st);
//                     setCurrentPage(1);
//                   }}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 5,
//                     padding: "5px 12px",
//                     borderRadius: 20,
//                     cursor: "pointer",
//                     background: active ? c.bg : "#f8fafc",
//                     border: `1.5px solid ${
//                       active ? c.dot : "transparent"
//                     }`,
//                     fontSize: 12,
//                     fontWeight: 700,
//                     color: active ? c.color : "#64748b",
//                     boxShadow: active ? `0 0 0 3px ${c.dot}25` : "none",
//                     transition: "all 0.15s",
//                   }}
//                 >
//                   <span
//                     style={{
//                       width: 6,
//                       height: 6,
//                       borderRadius: "50%",
//                       background: active ? c.dot : "#94a3b8",
//                     }}
//                   />
//                   {statusCount[st]} {st}
//                 </div>
//               );
//             })}

//             <div
//               style={{
//                 width: 1,
//                 height: 26,
//                 background: "#e2e8f0",
//                 flexShrink: 0,
//               }}
//             />

//             <div
//               style={{
//                 position: "relative",
//                 flex: "1 1 200px",
//                 maxWidth: 280,
//               }}
//             >
//               <Search
//                 size={13}
//                 color="#94a3b8"
//                 style={{
//                   position: "absolute",
//                   left: 9,
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   pointerEvents: "none",
//                 }}
//               />
//               <input
//                 value={searchTerm}
//                 onChange={(e) => {
//                   setSearchTerm(e.target.value);
//                   setCurrentPage(1);
//                 }}
//                 placeholder="Search tasks..."
//                 style={{
//                   width: "100%",
//                   padding: "7px 10px 7px 30px",
//                   border: "1.5px solid #e2e8f0",
//                   borderRadius: 8,
//                   fontSize: 13,
//                   fontFamily: "inherit",
//                   outline: "none",
//                   background: "#f8fafc",
//                   boxSizing: "border-box",
//                   transition: "all 0.2s",
//                 }}
//                 onFocus={(e) => {
//                   e.target.style.borderColor = "#3b82f6";
//                   e.target.style.background = "#fff";
//                 }}
//                 onBlur={(e) => {
//                   e.target.style.borderColor = "#e2e8f0";
//                   e.target.style.background = "#f8fafc";
//                 }}
//               />
//             </div>

//             {(searchTerm || statusFilter !== "all") && (
//               <button
//                 onClick={() => {
//                   setSearchTerm("");
//                   setStatusFilter("all");
//                   setCurrentPage(1);
//                 }}
//                 style={{
//                   padding: "7px 12px",
//                   borderRadius: 8,
//                   border: "1.5px solid #fecaca",
//                   background: "#fef2f2",
//                   color: "#dc2626",
//                   fontSize: 12,
//                   fontWeight: 700,
//                   cursor: "pointer",
//                 }}
//               >
//                 ✕ Clear
//               </button>
//             )}
//           </div>

//           {/* Table */}
//           {loading ? (
//             <div className="text-center py-20">
//               <div
//                 style={{
//                   width: 36,
//                   height: 36,
//                   border: "3px solid #e2e8f0",
//                   borderTop: "3px solid #3b82f6",
//                   borderRadius: "50%",
//                   margin: "0 auto 14px",
//                   animation: "spin 0.8s linear infinite",
//                 }}
//               />
//               <p className="text-slate-500 text-sm font-medium">
//                 Loading your tasks...
//               </p>
//             </div>
//           ) : (
//             <div
//               className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl shadow-md overflow-x-auto mb-5"
//               style={{ animation: "fadeUp 0.4s ease 0.25s both" }}
//             >
//               <div
//                 style={{
//                   display: "grid",
//                   gridTemplateColumns: COLUMNS.map(
//                     (c) => c.width + "px"
//                   ).join(" "),
//                   minWidth: TOTAL_WIDTH,
//                   background: "#f8fafc",
//                   borderBottom: "2px solid #e2e8f0",
//                 }}
//               >
//                 {COLUMNS.map((col, i) => (
//                   <div
//                     key={col.key}
//                     style={{
//                       padding: "9px 14px",
//                       fontSize: 11,
//                       fontWeight: 700,
//                       color: "#64748b",
//                       textTransform: "uppercase",
//                       letterSpacing: "0.8px",
//                       borderRight:
//                         i < COLUMNS.length - 1
//                           ? "1px solid #e2e8f0"
//                           : "none",
//                       userSelect: "none",
//                     }}
//                   >
//                     {col.label}
//                   </div>
//                 ))}
//               </div>

//               {paginatedTasks.length === 0 && (
//                 <div className="text-center py-16 px-5 text-slate-400">
//                   <div className="flex justify-center mb-3">
//                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-md">
//                       <ClipboardList
//                         size={22}
//                         className="text-white"
//                         strokeWidth={1.8}
//                       />
//                     </div>
//                   </div>
//                   <p className="text-base font-bold text-slate-600 mb-1">
//                     No tasks assigned to you
//                   </p>
//                   <p className="text-sm text-slate-400">
//                     Tasks assigned to you will appear here
//                   </p>
//                 </div>
//               )}

//               {paginatedTasks.map((task, idx) => {
//                 const subs = subtasksMap[task.taskId] || [];
//                 const hasSubtasks = subs.length > 0;
//                 const isExpanded = !!expanded[task.taskId];
//                 const isOverdue =
//                   task.endDate &&
//                   new Date(task.endDate) < new Date() &&
//                   task.status !== "Done";
//                 const notLastRow = idx < paginatedTasks.length - 1;

//                 return (
//                   <React.Fragment key={task.taskId}>
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns: COLUMNS.map(
//                           (c) => c.width + "px"
//                         ).join(" "),
//                         minWidth: TOTAL_WIDTH,
//                         borderBottom:
//                           notLastRow || isExpanded
//                             ? "1px solid #f1f5f9"
//                             : "none",
//                         background: "transparent",
//                         borderLeft: "3px solid transparent",
//                         transition: "all 0.1s",
//                       }}
//                       onMouseOver={(e) => {
//                         e.currentTarget.style.background =
//                           "rgba(255,255,255,0.9)";
//                         e.currentTarget.style.borderLeft =
//                           "3px solid #cbd5e1";
//                       }}
//                       onMouseOut={(e) => {
//                         e.currentTarget.style.background = "transparent";
//                         e.currentTarget.style.borderLeft =
//                           "3px solid transparent";
//                       }}
//                     >
//                       <div style={cellL({ gap: 6 })}>
//                         {hasSubtasks && (
//                           <span
//                             onClick={() => toggleExpand(task.taskId)}
//                             style={{
//                               cursor: "pointer",
//                               fontSize: 10,
//                               color: "#94a3b8",
//                               userSelect: "none",
//                               display: "inline-block",
//                               transform: isExpanded
//                                 ? "rotate(90deg)"
//                                 : "rotate(0deg)",
//                               transition: "transform 0.15s",
//                             }}
//                           >
//                             ▶
//                           </span>
//                         )}
//                         <span
//                           style={{
//                             fontSize: 10,
//                             fontWeight: 700,
//                             color: "#7c3aed",
//                             background: "#f3f0ff",
//                             padding: "2px 6px",
//                             borderRadius: 4,
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           {task.taskId}
//                         </span>
//                         {hasSubtasks && (
//                           <span
//                             style={{
//                               fontSize: 10,
//                               color: "#94a3b8",
//                               fontWeight: 600,
//                             }}
//                           >
//                             {subs.length}
//                           </span>
//                         )}
//                       </div>

//                       <div style={cellL()}>
//                         <span
//                           style={{
//                             fontSize: 13,
//                             fontWeight: 600,
//                             color: "#0f172a",
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           {task.description || "—"}
//                         </span>
//                       </div>

//                       <div style={cell({ gap: 6 })}>
//                         <Avatar name={task.employee} size={22} />
//                         <span
//                           style={{
//                             fontSize: 12,
//                             fontWeight: 600,
//                             color: "#334155",
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             whiteSpace: "nowrap",
//                             maxWidth: 100,
//                           }}
//                         >
//                           {task.employee || "—"}
//                         </span>
//                       </div>

//                       <div style={cell()}>
//                         <PriorityPill priority={task.priority} />
//                       </div>

//                       <div style={cell()}>
//                         <span
//                           style={{ fontSize: 12, color: "#64748b" }}
//                         >
//                           {formatDate(task.startDate)}
//                         </span>
//                       </div>

//                       <div style={cell()}>
//                         <span
//                           style={{
//                             fontSize: 12,
//                             fontWeight: 600,
//                             color: isOverdue ? "#dc2626" : "#475569",
//                           }}
//                         >
//                           {isOverdue && (
//                             <span
//                               title="Overdue"
//                               style={{ marginRight: 4 }}
//                             >
//                               ⚠
//                             </span>
//                           )}
//                           {formatDate(task.endDate)}
//                         </span>
//                       </div>

//                       <div style={cellEnd()}>
//                         <StatusPill status={task.status} />
//                       </div>
//                     </div>

//                     {isExpanded &&
//                       subs.map((sub, si) => {
//                         const subStartDate = resolveSubStartDate(sub);
//                         const subEndDate = resolveSubEndDate(sub);
//                         const subOverdue =
//                           subEndDate &&
//                           new Date(subEndDate) < new Date() &&
//                           sub.status !== "Done";
//                         const subIsLast =
//                           si === subs.length - 1 && !notLastRow;

//                         return (
//                           <div
//                             key={sub.subTaskId}
//                             style={{
//                               display: "grid",
//                               gridTemplateColumns: COLUMNS.map(
//                                 (c) => c.width + "px"
//                               ).join(" "),
//                               minWidth: TOTAL_WIDTH,
//                               borderBottom: subIsLast
//                                 ? "none"
//                                 : "1px solid #f1f5f9",
//                               background: "rgba(250,251,255,0.8)",
//                               borderLeft:
//                                 "3px solid rgba(124,58,237,0.12)",
//                               transition: "background 0.1s",
//                             }}
//                             onMouseOver={(e) =>
//                               (e.currentTarget.style.background =
//                                 "rgba(245,243,255,0.95)")
//                             }
//                             onMouseOut={(e) =>
//                               (e.currentTarget.style.background =
//                                 "rgba(250,251,255,0.8)")
//                             }
//                           >
//                             <div
//                               style={{
//                                 padding: "9px 14px 9px 32px",
//                                 borderRight: "1px solid #f1f5f9",
//                                 display: "flex",
//                                 alignItems: "center",
//                               }}
//                             >
//                               <span
//                                 style={{
//                                   fontSize: 10,
//                                   fontWeight: 700,
//                                   color: "#7c3aed",
//                                   background: "#f3f0ff",
//                                   padding: "2px 6px",
//                                   borderRadius: 4,
//                                   whiteSpace: "nowrap",
//                                 }}
//                               >
//                                 {sub.subTaskId}
//                               </span>
//                             </div>

//                             <div
//                               style={{
//                                 padding: "9px 14px 9px 18px",
//                                 borderRight: "1px solid #f1f5f9",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 gap: 6,
//                               }}
//                             >
//                               <span
//                                 style={{ color: "#94a3b8", fontSize: 11 }}
//                               >
//                                 └
//                               </span>
//                               <span
//                                 style={{
//                                   fontSize: 12,
//                                   color: "#475569",
//                                   overflow: "hidden",
//                                   textOverflow: "ellipsis",
//                                   whiteSpace: "nowrap",
//                                 }}
//                               >
//                                 {sub.description || "—"}
//                               </span>
//                             </div>

//                             <div style={cell({ gap: 6 })}>
//                               {sub.assignee ? (
//                                 <>
//                                   <Avatar
//                                     name={sub.assignee}
//                                     size={20}
//                                   />
//                                   <span
//                                     style={{
//                                       fontSize: 11,
//                                       color: "#475569",
//                                       maxWidth: 90,
//                                       overflow: "hidden",
//                                       textOverflow: "ellipsis",
//                                       whiteSpace: "nowrap",
//                                     }}
//                                   >
//                                     {sub.assignee}
//                                   </span>
//                                 </>
//                               ) : (
//                                 <span
//                                   style={{
//                                     fontSize: 11,
//                                     color: "#94a3b8",
//                                   }}
//                                 >
//                                   —
//                                 </span>
//                               )}
//                             </div>

//                             <div style={cell()}>
//                               {sub.priority ? (
//                                 <PriorityPill priority={sub.priority} />
//                               ) : (
//                                 <span
//                                   style={{
//                                     color: "#94a3b8",
//                                     fontSize: 12,
//                                   }}
//                                 >
//                                   —
//                                 </span>
//                               )}
//                             </div>

//                             <div style={cell()}>
//                               <span
//                                 style={{
//                                   fontSize: 12,
//                                   color: "#64748b",
//                                 }}
//                               >
//                                 {formatDate(subStartDate)}
//                               </span>
//                             </div>

//                             <div style={cell()}>
//                               <span
//                                 style={{
//                                   fontSize: 12,
//                                   fontWeight: 600,
//                                   color: subOverdue
//                                     ? "#dc2626"
//                                     : "#64748b",
//                                 }}
//                               >
//                                 {subOverdue && (
//                                   <span style={{ marginRight: 3 }}>
//                                     ⚠
//                                   </span>
//                                 )}
//                                 {formatDate(subEndDate)}
//                               </span>
//                             </div>

//                             <div style={cellEnd()}>
//                               <StatusPill status={sub.status} />
//                             </div>
//                           </div>
//                         );
//                       })}
//                   </React.Fragment>
//                 );
//               })}
//             </div>
//           )}

//           {totalPages > 1 && (
//             <div className="flex justify-center items-center gap-1 flex-wrap">
//               <button
//                 onClick={() =>
//                   setCurrentPage((p) => Math.max(1, p - 1))
//                 }
//                 disabled={currentPage === 1}
//                 style={{
//                   padding: "6px 12px",
//                   border: "1.5px solid #e2e8f0",
//                   borderRadius: 8,
//                   background: "#fff",
//                   cursor:
//                     currentPage === 1 ? "not-allowed" : "pointer",
//                   fontWeight: 700,
//                   color:
//                     currentPage === 1 ? "#94a3b8" : "#475569",
//                 }}
//               >
//                 ‹
//               </button>
//               {Array.from({ length: totalPages }, (_, i) => i + 1).map(
//                 (p) => (
//                   <button
//                     key={p}
//                     onClick={() => setCurrentPage(p)}
//                     style={{
//                       padding: "6px 12px",
//                       border: "1.5px solid",
//                       borderRadius: 8,
//                       borderColor:
//                         currentPage === p
//                           ? "#3b82f6"
//                           : "#e2e8f0",
//                       background:
//                         currentPage === p ? "#3b82f6" : "#fff",
//                       color:
//                         currentPage === p ? "#fff" : "#475569",
//                       fontWeight: 700,
//                       cursor: "pointer",
//                     }}
//                   >
//                     {p}
//                   </button>
//                 )
//               )}
//               <button
//                 onClick={() =>
//                   setCurrentPage((p) =>
//                     Math.min(totalPages, p + 1)
//                   )
//                 }
//                 disabled={currentPage === totalPages}
//                 style={{
//                   padding: "6px 12px",
//                   border: "1.5px solid #e2e8f0",
//                   borderRadius: 8,
//                   background: "#fff",
//                   cursor:
//                     currentPage === totalPages
//                       ? "not-allowed"
//                       : "pointer",
//                   fontWeight: 700,
//                   color:
//                     currentPage === totalPages
//                       ? "#94a3b8"
//                       : "#475569",
//                 }}
//               >
//                 ›
//               </button>
//             </div>
//           )}
//         </main>

//         <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-6 py-4 lg:px-8 lg:py-5 sticky bottom-0 z-50">
//           <div className="max-w-7xl mx-auto text-center">
//             <p className="text-sm lg:text-base text-slate-600 font-medium">
//               © {new Date().getFullYear()} CalVant. All rights reserved.
//             </p>
//           </div>
//         </footer>
//       </div>

//       <style>{`
//         @keyframes spin   { to { transform: rotate(360deg); } }
//         @keyframes cardIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
//         @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
//         * { box-sizing: border-box; }
//         ::-webkit-scrollbar { width: 6px; height: 6px; }
//         ::-webkit-scrollbar-track { background: #f8fafc; }
//         ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
//         ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
//       `}</style>
//     </>
//   );
// };

// export default MyTasks;







//C:\Users\ak192\Downloads\CalVant-Next-main\CalVant-Next-main\src\modules\taskManagement\components\MyTasksSection.js
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

// ─── Stat Card (matching TemplatesPage exactly) ───────────────
const STAT_CONFIG = {
  Total:         { gradient: "linear-gradient(135deg,#4f8ef7,#2563eb)",  Icon: ClipboardList },
  "In Progress": { gradient: "linear-gradient(135deg,#339af0,#1971c2)",  Icon: Zap },
  Done:          { gradient: "linear-gradient(135deg,#10b981,#059669)",  Icon: CheckCircle2 },
  "On Hold":     { gradient: "linear-gradient(135deg,#f59e0b,#d97706)",  Icon: PauseCircle },
  Critical:      { gradient: "linear-gradient(135deg,#ef4444,#dc2626)",  Icon: AlertOctagon },
};

function StatCard({ value, label, index }) {
  const s = STAT_CONFIG[label] || STAT_CONFIG["Total"];
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #f1f5f9",
        borderRadius: 12,
        padding: "14px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "default",
        transition: "box-shadow 0.2s",
        animation: `cardIn 0.4s ease ${index * 0.05}s both`,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.09)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)")
      }
    >
      <div
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: s.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
        }}
      >
        <s.Icon size={16} color="white" strokeWidth={2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", lineHeight: 1.1 }}>
          {value}
        </div>
        <div
          style={{
            fontSize: 11, fontWeight: 600, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Pills (matching TemplatesPage style) ─────────────────────
function StatusPill({ status }) {
  const c = STATUS_CONFIG[status] || { bg: "#f1f3f5", color: "#495057", dot: "#868e96" };
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20,
        background: c.bg, color: c.color,
        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      {status || "—"}
    </span>
  );
}

function PriorityPill({ priority }) {
  const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG["Medium"];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 20,
        background: c.bg, color: c.color, fontSize: 11, fontWeight: 700,
      }}
    >
      <span style={{ fontSize: 9 }}>{c.icon}</span>
      {priority || "—"}
    </span>
  );
}

// ─── Helpers (LOGIC UNCHANGED) ────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  const s = d.split("T")[0].split("-");
  return `${s[2]}-${s[1]}-${s[0]}`;
}
function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
const AV_COLORS = ["#7950f2","#1971c2","#0ca678","#e8590c","#c2255c","#f59f00","#364fc7"];
function avColor(name) {
  return AV_COLORS[(name || "").charCodeAt(0) % AV_COLORS.length];
}
function Avatar({ name, size = 24 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: avColor(name), color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
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

// ─── Main Component ───────────────────────────────────────────
// ALL LOGIC UNCHANGED — only UI/styling updated to match TemplatesPage
const MyTasks = () => {
  const router = useRouter();
  const rawUser = sessionStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const currentUserName = user?.name || user?.username || "";

  // ── State (LOGIC UNCHANGED) ────────────────────────────────
  const [tasks,       setTasks]       = useState([]);
  const [subtasksMap, setSubtasksMap] = useState({});
  const [expanded,    setExpanded]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm,   setSearchTerm]   = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);
  const TASKS_PER_PAGE = 15;
  const hasFetched = useRef(false);

  // ── Data fetching (LOGIC UNCHANGED) ───────────────────────
  useEffect(() => {
    if (!user || hasFetched.current) { setLoading(false); return; }
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
      } catch (e) { console.error("Failed to fetch tasks:", e); }
      finally { setLoading(false); }
    };
    fetchTasks();
  }, []);

  const toggleExpand = (taskId) =>
    setExpanded((p) => ({ ...p, [taskId]: !p[taskId] }));

  // ── Filtering & Pagination (LOGIC UNCHANGED) ───────────────
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
    return [...r].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [tasks, statusFilter, searchTerm]);

  const totalPages    = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE
  );

  const statusCount = useMemo(() => {
    const c = {};
    tasks.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
    return c;
  }, [tasks]);

  const allStatuses = Object.keys(STATUS_CONFIG).filter((s) => statusCount[s]);

  const getVisiblePages = (current, total) => {
    const pages = new Set();
    for (let i = 1; i <= Math.min(3, total); i++) pages.add(i);
    for (let i = Math.max(total - 2, 1); i <= total; i++) pages.add(i);
    for (let i = current - 1; i <= current + 1; i++) { if (i >= 1 && i <= total) pages.add(i); }
    return [...pages].sort((a, b) => a - b);
  };

  if (!user) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: "#64748b", fontSize: 14 }}>
        Please log in to view your tasks.
      </div>
    );
  }

  const statsData = [
    { label: "Total",       value: tasks.length },
    { label: "In Progress", value: statusCount["In Progress"] || 0 },
    { label: "Done",        value: statusCount["Done"] || 0 },
    { label: "On Hold",     value: statusCount["On Hold"] || 0 },
    { label: "Critical",    value: tasks.filter((t) => t.priority === "Critical").length },
  ];

  // ── Render (UI matches TemplatesPage exactly) ──────────────
  return (
    <>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <main
          style={{
            flex: 1, maxWidth: 1400, margin: "0 auto", width: "100%",
            padding: "12px 20px 100px", boxSizing: "border-box",
          }}
        >
          {/* ── Back button (matching TemplatesPage) ── */}
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => router.push("/task-management")}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                color: "white", border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(37,99,235,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.3)"; }}
            >
              ← Back to Task Management
            </button>
          </div>

          {/* ── Header card (matching TemplatesPage exactly) ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(241,245,249,0.8)", borderRadius: 14,
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              padding: "18px 24px 16px", marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                }}
              >
                <ClipboardCheck size={22} color="white" strokeWidth={2} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                  My Tasks
                </h1>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748b", fontWeight: 400 }}>
                  Task Management ·{" "}
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
                    {filteredTasks.length}
                  </span>{" "}
                  task{filteredTasks.length !== 1 ? "s" : ""} assigned to you
                </p>
              </div>
            </div>
          </div>

          {/* ── Stat Cards (matching TemplatesPage exactly) ── */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 14, marginBottom: 18,
            }}
          >
            {statsData.map((s, i) => (
              <StatCard key={s.label} value={s.value} label={s.label} index={i} />
            ))}
          </section>

          {/* ── Filter bar (matching TemplatesPage toolbar style) ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(241,245,249,0.8)", borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              padding: "8px 16px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 8,
              flexWrap: "wrap", overflow: "visible",
              animation: "fadeUp 0.4s ease 0.2s both",
              position: "relative", zIndex: 100,
            }}
          >
            {/* Status label */}
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", flexShrink: 0 }}>
              Status
            </span>

            {/* Status chips */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <button
                onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                  background: statusFilter === "all" ? "#eff6ff" : "#f8fafc",
                  border: `1.5px solid ${statusFilter === "all" ? "#3b82f6" : "#e2e8f0"}`,
                  color: statusFilter === "all" ? "#1d4ed8" : "#64748b",
                }}
              >
                All ({tasks.length})
              </button>
              {allStatuses.map((st) => {
                const c      = STATUS_CONFIG[st];
                const active = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => { setStatusFilter(active ? "all" : st); setCurrentPage(1); }}
                    style={{
                      padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                      background: active ? c.bg : "#f8fafc",
                      border: `1.5px solid ${active ? c.dot : "#e2e8f0"}`,
                      color: active ? c.color : "#64748b",
                    }}
                  >
                    <span style={{ marginRight: 4, display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: active ? c.dot : "#94a3b8", verticalAlign: "middle" }} />
                    {statusCount[st]} {st}
                  </button>
                );
              })}
            </div>

            <div style={{ width: 1, height: 24, background: "#e2e8f0", flexShrink: 0 }} />

            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 180px", maxWidth: 280 }}>
              <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search tasks..."
                style={{
                  width: "100%", padding: "7px 10px 7px 30px",
                  border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13,
                  outline: "none", background: "#f8fafc", boxSizing: "border-box",
                  transition: "all 0.2s", color: "#1e293b",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); setCurrentPage(1); }}
                style={{
                  padding: "6px 12px", borderRadius: 8, border: "1.5px solid #fca5a5",
                  background: "transparent", color: "#e74c3c", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#e74c3c"; e.currentTarget.style.color = "white"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#e74c3c"; }}
              >
                ✕ Clear
              </button>
            )}

            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── Table card (matching TemplatesPage exactly) ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)",
              borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              border: "1px solid rgba(241,245,249,0.8)",
              overflow: "hidden", animation: "fadeUp 0.4s ease 0.25s both", marginBottom: 16,
            }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: 80 }}>
                <div
                  style={{
                    width: 32, height: 32, border: "3px solid #e2e8f0",
                    borderTop: "3px solid #3b82f6", borderRadius: "50%",
                    margin: "0 auto 14px", animation: "spin 0.8s linear infinite",
                  }}
                />
                <p style={{ color: "#64748b", fontSize: 13, margin: 0, fontWeight: 500 }}>
                  Loading your tasks...
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800, background: "transparent" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      {[
                        { label: "#",           align: "center", width: 60 },
                        { label: "Task ID",     align: "center", width: 110 },
                        { label: "Description", align: "left",   minWidth: 300 },
                        { label: "Assignee",    align: "left",   width: 150 },
                        { label: "Priority",    align: "center", width: 120 },
                        { label: "Start Date",  align: "center", width: 110 },
                        { label: "Due Date",    align: "center", width: 110 },
                        { label: "Status",      align: "center", width: 140, accent: true },
                      ].map(({ label, align, width, minWidth, accent }) => (
                        <th
                          key={label}
                          style={{
                            padding: "11px 12px", textAlign: align,
                            fontWeight: 700, fontSize: 11,
                            color: accent ? "#3b82f6" : "#64748b",
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            whiteSpace: "nowrap",
                            background: accent ? "#eff6ff" : "transparent",
                            ...(width    ? { width }    : {}),
                            ...(minWidth ? { minWidth } : {}),
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >
                              <ClipboardList size={22} color="white" strokeWidth={1.8} />
                            </div>
                            <p style={{ color: "#64748b", fontWeight: 600, fontSize: 14, margin: 0 }}>
                              No tasks assigned to you
                            </p>
                            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                              Tasks assigned to you will appear here
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedTasks.map((task, displayIndex) => {
                        const subs        = subtasksMap[task.taskId] || [];
                        const hasSubtasks = subs.length > 0;
                        const isExpanded  = !!expanded[task.taskId];
                        const isOverdue   = task.endDate && new Date(task.endDate) < new Date() && task.status !== "Done";
                        const serialNo    = (currentPage - 1) * TASKS_PER_PAGE + displayIndex + 1;
                        const notLastRow  = displayIndex < paginatedTasks.length - 1;

                        return (
                          <React.Fragment key={task.taskId}>
                            <tr
                              style={{
                                background: serialNo % 2 === 0 ? "transparent" : "rgba(248,250,252,0.6)",
                                borderBottom: "1px solid #f1f5f9",
                                transition: "all 0.15s",
                                borderLeft: "3px solid transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.95)";
                                e.currentTarget.style.borderLeft = "3px solid #cbd5e1";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = serialNo % 2 === 0 ? "transparent" : "rgba(248,250,252,0.6)";
                                e.currentTarget.style.borderLeft = "3px solid transparent";
                              }}
                            >
                              {/* # */}
                              <td style={{ padding: "12px", textAlign: "center" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#f3f0ff", padding: "2px 7px", borderRadius: 4 }}>
                                  {serialNo}
                                </span>
                              </td>

                              {/* Task ID */}
                              <td style={{ padding: "12px", textAlign: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                                  {hasSubtasks && (
                                    <span
                                      onClick={() => toggleExpand(task.taskId)}
                                      style={{
                                        cursor: "pointer", fontSize: 10, color: "#94a3b8",
                                        userSelect: "none", display: "inline-block",
                                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                        transition: "transform 0.15s",
                                      }}
                                    >
                                      ▶
                                    </span>
                                  )}
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#f3f0ff", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>
                                    {task.taskId}
                                  </span>
                                  {hasSubtasks && (
                                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{subs.length}</span>
                                  )}
                                </div>
                              </td>

                              {/* Description */}
                              <td style={{ padding: "12px", color: "#475569", fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: 380 }}>
                                  {task.description || "—"}
                                </span>
                              </td>

                              {/* Assignee */}
                              <td style={{ padding: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <Avatar name={task.employee} size={22} />
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
                                    {task.employee || "—"}
                                  </span>
                                </div>
                              </td>

                              {/* Priority */}
                              <td style={{ padding: "12px", textAlign: "center" }}>
                                <PriorityPill priority={task.priority} />
                              </td>

                              {/* Start Date */}
                              <td style={{ padding: "12px", textAlign: "center" }}>
                                <span style={{ fontSize: 12, color: "#64748b" }}>
                                  {formatDate(task.startDate)}
                                </span>
                              </td>

                              {/* Due Date */}
                              <td style={{ padding: "12px", textAlign: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? "#ef4444" : "#475569", whiteSpace: "nowrap" }}>
                                  {isOverdue && <span title="Overdue" style={{ marginRight: 4 }}>⚠</span>}
                                  {formatDate(task.endDate)}
                                </span>
                              </td>

                              {/* Status */}
                              <td style={{ padding: "12px", textAlign: "center", background: "rgba(248,250,252,0.5)" }}>
                                <StatusPill status={task.status} />
                              </td>
                            </tr>

                            {/* ── Subtask rows (LOGIC UNCHANGED) ── */}
                            {isExpanded && subs.map((sub, si) => {
                              const subStartDate = resolveSubStartDate(sub);
                              const subEndDate   = resolveSubEndDate(sub);
                              const subOverdue   = subEndDate && new Date(subEndDate) < new Date() && sub.status !== "Done";

                              return (
                                <tr
                                  key={sub.subTaskId}
                                  style={{
                                    background: "rgba(248,245,255,0.7)",
                                    borderBottom: "1px solid #f1f5f9",
                                    borderLeft: "3px solid rgba(124,58,237,0.18)",
                                    transition: "background 0.1s",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(243,240,255,0.95)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(248,245,255,0.7)")}
                                >
                                  {/* # sub */}
                                  <td style={{ padding: "9px 12px", textAlign: "center" }}>
                                    <span style={{ fontSize: 10, color: "#94a3b8" }}>└</span>
                                  </td>

                                  {/* Sub Task ID */}
                                  <td style={{ padding: "9px 12px", textAlign: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#f3f0ff", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>
                                      {sub.subTaskId}
                                    </span>
                                  </td>

                                  {/* Sub Description */}
                                  <td style={{ padding: "9px 12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ color: "#94a3b8", fontSize: 11 }}>└</span>
                                      <span style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {sub.description || "—"}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Sub Assignee */}
                                  <td style={{ padding: "9px 12px" }}>
                                    {sub.assignee ? (
                                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <Avatar name={sub.assignee} size={20} />
                                        <span style={{ fontSize: 11, color: "#64748b", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                          {sub.assignee}
                                        </span>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>
                                    )}
                                  </td>

                                  {/* Sub Priority */}
                                  <td style={{ padding: "9px 12px", textAlign: "center" }}>
                                    {sub.priority ? <PriorityPill priority={sub.priority} /> : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                                  </td>

                                  {/* Sub Start Date */}
                                  <td style={{ padding: "9px 12px", textAlign: "center" }}>
                                    <span style={{ fontSize: 12, color: "#64748b" }}>
                                      {formatDate(subStartDate)}
                                    </span>
                                  </td>

                                  {/* Sub Due Date */}
                                  <td style={{ padding: "9px 12px", textAlign: "center" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: subOverdue ? "#ef4444" : "#64748b" }}>
                                      {subOverdue && <span style={{ marginRight: 3 }}>⚠</span>}
                                      {formatDate(subEndDate)}
                                    </span>
                                  </td>

                                  {/* Sub Status */}
                                  <td style={{ padding: "9px 12px", textAlign: "center", background: "rgba(248,250,252,0.5)" }}>
                                    <StatusPill status={sub.status} />
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Pagination (matching TemplatesPage exactly) ── */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex", justifyContent: "center", alignItems: "center",
                  padding: "14px 16px", gap: 6, flexWrap: "wrap",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "6px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8,
                    background: "#fff", fontWeight: 700,
                    color: currentPage === 1 ? "#94a3b8" : "#475569",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ‹
                </button>
                {getVisiblePages(currentPage, totalPages).map((pageNum, index, arr) => {
                  const isActive  = pageNum === currentPage;
                  const prevPage  = arr[index - 1];
                  return (
                    <React.Fragment key={pageNum}>
                      {prevPage && pageNum - prevPage > 1 && (
                        <span style={{ padding: "0 4px", color: "#94a3b8", fontSize: 13 }}>…</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={isActive}
                        style={{
                          padding: "6px 12px", borderRadius: 8, border: "1.5px solid",
                          borderColor: isActive ? "#3b82f6" : "#e2e8f0",
                          background: isActive ? "#3b82f6" : "#fff",
                          color: isActive ? "#fff" : "#475569",
                          fontWeight: 700, cursor: isActive ? "default" : "pointer",
                        }}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "6px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8,
                    background: "#fff", fontWeight: 700,
                    color: currentPage === totalPages ? "#94a3b8" : "#475569",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </main>

        {/* ── Footer (matching TemplatesPage exactly) ── */}
        <footer
          style={{
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
            borderTop: "1px solid rgba(241,245,249,0.8)",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.04)",
            padding: "14px 24px", position: "sticky", bottom: 0, zIndex: 50,
          }}
        >
          <div style={{ maxWidth: 1400, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500, margin: 0 }}>
              © {new Date().getFullYear()} CalVant. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes cardIn  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar       { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f8fafc; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </>
  );
};

export default MyTasks;