// import React, { useCallback, useEffect, useRef, useState } from "react";
// import InputField from "../inputs/InputField";
// import SelectField from "../inputs/SelectField";
// import TextAreaField from "../inputs/TextAreaField";
// import Select from "react-select";
// import Joyride, { STATUS } from "react-joyride";

// const THREAT_VULN_MAP = {
//   "Phishing Attack": {
//     vulnerabilities: ["Weak Email Filters", "Lack of User Awareness"],
//   },
//   "Malware Infection": {
//     vulnerabilities: ["Outdated Antivirus", "Unpatched Software"],
//   },
//   "Insider Threat": {
//     vulnerabilities: ["Weak Access Controls", "Excessive Privileges"],
//   },
// };

// const ALL_VULNERABILITIES = [
//   ...new Set(Object.values(THREAT_VULN_MAP).flatMap((v) => v.vulnerabilities)),
// ];

// const THREAT_OPTIONS = [
//   ...Object.keys(THREAT_VULN_MAP).map((t) => ({ value: t, label: t })),
//   { value: "Others", label: "Others" },
// ];

// const ASSET_CIA = {
//   Public: { confidentiality: 1, integrity: 1, availability: 1 },
//   Private: { confidentiality: 2, integrity: 2, availability: 2 },
//   Sensitive: { confidentiality: 3, integrity: 3, availability: 2 },
//   Confidential: { confidentiality: 3, integrity: 3, availability: 3 },
// };

// function formatListWithAnd(items) {
//   if (!items.length) return "";
//   if (items.length === 1) return items[0];
//   if (items.length === 2) return items.join(" and ");
//   return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
// }

// const RiskDetailsForm = ({
//   formData,
//   handleInputChange,
//   generateRiskId,
//   existingRiskIds = [],
//   isEditing = false,
//   originalRiskId = "",
//   departments = [],
// }) => {
//   const [loggedInUser, setLoggedInUser] = useState(null);
//   useEffect(() => {
//     const u = sessionStorage.getItem("user");
//     if (u) setLoggedInUser(JSON.parse(u));
//   }, []);

//   const handleInputChangeRef = useRef(handleInputChange);
//   useEffect(() => {
//     handleInputChangeRef.current = handleInputChange;
//   });

//   const [runTour, setRunTour] = useState(false);
//   const [selectedThreat, setSelectedThreat] = useState("");
//   const [isCustomThreat, setIsCustomThreat] = useState(false);
//   const [customThreatInput, setCustomThreatInput] = useState("");
//   const [selectedVulnerabilities, setSelectedVulnerabilities] = useState([]);
//   const [showCustomVulInput, setShowCustomVulInput] = useState(false);
//   const [customVulnerability, setCustomVulnerability] = useState("");

//   const editInitialised = useRef(false);
//   useEffect(() => {
//     if (!isEditing || editInitialised.current) return;
//     const rawThreat = Array.isArray(formData.threat)
//       ? formData.threat[0] || ""
//       : formData.threat || "";
//     if (!rawThreat) return;
//     editInitialised.current = true;
//     const isStandard = Object.keys(THREAT_VULN_MAP).includes(rawThreat);
//     if (isStandard) {
//       setSelectedThreat(rawThreat);
//       setIsCustomThreat(false);
//     } else {
//       setIsCustomThreat(true);
//       setCustomThreatInput(rawThreat);
//     }
//     const rawVuls = Array.isArray(formData.vulnerability)
//       ? formData.vulnerability
//       : formData.vulnerability
//         ? String(formData.vulnerability)
//             .split(",")
//             .map((s) => s.trim())
//             .filter(Boolean)
//         : [];
//     const standardVuls = rawVuls.filter((v) => ALL_VULNERABILITIES.includes(v));
//     const customVuls = rawVuls.filter((v) => !ALL_VULNERABILITIES.includes(v));
//     setSelectedVulnerabilities(standardVuls);
//     if (customVuls.length) {
//       setShowCustomVulInput(true);
//       setCustomVulnerability(customVuls.join(", "));
//     }
//   }, [isEditing, formData.threat, formData.vulnerability]);

//   const prevDescRef = useRef("");
//   useEffect(() => {
//     const threatValue = isCustomThreat ? customThreatInput : selectedThreat;
//     const vulArray = [...selectedVulnerabilities];
//     if (showCustomVulInput && customVulnerability) {
//       customVulnerability
//         .split(",")
//         .map((v) => v.trim())
//         .filter(Boolean)
//         .forEach((v) => vulArray.push(v));
//     }
//     if (!threatValue && !vulArray.length) return;
//     const desc = `Risk of loss of information due to ${threatValue}${vulArray.length ? " because of " + formatListWithAnd(vulArray) : ""}`;
//     if (desc === prevDescRef.current) return;
//     prevDescRef.current = desc;
//     handleInputChangeRef.current({
//       target: { name: "riskDescription", value: desc },
//     });
//     handleInputChangeRef.current({
//       target: { name: "threat", value: threatValue ? [threatValue] : [] },
//     });
//     handleInputChangeRef.current({
//       target: { name: "vulnerability", value: vulArray },
//     });
//   }, [
//     selectedThreat,
//     customThreatInput,
//     isCustomThreat,
//     selectedVulnerabilities,
//     customVulnerability,
//     showCustomVulInput,
//   ]);

//   const deptInitialised = useRef(false);
//   useEffect(() => {
//     if (isEditing || deptInitialised.current) return;
//     if (!loggedInUser?.department?.name) return;
//     if (!departments.length) return;
//     if (formData.department) return;
//     deptInitialised.current = true;
//     handleInputChangeRef.current({
//       target: { name: "department", value: loggedInUser.department.name },
//     });
//   }, [isEditing, loggedInUser, departments, formData.department]);

//   const onceRef = useRef(false);
//   useEffect(() => {
//     if (onceRef.current) return;
//     onceRef.current = true;
//     window.scrollTo(0, 0);
//     if (!formData.riskId && !isEditing) generateRiskId();
//     if (!formData.riskType)
//       handleInputChangeRef.current({
//         target: { name: "riskType", value: ["Privacy"] },
//       });
//     if (!formData.date) {
//       const today = new Date().toISOString().split("T")[0];
//       handleInputChangeRef.current({ target: { name: "date", value: today } });
//     }
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   const prevAssetType = useRef("");
//   useEffect(() => {
//     if (!formData.assetType || formData.assetType === prevAssetType.current)
//       return;
//     prevAssetType.current = formData.assetType;
//     const cia = ASSET_CIA[formData.assetType];
//     if (!cia) return;
//     handleInputChangeRef.current({
//       target: { name: "confidentiality", value: cia.confidentiality },
//     });
//     handleInputChangeRef.current({
//       target: { name: "integrity", value: cia.integrity },
//     });
//     handleInputChangeRef.current({
//       target: { name: "availability", value: cia.availability },
//     });
//   }, [formData.assetType]);

