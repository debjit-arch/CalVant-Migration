import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Joyride from "react-joyride";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import CompliancePie from "./CompliancePie";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
  Activity,
  Award,
  Zap,
  Brain,
} from "lucide-react";

import riskService from "../riskAssesment/services/riskService";
import documentationService from "../documentation/services/documentationService";
import controlService from "../documentation/services/controlService";
import gapService from "../gapAssessment/services/gapService";
import taskService from "../taskManagement/services/taskService";
import tprmService from "../tprm/services/tprmService";
import { getAllAssessments } from "../dpia/services/dpiaApi";
import { stage1Api } from "../aiia/services/aiiaApi";
import { FRAMEWORK_TILE_COLORS } from "../../context/frameworkService";
import "./DashboardLoggedIn.css";
import { useFramework } from "../../context/FrameworkContex";
import { getFrameworkCompliance } from "../integrations/complianceData";
import { useUI } from "../../context/UIContext";

// ─── Framework filter helpers ─────────────────────────────────────────────────

function _getAllowedRiskTypes(activeDashboardCodes) {
  const TYPE_MAP = [
    { type: "Security",             fw: ["ISO27001", "SOC2"] },
    { type: "Cyber",                fw: ["ISO27001", "SOC2"] },
    { type: "Fraud",                fw: ["ISO27001"] },
    { type: "Privacy",              fw: ["ISO27701", "SOC2", "KSA_PDPL"] },
    { type: "Artificial Intelligence", fw: ["ISO42001"] },
  ];
  const allowed = new Set();
  TYPE_MAP.forEach(({ type, fw }) => {
    if (fw.some((code) => activeDashboardCodes.has(code))) allowed.add(type);
  });
  return allowed;
}

function _riskMatchesFilter(risk, allowedRiskTypes) {
  const types = Array.isArray(risk.riskType)
    ? risk.riskType.map((t) => t.trim().toLowerCase())
    : risk.riskType
      ? String(risk.riskType).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];
  if (types.length === 0) return false;
  const normalizedAllowed = new Set([...allowedRiskTypes].map((t) => t.toLowerCase()));
  return types.some((t) => normalizedAllowed.has(t));
}

function _normalizeFrameworkCode(raw) {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function _auditMatchesFrameworks(audit, normalizedSelectedFW) {
  if (!audit) return false;
  const raw = audit.frameworkCode || audit.framework;
  if (!raw) return false;
  const rawValues = Array.isArray(raw) ? raw : [raw];
  const auditCodes = rawValues.map(_normalizeFrameworkCode).filter(Boolean);
  return normalizedSelectedFW.some((fw) => auditCodes.some((code) => code === fw));
}

const isJwtExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

// ─── Constants ────────────────────────────────────────────────────────────────

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

// All module cards share this exact height. Change here → everything updates.
const CARD_H = 300; // px

// Grid is always 4 equal columns. Compliance spans 2, 3, or 4 of them.
const GRID_COLS = 4;

// ─── Layout config based on visible framework count ───────────────────────────
//
//  ≤ 6  fw  → colSpan 2, tileCols 2
//             Row 1: [Compliance×2] [Risk×1] [Task×1]
//
//  7–12 fw  → colSpan 3, tileCols 3
//             Row 1: [Compliance×3] [Risk×1]
//             Row 2: [Task] [Audits] …
//
//  12+  fw  → colSpan 4, tileCols 3  (full row)
//             Row 1: [Compliance×4]
//             Row 2: [Risk] [Task] [Audits] …
//
function getComplianceLayout(count) {
  if (count <= 6)  return { colSpan: 2, tileCols: 2 };
  if (count <= 12) return { colSpan: 3, tileCols: 3 };
  return                  { colSpan: 4, tileCols: 3 };
}

// ─── Sub-components (defined OUTSIDE DashboardLoggedIn so they are stable) ───

/**
 * PieSection — renders the donut chart + colour legend used by every module card.
 * Props:
 *   data    – recharts data array  [{ name, value }]
 *   cells   – array of <Cell> elements (colours)
 *   legend  – array of [hexColor, value, label] tuples
 */
const PieSection = ({ data, cells, legend }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center", minHeight: 0 }}>
    <div style={{ width: "100%", height: "118px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="54%"
            outerRadius="84%"
            paddingAngle={4}
            dataKey="value"
            animationDuration={900}
          >
            {cells}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            formatter={(v, n) => (n === "No Data" ? ["No Data", n] : [`${v}`, n])}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px",
      justifyContent: "center", marginTop: "10px" }}>
      {legend.map(([color, val, label]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px",
          fontSize: "11px", fontWeight: 600, color: "#475569" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%",
            background: color, flexShrink: 0, display: "inline-block" }} />
          {val} {label}
        </div>
      ))}
    </div>
  </div>
);

/**
 * CardHeader — top section shared by all module cards.
 * Props:
 *   icon          – JSX icon element
 *   iconGradient  – CSS gradient string for icon background
 *   title         – card title string
 *   total         – big number shown top-right
 *   totalLabel    – small label below the number
 *   filterTags    – boolean; whether to render framework filter badges
 *   selectedFWs   – array of selected framework names (needed when filterTags=true)
 *   isAllSelected – boolean
 *   tagBg/tagColor/tagBorder – badge colours
 */
