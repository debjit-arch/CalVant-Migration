// MLD = Master List of Policies
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import documentationService from "../services/documentationService";
import controlService from "../services/controlService";
import taskService from "../../taskManagement/services/taskService";          // ← NEW
import { getAllUsers, getDepartments } from "../../departments/services/userService"; // ← NEW
import { Trash2, UploadCloud, Calendar, Check, ArrowUpDown, ArrowUp, ArrowDown, Plus, X } from "lucide-react";
import Modal from "../../../components/navigations/Modal";
import Joyride, { STATUS } from "react-joyride";
import { useFramework, ALL_FRAMEWORKS } from "../../../context/FrameworkContex";
import { captureActivity, ACTIONS } from "../../../services/activities";

const MAPPINGS_API = "https://api.calvant.com/framework/api/mappings/framework";
const OWNERSHIP_API = "https://api.calvant.com/control-ownership-service/api/control-ownership";

async function fetchMappingPair(src, tgt) {
  const token = sessionStorage.getItem("token");
  try {
    const res = await fetch(`${MAPPINGS_API}/${src}/${tgt}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

async function fetchOwnershipsByFramework(frameworkCode) {
  const token = sessionStorage.getItem("token");
  try {
    const res = await fetch(`${OWNERSHIP_API}/by-framework/${frameworkCode}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

// ── Sort helpers ───────────────────────────────────────────────────────────
function naturalSortKey(code = "") {
  return code
    .split(/(\d+)/)
    .map((p) => (p !== "" && !isNaN(p) ? p.padStart(8, "0") : p.toLowerCase()))
    .join("");
}

const SOC2_PREFIX_ORDER = ["CC", "A", "C", "PI", "P"];
function soc2SortKey(code = "") {
  const upper = code.trim().toUpperCase();
  const prefix = (upper.match(/^([A-Z]+)/) || ["", ""])[1];
  const idx = SOC2_PREFIX_ORDER.indexOf(prefix);
  return (idx >= 0 ? String(idx).padStart(2, "0") : "99") + naturalSortKey(code);
}

function isoSortKey(code = "") {
  const isNumeric = /^\d/.test(code.trim());
  return (isNumeric ? "0" : "1") + naturalSortKey(code);
}

function frameworkSortKey(code = "", fw = "") {
  const c = code.trim().toUpperCase();
  if (fw === "SOC2") return soc2SortKey(c);
  if (fw === "KSA_PDPL") {
    const num = c.replace(/^ARTICLE-?/, "");
    return "0:" + num.split(".").map((n) => n.padStart(5, "0")).join(".");
  }
  const isAnnex = c.startsWith("A.");
  const isNumeric = /^\d+(\.\d+)*$/.test(c);
  const bucket = isNumeric ? "0" : isAnnex ? "1" : "2";
  const normalized = isNumeric
    ? c.split(".").map((n) => n.padStart(5, "0")).join(".")
    : isAnnex
      ? c.replace("A.", "").split(".").map((n) => n.padStart(5, "0")).join(".")
      : c;
  return `${bucket}:${normalized}`;
}

// ── Status helpers ─────────────────────────────────────────────────────────
function deriveStatus(soaEntry, doc) {
  if (!soaEntry || !doc) return "to_upload";
  if (doc.deleted) return "rework";
  if (!doc.approvalDate) return "to_approve";
  if (doc.nextApprovalDate && new Date(doc.nextApprovalDate) < new Date()) return "rework";
  return "approved";
}

const STATUS_CONFIG = {
  to_upload: { label: "To Upload", bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" },
  to_approve: { label: "To Approve", bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  live: { label: "Live", bg: "#dcfce7", color: "#166534", border: "#86efac" },
  rework: { label: "Rework", bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
  approved: { label: "Approved", bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.to_upload;
  return (
    <span style={{
      display: "inline-block", fontSize: "11px", fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
      padding: "3px 9px", borderRadius: "12px", whiteSpace: "nowrap", letterSpacing: "0.2px",
    }}>
      {cfg.label}
    </span>
  );
};

// ── Badges ─────────────────────────────────────────────────────────────────
const FrameworkBadge = ({ framework, color }) => {
  const hex = color || "#64748b";
  const c = { bg: `${hex}18`, border: hex, text: hex };
  return (
    <span style={{
      display: "inline-block", fontSize: "10px", fontWeight: 700,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: "2px 7px", borderRadius: "10px", whiteSpace: "nowrap",
    }}>
      {framework}
    </span>
  );
};

const FrameworkCell = ({ framework, mappings, colorMap }) => {
  const mapped = useMemo(() => {
    if (!mappings || mappings.length === 0) return [];
    const seen = new Set();
    return mappings.reduce((acc, m) => {
      if (m.framework && m.framework !== framework && !seen.has(m.framework)) {
        seen.add(m.framework);
        acc.push(m.framework);
      }
      return acc;
    }, []);
  }, [mappings, framework]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
      <FrameworkBadge framework={framework} color={colorMap[framework]} />
      {mapped.map((fw) => <FrameworkBadge key={fw} framework={fw} color={colorMap[fw]} />)}
    </div>
  );
};

// ── Sortable column header ─────────────────────────────────────────────────
const SortableHeader = ({ label, subLabel, sortKey, currentSort, onSort, style = {} }) => {
  const isActive = currentSort.key === sortKey;
  const isAsc = isActive && currentSort.dir === "asc";
  const isDesc = isActive && currentSort.dir === "desc";
  return (
    <th onClick={() => onSort(sortKey)} style={{
      padding: "12px 14px", textAlign: "center", borderBottom: "2px solid #e6e6e6",
      fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
      background: isActive ? "#f0f4ff" : "#f8f9fa", transition: "background 0.15s", ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
        <span>{label}</span>
        {isAsc ? <ArrowUp size={13} style={{ color: "#667eea" }} />
          : isDesc ? <ArrowDown size={13} style={{ color: "#667eea" }} />
            : <ArrowUpDown size={13} style={{ color: "#bbb" }} />}
      </div>
      {subLabel && (
        <span style={{ display: "block", fontSize: "9px", fontWeight: 500, color: "#8b5cf6", marginTop: "2px" }}>
          {subLabel}
        </span>
      )}
    </th>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── ADD TASK MODAL  (NEW — self-contained, zero impact on existing logic) ────
// ─────────────────────────────────────────────────────────────────────────────
const TASK_PRIORITY = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };
const PRIORITY_CFG = {
  Low:      { color: "#2f9e44", bg: "#ebfbee", icon: "▼" },
  Medium:   { color: "#f59f00", bg: "#fff9db", icon: "■" },
  High:     { color: "#e8590c", bg: "#fff4e6", icon: "▲" },
  Critical: { color: "#c92a2a", bg: "#fff5f5", icon: "⚑" },
};

function AddTaskModal({ row, user, users, departments, onClose, onSuccess }) {
  const today = new Date().toISOString().split("T")[0];
  const currentUserName = user?.name || user?.username || "System";

  // Build employee options from all users in the org
  const empOptions = useMemo(() => {
    return (users || []).filter((u) => u.name).map((u) => ({
      value: String(u._id || u.id || ""),
      label: u.name,
    }));
  }, [users]);

  const [form, setForm] = useState({
    department: "",
    employeeId: "",
    employee: "",
    employeeName: "",
    description: row
      ? `Policy: ${row.docName} | Control: ${row.controlCode} (${row.cId})`
      : "",
    startDate: today,
    endDate: "",
    priority: TASK_PRIORITY.MEDIUM,
    remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setF = (patch) => setForm((p) => ({ ...p, ...patch }));

  const handleSave = async () => {
    if (!form.department || !form.startDate || !form.endDate || !form.description.trim()) {
      setError("Please fill all required fields (Department, Description, Start Date, End Date).");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be before start date.");
      return;
    }
    setError("");

    // ── resolve assignee (mirrors TaskManagement.saveTask logic exactly) ──
    let employeeName = form.employeeName || form.employee || "";
    if (!employeeName) {
      // auto-assign: prefer risk owner of the chosen department
      const owner = users.find((u) => {
        const dObj = departments.find((d) => String(d._id || d.id) === String(u.department));
        const isOwner = Array.isArray(u.role) ? u.role.includes("risk_owner") : u.role === "risk_owner";
        return dObj?.name === form.department && isOwner;
      });
      employeeName = owner ? owner.name : currentUserName;
    }

    // resolve emails exactly as TaskManagement does (stored on task so mail-service needs no changes)
    const assigneeUser = users.find((u) => u.name === employeeName);
    const employeeEmail = assigneeUser?.email || assigneeUser?.emailAddress || "";
    const reporterUser = users.find((u) => u.name === currentUserName);
    const reporterEmail = reporterUser?.email || reporterUser?.emailAddress || user?.email || "";

    setSaving(true);
    try {
      /**
       * Payload is IDENTICAL in shape to TaskManagement.saveTask payload.
       * source: "Compliance" + controlId flags it as a Compliance task in
       * TaskManagement's getSourceModule() helper — no backend change needed.
       */
      const payload = {
        // context linkage
        riskId:         undefined,
        auditId:        undefined,
        source:         "Policy",          // ← shows "Compliance" badge in TaskManagement
        controlId:      row?.cId || "",        // ← identifies the originating control
        controlCode:    row?.controlCode || "",
        framework:      row?.framework || "",
        policyName:     row?.docName || "",

        // standard task fields (unchanged from TaskManagement)
        organization:   user?.organization,
        department:     form.department,
        employee:       employeeName,
        employeeName:   employeeName,
        employeeEmail:  employeeEmail,
        description:    form.description.trim(),
        startDate:      form.startDate,
        endDate:        form.endDate,
        status:         "To-Do",
        priority:       form.priority || TASK_PRIORITY.MEDIUM,
        reporter:       currentUserName,
        reporterEmail:  reporterEmail,
        remarks:        form.remarks,
        createdAt:      new Date().toISOString(),
        updatedAt:      new Date().toISOString(),
      };

      await taskService.saveTask(payload, currentUserName);

      captureActivity({
        action: ACTIONS.CREATE,
        item: `Documentation · Created task for control ${row?.cId} — "${form.description.trim()}"`,
        url: "/documentation/mld",
      });

      onSuccess?.();
      onClose();
    } catch (e) {
      console.error("Add task failed:", e);
      setError("Failed to create task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Modal overlay ──────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 10001, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
        fontFamily: "'DM Sans', sans-serif",
        animation: "taskModalIn 0.22s ease",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #0d2241 100%)",
          borderRadius: "16px 16px 0 0", padding: "18px 22px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#868e96", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
                MLD → Task Management
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px" }}>
                Create Task
              </div>
              {row && (
                <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#3b5bdb22", color: "#93c5fd", border: "1px solid #3b5bdb55", padding: "2px 8px", borderRadius: 8 }}>
                    {row.cId}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#7c3aed22", color: "#c4b5fd", border: "1px solid #7c3aed55", padding: "2px 8px", borderRadius: 8 }}>
                    {row.controlCode}
                  </span>
                  <span style={{ fontSize: 10, color: "#6c757d", padding: "2px 6px" }}>
                    {row.docName}
                  </span>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8,
              width: 32, height: 32, cursor: "pointer", color: "#adb5bd",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 22px 0" }}>
          <div style={{ display: "grid", gap: 14 }}>

            {/* Department */}
            <div>
              <label style={labelStyle}>Department <span style={{ color: "#c92a2a" }}>*</span></label>
              <select
                value={form.department}
                onChange={(e) => setF({ department: e.target.value, employee: "", employeeName: "", employeeId: "" })}
                style={selectStyle}
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Assign To */}
            <div>
              <label style={labelStyle}>Assign To</label>
              <select
                value={form.employeeId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = users.find((u) => String(u._id || u.id) === val);
                  const name = matched?.name || "";
                  setF({ employeeId: val, employee: name, employeeName: name });
                }}
                style={selectStyle}
              >
                <option value="">— Auto Assign (Risk Owner) —</option>
                {empOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {form.employeeName && (
                <div style={{ marginTop: 4, fontSize: 11, color: "#2f9e44", fontWeight: 600 }}>
                  ✓ Assigned to: {form.employeeName}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Task Description <span style={{ color: "#c92a2a" }}>*</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setF({ description: e.target.value })}
                rows={3}
                placeholder="Describe the task…"
                style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
              />
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Start Date <span style={{ color: "#c92a2a" }}>*</span></label>
                <input
                  type="date" value={form.startDate} min={today}
                  onChange={(e) => setF({ startDate: e.target.value, endDate: form.endDate < e.target.value ? "" : form.endDate })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Date <span style={{ color: "#c92a2a" }}>*</span></label>
                <input
                  type="date" value={form.endDate} min={form.startDate || today}
                  onChange={(e) => setF({ endDate: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label style={labelStyle}>Priority</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.values(TASK_PRIORITY).map((p) => {
                  const cfg = PRIORITY_CFG[p];
                  const sel = form.priority === p;
                  return (
                    <button
                      key={p} type="button"
                      onClick={() => setF({ priority: p })}
                      style={{
                        padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        border: `1.5px solid ${sel ? cfg.color : "#e9ecef"}`,
                        background: sel ? cfg.bg : "#fff",
                        color: sel ? cfg.color : "#868e96",
                        transition: "all 0.15s",
                      }}
                    >
                      {cfg.icon} {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label style={labelStyle}>Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setF({ remarks: e.target.value })}
                rows={2} placeholder="Optional notes…"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: "#c92a2a", fontWeight: 600, background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 12px" }}>
                ⚠ {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e9ecef",
            background: "#fff", color: "#495057", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            style={{
              padding: "9px 20px", borderRadius: 8, border: "none",
              background: saving ? "#adb5bd" : "#0052CC",
              color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {saving ? "Creating…" : <><Plus size={14} /> Create Task</>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes taskModalIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}

// shared micro-styles for AddTaskModal inputs
const labelStyle = {
  fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#343a40",
};
const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #e9ecef",
  fontSize: 13, fontFamily: "inherit", outline: "none", background: "#f8f9fa",
  boxSizing: "border-box",
};
const selectStyle = {
  ...inputStyle, cursor: "pointer",
};

// ─────────────────────────────────────────────────────────────────────────────
// ── MLD Component ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const MLD = () => {
  const router = useRouter();
const [user, setUser] = useState(() => {
  if (typeof window === "undefined") return null;

  const storedUser = sessionStorage.getItem("user");

  try {
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Failed to parse user from sessionStorage:", error);
    return null;
  }
});
  const { selectedFrameworks, toggleFramework, isAllSelected, availableFrameworks } = useFramework();
  const fwColorMap = useMemo(
    () => Object.fromEntries(availableFrameworks.map((fw) => [fw.code, fw.color])),
    [availableFrameworks]
  );

  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null, showCancel: false });
  const [userMap, setUserMap] = useState({});
  const [docVersions, setDocVersions] = useState({});
  const [showButtons, setShowButtons] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ open: false, docId: null, comment: "" });
  const [backendControls, setBackendControls] = useState([]);
  const [controlsLoading, setControlsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [soas, setSoas] = useState([]);
  const [uploading, setUploading] = useState({});
  const [soaSearch, setSoaSearch] = useState("");
  const [soaSort, setSoaSort] = useState("framework");
  const [colSort, setColSort] = useState({ key: "uploadDate", dir: "desc" });
  const [uploadFilter, setUploadFilter] = useState("ALL");
  const [ownershipMap, setOwnershipMap] = useState({});
  const [ownershipLoading, setOwnershipLoading] = useState(false);

  // ── NEW: Add Task state ────────────────────────────────────────────────────
  const [addTaskModal, setAddTaskModal] = useState({ open: false, row: null });
  const [taskUsers, setTaskUsers] = useState([]);
  const [taskDepartments, setTaskDepartments] = useState([]);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState("");

  // Load users + departments once (needed for AddTaskModal) — does NOT touch
  // any existing state; purely additive.
  useEffect(() => {
    if (!user?.organization) return;
    getAllUsers()
      .then((r) => Array.isArray(r)
        ? setTaskUsers(r.filter((u) => u.organization === user.organization))
        : [])
      .catch(console.error);
    getDepartments()
      .then((d) => Array.isArray(d)
        ? setTaskDepartments(d.filter((dept) => dept.organization === user.organization))
        : [])
      .catch(console.error);
  }, [user?.organization]); // eslint-disable-line

  const fwLabelToCode = useMemo(
    () => Object.fromEntries(availableFrameworks.map((fw) => [fw.id, fw.code])),
    [availableFrameworks]
  );
  const fwOrder = useMemo(
    () => Object.fromEntries(availableFrameworks.map((fw, i) => [fw.code, i])),
    [availableFrameworks]
  );

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mappingsByControl, setMappingsByControl] = useState({});
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [joyrideRun, setJoyrideRun] = useState(false);
  const [frameworkFilter, setFrameworkFilter] = useState("ALL");
  const [uploadTimestamps, setUploadTimestamps] = useState({});

  const joyrideSteps = [
    { target: "#mld-header", content: "Master List of Policies." },
    { target: "#mld-search", content: "Filter by policy name." },
    { target: "#mld-sort", content: "Sort policies." },
    { target: "#mld-upload-filter", content: "Filter by upload status." },
    { target: "#mld-upload-table", content: "All required policies." },
    { target: "#mld-upload-btn", content: "Click to upload a policy." },
  ];

  useEffect(() => {
    const h = () => {
      setShowButtons(window.scrollY <= lastScrollY);
      setLastScrollY(window.scrollY);
    };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, [lastScrollY]);

  useEffect(() => {
    captureActivity({
      action: ACTIONS.PAGE_LOAD,
      item: [{ detail: "Documentation · Viewed Master List of Policies" }],
      url: "/documentation/mld",
    });
  }, []);

  useEffect(() => {
    if (previewModalOpen) {
      captureActivity({
        action: ACTIONS.CLICK,
        item: [{ detail: "Documentation · Opened policy preview" }],
        url: "/documentation/mld",
      });
    }
  }, [previewModalOpen]);

  useEffect(() => {
    if (deleteModal.open) {
      captureActivity({
        action: ACTIONS.CLICK,
        item: [{ detail: "Documentation · Opened delete confirmation", docId: deleteModal.docId }],
        url: "/documentation/mld",
      });
    }
  }, [deleteModal.open]);

  useEffect(() => {
    if (availableFrameworks.length === 0) return;
    (async () => {
      setMappingsLoading(true);
      try {
        const codes = availableFrameworks.map((fw) => fw.code);
        const pairs = codes.flatMap((src) =>
          codes.filter((tgt) => tgt !== src).map((tgt) => [src, tgt])
        );
        const results = await Promise.all(pairs.map(([src, tgt]) => fetchMappingPair(src, tgt)));
        const map = {};
        pairs.forEach(([src, tgt], i) => {
          const data = Array.isArray(results[i]) ? results[i] : [];
          data.forEach((m) => {
            const k = `${src}:${m.sourceControlCode}`;
            if (!map[k]) map[k] = [];
            if (!map[k].find((e) => e.code === m.targetControlCode && e.framework === tgt))
              map[k].push({ code: m.targetControlCode, framework: tgt });
          });
        });
        Object.keys(map).forEach((k) =>
          map[k].sort((a, b) => naturalSortKey(a.code).localeCompare(naturalSortKey(b.code)))
        );
        setMappingsByControl(map);
      } catch (err) {
        console.error("Mappings error:", err);
      } finally {
        setMappingsLoading(false);
      }
    })();
  }, [availableFrameworks]);

  useEffect(() => {
    if (availableFrameworks.length === 0) return;
    (async () => {
      setOwnershipLoading(true);
      try {
        const results = await Promise.all(
          availableFrameworks.map((fw) => fetchOwnershipsByFramework(fw.code))
        );
        const map = {};
        availableFrameworks.forEach((fw, i) => {
          const records = Array.isArray(results[i]) ? results[i] : [];
          records.forEach((r) => {
            const key = `${(r.frameworkCode || "").trim()}:${(r.controlCode || "").trim()}`;
            if (!map[key]) map[key] = { owner: null, manager: null };
            if (r.ownerRole === "process_owner") map[key].owner = r;
            else if (r.ownerRole === "process_manager") map[key].manager = r;
          });
        });
        setOwnershipMap(map);
      } catch (err) {
        console.error("Ownership error:", err);
      } finally {
        setOwnershipLoading(false);
      }
    })();
  }, [availableFrameworks]);

  useEffect(() => {
    if (availableFrameworks.length === 0) return;
    (async () => {
      setControlsLoading(true);
      try {
        const results = await Promise.all(
          availableFrameworks.map((fw) => controlService.getControlsByFramework(fw.code).catch(() => []))
        );
        setBackendControls(
          availableFrameworks.flatMap((fw, i) =>
            (results[i] || []).map((c) => ({ ...c, _framework: fw.code }))
          )
        );
      } catch (err) {
        console.error("Controls error:", err);
        setBackendControls([]);
      } finally {
        setControlsLoading(false);
      }
    })();
  }, [availableFrameworks]);

  const refreshDocuments = async () => {
    try {
      const docs = (await documentationService.getDocuments()) || [];
      const orgDocs = docs.filter((d) => d.organization === user?.organization);
      setDocuments(orgDocs);
      const soaList = (await documentationService.getSoAEntries()) || [];
      const orgSoas = soaList.filter((s) => s.organization === user?.organization);
      setSoas(orgSoas);
    } catch (err) {
      console.error("Docs error:", err);
      setDocuments([]);
      setSoas([]);
    }
  };

  useEffect(() => {
    refreshDocuments();
  }, []); // eslint-disable-line

  // Build rows
  const allDocRows = useMemo(() => {
    if (controlsLoading || backendControls.length === 0) return [];
    const soaMap = {};
    soas.forEach((soa) => {
      const fw = (soa.framework || "").trim();
      const cat = String(soa.category).trim();
      const docRef = (soa.documentRef?.[0] || "").trim();
      if (!cat) return;
      if (fw && docRef) soaMap[`${fw}:${cat}:${docRef}`] = soa;
      if (fw) soaMap[`${fw}:${cat}`] = soa;
      if (!fw && docRef) soaMap[`${cat}:${docRef}`] = soa;
      if (!fw) soaMap[cat] = soa;
    });

    const rows = [];
    const seen = new Set();
    backendControls.forEach((ctrl) => {
      const docsList = ctrl.documents && ctrl.documents.length > 0
        ? ctrl.documents
        : [{ doc: "", type: "", dept: "" }];
      const framework = ctrl._framework || "ISO27001";
      const cat = (ctrl.controlCode || "").trim();
      if (!cat) return;

      docsList.forEach(({ doc, type, dept }) => {
        if (!doc) return;
        const docName = doc.trim();
        const key = `${framework}:${cat}:${docName}`;
        if (seen.has(key)) return;
        seen.add(key);
        const soaEntry =
          soaMap[`${framework}:${cat}:${docName}`] || soaMap[`${framework}:${cat}`] || null;
        const cId = (ctrl.unifiedId || "").trim() || `C-${framework}-${cat}`;
        rows.push({
          rowKey: key, cId, docName, docType: type || "", docDept: dept || "",
          controlCode: cat, controlTitle: ctrl.title || ctrl.description || "",
          framework, soaEntry, controlMongoId: ctrl._id || ctrl.id || null,
        });
      });
    });
    return rows;
  }, [backendControls, controlsLoading, soas]);

  // ── Column sort handler ────────────────────────────────────────────────
  const handleColSort = useCallback((key) => {
    setColSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
    setSoaSort("none");
  }, []);

  // Filter + Sort
  const filteredDocRows = useMemo(() => {
    let list = [...allDocRows];

    if (!isAllSelected) {
      const mldFrameworks = selectedFrameworks.map((fw) => fwLabelToCode[fw]).filter(Boolean);
      list = list.filter((r) => mldFrameworks.includes(r.framework));
    }

    if (uploadFilter !== "ALL") {
      list = list.filter((r) => {
        const soaId = r.soaEntry?.id ?? null;
        const doc = soaId
          ? documents.filter((d) => String(d.soaId) === String(soaId) && !d.deleted).sort((a, b) => b.version - a.version)[0]
          : null;
        const isUploaded = !!doc;
        return uploadFilter === "uploaded" ? isUploaded : !isUploaded;
      });
    }

    if (soaSearch.trim()) {
      const q = soaSearch.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.docName.toLowerCase().includes(q) ||
          r.controlCode.toLowerCase().includes(q) ||
          r.cId.toLowerCase().includes(q) ||
          (r.controlTitle || "").toLowerCase().includes(q) ||
          (mappingsByControl[`${r.framework}:${r.controlCode}`] || []).some((m) =>
            m.code.toLowerCase().includes(q)
          )
      );
    }

    if (colSort.key && soaSort === "none") {
      list.sort((a, b) => {
        const getDoc = (row) => {
          const soaId = row.soaEntry?.id ?? null;
          if (!soaId) return null;
          return documents
            .filter((d) => String(d.soaId) === String(soaId) && !d.deleted)
            .sort((x, y) => y.version - x.version)[0] || null;
        };
        let valA, valB;
        switch (colSort.key) {
          case "cId": valA = a.cId.toLowerCase(); valB = b.cId.toLowerCase(); break;
          case "uploadDate": {
            const dA = getDoc(a); const dB = getDoc(b);
            valA = dA?.createdAt ? new Date(dA.createdAt).getTime() : 0;
            valB = dB?.createdAt ? new Date(dB.createdAt).getTime() : 0; break;
          }
          case "submissionDate": {
            const dA = getDoc(a); const dB = getDoc(b);
            valA = dA?.approvalDate ? new Date(dA.approvalDate).getTime() : 0;
            valB = dB?.approvalDate ? new Date(dB.approvalDate).getTime() : 0; break;
          }
          case "reviewDate": {
            const dA = getDoc(a); const dB = getDoc(b);
            valA = dA?.nextApprovalDate ? new Date(dA.nextApprovalDate).getTime() : 0;
            valB = dB?.nextApprovalDate ? new Date(dB.nextApprovalDate).getTime() : 0; break;
          }
          case "docName": valA = a.docName.toLowerCase(); valB = b.docName.toLowerCase(); break;
          case "controlCode":
            valA = frameworkSortKey(a.controlCode, a.framework);
            valB = frameworkSortKey(b.controlCode, b.framework); break;
          case "status": {
            const order = { approved: 0, live: 1, to_approve: 2, rework: 3, to_upload: 4 };
            const dA = getDoc(a); const dB = getDoc(b);
            valA = order[deriveStatus(a.soaEntry, dA)] ?? 9;
            valB = order[deriveStatus(b.soaEntry, dB)] ?? 9; break;
          }
          default: return 0;
        }
        if (typeof valA === "string") {
          return colSort.dir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return colSort.dir === "asc" ? valA - valB : valB - valA;
      });
      return list;
    }

    switch (soaSort) {
      case "framework":
        list.sort((a, b) => {
          const fd = (fwOrder[a.framework] ?? 9) - (fwOrder[b.framework] ?? 9);
          return fd !== 0
            ? fd
            : frameworkSortKey(a.controlCode, a.framework).localeCompare(
              frameworkSortKey(b.controlCode, b.framework)
            );
        });
        break;
      case "name": list.sort((a, b) => a.docName.localeCompare(b.docName)); break;
      case "control_asc":
        list.sort((a, b) => {
          if (frameworkFilter !== "ALL") {
            return frameworkSortKey(a.controlCode, a.framework).localeCompare(
              frameworkSortKey(b.controlCode, b.framework)
            );
          }
          const fd = (fwOrder[a.framework] ?? 9) - (fwOrder[b.framework] ?? 9);
          return fd !== 0
            ? fd
            : frameworkSortKey(a.controlCode, a.framework).localeCompare(
              frameworkSortKey(b.controlCode, b.framework)
            );
        });
        break;
      case "control_desc":
        list.sort((a, b) => {
          if (frameworkFilter !== "ALL") {
            return frameworkSortKey(b.controlCode, b.framework).localeCompare(
              frameworkSortKey(a.controlCode, a.framework)
            );
          }
          const fd = (fwOrder[b.framework] ?? 9) - (fwOrder[a.framework] ?? 9);
          return fd !== 0
            ? fd
            : frameworkSortKey(b.controlCode, b.framework).localeCompare(
              frameworkSortKey(a.controlCode, a.framework)
            );
        });
        break;
      case "soa_first":
        list.sort((a, b) => {
          if (a.soaEntry && !b.soaEntry) return -1;
          if (!a.soaEntry && b.soaEntry) return 1;
          return a.docName.localeCompare(b.docName);
        });
        break;
      case "date_newest":
        list.sort((a, b) =>
          (b.soaEntry?.createdAt ? new Date(b.soaEntry.createdAt).getTime() : 0) -
          (a.soaEntry?.createdAt ? new Date(a.soaEntry.createdAt).getTime() : 0)
        );
        break;
      case "date_oldest":
        list.sort((a, b) =>
          (a.soaEntry?.createdAt ? new Date(a.soaEntry.createdAt).getTime() : 0) -
          (b.soaEntry?.createdAt ? new Date(b.soaEntry.createdAt).getTime() : 0)
        );
        break;
      default: break;
    }
    return list;
  }, [
    allDocRows, soaSearch, soaSort, colSort, frameworkFilter,
    mappingsByControl, uploadFilter, documents, isAllSelected,
    selectedFrameworks, fwLabelToCode, fwOrder,
  ]);

  // Counts
  const totalDocsToUpload = allDocRows.length;
  const docCount = useMemo(() => {
    const soaIds = new Set(soas.map((s) => s.id.toString()));
    return documents.filter((d) => soaIds.has(d.soaId?.toString())).length;
  }, [documents, soas]);

  const frameworkCounts = useMemo(
    () => Object.fromEntries(
      availableFrameworks.map((fw) => [fw.code, allDocRows.filter((r) => r.framework === fw.code).length])
    ),
    [allDocRows, availableFrameworks]
  );

  const getLatestDocForSoA = (soaId) => {
    const docs = documents
      .filter((d) => String(d.soaId) === String(soaId))
      .sort((a, b) => b.version - a.version);
    return docs.find((d) => !d.deleted) || docs[0];
  };

  const handlePreviewClick = (soaEntry) => {
    const doc = documents.find((d) => String(d.soaId) === String(soaEntry.id) && !d.deleted);
    if (doc) {
      captureActivity({
        action: ACTIONS.CLICK,
        item: "Documentation · Previewed policy for control " + (soaEntry.clause || soaEntry.controlCode || soaEntry.id),
        url: "/documentation/mld",
      });
      const baseUrl = `${process.env.NEXT_PUBLIC_SP}/doc-service`;
      setPreviewUrl(baseUrl + encodeURI(doc.url.startsWith("/") ? doc.url : `/${doc.url}`));
      setPreviewModalOpen(true);
    } else {
      setModal({
        isOpen: true, title: "No Document Found", message: "No Document to preview",
        showCancel: false, onConfirm: () => setModal((m) => ({ ...m, isOpen: false })),
      });
    }
  };

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
    setPreviewUrl("");
  };

  const handleSingleButtonUpload = async (soaId) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setUploading((p) => ({ ...p, [soaId]: true }));
        await documentationService.uploadDocument({
          file, soaId, controlId: "",
          uploaderName: user?.name ?? "Unknown",
          departmentName: user?.departments?.[0]?.name ?? "N/A",
          organization: user?.organization,
        });
        captureActivity({
          action: ACTIONS.CREATE,
          item: "Documentation · Uploaded policy '" + file.name + "' for SoA " + soaId,
          url: "/documentation/mld",
        });
        setUploadTimestamps((prev) => ({ ...prev, [soaId]: Date.now() }));
        setModal({
          isOpen: true, title: "Success", message: "Policy uploaded successfully!",
          showCancel: false, onConfirm: () => setModal((m) => ({ ...m, isOpen: false })),
        });
        await refreshDocuments();
      } catch (err) {
        console.error("Upload failed:", err);
        setModal({
          isOpen: true, title: "Failure", message: "Upload Failed — please try again.",
          showCancel: false, onConfirm: () => setModal((m) => ({ ...m, isOpen: false })),
        });
      } finally {
        setUploading((p) => ({ ...p, [soaId]: false }));
      }
    };
    input.click();
  };

  const sortAscLabel = () => {
    if (frameworkFilter === "SOC2") return "Control ID (CC → A → C → PI → P)";
    if (frameworkFilter === "KSA_PDPL") return "Control ID (Article-1 → Article-2 → …)";
    if (frameworkFilter === "ALL") return "Control ID (↑ Asc, grouped by framework)";
    return "Control ID (4.x…10.x → A.x…)";
  };
  const sortDescLabel = () => {
    if (frameworkFilter === "SOC2") return "Control ID (P → PI → C → A → CC)";
    if (frameworkFilter === "KSA_PDPL") return "Control ID (… → Article-2 → Article-1)";
    if (frameworkFilter === "ALL") return "Control ID (↓ Desc, grouped by framework)";
    return "Control ID (Z → A.x → 10.x…4.x)";
  };

  const filterPill = (active) => ({
    padding: "6px 14px", borderRadius: "20px",
    border: `1.5px solid ${active ? "#667eea" : "#dde3ef"}`,
    background: active ? "#667eea" : "#f7f9fc",
    color: active ? "#fff" : "#555",
    fontWeight: active ? 700 : 500, fontSize: "12px",
    cursor: "pointer", transition: "all 0.15s ease",
  });

  return (
    <div style={{ padding: "10px", maxWidth: "1400px", margin: "0px auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .mld-table-wrapper {
          width: 100%; overflow-x: auto;
          max-height: 72vh; overflow-y: auto; border-radius: 8px;
        }
        .mld-table {
          width: 100%; border-collapse: separate;
          border-spacing: 0; min-width: 1500px;
        }
        .mld-table thead tr th {
          position: sticky; top: 0; z-index: 10;
          background: #f8f9fa; box-shadow: 0 2px 0 #e6e6e6;
        }
        .mld-table tbody tr:hover td { background: inherit; }
        .ownership-chip {
          display: inline-block; font-size: 10px;
          padding: 2px 7px; border-radius: 8px;
          font-weight: 600; white-space: nowrap;
        }
        /* ── Add Task button ── */
        .add-task-btn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 6px; border: none;
          background: #0052CC; color: #fff;
          font-size: 11px; font-weight: 700; cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .add-task-btn:hover { background: #003d99; transform: translateY(-1px); }
        .add-task-btn:active { transform: translateY(0); }
      `}</style>

      <Joyride
        steps={joyrideSteps} run={joyrideRun} continuous scrollToFirstStep showSkipButton
        styles={{ options: { zIndex: 10000 } }}
        callback={({ status }) => {
          if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) setJoyrideRun(false);
        }}
      />

      {[
        { label: "Tutorial", bg: "linear-gradient(90deg,#ffb74d,#ff9800)", onClick: () => setJoyrideRun(true) },
        { label: "← Back to Dashboard", bg: "#005FCC", onClick: () => router.push("/documentation") },
      ].map(({ label, bg, onClick }) => (
        <button key={label} onClick={onClick} style={{
          position: "sticky", top: 0, margin: "10px", padding: "10px 24px",
          borderRadius: "8px", background: bg, border: "none", color: "#fff",
          fontWeight: 600, fontSize: "14px", cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "transform 0.3s ease,opacity 0.3s ease",
          zIndex: 999,
          transform: showButtons ? "translateY(0)" : "translateY(-100%)",
          opacity: showButtons ? 1 : 0,
        }}>
          {label}
        </button>
      ))}

      {/* Header */}
      <div id="mld-header" style={{
        background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
        borderRadius: "12px", padding: "20px", marginBottom: "20px",
        boxShadow: "0 5px 20px rgba(102,126,234,0.25)",
        border: "1px solid rgba(255,255,255,0.1)", color: "white",
      }}>
        <h1 style={{ marginBottom: "8px", fontSize: "28px", fontWeight: 700 }}>Policies</h1>
        <p style={{ fontSize: "16px", opacity: 0.95, marginBottom: "12px" }}>
          Upload and manage your policies
        </p>
        {controlsLoading ? (
          <p style={{ fontSize: "14px", opacity: 0.8 }}>Loading controls from server…</p>
        ) : (
          <div style={{ display: "flex", gap: "24px", fontSize: "14px", opacity: 0.95, flexWrap: "wrap" }}>
            <div><span style={{ fontWeight: 600 }}>Total:</span> {totalDocsToUpload}</div>
            <div><span style={{ fontWeight: 600 }}>Uploaded:</span> {docCount}</div>
            <div><span style={{ fontWeight: 600 }}>SoA Linked:</span> {allDocRows.filter((r) => r.soaEntry).length}</div>
            {availableFrameworks.map((fw) => (
              <div key={fw.code}>
                <span style={{ fontWeight: 600 }}>{fw.label}:</span> {frameworkCounts[fw.code] || 0}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div style={{
        display: "flex", gap: "12px", alignItems: "center",
        marginBottom: "12px", justifyContent: "space-between", flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            id="mld-search" type="text"
            placeholder="Search policy, control ID or C-ID…"
            value={soaSearch} onChange={(e) => setSoaSearch(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", minWidth: "240px" }}
          />
          <select
            id="mld-sort" value={soaSort}
            onChange={(e) => { setSoaSort(e.target.value); setColSort({ key: null, dir: "asc" }); }}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", background: "white" }}
          >
            <option value="framework">By Framework (27001 → 27701 → SOC2 → 42001 → PDPL)</option>
            <option value="name">Policy Name (A → Z)</option>
            <option value="control_asc">{sortAscLabel()}</option>
            <option value="control_desc">{sortDescLabel()}</option>
            <option value="soa_first">SoA Linked First</option>
            <option value="date_newest">SoA Date (Newest)</option>
            <option value="date_oldest">SoA Date (Oldest)</option>
            {soaSort === "none" && <option value="none">Column Sort Active</option>}
          </select>

          <div id="mld-upload-filter" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#666" }}>Uploaded:</span>
            {[
              { val: "ALL", label: "All" },
              { val: "uploaded", label: "✓ Uploaded" },
              { val: "not_uploaded", label: "✗ Not Uploaded" },
            ].map(({ val, label }) => (
              <button key={val} style={filterPill(uploadFilter === val)} onClick={() => setUploadFilter(val)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ color: "#666", fontSize: "14px", marginRight: "150px" }}>
          Showing {filteredDocRows.length} of {totalDocsToUpload}
        </div>
      </div>

      {mappingsLoading && (
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#8b5cf6", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "2px solid #8b5cf6", borderTop: "2px solid transparent", animation: "spin 0.8s linear infinite" }} />
          Loading cross-framework mappings…
        </div>
      )}

      {/* Task success toast */}
      {taskSuccessMsg && (
        <div style={{
          marginBottom: "10px", padding: "10px 16px", borderRadius: "8px",
          background: "#d1fae5", border: "1px solid #6ee7b7", color: "#065f46",
          fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px",
        }}>
          ✓ {taskSuccessMsg}
          <button
            onClick={() => setTaskSuccessMsg("")}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#065f46", fontSize: "16px" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: "white", borderRadius: "12px", padding: "20px",
        marginBottom: "28px", boxShadow: "0 3px 15px rgba(0,0,0,0.06)",
        border: "1px solid #e9ecef",
      }}>
        <h2 style={{
          color: "#2c3e50", marginBottom: "16px", fontSize: "18px",
          borderBottom: "3px solid #667eea", paddingBottom: "8px",
        }}>
          Policies
        </h2>

        <div className="mld-table-wrapper">
          <table id="mld-upload-table" className="mld-table">
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <SortableHeader label="Control ID" sortKey="cId" currentSort={colSort} onSort={handleColSort} />
                <th style={thStyle}>Policy Name</th>
                <th style={thStyle}>Related Framework</th>
                <th style={thStyle}>Type</th>
                <SortableHeader label="Control Code" sortKey="controlCode" currentSort={colSort} onSort={handleColSort} />
                <th style={thStyle}>Ownership</th>
                <th style={thStyle}>Department</th>
                <SortableHeader label="CalVant Version" sortKey="version" currentSort={colSort} onSort={handleColSort} />
                <SortableHeader label="Status" sortKey="status" currentSort={colSort} onSort={handleColSort} />
                <th style={thStyle}>Submitted By</th>
                <SortableHeader label="Submission Date" sortKey="submissionDate" currentSort={colSort} onSort={handleColSort} />
                <th style={thStyle}>Approved By</th>
                <SortableHeader label="Review Date" sortKey="reviewDate" currentSort={colSort} onSort={handleColSort} />
                <th style={thStyle}>Upload</th>
                <th style={thStyle}>Remarks</th>
                {/* ── NEW column ── */}
                <th style={{ ...thStyle, background: "#f0f4ff", color: "#3b5bdb" }}>
                  Add Task
                </th>
              </tr>
            </thead>

            <tbody>
              {controlsLoading ? (
                <tr>
                  <td colSpan="16" style={{ textAlign: "center", padding: "32px", color: "#667eea" }}>
                    Loading policies from server…
                  </td>
                </tr>
              ) : filteredDocRows.length === 0 ? (
                <tr>
                  <td colSpan="16" style={{ textAlign: "center", padding: "18px", color: "#7f8c8d" }}>
                    No policies found
                  </td>
                </tr>
              ) : (
                filteredDocRows.map(
                  ({ rowKey, cId, docName, docType, docDept, controlCode, controlTitle, soaEntry, framework, controlMongoId }, idx) => {
                    const soaId = soaEntry?.id ?? null;
                    const doc = soaId ? getLatestDocForSoA(soaId) : null;
                    const isUploaded = !!doc && !doc.deleted;
                    const isSoaLinked = !!soaEntry;
                    const mappings = mappingsByControl[`${framework}:${controlCode}`] || [];
                    const rowBg = isSoaLinked ? "#f0fff4" : "#ffffff";
                    const status = deriveStatus(soaEntry, doc && !doc.deleted ? doc : null);
                    const submissionDate = doc?.approvalDate
                      ? new Date(doc.approvalDate).toISOString().split("T")[0] : "—";
                    const reviewDate = doc?.nextApprovalDate
                      ? new Date(doc.nextApprovalDate).toISOString().split("T")[0] : "—";
                    const ownership = ownershipMap[`${framework.trim()}:${controlCode.trim()}`] || {};
                    const approvedBy = doc?.approvedBy || doc?.approverName || (doc?.approvalDate ? "—" : "—");

                    // The row object we'll pass into AddTaskModal
                    const taskRow = { rowKey, cId, docName, docType, docDept, controlCode, controlTitle, soaEntry, framework, controlMongoId };

                    const handleApprove = async () => {
                      if (!doc) return;
                      const today = new Date(), next = new Date();
                      next.setDate(today.getDate() + 365);
                      try {
                        const updated = await documentationService.updateApprovalDate(doc.id, today.getTime(), next.getTime());
                        setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
                        captureActivity({
                          action: ACTIONS.UPDATE,
                          item: "Documentation · Approved policy '" + (doc.docName || doc.id) + "' for control " + (soaEntry?.clause || soaEntry?.controlCode || ""),
                          url: "/documentation/mld",
                        });
                        setModal({
                          isOpen: true, title: "Success", message: "Policy Approved",
                          showCancel: false, onConfirm: () => setModal((m) => ({ ...m, isOpen: false })),
                        });
                      } catch (err) {
                        console.error(err);
                        setModal({
                          isOpen: true, title: "Failed", message: "Approval Failed",
                          showCancel: false, onConfirm: () => setModal((m) => ({ ...m, isOpen: false })),
                        });
                      }
                    };

                    return (
                      <tr
                        key={rowKey}
                        style={{
                          borderBottom: "1px solid #f1f1f1",
                          backgroundColor: rowBg,
                          borderLeft: isSoaLinked ? "4px solid #28a745" : "4px solid transparent",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isSoaLinked ? "#e6f9ed" : "#f8f9fa"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = rowBg; }}
                      >
                        {/* Control ID */}
                        <td style={{ padding: "12px 14px", verticalAlign: "middle", maxWidth: "180px" }}>
                          <span style={{
                            display: "block", fontFamily: "monospace", fontWeight: 700,
                            color: "#3b5bdb", fontSize: "12px", background: "#f1f5f9",
                            border: "1px solid #c5d4fb", borderRadius: "5px", padding: "2px 6px",
                            whiteSpace: "nowrap", width: "fit-content",
                          }}>
                            {cId}
                          </span>
                        </td>

                        {/* Policy Name */}
                        <td
                          onClick={() => {
                            if (!soaEntry) return;
                            if (doc?.deleted || !doc?.url) {
                              setModal({ isOpen: true, title: "Document Deleted", message: "This document was deleted.", showCancel: false, onConfirm: () => setModal((m) => ({ ...m, isOpen: false })) });
                              return;
                            }
                            if (isUploaded) handlePreviewClick(soaEntry);
                          }}
                          style={{ padding: "12px 14px", verticalAlign: "middle", cursor: isUploaded && soaEntry ? "pointer" : "default", color: doc?.deleted ? "#999" : "#2c3e50" }}
                        >
                          {docName}
                          {isSoaLinked && (
                            <span style={{ display: "inline-block", marginLeft: "6px", fontSize: "10px", fontWeight: 700, background: "#28a745", color: "white", padding: "1px 6px", borderRadius: "10px", verticalAlign: "middle" }}>
                              SoA
                            </span>
                          )}
                        </td>

                        {/* Related Framework */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle" }}>
                          <FrameworkCell framework={framework} mappings={mappings} colorMap={fwColorMap} />
                        </td>

                        {/* Type */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle", color: "#6c757d", fontSize: "12px" }}>
                          {docType || "—"}
                        </td>

                        {/* Control Code + title */}
                        <td style={{ padding: "12px 14px", verticalAlign: "middle", maxWidth: "220px" }}>
                          <span style={{ display: "block", fontFamily: "monospace", fontWeight: 700, fontSize: "12px", color: "#374151" }}>
                            {controlCode}
                          </span>
                          {controlTitle && (
                            <span style={{ display: "block", fontSize: "10px", color: "#6b7280", marginTop: "4px", lineHeight: 1.4, whiteSpace: "normal", wordBreak: "break-word" }}>
                              {controlTitle}
                            </span>
                          )}
                        </td>

                        {/* Ownership */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle" }}>
                          {ownershipLoading ? (
                            <span style={{ fontSize: "11px", color: "#aaa" }}>…</span>
                          ) : ownership.owner || ownership.manager ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "center" }}>
                              {ownership.owner && (
                                <span className="ownership-chip" style={{ background: "#ede9fe", color: "#5b21b6", border: "1px solid #c4b5fd" }}>
                                  👤 {ownership.owner.ownerName || "—"}
                                </span>
                              )}
                              {ownership.manager && (
                                <span className="ownership-chip" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                                  🔧 {ownership.manager.ownerName || "—"}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#aaa", fontStyle: "italic" }}>Unassigned</span>
                          )}
                        </td>

                        {/* Department */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle", color: "#2c3e50", fontSize: "13px" }}>
                          {docDept || "—"}
                        </td>

                        {/* CalVant Version */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle", color: "#2c3e50" }}>
                          {doc?.version != null ? (
                            <span style={{ background: "#f0f4ff", color: "#3b5bdb", border: "1px solid #c5d4fb", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: 700 }}>
                              v{doc.version}
                            </span>
                          ) : "—"}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle" }}>
                          <StatusBadge status={status} />
                        </td>

                        {/* Submitted By */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle", color: "#2c3e50" }}>
                          {doc?.uploaderName ?? "—"}
                        </td>

                        {/* Submission Date */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle", color: "#2c3e50" }}>
                          {submissionDate}
                        </td>

                        {/* Approved By */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle", color: "#2c3e50" }}>
                          {doc?.approvalDate ? (approvedBy || user?.name || "—") : "—"}
                        </td>

                        {/* Review Date */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle", color: "#2c3e50" }}>
                          {reviewDate}
                        </td>

                        {/* Upload + inline actions */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                            {soaId ? (
                              <button
                                id="mld-upload-btn"
                                onClick={() => !isUploaded && handleSingleButtonUpload(soaId)}
                                disabled={isUploaded || uploading[soaId]}
                                style={{
                                  backgroundColor: isUploaded ? "#2ecc71" : "#f1f1f1",
                                  border: "1px solid #ccc", borderRadius: "6px", padding: "4px 8px",
                                  cursor: isUploaded ? "default" : "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  color: isUploaded ? "white" : "inherit", minWidth: "80px",
                                }}
                              >
                                {uploading[soaId] ? (
                                  <><UploadCloud size={16} style={{ marginRight: "4px" }} />Uploading…</>
                                ) : isUploaded ? (
                                  <Check size={20} style={{ margin: "0 25px" }} />
                                ) : (
                                  <><UploadCloud size={16} style={{ marginRight: "4px" }} />Upload</>
                                )}
                              </button>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#aaa", fontStyle: "italic", whiteSpace: "nowrap" }}>Not assessed</span>
                            )}

                            {isUploaded && soaId && (
                              <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
                                {doc?.approvalDate ? (
                                  <div style={{ backgroundColor: "#2ecc71", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
                                    Approved
                                  </div>
                                ) : (
                                  <button
                                    onClick={handleApprove}
                                    style={{ backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "11px" }}
                                  >
                                    <Calendar size={13} style={{ marginRight: "3px" }} />Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeleteModal({ open: true, docId: doc.id, comment: "" })}
                                  style={{ backgroundColor: "#f59e0b", color: "white", border: "none", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px" }}
                                >
                                  <Trash2 size={13} />Archive
                                </button>
                                <button
                                  onClick={async () => {
                                    captureActivity({ action: ACTIONS.CLICK, item: "Documentation · Checked version history for document " + doc.id, url: "/documentation/mld" });
                                    const versions = await documentationService.getDocVersions(doc.id);
                                    const safe = versions.filter((v) => v.organization === user?.organization);
                                    setDocVersions((prev) => ({ ...prev, [doc.id]: safe }));
                                    setModal({
                                      isOpen: true, title: "Version History",
                                      showCancel: false,
                                      onConfirm: () => setModal((m) => ({ ...m, isOpen: false })),
                                      message: (
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                          <thead>
                                            <tr>
                                              {["CalVant Version", "Submitted By", "Submission Date", "Remarks", "Deleted At"].map((h) => (
                                                <th key={h} style={{ padding: "6px 8px", borderBottom: "1px solid #dee2e6" }}>{h}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {safe.map((v, i) => (
                                              <tr key={i}>
                                                <td style={{ padding: "6px 8px" }}>v{v.version}</td>
                                                <td style={{ padding: "6px 8px" }}>{v.uploaderName}</td>
                                                <td style={{ padding: "6px 8px" }}>{v.approvalDate ? new Date(v.approvalDate).toLocaleDateString() : "—"}</td>
                                                <td style={{ padding: "6px 8px" }}>{v.deleteComment ?? "—"}</td>
                                                <td style={{ padding: "6px 8px" }}>{v.deletedAt ? new Date(v.deletedAt).toLocaleDateString() : "—"}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ),
                                    });
                                  }}
                                  style={{ backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", fontSize: "11px" }}
                                >
                                  History
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Remarks */}
                        <td style={{ padding: "12px 14px", textAlign: "center", color: "#2c3e50", fontSize: "12px" }}>
                          {doc?.deleteComment ?? "—"}
                        </td>

                        {/* ── NEW: Add Task cell ── */}
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle", background: "#f8f9ff" }}>
                          <button
                            className="add-task-btn"
                            onClick={() => setAddTaskModal({ open: true, row: taskRow })}
                            title={`Create a task for control ${cId}`}
                          >
                            <Plus size={12} />
                            Add Task
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
          justifyContent: "center", alignItems: "flex-start", paddingTop: "80px", zIndex: 999,
        }}>
          <div style={{ background: "white", borderRadius: "12px", width: "85vw", height: "85vh", overflow: "hidden", position: "relative" }}>
            <button
              onClick={closePreviewModal}
              style={{ position: "absolute", top: "12px", right: "12px", background: "#e74c3c", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", fontWeight: 600, cursor: "pointer", zIndex: 1 }}
            >
              ×
            </button>
            <iframe src={previewUrl} title="Preview Policy" style={{ width: "100%", height: "100%", border: "none" }} />
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.isOpen} title={modal.title} message={modal.message}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
        onConfirm={modal.onConfirm} showCancel={modal.showCancel}
      />

      <Modal
        isOpen={deleteModal.open} title="Archive Policy" showCancel
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={async () => {
          try {
            await documentationService.deleteDocument(deleteModal.docId, deleteModal.comment);
            captureActivity({
              action: ACTIONS.DELETE,
              item: "Documentation · Archived policy " + deleteModal.docId + (deleteModal.comment ? " — Reason: " + deleteModal.comment : ""),
              url: "/documentation/mld",
            });
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === deleteModal.docId
                  ? { ...d, deleteComment: deleteModal.comment, deleted: true, archivedAt: new Date().toISOString() }
                  : d
              )
            );
            setDeleteModal({ open: false });
            setModal({
              isOpen: true, title: "Archived",
              message: "Policy moved to Archive. You can permanently delete it from the Archived section in the dashboard.",
              showCancel: false, onConfirm: () => setModal((m) => ({ ...m, isOpen: false })),
            });
          } catch (e) { console.error(e); }
        }}
        message={
          <div>
            <p style={{ marginBottom: "10px", fontSize: "13px", color: "#555" }}>
              This policy will be moved to <strong>Archive</strong>. You can permanently delete it from the dashboard's Archived section.
            </p>
            <textarea
              placeholder="Enter reason for archiving (Remarks)"
              value={deleteModal.comment}
              onChange={(e) => setDeleteModal((m) => ({ ...m, comment: e.target.value }))}
              style={{ width: "100%", minHeight: 80, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </div>
        }
      />

      {/* ── NEW: Add Task Modal ── */}
      {addTaskModal.open && (
        <AddTaskModal
          row={addTaskModal.row}
          user={user}
          users={taskUsers}
          departments={taskDepartments}
          onClose={() => setAddTaskModal({ open: false, row: null })}
          onSuccess={() => {
            const name = addTaskModal.row?.docName || addTaskModal.row?.cId || "control";
            setTaskSuccessMsg(`Task created for "${name}" — visible in Task Management & My Tasks.`);
            setTimeout(() => setTaskSuccessMsg(""), 6000);
          }}
        />
      )}

      <footer style={{
        position: "fixed", bottom: 0, left: 0, width: "100%",
        background: "white", color: "#9ca3af", padding: "12px",
        textAlign: "center", fontSize: "13px", zIndex: 700,
      }}>
        © {new Date().getFullYear()} CalVant. All rights reserved.
      </footer>
    </div>
  );
};

// shared TH style to avoid repetition
const thStyle = {
  padding: "12px 14px", textAlign: "center",
  borderBottom: "2px solid #e6e6e6", fontWeight: 600, whiteSpace: "nowrap",
};

export default MLD;