//   const prevScoreKey = useRef("");
//   useEffect(() => {
//     const c = parseInt(formData.confidentiality) || 0;
//     const i = parseInt(formData.integrity) || 0;
//     const a = parseInt(formData.availability) || 0;
//     const impact = Math.max(c, i, a);
//     const probability = parseInt(formData.probability) || 0;
//     const riskScore = impact * probability;
//     const riskLevel =
//       riskScore <= 3
//         ? "Low"
//         : riskScore <= 8
//           ? "Medium"
//           : riskScore <= 12
//             ? "High"
//             : "Critical";
//     const key = `${impact}-${probability}`;
//     if (key === prevScoreKey.current) return;
//     prevScoreKey.current = key;
//     handleInputChangeRef.current({ target: { name: "impact", value: impact } });
//     handleInputChangeRef.current({
//       target: { name: "riskScore", value: riskScore },
//     });
//     handleInputChangeRef.current({
//       target: { name: "riskLevel", value: riskLevel },
//     });
//   }, [
//     formData.confidentiality,
//     formData.integrity,
//     formData.availability,
//     formData.probability,
//   ]);

//   const handleThreatChange = useCallback((option) => {
//     if (!option) {
//       setSelectedThreat("");
//       setIsCustomThreat(false);
//       setCustomThreatInput("");
//       setSelectedVulnerabilities([]);
//       setCustomVulnerability("");
//       setShowCustomVulInput(false);
//       handleInputChangeRef.current({ target: { name: "threat", value: [] } });
//       handleInputChangeRef.current({
//         target: { name: "vulnerability", value: [] },
//       });
//       return;
//     }
//     if (option.value === "Others") {
//       setIsCustomThreat(true);
//       setSelectedThreat("");
//       setCustomThreatInput("");
//       setSelectedVulnerabilities([]);
//       setCustomVulnerability("");
//       setShowCustomVulInput(false);
//       handleInputChangeRef.current({ target: { name: "threat", value: [] } });
//       handleInputChangeRef.current({
//         target: { name: "vulnerability", value: [] },
//       });
//     } else {
//       setIsCustomThreat(false);
//       setSelectedThreat(option.value);
//       setCustomThreatInput("");
//       setSelectedVulnerabilities([]);
//       setCustomVulnerability("");
//       setShowCustomVulInput(false);
//       handleInputChangeRef.current({
//         target: { name: "threat", value: [option.value] },
//       });
//       handleInputChangeRef.current({
//         target: { name: "vulnerability", value: [] },
//       });
//     }
//   }, []);

//   const handleVulnerabilityChange = useCallback((options) => {
//     const vals = options ? options.map((o) => o.value) : [];
//     const hasOthers = vals.includes("Others");
//     const regular = vals.filter((v) => v !== "Others");
//     setSelectedVulnerabilities(regular);
//     setShowCustomVulInput(hasOthers);
//     if (!hasOthers) setCustomVulnerability("");
//     handleInputChangeRef.current({
//       target: { name: "vulnerability", value: regular },
//     });
//   }, []);

//   const handleCustomThreat = useCallback((e) => {
//     const val = e.target.value;
//     setCustomThreatInput(val);
//     handleInputChangeRef.current({ target: { name: "threat", value: [val] } });
//   }, []);

//   const handleCustomVulnerability = useCallback(
//     (e) => {
//       const val = e.target.value;
//       setCustomVulnerability(val);
//       const customParts = val
//         .split(",")
//         .map((s) => s.trim())
//         .filter(Boolean);
//       handleInputChangeRef.current({
//         target: {
//           name: "vulnerability",
//           value: [...selectedVulnerabilities, ...customParts],
//         },
//       });
//     },
//     [selectedVulnerabilities],
//   );

//   const calculateImpact = () => {
//     const c = parseInt(formData.confidentiality) || 0;
//     const i = parseInt(formData.integrity) || 0;
//     const a = parseInt(formData.availability) || 0;
//     return Math.max(c, i, a);
//   };

//   const isDuplicateRiskId = () => {
//     if (isEditing && formData.riskId === originalRiskId) return false;
//     return existingRiskIds.includes(formData.riskId);
//   };

//   let vulOptionsArr;
//   if (isCustomThreat) {
//     vulOptionsArr = [
//       ...ALL_VULNERABILITIES.map((v) => ({ value: v, label: v })),
//       { value: "Others", label: "Others" },
//     ];
//   } else if (selectedThreat && THREAT_VULN_MAP[selectedThreat]) {
//     vulOptionsArr = [
//       ...THREAT_VULN_MAP[selectedThreat].vulnerabilities.map((v) => ({
//         value: v,
//         label: v,
//       })),
//       { value: "Others", label: "Others" },
//     ];
//   } else {
//     vulOptionsArr = [{ value: "Others", label: "Others" }];
//   }

//   // ── Risk type options — ISO 42001 added ────────────────────────────────────
//   const riskTypeOptions = [
//     { value: "Security", label: "Security" },
//     { value: "Privacy", label: "Privacy" },
//     { value: "Artificial Intelligence", label: "Artificial Intelligence" },
//   ];

//   const assetTypeOptions = [
//     { value: "Public", label: "Public" },
//     { value: "Private", label: "Private" },
//     { value: "Sensitive", label: "Sensitive" },
//     { value: "Confidential", label: "Confidential" },
//   ];
//   const likelihoodOptions = [
//     { value: 1, label: "1 - Unlikely" },
//     { value: 2, label: "2 - Possible" },
//     { value: 3, label: "3 - Likely" },
//     { value: 4, label: "4 - Almost Certain" },
//   ];

