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
import auditService from "../gapAssessment/services/auditService";
import gapService from "../gapAssessment/services/gapService";
import {
  ISO_27001_CLAUSES,
  ISO_27001_CONTROL,
} from "../gapAssessment/constant";
import taskService from "../taskManagement/services/taskService";
import tprmService from "../tprm/services/tprmService";
import { getAllAssessments } from "../dpia/services/dpiaApi";
import { stage1Api } from "../aiia/services/aiiaApi";
import { FRAMEWORK_TILE_COLORS } from "../../context/frameworkService";
import "./DashboardLoggedIn.css";
import { useFramework } from "../../context/FrameworkContex";
import { getFrameworkCompliance } from "../integrations/complianceData";
import { useUI } from "../../context/UIContext";

// ─── Framework filter helpers (mirrors RiskAssessment.js) ─────────────────────
// ─── Framework filter helpers (mirrors RiskAssessment.js) ─────────────────────

const TYPE_TO_FW = {
  security: "ISO27001",
  cyber: "ISO27001",
  fraud: "ISO27001",
  privacy: "ISO27701",
  "artificial intelligence": "ISO42001",
};

const SOC2_RISK_TYPES = new Set(["security", "cyber", "fraud", "privacy"]);

function _getAllowedRiskTypes(activeDashboardCodes) {
  const TYPE_MAP = [
    { type: "Security", fw: ["ISO27001", "SOC2"] },
    { type: "Cyber", fw: ["ISO27001", "SOC2"] },
    { type: "Fraud", fw: ["ISO27001"] },
    { type: "Privacy", fw: ["ISO27701", "SOC2", "KSA_PDPL"] },
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
      ? String(risk.riskType)
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : [];
  if (types.length === 0) return false;
  const normalizedAllowed = new Set(
    [...allowedRiskTypes].map((t) => t.toLowerCase()),
  );
  return types.some((t) => normalizedAllowed.has(t));
}
// ─────────────────────────────────────────────────────────────────────────────

function _normalizeFrameworkCode(raw) {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function _auditMatchesFrameworks(audit, normalizedSelectedFW) {
  if (!audit) return false;
  const raw = audit.frameworkCode || audit.framework;
  if (!raw) return false;
  const rawValues = Array.isArray(raw) ? raw : [raw];
  const auditCodes = rawValues.map(_normalizeFrameworkCode).filter(Boolean);
  return normalizedSelectedFW.some((fw) =>
    auditCodes.some((code) => code === fw),
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const SessionExpiredModal = ({ onOk, onCancel }) => (
  <div
    style={{
      position: "fixed",
      inset: 2,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 4000,
    }}
  />
);

const isJwtExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

// ─── The five framework codes complianceData.js handles ──────────────────────

const DashboardLoggedIn = () => {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const [showChangePassword] = useState(false);
  const [setDropdownOpen] = useState(false);
  const [setFrameworkOpen] = useState(false);
  const [setTemplatesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { runTour, setRunTour } = useUI();
  const [sessionExpired, setSessionExpired] = useState(false);

  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const user = React.useMemo(() => {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    if (!user) setSessionExpired(true);
  }, [user]);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const resetIdleTimer = () => {
      lastActivityRef.current = Date.now();
    };
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    activityEvents.forEach((e) => window.addEventListener(e, resetIdleTimer));
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
      activityEvents.forEach((e) =>
        window.removeEventListener(e, resetIdleTimer),
      );
      clearInterval(idleTimerRef.current);
    };
  }, []);

  const tourSteps = [
    { target: "#compliance-module", content: "Real-time compliance summary." },
    {
      target: "#risk-module",
      content: "Overview of risks in your department.",
    },
    { target: "#task-module", content: "Tasks assigned to you." },
    { target: "#gap-module", content: "Gap Assessment against standards." },
    { target: "#doc-module", content: "Compliance document upload status." },
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if (["finished", "skipped"].includes(status)) {
      setRunTour(false);
    }
  };

  /* ── RISK ── */
  const [allRisks, setAllRisks] = useState([]);

  const handleApiError = (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      setSessionExpired(true);
      return true;
    }
    return false;
  };

  const loadRiskStats = useCallback(async () => {
    if (!user?.organization) return;
    try {
      const risks = await riskService.getAllRisks();
      if (!Array.isArray(risks)) return;
      const isRoot = user?.role?.some((r) => {
        const s = (typeof r === "string" ? r : r?.name || r?.roleName || "")
          .toLowerCase()
          .replace(/[\s_-]/g, "");
        return ["root", "ciso", "aio", "dpo"].some((role) => s.includes(role));
      });
      const userDepts = (user.departments || []).map((d) =>
        (d.name || "").trim().toLowerCase(),
      );
      const orgFiltered = risks.filter((risk) => {
        const orgMatch =
          String(risk.organization?._id || risk.organization) ===
          String(user.organization?._id || user.organization);
        if (!orgMatch) return false;
        if (isRoot) return true;
        return (
          risk.department &&
          userDepts.includes(risk.department.trim().toLowerCase())
        );
      });
      setAllRisks(orgFiltered);
    } catch (err) {
      handleApiError(err);
    }
  }, [user]);
  useEffect(() => {
    loadRiskStats();
  }, [loadRiskStats]);

  // ── Framework-aware risk filtering ──────────────────────────────────────────
  const {
    selectedFrameworks,
    isAllSelected,
    showDpia,
    showAiia,
    availableFrameworks,
  } = useFramework();

  const fwLabelToCode = useMemo(
    () => Object.fromEntries(availableFrameworks.map((fw) => [fw.id, fw.code])),
    [availableFrameworks],
  );

  const complianceFrameworkCodes = useMemo(
    () => availableFrameworks.map((fw) => fw.code),
    [availableFrameworks],
  );

  const allowedRiskTypesForDashboard = useMemo(() => {
    if (isAllSelected) return null;
    const activeCodes = new Set();
    selectedFrameworks.forEach((fw) => {
      const code = fwLabelToCode[fw];
      if (code) activeCodes.add(code);
    });
    return _getAllowedRiskTypes(activeCodes);
  }, [selectedFrameworks, isAllSelected]);

  const filteredRisks = useMemo(() => {
    if (!allowedRiskTypesForDashboard) return allRisks;
    return allRisks.filter((r) =>
      _riskMatchesFilter(r, allowedRiskTypesForDashboard),
    );
  }, [allRisks, allowedRiskTypesForDashboard]);

  const riskStats = useMemo(() => {
    return filteredRisks.reduce(
      (acc, risk) => {
        acc.total++;
        const impact = Math.max(
          parseInt(risk.confidentiality) || 0,
          parseInt(risk.integrity) || 0,
          parseInt(risk.availability) || 0,
        );
        const score = impact * (parseInt(risk.probability) || 0);
        const level =
          score <= 3
            ? "low"
            : score <= 8
              ? "medium"
              : score <= 12
                ? "high"
                : "critical";
        acc[level]++;
        risk.status?.toLowerCase() === "closed" ? acc.closed++ : acc.open++;
        return acc;
      },
      { total: 0, low: 0, medium: 0, high: 0, critical: 0, open: 0, closed: 0 },
    );
  }, [filteredRisks]);

  /* ── DOCUMENTATION (framework-aware, mirrors Documentation.js) ── */
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    uploaded: 0,
    pending: 0,
  });

  const getTotalFromBackendControls = (controls, currentUser) => {
    const roles = Array.isArray(currentUser?.role)
      ? currentUser.role
      : [currentUser?.role];
    const isAdmin = roles.some(
      (r) =>
        r === "root" ||
        r === "super_admin" ||
        r === "ciso" ||
        r === "dpo" ||
        r === "aio",
    );
    const userDeptNames = (currentUser?.departments || []).map((d) =>
      (d.name || "").toLowerCase(),
    );
    const docsSet = new Set();
    controls.forEach((ctrl) => {
      if (!ctrl.documents?.length) return;

      const ctrlDepts = (ctrl.departmentIds || []).map((d) =>
        (d || "").toLowerCase(),
      );

      // ✅ Also check dept from each document entry
      const docDepts = ctrl.documents
        .map((d) => (d.dept || "").toLowerCase())
        .filter(Boolean);

      const allDepts = [...ctrlDepts, ...docDepts];

      const hasAccess =
        isAdmin ||
        allDepts.length === 0 ||
        allDepts.some((d) => userDeptNames.includes(d));

      if (!hasAccess) return;

      ctrl.documents.forEach(({ doc }) => {
        if (doc) docsSet.add(doc);
      });
    });
    return docsSet.size;
  };

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

      // Build soaId → framework lookup
      const soaFrameworkMap = {};
      (soaList || []).forEach((soa) => {
        if (soa.id) soaFrameworkMap[String(soa.id)] = soa.framework;
      });

      // Enrich docs with framework from their linked SoA
      const orgDocs = (docs || [])
        .filter((d) => d.organization === user?.organization)
        .map((doc) => ({
          ...doc,
          framework:
            soaFrameworkMap[String(doc.soaId)] || doc.framework || null,
        }));
      const frameworkDocs = orgDocs.filter((doc) =>
        activeFWCodes.includes(_normalizeFrameworkCode(doc.framework)),
      );

      const frameworkControls = availableFrameworks
        .flatMap((fw, i) =>
          (controlResults[i] || []).map((c) => ({
            ...c,
            _fw: _normalizeFrameworkCode(fw.code),
          })),
        )
        .filter((ctrl) => activeFWCodes.includes(ctrl._fw));

      const totalRequired = getTotalFromBackendControls(
        frameworkControls,
        user,
      );

      const uploaded = frameworkDocs.filter((doc) => !!doc.url).length;

      setDocumentStats({
        total: totalRequired,
        uploaded,
        pending: Math.max(0, totalRequired - uploaded),
      });
    } catch (err) {
      handleApiError(err);
    }
  }, [user, selectedFrameworks, isAllSelected]);

  useEffect(() => {
    loadDocumentStats();
  }, [loadDocumentStats]);

  /* ── GAP & AUDITS ── */
  const [allAudits, setAllAudits] = useState([]);
  const [allGaps, setAllGaps] = useState([]);
  const [allControlsForGap, setAllControlsForGap] = useState([]);

  const loadGapStats = useCallback(async () => {
    if (!user?.organization) return;
    try {
      const [auditsRaw, gaps, ...controlResults] = await Promise.all([
        fetch(
          `https://api.calvant.com/audit/api/audits?organization=${encodeURIComponent(user?.organization?._id || user?.organization)}`,
          { headers: { "Content-Type": "application/json" } },
        )
          .then((r) => r.json())
          .catch(() => []),
        gapService.getGaps().catch(() => []),
        ...availableFrameworks.map((fw) =>
          controlService.getControlsByFramework(fw.code).catch(() => []),
        ),
      ]);

      console.log(
        "[loadGapStats] audits from correct endpoint:",
        auditsRaw?.length,
        auditsRaw?.slice(0, 2),
      );
      setAllAudits(Array.isArray(auditsRaw) ? auditsRaw : []);
      setAllGaps(gaps);
      // ... rest unchanged
      const allFetchedControls = availableFrameworks.flatMap((fw, i) =>
        (controlResults[i] || []).map((c) => ({
          ...c,
          _fw: _normalizeFrameworkCode(fw.code),
        })),
      );
      setAllControlsForGap(allFetchedControls);
    } catch (err) {
      handleApiError(err);
    }
  }, [user, selectedFrameworks, isAllSelected]);

  useEffect(() => {
    loadGapStats();
  }, [loadGapStats]);

  const auditStats = useMemo(() => {
    if (isAllSelected) return { total: allAudits.length };
    const normalizedSelectedFW = selectedFrameworks.map(
      _normalizeFrameworkCode,
    );

    // 🔍 DEBUG
    console.log("[auditStats] allAudits.length:", allAudits.length);
    console.log("[auditStats] normalizedSelectedFW:", normalizedSelectedFW);
    console.log(
      "[auditStats] audit framework samples:",
      allAudits.slice(0, 5).map((a) => ({
        frameworkCode: a.frameworkCode,
        framework: a.framework,
        normalized: _normalizeFrameworkCode(a.frameworkCode || a.framework),
      })),
    );

    const filtered = allAudits.filter((a) =>
      _auditMatchesFrameworks(a, normalizedSelectedFW),
    );

    console.log("[auditStats] filtered.length:", filtered.length);

    return { total: filtered.length };
  }, [allAudits, selectedFrameworks, isAllSelected]);

  const gapStats = useMemo(() => {
    const isRoot = user?.role?.some((r) => {
      const s = (typeof r === "string" ? r : r?.name || r?.roleName || "")
        .toLowerCase()
        .replace(/[\s_-]/g, "");
      return ["root", "ciso", "aio", "dpo"].some((role) => s.includes(role));
    });
    const deptNames = (user.departments || []).map((d) =>
      (d.name || "").trim().toLowerCase(),
    );

    const activeFWCodes = isAllSelected
      ? availableFrameworks.map((fw) => _normalizeFrameworkCode(fw.code))
      : selectedFrameworks.map(_normalizeFrameworkCode);

    const filteredControls = allControlsForGap.filter((c) =>
      activeFWCodes.includes(c._fw),
    );

    const totalCount = filteredControls.reduce((acc, item) => {
      const itemDepts = (item.departmentIds || item.departments || []).map(
        (d) => (typeof d === "string" ? d : d.name || d).trim().toLowerCase(),
      );
      const hasAccess = isRoot || itemDepts.some((d) => deptNames.includes(d));
      return hasAccess ? acc + (item.auditQuestions?.length || 1) : acc;
    }, 0);

    const filteredGaps = allGaps.filter((g) => {
      if (
        String(g.organization?._id || g.organization) !==
        String(user.organization?._id || user.organization)
      )
        return false;
      if (isRoot) return true;
      return deptNames.includes(
        String(g.department || "")
          .trim()
          .toLowerCase(),
      );
    });

    const closedCount = filteredGaps.filter(
      (g) =>
        (g.docScore !== "" && g.docScore !== undefined) ||
        (g.practiceScore !== "" && g.practiceScore !== undefined),
    ).length;

    return {
      total: totalCount,
      closed: closedCount,
      open: Math.max(0, totalCount - closedCount),
    };
  }, [allGaps, allControlsForGap, user, selectedFrameworks, isAllSelected]);

  /* ── FRAMEWORK COMPLIANCE ─────────────────────────────────────────────────
   *
   * Single source of truth: one Promise.all over getFrameworkCompliance() for
   * all four frameworks.  Both the per-framework tiles AND the banner totals
   * (fwTotal / fwCompliant) are derived from this one state object.
   *
   * Shape per key: { fullyCompliant, nonCompliant, partial, totalControls }
   * (getFrameworkCompliance returns { compliant, nonCompliant, partial,
   *  totalControls } — we map `compliant` → `fullyCompliant` for the JSX.)
   * ─────────────────────────────────────────────────────────────────────────*/
  const [frameworkComplianceData, setFrameworkComplianceData] = useState({});

  // And the useEffect — add availableFrameworks as dependency + use complianceFrameworkCodes
  useEffect(() => {
    if (complianceFrameworkCodes.length === 0) return; // wait for frameworks to load
    let cancelled = false;
    Promise.all(
      complianceFrameworkCodes.map(async (fw) => {
        try {
          const result = await getFrameworkCompliance(fw);
          return [
            fw,
            {
              fullyCompliant: result.compliant ?? 0,
              nonCompliant: result.nonCompliant ?? 0,
              partial: result.partial ?? 0,
              totalControls: result.totalControls ?? 0,
            },
          ];
        } catch {
          return [
            fw,
            {
              fullyCompliant: 0,
              nonCompliant: 0,
              partial: 0,
              totalControls: 0,
            },
          ];
        }
      }),
    ).then((results) => {
      if (!cancelled) setFrameworkComplianceData(Object.fromEntries(results));
    });
    return () => {
      cancelled = true;
    };
  }, [complianceFrameworkCodes]); // ← was [], now reactive to framework list

  /* ── TASKS ── */
  const [taskStats, setTaskStats] = useState({
    total: 0,
    myTasks: 0,
    pendingApproval: 0,
    completed: 0,
  });
  const loadTaskStats = useCallback(async () => {
    try {
      const tasks = await taskService.getAllTasks();
      if (!Array.isArray(tasks) || !user) return;
      const isRoot = user?.role?.some((r) => {
        const s = (typeof r === "string" ? r : r?.name || r?.roleName || "")
          .toLowerCase()
          .replace(/[\s_-]/g, "");
        return ["root", "ciso", "aio", "dpo"].some((role) => s.includes(role));
      });
      const userOrgId = user.organization?._id || user.organization;
      const orgTasks = tasks.filter(
        (t) =>
          String(t.organization?._id || t.organization) === String(userOrgId),
      );
      const deptTasks = isRoot
        ? orgTasks
        : orgTasks.filter((t) => {
            if (!t.department) return false;
            return (user.departments || [])
              .map((d) => (d.name || "").trim().toLowerCase())
              .includes(t.department.trim().toLowerCase());
          });
      setTaskStats({
        total: orgTasks.length,
        myTasks: deptTasks.length,
        pendingApproval: deptTasks.filter(
          (t) =>
            t.status === "Completed (Pending Approval)" ||
            (t.status === "Completed" && t.approved !== true),
        ).length,
        completed: deptTasks.filter((t) => t.status === "Approved").length,
      });
    } catch (err) {
      console.error("Error loading task stats:", err);
    }
  }, [user]);
  useEffect(() => {
    loadTaskStats();
  }, [loadTaskStats]);

  /* ── TPRM ── */
  const [tprmStats, setTprmStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  });
  const loadTprmStats = useCallback(async () => {
    if (!user?.organization) return;
    try {
      setTprmStats(
        await tprmService.getStats(
          user?.organization?._id || user?.organization,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }, [user]);
  useEffect(() => {
    loadTprmStats();
  }, [loadTprmStats]);

  /* ── DPIA ── */
  const [dpiaStats, setDpiaStats] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    draft: 0,
    highRisk: 0,
  });
  const loadDpiaStats = useCallback(async () => {
    if (!user?.organization) return;
    try {
      const data = await getAllAssessments(
        user?.organization?._id || user?.organization,
      );
      const dpias = Array.isArray(data) ? data : [];
      setDpiaStats({
        total: dpias.length,
        submitted: dpias.filter((d) => d.status === "SUBMITTED").length,
        inProgress: dpias.filter((d) => d.status === "IN_PROGRESS").length,
        draft: dpias.filter((d) => d.status === "DRAFT").length,
        highRisk: dpias.filter((d) => d.overallRiskLevel === "HIGH").length,
      });
    } catch (err) {
      console.error("Error loading DPIA stats:", err);
    }
  }, [user]);
  useEffect(() => {
    loadDpiaStats();
  }, [loadDpiaStats]);

  /* ── AIIA ── */
  const [aiiaStats, setAiiaStats] = useState({
    total: 0,
    approved: 0,
    submitted: 0,
    draft: 0,
    pending: 0,
  });

  const [showTprm, setShowTprm] = useState(true);

  const loadAiiaStats = useCallback(async () => {
    try {
      const assessments = (await stage1Api.getAll())?.data?.data || [];
      setAiiaStats({
        total: assessments.length,
        approved: assessments.filter((a) => a.status === "APPROVED").length,
        submitted: assessments.filter((a) => a.status === "SUBMITTED").length,
        draft: assessments.filter((a) => a.status === "DRAFT").length,
        pending: assessments.filter(
          (a) => a.status === "DRAFT" || a.status === "SUBMITTED",
        ).length,
      });
    } catch (err) {
      console.error("Error loading AIIA stats:", err);
    }
  }, []);
  useEffect(() => {
    loadAiiaStats();
  }, [loadAiiaStats]);

  /* ── helpers ── */
  const getPieChartData = (data) =>
    data.length === 0
      ? [{ name: "No Data", value: 1, color: "#e2e8f0" }]
      : data;

  /* ── Aggregated banner totals — derived from the single frameworkComplianceData state ── */
  // Filtered by global framework selector
  const filteredFrameworkCompliance = useMemo(() => {
    if (isAllSelected) return frameworkComplianceData;
    const activeKeys = new Set(
      selectedFrameworks.map((fw) => fwLabelToCode[fw]).filter(Boolean),
    );
    return Object.fromEntries(
      Object.entries(frameworkComplianceData).filter(([k]) =>
        activeKeys.has(k),
      ),
    );
  }, [frameworkComplianceData, selectedFrameworks, isAllSelected]);

  const fwTotal = useMemo(
    () =>
      Object.values(filteredFrameworkCompliance).reduce(
        (s, f) => s + f.totalControls,
        0,
      ),
    [filteredFrameworkCompliance],
  );

  const fwCompliant = useMemo(
    () =>
      Object.values(filteredFrameworkCompliance).reduce(
        (s, f) => s + f.fullyCompliant,
        0,
      ),
    [filteredFrameworkCompliance],
  );

  /* ── UI ── */
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

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: "#f8fafc",
          minHeight: "100vh",
          padding: "120px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #e2e8f0",
            borderTop: "3px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        minHeight: "100vh",
        fontFamily: "...",
        position: "relative",
        overflowX: "visible",
        width: "100%",
        paddingTop: "72px", // ← add this to clear the fixed navbar
        paddingLeft: "72px",
      }}
    >
      {/* Floating background blobs */}
      {[
        ["10%", "5%", "200px", "rgba(59,130,246,0.1)", "6s"],
        ["60%", "right:10%", "150px", "rgba(139,92,246,0.08)", "8s reverse"],
        ["bottom:20%", "50%", "100px", "rgba(16,185,129,0.06)", "7s"],
      ].map(([top, left, size, color, anim], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top,
            left,
            width: size,
            height: size,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            borderRadius: "50%",
            animation: `float ${anim} ease-in-out infinite`,
          }}
        />
      ))}

      {/* {sessionExpired && (
        <SessionExpiredModal
          onCancel={() => setSessionExpired(false)}
          onOk={() => {
            sessionStorage.clear();
            router.push("/");
          }}
        />
      )} */}

      <Joyride
        steps={tourSteps}
        run={runTour} // Controlled by the Context
        callback={handleJoyrideCallback}
        continuous
        showSkipButton
        styles={{ options: { primaryColor: "#3b82f6", zIndex: 3000 } }}
      />

      <main className="w-full max-w-[1200px] mx-auto px-5 py-[10px] box-border overflow-x-visible lg:max-w-full lg:px-[14px] lg:pb-[50px] sm:px-3 sm:pb-[40px] 2xl:max-w-[1400px] 2xl:px-5 2xl:pt-8 2xl:pb-[70px]">
        {/* ── Top Stats Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            marginBottom: "16px",
            padding: "16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            boxShadow: "0 6px 24px rgba(102,126,234,0.25)",
            position: "relative",
            overflow: "visible",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "radial-gradient(circle at 20% 80%, rgba(120,119,198,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
              opacity: 0.5,
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {[
              {
                icon: <TrendingUp size={16} color="white" />,
                gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
                value:
                  riskStats.total +
                  gapStats.total +
                  fwTotal +
                  taskStats.total +
                  documentStats.total +
                  dpiaStats.total +
                  aiiaStats.total,
                label: "Overall Activities",
                tipTitle: "Total Activities Calculation",
                tipColor: "#22c55e",
                tip: `Risk Management: ${riskStats.total}\nGap Assessment: ${gapStats.total}\nCompliance: ${fwTotal}\nTask Management: ${taskStats.total}\nDocumentation: ${documentStats.total}\nDPIA: ${dpiaStats.total}\nAIIA: ${aiiaStats.total}`,
                tipPos: {
                  top: "75%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                },
              },
              {
                icon: <Activity size={16} color="white" />,
                gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                value:
                  riskStats.open +
                  gapStats.open +
                  (fwTotal - fwCompliant) +
                  (taskStats.total -
                    (taskStats.pendingApproval + taskStats.completed)) +
                  documentStats.pending +
                  dpiaStats.inProgress +
                  dpiaStats.draft +
                  aiiaStats.pending,
                label: "Pending Items",
                tipTitle: "Pending Items Calculation",
                tipColor: "#3b82f6",
                tip: `Open Risks: ${riskStats.open}\nOpen Gaps: ${gapStats.open}\nNon/Partial Compliance: ${fwTotal - fwCompliant}\nPending Tasks: ${taskStats.total - (taskStats.pendingApproval + taskStats.completed)}\nPending Documents: ${documentStats.pending}\nDPIA In-Progress/Draft: ${dpiaStats.inProgress + dpiaStats.draft}\nAIIA Pending: ${aiiaStats.pending}`,
                tipPos: {
                  top: "90%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                },
              },
              {
                icon: <Award size={16} color="white" />,
                gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
                value:
                  riskStats.closed +
                  gapStats.closed +
                  fwCompliant +
                  taskStats.completed +
                  taskStats.pendingApproval +
                  documentStats.uploaded +
                  dpiaStats.submitted +
                  aiiaStats.approved,
                label: "Completed Items",
                tipTitle: "Completed Items Calculation",
                tipColor: "#f59e0b",
                tip: `Closed Risks: ${riskStats.closed}\nClosed Gaps: ${gapStats.closed}\nCompliant Controls: ${fwCompliant}\nApproved Tasks: ${taskStats.completed}\nCompleted(PA) Tasks: ${taskStats.pendingApproval}\nUploaded Documents: ${documentStats.uploaded}\nDPIA Submitted: ${dpiaStats.submitted}\nAIIA Approved: ${aiiaStats.approved}`,
                tipPos: {
                  top: "-30%",
                  left: "50%",
                  transform: "translateX(-50%)",
                },
              },
              {
                icon: <Zap size={16} color="white" />,
                gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                value: `${Math.round(
                  ((riskStats.closed +
                    gapStats.closed +
                    fwCompliant +
                    taskStats.completed +
                    taskStats.pendingApproval +
                    documentStats.uploaded +
                    dpiaStats.submitted +
                    aiiaStats.approved) /
                    (riskStats.total +
                      gapStats.total +
                      fwTotal +
                      taskStats.total +
                      documentStats.total +
                      dpiaStats.total +
                      aiiaStats.total || 1)) *
                    100,
                )}%`,
                label: "Overall Progress",
                tipTitle: "Overall Progress Calculation",
                tipColor: "#8b5cf6",
                tip: `(${
                  riskStats.closed +
                  gapStats.closed +
                  fwCompliant +
                  taskStats.completed +
                  taskStats.pendingApproval +
                  documentStats.uploaded +
                  dpiaStats.submitted +
                  aiiaStats.approved
                } / ${
                  riskStats.total +
                    gapStats.total +
                    fwTotal +
                    taskStats.total +
                    documentStats.total +
                    dpiaStats.total +
                    aiiaStats.total || 1
                }) × 100`,
                tipPos: {
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                },
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "visible",
                }}
                onMouseEnter={(e) => {
                  const t = e.currentTarget.querySelector(".tip");
                  if (t) t.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const t = e.currentTarget.querySelector(".tip");
                  if (t) t.style.opacity = "0";
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: card.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "white",
                      lineHeight: "1.1",
                    }}
                  >
                    {card.value}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.8)",
                      fontWeight: "500",
                    }}
                  >
                    {card.label}
                  </div>
                </div>
                <div
                  className="tip"
                  style={{
                    position: "absolute",
                    ...card.tipPos,
                    background: "rgba(0,0,0,0.95)",
                    color: "white",
                    padding: "8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    maxWidth: "320px",
                    textAlign: "center",
                    opacity: "0",
                    transition: "all 0.3s ease",
                    pointerEvents: "none",
                    zIndex: 99999,
                    boxShadow: "0 12px 20px rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    whiteSpace: "pre-line",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: card.tipColor,
                    }}
                  >
                    {card.tipTitle}
                  </div>
                  <div style={{ fontSize: "10px", lineHeight: "1.4" }}>
                    {card.tip}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Module Cards Grid ── */}
        <div className="flex-1 grid gap-6 p-4 max-w-[1400px] mx-auto content-start overflow-x-visible [grid-template-columns:repeat(auto-fit,minmax(270px,1fr))]">
          {/* FRAMEWORK COMPLIANCE */}
          <motion.div
            id="compliance-module"
            className="bg-white rounded-xl p-5 flex flex-col cursor-pointer border-l-4 border-rose-500 md:col-span-2 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{
              scale: 1.01,
              boxShadow: "0 12px 24px rgba(244,63,94,0.12)",
            }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push("/compliances")}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-rose-500 to-rose-600">
                  <ShieldCheck size={18} color="white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 m-0">
                  Framework Compliance
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 leading-none">
                  {fwTotal}
                </div>
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                  total controls
                </div>
              </div>
            </div>

            {/* Body: big pie left | divider | 2×2 grid right */}
            <div className="flex items-center gap-5">
              {/* Overall pie */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <CompliancePie
                  compliant={fwCompliant}
                  nonCompliant={fwTotal - fwCompliant}
                  size={150}
                />
                <div className="flex gap-3 text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {fwCompliant} Compliant
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    {fwTotal - fwCompliant} Non
                  </span>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="w-px self-stretch bg-slate-100 flex-shrink-0" />

              {/* 2×2 framework tiles */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                {availableFrameworks
                  .filter(
                    (fw) => isAllSelected || selectedFrameworks.includes(fw.id),
                  )
                  .map((fw) => {
                    const d = frameworkComplianceData[fw.code] ?? {
                      fullyCompliant: 0,
                      nonCompliant: 0,
                      partial: 0,
                      totalControls: 0,
                    };
                    const score =
                      d.totalControls > 0
                        ? Math.round((d.fullyCompliant / d.totalControls) * 100)
                        : 0;
                    const tileColor =
                      FRAMEWORK_TILE_COLORS[fw.code] ?? fw.color;
                    return (
                      <div
                        key={fw.code}
                        className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 hover:border-slate-200 transition-colors"
                      >
                        <CompliancePie
                          compliant={d.fullyCompliant}
                          nonCompliant={d.nonCompliant}
                          size={54}
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-[11px] font-bold uppercase tracking-wide leading-tight"
                            style={{ color: tileColor }}
                          >
                            {fw.label}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {fw.sub}
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-sm font-bold text-slate-700">
                              {score}%
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {d.totalControls} controls
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>

          {/* RISK */}
          <motion.div
            id="risk-module"
            className="bg-white rounded-xl min-h-[210px] p-4 flex flex-col cursor-pointer border-l-4 border-blue-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 12px 24px rgba(59,130,246,0.12)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/risk-assessment")}
          >
            <div className="flex justify-between items-start mb-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
                  <BarChart3 size={20} color="white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 m-0">
                    Risks
                  </h3>
                  {!isAllSelected && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 2,
                      }}
                    >
                      {selectedFrameworks.map((fw) => (
                        <span
                          key={fw}
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 10,
                            background: "#e0f2fe",
                            color: "#0369a1",
                            border: "1px solid #bae6fd",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl font-bold text-slate-900 leading-[1.1]">
                  {riskStats.total}
                </div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">
                  {isAllSelected ? "Total Risks" : "Filtered Risks"}
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-full aspect-square max-w-[135px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Low", value: riskStats.low },
                        { name: "Medium", value: riskStats.medium },
                        {
                          name: "High",
                          value: riskStats.high + riskStats.critical,
                        },
                      ]}
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={1000}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                      formatter={(v, n) => [`${v}`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[13px] font-semibold text-slate-600 flex flex-wrap gap-[10px] justify-center mt-[14px]">
                {[
                  ["bg-green-500", riskStats.low, "Low"],
                  ["bg-amber-500", riskStats.medium, "Medium"],
                  ["bg-red-500", riskStats.high + riskStats.critical, "High"],
                  ["bg-gray-400", riskStats.open, "Open"],
                ].map(([cls, v, l]) => (
                  <div key={l} className="flex items-center gap-[6px]">
                    <span
                      className={`w-[6px] h-[6px] rounded-full ${cls}`}
                    ></span>
                    {v} {l}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* TASK */}
          <motion.div
            id="task-module"
            className="bg-white rounded-xl min-h-[210px] p-4 flex flex-col cursor-pointer border-l-4 border-amber-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 12px 24px rgba(245,158,11,0.12)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/task-management")}
          >
            <div className="flex justify-between items-start mb-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-700">
                  <CheckSquare size={20} color="white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 m-0">
                  Tasks
                </h3>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl font-bold text-slate-900 leading-[1.1]">
                  {taskStats.total}
                </div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">
                  Total Tasks
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-full aspect-square max-w-[135px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Done", value: taskStats.completed },
                        {
                          name: "Pending",
                          value:
                            taskStats.total -
                            (taskStats.pendingApproval + taskStats.completed),
                        },
                      ]}
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={900}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                      formatter={(v, n) => [`${v}`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[13px] font-semibold text-slate-600 flex flex-wrap gap-[10px] justify-center mt-[14px]">
                <div className="flex items-center gap-[6px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-green-500"></span>
                  {taskStats.completed} Done
                </div>
                <div className="flex items-center gap-[6px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-amber-500"></span>
                  {taskStats.total -
                    (taskStats.pendingApproval + taskStats.completed)}{" "}
                  Pending
                </div>
              </div>
            </div>
          </motion.div>

          {/* GAP */}
          <motion.div
            id="gap-module"
            className="bg-white rounded-xl min-h-[210px] p-4 flex flex-col cursor-pointer border-l-4 border-emerald-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.0001 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 12px 24px rgba(16,185,129,0.12)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/gap-assessment")}
          >
            <div className="flex justify-between items-start mb-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <ClipboardCheck size={16} color="white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 m-0">
                    Audits
                  </h3>
                  {!isAllSelected && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 2,
                      }}
                    >
                      {selectedFrameworks.map((fw) => (
                        <span
                          key={fw}
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 10,
                            background: "#ecfdf5",
                            color: "#059669",
                            border: "1px solid #d1fae5",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl font-bold text-slate-900 leading-[1.1]">
                  {auditStats.total}
                </div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">
                  {isAllSelected ? "Total Audits" : "Filtered Audits"}
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-full aspect-square max-w-[135px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Assessed", value: gapStats.closed },
                        { name: "Pending", value: gapStats.open },
                      ]}
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={1200}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                      formatter={(v, n) => [`${v}`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[13px] font-semibold text-slate-600 flex flex-wrap gap-[10px] justify-center mt-[14px]">
                <div className="flex items-center gap-[6px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-green-500"></span>
                  {gapStats.closed} Assessed
                </div>
                <div className="flex items-center gap-[6px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-red-500"></span>
                  {gapStats.open} Pending
                </div>
              </div>
            </div>
          </motion.div>

          {/* DOCUMENTATION */}
          <motion.div
            id="doc-module"
            className="bg-white rounded-xl min-h-[210px] p-4 flex flex-col cursor-pointer border-l-4 border-violet-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.0001 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 12px 24px rgba(139,92,246,0.12)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/documentation")}
          >
            <div className="flex justify-between items-start mb-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500 to-violet-600">
                  <FileText size={16} color="white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 m-0">
                    Policies
                  </h3>
                  {!isAllSelected && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 2,
                      }}
                    >
                      {selectedFrameworks.map((fw) => (
                        <span
                          key={fw}
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 10,
                            background: "#f3e8ff",
                            color: "#7c3aed",
                            border: "1px solid #ddd6fe",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl font-bold text-slate-900 leading-[1.1]">
                  {documentStats.total}
                </div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">
                  {isAllSelected ? "Total Policies" : "Filtered Policies"}
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-full aspect-square max-w-[135px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Uploaded", value: documentStats.uploaded },
                        { name: "Pending", value: documentStats.pending },
                      ]}
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={1200}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                      formatter={(v, n) => [`${v}`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[13px] font-semibold text-slate-600 flex flex-wrap gap-[10px] justify-center mt-[14px]">
                <div className="flex items-center gap-[6px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-green-500"></span>
                  {documentStats.uploaded} Uploaded
                </div>
                <div className="flex items-center gap-[6px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-red-500"></span>
                  {documentStats.pending} Pending
                </div>
              </div>
            </div>
          </motion.div>

          {/* DPIA */}
          {showDpia && (
            <motion.div
              id="dpia-module"
              className="bg-white rounded-xl min-h-[210px] p-4 flex flex-col cursor-pointer border-l-4 border-sky-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 12px 24px rgba(14,165,233,0.12)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/dpia")}
            >
              <div className="flex justify-between items-start mb-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-sky-700">
                    <ShieldCheck size={16} color="white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 m-0">
                    DPIA
                  </h3>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold text-slate-900 leading-[1.1]">
                    {dpiaStats.total}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase">
                    Total Assessments
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-full aspect-square max-w-[135px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData([
                          {
                            name: "Submitted",
                            value: dpiaStats.submitted,
                            color: "#10b981",
                          },
                          {
                            name: "In Progress",
                            value: dpiaStats.inProgress,
                            color: "#6366f1",
                          },
                          {
                            name: "Draft",
                            value: dpiaStats.draft,
                            color: "#f59e0b",
                          },
                        ])}
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={900}
                      >
                        {getPieChartData([
                          { color: "#10b981" },
                          { color: "#6366f1" },
                          { color: "#f59e0b" },
                        ]).map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                        formatter={(v, n) =>
                          n === "No Data" ? ["No Data", n] : [`${v}`, n]
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[13px] font-semibold text-slate-600 flex flex-wrap gap-[10px] justify-center mt-[14px]">
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-emerald-500"></span>
                    {dpiaStats.submitted} Submitted
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-indigo-500"></span>
                    {dpiaStats.inProgress} In Progress
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-amber-500"></span>
                    {dpiaStats.draft} Draft
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TPRM */}
          {showTprm && (
            <motion.div
              id="tprm-module"
              className="bg-white rounded-xl min-h-[210px] p-4 flex flex-col cursor-pointer border-l-4 border-indigo-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 12px 24px rgba(99,102,241,0.12)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/tprm")}
            >
              <div className="flex justify-between items-start mb-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700">
                    <ShieldCheck size={16} color="white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 m-0">
                    TPRM
                  </h3>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold text-slate-900 leading-[1.1]">
                    {tprmStats.total}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase">
                    Total Assessments
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-full aspect-square max-w-[135px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Approved", value: tprmStats.approved },
                          { name: "Submitted", value: tprmStats.submitted },
                          { name: "Sent", value: tprmStats.sent },
                          { name: "Rejected", value: tprmStats.rejected },
                        ]}
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                        formatter={(v, n) => [`${v}`, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[13px] font-semibold text-slate-600 flex flex-wrap gap-[10px] justify-center mt-[14px]">
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-emerald-500"></span>
                    {tprmStats.approved} Approved
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-amber-500"></span>
                    {tprmStats.submitted} Submitted
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-blue-500"></span>
                    {tprmStats.sent} Sent
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* AIIA */}
          {showAiia && (
            <motion.div
              id="aiia-module"
              className="bg-white rounded-xl min-h-[210px] p-4 flex flex-col cursor-pointer border-l-4 border-fuchsia-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 12px 24px rgba(217,70,239,0.12)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/aiia")}
            >
              <div className="flex justify-between items-start mb-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-fuchsia-500 to-fuchsia-700">
                    <Brain size={16} color="white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 m-0">
                    AIIA
                  </h3>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold text-slate-900 leading-[1.1]">
                    {aiiaStats.total}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase">
                    Total Assessments
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-full aspect-square max-w-[135px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData([
                          {
                            name: "Approved",
                            value: aiiaStats.approved,
                            color: "#10b981",
                          },
                          {
                            name: "Submitted",
                            value: aiiaStats.submitted,
                            color: "#6366f1",
                          },
                          {
                            name: "Draft",
                            value: aiiaStats.draft,
                            color: "#f59e0b",
                          },
                        ])}
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {getPieChartData([
                          { color: "#10b981" },
                          { color: "#6366f1" },
                          { color: "#f59e0b" },
                        ]).map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                        formatter={(v, n) =>
                          n === "No Data" ? ["No Data", n] : [`${v}`, n]
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[13px] font-semibold text-slate-600 flex flex-wrap gap-[10px] justify-center mt-[14px]">
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-emerald-500"></span>
                    {aiiaStats.approved} Approved
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-indigo-500"></span>
                    {aiiaStats.submitted} Submitted
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-amber-500"></span>
                    {aiiaStats.draft} Draft
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <footer className="w-full bg-white border-t border-gray-200 mt-auto px-4 py-5 sm:px-3 sm:py-4">
        <div className="w-full max-w-[1400px] mx-auto 2xl:max-w-[1600px]">
          <div className="flex justify-center items-center gap-3 mt-2">
            <button
              onClick={() => setShowTprm(!showTprm)}
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
