// TreatmentPlanForm — fixed stale controlOptions closure
import React, { useState, useEffect, useCallback } from "react";
import TextAreaField from "../inputs/TextAreaField";
import Select from "react-select";
import Joyride, { STATUS } from "react-joyride";
import controlService from "../../services/controlService";
import { useFramework } from "../../../../context/FrameworkContex";
import { getAutoSelectedControlsForFramework } from "../../../../utils/frameworkMappings";

const normalizeCode = (c) => {
  const s = String(c || "").trim();

  // GDPR/PDPL pattern: "Article-<number>..." — extract just the number
  const articleMatch = s.match(/^article[-\s]?(\d+)/i);
  if (articleMatch) return articleMatch[1];

  // Default: strip everything non-alphanumeric, lowercase
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
};
const ControlTree = ({
  availableFrameworks,
  data,
  selectedValues,
  onToggle,
  autoSelectedControls = {},
}) => {
  const [expanded, setExpanded] = useState({});
  const toggle = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        maxHeight: "600px",
        overflowY: "auto",
        padding: "10px",
        background: "#fff",
      }}
    >
      {data.map((fw) => {
        const fwKey = `fw-${fw.framework}`;
        const fwObj = availableFrameworks?.find((f) => f.code === fw.framework);
        const badge = {
          bg: fwObj?.color ? fwObj.color + "15" : "#f5f5f5",
          color: fwObj?.color || "#424242",
          border: fwObj?.color ? fwObj.color + "40" : "#e0e0e0",
        };

        return (
          <div key={fw.framework} style={{ marginBottom: "8px" }}>
            <div
              onClick={() => toggle(fwKey)}
              style={{
                cursor: "pointer",
                fontWeight: "bold",
                padding: "6px",
                background: badge.bg,
                borderRadius: "4px",
                border: `1px solid ${badge.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {expanded[fwKey] ? "📂" : "📁"}
              <span style={{ color: badge.color }}>{fw.framework}</span>
              {autoSelectedControls[fw.framework] &&
                autoSelectedControls[fw.framework].length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 10,
                      backgroundColor: badge.color,
                      color: "#fff",
                      marginLeft: "auto",
                    }}
                  >
                    {autoSelectedControls[fw.framework].length} auto-selected
                  </span>
                )}
            </div>

            {expanded[fwKey] &&
              fw.categories.map((cat) => {
                const catKey = `cat-${fw.framework}-${cat.name}`;
                return (
                  <div key={cat.name} style={{ marginLeft: "18px" }}>
                    <div
                      onClick={() => toggle(catKey)}
                      style={{
                        cursor: "pointer",
                        padding: "4px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {expanded[catKey] ? "📂" : "📁"}
                      <span style={{ marginLeft: "6px" }}>{cat.name}</span>
                    </div>
                    {expanded[catKey] &&
                      cat.controls.map((ctrl) => {
                        const isSelected = selectedValues.includes(ctrl.id);
                        const isAutoSelected = autoSelectedControls[
                          fw.framework
                        ]?.some(
                          (code) =>
                            normalizeCode(code) ===
                            normalizeCode(ctrl.controlCode),
                        );

                        return (
                          <div
                            key={ctrl.id}
                            style={{
                              marginLeft: "25px",
                              padding: "6px",
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              background: isAutoSelected
                                ? "#f0fdf4"
                                : "transparent",
                              borderRadius: 4,
                              border: isAutoSelected
                                ? "1px solid #86efac"
                                : "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected || isAutoSelected}
                              onChange={() => {
                                if (!isAutoSelected) onToggle(ctrl.id);
                              }}
                              disabled={isAutoSelected}
                              style={{
                                marginRight: "8px",
                                cursor: isAutoSelected
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                              title={
                                isAutoSelected
                                  ? "Auto-selected from ISO control"
                                  : ""
                              }
                            />
                            <span title={ctrl.title} style={{ flex: 1 }}>
                              {ctrl.controlCode}: {ctrl.title}
                            </span>
                            {isAutoSelected && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#10b981",
                                  marginLeft: 8,
                                  padding: "2px 6px",
                                  borderRadius: 3,
                                  background: "#dcfce7",
                                }}
                              >
                                AUTO
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
};

const TreatmentPlanForm = ({
  formData,
  handleInputChange,
  selectedFrameworks = [],
  isAllSelected = true,
}) => {
  const { availableFrameworks } = useFramework();
  const [runTour, setRunTour] = useState(false);
  const [controlOptions, setControlOptions] = useState([]);
  const [isLoadingControls, setIsLoadingControls] = useState(false);
  const [autoSelectedControls, setAutoSelectedControls] = useState({});
  const [idToMeta, setIdToMeta] = useState({});
  const isAutoUpdatingRef = React.useRef(false);
  const controlReferenceRef = React.useRef(formData.controlReference);

  useEffect(() => {
    controlReferenceRef.current = formData.controlReference;
  }, [formData.controlReference]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ── KEY FIX: accept treeData param to avoid stale controlOptions closure ──
  const updateAutoSelectedMappedControls = useCallback(
    async (selectedControlIds, metaMap, treeData) => {
      const map = metaMap || idToMeta;
      const tree = treeData || controlOptions; // ← use passed value, never stale

      if (!selectedControlIds || selectedControlIds.length === 0) {
        setAutoSelectedControls({});
        return;
      }

      if (Object.keys(map).length === 0) return;

      try {
        const controlsByFramework = {};

        selectedControlIds.forEach((id) => {
          const meta = map[id];
          if (!meta) return;
          if (!controlsByFramework[meta.framework])
            controlsByFramework[meta.framework] = [];
          controlsByFramework[meta.framework].push(meta.controlCode);
        });

        const mappedFrameworks =
          availableFrameworks?.filter(
            (f) => f.isMapped && f.mappingSources?.length > 0,
          ) || [];

        const newAutoSelectedControls = {};
        const allAutoSelectedIds = [];

        for (const fwObj of mappedFrameworks) {
          const validSources = fwObj.mappingSources;
          if (validSources.length === 0) continue;

          const mergedCodes = await getAutoSelectedControlsForFramework(
            fwObj.code,
            validSources,
            controlsByFramework,
            {
              driverFrameworks: availableFrameworks
                .filter((f) => !f.isMapped)
                .map((f) => f.code),
              mappedFrameworks: availableFrameworks
                .filter((f) => f.isMapped)
                .map((f) => f.code),
            },
          );

          console.log(`mergedCodes for ${fwObj.code}:`, mergedCodes);

          if (mergedCodes.length === 0) continue;

          newAutoSelectedControls[fwObj.code] = mergedCodes;

          // ← use tree instead of controlOptions — never stale
          const treeFw = tree.find((fw) => fw.framework === fwObj.code);
          if (!treeFw) continue;

          const codeToId = {};
          treeFw.categories.forEach((cat) =>
            cat.controls.forEach((ctrl) => {
              codeToId[normalizeCode(ctrl.controlCode)] = ctrl.id;
            }),
          );

          console.log(
            "GDPR codeToId keys (sample):",
            Object.keys(codeToId).slice(0, 5),
          );
          console.log(
            "GDPR mergedCodes normalized (sample):",
            mergedCodes.slice(0, 5).map(normalizeCode),
          );

          if (fwObj.code === "GDPR") {
            console.log(
              "GDPR tree control codes (raw, first 5):",
              treeFw.categories
                .flatMap((cat) => cat.controls.map((c) => c.controlCode))
                .slice(0, 5),
            );
            console.log(
              "GDPR mapping codes (raw, first 5):",
              mergedCodes.slice(0, 5),
            );
          }
          const autoIds = mergedCodes
            .map((code) => codeToId[normalizeCode(code)])
            .filter(Boolean);

          allAutoSelectedIds.push(...autoIds);
        }

        setAutoSelectedControls(newAutoSelectedControls);

        const mappedFrameworksWithResults = new Set(
          Object.keys(newAutoSelectedControls),
        );

        const manualIds = (controlReferenceRef.current || []).filter((id) => {
          const meta = map[id];
          if (!meta) return true;
          if (mappedFrameworksWithResults.has(meta.framework)) return false;
          return true;
        });

        const merged = [...new Set([...manualIds, ...allAutoSelectedIds])];

        // ← ADD THIS
        console.log("Final merged controlReference:", merged);
        console.log("manualIds:", manualIds);
        console.log("allAutoSelectedIds:", allAutoSelectedIds);

        isAutoUpdatingRef.current = true;
        handleInputChange({
          target: { name: "controlReference", value: merged },
        });
      } catch (error) {
        console.error("Error updating auto-selected controls:", error);
        setAutoSelectedControls({});
      }
    },
    [idToMeta, controlOptions, handleInputChange, availableFrameworks],
  );

  // ── Fetch controls whenever riskType OR active frameworks change ──────────
  useEffect(() => {
    const fetchControls = async () => {
      const selectedTypes = Array.isArray(formData.riskType)
        ? formData.riskType
        : [];
      if (selectedTypes.length === 0) {
        setControlOptions([]);
        setIdToMeta({});
        setAutoSelectedControls({});
        return;
      }

      const activeFWCodes = isAllSelected
        ? new Set(availableFrameworks.map((f) => f.code))
        : new Set(
            selectedFrameworks
              .map(
                (fwId) => availableFrameworks?.find((f) => f.id === fwId)?.code,
              )
              .filter(Boolean),
          );

      setIsLoadingControls(true);
      try {
        const frameworksToFetch = new Set();

        selectedTypes.forEach((type) => {
          const key = String(type).toLowerCase();
          availableFrameworks?.forEach((fwObj) => {
            if (
              fwObj.riskTypes &&
              fwObj.riskTypes.some((rt) => rt.toLowerCase() === key)
            ) {
              if (activeFWCodes.has(fwObj.code))
                frameworksToFetch.add(fwObj.code);
            }
          });
        });

        availableFrameworks?.forEach((fwObj) => {
          if (fwObj.isMapped && fwObj.mappingSources?.length > 0) {
            if (fwObj.mappingSources.some((src) => frameworksToFetch.has(src)))
              frameworksToFetch.add(fwObj.code);
          }
        });

        const allowed = [...frameworksToFetch].filter((fw) => {
          if (activeFWCodes.has(fw)) return true;
          const fwObj = availableFrameworks?.find((f) => f.code === fw);
          if (fwObj?.isMapped) return true;
          return false;
        });

        const fetchPromises = allowed.map(async (frameworkCode) => {
          const data =
            await controlService.getControlsByFramework(frameworkCode);
          const categories = data.reduce((acc, ctrl) => {
            const cat = ctrl.category || "General";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(ctrl);
            return acc;
          }, {});
          return {
            framework: frameworkCode,
            isMapped:
              availableFrameworks?.find((f) => f.code === frameworkCode)
                ?.isMapped ?? false,
            categories: Object.keys(categories).map((catName) => ({
              name: catName,
              controls: categories[catName],
            })),
          };
        });

        const results = (await Promise.all(fetchPromises)).filter(Boolean);

        results.sort((a, b) => {
          const aMapped = availableFrameworks?.find(
            (f) => f.code === a.framework,
          )?.isMapped
            ? 1
            : 0;
          const bMapped = availableFrameworks?.find(
            (f) => f.code === b.framework,
          )?.isMapped
            ? 1
            : 0;
          return aMapped - bMapped;
        });

        setControlOptions(results);

        const map = {};
        results.forEach((fw) =>
          fw.categories.forEach((cat) =>
            cat.controls.forEach((ctrl) => {
              map[ctrl.id] = {
                controlCode: ctrl.controlCode,
                framework: fw.framework,
              };
            }),
          ),
        );
        setIdToMeta(map);
        console.log("idToMeta frameworks:", [
          ...new Set(Object.values(map).map((m) => m.framework)),
        ]);
        // ← pass results directly — guaranteed fresh, never stale
        if (formData.controlReference?.length > 0) {
          updateAutoSelectedMappedControls(
            formData.controlReference,
            map,
            results,
          );
        }
      } catch (error) {
        console.error("Error fetching controls:", error);
      } finally {
        setIsLoadingControls(false);
      }
    };
    fetchControls();
  }, [formData.riskType, selectedFrameworks, isAllSelected]);

  // ── Recompute when user manually toggles a control ────────────────────────
  useEffect(() => {
    if (Object.keys(idToMeta).length === 0) return;

    if (isAutoUpdatingRef.current) {
      isAutoUpdatingRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (formData.controlReference && formData.controlReference.length > 0) {
        // ← pass controlOptions explicitly so it's never stale here either
        updateAutoSelectedMappedControls(
          formData.controlReference,
          undefined,
          controlOptions,
        );
      } else {
        setAutoSelectedControls({});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    formData.controlReference,
    idToMeta,
    updateAutoSelectedMappedControls,
    controlOptions,
  ]);

  const treatmentPlanTourSteps = [
    {
      target: ".risk-id-summary",
      content: "This shows the Risk ID.",
      placement: "bottom",
    },
    {
      target: ".department-summary",
      content: "The department responsible.",
      placement: "bottom",
    },
    {
      target: ".risk-type-summary",
      content: "The type of risk identified.",
      placement: "bottom",
    },
    {
      target: ".action-field",
      content: "Recommended action based on residual risk.",
      placement: "bottom",
    },
    {
      target: ".status-field",
      content: "Update the current status.",
      placement: "bottom",
    },
    {
      target: ".control-implementation-section",
      content: "Define control measures.",
      placement: "top",
    },
    {
      target: ".risk-description-field",
      content: "Risk description.",
      placement: "top",
    },
    {
      target: ".additional-controls-field",
      content: "New or proposed controls.",
      placement: "top",
    },
    {
      target: ".control-reference-field",
      content: "Select applicable controls.",
      placement: "top",
    },
  ];

  const getActionPlan = (riskLevel) => {
    switch (riskLevel) {
      case "Low":
        return "Accept";
      case "Medium":
      case "High":
        return "Mitigate";
      default:
        return "Not defined yet";
    }
  };

  const action = getActionPlan(formData.riskLevel);
  const statusValue = formData.status || "Open";

  const handleControlToggle = (id) => {
    const current = Array.isArray(formData.controlReference)
      ? formData.controlReference
      : [];
    const newValue = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    handleInputChange({
      target: { name: "controlReference", value: newValue },
    });
  };

  const hasAIType =
    Array.isArray(formData.riskType) &&
    formData.riskType.some(
      (t) => String(t).toLowerCase() === "artificial intelligence",
    );

  const formStyle = {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    maxWidth: "700px",
    margin: "0 auto",
    border: "1px solid #e9ecef",
  };
  const summaryCardStyle = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    background: "#f39c12",
    color: "white",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
  };
  const summaryItemStyle = {
    flex: 1,
    minWidth: "100px",
    display: "flex",
    flexDirection: "column",
  };
  const summaryLabelStyle = {
    fontSize: "11px",
    opacity: 0.8,
    fontWeight: 500,
    textTransform: "uppercase",
  };
  const summaryValueStyle = { fontSize: "16px", fontWeight: 700 };
  const calculatedItemStyle = {
    flex: 1,
    minWidth: "150px",
    textAlign: "center",
    background: "#fff",
    padding: "12px",
    borderRadius: "8px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
  };
  const calculatedLabelStyle = {
    fontSize: "11px",
    fontWeight: 500,
    marginBottom: "4px",
    color: "#34495e",
    textTransform: "uppercase",
  };
  const calculatedValueStyle = {
    fontSize: "16px",
    fontWeight: 600,
    padding: "4px 8px",
    borderRadius: "6px",
    background: "#ffffff",
    color: "#2c3e50",
    border: "1px solid #ecf0f1",
  };
  const autoGenButtonStyle = {
    background: "#3498db",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
  };

  return (
    <div style={formStyle}>
      <Joyride
        steps={treatmentPlanTourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        styles={{ options: { zIndex: 10000 } }}
        callback={(data) => {
          if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status))
            setRunTour(false);
        }}
      />

      <div className="treatment-summary-card" style={summaryCardStyle}>
        <div className="risk-id-summary" style={summaryItemStyle}>
          <span style={summaryLabelStyle}>Risk ID</span>
          <span style={summaryValueStyle}>{formData.riskId || "Not Set"}</span>
        </div>
        <div className="department-summary" style={summaryItemStyle}>
          <span style={summaryLabelStyle}>Department</span>
          <span style={summaryValueStyle}>
            {formData.department || "Not Set"}
          </span>
        </div>
        <div className="risk-type-summary" style={summaryItemStyle}>
          <span style={summaryLabelStyle}>Risk Type</span>
          <span style={summaryValueStyle}>
            {Array.isArray(formData.riskType)
              ? formData.riskType.join(", ")
              : formData.riskType || "Not Set"}
          </span>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: "25px",
          paddingBottom: "12px",
          borderBottom: "2px solid #e67e22",
        }}
      >
        <h2
          style={{
            color: "#2c3e50",
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "6px",
          }}
        >
          Treatment Plan
        </h2>
        <p style={{ color: "#7f8c8d", fontSize: "14px" }}>
          Define controls and mitigation plan for the identified risk
        </p>
        <button
          style={{ ...autoGenButtonStyle, marginTop: "10px" }}
          onClick={() => setRunTour(true)}
        >
          Tutorial
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "15px",
        }}
      >
        <div className="action-field" style={calculatedItemStyle}>
          <label style={calculatedLabelStyle}>Action</label>
          <span style={calculatedValueStyle}>{action}</span>
        </div>
        <div className="status-field" style={calculatedItemStyle}>
          <label style={calculatedLabelStyle}>Status</label>
          <div style={{ width: "120px", margin: "0 auto" }}>
            <Select
              name="status"
              options={[
                { value: "Open", label: "Open" },
                { value: "WIP", label: "WIP" },
                { value: "Closed", label: "Closed" },
              ]}
              value={{ value: statusValue, label: statusValue }}
              onChange={(selected) =>
                handleInputChange({
                  target: { name: "status", value: selected.value },
                })
              }
            />
          </div>
        </div>
      </div>

      <div
        className="control-implementation-section"
        style={{
          background: "rgba(230,126,34,0.03)",
          padding: "15px",
          borderRadius: "8px",
          border: "1px solid rgba(230,126,34,0.1)",
          marginBottom: "15px",
        }}
      >
        <h3
          style={{
            color: "#2c3e50",
            fontSize: "18px",
            fontWeight: 600,
            marginBottom: "10px",
          }}
        >
          Control Implementation
        </h3>

        <div
          className="risk-description-field"
          style={{
            background: "#f8f9fa",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "15px",
            border: "1px solid #e9ecef",
          }}
        >
          <h4
            style={{
              marginBottom: "6px",
              fontWeight: "bold",
              color: "#495057",
            }}
          >
            Risk Description
          </h4>
          <p style={{ fontSize: "13px", color: "#495057", fontWeight: 500 }}>
            {formData.riskDescription || "No description available"}
          </p>
        </div>

        <TextAreaField
          className="additional-controls-field"
          label="New/Proposed Controls"
          name="additionalControls"
          value={formData.additionalControls || ""}
          onChange={handleInputChange}
          placeholder="Describe additional control measures..."
          rows={2}
        />

        <div style={{ marginTop: "12px", marginBottom: "6px" }}>
          <p style={{ margin: 0, fontWeight: 500 }}>
            Applicable Control(s){" "}
            {isLoadingControls && (
              <small style={{ color: "#3498db" }}>(Loading...)</small>
            )}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "4px",
            }}
          >
            {/* Dynamic auto-selected badges — one per mapped framework */}
            {!isLoadingControls &&
              Object.keys(autoSelectedControls).map((fwCode) => {
                const count = autoSelectedControls[fwCode].length;
                if (count === 0) return null;
                const fwObj = availableFrameworks?.find(
                  (f) => f.code === fwCode,
                );
                const color = fwObj?.color || "#1b5e20";
                const bg = color + "15";
                const border = color + "40";
                return (
                  <span
                    key={fwCode}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 10,
                      backgroundColor: bg,
                      color,
                      border: `1px solid ${border}`,
                      display: "inline-block",
                    }}
                  >
                    + {fwObj?.label || fwCode} auto-selected
                  </span>
                );
              })}

            {!isLoadingControls && hasAIType && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                  backgroundColor: "#fff3e0",
                  color: "#e65100",
                  border: "1px solid #ffcc80",
                  display: "inline-block",
                }}
              >
                🤖 ISO 42001 controls loaded
              </span>
            )}
          </div>
        </div>

        {isLoadingControls ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              border: "1px dashed #ccc",
            }}
          >
            Loading Control Tree...
          </div>
        ) : (
          <>
            <div className="control-reference-field">
              <ControlTree
                availableFrameworks={availableFrameworks}
                data={controlOptions}
                selectedValues={formData.controlReference || []}
                autoSelectedControls={autoSelectedControls}
                onToggle={handleControlToggle}
              />
            </div>
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                flexWrap: "wrap",
                gap: "5px",
              }}
            >
              {(formData.controlReference || [])
                .filter((id) => idToMeta[id]) // ← only show IDs we know about
                .map((id) => {
                  const meta = idToMeta[id];
                  const fwObj = availableFrameworks?.find(
                    (f) => f.code === meta.framework,
                  );
                  const badge = fwObj
                    ? {
                        bg: fwObj.color ? fwObj.color + "15" : "#e0e0e0",
                        color: fwObj.color || "#616161",
                        border: fwObj.color ? fwObj.color + "40" : "#bdbdbd",
                      }
                    : { bg: "#e0e0e0", color: "#616161", border: "#bdbdbd" };
                  return (
                    <span
                      key={id}
                      title={meta.framework}
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {meta.controlCode}
                    </span>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TreatmentPlanForm;