//   const S = {
//     form: {
//       background: "linear-gradient(135deg,#ffffff,#f8f9fa)",
//       padding: 20,
//       borderRadius: 10,
//       boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
//       maxWidth: 800,
//       margin: "0 auto",
//       border: "1px solid #e9ecef",
//     },
//     header: {
//       textAlign: "center",
//       marginBottom: 20,
//       paddingBottom: 10,
//       borderBottom: "2px solid #3498db",
//     },
//     title: { color: "#2c3e50", fontSize: 22, fontWeight: 600, marginBottom: 4 },
//     subtitle: { color: "#7f8c8d", fontSize: 13, fontWeight: 400 },
//     grid: {
//       display: "grid",
//       gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
//       gap: 15,
//       marginBottom: 20,
//     },
//     section: {
//       background: "rgba(52,152,219,0.03)",
//       padding: 15,
//       borderRadius: 8,
//       border: "1px solid rgba(52,152,219,0.1)",
//       marginBottom: 15,
//     },
//     secTitle: {
//       color: "#2c3e50",
//       fontSize: 16,
//       fontWeight: 600,
//       marginBottom: 10,
//     },
//     calcGrid: {
//       display: "grid",
//       gridTemplateColumns: "repeat(2,1fr)",
//       gap: 12,
//       background: "#f4f6f7",
//       padding: 15,
//       borderRadius: 8,
//       marginTop: 15,
//     },
//     calcItem: {
//       textAlign: "center",
//       background: "#fff",
//       padding: 12,
//       borderRadius: 6,
//       boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
//     },
//     calcLabel: {
//       display: "block",
//       fontWeight: 500,
//       color: "#34495e",
//       marginBottom: 6,
//       fontSize: 12,
//       textTransform: "uppercase",
//     },
//     calcVal: {
//       fontSize: 18,
//       fontWeight: 600,
//       padding: "4px 8px",
//       borderRadius: 6,
//       background: "#fff",
//       color: "#2c3e50",
//       border: "1px solid #ecf0f1",
//     },
//     fullWidth: { gridColumn: "1 / -1" },
//     dupWarn: { color: "#e74c3c", fontSize: 12, marginTop: 5, fontWeight: 600 },
//     genBtn: {
//       background: "#3498db",
//       color: "#fff",
//       border: "none",
//       padding: "8px 16px",
//       borderRadius: 6,
//       fontSize: 12,
//       cursor: "pointer",
//       fontWeight: 600,
//     },
//     idHeader: {
//       display: "flex",
//       justifyContent: "space-between",
//       alignItems: "center",
//       marginBottom: 20,
//     },
//     selectLbl: {
//       display: "block",
//       marginBottom: 8,
//       fontWeight: 500,
//       color: "#2c3e50",
//       fontSize: 14,
//     },
//     selectCtrl: {
//       control: (b) => ({
//         ...b,
//         borderRadius: 6,
//         borderColor: "#d1d5db",
//         boxShadow: "none",
//         "&:hover": { borderColor: "#3498db" },
//       }),
//     },
//   };

//   const riskLevelColor = {
//     Low: { bg: "#d5f4e6", color: "#27ae60", border: "#27ae60" },
//     Medium: { bg: "#fef9e7", color: "#f39c12", border: "#f39c12" },
//     High: { bg: "#fdf2e9", color: "#e67e22", border: "#e67e22" },
//     Critical: { bg: "#fadbd8", color: "#e74c3c", border: "#e74c3c" },
//   };
//   const lvl = riskLevelColor[formData.riskLevel] || {};

//   const steps = [
//     {
//       target: ".risk-id-field",
//       content:
//         "This is your Risk ID. You can auto-generate or enter a custom one.",
//       placement: "bottom",
//     },
//     {
//       target: ".department-field",
//       content: "Select the department responsible for this risk.",
//       placement: "bottom",
//     },
//     {
//       target: ".type-select",
//       content:
//         "Choose the Risk Type — Security, Privacy, or Artificial Intelligence.",
//       placement: "bottom",
//     },
//     {
//       target: ".asset-type-field",
//       content: "Select the classification of the asset.",
//       placement: "bottom",
//     },
//     {
//       target: ".asset-field",
//       content: "Enter the specific asset this risk pertains to.",
//       placement: "bottom",
//     },
//     {
//       target: ".threat-select",
//       content: "Choose a threat, or select Others to enter a custom one.",
//       placement: "bottom",
//     },
//     {
//       target: ".vulnerability-select",
//       content: "Pick one or more vulnerabilities.",
//       placement: "bottom",
//     },
//     {
//       target: ".risk-description-field",
//       content: "Auto-generated from threat and vulnerabilities.",
//       placement: "top",
//     },
//     {
//       target: ".likelihood-field",
//       content: "Select the probability level.",
//       placement: "bottom",
//     },
//     {
//       target: ".impact-score-field",
//       content: "Calculated from CIA values.",
//       placement: "top",
//     },
//     {
//       target: ".risk-score-field",
//       content: "Impact × Likelihood.",
//       placement: "top",
//     },
//     {
//       target: ".risk-level-field",
//       content:
//         "Derived from Risk Score: Low (1-3), Medium (4-8), High (9-12), Critical (>12).",
//       placement: "top",
//     },
//     {
//       target: ".existing-controls-field",
//       content: "Enter any controls already in place.",
//       placement: "bottom",
//     },
//   ];

//   // Add this after the existing useState declarations
//   const isAI = Array.isArray(formData.riskType)
//     ? formData.riskType.includes("Artificial Intelligence")
//     : formData.riskType === "Artificial Intelligence";
//   return (
//     <>
//       <style>{`
//         @media(max-width:768px){.risk-form{padding:25px 20px!important;margin:0 10px!important}.risk-grid{grid-template-columns:1fr!important}.calculated-fields{grid-template-columns:1fr!important}}
//         @media(max-width:480px){.risk-form{padding:20px 15px!important}.form-title{font-size:20px!important}}
//       `}</style>
//       <div style={S.form} className="risk-form">
//         <Joyride
//           steps={steps}
//           run={runTour}
//           continuous
//           showSkipButton
//           showProgress
//           styles={{ options: { zIndex: 10000 } }}
//           callback={({ status }) => {
//             if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status))
//               setRunTour(false);
//           }}
//         />
//         <button
//           style={{ ...S.genBtn, marginTop: 10 }}
//           onClick={() => setRunTour(true)}
//         >
//           Tutorial
//         </button>

//         <div style={S.header}>
//           <h2 style={S.title} className="form-title">
//             Risk Assessment
//           </h2>
//           <p style={S.subtitle}>Identify and Assess Risks</p>
//         </div>

