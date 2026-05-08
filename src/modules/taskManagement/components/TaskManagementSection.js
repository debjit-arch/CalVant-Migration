import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Zap,
  CheckCircle2,
  PauseCircle,
  AlertOctagon,
  Search,
  Plus,
} from "lucide-react";
import InputField from "../components copy/inputs/InputField";
import SelectField from "../components copy/inputs/SelectField";
import TextAreaField from "../components copy/inputs/TextAreaField";
import TaskDetailPanel from "./Taskdetailpanel";
import taskService from "../services/taskService";
import riskService from "../services/riskService";
import {
  getAllUsers,
  getDepartments,
} from "../../departments/services/userService";
import auditService from "../../gapAssessment/services/auditService";

const STATUS = {
  TODO: "To-Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  ON_HOLD: "On Hold",
};
const PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};
const STATUS_CONFIG = {
  "To-Do": { bg: "#f1f3f5", color: "#495057", dot: "#868e96" },
  "In Progress": { bg: "#e7f5ff", color: "#1971c2", dot: "#339af0" },
  Done: { bg: "#ebfbee", color: "#2f9e44", dot: "#40c057" },
  "On Hold": { bg: "#fff5f5", color: "#c92a2a", dot: "#fa5252" },
};
const PRIORITY_CONFIG = {
  Low: { color: "#2f9e44", bg: "#ebfbee", icon: "▼" },
  Medium: { color: "#f59f00", bg: "#fff9db", icon: "■" },
  High: { color: "#e8590c", bg: "#fff4e6", icon: "▲" },
  Critical: { color: "#c92a2a", bg: "#fff5f5", icon: "⚑" },
};
function getSourceModule(task) {
  if (task.source === "Policy")
    return { label: "Policy", bg: "#fdf4ff", color: "#7e22ce" };   // purple — distinct from Compliance
  if (task.source === "Compliance" || task.controlId)
    return { label: "Compliance", bg: "#f0fdf4", color: "#166534" };
  if (task.riskId) return { label: "Risk", bg: "#e7f5ff", color: "#1971c2" };
  if (task.auditId) return { label: "Audit", bg: "#fff9db", color: "#e67700" };
  return { label: "General", bg: "#f1f3f5", color: "#868e96" };
}
const statusOptions = Object.values(STATUS);
const priorityOptions = Object.values(PRIORITY);

const COLUMNS = [
  { key: "description", label: "Task", width: 260 },
  { key: "source", label: "Source", width: 100 },
  { key: "sourceId", label: "Source ID", width: 120 },
  { key: "assignee", label: "Assignee", width: 160 },
  { key: "reporter", label: "Reporter", width: 140 },
  { key: "priority", label: "Priority", width: 110 },
  { key: "status", label: "Status", width: 130 },
  { key: "createdAt", label: "Created", width: 110 },
  { key: "updatedAt", label: "Last Update", width: 110 },
  { key: "endDate", label: "Due Date", width: 110 },
  { key: "actions", label: "", width: 100 },
];
const TOTAL_WIDTH = COLUMNS.reduce((a, c) => a + c.width, 0);

function formatDate(d) {
  if (!d) return "—";
  const s = d.split("T")[0].split("-");
  return `${s[2]}-${s[1]}-${s[0]}`;
}
function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

// Resolve employee field: MongoDB ID → name string, or return as-is
function resolveEmployeeName(employeeField, users) {
  if (!employeeField) return null;
  const byId = users.find(
    (u) => String(u._id || u.id) === String(employeeField),
  );
  return byId ? byId.name : employeeField;
}

function Avatar({ name, size = 26 }) {
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
        fontWeight: "700",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials(name)}
    </div>
  );
}
function StatusPill({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG["To-Do"];
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
        style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }}
      />
      {status}
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
      {priority}
    </span>
  );
}

// NEW: Lucide stat cards
const STAT_STYLES = {
  Total: { gradient: "from-blue-400 to-blue-500", Icon: ClipboardList },
  "In Progress": { gradient: "from-sky-400 to-sky-500", Icon: Zap },
  Done: { gradient: "from-emerald-400 to-emerald-500", Icon: CheckCircle2 },
  "On Hold": { gradient: "from-amber-400 to-amber-500", Icon: PauseCircle },
  Critical: { gradient: "from-red-400 to-red-500", Icon: AlertOctagon },
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
        <s.Icon
          size={16}
          className="text-white drop-shadow-sm"
          strokeWidth={2}
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
    </div>
  );
}

