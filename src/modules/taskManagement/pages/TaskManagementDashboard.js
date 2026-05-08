import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import taskService from "../services/taskService";
import Joyride, { STATUS } from "react-joyride";
import {
  BarChart3,
  FileText,
  CheckCircle,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  FolderOpen,
  Users,
  Award,
  HelpCircle,
  PieChartIcon,
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

const TaskManagementDashboard = () => {
  const router = useRouter();
  const chartsContainerRef = useRef(null);

  // 1. Load User (ORIGINAL LOGIC - UNCHANGED)
  const [user] = useState(() => JSON.parse(sessionStorage.getItem("user")));
  const [run, setRun] = useState(false);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    myTasks: 0,
    pendingApproval: 0,
    completed: 0,
  });
  const [allTasks, setAllTasks] = useState([]);

  // 2. Derive Permissions and Scope Labels (ORIGINAL LOGIC - UNCHANGED)
  const { isAdmin, userDeptNames, departmentLabel } = useMemo(() => {
    if (!user)
      return { isAdmin: false, userDeptNames: [], departmentLabel: "" };

    const roles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
    const depts = user?.departments || [];
    const names = depts.map((d) => d.name.trim().toLowerCase());

const isRoot = user?.role?.some((r) => {
  const s = (typeof r === "string" ? r : r?.name || r?.roleName || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  return ["root", "ciso", "aio", "dpo"].some(role => s.includes(role));
});
    const isSuperAdmin = roles.includes("super_admin");

    return {
      isAdmin: isRoot || isSuperAdmin,
      userDeptNames: names,
      departmentLabel: isRoot
        ? "All"
        : depts.map((d) => d.name).join(", ") ||
          user?.department?.name ||
          "General",
    };
  }, [user]);

  // 🔧 ALL useEffects at TOP LEVEL (ESLint fixed)
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 150);
      }
    });

    if (chartsContainerRef.current) {
      resizeObserver.observe(chartsContainerRef.current);
    }

    return () => {
      if (chartsContainerRef.current) {
        resizeObserver.unobserve(chartsContainerRef.current);
      }
      clearTimeout(window.resizeTimeout);
    };
  }, []);

  const loadTaskStats = useCallback(async () => {
    if (!user) return;

    try {
      const tasks = await taskService.getAllTasks();
      if (!Array.isArray(tasks)) return;

      const orgTasks = tasks.filter(
        (t) => t.organization === user.organization,
      );

      const accessibleTasks = orgTasks.filter((t) => {
        if (isAdmin) return true;
        const taskDept = t.department?.trim().toLowerCase();
        return userDeptNames.includes(taskDept);
      });

      const pendingApproval = accessibleTasks.filter(
        (t) =>
          t.status === "Completed (Pending Approval)" ||
          (t.status === "Completed" && t.approved !== true),
      );

      const completed = accessibleTasks.filter((t) => t.status === "Approved");

      setAllTasks(accessibleTasks);

      setTaskStats({
        total: orgTasks.length,
        myTasks: accessibleTasks.length,
        pendingApproval: pendingApproval.length,
        completed: completed.length,
      });
    } catch (error) {
      console.error("Error loading task stats:", error);
    }
  }, [user, isAdmin, userDeptNames]);

  useEffect(() => {
    loadTaskStats();
  }, [loadTaskStats]);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) return null;

  // Charts Data Processing
  const getMonthFromDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // Get month index (0–11) or name
    const monthNames = [
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
    ];
    return monthNames[date.getMonth()];
  };

  const pieData = [
    {
      name: "Approved",
      value: taskStats.completed,
      color: "#10b981",
      desc: `${taskStats.completed} approved tasks`,
    },
    {
      name: "Pending Approval",
      value: taskStats.pendingApproval,
      color: "#f59e0b",
      desc: `${taskStats.pendingApproval} pending review`,
    },
    {
      name: "My Tasks",
      value: taskStats.myTasks,
      color: "#3b82f6",
      desc: `${taskStats.myTasks} assigned tasks`,
    },
    // { name: "Total", value: taskStats.total, color: "#6366f1", desc: `${taskStats.total} organization total` },
  ].filter((d) => d.value > 0);

  const realMonthlyData = allTasks.reduce((acc, task) => {
    const month = getMonthFromDate(task.createdAt || task.created_at);
    if (month) acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const barData = [
    { name: "Jan", value: realMonthlyData.Jan || 0 },
    { name: "Feb", value: realMonthlyData.Feb || 0 },
    { name: "Mar", value: realMonthlyData.Mar || 0 },
    { name: "Apr", value: realMonthlyData.Apr || 0 },
    { name: "May", value: realMonthlyData.May || 0 },
    { name: "Jun", value: realMonthlyData.Jun || 0 },
    { name: "Jul", value: realMonthlyData.Jul || 0 },
    { name: "Aug", value: realMonthlyData.Aug || 0 },
    { name: "Sep", value: realMonthlyData.Sep || 0 },
    { name: "Oct", value: realMonthlyData.Oct || 0 },
    { name: "Nov", value: realMonthlyData.Nov || 0 },
    { name: "Dec", value: realMonthlyData.Dec || 0 },
  ];

  // COMPACT Tooltips
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
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
            {((data.value / (taskStats.total || 1)) * 100).toFixed(1)}% of total
          </div>
        </div>
      );
    }
    return null;
  };

  // 🆕 COMPACT BAR TOOLTIP (50% shorter)
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage =
        taskStats.total > 0
          ? ((data.value / taskStats.total) * 100).toFixed(1)
          : 0;

      const monthInfo = {
        Jan: "January",
        Feb: "February",
        Mar: "March",
        Apr: "April",
        May: "May",
        Jun: "June",
        Jul: "July",
        Aug: "August",
        Sep: "September",
        Oct: "October",
        Nov: "November",
        Dec: "December",
      };
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg min-w-[240px] max-h-[200px]">
          {/* 📊 HEADER */}
          <div className="flex items-center gap-2 mb-2 pb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-bold text-sm text-slate-900">
              {data.name}
            </span>
          </div>

          {/* 🎯 MAIN NUMBER */}
          <div className="text-2xl font-bold text-slate-900 mb-2">
            {data.value}
          </div>

          {/* 📅 PERIOD + STATS */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div className="text-slate-600">{monthInfo[data.name]}</div>
            <div className="text-right">
              <span className="font-semibold text-slate-800">
                {percentage}%
              </span>
              <span className="text-slate-500"> of total</span>
            </div>
          </div>

          {/* ⚙️ CALCULATION */}
          <div className="text-xs text-slate-600 space-y-0.5 mb-2 bg-slate-50 p-2 rounded">
            <div className="font-medium">How calculated:</div>
            <div className="text-left pl-2">
              •{" "}
              <code className="text-xs bg-blue-100 px-1 rounded">
                createdAt
              </code>{" "}
              in {data.name}
            </div>
            <div className="text-left pl-2">• {departmentLabel} dept only</div>
          </div>

          {/* 🔄 FOOTER */}
          <div className="text-xs text-slate-400 text-center mt-1 pt-1 border-t border-slate-100">
            🔄 Live database data
          </div>
        </div>
      );
    }
    return null;
  };

  const statsCards = [
    {
      Icon: BarChart3,
      value: taskStats.total,
      label: "Total",
      color: "from-blue-400 to-blue-500",
    },
    {
      Icon: Users,
      value: taskStats.myTasks,
      label: "Scope Tasks",
      color: "from-emerald-400 to-emerald-500",
    },
    {
      Icon: Clock,
      value: taskStats.pendingApproval,
      label: "Pending Approval",
      color: "from-orange-400 to-orange-500",
    },
    {
      Icon: CheckCircle2,
      value: taskStats.completed,
      label: "Approved Task",
      color: "from-green-400 to-green-500",
    },
    // { Icon: AlertTriangle, value: 0, label: "Overdue", color: "from-red-400 to-red-500" },
    {
      Icon: Circle,
      value: taskStats.total - taskStats.completed,
      label: "Active",
      color: "from-sky-400 to-sky-500",
    },
  ];

  const actionCards = [
    {
      id: "tasks",
      icon: FileText,
      title: "Manage Tasks",
      subtitle: "All Tasks",
      path: "/task-management/tasks",
      color: "from-violet-400 to-violet-500",
    },
    {
      id: "dept",
      icon: Users,
      title: "My Tasks",
      subtitle: "Repository",
      path: "/task-management/departmenttasks",
      color: "from-emerald-400 to-emerald-500",
      primary: true,
    },
    // { id: "my", icon: CheckCircle, title: "My Tasks", subtitle: "Assigned", path: "/task-management/tasks", color: "from-amber-400 to-amber-500" },
    // { id: "reports", icon: BarChart3, title: "Reports", subtitle: "Analytics", path: "/task-management/reports", color: "from-red-400 to-red-500", show: isAdmin },
  ];

  const steps = [
    {
      target: "#dashboard-header",
      content: `Welcome to your ${departmentLabel} task management dashboard.`,
    },
    {
      target: "#stats-grid",
      content: "Quick metrics overview at a glance.",
    },
    {
      target: "#charts-container",
      content: "Visual task distribution and trends analysis.",
    },
    {
      target: "#action-cards",
      content: "Quick access to all task management tools.",
    },
  ];

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
          callback={(data) => {
            if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status))
              setRun(false);
          }}
        />

        {/* Header */}
        <motion.header
          id="dashboard-header"
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-2 lg:mb-2 p-4 lg:p-5"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 lg:w-7 lg:h-7 text-white drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-semibold text-slate-800 leading-tight">
                  Task Dashboard
                </h1>
                <p className="text-sm lg:text-base text-slate-600 mt-1">
                  {departmentLabel} •{" "}
                  <span className="font-bold text-lg text-slate-900">
                    {taskStats.total}
                  </span>{" "}
                  total tasks
                </p>
              </div>
            </div>
            <motion.button
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
              onClick={() => {
                setRun(false);
                setTimeout(() => setRun(true), 100);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <HelpCircle size={18} />
              <span>Guide</span>
            </motion.button>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10 h-full">
          {/* Left: Stats + Actions */}
          <div className="space-y-8 lg:space-y-10">
            {/* Stats Grid */}
            <motion.section
              id="stats-grid"
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {statsCards.map(({ Icon, value, label, color }, i) => (
                <motion.div
                  key={label}
                  className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg p-4 lg:p-3.5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-2 h-17 lg:h-17 hover:bg-white"
                  onClick={() => router.push("/task-management/tasks")}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    className={`w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}
                  >
                    <Icon
                      size={16}
                      className="lg:size-18 text-white drop-shadow-sm"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-lg lg:text-xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
                      {value}
                    </span>
                    <span className="text-xs lg:text-sm font-medium text-slate-600 uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.section>

            {/* Quick Actions */}
            <motion.section
              id="action-cards"
              className="space-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-6 px-1">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-15">
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
                        show = true,
                      },
                      index,
                    ) =>
                      show && (
                        <motion.div
                          key={id}
                          className={`group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 h-full flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer ${primary ? "ring-2 ring-emerald-200/50 bg-gradient-to-br " + color : ""}`}
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
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md flex-shrink-0 ${primary ? "bg-white/20 backdrop-blur-sm" : `bg-gradient-to-br ${color}`}`}
                          >
                            <Icon
                              size={20}
                              className={`${primary ? "text-white" : "text-white"} drop-shadow-sm`}
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <h4 className="text-sm lg:text-base font-semibold text-center text-slate-800 leading-tight mb-1 px-1 truncate group-hover:text-blue-600 transition-colors duration-200">
                              {title}
                            </h4>
                            <p className="text-xs font-bold text-center text-slate-600 px-1 truncate">
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

          {/* Right: Charts */}
          <div
            ref={chartsContainerRef}
            id="charts-container"
            className="space-y-4 lg:space-y-3"
          >
            {/* Pie Chart - Task Distribution */}
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-9 lg:p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400 h-72 flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
            >
              <h3 className="text-base lg:text-lg font-semibold text-slate-800 mb-6 px-1">
                Task Distribution
              </h3>
              <div className="flex-1 flex items-center justify-center min-h-0">
                {taskStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="white"
                        strokeWidth={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      {/* Center labels */}
                      <text
                        x="50%"
                        y="42%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#475569" // replaces Tailwind
                        fontSize={12}
                        fontWeight={600}
                      >
                        Total
                      </text>
                      <text
                        x="50%"
                        y="52%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#111827"
                        fontSize={20}
                        fontWeight={700}
                      >
                        {taskStats.total}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <PieChartIcon
                      size={40}
                      className="text-slate-400 mb-4"
                      strokeWidth={1.5}
                    />
                    <p className="text-lg font-semibold text-slate-500 mb-2">
                      No Data
                    </p>
                    <p className="text-sm text-slate-500 max-w-xs">
                      Start by creating tasks
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Bar Chart - Quarterly Task Trends (ULTRA-DETAILED TOOLTIP) */}
            <motion.div
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                border: "1px solid #f1f5f9",
                borderRadius: "16px",
                padding: "24px",
                height: "288px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
                transition: "all 0.4s ease",
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* HEADER */}
              <div style={{ marginBottom: "14px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                >
                  📈 Monthly Task Creation Trends
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Each bar shows NEW tasks created each month (your department
                  only)
                </p>
              </div>

              {/* CHART AREA */}
              <div style={{ flex: 1 }}>
                {barData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="#f1f5f9"
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: "#6b7280",
                          fontWeight: 500,
                        }}
                      />

                      <Tooltip content={<CustomBarTooltip />} />

                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
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
                              ][index]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      textAlign: "center",
                    }}
                  >
                    <BarChart3
                      size={38}
                      style={{
                        color: "#cbd5f5",
                        marginBottom: "8px",
                      }}
                      strokeWidth={1.5}
                    />

                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#94a3b8",
                        marginBottom: "4px",
                      }}
                    >
                      No Trend Data
                    </p>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      Tasks need date fields for trends
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-6 py-4 lg:px-8 lg:py-5 sticky bottom-0 z-0">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm lg:text-base text-slate-600 font-medium">
            © {new Date().getFullYear()} CalVant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TaskManagementDashboard;