//         <div style={S.section}>
//           <div style={S.idHeader}>
//             <h3 style={{ ...S.secTitle, marginBottom: 0 }}>
//               Risk Identification
//             </h3>
//             {!isEditing && (
//               <button
//                 style={S.genBtn}
//                 onClick={generateRiskId}
//                 onMouseEnter={(e) =>
//                   (e.target.style.backgroundColor = "#2980b9")
//                 }
//                 onMouseLeave={(e) =>
//                   (e.target.style.backgroundColor = "#3498db")
//                 }
//               >
//                 Generate New ID
//               </button>
//             )}
//           </div>
//           <div style={S.grid} className="risk-grid">
//             <div>
//               <InputField
//                 label="Risk ID"
//                 name="riskId"
//                 value={formData.riskId || ""}
//                 onChange={handleInputChange}
//                 placeholder="Auto-generated or enter custom ID"
//                 required
//                 readOnly={isEditing}
//                 className="risk-id-field"
//               />
//               {isDuplicateRiskId() && (
//                 <div style={S.dupWarn}>⚠️ This Risk ID already exists.</div>
//               )}
//             </div>
//             <SelectField
//               label="Department"
//               name="department"
//               value={formData.department || ""}
//               onChange={handleInputChange}
//               options={departments.map((d) => ({
//                 value: d.name,
//                 label: d.name,
//               }))}
//               placeholder="Select Department"
//               required
//               disabled={isEditing || !loggedInUser || !departments.length}
//               className="department-field"
//             />
//             <InputField
//               label="Date"
//               name="date"
//               type="date"
//               value={formData.date || ""}
//               onChange={handleInputChange}
//               required
//               readOnly
//             />
//             <SelectField
//               label="Risk Type"
//               name="riskType"
//               isMulti
//               value={formData.riskType}
//               onChange={handleInputChange}
//               options={riskTypeOptions}
//               required
//               className="type-select"
//             />
//             <SelectField
//               label="Asset Type"
//               name="assetType"
//               value={formData.assetType || ""}
//               onChange={handleInputChange}
//               options={assetTypeOptions}
//               placeholder="Select asset classification"
//               required
//               className="asset-type-field"
//             />
//             <InputField
//               label="Asset"
//               name="location"
//               value={formData.location || ""}
//               onChange={handleInputChange}
//               placeholder="Enter the asset"
//               className="asset-field"
//             />
//           </div>
//         </div>

//         {!isAI && (<div style={S.section}>
//           <h3 style={S.secTitle}>Threat &amp; Vulnerabilities</h3>
//           <div style={S.grid} className="risk-grid">
//             <div>
//               <label style={S.selectLbl}>Threat</label>
//               <Select
//                 value={
//                   isCustomThreat
//                     ? { value: "Others", label: "Others" }
//                     : selectedThreat
//                       ? { value: selectedThreat, label: selectedThreat }
//                       : null
//                 }
//                 onChange={handleThreatChange}
//                 options={THREAT_OPTIONS}
//                 placeholder="Select Threat"
//                 isClearable
//                 styles={S.selectCtrl}
//                 className="threat-select"
//               />
//             </div>
//             {isCustomThreat && (
//               <InputField
//                 label="Threat (Custom)"
//                 name="threat"
//                 value={customThreatInput}
//                 onChange={handleCustomThreat}
//                 placeholder="Enter custom threat"
//                 required
//               />
//             )}
//             <div>
//               <label style={S.selectLbl}>Vulnerabilities</label>
//               <Select
//                 isMulti
//                 value={[
//                   ...selectedVulnerabilities.map((v) => ({
//                     value: v,
//                     label: v,
//                   })),
//                   ...(showCustomVulInput
//                     ? [{ value: "Others", label: "Others" }]
//                     : []),
//                 ]}
//                 onChange={handleVulnerabilityChange}
//                 options={vulOptionsArr}
//                 placeholder="Select Vulnerabilities"
//                 isClearable
//                 styles={S.selectCtrl}
//                 className="vulnerability-select"
//               />
//             </div>
//             {showCustomVulInput && (
//               <InputField
//                 label="Vulnerabilities (Custom, comma-separated)"
//                 name="customVulnerability"
//                 value={customVulnerability}
//                 onChange={handleCustomVulnerability}
//                 placeholder="e.g. Weak password policy, No MFA"
//               />
//             )}
//           </div>
//         </div>)}

//         <div style={S.fullWidth}>
//           <TextAreaField
//             label="Risk Description"
//             name="riskDescription"
//             value={formData.riskDescription || ""}
//             onChange={handleInputChange}
//             placeholder="Auto-filled from Threat & Vulnerabilities, or type manually"
//             rows={4}
//             required
//             className="risk-description-field"
//           />
//         </div>

//         <SelectField
//           label="Likelihood"
//           name="probability"
//           value={formData.probability || ""}
//           onChange={handleInputChange}
//           options={likelihoodOptions}
//           placeholder="Select probability level"
//           required
//           className="likelihood-field"
//         />

//         <div style={S.calcGrid} className="calculated-fields">
//           <div style={S.calcItem} className="impact-score-field">
//             <label style={S.calcLabel}>Impact Score</label>
//             <span style={S.calcVal}>{calculateImpact() || 0}</span>
//           </div>
//           <div style={S.calcItem}>
//             <label style={S.calcLabel}>Likelihood Score</label>
//             <span style={S.calcVal}>{formData.probability || 0}</span>
//           </div>
//           <div style={S.calcItem} className="risk-score-field">
//             <label style={S.calcLabel}>Risk Score</label>
//             <span style={S.calcVal}>{formData.riskScore || 0}</span>
//           </div>
//           <div style={S.calcItem} className="risk-level-field">
//             <label style={S.calcLabel}>Risk Level</label>
//             <span
//               style={{
//                 ...S.calcVal,
//                 backgroundColor: lvl.bg,
//                 color: lvl.color,
//                 border: `2px solid ${lvl.border}`,
//               }}
//             >
//               {formData.riskLevel || "Not Identified"}
//             </span>
//           </div>
//         </div>

//         <div style={{ ...S.fullWidth, marginTop: 16 }}>
//           <TextAreaField
//             label="Existing Controls"
//             name="existingcontrols"
//             value={formData.existingcontrols || ""}
//             onChange={handleInputChange}
//             placeholder="Controls which are already implemented…"
//             rows={3}
//             className="existing-controls-field"
//           />
//         </div>
//       </div>
//     </>
//   );
// };

// export default RiskDetailsForm;




import React, { useCallback, useEffect, useRef, useState } from "react";
import InputField from "../inputs/InputField";
import SelectField from "../inputs/SelectField";
import TextAreaField from "../inputs/TextAreaField";
import Select from "react-select";
import Joyride, { STATUS } from "react-joyride";
import { useFramework } from "../../../../context/FrameworkContex";