const CardHeader = ({
  icon, iconGradient, title, total, totalLabel,
  filterTags, selectedFWs, isAllSelected,
  tagBg, tagColor, tagBorder,
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "10px", flexShrink: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: "8px", flexShrink: 0,
        background: iconGradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#0f172a",
          margin: 0, lineHeight: 1.2, whiteSpace: "nowrap" }}>
          {title}
        </h3>
        {filterTags && !isAllSelected && selectedFWs?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "3px" }}>
            {selectedFWs.map((fw) => (
              <span key={fw} style={{
                fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 10,
                background: tagBg, color: tagColor, border: `1px solid ${tagBorder}`,
                whiteSpace: "nowrap",
              }}>{fw}</span>
            ))}
          </div>
        )}
      </div>
    </div>
    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{total}</div>
      <div style={{ fontSize: "10px", fontWeight: 500, color: "#94a3b8",
        textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
        {totalLabel}
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const DashboardLoggedIn = () => {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // UI state
  const [showChangePassword] = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [frameworkOpen, setFrameworkOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showTprm,      setShowTprm]      = useState(true);
  const [activeFw,      setActiveFw]      = useState(null);

  const { runTour, setRunTour } = useUI();

  // ── User ──────────────────────────────────────────────────────────────────
  const user = useMemo(() => {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => { if (!user) setSessionExpired(true); }, [user]);

  // ── Idle / JWT timer ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const resetIdleTimer = () => { lastActivityRef.current = Date.now(); };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    idleTimerRef.current = setInterval(() => {
      if (
        Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS &&
        isJwtExpired(token)
      ) {
        setSessionExpired(true);
        clearInterval(idleTimerRef.current);
      }
    }, 5000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      clearInterval(idleTimerRef.current);
    };
  }, []);

  // ── Click-outside handler ─────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showChangePassword) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setFrameworkOpen(false);
        setTemplatesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showChangePassword]);

  // ── Loading ───────────────────────────────────────────────────────────────
  useEffect(() => { setTimeout(() => setLoading(false), 800); }, []);

  // ── Joyride ───────────────────────────────────────────────────────────────
  const tourSteps = [
    { target: "#compliance-module", content: "Real-time compliance summary." },
    { target: "#risk-module",       content: "Overview of risks in your department." },
    { target: "#task-module",       content: "Tasks assigned to you." },
    { target: "#gap-module",        content: "Gap Assessment against standards." },
    { target: "#doc-module",        content: "Compliance document upload status." },
  ];
  const handleJoyrideCallback = ({ status }) => {
    if (["finished", "skipped"].includes(status)) setRunTour(false);
  };

  // ── Framework context ─────────────────────────────────────────────────────
  const {
    selectedFrameworks, isAllSelected, showDpia, showAiia, availableFrameworks,
  } = useFramework();

  const fwLabelToCode = useMemo(
    () => Object.fromEntries(availableFrameworks.map((fw) => [fw.id, fw.code])),
    [availableFrameworks],
  );
  const complianceFrameworkCodes = useMemo(
    () => availableFrameworks.map((fw) => fw.code),
    [availableFrameworks],
  );

  // ── API error handler ─────────────────────────────────────────────────────
  const handleApiError = useCallback((error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      setSessionExpired(true);
      return true;
    }
    return false;
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ══════════════════════════════════════════════════════════════════════════

  // ── RISK ──────────────────────────────────────────────────────────────────
  const [allRisks, setAllRisks] = useState([]);

  const loadRiskStats = useCallback(async () => {
    if (!user?.organization) return;
    try {
      const risks = await riskService.getAllRisks();
      if (!Array.isArray(risks)) return;
      const isRoot = user?.role?.some((r) => {
        const s = (typeof r === "string" ? r : r?.name || r?.roleName || "")
          .toLowerCase().replace(/[\s_-]/g, "");
        return ["root", "ciso", "aio", "dpo"].some((role) => s.includes(role));
      });
      const userDepts = (user.departments || []).map((d) => (d.name || "").trim().toLowerCase());
      setAllRisks(risks.filter((risk) => {
        const orgMatch = String(risk.organization?._id || risk.organization) ===
          String(user.organization?._id || user.organization);
        if (!orgMatch) return false;
        if (isRoot) return true;
        return risk.department && userDepts.includes(risk.department.trim().toLowerCase());
      }));
    } catch (err) { handleApiError(err); }
  }, [user, handleApiError]);
  useEffect(() => { loadRiskStats(); }, [loadRiskStats]);

  const allowedRiskTypesForDashboard = useMemo(() => {
    if (isAllSelected) return null;
    const activeCodes = new Set();
    selectedFrameworks.forEach((fw) => {
      const code = fwLabelToCode[fw];
      if (code) activeCodes.add(code);
    });
    return _getAllowedRiskTypes(activeCodes);
  }, [selectedFrameworks, isAllSelected, fwLabelToCode]);

  const filteredRisks = useMemo(() => {
    if (!allowedRiskTypesForDashboard) return allRisks;
    return allRisks.filter((r) => _riskMatchesFilter(r, allowedRiskTypesForDashboard));
  }, [allRisks, allowedRiskTypesForDashboard]);

  const riskStats = useMemo(() => filteredRisks.reduce(
    (acc, risk) => {
      acc.total++;
      const impact = Math.max(
        parseInt(risk.confidentiality) || 0,
        parseInt(risk.integrity)       || 0,
        parseInt(risk.availability)    || 0,
      );
      const score = impact * (parseInt(risk.probability) || 0);
      const level = score <= 3 ? "low" : score <= 8 ? "medium" : score <= 12 ? "high" : "critical";
      acc[level]++;
      risk.status?.toLowerCase() === "closed" ? acc.closed++ : acc.open++;
      return acc;
    },
    { total: 0, low: 0, medium: 0, high: 0, critical: 0, open: 0, closed: 0 },
  ), [filteredRisks]);

  // ── DOCUMENTATION ─────────────────────────────────────────────────────────
  const [documentStats, setDocumentStats] = useState({ total: 0, uploaded: 0, pending: 0 });

  const getTotalFromBackendControls = useCallback((controls, currentUser) => {
    const roles = Array.isArray(currentUser?.role) ? currentUser.role : [currentUser?.role];
    const isAdmin = roles.some((r) =>
      ["root", "super_admin", "ciso", "dpo", "aio"].includes(r),
    );
    const userDeptNames = (currentUser?.departments || []).map((d) => (d.name || "").toLowerCase());
    const docsSet = new Set();
    controls.forEach((ctrl) => {
      if (!ctrl.documents?.length) return;
      const ctrlDepts = (ctrl.departmentIds || []).map((d) => (d || "").toLowerCase());
      const docDepts  = ctrl.documents.map((d) => (d.dept || "").toLowerCase()).filter(Boolean);
      const allDepts  = [...ctrlDepts, ...docDepts];
      const hasAccess = isAdmin || allDepts.length === 0 || allDepts.some((d) => userDeptNames.includes(d));
      if (!hasAccess) return;
      ctrl.documents.forEach(({ doc }) => { if (doc) docsSet.add(doc); });
    });
    return docsSet.size;
  }, []);

  const loadDocumentStats = useCallback(async () => {
    if (!user) return;
    try {
      const activeFWCodes = isAllSelected
        ? availableFrameworks.map((fw) => _normalizeFrameworkCode(fw.code))
        : selectedFrameworks.map(_normalizeFrameworkCode);

      const [docs, soaList, ...controlResults] = await Promise.all([
        documentationService.getDocuments().catch(() => []),
        documentationService.getSoAEntries().catch(() => []),
        ...availableFrameworks.map((fw) =>
          controlService.getControlsByFramework(fw.code).catch(() => []),
        ),
      ]);

      const soaFrameworkMap = {};
      (soaList || []).forEach((soa) => { if (soa.id) soaFrameworkMap[String(soa.id)] = soa.framework; });

      const orgDocs = (docs || [])
        .filter((d) => d.organization === user?.organization)
        .map((doc) => ({
          ...doc,
          framework: soaFrameworkMap[String(doc.soaId)] || doc.framework || null,
        }));

      const frameworkDocs = orgDocs.filter((doc) =>
        activeFWCodes.includes(_normalizeFrameworkCode(doc.framework)),
      );

      const frameworkControls = availableFrameworks
        .flatMap((fw, i) =>
          (controlResults[i] || []).map((c) => ({ ...c, _fw: _normalizeFrameworkCode(fw.code) })),
        )
        .filter((ctrl) => activeFWCodes.includes(ctrl._fw));

      const totalRequired = getTotalFromBackendControls(frameworkControls, user);
      const uploaded = frameworkDocs.filter((doc) => !!doc.url).length;

      setDocumentStats({ total: totalRequired, uploaded, pending: Math.max(0, totalRequired - uploaded) });
    } catch (err) { handleApiError(err); }
  }, [user, selectedFrameworks, isAllSelected, availableFrameworks, getTotalFromBackendControls, handleApiError]);
  useEffect(() => { loadDocumentStats(); }, [loadDocumentStats]);

  // ── GAP & AUDITS ──────────────────────────────────────────────────────────
  const [allAudits, setAllAudits]               = useState([]);
  const [allGaps, setAllGaps]                   = useState([]);
  const [allControlsForGap, setAllControlsForGap] = useState([]);

  const loadGapStats = useCallback(async () => {
    if (!user?.organization) return;
    try {
      const orgId = encodeURIComponent(user?.organization?._id || user?.organization);
      const [auditsRaw, gaps, ...controlResults] = await Promise.all([
        fetch(`https://api.calvant.com/audit/api/audits?organization=${orgId}`, {
          headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()).catch(() => []),
        gapService.getGaps().catch(() => []),
        ...availableFrameworks.map((fw) =>
          controlService.getControlsByFramework(fw.code).catch(() => []),
        ),
      ]);

      console.log("[loadGapStats] audits:", auditsRaw?.length, auditsRaw?.slice(0, 2));
      setAllAudits(Array.isArray(auditsRaw) ? auditsRaw : []);
      setAllGaps(gaps);
      setAllControlsForGap(
        availableFrameworks.flatMap((fw, i) =>
          (controlResults[i] || []).map((c) => ({ ...c, _fw: _normalizeFrameworkCode(fw.code) })),
        ),
      );
    } catch (err) { handleApiError(err); }
  }, [user, availableFrameworks, handleApiError]);
  useEffect(() => { loadGapStats(); }, [loadGapStats]);

  const auditStats = useMemo(() => {
    if (isAllSelected) return { total: allAudits.length };
    const normalizedSelectedFW = selectedFrameworks.map(_normalizeFrameworkCode);
    console.log("[auditStats] normalizedSelectedFW:", normalizedSelectedFW);
    console.log("[auditStats] audit fw samples:",
      allAudits.slice(0, 5).map((a) => ({
        frameworkCode: a.frameworkCode, framework: a.framework,
        normalized: _normalizeFrameworkCode(a.frameworkCode || a.framework),
      })),
    );
    const filtered = allAudits.filter((a) => _auditMatchesFrameworks(a, normalizedSelectedFW));
    console.log("[auditStats] filtered:", filtered.length);
    return { total: filtered.length };
  }, [allAudits, selectedFrameworks, isAllSelected]);

  const gapStats = useMemo(() => {
    const isRoot = user?.role?.some((r) => {
      const s = (typeof r === "string" ? r : r?.name || r?.roleName || "")
        .toLowerCase().replace(/[\s_-]/g, "");
      return ["root", "ciso", "aio", "dpo"].some((role) => s.includes(role));
    });
    const deptNames = (user?.departments || []).map((d) => (d.name || "").trim().toLowerCase());

    const activeFWCodes = isAllSelected
      ? availableFrameworks.map((fw) => _normalizeFrameworkCode(fw.code))
      : selectedFrameworks.map(_normalizeFrameworkCode);

    const filteredControls = allControlsForGap.filter((c) => activeFWCodes.includes(c._fw));

    const totalCount = filteredControls.reduce((acc, item) => {
      const itemDepts = (item.departmentIds || item.departments || []).map((d) =>
        (typeof d === "string" ? d : d.name || d).trim().toLowerCase(),
      );
      const hasAccess = isRoot || itemDepts.some((d) => deptNames.includes(d));
      return hasAccess ? acc + (item.auditQuestions?.length || 1) : acc;
    }, 0);

    const filteredGaps = allGaps.filter((g) => {
      if (
        String(g.organization?._id || g.organization) !==
        String(user?.organization?._id || user?.organization)
      ) return false;
      if (isRoot) return true;
      return deptNames.includes(String(g.department || "").trim().toLowerCase());
    });

    const closedCount = filteredGaps.filter((g) =>
      (g.docScore !== "" && g.docScore !== undefined) ||
      (g.practiceScore !== "" && g.practiceScore !== undefined),
    ).length;

    return { total: totalCount, closed: closedCount, open: Math.max(0, totalCount - closedCount) };
  }, [allGaps, allControlsForGap, user, selectedFrameworks, isAllSelected, availableFrameworks]);

  // ── FRAMEWORK COMPLIANCE ──────────────────────────────────────────────────
  const [frameworkComplianceData, setFrameworkComplianceData] = useState({});

  useEffect(() => {
    if (complianceFrameworkCodes.length === 0) return;
    let cancelled = false;
    Promise.all(
      complianceFrameworkCodes.map(async (fw) => {
        try {
          const result = await getFrameworkCompliance(fw);
          return [fw, {
            fullyCompliant: result.compliant     ?? 0,
            nonCompliant:  result.nonCompliant   ?? 0,
            partial:       result.partial        ?? 0,
            totalControls: result.totalControls  ?? 0,
          }];
        } catch {
          return [fw, { fullyCompliant: 0, nonCompliant: 0, partial: 0, totalControls: 0 }];
        }
      }),
    ).then((results) => {
      if (!cancelled) setFrameworkComplianceData(Object.fromEntries(results));
    });
    return () => { cancelled = true; };
  }, [complianceFrameworkCodes]);

  const filteredFrameworkCompliance = useMemo(() => {
    if (isAllSelected) return frameworkComplianceData;
    const activeKeys = new Set(selectedFrameworks.map((fw) => fwLabelToCode[fw]).filter(Boolean));
    return Object.fromEntries(
      Object.entries(frameworkComplianceData).filter(([k]) => activeKeys.has(k)),
    );
  }, [frameworkComplianceData, selectedFrameworks, isAllSelected, fwLabelToCode]);

  const fwTotal = useMemo(
    () => Object.values(filteredFrameworkCompliance).reduce((s, f) => s + f.totalControls, 0),
    [filteredFrameworkCompliance],
  );
  const fwCompliant = useMemo(
    () => Object.values(filteredFrameworkCompliance).reduce((s, f) => s + f.fullyCompliant, 0),
    [filteredFrameworkCompliance],
  );
  const fwPartial = useMemo(
    () => Object.values(filteredFrameworkCompliance).reduce((s, f) => s + (f.partial || 0), 0),
    [filteredFrameworkCompliance],
  );
  const fwNonCompliant = useMemo(
    () => Object.values(filteredFrameworkCompliance).reduce((s, f) => s + (f.nonCompliant || 0), 0),
    [filteredFrameworkCompliance],
  );


  // ── TASKS ─────────────────────────────────────────────────────────────────
  const [taskStats, setTaskStats] = useState({ total: 0, myTasks: 0, pendingApproval: 0, completed: 0 });

  const loadTaskStats = useCallback(async () => {
    try {
      const tasks = await taskService.getAllTasks();
      if (!Array.isArray(tasks) || !user) return;
      const isRoot = user?.role?.some((r) => {
        const s = (typeof r === "string" ? r : r?.name || r?.roleName || "")
          .toLowerCase().replace(/[\s_-]/g, "");
        return ["root", "ciso", "aio", "dpo"].some((role) => s.includes(role));
      });
      const userOrgId = user.organization?._id || user.organization;
      const orgTasks  = tasks.filter((t) =>
        String(t.organization?._id || t.organization) === String(userOrgId),
      );
      const deptTasks = isRoot ? orgTasks : orgTasks.filter((t) => {
        if (!t.department) return false;
        return (user.departments || [])
          .map((d) => (d.name || "").trim().toLowerCase())
          .includes(t.department.trim().toLowerCase());
      });
      setTaskStats({
        total:           orgTasks.length,
        myTasks:         deptTasks.length,
        pendingApproval: deptTasks.filter((t) =>
          t.status === "Completed (Pending Approval)" ||
          (t.status === "Completed" && t.approved !== true),
        ).length,
        completed: deptTasks.filter((t) => t.status === "Approved").length,
      });
    } catch (err) { console.error("Error loading task stats:", err); }
  }, [user]);
  useEffect(() => { loadTaskStats(); }, [loadTaskStats]);

  // ── TPRM ──────────────────────────────────────────────────────────────────
  const [tprmStats, setTprmStats] = useState({
    total: 0, draft: 0, sent: 0, submitted: 0, approved: 0, rejected: 0,
  });
  const loadTprmStats = useCallback(async () => {
    if (!user?.organization) return;
    try {
      setTprmStats(
        await tprmService.getStats(user?.organization?._id || user?.organization),
      );
    } catch (err) { console.error(err); }
  }, [user]);
  useEffect(() => { loadTprmStats(); }, [loadTprmStats]);

  // ── DPIA ──────────────────────────────────────────────────────────────────
  const [dpiaStats, setDpiaStats] = useState({
    total: 0, submitted: 0, inProgress: 0, draft: 0, highRisk: 0,
  });
  const loadDpiaStats = useCallback(async () => {
    if (!user?.organization) return;
    try {
      const data  = await getAllAssessments(user?.organization?._id || user?.organization);
      const dpias = Array.isArray(data) ? data : [];
      setDpiaStats({
        total:      dpias.length,
        submitted:  dpias.filter((d) => d.status === "SUBMITTED").length,
        inProgress: dpias.filter((d) => d.status === "IN_PROGRESS").length,
        draft:      dpias.filter((d) => d.status === "DRAFT").length,
        highRisk:   dpias.filter((d) => d.overallRiskLevel === "HIGH").length,
      });
    } catch (err) { console.error("Error loading DPIA stats:", err); }
  }, [user]);
  useEffect(() => { loadDpiaStats(); }, [loadDpiaStats]);

  // ── AIIA ──────────────────────────────────────────────────────────────────
  const [aiiaStats, setAiiaStats] = useState({
    total: 0, approved: 0, submitted: 0, draft: 0, pending: 0,
  });
  const loadAiiaStats = useCallback(async () => {
    try {
      const assessments = (await stage1Api.getAll())?.data?.data || [];
      setAiiaStats({
        total:     assessments.length,
        approved:  assessments.filter((a) => a.status === "APPROVED").length,
        submitted: assessments.filter((a) => a.status === "SUBMITTED").length,
        draft:     assessments.filter((a) => a.status === "DRAFT").length,
        pending:   assessments.filter((a) => a.status === "DRAFT" || a.status === "SUBMITTED").length,
      });
    } catch (err) { console.error("Error loading AIIA stats:", err); }
  }, []);
  useEffect(() => { loadAiiaStats(); }, [loadAiiaStats]);

  // ══════════════════════════════════════════════════════════════════════════
  // DERIVED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  // Recharts helper — prevents empty-pie crash
  const getPieChartData = (data) =>
    data.every((d) => !d.value)
      ? [{ name: "No Data", value: 1, color: "#e2e8f0" }]
      : data;

  // Visible framework list (respects the global selector)
  const visibleFwList = useMemo(
    () => availableFrameworks.filter((fw) => isAllSelected || selectedFrameworks.includes(fw.id)),
    [availableFrameworks, isAllSelected, selectedFrameworks],
  );

  // Dynamic layout for the Compliance card
  const compColSpan = 2;

  const highlightedFwData = useMemo(() => {
    if (!activeFw) {
      return {
        label: "Overall Compliance",
        sub: "Combined average of active standards",
        fullyCompliant: fwCompliant,
        partial: fwPartial,
        nonCompliant: fwNonCompliant,
        totalControls: fwTotal,
        color: "#f43f5e",
      };
    }
    const fw = visibleFwList.find((f) => f.code === activeFw);
    const d = frameworkComplianceData[activeFw] ?? { fullyCompliant: 0, nonCompliant: 0, partial: 0, totalControls: 0 };
    return {
      label: fw?.label ?? activeFw,
      sub: fw?.sub || fw?.description || "Compliance standard status",
      fullyCompliant: d.fullyCompliant,
      partial: d.partial,
      nonCompliant: d.nonCompliant,
      totalControls: d.totalControls,
      color: FRAMEWORK_TILE_COLORS[activeFw] ?? fw?.color ?? "#f43f5e",
    };
  }, [activeFw, visibleFwList, frameworkComplianceData, fwCompliant, fwPartial, fwNonCompliant, fwTotal]);

  // Banner totals
  const overallTotal     = riskStats.total + gapStats.total + fwTotal + taskStats.total + documentStats.total + dpiaStats.total + aiiaStats.total;
  const overallPending   = riskStats.open + gapStats.open + (fwTotal - fwCompliant) + (taskStats.total - (taskStats.pendingApproval + taskStats.completed)) + documentStats.pending + dpiaStats.inProgress + dpiaStats.draft + aiiaStats.pending;
  const overallCompleted = riskStats.closed + gapStats.closed + fwCompliant + taskStats.completed + taskStats.pendingApproval + documentStats.uploaded + dpiaStats.submitted + aiiaStats.approved;
  const overallProgress  = `${Math.round((overallCompleted / (overallTotal || 1)) * 100)}%`;

  // ── Shared card style (identical for every module card) ───────────────────
  const cardStyle = {
    height:     `${CARD_H}px`,
    overflow:   "hidden",
    boxSizing:  "border-box",
    background: "white",
    borderRadius: "12px",
    padding:    "16px",
    display:    "flex",
    flexDirection: "column",
    cursor:     "pointer",
  };

  // ── Loading spinner ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "120px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0",
          borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 16, color: "#64748b", fontWeight: 500 }}>Loading dashboard…</div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      minHeight: "100vh",
      position: "relative",
      overflowX: "visible",
      width: "100%",
    }}>
      {/* ── Floating background blobs ──────────────────────────────────────── */}
      {[
        { top: "10%",        left: "5%",   size: "200px", color: "rgba(59,130,246,0.1)",  anim: "6s" },
        { top: "60%",        left: "80%",  size: "150px", color: "rgba(139,92,246,0.08)", anim: "8s reverse" },
        { top: "70%",        left: "50%",  size: "100px", color: "rgba(16,185,129,0.06)", anim: "7s" },
      ].map(({ top, left, size, color, anim }, i) => (
        <div key={i} style={{
          position: "absolute", top, left, width: size, height: size, borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          animation: `float ${anim} ease-in-out infinite`, pointerEvents: "none",
        }} />
      ))}

      {/* ── Joyride tour ──────────────────────────────────────────────────── */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        callback={handleJoyrideCallback}
        continuous
        showSkipButton
        styles={{ options: { primaryColor: "#3b82f6", zIndex: 3000 } }}
      />

      <main className="w-full max-w-[1200px] mx-auto px-5 py-[10px] box-border overflow-x-visible lg:max-w-full lg:px-[14px] lg:pb-[50px] sm:px-3 sm:pb-[40px] 2xl:max-w-[1400px] 2xl:px-5 2xl:pt-8 2xl:pb-[70px]">

        {/* ══════════════════════════════════════════════════════════════════
         *  TOP STATS BANNER
         * ══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            marginBottom: "16px", padding: "16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px", boxShadow: "0 6px 24px rgba(102,126,234,0.25)",
            position: "relative", overflow: "visible",
          }}
        >
          {/* decorative overlay */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle at 20% 80%, rgba(120,119,198,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
          }} />

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px", position: "relative", zIndex: 1,
          }}>
            {[
              {
                icon: <TrendingUp size={16} color="white" />,
                gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
                value: overallTotal, label: "Overall Activities",
                tipTitle: "Total Activities Calculation", tipColor: "#22c55e",
                tip: `Risk Management: ${riskStats.total}\nGap Assessment: ${gapStats.total}\nCompliance: ${fwTotal}\nTask Management: ${taskStats.total}\nDocumentation: ${documentStats.total}\nDPIA: ${dpiaStats.total}\nAIIA: ${aiiaStats.total}`,
                tipPos: { top: "75%", left: "50%", transform: "translate(-50%,-50%)" },
              },
              {
                icon: <Activity size={16} color="white" />,
                gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                value: overallPending, label: "Pending Items",
                tipTitle: "Pending Items Calculation", tipColor: "#3b82f6",
                tip: `Open Risks: ${riskStats.open}\nOpen Gaps: ${gapStats.open}\nNon/Partial Compliance: ${fwTotal - fwCompliant}\nPending Tasks: ${taskStats.total - (taskStats.pendingApproval + taskStats.completed)}\nPending Docs: ${documentStats.pending}\nDPIA In-Progress/Draft: ${dpiaStats.inProgress + dpiaStats.draft}\nAIIA Pending: ${aiiaStats.pending}`,
                tipPos: { top: "90%", left: "50%", transform: "translate(-50%,-50%)" },
              },
              {
                icon: <Award size={16} color="white" />,
                gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
                value: overallCompleted, label: "Completed Items",
                tipTitle: "Completed Items Calculation", tipColor: "#f59e0b",
                tip: `Closed Risks: ${riskStats.closed}\nClosed Gaps: ${gapStats.closed}\nCompliant Controls: ${fwCompliant}\nApproved Tasks: ${taskStats.completed}\nCompleted(PA) Tasks: ${taskStats.pendingApproval}\nUploaded Docs: ${documentStats.uploaded}\nDPIA Submitted: ${dpiaStats.submitted}\nAIIA Approved: ${aiiaStats.approved}`,
                tipPos: { top: "-30%", left: "50%", transform: "translateX(-50%)" },
              },
              {
                icon: <Zap size={16} color="white" />,
                gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                value: overallProgress, label: "Overall Progress",
                tipTitle: "Overall Progress Calculation", tipColor: "#8b5cf6",
                tip: `(${overallCompleted} / ${overallTotal || 1}) × 100`,
                tipPos: { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", background: "rgba(255,255,255,0.1)",
                  borderRadius: "10px", backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)", cursor: "default",
                  position: "relative", overflow: "visible",
                }}
                onMouseEnter={(e) => { const t = e.currentTarget.querySelector(".tip"); if (t) t.style.opacity = "1"; }}
                onMouseLeave={(e) => { const t = e.currentTarget.querySelector(".tip"); if (t) t.style.opacity = "0"; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: card.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "white", lineHeight: 1.1 }}>{card.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{card.label}</div>
                </div>
                {/* Tooltip */}
                <div className="tip" style={{
                  position: "absolute", ...card.tipPos, zIndex: 99999,
                  background: "rgba(0,0,0,0.95)", color: "white", padding: "8px",
                  borderRadius: "6px", fontSize: "11px", maxWidth: "320px", textAlign: "center",
                  opacity: 0, transition: "opacity 0.3s ease", pointerEvents: "none",
                  boxShadow: "0 12px 20px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)", whiteSpace: "pre-line",
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: card.tipColor }}>{card.tipTitle}</div>
                  <div style={{ fontSize: 10, lineHeight: 1.4 }}>{card.tip}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════
         *  MODULE CARDS GRID
         *
         *  Layout rules
         *  ────────────
         *  • Always GRID_COLS (4) equal columns.
         *  • gridAutoRows = CARD_H px  →  every row is identical height.
         *  • Compliance card spans compColSpan cols (2 / 3 / 4).
         *  • overflow:hidden on every card prevents content from escaping.
         *  • Tile section inside Compliance is overflow-y:auto (scrolls
         *    within fixed height when frameworks don't all fit).
         *
         *  Row examples
         *  ────────────
         *  ≤6  fw  [Compliance×2][Risk×1][Task×1]  /  [Audits]…
         *  7-12 fw [Compliance×3][Risk×1]           /  [Task][Audits]…
         *  12+ fw  [Compliance×4]                   /  [Risk][Task][Audits]…
         * ══════════════════════════════════════════════════════════════════ */}
        <div
          className="dashboard-grid max-w-[1400px] mx-auto 2xl:max-w-[1600px]"
          style={{
            gridAutoRows: `${CARD_H}px`,
          }}
        >

          {/* ── FRAMEWORK COMPLIANCE ──────────────────────────────────────── */}
          <motion.div
            id="compliance-module"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.005 }}
            className={`compliance-span-${compColSpan}`}
            style={{
              ...cardStyle,
              borderLeft: "4px solid #f43f5e",
              cursor: "default",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "12px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck className="rotate-icon" size={18} color="white" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
                  Framework Compliance
                </h3>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{fwTotal}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>
                  total controls
                </div>
              </div>
            </div>

            {/* Dynamic Content Modes */}
            {visibleFwList.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "#64748b", padding: 20, textAlign: "center" }}>
                <ShieldCheck size={40} color="#cbd5e1" />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No Active Frameworks Selected</div>
                <div style={{ fontSize: 11, color: "#94a3b8", maxWidth: 280 }}>Select one or more compliance standards in the framework selector at the top.</div>
              </div>
            ) : visibleFwList.length === 1 ? (
              /* ==========================================================
                 MODE A: WIDESCREEN HERO MODE (Exactly 1 Framework Selected)
                 ========================================================== */
              (() => {
                const fw = visibleFwList[0];
                const d = frameworkComplianceData[fw.code] ?? {
                  fullyCompliant: 0, nonCompliant: 0, partial: 0, totalControls: 0,
                };
                const score = d.totalControls > 0 ? Math.round((d.fullyCompliant / d.totalControls) * 100) : 0;
                const tileColor = FRAMEWORK_TILE_COLORS[fw.code] ?? fw.color ?? "#f43f5e";

                return (
                  <div style={{ display: "flex", alignItems: "stretch", gap: 24, flex: 1, minHeight: 0, width: "100%" }}>
                    {/* Left Column: Big ring + breathing status light */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "150px" }}>
                      <CompliancePie 
                        compliant={d.fullyCompliant} 
                        nonCompliant={d.nonCompliant} 
                        partial={d.partial} 
                        size={120} 
                        fontSize="18px"
                      />
                      <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
                        <span 
                          className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5"
                          style={{
                            background: score >= 80 ? "rgba(16,185,129,0.08)" : score >= 50 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                            color: score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444",
                            border: score >= 80 ? "1px solid rgba(16,185,129,0.15)" : score >= 50 ? "1px solid rgba(245,158,11,0.15)" : "1px solid rgba(239,68,68,0.15)",
                          }}
                        >
                          <span className="breathing-status-dot" style={{ background: score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444" }} />
                          {score >= 80 ? "Optimized" : score >= 50 ? "Improving" : "At Risk"}
                        </span>
                      </div>
                    </div>

                    {/* Vertical divider */}
                    <div style={{ width: 1, background: "rgba(226, 232, 240, 0.5)", flexShrink: 0, alignSelf: "stretch" }} />

                    {/* Right Column: Descriptions & dynamic progress bars */}
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, justifyContent: "center" }}>
                      <span style={{ fontSize: "9px", fontWeight: 800, color: tileColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Active Compliance Standard
                      </span>
                      <h4 
                        style={{ fontSize: "19px", fontWeight: 800, color: "#1e293b", margin: "2px 0 4px 0", cursor: "pointer", display: "inline-block" }}
                        onClick={() => router.push("/compliances")}
                      >
                        {fw.label}
                      </h4>
                      <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 12px 0", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {fw.description || fw.sub || "Continuous security and compliance monitoring"}
                      </p>

                      {/* Visual Bars */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                            <span>Compliant</span>
                            <span>{d.fullyCompliant} / {d.totalControls}</span>
                          </div>
                          <div className="sleek-progress-container">
                            <div className="sleek-progress-bar" style={{ width: `${d.totalControls > 0 ? (d.fullyCompliant / d.totalControls) * 100 : 0}%`, background: "#10b981" }} />
                          </div>
                        </div>

                        {d.partial > 0 && (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                              <span>Partial</span>
                              <span>{d.partial} / {d.totalControls}</span>
                            </div>
                            <div className="sleek-progress-container">
                              <div className="sleek-progress-bar" style={{ width: `${(d.partial / d.totalControls) * 100}%`, background: "#f59e0b" }} />
                            </div>
                          </div>
                        )}

                        {d.nonCompliant > 0 && (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                              <span>Non-Compliant</span>
                              <span>{d.nonCompliant} / {d.totalControls}</span>
                            </div>
                            <div className="sleek-progress-container">
                              <div className="sleek-progress-bar" style={{ width: `${(d.nonCompliant / d.totalControls) * 100}%`, background: "#ef4444" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* ==========================================================
                 DYNAMIC INTERACTIVE HUB & RING GRID (2+ Selected)
                 ========================================================== */
              <div style={{ display: "flex", alignItems: "stretch", gap: "20px", flex: 1, minHeight: 0, width: "100%" }}>
                {/* Left Column: Dynamic Detail Hub */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, flexShrink: 0, width: "155px" }}>
                  <CompliancePie 
                    compliant={highlightedFwData.fullyCompliant} 
                    nonCompliant={highlightedFwData.nonCompliant} 
                    partial={highlightedFwData.partial} 
                    size={110} 
                    fontSize="16px" 
                  />
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
                    <div 
                      style={{ 
                        fontSize: "11px", 
                        fontWeight: 850, 
                        color: highlightedFwData.color, 
                        textTransform: "uppercase", 
                        letterSpacing: "0.05em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "150px"
                      }}
                    >
                      {highlightedFwData.label}
                    </div>
                    <div 
                      style={{ 
                        fontSize: "8.5px", 
                        color: "#94a3b8", 
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "150px",
                        marginTop: "1px"
                      }}
                    >
                      {highlightedFwData.sub}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "8.5px", fontWeight: 700, color: "#475569", width: "100%", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span className="breathing-status-dot" style={{ background: "#10b981", width: 5, height: 5 }} />
                        Compliant
                      </span>
                      <span style={{ color: "#1e293b" }}>{highlightedFwData.fullyCompliant}</span>
                    </div>
                    {highlightedFwData.partial > 0 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span className="breathing-status-dot" style={{ background: "#f59e0b", width: 5, height: 5 }} />
                          Partial
                        </span>
                        <span style={{ color: "#1e293b" }}>{highlightedFwData.partial}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span className="breathing-status-dot" style={{ background: "#ef4444", width: 5, height: 5 }} />
                        Non-Compliant
                      </span>
                      <span style={{ color: "#1e293b" }}>{highlightedFwData.nonCompliant}</span>
                    </div>
                  </div>
                </div>

                {/* Vertical divider */}
                <div style={{ width: 1, background: "rgba(226, 232, 240, 0.5)", flexShrink: 0, alignSelf: "stretch" }} />

                {/* Right Column: Grid of compact mini-pie selector tiles */}
                <div 
                  className="custom-slim-scrollbar"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    overflowY: visibleFwList.length > 4 ? "auto" : "visible", 
                    overflowX: "hidden",
                    paddingRight: visibleFwList.length > 4 ? "6px" : "0px",
                  }}
                >
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: visibleFwList.length <= 3 ? "1fr" : "repeat(2, minmax(0, 1fr))",
                    gap: visibleFwList.length === 2 ? "12px" : "8px",
                  }}>
                    {visibleFwList.map((fw) => {
                      const d = frameworkComplianceData[fw.code] ?? {
                        fullyCompliant: 0, nonCompliant: 0, partial: 0, totalControls: 0,
                      };
                      const score = d.totalControls > 0
                        ? Math.round((d.fullyCompliant / d.totalControls) * 100) : 0;
                      const tileColor = FRAMEWORK_TILE_COLORS[fw.code] ?? fw.color ?? "#f43f5e";
                      const glowClass = fw.code.toLowerCase().replace(/[^a-z0-9]/g, "") + "-glow";
                      const isHovered = activeFw === fw.code;
                      const showInnerProgress = visibleFwList.length <= 3;
                      const cardHeight = visibleFwList.length === 2 ? "90px" : visibleFwList.length === 3 ? "56px" : "auto";

                      return (
                        <div 
                          key={fw.code} 
                          className={`framework-glass-card ${glowClass} ${isHovered ? "active-glow-item" : ""}`}
                          style={{ 
                            padding: "8px 10px", 
                            borderRadius: "10px", 
                            gap: "10px",
                            height: cardHeight,
                            boxSizing: "border-box",
                            borderColor: isHovered ? tileColor : "rgba(226, 232, 240, 0.8)",
                            background: isHovered ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.7)",
                            boxShadow: isHovered ? `0 6px 14px -3px ${tileColor}18, 0 4px 6px -2px ${tileColor}10` : "none",
                            display: "flex",
                            alignItems: "center"
                          }}
                          onMouseEnter={() => setActiveFw(fw.code)}
                          onMouseLeave={() => setActiveFw(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push("/compliances");
                          }}
                        >
                          <CompliancePie
                            compliant={d.fullyCompliant}
                            nonCompliant={d.nonCompliant}
                            partial={d.partial}
                            size={visibleFwList.length === 2 ? 46 : 38}
                            fontSize={visibleFwList.length === 2 ? "11px" : "9px"}
                            showPercentage={true}
                          />
                          <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "2px 0" }}>
                            <div>
                              <div style={{
                                fontSize: visibleFwList.length === 2 ? "12px" : "10px", 
                                fontWeight: 800, color: tileColor,
                                textTransform: "uppercase", letterSpacing: "0.04em",
                                lineHeight: 1.1, overflow: "hidden",
                                textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>{fw.label}</div>
                              <div style={{
                                fontSize: "7.5px", color: "#64748b", lineHeight: 1.1, marginTop: "1px",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>{fw.sub || fw.description}</div>
                            </div>

                            {showInnerProgress ? (
                              <div style={{ marginTop: "4px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                                  <span style={{ fontSize: visibleFwList.length === 2 ? "12px" : "10px", fontWeight: 800, color: "#1e293b" }}>{score}%</span>
                                  <span style={{ fontSize: "8px", fontWeight: 600, color: "#94a3b8" }}>({d.fullyCompliant}/{d.totalControls})</span>
                                </div>
                                <div className="sleek-progress-container" style={{ height: "4px" }}>
                                  <div className="sleek-progress-bar" style={{ width: `${score}%`, background: tileColor }} />
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: "2px" }}>
                                <span style={{ fontSize: "10px", fontWeight: 800, color: "#334155" }}>{score}%</span>
                                <span style={{ fontSize: "8px", fontWeight: 600, color: "#94a3b8" }}>({d.totalControls})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>


          {/* ── RISK ──────────────────────────────────────────────────────── */}
          <motion.div
            id="risk-module"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02, boxShadow: "0 12px 24px rgba(59,130,246,0.12)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/risk-assessment")}
            style={{ ...cardStyle, borderLeft: "4px solid #3b82f6" }}
          >
            <CardHeader
              icon={<BarChart3 size={20} color="white" />}
              iconGradient="linear-gradient(135deg, #3b82f6, #1d4ed8)"
              title="Risks"
              total={riskStats.total}
              totalLabel={isAllSelected ? "Total Risks" : "Filtered Risks"}
              filterTags
              selectedFWs={selectedFrameworks}
              isAllSelected={isAllSelected}
              tagBg="#e0f2fe" tagColor="#0369a1" tagBorder="#bae6fd"
            />
            <PieSection
              data={[
                { name: "Low",    value: riskStats.low },
                { name: "Medium", value: riskStats.medium },
                { name: "High",   value: riskStats.high + riskStats.critical },
              ]}
              cells={[
                <Cell key="l" fill="#22c55e" />,
                <Cell key="m" fill="#f59e0b" />,
                <Cell key="h" fill="#ef4444" />,
              ]}
              legend={[
                ["#22c55e", riskStats.low,                       "Low"],
                ["#f59e0b", riskStats.medium,                    "Med"],
                ["#ef4444", riskStats.high + riskStats.critical, "High"],
                ["#9ca3af", riskStats.open,                      "Open"],
              ]}
            />
          </motion.div>

          {/* ── TASK ──────────────────────────────────────────────────────── */}
          <motion.div
            id="task-module"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02, boxShadow: "0 12px 24px rgba(245,158,11,0.12)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/task-management")}
            style={{ ...cardStyle, borderLeft: "4px solid #f59e0b" }}
          >
            <CardHeader
              icon={<CheckSquare size={20} color="white" />}
              iconGradient="linear-gradient(135deg, #f59e0b, #d97706)"
              title="Tasks"
              total={taskStats.total}
              totalLabel="Total Tasks"
              filterTags={false}
              isAllSelected={isAllSelected}
            />
            <PieSection
              data={[
                { name: "Done",    value: taskStats.completed },
                { name: "Pending", value: taskStats.total - (taskStats.pendingApproval + taskStats.completed) },
              ]}
              cells={[
                <Cell key="d" fill="#22c55e" />,
                <Cell key="p" fill="#f59e0b" />,
              ]}
              legend={[
                ["#22c55e", taskStats.completed, "Done"],
                ["#f59e0b", taskStats.total - (taskStats.pendingApproval + taskStats.completed), "Pending"],
              ]}
            />
          </motion.div>

          {/* ── AUDITS ────────────────────────────────────────────────────── */}
          <motion.div
            id="gap-module"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02, boxShadow: "0 12px 24px rgba(16,185,129,0.12)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/gap-assessment")}
            style={{ ...cardStyle, borderLeft: "4px solid #10b981" }}
          >
            <CardHeader
              icon={<ClipboardCheck size={16} color="white" />}
              iconGradient="linear-gradient(135deg, #10b981, #059669)"
              title="Audits"
              total={auditStats.total}
              totalLabel={isAllSelected ? "Total Audits" : "Filtered Audits"}
              filterTags
              selectedFWs={selectedFrameworks}
              isAllSelected={isAllSelected}
              tagBg="#ecfdf5" tagColor="#059669" tagBorder="#d1fae5"
            />
            <PieSection
              data={[
                { name: "Assessed", value: gapStats.closed },
                { name: "Pending",  value: gapStats.open },
              ]}
              cells={[
                <Cell key="a" fill="#22c55e" />,
                <Cell key="p" fill="#ef4444" />,
              ]}
              legend={[
                ["#22c55e", gapStats.closed, "Assessed"],
                ["#ef4444", gapStats.open,   "Pending"],
              ]}
            />
          </motion.div>

          {/* ── POLICIES (DOCUMENTATION) ──────────────────────────────────── */}
          <motion.div
            id="doc-module"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            whileHover={{ scale: 1.02, boxShadow: "0 12px 24px rgba(139,92,246,0.12)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/documentation")}
            style={{ ...cardStyle, borderLeft: "4px solid #8b5cf6" }}
          >
            <CardHeader
              icon={<FileText size={16} color="white" />}
              iconGradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
              title="Policies"
              total={documentStats.total}
              totalLabel={isAllSelected ? "Total Policies" : "Filtered Policies"}
              filterTags
              selectedFWs={selectedFrameworks}
              isAllSelected={isAllSelected}
              tagBg="#f3e8ff" tagColor="#7c3aed" tagBorder="#ddd6fe"
            />
            <PieSection
              data={[
                { name: "Uploaded", value: documentStats.uploaded },
                { name: "Pending",  value: documentStats.pending },
              ]}
              cells={[
                <Cell key="u" fill="#22c55e" />,
                <Cell key="p" fill="#ef4444" />,
              ]}
              legend={[
                ["#22c55e", documentStats.uploaded, "Uploaded"],
                ["#ef4444", documentStats.pending,  "Pending"],
              ]}
            />
          </motion.div>

          {/* ── DPIA ──────────────────────────────────────────────────────── */}
          {showDpia && (
            <motion.div
              id="dpia-module"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.02, boxShadow: "0 12px 24px rgba(14,165,233,0.12)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/dpia")}
              style={{ ...cardStyle, borderLeft: "4px solid #0ea5e9" }}
            >
              <CardHeader
                icon={<ShieldCheck size={16} color="white" />}
                iconGradient="linear-gradient(135deg, #0ea5e9, #0284c7)"
                title="DPIA"
                total={dpiaStats.total}
                totalLabel="Total Assessments"
                filterTags={false}
                isAllSelected={isAllSelected}
              />
              <PieSection
                data={getPieChartData([
                  { name: "Submitted",   value: dpiaStats.submitted  },
                  { name: "In Progress", value: dpiaStats.inProgress },
                  { name: "Draft",       value: dpiaStats.draft      },
                ])}
                cells={getPieChartData([
                 { color: "#10b981" },
                          { color: "#6366f1" },
                          { color: "#f59e0b" },
                ]).map((e, i) => <Cell key={i} fill={e.color} />)}
                legend={[
                  ["#10b981",, dpiaStats.submitted,  "Submitted"],
                  ["#6366f1", dpiaStats.inProgress, "In Progress"],
                  ["#f59e0b", dpiaStats.draft,       "Draft"],
                ]}
              />
            </motion.div>
          )}

          {/* ── TPRM ──────────────────────────────────────────────────────── */}
          {showTprm && (
            <motion.div
              id="tprm-module"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ scale: 1.02, boxShadow: "0 12px 24px rgba(99,102,241,0.12)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/tprm")}
              style={{ ...cardStyle, borderLeft: "4px solid #6366f1" }}
            >
              <CardHeader
                icon={<ShieldCheck size={16} color="white" />}
                iconGradient="linear-gradient(135deg, #6366f1, #4f46e5)"
                title="TPRM"
                total={tprmStats.total}
                totalLabel="Total Assessments"
                filterTags={false}
                isAllSelected={isAllSelected}
              />
              <PieSection
                data={[
                  { name: "Approved",  value: tprmStats.approved  },
                  { name: "Submitted", value: tprmStats.submitted },
                  { name: "Sent",      value: tprmStats.sent      },
                  { name: "Rejected",  value: tprmStats.rejected  },
                ]}
                cells={[
                  <Cell key="ap" fill="#10b981" />,
                  <Cell key="su" fill="#f59e0b" />,
                  <Cell key="se" fill="#3b82f6" />,
                  <Cell key="re" fill="#ef4444" />,
                ]}
                legend={[
                  ["#10b981", tprmStats.approved,  "Approved"],
                  ["#f59e0b", tprmStats.submitted, "Submitted"],
                  ["#3b82f6", tprmStats.sent,      "Sent"],
                ]}
              />
            </motion.div>
          )}

          {/* ── AIIA ──────────────────────────────────────────────────────── */}
          {showAiia && (
            <motion.div
              id="aiia-module"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              whileHover={{ scale: 1.02, boxShadow: "0 12px 24px rgba(217,70,239,0.12)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/aiia")}
              style={{ ...cardStyle, borderLeft: "4px solid #d946ef" }}
            >
              <CardHeader
                icon={<Brain size={16} color="white" />}
                iconGradient="linear-gradient(135deg, #d946ef, #a21caf)"
                title="AIIA"
                total={aiiaStats.total}
                totalLabel="Total Assessments"
                filterTags={false}
                isAllSelected={isAllSelected}
              />
              <PieSection
                data={getPieChartData([
                  { name: "Approved",  value: aiiaStats.approved  },
                  { name: "Submitted", value: aiiaStats.submitted },
                  { name: "Draft",     value: aiiaStats.draft     },
                ])}
                cells={getPieChartData([
                  { color: "#10b981" },
                  { color: "#6366f1" },
                  { color: "#f59e0b" },
                ]).map((e, i) => <Cell key={i} fill={e.color} />)}
                legend={[
                  ["#10b981", aiiaStats.approved,  "Approved"],
                  ["#6366f1", aiiaStats.submitted, "Submitted"],
                  ["#f59e0b", aiiaStats.draft,     "Draft"],
                ]}
              />
            </motion.div>
          )}

        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-white border-t border-gray-200 mt-auto px-4 py-5 sm:px-3 sm:py-4">
        <div className="w-full max-w-[1400px] mx-auto 2xl:max-w-[1600px]">
          <div className="flex justify-center items-center gap-3 mt-2">
            <button
              onClick={() => setShowTprm((v) => !v)}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {showTprm ? "Hide" : "Show"} TPRM
            </button>
            <div className="text-gray-400 text-[13px] leading-6 tracking-[0.3px] sm:text-[12px] 2xl:text-[14px]">
              © {new Date().getFullYear()} CalVant. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLoggedIn;