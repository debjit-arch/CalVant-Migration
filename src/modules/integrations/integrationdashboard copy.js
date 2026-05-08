import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CircularProgress,
  Snackbar,
  SnackbarContent,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@material-ui/core";
import axios from "axios";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme,
  Box,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@material-ui/core";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  CloudDownload as CloudSyncIcon,
  Functions as FunctionsIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Security as SecurityIcon,
  VpnKey as PrivacyTipIcon,
  VerifiedUser as Soc2Icon,
  Apps as AppsIcon,
  Description as DescriptionIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@material-ui/icons";
import { ChevronDown, ClipboardList, Brain } from "lucide-react";
import Evidence_Modal from "./evidencemodal";
import taskService from "../taskManagement/services/taskService";
import documentationService from "../documentation/services/documentationService";
import { useFramework } from "../../context/FrameworkContex";

const MAPPINGS_API = "https://api.calvant.com/framework/api/mappings/framework";
const CONTROLS_API = "https://api.calvant.com/framework/api/controls/framework";

const FRAMEWORK_CONFIG = {
  ISO27001: {
    label: "ISO 27001",
    description: "Information Security Management",
    storageKey: "risk_assessment_cache_v1",
    controlsCacheKey: "iso27001_controls_cache_v1",
    annexSectionTypes: new Set(["ANNEX_A"]),
    toMetricKey: (c) => (c?.startsWith("A.") ? c.substring(2) : c),
    toBareCode: (c) => (c?.startsWith("A.") ? c.substring(2) : c),
    isMapped: false,
  },
  ISO27701: {
    label: "ISO 27701",
    description: "Privacy Information Management",
    storageKey: "risk_assessment_cache_27701_v1",
    controlsCacheKey: "iso27701_controls_cache_v1",
    annexSectionTypes: new Set(["Annex_A", "Annex_B", "Annex_A_Security"]),
    toMetricKey: (c) => c,
    toBareCode: (c) => c,
    isMapped: false,
  },
  SOC2: {
    label: "SOC 2",
    description: "Trust Services Criteria",
    storageKey: "risk_assessment_cache_soc2_v1",
    controlsCacheKey: "soc2_controls_cache_v1",
    annexSectionTypes: new Set(["COMMON_CRITERIA", "ADDITIONAL_CRITERIA"]),
    toMetricKey: (c) => c,
    toBareCode: (c) => c,
    isMapped: true,
    mappingSources: ["ISO27001", "ISO27701"],
  },
  ISO42001: {
    label: "ISO 42001",
    description: "AI Management System",
    storageKey: "risk_assessment_cache_iso42001_v1",
    controlsCacheKey: "iso42001_controls_cache_v1",
    annexSectionTypes: new Set(["ANNEX_A", "ANNEX_B", "CORE"]),
    toMetricKey: (c) => c,
    toBareCode: (c) => c,
    isMapped: false,
  },
  KSA_PDPL: {
    label: "KSA PDPL",
    description: "Personal Data Protection Law",
    storageKey: "risk_assessment_cache_ksa_pdpl_v1",
    controlsCacheKey: "ksa_pdpl_controls_cache_v1",
    annexSectionTypes: new Set(["GENERAL_PROVISIONS"]),
    toMetricKey: (c) => c,
    toBareCode: (c) => c,
    isMapped: false,
  },
};

const ALL_FRAMEWORKS_OPTION = "ALL";

const FRAMEWORK_OPTIONS = [
  {
    code: ALL_FRAMEWORKS_OPTION,
    label: "All Frameworks",
    description: "Unified view across all frameworks",
    color: "#334155",
    bg: "#f1f5f9",
    icon: <AppsIcon style={{ fontSize: 18 }} />,
  },
  {
    code: "ISO27001",
    label: "ISO 27001",
    description: "Information Security Management",
    color: "#1565c0",
    bg: "#e3f2fd",
    icon: <SecurityIcon style={{ fontSize: 18 }} />,
  },
  {
    code: "ISO27701",
    label: "ISO 27701",
    description: "Privacy Information Management",
    color: "#6a1b9a",
    bg: "#f3e5f5",
    icon: <PrivacyTipIcon style={{ fontSize: 18 }} />,
  },
  {
    code: "SOC2",
    label: "SOC 2",
    description: "Trust Services Criteria",
    color: "#1b5e20",
    bg: "#e8f5e9",
    icon: <Soc2Icon style={{ fontSize: 18 }} />,
  },
  {
    code: "ISO42001",
    label: "ISO 42001",
    description: "AI Management System",
    color: "#e65100",
    bg: "#fff3e0",
    icon: <Brain size={18} />,
  },
  {
    code: "KSA_PDPL",
    label: "KSA PDPL",
    description: "Personal Data Protection Law",
    color: "#7b3f00",
    bg: "#fff8f0",
    icon: <SecurityIcon style={{ fontSize: 18 }} />,
  },
];

const FRAMEWORK_BADGE_STYLES = {
  ISO27001: {
    bg: "#e3f2fd",
    border: "#90caf9",
    color: "#1565c0",
    label: "ISO 27001",
  },
  ISO27701: {
    bg: "#f3e5f5",
    border: "#ce93d8",
    color: "#6a1b9a",
    label: "ISO 27701",
  },
  SOC2: { bg: "#e8f5e9", border: "#a5d6a7", color: "#1b5e20", label: "SOC 2" },
  ISO42001: {
    bg: "#fff3e0",
    border: "#ffcc80",
    color: "#e65100",
    label: "ISO 42001",
  },
  KSA_PDPL: {
    bg: "#fff8f0",
    border: "#f5c68a",
    color: "#7b3f00",
    label: "KSA PDPL",
  },
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) return "0.00";
  const num = typeof value === "number" ? value : parseFloat(value);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

const hasEvidence = (evidence) => {
  if (!evidence) return false;
  if (typeof evidence === "string") {
    try {
      const parsed = JSON.parse(evidence);
      if (Array.isArray(parsed)) return parsed.length > 0;
      if (typeof parsed === "object") return Object.keys(parsed).length > 0;
      return false;
    } catch {
      return evidence.length > 0 && !evidence.startsWith('"Graph API error');
    }
  }
  if (Array.isArray(evidence)) return evidence.length > 0;
  if (typeof evidence === "object") return Object.keys(evidence).length > 0;
  return false;
};

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
  return (
    (idx >= 0 ? String(idx).padStart(2, "0") : "99") + naturalSortKey(code)
  );
}

function frameworkSortKey(code = "", fw = "") {
  if (fw === "KSA_PDPL") {
    // "Article-12" → sort numerically by article number
    const match = code.match(/Article-(\d+)/i);
    return match
      ? `article:${match[1].padStart(6, "0")}`
      : `article:${code.toLowerCase()}`;
  }
  const c = code.trim().toUpperCase();
  if (fw === "SOC2") return soc2SortKey(c);
  const isAnnex = c.startsWith("A.");
  const isNumeric = /^\d+(\.\d+)*$/.test(c);
  let bucket;
  if (isNumeric) bucket = "0";
  else if (isAnnex) bucket = "1";
  else bucket = "2";
  let normalized;
  if (isNumeric) {
    normalized = c
      .split(".")
      .map((n) => n.padStart(5, "0"))
      .join(".");
  } else if (isAnnex) {
    normalized = c
      .replace("A.", "")
      .split(".")
      .map((n) => n.padStart(5, "0"))
      .join(".");
  } else {
    normalized = c;
  }
  return `${bucket}:${normalized}`;
}

const StatusDot = ({ status }) => {
  const config = {
    connected: { color: "#1976d2" },
    mapped: { color: "#2e7d32" },
    disconnected: { color: "#f44336" },
  }[status] || { color: "#e0e0e0" };
  const isSolid = status === "connected" || status === "mapped";
  return (
    <Box
      style={{
        width: 11,
        height: 11,
        borderRadius: "50%",
        backgroundColor: isSolid ? config.color : "transparent",
        border: isSolid ? "none" : `2.5px solid ${config.color}`,
        display: "inline-block",
        flexShrink: 0,
        cursor: "default",
      }}
    />
  );
};

const FrameworkDropdown = ({ selected, onChange }) => {
  const selectedOption =
    FRAMEWORK_OPTIONS.find((o) => o.code === selected) || FRAMEWORK_OPTIONS[0];
  return (
    <FormControl variant="outlined" size="small" style={{ minWidth: 260 }}>
      <InputLabel
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: "#475569",
          backgroundColor: "white",
          padding: "0 4px",
        }}
      >
        Framework
      </InputLabel>
      <Select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        label="Framework"
        style={{
          borderRadius: 10,
          backgroundColor: "white",
          fontWeight: 700,
          fontSize: 14,
          color: selectedOption.color,
        }}
        renderValue={(val) => {
          const opt = FRAMEWORK_OPTIONS.find((o) => o.code === val);
          if (!opt) return val;
          return (
            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
              <Box
                style={{
                  color: opt.color,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {opt.icon}
              </Box>
              <Box>
                <Typography
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: opt.color,
                    lineHeight: 1.2,
                  }}
                >
                  {opt.label}
                </Typography>
                <Typography
                  style={{
                    fontSize: 10,
                    color: `${opt.color}99`,
                    lineHeight: 1.1,
                  }}
                >
                  {opt.description}
                </Typography>
              </Box>
            </Box>
          );
        }}
        MenuProps={{
          PaperProps: {
            style: {
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              border: "1px solid #e2e8f0",
              marginTop: 4,
            },
          },
        }}
      >
        {FRAMEWORK_OPTIONS.map(
          ({ code, label, description, color, bg, icon }) => (
            <MenuItem
              key={code}
              value={code}
              style={{
                padding: "10px 16px",
                borderBottom:
                  code === ALL_FRAMEWORKS_OPTION ? "1px solid #e2e8f0" : "none",
                backgroundColor: selected === code ? bg : "transparent",
              }}
            >
              <Box display="flex" alignItems="center" style={{ gap: 10 }}>
                <Box
                  style={{
                    color: selected === code ? color : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {icon}
                </Box>
                <Box>
                  <Typography
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: selected === code ? color : "#334155",
                      lineHeight: 1.2,
                    }}
                  >
                    {label}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 11,
                      color: selected === code ? `${color}99` : "#94a3b8",
                      lineHeight: 1.2,
                    }}
                  >
                    {description}
                  </Typography>
                </Box>
                {code === ALL_FRAMEWORKS_OPTION && (
                  <Chip
                    label="Unified"
                    size="small"
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      fontWeight: 700,
                      height: 20,
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                )}
              </Box>
            </MenuItem>
          ),
        )}
      </Select>
    </FormControl>
  );
};

const PdfPreviewModal = ({ open, onClose, pdfUrl, fileName }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="lg"
    fullWidth
    PaperProps={{ style: { borderRadius: 12, height: "90vh" } }}
  >
    <DialogTitle
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box display="flex" alignItems="center" style={{ gap: 10 }}>
        <PdfIcon style={{ color: "#d32f2f", fontSize: 22 }} />
        <Typography style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
          {fileName || "Evidence Document"}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent style={{ padding: 0, display: "flex", flex: 1 }}>
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          title="PDF Preview"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            minHeight: 600,
          }}
        />
      ) : (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          style={{ width: "100%", height: 400 }}
        >
          <CircularProgress />
        </Box>
      )}
    </DialogContent>
    <DialogActions
      style={{ padding: "12px 24px", borderTop: "1px solid #e2e8f0" }}
    >
      <Button
        onClick={onClose}
        variant="outlined"
        style={{ borderRadius: 8, textTransform: "none", fontWeight: 600 }}
      >
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

const ManualUploadCell = ({
  controlId,
  onUpload,
  uploadedFileName,
  uploadedFileId,
  isUploading,
  onViewFile,
}) => {
  const inputRef = React.useRef();
  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      onUpload(controlId, null, "Only PDF files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onUpload(controlId, null, "File size exceeds 10MB limit");
      return;
    }
    await onUpload(controlId, file, null);
  };
  return (
    <Box display="flex" alignItems="center" style={{ gap: 4 }}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={handleChange}
        disabled={isUploading}
      />
      <Tooltip
        title={
          uploadedFileName
            ? `Re-upload (current: ${uploadedFileName})`
            : "Upload PDF evidence"
        }
        arrow
      >
        <span>
          <IconButton
            size="small"
            onClick={() => !isUploading && inputRef.current?.click()}
            disabled={isUploading}
            style={{
              backgroundColor: uploadedFileName ? "#e8f5e9" : "#f3e5f5",
              color: uploadedFileName ? "#388e3c" : "#9c27b0",
              width: 32,
              height: 32,
            }}
          >
            {isUploading ? (
              <CircularProgress size={14} style={{ color: "#9c27b0" }} />
            ) : (
              <AttachFileIcon style={{ fontSize: 16 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
      {uploadedFileId && (
        <Tooltip title={`View: ${uploadedFileName}`} arrow>
          <IconButton
            size="small"
            onClick={() =>
              onViewFile(controlId, uploadedFileId, uploadedFileName)
            }
            style={{
              backgroundColor: "#e3f2fd",
              color: "#0288d1",
              width: 32,
              height: 32,
            }}
          >
            <PdfIcon style={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

const TargetScoreCell = ({
  controlId,
  tenantId,
  frameworkCode,
  targetScore,
  onSave,
}) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleClick = () => {
    setInputValue(
      targetScore !== null && targetScore !== undefined
        ? String(targetScore)
        : "",
    );
    setEditing(true);
  };
  const handleSave = async () => {
    const numeric = parseFloat(inputValue);
    if (isNaN(numeric) || numeric < 0 || numeric > 100) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `https://api.calvant.com/compliance-brain/compliance/${tenantId}/${frameworkCode}/${controlId}/target-score`,
        { targetScore: numeric },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      onSave(controlId, numeric);
    } catch (err) {
      console.error("Failed to save target score", err);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (saving) return <CircularProgress size={18} />;
  if (editing)
    return (
      <TextField
        type="number"
        size="small"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setEditing(false);
        }}
        autoFocus
        inputProps={{
          min: 0,
          max: 100,
          step: 0.01,
          style: { textAlign: "center", width: 65 },
        }}
      />
    );
  if (targetScore !== null && targetScore !== undefined)
    return (
      <Chip
        label={`${formatPercentage(targetScore)}%`}
        color="primary"
        size="small"
        onClick={handleClick}
        style={{ fontWeight: 600, cursor: "pointer" }}
      />
    );
  return (
    <Chip
      label="Set target"
      size="small"
      onClick={handleClick}
      style={{
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 11,
        backgroundColor: "#f1f5f9",
        color: "#64748b",
        border: "1px dashed #94a3b8",
      }}
    />
  );
};

const MAPPING_SOURCE_STYLES = {
  ISO27001: {
    bg: "#e3f2fd",
    border: "#90caf9",
    color: "#1565c0",
    label: "ISO 27001",
  },
  ISO27701: {
    bg: "#f3e5f5",
    border: "#ce93d8",
    color: "#6a1b9a",
    label: "ISO 27701",
  },
};

const MappedSourceBadge = ({ sourceCode, sourceFramework }) => {
  const style =
    MAPPING_SOURCE_STYLES[sourceFramework] || MAPPING_SOURCE_STYLES.ISO27001;
  const isPrivacy = sourceFramework === "ISO27701";
  return (
    <Box
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 6px",
        borderRadius: 4,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      {isPrivacy ? (
        <PrivacyTipIcon style={{ fontSize: 9, color: style.color }} />
      ) : (
        <SecurityIcon style={{ fontSize: 9, color: style.color }} />
      )}
      <Typography
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: style.color,
          whiteSpace: "nowrap",
        }}
      >
        {sourceCode}
      </Typography>
    </Box>
  );
};

const FrameworkBadge = ({ frameworkCode }) => {
  const style = FRAMEWORK_BADGE_STYLES[frameworkCode];
  if (!style) return null;
  return (
    <Box
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 7px",
        borderRadius: 5,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        flexShrink: 0,
      }}
    >
      <Typography
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: style.color,
          whiteSpace: "nowrap",
          letterSpacing: 0.2,
        }}
      >
        {style.label}
      </Typography>
    </Box>
  );
};

function AddTaskModal({
  controlId,
  controlName,
  auditors,
  onClose,
  onCreated,
}) {
  const rawUser = sessionStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const orgId = user?.organization?._id || user?.organization || "";
  const changedBy = user?.name || user?.username || "System";
  const reporterId = user?.id || user?._id || "";

  const [form, setForm] = useState({
    description: controlName ? "CAP: " + controlName.slice(0, 80) : "",
    assignee: "",
    assigneeId: "",
    priority: "Medium",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "To-Do",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }
    setSaving(true);
    setError("");
    const assignedAuditor = auditors.find((a) => a.name === form.assignee);
    const employeeId =
      form.assigneeId || assignedAuditor?.id || assignedAuditor?._id || null;
    const employeeName = form.assignee || changedBy;
    const finalEmployeeId = !form.assignee ? reporterId || null : employeeId;
    const payload = {
      description: form.description.trim(),
      employee: employeeName,
      employeeId: finalEmployeeId,
      employeeName,
      employeeEmail: assignedAuditor?.email || user?.email || "",
      reporter: changedBy,
      reporterId: reporterId || null,
      reporterEmail: user?.email || "",
      priority: form.priority,
      startDate: form.startDate,
      endDate: form.endDate || null,
      status: form.status,
      organization: orgId,
      department: user?.department?.[0] || user?.department || "",
      source: "Compliance",
      controlId,
    };
    taskService
      .saveTask(payload, changedBy)
      .then(() => {
        setSaving(false);
        if (onCreated) onCreated();
        onClose();
      })
      .catch((err) => {
        setError(err.message || "Failed to create task.");
        setSaving(false);
      });
  };

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 1300,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const boxStyle = {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    overflow: "hidden",
  };
  const field = { display: "flex", flexDirection: "column", gap: 5 };
  const lbl = {
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
  const inp = {
    padding: "9px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    background: "#f8fafc",
    color: "#1e293b",
    boxSizing: "border-box",
    width: "100%",
  };
  const sel = { ...inp, cursor: "pointer", appearance: "none" };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={boxStyle}>
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b, #312e81)",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={18} color="#818cf8" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                Create Corrective Action Task
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                Control:{" "}
                <span style={{ color: "#c7d2fe", fontWeight: 700 }}>
                  {controlId}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={field}>
            <label style={lbl}>
              Description <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Describe the corrective action..."
              style={{ ...inp, resize: "vertical" }}
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div style={field}>
              <label style={lbl}>Assign To</label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.assignee}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const selectedAuditor = auditors.find(
                      (a) => a.name === selectedName,
                    );
                    setForm((p) => ({
                      ...p,
                      assignee: selectedName,
                      assigneeId:
                        selectedAuditor?.id || selectedAuditor?._id || "",
                    }));
                  }}
                  style={sel}
                >
                  <option value="">Self ({changedBy})</option>
                  {auditors.map((a) => (
                    <option key={a.id || a._id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  color="#94a3b8"
                  style={{
                    position: "absolute",
                    right: 9,
                    top: 11,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
            <div style={field}>
              <label style={lbl}>Priority</label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, priority: e.target.value }))
                  }
                  style={sel}
                >
                  {["Critical", "High", "Medium", "Low"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  color="#94a3b8"
                  style={{
                    position: "absolute",
                    right: 9,
                    top: 11,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
            <div style={field}>
              <label style={lbl}>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startDate: e.target.value }))
                }
                style={inp}
              />
            </div>
            <div style={field}>
              <label style={lbl}>Due Date</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, endDate: e.target.value }))
                }
                style={inp}
              />
            </div>
          </div>
          {error && (
            <div
              style={{
                padding: "8px 12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                fontSize: 13,
                color: "#991b1b",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </div>
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: "#f8fafc",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: saving ? "#94a3b8" : "#4f46e5",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ClipboardList size={13} />
            {saving ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const RiskAssessmentTable = () => {
  const { selectedFrameworks, isAllSelected } = useFramework();

  const normalizeFw = (raw) =>
    (raw || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "");
  const normalizedSelected = selectedFrameworks.map(normalizeFw);
  console.log(normalizedSelected);
  // Derive activeFramework from context
  const isMultiSelect = isAllSelected || normalizedSelected.length > 1;

  // activeFramework is now purely for internal logic (API calls/config)
  // If multi, we use ALL logic to aggregate data
  const activeFramework = isMultiSelect
    ? ALL_FRAMEWORKS_OPTION
    : normalizedSelected[0] || "ISO27001";

  // Helper to determine if we should show the "Unified/Frameworks" column
  const isAllFrameworks = isMultiSelect;
  const [controlLibraries, setControlLibraries] = useState({
    ISO27001: [],
    ISO27701: [],
    SOC2: [],
    ISO42001: [],
    KSA_PDPL: [],
  });
  const [controlsLoading, setControlsLoading] = useState({
    ISO27001: true,
    ISO27701: true,
    SOC2: true,
    ISO42001: true,
    KSA_PDPL: true,
  });
  const [apiDataMap, setApiDataMap] = useState({
    ISO27001: [],
    ISO27701: [],
    SOC2: [],
    ISO42001: [],
    KSA_PDPL: [],
  });
  const [soc2MappingsIndex, setSoc2MappingsIndex] = useState({});
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [evidenceModal, setEvidenceModal] = useState({ open: false, data: [] });
  const [loading, setLoading] = useState(true);
  const [manualUploads, setManualUploads] = useState({});
  const [uploadingControls, setUploadingControls] = useState({});
  const [deletingControls, setDeletingControls] = useState({});
  const [approvingControls, setApprovingControls] = useState({});
  const [approvalStatuses, setApprovalStatuses] = useState({});
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    controlId: null,
    fileId: null,
    fileName: null,
  });
  const [manualScores, setManualScores] = useState({});
  const [manualTargetScores, setManualTargetScores] = useState({});
  const [editingControl, setEditingControl] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [tenantError, setTenantError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [pdfModal, setPdfModal] = useState({
    open: false,
    url: null,
    fileName: null,
  });
  const [addTaskFor, setAddTaskFor] = useState(null);
  const [taskCreatedFor, setTaskCreatedFor] = useState({});
  const [auditors, setAuditors] = useState([]);
  const [mldDocuments, setMldDocuments] = useState([]);
  const [mldSoas, setMldSoas] = useState([]);
  const [mldDocsLoading, setMldDocsLoading] = useState(false);

  // ── SoA applicable set ───────────────────────────────────────────────────
  // Keys are "FRAMEWORK:controlCode" for every applicable SoA entry.
  // null  = still loading (show all while waiting)
  // Set() = loaded — empty means no entries saved yet (show all)
  const [soaApplicableSet, setSoaApplicableSet] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fwConfig = isAllFrameworks ? null : FRAMEWORK_CONFIG[activeFramework];
  // ── Fetch SoA applicable entries once on mount ───────────────────────────
  useEffect(() => {
    const fetchSoaEntries = async () => {
      try {
        const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
        const orgId =
          userData?.organization?._id ?? userData?.organization ?? null;

        const entries = await documentationService.getSoAEntries();

        // Build "FRAMEWORK:controlCode" keys for every applicable entry
        const applicable = new Set(
          entries
            .filter((e) => {
              const eOrg = e.organization?._id ?? e.organization;
              return orgId ? eOrg === orgId : true;
            })
            .map((e) => `${e.framework}:${String(e.category)}`),
        );

        setSoaApplicableSet(applicable);
        console.log(
          "[SoA Filter] ISO42001 entries:",
          [...applicable].filter((k) => k.startsWith("ISO42001:")),
        );
        console.log(
          "[SoA Filter] ISO27001 entries:",
          [...applicable].filter((k) => k.startsWith("ISO27001:")),
        );
        console.log(
          "[SoA Filter] ISO27701 entries:",
          [...applicable].filter((k) => k.startsWith("ISO27701:")),
        );
      } catch (err) {
        console.error("Failed to fetch SoA entries for filter:", err);
        // On error fall open — show everything
        setSoaApplicableSet(new Set());
      }
    };
    fetchSoaEntries();
  }, []);

  // ── Helper: is a control applicable in SoA for a given framework? ────────
  const isControlInSoa = useCallback(
    (controlCode, frameworkCode) => {
      // Still loading or no entries → show all
      if (soaApplicableSet === null || soaApplicableSet.size === 0) return true;

      // Direct match: e.g. "ISO27001:A.5.34" or "ISO42001:4.3" or "SOC2:CC6.1"
      if (soaApplicableSet.has(`${frameworkCode}:${controlCode}`)) return true;

      if (frameworkCode === "ISO27001" || frameworkCode === "ISO27701") {
        if (controlCode.startsWith("A.")) {
          // Annex A: only exact "FRAMEWORK:A.x.x" match.
          // Do NOT strip "A." and check bare — bare codes in SoA are clauses,
          // not Annex A controls. Stripping causes A.5.3 to match clause 5.3.
          return false;
        } else {
          // Clause: check if SoA accidentally stored it with "A." prefix
          return soaApplicableSet.has(`${frameworkCode}:A.${controlCode}`);
        }
      }

      return false;
    },
    [soaApplicableSet],
  );

  // ── Fetch MLD documents and SoA entries ──────────────────────────────────
  const fetchMldDocs = async () => {
    setMldDocsLoading(true);
    try {
      const rawUser = sessionStorage.getItem("user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      const orgId = user?.organization;
      const [docs, soaList] = await Promise.all([
        documentationService.getDocuments().catch(() => []),
        documentationService.getSoAEntries().catch(() => []),
      ]);
      const normalizeOrg = (o) =>
        o && typeof o === "object" ? (o._id ?? o.id) : o;
      setMldDocuments(
        (docs || []).filter((d) => normalizeOrg(d.organization) === orgId),
      );
      setMldSoas(
        (soaList || []).filter((s) => normalizeOrg(s.organization) === orgId),
      );
    } catch (err) {
      console.error("Failed to fetch MLD docs:", err);
      setMldDocuments([]);
      setMldSoas([]);
    } finally {
      setMldDocsLoading(false);
    }
  };

  const getLatestDocForSoA = useCallback(
    (soaId) => {
      const docs = mldDocuments
        .filter((d) => String(d.soaId) === String(soaId))
        .sort((a, b) => b.version - a.version);
      return docs.find((d) => !d.deleted) || docs[0];
    },
    [mldDocuments],
  );

  const hasAnyDocument = useCallback(
    (controlId) => {
      // Check 1: manual evidence uploaded via compliance upload
      if (manualUploads[controlId]?.fileId) return true;

      // Check 2: SoA document available for this control
      const framework = isAllFrameworks ? null : activeFramework;
      if (!framework) return false;

      const withA = controlId.startsWith("A.") ? controlId : `A.${controlId}`;
      const withoutA = controlId.startsWith("A.")
        ? controlId.substring(2)
        : controlId;
      const candidates = [...new Set([controlId, withA, withoutA])];

      return candidates.some((code) => {
        const matchingSoas = mldSoas.filter(
          (s) =>
            (s.framework || "").trim() === framework &&
            String(s.category).trim() === code,
        );
        return matchingSoas.some((soa) => {
          const doc = getLatestDocForSoA(soa.id ?? soa._id);
          return !!doc && !doc.deleted;
        });
      });
    },
    // getLatestDocForSoA is now defined above so this is safe
    [
      manualUploads,
      mldSoas,
      activeFramework,
      isAllFrameworks,
      getLatestDocForSoA,
    ],
  );

  const handlePreviewDoc = (soaEntry, doc) => {
    if (!doc || doc.deleted || !doc.url) {
      setSnackbar({
        open: true,
        message: "Document not available for preview.",
        severity: "warning",
      });
      return;
    }
    const baseUrl = `${process.env.NEXT_PUBLIC_SP}/doc-service`;
    const url =
      baseUrl + encodeURI(doc.url.startsWith("/") ? doc.url : `/${doc.url}`);
    setPdfModal({
      open: true,
      url,
      fileName:
        doc.originalFileName || soaEntry?.documentRef?.[0] || "Document",
    });
  };

  useEffect(() => {
    fetchMldDocs();
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    axios
      .get("https://api.calvant.com/user-service/api/users", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((res) => {
        setAuditors(
          (res.data || []).filter(
            (u) =>
              u.organization === organizationId &&
              !u.role?.includes("super_admin"),
          ),
        );
      })
      .catch(console.error);
  }, [organizationId]);

  // const handleFrameworkChange = (code) => {
  //   setActiveFramework(code);
  //   setPage(0);
  //   setSearch("");
  //   setManualUploads({});
  //   setManualScores({});
  //   setManualTargetScores({});
  //   setApprovalStatuses({});
  // };
  useEffect(() => {
    setPage(0);
    setSearch("");
    setManualUploads({});
    setManualScores({});
    setManualTargetScores({});
    setApprovalStatuses({});
  }, [activeFramework]);

  const loadControls = async (frameworkCode) => {
    const cfg = FRAMEWORK_CONFIG[frameworkCode];
    const cached = localStorage.getItem(cfg.controlsCacheKey);
    if (cached) {
      try {
        setControlLibraries((prev) => ({
          ...prev,
          [frameworkCode]: JSON.parse(cached),
        }));
        setControlsLoading((prev) => ({ ...prev, [frameworkCode]: false }));
        return;
      } catch {
        localStorage.removeItem(cfg.controlsCacheKey);
      }
    }
    try {
      const res = await axios.get(`${CONTROLS_API}/${frameworkCode}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });
      const controls = res.data || [];
      setControlLibraries((prev) => ({ ...prev, [frameworkCode]: controls }));
      localStorage.setItem(cfg.controlsCacheKey, JSON.stringify(controls));
    } catch (err) {
      console.error(`Failed to load ${frameworkCode} control library`, err);
      setSnackbar({
        open: true,
        message: `Failed to load ${frameworkCode} control library`,
        severity: "error",
      });
    } finally {
      setControlsLoading((prev) => ({ ...prev, [frameworkCode]: false }));
    }
  };

  const loadSoc2Mappings = async () => {
    setMappingsLoading(true);
    try {
      const [res27001, res27701] = await Promise.all([
        axios
          .get(`${MAPPINGS_API}/SOC2/ISO27001`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          })
          .catch(() => ({ data: [] })),
        axios
          .get(`${MAPPINGS_API}/SOC2/ISO27701`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          })
          .catch(() => ({ data: [] })),
      ]);
      const index = {};
      (res27001.data || []).forEach((m) => {
        if (!index[m.sourceControlCode]) index[m.sourceControlCode] = [];
        index[m.sourceControlCode].push({
          code: m.targetControlCode,
          framework: "ISO27001",
        });
      });
      (res27701.data || []).forEach((m) => {
        if (!index[m.sourceControlCode]) index[m.sourceControlCode] = [];
        index[m.sourceControlCode].push({
          code: m.targetControlCode,
          framework: "ISO27701",
        });
      });
      setSoc2MappingsIndex(index);
    } catch (err) {
      console.error("Failed to load SOC2 mappings", err);
    } finally {
      setMappingsLoading(false);
    }
  };

  useEffect(() => {
    loadControls("ISO27001");
    loadControls("ISO27701");
    loadControls("SOC2");
    loadControls("ISO42001");
    loadControls("KSA_PDPL");
    loadSoc2Mappings();
  }, []);

  const controlMaps = useMemo(() => {
    const result = {};
    for (const code of Object.keys(FRAMEWORK_CONFIG)) {
      const cfg = FRAMEWORK_CONFIG[code];
      const map = {};
      (controlLibraries[code] || []).forEach((c) => {
        map[cfg.toMetricKey(c.controlCode)] = c;
      });
      result[code] = map;
    }
    return result;
  }, [controlLibraries]);

  const controlMap = useMemo(
    () => (isAllFrameworks ? {} : controlMaps[activeFramework] || {}),
    [controlMaps, activeFramework, isAllFrameworks],
  );

  useEffect(() => {
    const fetchTenantId = async () => {
      try {
        const userDataStr = sessionStorage.getItem("user");
        if (!userDataStr) throw new Error("No user data in session storage.");
        const userData = JSON.parse(userDataStr);
        const orgId = userData.organization;
        if (!orgId) throw new Error("No organization assigned to current user");
        setOrganizationId(orgId);
        const tenantResponse = await axios.get(
          `https://api.calvant.com/user-service/api/organizations/${orgId}/tenant`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          },
        );
        setTenantId(tenantResponse.data);
        setSnackbar({
          open: true,
          message: `Connected to tenant: ${tenantResponse.data}`,
          severity: "success",
        });
        sessionStorage.setItem("tenantId", tenantResponse.data);
      } catch (err) {
        let msg = "Failed to load tenant configuration";
        if (err.response?.status === 404)
          msg = "No tenant configured for your organization.";
        else if (err.message) msg = err.message;
        setTenantError(msg);
        setSnackbar({ open: true, message: msg, severity: "error" });
        setLoading(false);
      }
    };
    fetchTenantId();
  }, []);

  const fetchComplianceData = async (showLoader = true) => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    if (showLoader) setLoading(true);
    try {
      const res = await axios.get(
        `https://api.calvant.com/compliance-brain/compliance/controls?tenantId=${tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      const results = res.data || [];
      const ksaPdplResults = results.filter(
        (item) => item.frameworkCode === "KSA_PDPL",
      );
      const iso27001Results = results.filter(
        (item) => item.frameworkCode === "ISO27001",
      );
      const iso27701Results = results.filter(
        (item) => item.frameworkCode === "ISO27701",
      );
      const iso42001Results = results.filter(
        (item) => item.frameworkCode === "ISO42001",
      );
      setApiDataMap((prev) => ({
        ...prev,
        ISO27001: iso27001Results,
        ISO27701: iso27701Results,
        SOC2: results,
        ISO42001: iso42001Results,
        KSA_PDPL: ksaPdplResults, // ← add
      }));
      localStorage.setItem(
        FRAMEWORK_CONFIG.KSA_PDPL.storageKey,
        JSON.stringify(ksaPdplResults),
      );
      localStorage.setItem(
        FRAMEWORK_CONFIG.ISO27001.storageKey,
        JSON.stringify(iso27001Results),
      );
      localStorage.setItem(
        FRAMEWORK_CONFIG.ISO27701.storageKey,
        JSON.stringify(iso27701Results),
      );
      localStorage.setItem(
        FRAMEWORK_CONFIG.SOC2.storageKey,
        JSON.stringify(results),
      );
      localStorage.setItem(
        FRAMEWORK_CONFIG.ISO42001.storageKey,
        JSON.stringify(iso42001Results),
      );
      if (showLoader)
        setSnackbar({
          open: true,
          message: `Loaded ${results.length} compliance controls`,
          severity: "success",
        });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.message || "Failed to load compliance data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncComplianceData = async () => {
    if (!tenantId) {
      setSnackbar({
        open: true,
        message: "No tenant configured. Cannot sync.",
        severity: "warning",
      });
      return;
    }
    try {
      setLoading(true);
      setSnackbar({
        open: true,
        message: "Syncing compliance data from cloud providers...",
        severity: "info",
      });
      await axios.post(
        `https://api.calvant.com/compliance-brain/compliance/sync?tenantId=${tenantId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      setSnackbar({
        open: true,
        message: "Compliance data synced successfully!",
        severity: "success",
      });
      await fetchComplianceData(false);
    } catch (err) {
      const msg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to sync compliance data";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    for (const code of Object.keys(FRAMEWORK_CONFIG)) {
      const cached = localStorage.getItem(FRAMEWORK_CONFIG[code].storageKey);
      if (cached) {
        try {
          setApiDataMap((prev) => ({ ...prev, [code]: JSON.parse(cached) }));
        } catch {
          localStorage.removeItem(FRAMEWORK_CONFIG[code].storageKey);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tenantId) {
      fetchComplianceData(true);
      fetchUploadedEvidence();
      fetchAllTargetScores();
    }
  }, [tenantId]); // eslint-disable-line

  useEffect(() => {
    if (tenantId) {
      fetchUploadedEvidence();
      fetchAllTargetScores();
    }
    setPage(0);
  }, [activeFramework, tenantId]); // eslint-disable-line

  const apiData = isAllFrameworks ? [] : apiDataMap[activeFramework] || [];

  // ── ALL frameworks: build unified view ──────────────────────────────────────
  const allFrameworksProcessedData = useMemo(() => {
    if (!isAllFrameworks) return [];
    const unifiedMap = {};
    for (const fwCode of ["ISO27001", "ISO27701", "ISO42001", "KSA_PDPL"]) {
      (controlLibraries[fwCode] || []).forEach((c) => {
        const uid = c.unifiedId || c.controlCode;
        if (!unifiedMap[uid]) {
          unifiedMap[uid] = {
            unifiedId: uid,
            controlId: uid,
            controlCode: c.controlCode,
            controlName: c.title,
            metric: c.metric,
            formula: c.formula,
            documents: c.documents || [],
            metrics: [],
            status: "disconnected",
            frameworks: [],
            frameworkControls: [],
            _framework: fwCode,
          };
        } else {
          if (c.documents?.length > 0 && unifiedMap[uid].documents.length === 0)
            unifiedMap[uid].documents = c.documents;
        }
        if (!unifiedMap[uid].frameworks.includes(fwCode))
          unifiedMap[uid].frameworks.push(fwCode);
        unifiedMap[uid].frameworkControls.push({
          frameworkCode: fwCode,
          controlCode: c.controlCode,
          unifiedId: c.unifiedId,
        });
      });
    }
    (controlLibraries["SOC2"] || []).forEach((c) => {
      const uid = c.unifiedId || c.controlCode;
      if (!unifiedMap[uid]) {
        unifiedMap[uid] = {
          unifiedId: uid,
          controlId: uid,
          controlCode: c.controlCode,
          controlName: c.title,
          metric: c.metric,
          formula: c.formula,
          documents: c.documents || [],
          metrics: [],
          status: "disconnected",
          frameworks: [],
          frameworkControls: [],
          _framework: "SOC2",
        };
      }
      if (!unifiedMap[uid].frameworks.includes("SOC2"))
        unifiedMap[uid].frameworks.push("SOC2");
      unifiedMap[uid].frameworkControls.push({
        frameworkCode: "SOC2",
        controlCode: c.controlCode,
        unifiedId: c.unifiedId,
      });
    });
    for (const fwCode of ["ISO27001", "ISO27701", "ISO42001", "KSA_PDPL"]) {
      const cfg = FRAMEWORK_CONFIG[fwCode];
      (apiDataMap[fwCode] || []).forEach((item) => {
        const key = cfg.toBareCode(item.controlId);
        const libEntry = (controlLibraries[fwCode] || []).find(
          (c) =>
            cfg.toMetricKey(c.controlCode) === key ||
            c.controlCode === item.controlId,
        );
        const uid = libEntry?.unifiedId || key;
        if (unifiedMap[uid]) {
          unifiedMap[uid].status = "connected";
          unifiedMap[uid].metrics.push({
            metricName: `${item.cloud} - ${item.controlName}`,
            currentPerformance: item.score ?? (item.compliant ? 100 : 0),
            evidence: item.evidence,
            sourceFramework: fwCode,
          });
        }
      });
    }
    const iso27001Data = apiDataMap["ISO27001"] || [];
    const iso27701Data = apiDataMap["ISO27701"] || [];
    const isoComplianceLookup = {};
    iso27001Data.forEach((item) => {
      const bareCode = FRAMEWORK_CONFIG.ISO27001.toBareCode(item.controlId);
      if (!isoComplianceLookup[bareCode]) isoComplianceLookup[bareCode] = [];
      isoComplianceLookup[bareCode].push(item);
      if (!isoComplianceLookup[item.controlId])
        isoComplianceLookup[item.controlId] = [];
      isoComplianceLookup[item.controlId].push(item);
    });
    const isoPrivacyLookup = {};
    iso27701Data.forEach((item) => {
      const key = FRAMEWORK_CONFIG.ISO27701.toBareCode(item.controlId);
      if (!isoPrivacyLookup[key]) isoPrivacyLookup[key] = [];
      isoPrivacyLookup[key].push(item);
      if (!isoPrivacyLookup[item.controlId])
        isoPrivacyLookup[item.controlId] = [];
      isoPrivacyLookup[item.controlId].push(item);
    });
    (controlLibraries["SOC2"] || []).forEach((c) => {
      const soc2Code = c.controlCode;
      const uid = c.unifiedId || soc2Code;
      if (!unifiedMap[uid]) return;
      const mappedEntries = soc2MappingsIndex[soc2Code] || [];
      let hasAnyLiveMetric = false;
      const fallbackMetrics = [];
      mappedEntries.forEach(
        ({ code: sourceCode, framework: sourceFramework }) => {
          let items = [];
          if (sourceFramework === "ISO27001") {
            const bareCode = FRAMEWORK_CONFIG.ISO27001.toBareCode(sourceCode);
            items =
              isoComplianceLookup[bareCode] ||
              isoComplianceLookup[sourceCode] ||
              [];
          } else if (sourceFramework === "ISO27701") {
            const bareCode = FRAMEWORK_CONFIG.ISO27701.toBareCode(sourceCode);
            items =
              isoPrivacyLookup[bareCode] || isoPrivacyLookup[sourceCode] || [];
          }
          if (items.length > 0) {
            items.forEach((item) => {
              const key = `${item.cloud} - ${item.controlName}`;
              if (!unifiedMap[uid].metrics.find((m) => m.metricName === key)) {
                unifiedMap[uid].metrics.push({
                  metricName: key,
                  currentPerformance: item.score ?? (item.compliant ? 100 : 0),
                  evidence: item.evidence,
                  sourceCode,
                  sourceFramework,
                });
              }
            });
            hasAnyLiveMetric = true;
          } else {
            const iso27001LibraryMetric = {};
            (controlLibraries["ISO27001"] || []).forEach((lc) => {
              if (lc.metric) {
                iso27001LibraryMetric[lc.controlCode] = lc.metric;
                const bare = FRAMEWORK_CONFIG.ISO27001.toBareCode(
                  lc.controlCode,
                );
                if (bare !== lc.controlCode)
                  iso27001LibraryMetric[bare] = lc.metric;
              }
            });
            const iso27701LibraryMetric = {};
            (controlLibraries["ISO27701"] || []).forEach((lc) => {
              if (lc.metric) iso27701LibraryMetric[lc.controlCode] = lc.metric;
            });
            const libMetric =
              sourceFramework === "ISO27001"
                ? iso27001LibraryMetric[sourceCode] ||
                  iso27001LibraryMetric[
                    FRAMEWORK_CONFIG.ISO27001.toBareCode(sourceCode)
                  ]
                : iso27701LibraryMetric[sourceCode];
            if (
              libMetric &&
              !fallbackMetrics.find((f) => f.metricName === libMetric)
            )
              fallbackMetrics.push({
                metricName: libMetric,
                sourceCode,
                sourceFramework,
                isFallback: true,
              });
          }
        },
      );
      if (hasAnyLiveMetric) unifiedMap[uid].status = "mapped";
      else if (fallbackMetrics.length > 0)
        unifiedMap[uid].fallbackMetrics = fallbackMetrics;
    });
    return Object.values(unifiedMap).sort((a, b) => {
      const FW_ORDER = {
        ISO27001: 0,
        ISO27701: 1,
        SOC2: 2,
        ISO42001: 3,
        KSA_PDPL: 4,
      };
      const fwA = a.frameworks?.[0] || a._framework || "ISO27001";
      const fwB = b.frameworks?.[0] || b._framework || "ISO27001";
      const fd = (FW_ORDER[fwA] ?? 9) - (FW_ORDER[fwB] ?? 9);
      return fd !== 0
        ? fd
        : frameworkSortKey(a.controlCode || a.controlId, fwA).localeCompare(
            frameworkSortKey(b.controlCode || b.controlId, fwB),
          );
    });
  }, [isAllFrameworks, controlLibraries, apiDataMap, soc2MappingsIndex]);

  // ── Per-framework processed data ─────────────────────────────────────────────
  const singleFrameworkProcessedData = useMemo(() => {
    if (isAllFrameworks) return [];
    const grouped = {};
    const cfg = FRAMEWORK_CONFIG[activeFramework];

    if (activeFramework === "SOC2") {
      const iso27001Data = apiDataMap["ISO27001"] || [];
      const isoComplianceLookup = {};
      iso27001Data.forEach((item) => {
        const bareCode = FRAMEWORK_CONFIG.ISO27001.toBareCode(item.controlId);
        if (!isoComplianceLookup[bareCode]) isoComplianceLookup[bareCode] = [];
        isoComplianceLookup[bareCode].push(item);
        if (!isoComplianceLookup[item.controlId])
          isoComplianceLookup[item.controlId] = [];
        isoComplianceLookup[item.controlId].push(item);
      });
      (controlLibraries["SOC2"] || []).forEach((c) => {
        grouped[c.controlCode] = {
          controlId: c.unifiedId,
          controlCode: c.controlCode,
          controlName: c.title,
          metric: c.metric,
          formula: c.formula,
          documents: c.documents || [],
          metrics: [],
          status: "disconnected",
          _framework: "SOC2",
        };
      });
      const iso27701Data = apiDataMap["ISO27701"] || [];
      const isoPrivacyLookup = {};
      iso27701Data.forEach((item) => {
        const key = FRAMEWORK_CONFIG.ISO27701.toBareCode(item.controlId);
        if (!isoPrivacyLookup[key]) isoPrivacyLookup[key] = [];
        isoPrivacyLookup[key].push(item);
        if (!isoPrivacyLookup[item.controlId])
          isoPrivacyLookup[item.controlId] = [];
        isoPrivacyLookup[item.controlId].push(item);
      });
      const iso27001LibraryMetric = {};
      (controlLibraries["ISO27001"] || []).forEach((c) => {
        if (c.metric) {
          iso27001LibraryMetric[c.controlCode] = c.metric;
          const bare = FRAMEWORK_CONFIG.ISO27001.toBareCode(c.controlCode);
          if (bare !== c.controlCode) iso27001LibraryMetric[bare] = c.metric;
        }
      });
      const iso27701LibraryMetric = {};
      (controlLibraries["ISO27701"] || []).forEach((c) => {
        if (c.metric) iso27701LibraryMetric[c.controlCode] = c.metric;
      });
      Object.keys(grouped).forEach((soc2Code) => {
        const mappedEntries = soc2MappingsIndex[soc2Code] || [];
        let hasAnyLiveMetric = false;
        const fallbackMetrics = [];
        mappedEntries.forEach(
          ({ code: sourceCode, framework: sourceFramework }) => {
            let items = [];
            if (sourceFramework === "ISO27001") {
              const bareCode = FRAMEWORK_CONFIG.ISO27001.toBareCode(sourceCode);
              items =
                isoComplianceLookup[bareCode] ||
                isoComplianceLookup[sourceCode] ||
                [];
            } else if (sourceFramework === "ISO27701") {
              const bareCode = FRAMEWORK_CONFIG.ISO27701.toBareCode(sourceCode);
              items =
                isoPrivacyLookup[bareCode] ||
                isoPrivacyLookup[sourceCode] ||
                [];
            }
            if (items.length > 0) {
              items.forEach((item) => {
                grouped[soc2Code].metrics.push({
                  metricName: `${item.cloud} - ${item.controlName}`,
                  currentPerformance: item.score ?? (item.compliant ? 100 : 0),
                  evidence: item.evidence,
                  sourceCode,
                  sourceFramework,
                });
              });
              hasAnyLiveMetric = true;
            } else {
              const libMetric =
                sourceFramework === "ISO27001"
                  ? iso27001LibraryMetric[sourceCode] ||
                    iso27001LibraryMetric[
                      FRAMEWORK_CONFIG.ISO27001.toBareCode(sourceCode)
                    ]
                  : iso27701LibraryMetric[sourceCode];
              if (
                libMetric &&
                !fallbackMetrics.find((f) => f.metricName === libMetric)
              )
                fallbackMetrics.push({
                  metricName: libMetric,
                  sourceCode,
                  sourceFramework,
                  isFallback: true,
                });
            }
          },
        );
        if (!hasAnyLiveMetric && fallbackMetrics.length > 0)
          grouped[soc2Code].fallbackMetrics = fallbackMetrics;
        if (hasAnyLiveMetric) grouped[soc2Code].status = "mapped";
      });
      Object.values(grouped).forEach((group) => {
        const seen = new Set();
        group.metrics = group.metrics.filter((m) => {
          const key = m.metricName;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (group.metrics.length > 0) group.status = "mapped";
      });
      return Object.values(grouped).sort((a, b) =>
        frameworkSortKey(a.controlId, "SOC2").localeCompare(
          frameworkSortKey(b.controlId, "SOC2"),
        ),
      );
    }

    (controlLibraries[activeFramework] || []).forEach((c) => {
      const key = cfg.toMetricKey(c.controlCode);
      grouped[key] = {
        controlId: key,
        controlCode: c.controlCode,
        unifiedId: c.unifiedId || null,
        controlName: c.title,
        metric: c.metric,
        formula: c.formula,
        documents: c.documents || [],
        metrics: [],
        status: "disconnected",
        _framework: activeFramework,
      };
    });
    apiData.forEach((item) => {
      const key = cfg.toBareCode(item.controlId);
      let belongsToFramework = false;
      if (activeFramework === "ISO27001")
        belongsToFramework = !item.controlId?.startsWith("A.");
      else if (activeFramework === "ISO27701")
        belongsToFramework = item.controlId?.startsWith("A.");
      else if (activeFramework === "ISO42001")
        belongsToFramework = item.frameworkCode === "ISO42001";
      else if (activeFramework === "KSA_PDPL")
        belongsToFramework = item.frameworkCode === "KSA_PDPL";
      else belongsToFramework = true;
      if (!belongsToFramework) return;
      if (!grouped[key]) {
        grouped[key] = {
          controlId: key,
          controlCode: item.controlId,
          controlName: item.controlName,
          metric: item.controlName,
          formula: null,
          documents: [],
          metrics: [],
          status: "connected",
          _framework: activeFramework,
        };
      }
      grouped[key].status = "connected";
      grouped[key].metrics.push({
        metricName: `${item.cloud} - ${item.controlName}`,
        currentPerformance: item.score ?? (item.compliant ? 100 : 0),
        evidence: item.evidence,
      });
    });
    return Object.values(grouped).sort((a, b) =>
      frameworkSortKey(a.controlId, activeFramework).localeCompare(
        frameworkSortKey(b.controlId, activeFramework),
      ),
    );
  }, [
    isAllFrameworks,
    controlLibraries,
    apiData,
    apiDataMap,
    activeFramework,
    soc2MappingsIndex,
  ]);

  const processedData = isAllFrameworks
    ? allFrameworksProcessedData
    : singleFrameworkProcessedData;

  // ── filteredData: SoA filter first, then search ───────────────────────────
  // SoA filter rules:
  //   • Single framework → keep only controls applicable for activeFramework
  //   • ALL frameworks   → keep if applicable in ANY of the group's frameworks
  //   • soaApplicableSet null or empty → show all (loading / no entries yet)
  // Update your filteredData useMemo:
  const filteredData = useMemo(() => {
    let data = processedData;

    // 1. Filter by Framework Selection
    // If "Select All" isn't checked, only show controls belonging to selected frameworks
    if (!isAllSelected) {
      data = data.filter((group) => {
        // For unified rows, check if any of the frameworks in that row are in our selection
        const rowFrameworks = group.frameworks || [group._framework];
        return rowFrameworks.some((fw) => normalizedSelected.includes(fw));
      });
    }

    // 2. SoA applicability filter (Keep your existing logic)
    if (soaApplicableSet !== null && soaApplicableSet.size > 0) {
      data = data.filter((group) => {
        if (isAllFrameworks) {
          return (group.frameworks || []).some((fw) =>
            isControlInSoa(group.controlCode || group.controlId, fw),
          );
        }
        return isControlInSoa(
          group.controlCode || group.controlId,
          activeFramework,
        );
      });
    }

    // 3. Search filter (Keep your existing logic)
    const filtered = !search.trim()
      ? data
      : data.filter(
          (g) =>
            (g.controlId || "").toLowerCase().includes(search.toLowerCase()) ||
            (g.unifiedId || "").toLowerCase().includes(search.toLowerCase()) ||
            (g.controlName || "")
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            (g.metric || "").toLowerCase().includes(search.toLowerCase()),
        );

    return filtered;
  }, [
    processedData,
    search,
    soaApplicableSet,
    isAllFrameworks,
    activeFramework,
    isControlInSoa,
    normalizedSelected,
    isAllSelected,
  ]);

  // ── Build flat rows ──────────────────────────────────────────────────────────
  const allFlatRows = useMemo(() => {
    const rows = [];
    for (const group of filteredData) {
      const hasDocs = (group.documents || []).some((d) => d.doc);
      if (group.metrics.length === 0) {
        rows.push({ group, metric: null, isFirst: true, isLast: true });
        if (hasDocs)
          rows.push({
            group,
            metric: null,
            isFirst: false,
            isLast: false,
            isDocRow: true,
          });
      } else {
        group.metrics.forEach((metric, idx) => {
          const isLast = idx === group.metrics.length - 1;
          rows.push({ group, metric, isFirst: idx === 0, isLast });
          // FIXED — only push doc row after the very last metric row
          if (isLast && hasDocs && idx === group.metrics.length - 1)
            rows.push({
              group,
              metric: null,
              isFirst: false,
              isLast: false,
              isDocRow: true,
            });
        });
      }
    }
    return rows;
  }, [filteredData]);

  const totalRows = allFlatRows.length;
  const currentPageRows = useMemo(
    () =>
      allFlatRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [allFlatRows, page, rowsPerPage],
  );

  const handleViewFile = async (controlId, fileId, fileName) => {
    try {
      setPdfModal({ open: true, url: null, fileName });
      const response = await axios.get(
        `https://api.calvant.com/compliance-brain/compliance/${tenantId}/${controlId}/${fileId}/download`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          responseType: "blob",
        },
      );
      const url = URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      setPdfModal({ open: true, url, fileName });
    } catch {
      setPdfModal({ open: false, url: null, fileName: null });
      setSnackbar({
        open: true,
        message: "Failed to load file for preview",
        severity: "error",
      });
    }
  };

  const handleClosePdfModal = () => {
    if (pdfModal.url && pdfModal.url.startsWith("blob:"))
      URL.revokeObjectURL(pdfModal.url);
    setPdfModal({ open: false, url: null, fileName: null });
  };

  const handleDeleteFile = (controlId, fileId, fileName) =>
    setConfirmDelete({ open: true, controlId, fileId, fileName });
  const handleDeleteConfirmed = async () => {
    const { controlId, fileId } = confirmDelete;
    setConfirmDelete({
      open: false,
      controlId: null,
      fileId: null,
      fileName: null,
    });
    setDeletingControls((prev) => ({ ...prev, [controlId]: true }));
    try {
      await axios.delete(
        `https://api.calvant.com/compliance-brain/compliance/${tenantId}/${controlId}/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      setManualUploads((prev) => {
        const u = { ...prev };
        delete u[controlId];
        return u;
      });
      setSnackbar({
        open: true,
        message: `🗑️ Evidence deleted for ${controlId}`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to delete: ${err.response?.data?.message || err.message}`,
        severity: "error",
      });
    } finally {
      setDeletingControls((prev) => ({ ...prev, [controlId]: false }));
    }
  };

  const handleApprove = async (controlId) => {
    setApprovingControls((prev) => ({ ...prev, [controlId]: true }));
    try {
      await axios.post(
        `https://api.calvant.com/compliance-brain/compliance/${tenantId}/${activeFramework}/${controlId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      setApprovalStatuses((prev) => ({ ...prev, [controlId]: "APPROVED" }));
      setSnackbar({
        open: true,
        message: `✅ Control ${controlId} approved`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to approve: ${err.response?.data?.message || err.message}`,
        severity: "error",
      });
    } finally {
      setApprovingControls((prev) => ({ ...prev, [controlId]: false }));
    }
  };

  const handleTargetScoreSaved = (controlId, value) => {
    setManualTargetScores((prev) => ({ ...prev, [controlId]: value }));
    setSnackbar({
      open: true,
      message: `✅ Target score saved for ${controlId}: ${value}%`,
      severity: "success",
    });
  };

  const handleManualUpload = async (controlId, file, validationError) => {
    if (validationError) {
      setSnackbar({
        open: true,
        message: `Upload failed: ${validationError}`,
        severity: "error",
      });
      return;
    }
    if (!file || !tenantId) return;
    setUploadingControls((prev) => ({ ...prev, [controlId]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const response = await axios.post(
        "https://api.calvant.com/compliance-brain/compliance/upload-evidence",
        formData,
        {
          params: {
            tenantId,
            controlId,
            frameworkCode: isAllFrameworks ? "ALL" : activeFramework,
          },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      if (response.data.success) {
        setManualUploads((prev) => ({
          ...prev,
          [controlId]: { fileName: file.name, fileId: response.data.fileId },
        }));
        setSnackbar({
          open: true,
          message: `✅ Evidence uploaded for ${controlId}: ${file.name}`,
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: `Upload failed: ${response.data.message}`,
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Upload error: ${err.response?.data?.message || err.message || "Failed to upload file"}`,
        severity: "error",
      });
    } finally {
      setUploadingControls((prev) => ({ ...prev, [controlId]: false }));
    }
  };

  const handleScoreChange = (controlId, value) =>
    setManualScores((prev) => ({ ...prev, [controlId]: value }));
  const handleScoreSave = async (controlId, frameworkForControl) => {
    setEditingControl(null);
    const numeric = parseFloat(manualScores[controlId]);
    if (isNaN(numeric) || numeric < 0 || numeric > 100) return;

    // Use the specific framework of the control rather than the global 'activeFramework'
    const targetFw = frameworkForControl || activeFramework;

    try {
      await axios.post(
        `https://api.calvant.com/compliance-brain/compliance/${tenantId}/${targetFw}/${controlId}/current-score`,
        { currentScore: numeric },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      setSnackbar({
        open: true,
        message: `✅ Current score saved for ${controlId}: ${numeric}%`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to save current score: ${err.response?.data?.message || err.message}`,
        severity: "error",
      });
    }
  };

  const fetchUploadedEvidence = async () => {
    if (!tenantId) return;
    try {
      const res = await axios.get(
        `https://api.calvant.com/compliance-brain/compliance/${tenantId}/evidence`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          params: {
            frameworkCode: isAllFrameworks ? undefined : activeFramework,
          },
        },
      );
      const files = res.data || [];
      const map = {};
      files.forEach((f) => {
        if (f.controlId)
          map[f.controlId] = { fileName: f.originalFileName, fileId: f.fileId };
      });
      setManualUploads(map);
    } catch (err) {
      console.warn("Could not fetch uploaded evidence:", err?.message);
      setManualUploads({});
    }
  };

  // AFTER — filters by frameworkCode so scores don't bleed across frameworks
  const fetchAllTargetScores = async () => {
    if (!tenantId) return;
    try {
      const res = await axios.get(
        `https://api.calvant.com/compliance-brain/compliance/${tenantId}/scores`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      const scores = res.data || [];
      const targetMap = {},
        currentMap = {},
        approvalMap = {};

      scores
        // Only include scores for the currently active framework
        .filter(
          (ts) => !ts.frameworkCode || ts.frameworkCode === activeFramework,
        )
        .forEach((ts) => {
          if (!ts.controlId) return;
          if (
            ts.targetScore !== undefined &&
            ts.targetScore !== null &&
            ts.targetScore !== ""
          )
            targetMap[ts.controlId] = ts.targetScore;
          if (
            ts.currentScore !== undefined &&
            ts.currentScore !== null &&
            ts.currentScore !== ""
          )
            currentMap[ts.controlId] = ts.currentScore;
          if (ts.approvalStatus) approvalMap[ts.controlId] = ts.approvalStatus;
        });

      setManualTargetScores(targetMap);
      setManualScores(currentMap);
      setApprovalStatuses(approvalMap);
    } catch (err) {
      console.warn("Could not fetch target scores:", err?.message);
    }
  };

  const getPerformanceColor = (p) => {
    if (p === 100) return { backgroundColor: "#4CAF50", color: "white" };
    if (p >= 70) return { backgroundColor: "#FF9800", color: "white" };
    return { backgroundColor: "#F44336", color: "white" };
  };

  const anyControlsLoading = Object.values(controlsLoading).some(Boolean);
  const isLoading =
    loading ||
    (isAllFrameworks ? anyControlsLoading : controlsLoading[activeFramework]) ||
    (activeFramework === "SOC2" && mappingsLoading);
  const selectedOption =
    FRAMEWORK_OPTIONS.find((o) => o.code === activeFramework) ||
    FRAMEWORK_OPTIONS[0];
  const tabColor = selectedOption.color;
  const colSpanCount = isAllFrameworks ? 10 : 9;

  const docCellStyle = (docIdx, controlDocs, extra = {}) => ({
    padding: "5px 8px",
    backgroundColor: "#ffffff",
    borderBottom: docIdx < controlDocs.length - 1 ? "none" : undefined,
    ...extra,
  });

  return (
    <Box style={{ paddingTop: 24, paddingBottom: 16 }}>
      <Container maxWidth="xl">
        <Box
          display="flex"
          alignItems="center"
          style={{ gap: 12, marginBottom: 20 }}
        >
          {/* <FrameworkDropdown
            selected={activeFramework}
            onChange={handleFrameworkChange}
          /> */}
          {isAllFrameworks && (
            <Box
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                backgroundColor: "#f1f5f9",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AppsIcon style={{ fontSize: 14, color: "#64748b" }} />
              <Typography
                style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}
              >
                Showing unified controls with{" "}
                <strong style={{ color: "#334155" }}>Unified ID</strong> across
                all frameworks
              </Typography>
            </Box>
          )}
        </Box>

        {tenantId && (
          <Paper
            elevation={0}
            style={{
              padding: "12px 20px",
              marginBottom: 16,
              borderRadius: 10,
              backgroundColor: "#e3f2fd",
              border: "1px solid #90caf9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
              <span style={{ fontSize: 20 }}>🏢</span>
              <span style={{ fontSize: 14, color: "#1565c0", fontWeight: 600 }}>
                Organization ID: <strong>{tenantId}</strong>
              </span>
            </Box>
            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
              {activeFramework === "SOC2" && (
                <Chip
                  label="Scores from ISO 27001 & ISO 27701"
                  size="small"
                  style={{
                    backgroundColor: "#e8f5e9",
                    color: "#1b5e20",
                    fontWeight: 600,
                    fontSize: 11,
                    border: "1px solid #a5d6a7",
                  }}
                />
              )}
              {activeFramework === "ISO42001" && (
                <Chip
                  label="AI Management System Controls"
                  size="small"
                  style={{
                    backgroundColor: "#fff3e0",
                    color: "#e65100",
                    fontWeight: 600,
                    fontSize: 11,
                    border: "1px solid #ffcc80",
                  }}
                />
              )}
              {activeFramework === "KSA_PDPL" && (
                <Chip
                  label="KSA Personal Data Protection Law"
                  size="small"
                  style={{
                    backgroundColor: "#fff8f0",
                    color: "#7b3f00",
                    fontWeight: 600,
                    fontSize: 11,
                    border: "1px solid #f5c68a",
                  }}
                />
              )}
              {isAllFrameworks && (
                <Chip
                  label="Unified view — all frameworks"
                  size="small"
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    fontWeight: 600,
                    fontSize: 11,
                    border: "1px solid #cbd5e1",
                  }}
                />
              )}
              {/* SoA filter indicator */}
              {soaApplicableSet !== null && soaApplicableSet.size > 0 && (
                <Chip
                  label={`📑 SoA: ${filteredData.length} applicable`}
                  size="small"
                  style={{
                    backgroundColor: "#f0fdf4",
                    color: "#15803d",
                    fontWeight: 600,
                    fontSize: 11,
                    border: "1px solid #86efac",
                  }}
                />
              )}
              <Chip
                label={selectedOption.label}
                size="small"
                style={{
                  fontWeight: 700,
                  backgroundColor: tabColor,
                  color: "white",
                  fontSize: 12,
                }}
              />
            </Box>
          </Paper>
        )}

        {tenantError && (
          <Paper
            elevation={0}
            style={{
              padding: "16px 20px",
              marginBottom: 16,
              borderRadius: 10,
              backgroundColor: "#ffebee",
              border: "1px solid #ef5350",
            }}
          >
            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ fontSize: 14, color: "#c62828", fontWeight: 500 }}>
                {tenantError}
              </span>
            </Box>
          </Paper>
        )}

        <Paper
          elevation={0}
          style={{
            padding: isMobile ? "20px 16px" : "32px 24px",
            marginBottom: 24,
            borderRadius: 12,
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Box
            display="flex"
            flexDirection={isMobile ? "column" : "row"}
            style={{ gap: 16 }}
            alignItems={isMobile ? "stretch" : "center"}
            justifyContent="space-between"
          >
            <Box flex={1}>
              <TextField
                fullWidth
                label={
                  <span
                    style={{
                      fontSize: isMobile ? "16px" : "18px",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    Search Controls
                  </span>
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder={
                  isAllFrameworks
                    ? "Search by Unified ID, control name or metric"
                    : `Search ${fwConfig?.label} controls by ID or name`
                }
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon style={{ fontSize: 24, color: "#64748b" }} />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearch("");
                          setPage(0);
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  style: {
                    fontSize: isMobile ? "16px" : "18px",
                    fontWeight: 700,
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 12,
                    backgroundColor: "white",
                    fontSize: isMobile ? "15px" : "16px",
                  },
                }}
              />
            </Box>
            <Box
              display="flex"
              style={{ gap: 8 }}
              flexWrap="wrap"
              justifyContent={isMobile ? "center" : "flex-end"}
            >
              <Button
                variant="contained"
                style={{
                  backgroundColor: tenantId ? "#7b1fa2" : "#bdbdbd",
                  color: "white",
                  minWidth: 150,
                  height: 42,
                  borderRadius: 10,
                  textTransform: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: tenantId ? "pointer" : "not-allowed",
                }}
                startIcon={<CloudSyncIcon />}
                onClick={syncComplianceData}
                disabled={!tenantId || isLoading}
              >
                Sync from Cloud
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={() => fetchComplianceData(true)}
                disabled={!tenantId || isLoading}
                size="large"
                style={{
                  minWidth: 140,
                  height: 42,
                  borderRadius: 10,
                  textTransform: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Refresh Snapshot
              </Button>
            </Box>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            style={{ gap: 20, marginTop: 14 }}
            flexWrap="wrap"
          >
            <Box display="flex" alignItems="center" style={{ gap: 7 }}>
              <StatusDot status="connected" />
              <Typography style={{ fontSize: 12, color: "#64748b" }}>
                Connected (live cloud data)
              </Typography>
            </Box>
            {activeFramework === "SOC2" ? (
              <Box display="flex" alignItems="center" style={{ gap: 7 }}>
                <StatusDot status="mapped" />
                <Typography style={{ fontSize: 12, color: "#64748b" }}>
                  Mapped (inherited from ISO 27001 / ISO 27701)
                </Typography>
              </Box>
            ) : (
              <Box display="flex" alignItems="center" style={{ gap: 7 }}>
                <StatusDot status="disconnected" />
                <Typography style={{ fontSize: 12, color: "#64748b" }}>
                  Not connected (manual upload available)
                </Typography>
              </Box>
            )}
            {/* <Box display="flex" alignItems="center" style={{ gap: 7 }}>
              <StatusDot status="disconnected" />
              <Typography style={{ fontSize: 12, color: "#64748b" }}>
                No data available
              </Typography>
            </Box> */}
            <Box display="flex" alignItems="center" style={{ gap: 7 }}>
              <Box
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: "#dcfce7",
                  border: "1px solid #86efac",
                }}
              />
              <Typography style={{ fontSize: 12, color: "#64748b" }}>
                Document Available
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" style={{ gap: 7 }}>
              <Box
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: "#fef9c3",
                  border: "1px solid #fde047",
                }}
              />
              <Typography style={{ fontSize: 12, color: "#64748b" }}>
                Document Required
              </Typography>
            </Box>
          </Box>
          {totalRows > 0 && (
            <Box mt={1} style={{ color: "#64748b", fontSize: 13 }}>
              Showing {filteredData.length} requirements ({totalRows} total
              rows)
              {search && (
                <span style={{ color: "#1976d2", fontWeight: 600 }}>
                  {" "}
                  • "{search}"
                </span>
              )}
              {soaApplicableSet !== null && soaApplicableSet.size > 0 && (
                <span style={{ color: "#15803d", fontWeight: 600 }}>
                  {" "}
                  • Filtered to SoA applicable controls
                </span>
              )}
            </Box>
          )}
        </Paper>

        <Paper elevation={2} style={{ padding: 24, borderRadius: 12 }}>
          {isLoading ? (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              height={300}
              style={{ gap: 16 }}
            >
              <CircularProgress size={48} thickness={4} />
              <div style={{ fontSize: 16, color: "#64748b", fontWeight: 500 }}>
                {anyControlsLoading
                  ? `Loading ${isAllFrameworks ? "all framework" : fwConfig?.label} control libraries...`
                  : mappingsLoading
                    ? "Loading SOC2 mappings..."
                    : "Loading compliance data..."}
              </div>
            </Box>
          ) : (
            <>
              <div style={{ overflowX: "auto", borderRadius: 8 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        style={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          fontSize: 15,
                          width: 36,
                          padding: "12px 8px",
                        }}
                      />
                      <TableCell
                        style={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          fontSize: 15,
                        }}
                      >
                        Unified ID
                      </TableCell>
                      <TableCell
                        style={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          fontSize: 15,
                        }}
                      >
                        Requirement ID
                      </TableCell>
                      {isAllFrameworks && (
                        <TableCell
                          style={{
                            fontWeight: 700,
                            backgroundColor: "#f8fafc",
                            fontSize: 15,
                          }}
                        >
                          Frameworks
                        </TableCell>
                      )}
                      <TableCell
                        style={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          fontSize: 15,
                        }}
                      >
                        Metric
                      </TableCell>
                      <TableCell
                        style={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          fontSize: 15,
                          textAlign: "center",
                        }}
                      >
                        Target
                      </TableCell>
                      <TableCell
                        style={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          fontSize: 15,
                          textAlign: "center",
                        }}
                      >
                        Current
                      </TableCell>
                      <TableCell
                        style={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          fontSize: 15,
                          textAlign: "center",
                        }}
                      >
                        Evidence / Formula
                      </TableCell>
                      <TableCell
                        style={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          fontSize: 15,
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        CAP Task
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentPageRows.map(
                      (
                        { group, metric, isFirst, isLast, isDocRow },
                        rowIdx,
                      ) => {
                        // ── MLD Document status rows ─────────────────────────────
                        if (isDocRow) {
                          const controlDocs = (group.documents || []).filter(
                            (d) => d.doc,
                          );
                          if (controlDocs.length === 0) return null;

                          return controlDocs.map((docItem, docIdx) => {
                            const docName = docItem.doc || "";
                            if (!docName) return null;

                            const framework =
                              group._framework ||
                              (isAllFrameworks
                                ? "ISO27001"
                                : activeFramework) ||
                              "ISO27001";
                            const rawCode =
                              group.controlCode || group.controlId;
                            const bareCode =
                              group.controlId || group.controlCode;
                            const withPrefix = rawCode.startsWith("A.")
                              ? rawCode
                              : `A.${rawCode}`;
                            const candidates = [
                              ...new Set([rawCode, bareCode, withPrefix]),
                            ].filter(Boolean);

                            let soaEntry = null;
                            for (const code of candidates) {
                              // Find ALL matching SoA entries for this control
                              const matchingSoas = mldSoas.filter(
                                (s) =>
                                  (s.framework || "").trim() === framework &&
                                  String(s.category).trim() === code,
                              );

                              if (matchingSoas.length > 0) {
                                // Among matching SoAs, find one that actually has a document
                                for (const soa of matchingSoas) {
                                  const doc = getLatestDocForSoA(
                                    soa.id ?? soa._id,
                                  );
                                  if (doc && !doc.deleted) {
                                    soaEntry = soa;
                                    break;
                                  }
                                }
                                // If none have a live doc, still use the first one (shows Unavailable)
                                if (!soaEntry) soaEntry = matchingSoas[0];
                                break;
                              }

                              // Fallback: match without framework constraint
                              const fallbackSoas = mldSoas.filter(
                                (s) =>
                                  String(s.category).trim() === code &&
                                  (s.documentRef?.[0] || "").trim() === docName, // already has it, keep it
                              );
                              if (fallbackSoas.length > 0) {
                                for (const soa of fallbackSoas) {
                                  const doc = getLatestDocForSoA(
                                    soa.id ?? soa._id,
                                  );
                                  if (doc && !doc.deleted) {
                                    soaEntry = soa;
                                    break;
                                  }
                                }
                                if (!soaEntry) soaEntry = fallbackSoas[0];
                                break;
                              }
                            }

                            const doc = soaEntry
                              ? getLatestDocForSoA(soaEntry.id ?? soaEntry._id)
                              : null;
                            const available = !!doc && !doc.deleted;

                            return (
                              <TableRow
                                key={`doc-${group.controlId}-${docIdx}`}
                                sx={{
                                  backgroundColor: "#ffffff !important",
                                  "& > td": {
                                    backgroundColor: "#ffffff !important",
                                  },
                                }}
                              >
                                <TableCell
                                  style={docCellStyle(docIdx, controlDocs, {
                                    width: 36,
                                  })}
                                />
                                <TableCell
                                  style={docCellStyle(docIdx, controlDocs)}
                                />
                                <TableCell
                                  style={docCellStyle(docIdx, controlDocs)}
                                />
                                {isAllFrameworks && (
                                  <TableCell
                                    style={docCellStyle(docIdx, controlDocs)}
                                  />
                                )}
                                <TableCell
                                  style={docCellStyle(docIdx, controlDocs, {
                                    padding: "5px 16px",
                                  })}
                                >
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    style={{ gap: 8 }}
                                  >
                                    <DescriptionIcon
                                      style={{
                                        fontSize: 14,
                                        color: "#94a3b8",
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      style={{
                                        fontSize: 12,
                                        color: "#475569",
                                        fontWeight: 500,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {docName}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell
                                  align="center"
                                  style={docCellStyle(docIdx, controlDocs)}
                                >
                                  <Box
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "3px 10px",
                                      borderRadius: 20,
                                      backgroundColor: "#3f51b5",
                                    }}
                                  >
                                    <Typography
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "#ffffff",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      Available
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell
                                  align="center"
                                  style={docCellStyle(docIdx, controlDocs)}
                                >
                                  {available ? (
                                    <Box
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        backgroundColor: "#4caf50",
                                      }}
                                    >
                                      <Typography
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#fffae8",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        Available
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Box
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        backgroundColor: "#f44336",
                                        border: "1px solid #fca5a5",
                                      }}
                                    >
                                      <Typography
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#ffffff",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        Unavailable
                                      </Typography>
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell
                                  align="center"
                                  style={docCellStyle(docIdx, controlDocs)}
                                >
                                  {available ? (
                                    <Tooltip title={`View: ${docName}`} arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handlePreviewDoc(soaEntry, doc)
                                        }
                                        style={{
                                          backgroundColor: "#e3f2fd",
                                          color: "#0288d1",
                                          width: 32,
                                          height: 32,
                                        }}
                                      >
                                        <PdfIcon style={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    <Typography
                                      style={{ fontSize: 12, color: "#cbd5e1" }}
                                    >
                                      —
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell
                                  style={docCellStyle(docIdx, controlDocs)}
                                />
                              </TableRow>
                            );
                          });
                        }

                        // ── Regular data row ───────────────────────────────────────
                        const showEvidence =
                          metric && hasEvidence(metric.evidence);
                        const upload = manualUploads[group.controlId];
                        const isSoc2Mapped =
                          activeFramework === "SOC2" &&
                          group.status === "mapped";
                        const hasTask = !!taskCreatedFor[group.controlId];

                        return (
                          <TableRow
                            key={`${group.controlId}-${metric?.metricName ?? "empty"}-${rowIdx}`}
                            hover
                            style={{
                              backgroundColor: "#ffffff",
                            }}
                          >
                            <TableCell
                              style={{
                                textAlign: "center",
                                padding: "0 8px",
                                width: 36,
                              }}
                            >
                              {isFirst && <StatusDot status={group.status} />}
                            </TableCell>
                            <TableCell style={{ fontSize: 14, minWidth: 140 }}>
                              {isFirst && (
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  style={{ gap: 5 }}
                                >
                                  <Typography
                                    style={{
                                      fontWeight: 600,
                                      fontSize: 12,
                                      color: "#334155",
                                      fontFamily: "monospace",
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {group.unifiedId || group.controlId}
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell style={{ fontSize: 14, minWidth: 180 }}>
                              {isFirst && (
                                <Box
                                  display="flex"
                                  flexDirection="column"
                                  style={{ gap: 2 }}
                                >
                                  <Typography
                                    style={{
                                      fontWeight: 700,
                                      fontSize: 13,
                                      color: "#1e293b",
                                      fontFamily: "monospace",
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {group.controlCode || group.controlId}
                                  </Typography>
                                  {group.controlName && (
                                    <Typography
                                      style={{
                                        fontSize: 11,
                                        color: "#64748b",
                                        lineHeight: 1.4,
                                        fontWeight: 400,
                                      }}
                                    >
                                      {group.controlName}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </TableCell>
                            {isAllFrameworks && (
                              <TableCell style={{ minWidth: 160 }}>
                                {isFirst &&
                                  (() => {
                                    const fws = group.frameworks || [];
                                    if (fws.length === 0)
                                      return (
                                        <Typography
                                          style={{
                                            fontSize: 11,
                                            color: "#cbd5e1",
                                          }}
                                        >
                                          —
                                        </Typography>
                                      );
                                    return (
                                      <Box
                                        display="flex"
                                        flexWrap="wrap"
                                        style={{ gap: 4 }}
                                      >
                                        {fws.map((fw) => (
                                          <FrameworkBadge
                                            key={fw}
                                            frameworkCode={fw}
                                          />
                                        ))}
                                      </Box>
                                    );
                                  })()}
                              </TableCell>
                            )}
                            <TableCell style={{ fontSize: 13 }}>
                              <Box>
                                {isFirst && (
                                  <Box>
                                    <Typography
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#334155",
                                        lineHeight: 1.4,
                                        marginBottom: 0,
                                      }}
                                    >
                                      {group.metric &&
                                      group.metric.trim() !==
                                        group.controlName?.trim()
                                        ? group.metric
                                        : null}
                                    </Typography>
                                  </Box>
                                )}
                                {metric && (
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    style={{
                                      gap: 5,
                                      marginTop: isFirst ? 4 : 0,
                                    }}
                                  >
                                    {activeFramework === "SOC2" &&
                                      metric.sourceCode && (
                                        <MappedSourceBadge
                                          sourceCode={metric.sourceCode}
                                          sourceFramework={
                                            metric.sourceFramework || "ISO27001"
                                          }
                                        />
                                      )}
                                    {isAllFrameworks && metric.sourceCode && (
                                      <MappedSourceBadge
                                        sourceCode={metric.sourceCode}
                                        sourceFramework={
                                          metric.sourceFramework || "ISO27001"
                                        }
                                      />
                                    )}
                                    {isAllFrameworks &&
                                      !metric.sourceCode &&
                                      metric.sourceFramework && (
                                        <FrameworkBadge
                                          frameworkCode={metric.sourceFramework}
                                        />
                                      )}
                                    <Typography
                                      style={{
                                        fontSize: 11,
                                        color: "#64748b",
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {metric.metricName}
                                    </Typography>
                                  </Box>
                                )}
                                {!metric &&
                                  isFirst &&
                                  (activeFramework === "SOC2" ||
                                    isAllFrameworks) &&
                                  group.fallbackMetrics?.length > 0 && (
                                    <Box style={{ marginTop: 6 }}>
                                      {group.fallbackMetrics.map((fb, i) => (
                                        <Box
                                          key={i}
                                          display="flex"
                                          alignItems="flex-start"
                                          style={{
                                            gap: 5,
                                            marginBottom:
                                              i <
                                              group.fallbackMetrics.length - 1
                                                ? 4
                                                : 0,
                                          }}
                                        >
                                          <MappedSourceBadge
                                            sourceCode={fb.sourceCode}
                                            sourceFramework={fb.sourceFramework}
                                          />
                                          <Typography
                                            style={{
                                              fontSize: 11,
                                              color: "#64748b",
                                              lineHeight: 1.5,
                                            }}
                                          >
                                            {fb.metricName}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {metric ? (
                                <Chip
                                  label="100.00%"
                                  color="primary"
                                  size="small"
                                  style={{ fontWeight: 600 }}
                                />
                              ) : isFirst ? (
                                <TargetScoreCell
                                  controlId={group.controlId}
                                  tenantId={tenantId}
                                  frameworkCode={activeFramework}
                                  targetScore={
                                    manualTargetScores[group.controlId] ?? null
                                  }
                                  onSave={handleTargetScoreSaved}
                                />
                              ) : (
                                <span
                                  style={{ color: "#cbd5e1", fontSize: 13 }}
                                >
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {metric ? (
                                <Chip
                                  label={`${formatPercentage(metric.currentPerformance)}%`}
                                  size="small"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 12,
                                    minWidth: 70,
                                    height: 28,
                                    cursor: "default",
                                    ...getPerformanceColor(
                                      metric.currentPerformance,
                                    ),
                                  }}
                                />
                              ) : editingControl === group.controlId ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={manualScores[group.controlId] ?? ""}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      group.controlId,
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() =>
                                    handleScoreSave(group.controlId)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleScoreSave(group.controlId);
                                  }}
                                  autoFocus
                                  inputProps={{
                                    min: 0,
                                    max: 100,
                                    step: 0.01,
                                    style: { textAlign: "center", width: 70 },
                                  }}
                                />
                              ) : (
                                <Tooltip
                                  title={
                                    !hasAnyDocument(group.controlId)
                                      ? "Upload a document first to enter score"
                                      : "Click to edit score"
                                  }
                                  arrow
                                >
                                  <span>
                                    <Chip
                                      label={
                                        manualScores[group.controlId] !==
                                          undefined &&
                                        manualScores[group.controlId] !== null
                                          ? `${manualScores[group.controlId]}%`
                                          : "—"
                                      }
                                      size="small"
                                      // ── Only clickable if doc exists and not SOC2/ALL ──────────────
                                      onClick={() => {
                                        if (
                                          !isSoc2Mapped &&
                                          !isAllFrameworks &&
                                          hasAnyDocument(group.controlId)
                                        ) {
                                          setEditingControl(group.controlId);
                                        }
                                      }}
                                      style={{
                                        cursor:
                                          isSoc2Mapped ||
                                          isAllFrameworks ||
                                          !hasAnyDocument(group.controlId)
                                            ? "not-allowed"
                                            : "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                        minWidth: 70,
                                        height: 28,
                                        opacity: hasAnyDocument(group.controlId)
                                          ? 1
                                          : 0.5,
                                        ...(manualScores[group.controlId] !==
                                          undefined &&
                                        manualScores[group.controlId] !== null
                                          ? getPerformanceColor(
                                              parseFloat(
                                                manualScores[group.controlId],
                                              ),
                                            )
                                          : {
                                              backgroundColor: "#f5f5f5",
                                              color: "#666",
                                            }),
                                      }}
                                    />
                                  </span>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell align="center" style={{ minWidth: 220 }}>
                              <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                style={{ gap: 4 }}
                              >
                                {showEvidence && (
                                  <>
                                    <Tooltip title="View evidence" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          setEvidenceModal({
                                            open: true,
                                            data: metric.evidence,
                                          })
                                        }
                                        style={{
                                          backgroundColor: "#e3f2fd",
                                          color: "#1976d2",
                                          width: 32,
                                          height: 32,
                                        }}
                                      >
                                        <VisibilityIcon
                                          style={{ fontSize: 16 }}
                                        />
                                      </IconButton>
                                    </Tooltip>
                                    {group.formula && (
                                      <Tooltip title="View formula" arrow>
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            setEvidenceModal({
                                              open: true,
                                              data: group.formula,
                                            })
                                          }
                                          style={{
                                            backgroundColor: "#f0f4ff",
                                            color: "#5c6bc0",
                                            width: 32,
                                            height: 32,
                                          }}
                                        >
                                          <FunctionsIcon
                                            style={{ fontSize: 16 }}
                                          />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </>
                                )}
                                {group.status === "disconnected" && (
                                  <>
                                    <ManualUploadCell
                                      controlId={group.controlId}
                                      tenantId={tenantId}
                                      onUpload={handleManualUpload}
                                      uploadedFileName={
                                        upload?.fileName || null
                                      }
                                      uploadedFileId={upload?.fileId || null}
                                      isUploading={
                                        uploadingControls[group.controlId] ||
                                        false
                                      }
                                      onViewFile={handleViewFile}
                                    />
                                    {upload?.fileId && (
                                      <Tooltip
                                        title="Delete evidence file"
                                        arrow
                                      >
                                        <span>
                                          <IconButton
                                            size="small"
                                            disabled={
                                              deletingControls[group.controlId]
                                            }
                                            onClick={() =>
                                              handleDeleteFile(
                                                group.controlId,
                                                upload.fileId,
                                                upload.fileName,
                                              )
                                            }
                                            style={{
                                              backgroundColor: "#ffebee",
                                              color: "#d32f2f",
                                              width: 32,
                                              height: 32,
                                            }}
                                          >
                                            {deletingControls[
                                              group.controlId
                                            ] ? (
                                              <CircularProgress
                                                size={14}
                                                style={{ color: "#d32f2f" }}
                                              />
                                            ) : (
                                              <DeleteIcon
                                                style={{ fontSize: 16 }}
                                              />
                                            )}
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    )}
                                    {!isAllFrameworks &&
                                      activeFramework !== "SOC2" &&
                                      (approvalStatuses[group.controlId] ===
                                      "APPROVED" ? (
                                        <Tooltip title="Approved" arrow>
                                          <CheckCircleIcon
                                            style={{
                                              fontSize: 24,
                                              color: "#2e7d32",
                                            }}
                                          />
                                        </Tooltip>
                                      ) : (
                                        <Tooltip
                                          title="Approve this control"
                                          arrow
                                        >
                                          <span>
                                            <IconButton
                                              size="small"
                                              disabled={
                                                approvingControls[
                                                  group.controlId
                                                ]
                                              }
                                              onClick={() =>
                                                handleApprove(group.controlId)
                                              }
                                              style={{
                                                backgroundColor: "#e8f5e9",
                                                color: "#2e7d32",
                                                width: 32,
                                                height: 32,
                                              }}
                                            >
                                              {approvingControls[
                                                group.controlId
                                              ] ? (
                                                <CircularProgress
                                                  size={14}
                                                  style={{ color: "#2e7d32" }}
                                                />
                                              ) : (
                                                <CheckCircleOutlineIcon
                                                  style={{ fontSize: 16 }}
                                                />
                                              )}
                                            </IconButton>
                                          </span>
                                        </Tooltip>
                                      ))}
                                  </>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center" style={{ minWidth: 120 }}>
                              {isFirst &&
                                (hasTask ? (
                                  <Box
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    style={{ gap: 4 }}
                                  >
                                    <CheckCircleIcon
                                      style={{ fontSize: 20, color: "#22c55e" }}
                                    />
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: "#22c55e",
                                        fontWeight: 700,
                                      }}
                                    >
                                      Task created
                                    </span>
                                    <Button
                                      size="small"
                                      onClick={() =>
                                        setAddTaskFor({
                                          controlId: group.controlId,
                                          controlName: group.controlName,
                                        })
                                      }
                                      style={{
                                        fontSize: 10,
                                        padding: "2px 8px",
                                        minWidth: 0,
                                        textTransform: "none",
                                        border: "1px solid #bbf7d0",
                                        background: "#f0fdf4",
                                        color: "#166534",
                                      }}
                                    >
                                      + Another
                                    </Button>
                                  </Box>
                                ) : (
                                  <Tooltip
                                    title="Create Corrective Action Task"
                                    arrow
                                  >
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() =>
                                        setAddTaskFor({
                                          controlId: group.controlId,
                                          controlName: group.controlName,
                                        })
                                      }
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        textTransform: "none",
                                        background: "#4f46e5",
                                        color: "#fff",
                                        borderRadius: 8,
                                        padding: "5px 10px",
                                        minWidth: 0,
                                        boxShadow:
                                          "0 2px 6px rgba(79,70,229,0.3)",
                                      }}
                                      startIcon={<ClipboardList size={11} />}
                                    >
                                      Add CAP
                                    </Button>
                                  </Tooltip>
                                ))}
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}

                    {currentPageRows.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={colSpanCount}
                          align="center"
                          style={{ padding: "60px 20px" }}
                        >
                          <div
                            style={{
                              color: "#64748b",
                              fontSize: 18,
                              fontWeight: 500,
                            }}
                          >
                            {search
                              ? "No matching controls found"
                              : tenantError
                                ? "Unable to load compliance data"
                                : isAllFrameworks
                                  ? "No unified compliance data available"
                                  : `No ${fwConfig?.label} compliance data available`}
                          </div>
                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: 14,
                              marginTop: 8,
                            }}
                          >
                            {search
                              ? "Try adjusting your search"
                              : tenantError
                                ? "Please contact your administrator"
                                : isAllFrameworks
                                  ? "Make sure at least one framework has controls configured"
                                  : activeFramework === "SOC2"
                                    ? "Make sure ISO 27001 / ISO 27701 data is synced"
                                    : activeFramework === "ISO42001"
                                      ? "Make sure ISO 42001 controls are configured in your backend"
                                      : "Try syncing from cloud or refresh the data"}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <Box mt={3}>
                <TablePagination
                  component="div"
                  count={totalRows}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50]}
                  labelRowsPerPage="Rows per page:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} of ${count}`
                  }
                />
              </Box>
            </>
          )}
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <SnackbarContent
            style={{
              backgroundColor:
                snackbar.severity === "error"
                  ? "#d32f2f"
                  : snackbar.severity === "warning"
                    ? "#f57c00"
                    : snackbar.severity === "success"
                      ? "#388e3c"
                      : "#1976d2",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              minWidth: 288,
              borderRadius: 4,
              boxShadow: "0 3px 5px -1px rgba(0,0,0,0.2)",
            }}
            message={
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <span style={{ fontSize: 18 }}>
                  {snackbar.severity === "error" && "❌"}
                  {snackbar.severity === "warning" && "⚠️"}
                  {snackbar.severity === "success" && "✅"}
                  {snackbar.severity === "info" && "ℹ️"}
                </span>
                <span>{snackbar.message}</span>
              </Box>
            }
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setSnackbar({ ...snackbar, open: false })}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            }
          />
        </Snackbar>

        <Dialog
          open={confirmDelete.open}
          onClose={() =>
            setConfirmDelete({
              open: false,
              controlId: null,
              fileId: null,
              fileName: null,
            })
          }
          PaperProps={{ style: { borderRadius: 12, padding: 8 } }}
        >
          <DialogTitle style={{ fontWeight: 700, color: "#1e293b" }}>
            Delete Evidence File?
          </DialogTitle>
          <DialogContent>
            <Typography style={{ color: "#475569", fontSize: 14 }}>
              Are you sure you want to delete{" "}
              <strong>{confirmDelete.fileName}</strong> for control{" "}
              <strong>{confirmDelete.controlId}</strong>? This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions style={{ padding: "12px 24px", gap: 8 }}>
            <Button
              onClick={() =>
                setConfirmDelete({
                  open: false,
                  controlId: null,
                  fileId: null,
                  fileName: null,
                })
              }
              variant="outlined"
              style={{
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirmed}
              variant="contained"
              style={{
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#d32f2f",
                color: "white",
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Evidence_Modal
          open={evidenceModal.open}
          evidence={evidenceModal.data}
          onClose={() => setEvidenceModal({ open: false, data: [] })}
        />
        <PdfPreviewModal
          open={pdfModal.open}
          onClose={handleClosePdfModal}
          pdfUrl={pdfModal.url}
          fileName={pdfModal.fileName}
        />

        {addTaskFor && (
          <AddTaskModal
            controlId={addTaskFor.controlId}
            controlName={addTaskFor.controlName}
            auditors={auditors}
            onClose={() => setAddTaskFor(null)}
            onCreated={() => {
              setTaskCreatedFor((prev) => ({
                ...prev,
                [addTaskFor.controlId]: true,
              }));
              setSnackbar({
                open: true,
                message: `✅ CAP task created for ${addTaskFor.controlId}`,
                severity: "success",
              });
            }}
          />
        )}
      </Container>
    </Box>
  );
};

export default RiskAssessmentTable;