// ─── Threat → Vulnerability mapping (UNCHANGED) ──────────────────────────────
const THREAT_VULN_MAP = {
  "Phishing Attack": {
    vulnerabilities: ["Weak Email Filters", "Lack of User Awareness"],
  },
  "Malware Infection": {
    vulnerabilities: ["Outdated Antivirus", "Unpatched Software"],
  },
  "Insider Threat": {
    vulnerabilities: ["Weak Access Controls", "Excessive Privileges"],
  },
};

const ALL_VULNERABILITIES = [
  ...new Set(Object.values(THREAT_VULN_MAP).flatMap((v) => v.vulnerabilities)),
];

const THREAT_OPTIONS = [
  ...Object.keys(THREAT_VULN_MAP).map((t) => ({ value: t, label: t })),
  { value: "Others", label: "Others" },
];

const ASSET_CIA = {
  Public:       { confidentiality: 1, integrity: 1, availability: 1 },
  Private:      { confidentiality: 2, integrity: 2, availability: 2 },
  Sensitive:    { confidentiality: 3, integrity: 3, availability: 2 },
  Confidential: { confidentiality: 3, integrity: 3, availability: 3 },
};

function formatListWithAnd(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(" and ");
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

// ─── Framework filter helpers ─────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────

const RiskDetailsForm = ({
  formData,
  handleInputChange,
  generateRiskId,
  existingRiskIds = [],
  isEditing = false,
  originalRiskId = "",
  departments = [],
}) => {
  // ── Framework context ────────────────────────────────────────────────────
  const { selectedFrameworks, isAllSelected, availableFrameworks } = useFramework();

  const ALL_RISK_TYPE_OPTIONS = [
    { value: "Security",                label: "Security"                },
    { value: "Privacy",                 label: "Privacy"                 },
    { value: "Artificial Intelligence", label: "Artificial Intelligence" },
  ];

  // Compute filtered risk type options based on active framework filter
  const { filteredRiskTypeOptions, allowedRiskTypeValues } = React.useMemo(() => {
    if (isAllSelected) {
      const allTypes = new Set();
      availableFrameworks?.forEach(fw => {
        if (fw.riskTypes) fw.riskTypes.forEach(rt => allTypes.add(rt));
      });
      return {
        filteredRiskTypeOptions: ALL_RISK_TYPE_OPTIONS.filter(o => allTypes.has(o.value)),
        allowedRiskTypeValues: allTypes,
      };
    }
    const allowed = new Set();
    selectedFrameworks.forEach((fwId) => {
      const fwObj = availableFrameworks?.find(f => f.id === fwId);
      if (fwObj && fwObj.riskTypes) {
        fwObj.riskTypes.forEach(rt => allowed.add(rt));
      }
    });
    return {
      filteredRiskTypeOptions: ALL_RISK_TYPE_OPTIONS.filter((o) => allowed.has(o.value)),
      allowedRiskTypeValues: allowed,
    };
  }, [selectedFrameworks, isAllSelected, availableFrameworks, ALL_RISK_TYPE_OPTIONS]);

  const [loggedInUser, setLoggedInUser] = useState(null);
  useEffect(() => {
    const u = sessionStorage.getItem("user");
    if (u) setLoggedInUser(JSON.parse(u));
  }, []);

  const handleInputChangeRef = useRef(handleInputChange);
  useEffect(() => {
    handleInputChangeRef.current = handleInputChange;
  });

  const [runTour, setRunTour]                               = useState(false);
  const [selectedThreat, setSelectedThreat]                 = useState("");
  const [isCustomThreat, setIsCustomThreat]                 = useState(false);
  const [customThreatInput, setCustomThreatInput]           = useState("");
  const [selectedVulnerabilities, setSelectedVulnerabilities] = useState([]);
  const [showCustomVulInput, setShowCustomVulInput]         = useState(false);
  const [customVulnerability, setCustomVulnerability]       = useState("");

  // Strip invalid riskType values when filter changes
  const prevAllowedKey = useRef(null);
  useEffect(() => {
    if (isAllSelected) return;
    const key = [...allowedRiskTypeValues].sort().join(",");
    if (prevAllowedKey.current === key) return;
    prevAllowedKey.current = key;
    const current = Array.isArray(formData.riskType) ? formData.riskType : [];
    const valid   = current.filter((t) => allowedRiskTypeValues.has(t));
    if (valid.length !== current.length)
      handleInputChangeRef.current({ target: { name: "riskType", value: valid } });
  }, [allowedRiskTypeValues, isAllSelected, formData.riskType]);

  const editInitialised = useRef(false);
  useEffect(() => {
    if (!isEditing || editInitialised.current) return;
    const rawThreat = Array.isArray(formData.threat)
      ? formData.threat[0] || ""
      : formData.threat || "";
    if (!rawThreat) return;
    editInitialised.current = true;
    const isStandard = Object.keys(THREAT_VULN_MAP).includes(rawThreat);
    if (isStandard) {
      setSelectedThreat(rawThreat);
      setIsCustomThreat(false);
    } else {
      setIsCustomThreat(true);
      setCustomThreatInput(rawThreat);
    }
    const rawVuls = Array.isArray(formData.vulnerability)
      ? formData.vulnerability
      : formData.vulnerability
        ? String(formData.vulnerability).split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    const standardVuls = rawVuls.filter((v) => ALL_VULNERABILITIES.includes(v));
    const customVuls   = rawVuls.filter((v) => !ALL_VULNERABILITIES.includes(v));
    setSelectedVulnerabilities(standardVuls);
    if (customVuls.length) {
      setShowCustomVulInput(true);
      setCustomVulnerability(customVuls.join(", "));
    }
  }, [isEditing, formData.threat, formData.vulnerability]);

  const prevDescRef = useRef("");
  useEffect(() => {
    const threatValue = isCustomThreat ? customThreatInput : selectedThreat;
    const vulArray = [...selectedVulnerabilities];
    if (showCustomVulInput && customVulnerability) {
      customVulnerability.split(",").map((v) => v.trim()).filter(Boolean).forEach((v) => vulArray.push(v));
    }
    if (!threatValue && !vulArray.length) return;
    const desc = `Risk of loss of information due to ${threatValue}${vulArray.length ? " because of " + formatListWithAnd(vulArray) : ""}`;
    if (desc === prevDescRef.current) return;
    prevDescRef.current = desc;
    handleInputChangeRef.current({ target: { name: "riskDescription", value: desc } });
    handleInputChangeRef.current({ target: { name: "threat",          value: threatValue ? [threatValue] : [] } });
    handleInputChangeRef.current({ target: { name: "vulnerability",   value: vulArray } });
  }, [selectedThreat, customThreatInput, isCustomThreat, selectedVulnerabilities, customVulnerability, showCustomVulInput]);

  const deptInitialised = useRef(false);
  useEffect(() => {
    if (isEditing || deptInitialised.current) return;
    if (!loggedInUser?.department?.name) return;
    if (!departments.length) return;
    if (formData.department) return;
    deptInitialised.current = true;
    handleInputChangeRef.current({ target: { name: "department", value: loggedInUser.department.name } });
  }, [isEditing, loggedInUser, departments, formData.department]);

  const onceRef = useRef(false);
  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;
    window.scrollTo(0, 0);
    if (!formData.riskId && !isEditing) generateRiskId();
    if (!formData.riskType)
      handleInputChangeRef.current({ target: { name: "riskType", value: ["Privacy"] } });
    if (!formData.date) {
      const today = new Date().toISOString().split("T")[0];
      handleInputChangeRef.current({ target: { name: "date", value: today } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const prevAssetType = useRef("");
  useEffect(() => {
    if (!formData.assetType || formData.assetType === prevAssetType.current) return;
    prevAssetType.current = formData.assetType;
    const cia = ASSET_CIA[formData.assetType];
    if (!cia) return;
    handleInputChangeRef.current({ target: { name: "confidentiality", value: cia.confidentiality } });
    handleInputChangeRef.current({ target: { name: "integrity",       value: cia.integrity       } });
    handleInputChangeRef.current({ target: { name: "availability",    value: cia.availability    } });
  }, [formData.assetType]);

  const prevScoreKey = useRef("");
  useEffect(() => {
    const c = parseInt(formData.confidentiality) || 0;
    const i = parseInt(formData.integrity)       || 0;
    const a = parseInt(formData.availability)    || 0;
    const impact      = Math.max(c, i, a);
    const probability = parseInt(formData.probability) || 0;
    const riskScore   = impact * probability;
    const riskLevel   = riskScore <= 3 ? "Low" : riskScore <= 8 ? "Medium" : riskScore <= 12 ? "High" : "Critical";
    const key = `${impact}-${probability}`;
    if (key === prevScoreKey.current) return;
    prevScoreKey.current = key;
    handleInputChangeRef.current({ target: { name: "impact",    value: impact    } });
    handleInputChangeRef.current({ target: { name: "riskScore", value: riskScore } });
    handleInputChangeRef.current({ target: { name: "riskLevel", value: riskLevel } });
  }, [formData.confidentiality, formData.integrity, formData.availability, formData.probability]);

  const handleThreatChange = useCallback((option) => {
    if (!option) {
      setSelectedThreat(""); setIsCustomThreat(false); setCustomThreatInput("");
      setSelectedVulnerabilities([]); setCustomVulnerability(""); setShowCustomVulInput(false);
      handleInputChangeRef.current({ target: { name: "threat",        value: [] } });
      handleInputChangeRef.current({ target: { name: "vulnerability", value: [] } });
      return;
    }
    if (option.value === "Others") {
      setIsCustomThreat(true); setSelectedThreat(""); setCustomThreatInput("");
      setSelectedVulnerabilities([]); setCustomVulnerability(""); setShowCustomVulInput(false);
      handleInputChangeRef.current({ target: { name: "threat",        value: [] } });
      handleInputChangeRef.current({ target: { name: "vulnerability", value: [] } });
    } else {
      setIsCustomThreat(false); setSelectedThreat(option.value); setCustomThreatInput("");
      setSelectedVulnerabilities([]); setCustomVulnerability(""); setShowCustomVulInput(false);
      handleInputChangeRef.current({ target: { name: "threat",        value: [option.value] } });
      handleInputChangeRef.current({ target: { name: "vulnerability", value: []             } });
    }
  }, []);

  const handleVulnerabilityChange = useCallback((options) => {
    const vals      = options ? options.map((o) => o.value) : [];
    const hasOthers = vals.includes("Others");
    const regular   = vals.filter((v) => v !== "Others");
    setSelectedVulnerabilities(regular);
    setShowCustomVulInput(hasOthers);
    if (!hasOthers) setCustomVulnerability("");
    handleInputChangeRef.current({ target: { name: "vulnerability", value: regular } });
  }, []);

  const handleCustomThreat = useCallback((e) => {
    const val = e.target.value;
    setCustomThreatInput(val);
    handleInputChangeRef.current({ target: { name: "threat", value: [val] } });
  }, []);

  const handleCustomVulnerability = useCallback((e) => {
    const val        = e.target.value;
    setCustomVulnerability(val);
    const customParts = val.split(",").map((s) => s.trim()).filter(Boolean);
    handleInputChangeRef.current({ target: { name: "vulnerability", value: [...selectedVulnerabilities, ...customParts] } });
  }, [selectedVulnerabilities]);

  const calculateImpact = () => {
    const c = parseInt(formData.confidentiality) || 0;
    const i = parseInt(formData.integrity)       || 0;
    const a = parseInt(formData.availability)    || 0;
    return Math.max(c, i, a);
  };

  const isDuplicateRiskId = () => {
    if (isEditing && formData.riskId === originalRiskId) return false;
    return existingRiskIds.includes(formData.riskId);
  };

  let vulOptionsArr;
  if (isCustomThreat) {
    vulOptionsArr = [...ALL_VULNERABILITIES.map((v) => ({ value: v, label: v })), { value: "Others", label: "Others" }];
  } else if (selectedThreat && THREAT_VULN_MAP[selectedThreat]) {
    vulOptionsArr = [...THREAT_VULN_MAP[selectedThreat].vulnerabilities.map((v) => ({ value: v, label: v })), { value: "Others", label: "Others" }];
  } else {
    vulOptionsArr = [{ value: "Others", label: "Others" }];
  }

  const assetTypeOptions = [
    { value: "Public",       label: "Public"       },
    { value: "Private",      label: "Private"      },
    { value: "Sensitive",    label: "Sensitive"    },
    { value: "Confidential", label: "Confidential" },
  ];
  const likelihoodOptions = [
    { value: 1, label: "1 - Unlikely"       },
    { value: 2, label: "2 - Possible"       },
    { value: 3, label: "3 - Likely"         },
    { value: 4, label: "4 - Almost Certain" },
  ];

  const S = {
    form:      { background: "linear-gradient(135deg,#ffffff,#f8f9fa)", padding: 20, borderRadius: 10, boxShadow: "0 4px 15px rgba(0,0,0,0.05)", maxWidth: 800, margin: "0 auto", border: "1px solid #e9ecef" },
    header:    { textAlign: "center", marginBottom: 20, paddingBottom: 10, borderBottom: "2px solid #3498db" },
    title:     { color: "#2c3e50", fontSize: 22, fontWeight: 600, marginBottom: 4 },
    subtitle:  { color: "#7f8c8d", fontSize: 13, fontWeight: 400 },
    grid:      { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 15, marginBottom: 20 },
    section:   { background: "rgba(52,152,219,0.03)", padding: 15, borderRadius: 8, border: "1px solid rgba(52,152,219,0.1)", marginBottom: 15 },
    secTitle:  { color: "#2c3e50", fontSize: 16, fontWeight: 600, marginBottom: 10 },
    calcGrid:  { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, background: "#f4f6f7", padding: 15, borderRadius: 8, marginTop: 15 },
    calcItem:  { textAlign: "center", background: "#fff", padding: 12, borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    calcLabel: { display: "block", fontWeight: 500, color: "#34495e", marginBottom: 6, fontSize: 12, textTransform: "uppercase" },
    calcVal:   { fontSize: 18, fontWeight: 600, padding: "4px 8px", borderRadius: 6, background: "#fff", color: "#2c3e50", border: "1px solid #ecf0f1" },
    fullWidth: { gridColumn: "1 / -1" },
    dupWarn:   { color: "#e74c3c", fontSize: 12, marginTop: 5, fontWeight: 600 },
    genBtn:    { background: "#3498db", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 },
    idHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    selectLbl: { display: "block", marginBottom: 8, fontWeight: 500, color: "#2c3e50", fontSize: 14 },
    selectCtrl:{ control: (b) => ({ ...b, borderRadius: 6, borderColor: "#d1d5db", boxShadow: "none", "&:hover": { borderColor: "#3498db" } }) },
  };

  const riskLevelColor = {
    Low:      { bg: "#d5f4e6", color: "#27ae60", border: "#27ae60" },
    Medium:   { bg: "#fef9e7", color: "#f39c12", border: "#f39c12" },
    High:     { bg: "#fdf2e9", color: "#e67e22", border: "#e67e22" },
    Critical: { bg: "#fadbd8", color: "#e74c3c", border: "#e74c3c" },
  };
  const lvl = riskLevelColor[formData.riskLevel] || {};

  const isAI = Array.isArray(formData.riskType)
    ? formData.riskType.includes("Artificial Intelligence")
    : formData.riskType === "Artificial Intelligence";

  const steps = [
    { target: ".risk-id-field",          content: "This is your Risk ID. You can auto-generate or enter a custom one.",                                       placement: "bottom" },
    { target: ".department-field",       content: "Select the department responsible for this risk.",                                                          placement: "bottom" },
    { target: ".type-select",            content: "Choose the Risk Type. Options are filtered by your active dashboard framework selection.",                  placement: "bottom" },
    { target: ".asset-type-field",       content: "Select the classification of the asset.",                                                                   placement: "bottom" },
    { target: ".asset-field",            content: "Enter the specific asset this risk pertains to.",                                                           placement: "bottom" },
    { target: ".threat-select",          content: "Choose a threat, or select Others to enter a custom one.",                                                  placement: "bottom" },
    { target: ".vulnerability-select",   content: "Pick one or more vulnerabilities.",                                                                         placement: "bottom" },
    { target: ".risk-description-field", content: "Auto-generated from threat and vulnerabilities.",                                                           placement: "top"    },
    { target: ".likelihood-field",       content: "Select the probability level.",                                                                             placement: "bottom" },
    { target: ".impact-score-field",     content: "Calculated from CIA values.",                                                                               placement: "top"    },
    { target: ".risk-score-field",       content: "Impact × Likelihood.",                                                                                     placement: "top"    },
    { target: ".risk-level-field",       content: "Derived from Risk Score: Low (1-3), Medium (4-8), High (9-12), Critical (>12).",                           placement: "top"    },
    { target: ".existing-controls-field",content: "Enter any controls already in place.",                                                                      placement: "bottom" },
  ];

  return (
    <>
      <style>{`
        @media(max-width:768px){.risk-form{padding:25px 20px!important;margin:0 10px!important}.risk-grid{grid-template-columns:1fr!important}.calculated-fields{grid-template-columns:1fr!important}}
        @media(max-width:480px){.risk-form{padding:20px 15px!important}.form-title{font-size:20px!important}}
      `}</style>
      <div style={S.form} className="risk-form">
        <Joyride
          steps={steps} run={runTour} continuous showSkipButton showProgress
          styles={{ options: { zIndex: 10000 } }}
          callback={({ status }) => { if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) setRunTour(false); }}
        />
        <button style={{ ...S.genBtn, marginTop: 10 }} onClick={() => setRunTour(true)}>Tutorial</button>

        {/* ──────────────────────────────────────────────────────────────────
            Framework Filter Banner — only when a specific framework is active
            ────────────────────────────────────────────────────────────────── */}
        {!isAllSelected && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px 16px", marginTop: 14,
            background: "linear-gradient(135deg,#eff6ff,#f0f9ff)",
            border: "1px solid #bfdbfe", borderLeft: "4px solid #3b82f6",
            borderRadius: 8, marginBottom: 16,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", background: "#3b82f6",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
            }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v4M5.5 7.5v.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", marginBottom: 4, letterSpacing: "0.02em" }}>
                Framework Filter Active
              </div>
              <div style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 1.5, marginBottom: 6 }}>
                Showing results for{" "}
                {selectedFrameworks.map((fwId, i) => {
                  const fwObj = availableFrameworks?.find(f => f.id === fwId);
                  const bg = fwObj?.color ? fwObj.color + "15" : "#f1f5f9";
                  const color = fwObj?.color || "#334155";
                  const border = fwObj?.color ? fwObj.color + "40" : "#cbd5e1";
                  return (
                    <span key={fwId}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "1px 7px", borderRadius: 10,
                        background: bg, color: color,
                        border: `1px solid ${border}`, fontWeight: 600, fontSize: 11,
                      }}>{fwId}</span>
                      {i < selectedFrameworks.length - 1 && <span style={{ margin: "0 3px", color: "#64748b" }}>+</span>}
                    </span>
                  );
                })}
                {" "}— showing relevant options only.
              </div>
              <div style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: "#6b7280" }}>Available risk types:</span>
                {filteredRiskTypeOptions.map((o) => (
                  <span key={o.value} style={{
                    padding: "1px 8px", borderRadius: 10, background: "#dbeafe",
                    color: "#1d4ed8", fontWeight: 600, border: "1px solid #93c5fd", fontSize: 11,
                  }}>{o.label}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={S.header}>
          <h2 style={S.title} className="form-title">Risk Assessment</h2>
          <p style={S.subtitle}>Identify and Assess Risks</p>
        </div>

        <div style={S.section}>
          <div style={S.idHeader}>
            <h3 style={{ ...S.secTitle, marginBottom: 0 }}>Risk Identification</h3>
            {!isEditing && (
              <button style={S.genBtn} onClick={generateRiskId}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#2980b9")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#3498db")}>
                Generate New ID
              </button>
            )}
          </div>
          <div style={S.grid} className="risk-grid">
            <div>
              <InputField label="Risk ID" name="riskId" value={formData.riskId || ""}
                onChange={handleInputChange} placeholder="Auto-generated or enter custom ID"
                required readOnly={isEditing} className="risk-id-field" />
              {isDuplicateRiskId() && <div style={S.dupWarn}>⚠️ This Risk ID already exists.</div>}
            </div>
            <SelectField label="Department" name="department" value={formData.department || ""}
              onChange={handleInputChange} options={departments.map((d) => ({ value: d.name, label: d.name }))}
              placeholder="Select Department" required
              disabled={isEditing || !loggedInUser || !departments.length} className="department-field" />
            <InputField label="Date" name="date" type="date" value={formData.date || ""}
              onChange={handleInputChange} required readOnly />

            {/* ────────────────────────────────────────────────────────────────
                Risk Type — options filtered by active framework filter
                ──────────────────────────────────────────────────────────────── */}
            <div>
              <SelectField label="Risk Type" name="riskType" isMulti value={formData.riskType}
                onChange={handleInputChange} options={filteredRiskTypeOptions}
                required className="type-select" />
              {!isAllSelected && (
                <div style={{ marginTop: 5, fontSize: 11, color: "#6b7280", fontStyle: "italic", display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <circle cx="5.5" cy="5.5" r="5" stroke="#9ca3af" strokeWidth="1"/>
                    <path d="M5.5 3v2.5M5.5 7v.5" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Options filtered by active framework
                </div>
              )}
            </div>

            <SelectField label="Asset Type" name="assetType" value={formData.assetType || ""}
              onChange={handleInputChange} options={assetTypeOptions}
              placeholder="Select asset classification" required className="asset-type-field" />
            <InputField label="Asset" name="location" value={formData.location || ""}
              onChange={handleInputChange} placeholder="Enter the asset" className="asset-field" />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            Threat & Vulnerabilities — hidden for AI risk type (UNCHANGED logic)
            ───────────────────────────────────────────────────────────────── */}
        {!isAI && (
          <div style={S.section}>
            <h3 style={S.secTitle}>Threat &amp; Vulnerabilities</h3>
            <div style={S.grid} className="risk-grid">
              <div>
                <label style={S.selectLbl}>Threat</label>
                <Select
                  value={isCustomThreat ? { value: "Others", label: "Others" } : selectedThreat ? { value: selectedThreat, label: selectedThreat } : null}
                  onChange={handleThreatChange} options={THREAT_OPTIONS}
                  placeholder="Select Threat" isClearable styles={S.selectCtrl} className="threat-select" />
              </div>
              {isCustomThreat && (
                <InputField label="Threat (Custom)" name="threat" value={customThreatInput}
                  onChange={handleCustomThreat} placeholder="Enter custom threat" required />
              )}
              <div>
                <label style={S.selectLbl}>Vulnerabilities</label>
                <Select isMulti
                  value={[
                    ...selectedVulnerabilities.map((v) => ({ value: v, label: v })),
                    ...(showCustomVulInput ? [{ value: "Others", label: "Others" }] : []),
                  ]}
                  onChange={handleVulnerabilityChange} options={vulOptionsArr}
                  placeholder="Select Vulnerabilities" isClearable styles={S.selectCtrl} className="vulnerability-select" />
              </div>
              {showCustomVulInput && (
                <InputField label="Vulnerabilities (Custom, comma-separated)" name="customVulnerability"
                  value={customVulnerability} onChange={handleCustomVulnerability}
                  placeholder="e.g. Weak password policy, No MFA" />
              )}
            </div>
          </div>
        )}

        <div style={S.fullWidth}>
          <TextAreaField label="Risk Description" name="riskDescription" value={formData.riskDescription || ""}
            onChange={handleInputChange} placeholder="Auto-filled from Threat & Vulnerabilities, or type manually"
            rows={4} required className="risk-description-field" />
        </div>

        <SelectField label="Likelihood" name="probability" value={formData.probability || ""}
          onChange={handleInputChange} options={likelihoodOptions}
          placeholder="Select probability level" required className="likelihood-field" />

        <div style={S.calcGrid} className="calculated-fields">
          <div style={S.calcItem} className="impact-score-field">
            <label style={S.calcLabel}>Impact Score</label>
            <span style={S.calcVal}>{calculateImpact() || 0}</span>
          </div>
          <div style={S.calcItem}>
            <label style={S.calcLabel}>Likelihood Score</label>
            <span style={S.calcVal}>{formData.probability || 0}</span>
          </div>
          <div style={S.calcItem} className="risk-score-field">
            <label style={S.calcLabel}>Risk Score</label>
            <span style={S.calcVal}>{formData.riskScore || 0}</span>
          </div>
          <div style={S.calcItem} className="risk-level-field">
            <label style={S.calcLabel}>Risk Level</label>
            <span style={{ ...S.calcVal, backgroundColor: lvl.bg, color: lvl.color, border: `2px solid ${lvl.border}` }}>
              {formData.riskLevel || "Not Identified"}
            </span>
          </div>
        </div>

        <div style={{ ...S.fullWidth, marginTop: 16 }}>
          <TextAreaField label="Existing Controls" name="existingcontrols" value={formData.existingcontrols || ""}
            onChange={handleInputChange} placeholder="Controls which are already implemented…"
            rows={3} className="existing-controls-field" />
        </div>
      </div>
    </>
  );
};

export default RiskDetailsForm;