// NEW: Portal InlineSelect (fixed-position dropdown, no z-index clipping)
function InlineSelect({ value, options, onSave, renderValue, disabled }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const triggerRef = React.useRef();
  const portalRef = React.useRef();
  const openDropdown = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setDropPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (portalRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={triggerRef} style={{ display: "inline-block" }}>
      <div
        onClick={openDropdown}
        style={{
          cursor: disabled ? "default" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {renderValue(value)}
        {!disabled && <span style={{ fontSize: 9, color: "#94a3b8" }}>▾</span>}
      </div>
      {open &&
        ReactDOM.createPortal(
          <div
            ref={portalRef}
            style={{
              position: "fixed",
              top: dropPos.top,
              left: dropPos.left,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
              zIndex: 99999,
              minWidth: 150,
              overflow: "hidden",
              animation: "portalDropIn 0.12s ease",
            }}
          >
            {options.map((opt) => (
              <div
                key={opt}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSave(opt);
                  setOpen(false);
                }}
                style={{
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  background: opt === value ? "#f8fafc" : "#fff",
                  color: "#334155",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f1f5f9")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background =
                    opt === value ? "#f8fafc" : "#fff")
                }
              >
                {opt}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

// NEW: Portal InlineAssignee (resolves MongoDB ID to name)
function InlineAssignee({ employeeField, users, onSave, disabled }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const triggerRef = React.useRef();
  const portalRef = React.useRef();
  const displayName = resolveEmployeeName(employeeField, users) || "Unassigned";
  const openDropdown = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setDropPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (portalRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={triggerRef} style={{ display: "inline-block" }}>
      <div
        onClick={openDropdown}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: disabled ? "default" : "pointer",
          padding: "2px 4px",
          borderRadius: 6,
          transition: "background 0.15s",
        }}
        onMouseOver={(e) => {
          if (!disabled) e.currentTarget.style.background = "#f1f5f9";
        }}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Avatar name={displayName} size={22} />
        <span
          title={displayName}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#334155",
            maxWidth: 90,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </span>
        {!disabled && <span style={{ fontSize: 9, color: "#94a3b8" }}>▾</span>}
      </div>
      {open &&
        ReactDOM.createPortal(
          <div
            ref={portalRef}
            style={{
              position: "fixed",
              top: dropPos.top,
              left: dropPos.left,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
              zIndex: 99999,
              minWidth: 190,
              maxHeight: 240,
              overflowY: "auto",
              animation: "portalDropIn 0.12s ease",
            }}
          >
            {users.map((u) => (
              <div
                key={u._id || u.id}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSave(u.name);
                  setOpen(false);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: u.name === displayName ? "#f8fafc" : "#fff",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f1f5f9")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background =
                    u.name === displayName ? "#f8fafc" : "#fff")
                }
              >
                <Avatar name={u.name} size={22} />
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}
                >
                  {u.name}
                </span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

// OLD: Status Change Modal (dark gradient header, DM Sans, #0052CC confirm)
function StatusChangeModal({ currentStatus, newStatus, onConfirm, onCancel }) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState(false);
  const textRef = React.useRef();
  useEffect(() => {
    setTimeout(() => textRef.current?.focus(), 80);
  }, []);
  const handleConfirm = () => {
    if (!remarks.trim()) {
      setError(true);
      return;
    }
    onConfirm(remarks.trim());
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          fontFamily: "'DM Sans', sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0d1117, #1a1f2e)",
            padding: "18px 22px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#868e96",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 6,
            }}
          >
            Status Change
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusPill status={currentStatus} />
            <span style={{ color: "#6c757d", fontSize: 14 }}>→</span>
            <StatusPill status={newStatus} />
          </div>
        </div>
        <div style={{ padding: "20px 22px" }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0d1117",
              display: "block",
              marginBottom: 8,
            }}
          >
            Remarks <span style={{ color: "#c92a2a" }}>*</span>
            <span
              style={{
                fontWeight: 400,
                color: "#868e96",
                fontSize: 12,
                marginLeft: 6,
              }}
            >
              (required)
            </span>
          </label>
          <textarea
            ref={textRef}
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
            placeholder="Explain the reason for this status change..."
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1.5px solid ${error ? "#c92a2a" : "#e9ecef"}`,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none",
              background: error ? "#fff5f5" : "#f8f9fa",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = error ? "#c92a2a" : "#339af0";
              e.target.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? "#c92a2a" : "#e9ecef";
              e.target.style.background = error ? "#fff5f5" : "#f8f9fa";
            }}
          />
          {error && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#c92a2a",
                fontWeight: 600,
              }}
            >
              ⚠ Please enter remarks before changing the status.
            </div>
          )}
        </div>
        <div
          style={{
            padding: "0 22px 20px",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "1.5px solid #e9ecef",
              background: "#fff",
              color: "#495057",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: "#0052CC",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
// DESIGN  → Document 3 (new): lucide StatCards, portal dropdowns, glassmorphism filter bar
// LOGIC   → Document 4 (old): DM Sans hero, scroll-hide back, employeeName payload, auditId edit, auto-assign
// PERMISSIONS:
//   canEdit (risk_owner/root/super_admin) → full access (assignee, priority, edit, delete)
//   reporter / others                     → status change ONLY
export default function TaskManagement({
  riskFormData = {},
  auditFormData = {},
}) {
  const router = useRouter();
  const rawUser = sessionStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const today = new Date().toISOString().split("T")[0];
  const currentUserName = user?.name || user?.username || "System";

  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
  const hasAnyRole = (...roles) => roles.some((r) => userRoles.includes(r));
  const canEdit = hasAnyRole("risk_owner", "root", "super_admin");

  const scopedRiskId = riskFormData?.riskId || null;
  const scopedAuditId = auditFormData?.auditId || null;
  const userOrgId = user?.organization?._id || user?.organization;
  const contextLabel = scopedRiskId
    ? "Risk Assessment"
    : scopedAuditId
      ? "Audit"
      : "Task Management";
  const contextScopeId = scopedRiskId || scopedAuditId || null;
  const [audits, setAudits] = useState([]);

  useEffect(() => {
    auditService
      .getAudits()
      .then((data) => setAudits(Array.isArray(data) ? data : []));
  }, []);
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 15;
  const [statusModal, setStatusModal] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    assignee: "",
    priority: "",
    search: "",
  });

  // OLD: scroll-hide back button
  const [showBack, setShowBack] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  useEffect(() => {
    const h = () => {
      setShowBack(window.scrollY <= lastScrollY);
      setLastScrollY(window.scrollY);
    };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, [lastScrollY]);

  const emptyForm = () => ({
    taskId: "",
    riskId: scopedRiskId || "",
    auditId: scopedAuditId || "",
    organization: user?.organization || "",
    department: "",
    employee: "",
    employeeName: "",
    employeeId: "",
    description: "",
    startDate: today,
    endDate: "",
    status: STATUS.TODO,
    priority: PRIORITY.MEDIUM,
    remarks: "",
    createdAt: null,
    updatedAt: null,
    originalTask: null,
  });
  const [formData, setFormData] = useState(emptyForm());
  const formDataRef = React.useRef(null);
  const setForm = (val) => {
    const next =
      typeof val === "function" ? val(formDataRef.current || emptyForm()) : val;
    formDataRef.current = next;
    setFormData(next);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let m = true;
    setIsLoading(true);
    getDepartments()
      .then(
        (d) =>
          m &&
          setDepartments(
            Array.isArray(d)
              ? d.filter((dept) => dept.organization === user?.organization)
              : [],
          ),
      )
      .catch(console.error)
      .finally(() => m && setIsLoading(false));
    return () => (m = false);
  }, [user?.organization]);

  useEffect(() => {
    let m = true;
    getAllUsers()
      .then(
        (r) =>
          m &&
          setUsers(
            Array.isArray(r)
              ? r.filter((u) => u.organization === user?.organization)
              : [],
          ),
      )
      .catch(console.error);
    return () => (m = false);
  }, [user?.organization]);

  const fetchTasks = useCallback(async () => {
    try {
      const all = await taskService.getAllTasks();
      const orgTasks = all.filter(
        (t) => String(t.organization) === String(userOrgId),
      );
      let scoped;
      if (scopedRiskId)
        scoped = orgTasks.filter((t) => t.riskId === scopedRiskId);
      else if (scopedAuditId)
        scoped = orgTasks.filter((t) => t.auditId === scopedAuditId);
      else scoped = orgTasks;
      setTasks(scoped);
    } catch (e) {
      console.error(e);
    }
  }, [scopedRiskId, scopedAuditId, userOrgId]);
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Show all org users in the Assign To dropdown.
  // We do NOT filter by department — the user should be able to assign to anyone.
  // The auto-assign-to-risk-owner logic in saveTask still applies when left blank.
  // Assign To dropdown — all org users, value is always a stringified ID
  const empOptions = useMemo(() => {
    return (users || [])
      .filter((u) => u.name)
      .map((u) => ({ value: String(u._id || u.id || ""), label: u.name }));
  }, [users]);

  const inlineUpdate = useCallback(
    async (taskId, patch) => {
      const task = tasks.find((t) => t.taskId === taskId);
      if (!task) return;
      const updated = {
        ...task,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      try {
        await taskService.updateTask(taskId, updated, currentUserName);
        setTasks((prev) =>
          prev.map((t) => (t.taskId === taskId ? updated : t)),
        );
        if (selectedTask?.taskId === taskId) setSelectedTask(updated);
      } catch {
        alert("Failed to update");
      }
    },
    [tasks, currentUserName, selectedTask],
  );

  const requestStatusChange = useCallback(
    (taskId, newStatus) => {
      const task = tasks.find((t) => t.taskId === taskId);
      if (!task || task.status === newStatus) return;
      setStatusModal({ taskId, currentStatus: task.status, newStatus });
    },
    [tasks],
  );
  const confirmStatusChange = useCallback(
    async (remarks) => {
      if (!statusModal) return;
      const { taskId, newStatus } = statusModal;
      setStatusModal(null);
      await inlineUpdate(taskId, { status: newStatus, remarks });
    },
    [statusModal, inlineUpdate],
  );

  const handleTaskUpdate = useCallback((updated) => {
    setTasks((prev) =>
      prev.map((t) => (t.taskId === updated.taskId ? updated : t)),
    );
    setSelectedTask(updated);
  }, []);

  const openAddModal = () => {
    setEditingTaskId(null);
    const ef = emptyForm();
    formDataRef.current = ef;
    setFormData(ef);
    setIsModalOpen(true);
  };

  // OLD: editTask preserves auditId + resolves employee to name
  const editTask = (task) => {
    setEditingTaskId(task.taskId);
    const resolvedName = resolveEmployeeName(task.employee, users);
    const matchedUser = users.find((u) => u.name === resolvedName);
    setForm({
      taskId: task.taskId,
      riskId: task.riskId || "",
      auditId: task.auditId || "",
      organization: task.organization || user?.organization || "",
      department: task.department || "",
      employee: resolvedName || "",
      employeeId: matchedUser?._id || "",
      employeeName: resolvedName || "",
      description: task.description || "",
      startDate: task.startDate || today,
      endDate: task.endDate || "",
      status: task.status || STATUS.TODO,
      priority: task.priority || PRIORITY.MEDIUM,
      remarks: task.remarks || "",
      createdAt: task.createdAt || null,
      updatedAt: task.updatedAt || null,
      originalTask: task,
    });
    setIsModalOpen(true);
  };

  // OLD: saveTask with employeeName in payload (mail-service uses this)
  const saveTask = async () => {
    const fd = formDataRef.current || formData;
    if (!fd.department || !fd.startDate || !fd.endDate || !fd.description) {
      alert("Please fill all required fields!");
      return;
    }
    if (new Date(fd.endDate) < new Date(fd.startDate)) {
      alert("End date cannot be before start date.");
      return;
    }
    // If user explicitly picked an assignee, use that directly.
    // Only auto-assign when nothing was selected.
    let employeeName = fd.employeeName || fd.employee || "";
    if (!employeeName) {
      if (fd.department) {
        const myDeptObj = departments.find(
          (d) => String(d._id || d.id) === String(user?.department),
        );
        if (myDeptObj?.name === fd.department) {
          employeeName = currentUserName;
        } else {
          const owner = users.find((u) => {
            const dObj = departments.find(
              (d) => String(d._id || d.id) === String(u.department),
            );
            const isOwner = Array.isArray(u.role)
              ? u.role.includes("risk_owner")
              : u.role === "risk_owner";
            return dObj?.name === fd.department && isOwner;
          });
          employeeName = owner ? owner.name : currentUserName;
        }
      } else {
        employeeName = currentUserName;
      }
    }

    // Resolve emails from the already-loaded users array.
    // This avoids any dependency on user-service at notification time.
    const assigneeUser = users.find((u) => u.name === employeeName);
    const employeeEmail =
      assigneeUser?.email || assigneeUser?.emailAddress || "";
    const reporterUser = users.find((u) => u.name === currentUserName);
    const reporterEmail =
      reporterUser?.email || reporterUser?.emailAddress || user?.email || "";

    setIsSaving(true);
    try {
      const payload = {
        taskId: fd.taskId,
        riskId: fd.riskId || undefined,
        auditId: fd.auditId || undefined,
        organization: user?.organization,
        department: fd.department,
        employee: employeeName, // always a name string
        employeeName: employeeName, // explicit name field for mail-service
        employeeEmail: employeeEmail, // ✅ email stored on task — no lookup needed
        description: fd.description,
        startDate: fd.startDate,
        endDate: fd.endDate,
        status: editingTaskId ? fd.status : STATUS.TODO,
        priority: fd.priority || PRIORITY.MEDIUM,
        reporter: currentUserName,
        reporterEmail: reporterEmail, // ✅ reporter email stored on task
        remarks: fd.remarks,
        createdAt: fd.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (editingTaskId) {
        await taskService.updateTask(editingTaskId, payload, currentUserName);
        setTasks((prev) =>
          prev.map((t) =>
            t.taskId === editingTaskId ? { ...t, ...payload } : t,
          ),
        );
      } else {
        await taskService.saveTask(payload, currentUserName);
        await fetchTasks();
      }
      setIsModalOpen(false);
      setEditingTaskId(null);
    } catch {
      alert(`Failed to ${editingTaskId ? "update" : "add"} task.`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await taskService.deleteTask(taskId, currentUserName);
      setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
      if (selectedTask?.taskId === taskId) setSelectedTask(null);
    } catch {
      alert("Failed to delete task.");
    }
  };

  const filteredTasks = useMemo(() => {
    const s = (filters.search || "").toLowerCase();
    return tasks.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.assignee) {
        const r = resolveEmployeeName(t.employee, users);
        if (r !== filters.assignee) return false;
      }
      if (s) {
        const n = (resolveEmployeeName(t.employee, users) || "").toLowerCase();
        if (!(t.description || "").toLowerCase().includes(s) && !n.includes(s))
          return false;
      }
      return true;
    });
  }, [tasks, filters, users]);

  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = useMemo(() => {
    const safeDate = (d) => {
      if (!d) return 0;
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    };
    return [...filteredTasks]
      .sort((a, b) => {
        // Primary: newest createdAt first
        const diff = safeDate(b.createdAt) - safeDate(a.createdAt);
        if (diff !== 0) return diff;
        // Secondary: most recently updated (tiebreak)
        return safeDate(b.updatedAt) - safeDate(a.updatedAt);
      })
      .slice((currentPage - 1) * TASKS_PER_PAGE, currentPage * TASKS_PER_PAGE);
  }, [filteredTasks, currentPage]);
  useEffect(() => setCurrentPage(1), [filteredTasks.length]);

  const statusCount = useMemo(() => {
    const c = {
      [STATUS.TODO]: 0,
      [STATUS.IN_PROGRESS]: 0,
      [STATUS.DONE]: 0,
      [STATUS.ON_HOLD]: 0,
    };
    filteredTasks.forEach((t) => {
      if (c[t.status] !== undefined) c[t.status]++;
    });
    return c;
  }, [filteredTasks]);

  const statsData = [
    { label: "Total", value: tasks.length },
    { label: "In Progress", value: statusCount["In Progress"] || 0 },
    { label: "Done", value: statusCount["Done"] || 0 },
    { label: "On Hold", value: statusCount["On Hold"] || 0 },
    {
      label: "Critical",
      value: tasks.filter((t) => t.priority === "Critical").length,
    },
  ];
  const cell = (extra = {}) => ({
    padding: "8px 14px",
    borderRight: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    ...extra,
  });
  const cellEnd = () => ({
    padding: "8px 14px",
    display: "flex",
    alignItems: "center",
  });

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* OLD: scroll-hide back button */}
      <div style={{ padding: "14px 28px 0" }}>
        <button
          onClick={() => router.push("/task-management")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "#0052CC",
            border: "none",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,82,204,0.25)",
            fontFamily: "inherit",
            transform: showBack ? "translateY(0)" : "translateY(-120%)",
            opacity: showBack ? 1 : 0,
            transition: "all 0.3s ease",
          }}
        >
          ← Back
        </button>
      </div>

      <div
        style={{
          padding: "0 28px 80px",
          minHeight: "100vh",
          background: "#f4f5f7",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* OLD: dark hero header */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #0d2241 100%)",
            borderRadius: 20,
            padding: "32px 36px",
            marginTop: 16,
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, #339af044 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: 100,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, #7950f222 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
              backgroundSize: "24px 24px",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#40c057",
                    boxShadow: "0 0 8px #40c05780",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#868e96",
                    textTransform: "uppercase",
                    letterSpacing: "1.2px",
                  }}
                >
                  {contextLabel}
                </span>
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.8px",
                  lineHeight: 1.1,
                }}
              >
                Action Plan
              </h1>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#6c757d",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {filteredTasks.length} task
                {filteredTasks.length !== 1 ? "s" : ""}
                {contextScopeId && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: scopedAuditId ? "#fff9db" : "#e7f5ff",
                      color: scopedAuditId ? "#e67700" : "#1971c2",
                      padding: "2px 8px",
                      borderRadius: 10,
                    }}
                  >
                    {contextScopeId}
                  </span>
                )}
              </p>
            </div>
            {canEdit && (
              <button
                onClick={openAddModal}
                style={{
                  alignSelf: "center",
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: "#0052CC",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 14px rgba(0,82,204,0.4)",
                  transition: "background 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#003d99")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#0052CC")
                }
              >
                <Plus size={15} /> Create Task
              </button>
            )}
          </div>
        </div>

        {/* NEW: lucide stat cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
          {statsData.map((s, i) => (
            <StatCard key={s.label} {...s} index={i} />
          ))}
        </section>

        {/* Filter bar */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #e9ecef",
            padding: "12px 18px",
            marginBottom: 16,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div
            onClick={() => setFilters((p) => ({ ...p, status: "" }))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 20,
              cursor: "pointer",
              background: !filters.status ? "#f3f0ff" : "#f8f9fa",
              border: `1.5px solid ${!filters.status ? "#7950f2" : "transparent"}`,
              fontSize: 12,
              fontWeight: 700,
              color: !filters.status ? "#7950f2" : "#868e96",
              boxShadow: !filters.status ? "0 0 0 3px #7950f225" : "none",
              transition: "all 0.15s",
            }}
          >
            {tasks.length} All
          </div>
          {Object.entries(statusCount)
            .filter(([, count]) => count > 0)
            .map(([st, count]) => {
              const c = STATUS_CONFIG[st];
              const active = filters.status === st;
              return (
                <div
                  key={st}
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      status: p.status === st ? "" : st,
                    }))
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 20,
                    cursor: "pointer",
                    background: active ? c.bg : "#f8f9fa",
                    border: `1.5px solid ${active ? c.dot : "transparent"}`,
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? c.color : "#868e96",
                    boxShadow: active ? `0 0 0 3px ${c.dot}25` : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: active ? c.dot : "#adb5bd",
                    }}
                  />
                  {count} {st}
                </div>
              );
            })}
          <div
            style={{
              width: 1,
              height: 26,
              background: "#e9ecef",
              flexShrink: 0,
            }}
          />
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters((p) => ({ ...p, priority: e.target.value }))
            }
            style={{
              padding: "6px 12px",
              border: "1.5px solid #e9ecef",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "inherit",
              background: "#f8f9fa",
              cursor: "pointer",
              outline: "none",
              fontWeight: 600,
            }}
          >
            <option value="">All Priorities</option>
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={filters.assignee}
            onChange={(e) =>
              setFilters((p) => ({ ...p, assignee: e.target.value }))
            }
            style={{
              padding: "6px 12px",
              border: "1.5px solid #e9ecef",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "inherit",
              background: "#f8f9fa",
              cursor: "pointer",
              outline: "none",
              fontWeight: 600,
            }}
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u._id || u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>
          <div
            style={{
              width: 1,
              height: 26,
              background: "#e9ecef",
              flexShrink: 0,
            }}
          />
          <div
            style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}
          >
            <Search
              size={13}
              color="#adb5bd"
              style={{
                position: "absolute",
                left: 9,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
              placeholder="Search tasks..."
              style={{
                width: "100%",
                padding: "7px 10px 7px 30px",
                border: "1.5px solid #e9ecef",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                background: "#f8f9fa",
                boxSizing: "border-box",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#339af0";
                e.target.style.background = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e9ecef";
                e.target.style.background = "#f8f9fa";
              }}
            />
          </div>
          {(filters.search ||
            filters.status ||
            filters.priority ||
            filters.assignee) && (
            <button
              onClick={() =>
                setFilters({
                  status: "",
                  assignee: "",
                  priority: "",
                  search: "",
                })
              }
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: "1.5px solid #ffe3e3",
                background: "#fff5f5",
                color: "#c92a2a",
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
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid #e9ecef",
                borderTop: "3px solid #0052CC",
                borderRadius: "50%",
                margin: "0 auto 14px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "#868e96", fontSize: 13, margin: 0 }}>
              Loading tasks...
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e9ecef",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              overflowX: "auto",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: COLUMNS.map((c) => `${c.width}px`).join(
                  " ",
                ),
                minWidth: TOTAL_WIDTH,
                background: "#f8f9fa",
                borderBottom: "2px solid #e9ecef",
              }}
            >
              {COLUMNS.map((col, i) => (
                <div
                  key={col.key}
                  style={{
                    padding: "9px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#868e96",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    borderRight:
                      i < COLUMNS.length - 1 ? "1px solid #e9ecef" : "none",
                    userSelect: "none",
                  }}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {paginatedTasks.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "56px 20px",
                  color: "#adb5bd",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
                <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600 }}>
                  No tasks found
                </p>
                {canEdit && (
                  <span
                    style={{
                      color: "#0052CC",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    onClick={openAddModal}
                  >
                    + Create a task
                  </span>
                )}
              </div>
            ) : (
              paginatedTasks.map((task, idx) => {
                const isSelected = selectedTask?.taskId === task.taskId;
                const isOverdue =
                  task.endDate &&
                  new Date(task.endDate) < new Date() &&
                  task.status !== STATUS.DONE;
                const source = getSourceModule(task);
                const sourceId =
                  task.riskId ||
                  (task.auditId
                    ? audits.find((a) => a.id === task.auditId)?.auditId ||
                      task.auditId
                    : null);
                const notLastRow = idx < paginatedTasks.length - 1;
                // PERMISSION: reporter (non-canEdit) can only change status
                const isReporter = !canEdit;

                return (
                  <div
                    key={task.taskId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: COLUMNS.map(
                        (c) => `${c.width}px`,
                      ).join(" "),
                      minWidth: TOTAL_WIDTH,
                      borderBottom: notLastRow ? "1px solid #f1f3f5" : "none",
                      background: isSelected ? "#f0f7ff" : "#fff",
                      borderLeft: "3px solid transparent",
                      transition: "all 0.1s",
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "#fafbfc";
                        e.currentTarget.style.borderLeft = "3px solid #dee2e6";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderLeft =
                          "3px solid transparent";
                      }
                    }}
                  >
                    {/* Task */}
                    <div
                      style={{
                        ...cell({
                          cursor: "pointer",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 3,
                          padding: "11px 14px",
                        }),
                      }}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#7950f2",
                            background: "#f3f0ff",
                            padding: "2px 6px",
                            borderRadius: 4,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {task.taskId}
                        </span>
                        <span
                          title={task.description}
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0d1117",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {task.description}
                        </span>
                      </div>
                      {task.department && (
                        <span style={{ fontSize: 11, color: "#adb5bd" }}>
                          {task.department}
                        </span>
                      )}
                    </div>

                    {/* Source */}
                    <div style={cell()}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: source.color,
                          background: source.bg,
                          padding: "2px 8px",
                          borderRadius: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {source.label}
                      </span>
                    </div>

                    {/* Source ID */}
                    <div style={cell()}>
                      {sourceId ? (
                        <span
                          title={sourceId}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: source.color,
                            background: source.bg,
                            padding: "2px 8px",
                            borderRadius: 4,
                            opacity: 0.9,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                            display: "inline-block",
                            cursor: "default",
                          }}
                        >
                          {sourceId}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#adb5bd" }}>
                          —
                        </span>
                      )}
                    </div>

                    {/* Assignee: canEdit only */}
                    <div style={cell()} onClick={(e) => e.stopPropagation()}>
                      <InlineAssignee
                        employeeField={task.employee}
                        users={users}
                        onSave={(name) =>
                          inlineUpdate(task.taskId, {
                            employee: name,
                            employeeName: name,
                          })
                        }
                        disabled={isReporter}
                      />
                    </div>

                    {/* Reporter: read-only */}
                    <div style={cell({ gap: 6 })}>
                      <Avatar
                        name={task.reporter || currentUserName}
                        size={22}
                      />
                      <span
                        title={task.reporter || currentUserName}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#343a40",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                          flex: 1,
                          cursor: "default",
                        }}
                      >
                        {task.reporter || currentUserName}
                      </span>
                    </div>

                    {/* Priority: canEdit only */}
                    <div style={cell()} onClick={(e) => e.stopPropagation()}>
                      <InlineSelect
                        value={task.priority || PRIORITY.MEDIUM}
                        options={priorityOptions}
                        onSave={(val) =>
                          inlineUpdate(task.taskId, { priority: val })
                        }
                        renderValue={(val) => <PriorityPill priority={val} />}
                        disabled={isReporter}
                      />
                    </div>

                    {/* Status: EVERYONE can change (reporter included) */}
                    <div style={cell()} onClick={(e) => e.stopPropagation()}>
                      <InlineSelect
                        value={task.status}
                        options={statusOptions}
                        onSave={(val) => requestStatusChange(task.taskId, val)}
                        renderValue={(val) => <StatusPill status={val} />}
                        disabled={false}
                      />
                    </div>

                    {/* Created */}
                    <div style={cell()}>
                      <span style={{ fontSize: 12, color: "#868e96" }}>
                        {formatDateTime(task.createdAt)}
                      </span>
                    </div>
                    {/* Updated */}
                    <div style={cell()}>
                      <span style={{ fontSize: 12, color: "#868e96" }}>
                        {formatDateTime(task.updatedAt)}
                      </span>
                    </div>
                    {/* Due date */}
                    <div style={cell()}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isOverdue ? "#c92a2a" : "#495057",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isOverdue && (
                          <span title="Overdue" style={{ marginRight: 4 }}>
                            ⚠
                          </span>
                        )}
                        {formatDate(task.endDate)}
                      </span>
                    </div>

                    {/* Actions: edit/delete for canEdit only */}
                    <div style={cellEnd()} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => setSelectedTask(task)}
                          title="View details"
                          style={{
                            padding: "4px 8px",
                            borderRadius: 5,
                            border: "1px solid #e9ecef",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                            color: "#b2bfcd",
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.background = "#f1f3f5")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.background = "#fff")
                          }
                        >
                          ↗
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => editTask(task)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 5,
                                border: "1px solid #e9ecef",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: 12,
                                color: "#0052CC",
                                fontWeight: 700,
                              }}
                              onMouseOver={(e) =>
                                (e.target.style.background = "#e7f5ff")
                              }
                              onMouseOut={(e) =>
                                (e.target.style.background = "#fff")
                              }
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => deleteTask(task.taskId)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 5,
                                border: "1px solid #e9ecef",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: 12,
                                color: "#c92a2a",
                                fontWeight: 700,
                              }}
                              onMouseOver={(e) =>
                                (e.target.style.background = "#fff5f5")
                              }
                              onMouseOut={(e) =>
                                (e.target.style.background = "#fff")
                              }
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "6px 10px",
                border: "1px solid #dee2e6",
                borderRadius: 6,
                background: "#fff",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontWeight: 700,
                color: currentPage === 1 ? "#adb5bd" : "#495057",
              }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #dee2e6",
                  borderRadius: 6,
                  background: currentPage === p ? "#0052CC" : "#fff",
                  color: currentPage === p ? "#fff" : "#495057",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 10px",
                border: "1px solid #dee2e6",
                borderRadius: 6,
                background: "#fff",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontWeight: 700,
                color: currentPage === totalPages ? "#adb5bd" : "#495057",
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          users={users}
          departments={departments}
          currentUser={user}
        />
      )}
      {statusModal && (
        <StatusChangeModal
          currentStatus={statusModal.currentStatus}
          newStatus={statusModal.newStatus}
          onConfirm={confirmStatusChange}
          onCancel={() => setStatusModal(null)}
        />
      )}

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 28,
              borderRadius: 14,
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px",
                fontWeight: 700,
                color: "#0d1117",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {editingTaskId ? "Edit Task" : "Create Task"}
              {contextScopeId && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 9px",
                    borderRadius: 10,
                    background: scopedAuditId ? "#fff9db" : "#e7f5ff",
                    color: scopedAuditId ? "#e67700" : "#1971c2",
                  }}
                >
                  {contextLabel}: {contextScopeId}
                </span>
              )}
            </h3>
            <div style={{ display: "grid", gap: 14 }}>
              <SelectField
                label="Department *"
                name="department"
                value={formData.department}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    department: e.target.value,
                    employee: "",
                    employeeName: "",
                    employeeId: "",
                  }))
                }
                options={departments.map((d) => ({
                  value: d.name,
                  label: d.name,
                }))}
                placeholder="Select department"
                disabled={!!editingTaskId}
              />
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                    color: "#343a40",
                  }}
                >
                  Assign To
                </label>
                <select
                  value={formData.employeeId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = users.find(
                      (u) => String(u._id || u.id) === val,
                    );
                    const name = matched?.name || "";
                    // Write to ref first, then derive full next state and push to both ref + React state
                    const next = {
                      ...(formDataRef.current || {}),
                      employeeId: val,
                      employee: name,
                      employeeName: name,
                    };
                    formDataRef.current = next;
                    setFormData(next);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1.5px solid #e9ecef",
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="">-- Auto Assign (Risk Owner) --</option>
                  {empOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {formData.employeeName && (
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 11,
                      color: "#2f9e44",
                      fontWeight: 600,
                    }}
                  >
                    ✓ Assigned to: {formData.employeeName}
                  </div>
                )}
              </div>
              <TextAreaField
                label="Task Description *"
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe the task..."
                rows={3}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <InputField
                  label="Start Date *"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) => {
                    const ns = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      startDate: ns,
                      endDate:
                        prev.endDate && prev.endDate < ns ? "" : prev.endDate,
                    }));
                  }}
                  min={today}
                />
                <InputField
                  label="End Date *"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  min={formData.startDate || today}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 8,
                    color: "#343a40",
                  }}
                >
                  Priority
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {priorityOptions.map((p) => {
                    const c = PRIORITY_CONFIG[p];
                    const sel = formData.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setForm((prev) => ({ ...prev, priority: p }));
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: `1.5px solid ${sel ? c.color : "#e9ecef"}`,
                          background: sel ? c.bg : "#fff",
                          color: sel ? c.color : "#868e96",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {c.icon} {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              {editingTaskId && (
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 6,
                      color: "#343a40",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1.5px solid #e9ecef",
                      fontSize: 13,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                    color: "#343a40",
                  }}
                >
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                  placeholder="Optional notes..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1.5px solid #e9ecef",
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTaskId(null);
                  }}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    border: "1.5px solid #e9ecef",
                    background: "#fff",
                    color: "#495057",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveTask}
                  disabled={isSaving}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: isSaving ? "#adb5bd" : "#0052CC",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isSaving ? "not-allowed" : "pointer",
                  }}
                >
                  {isSaving ? "Saving..." : editingTaskId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OLD: sticky footer */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #f1f3f5",
          padding: "9px 24px",
          textAlign: "center",
          fontSize: 12,
          color: "#adb5bd",
          zIndex: 100,
        }}
      >
        © {new Date().getFullYear()} CalVant. All rights reserved.
      </footer>

      <style>{`
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes cardIn       { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes portalDropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar       { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f8f9fa; }
        ::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
      `}</style>
    </>
  );
}
