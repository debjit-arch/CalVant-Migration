// //C:\Users\ak192\Downloads\cf-tool-frontend-prod (6)\cf-tool-frontend-prod\src\modules\dpia\components\AssignDpiaModal.js


// import React, { useState, useEffect } from "react";
// import { ChevronDown, Save, RefreshCw, ShieldCheck, Plus } from "lucide-react";
// import { Modal, ModalHeader, Spinner } from "./ui";
// import {
//   getSessionUser,
//   inputStyle,
//   selectStyle,
//   labelStyle,
//   btnPrimary,
// } from "../utils/helpers";
// import * as dpiaApi from "../services/dpiaApi";
// import { useRouter } from "next/navigation";
// import { captureActivity, ACTIONS } from "../../../services/activities";

// // ─── helpers ──────────────────────────────────────────────────────────────────
// function statusStyle(status) {
//   if (!status) return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
//   const s = status.toUpperCase();
//   if (s === "SUBMITTED")
//     return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
//   if (s === "APPROVED")
//     return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
//   return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
// }

// function riskStyle(level) {
//   if (!level) return { bg: "#f1f5f9", color: "#64748b" };
//   const l = level.toUpperCase();
//   if (l === "HIGH") return { bg: "#fee2e2", color: "#991b1b" };
//   if (l === "MEDIUM") return { bg: "#fef3c7", color: "#92400e" };
//   if (l === "LOW") return { bg: "#d1fae5", color: "#065f46" };
//   return { bg: "#f1f5f9", color: "#64748b" };
// }

// // ─── ASSIGN DPIA MODAL ────────────────────────────────────────────────────────
// export function AssignDpiaModal({
//   onClose,
//   onSaved,
//   riskOwners = [],
//   departments = [],
// }) {
//   const sessionUser = getSessionUser();

//   const [dpias, setDpias] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [step, setStep] = useState(1);
//   const [selected, setSelected] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [form, setForm] = useState({
//     assignedTo: "",
//     department: "",
//     dueDate: "",
//     notes: "",
//     priority: "Medium",
//   });
//   const [creating, setCreating] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     const orgId = sessionUser.organization || sessionUser.organizationId || "";
//     captureActivity({
//       action: 'DPIA_PLAN_MODAL_OPENED',
//       item: 'Opened Plan DPIA Modal',
//       url: window.pathname
//     });
//     dpiaApi
//       .getAllAssessments(orgId)
//       .then((data) => {
//         setDpias(data || []);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, []);

//   const setField = (k, v) => {
//     setForm((p) => {
//       const next = { ...p, [k]: v };
//       // Reset assignedTo when department changes
//       if (k === "department") next.assignedTo = "";
//       return next;
//     });
//   };

//   // Filter risk owners by selected department
//   const filteredRiskOwners = form.department
//     ? riskOwners.filter((owner) => {
//         const ownerDepts = Array.isArray(owner.department)
//           ? owner.department
//           : owner.department
//             ? [owner.department]
//             : [];
//         if (ownerDepts.length === 0) return false;
//         const selectedDeptObj = departments.find(
//           (d) => d.name === form.department,
//         );
//         const selectedDeptId =
//           selectedDeptObj?._id || selectedDeptObj?.id || "";
//         const selectedDeptName = form.department;
//         return ownerDepts.some((dept) => {
//           const deptStr = String(dept || "")
//             .trim()
//             .toLowerCase();
//           return (
//             deptStr === selectedDeptId.toLowerCase() ||
//             deptStr === selectedDeptName.toLowerCase()
//           );
//         });
//       })
//     : riskOwners;

//   // ✅ FIX 1: Auto-select risk owner when filtered list updates
//   useEffect(() => {
//     if (filteredRiskOwners.length === 1) {
//       // Exactly one owner — auto-select them
//       const onlyOwner = filteredRiskOwners[0];
//       setForm((p) => ({
//         ...p,
//         assignedTo: String(onlyOwner._id || onlyOwner.id),
//       }));
//     } else if (filteredRiskOwners.length === 0) {
//       // No owners — clear selection
//       setForm((p) => ({ ...p, assignedTo: "" }));
//     }
//     // If multiple owners, leave assignedTo as-is (user must pick)
//   }, [form.department]); // re-run whenever department changes

//   async function handleAssign() {
//     if (!selected || !form.assignedTo || !form.department) return;
//     setSaving(true);
//     setError("");

//     try {
//       const owner = riskOwners.find(
//         (u) => String(u._id || u.id) === form.assignedTo,
//       );

//       if (form.department) {
//         await dpiaApi.updateDepartments(selected.id, [form.department]);
//       }
//       await dpiaApi.assignDpia({
//         dpiaId: selected.id,
//         projectName: selected.projectName || selected.id,
//         assignedTo: form.assignedTo,
//         assignedToName: owner ? owner.name : form.assignedTo,
//         department: form.department,
//         dueDate: form.dueDate,
//         notes: form.notes,
//         priority: form.priority,
//         assignedBy: sessionUser.id || sessionUser._id || "",
//         assignedByName: sessionUser.name || "",
//         organizationId:
//           sessionUser.organization || sessionUser.organizationId || "",
//         status: "PENDING",
//       });

//       captureActivity({
//         action: ACTIONS.CREATE,
//         item: `DPIA · Assigned Assessment ID: ${selected.id} to ${owner ? owner.name : form.assignedTo}`,
//         url: window.pathname,
//         payload: { ...form, dpiaId: selected.id }
//       });

//       if (onSaved) onSaved();
//       onClose();
//     } catch (err) {
//       setError(err.message || "Failed to assign DPIA");
//       setSaving(false);
//     }
//   }

//   const canAssign = form.assignedTo && form.dueDate && form.department;

//   return (
//     <Modal onClose={onClose} wide={true}>
//       <ModalHeader
//         title="Plan DPIA"
//         subtitle={
//           step === 1
//             ? "Step 1 of 2 — Select Assessment"
//             : "Step 2 of 2 — Set Department & Assignee"
//         }
//         onClose={onClose}
//       />

//       <div
//         style={{
//           padding: "14px 28px 0",
//           display: "flex",
//           justifyContent: "flex-end",
//         }}
//       >
//         <button
//           onClick={async () => {
//             try {
//               setCreating(true);
//               const newDpia = await dpiaApi.createAssessment(
//                 "",
//                 sessionUser.organization || sessionUser.organizationId || "",
//               );
//               setDpias((prev) => [newDpia, ...prev]);
//               setSelected(newDpia);
//               captureActivity({
//                 action: ACTIONS.CREATE,
//                 item: `DPIA · Created New DPIA Assessment: ${newDpia.id}`,
//                 url: window.pathname
//               });
//               setStep(2);
//             } catch (err) {
//               console.error(err);
//             } finally {
//               setCreating(false);
//             }
//           }}
//           disabled={creating}
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 6,
//             padding: "8px 14px",
//             borderRadius: 10,
//             border: "1px solid #e2e8f0",
//             background: "#ffffff",
//             fontSize: 13,
//             fontWeight: 600,
//             color: "#475569",
//             cursor: creating ? "not-allowed" : "pointer",
//           }}
//         >
//           {creating ? <RefreshCw size={14} /> : <Plus size={14} />}
//           {creating ? "Creating..." : "Create New DPIA"}
//         </button>
//       </div>

//       {/* progress bar */}
//       <div style={{ display: "flex", gap: 6, padding: "14px 28px 0" }}>
//         {[1, 2].map((s) => (
//           <div
//             key={s}
//             style={{
//               flex: 1,
//               height: 5,
//               borderRadius: 4,
//               background: step >= s ? "#7c3aed" : "#e2e8f0",
//               transition: "background 0.3s",
//             }}
//           />
//         ))}
//       </div>

//       <div style={{ padding: "20px 28px 8px", minHeight: 340 }}>
//         {/* ── Step 1: pick DPIA ── */}
//         {step === 1 && (
//           <div>
//             {loading && <Spinner />}
//             {!loading && dpias.length === 0 && (
//               <div
//                 style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}
//               >
//                 <ShieldCheck
//                   size={36}
//                   color="#cbd5e1"
//                   style={{ margin: "0 auto 12px" }}
//                 />
//                 <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
//                   No DPIA assessments found.
//                 </p>
//                 <p style={{ margin: "4px 0 0", fontSize: 12 }}>
//                   Complete a DPIA before assigning.
//                 </p>
//               </div>
//             )}
//             <div
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: 10,
//                 maxHeight: 400,
//                 overflowY: "auto",
//               }}
//             >
//               {dpias.map((dpia) => {
//                 const st = statusStyle(dpia.status);
//                 const rl = riskStyle(dpia.overallRiskLevel);
//                 const sel = selected?.id === dpia.id;
//                 return (
//                   <div
//                     key={dpia.id}
//                     onClick={() => setSelected(dpia)}
//                     style={{
//                       border: `2px solid ${sel ? "#7c3aed" : "#f1f5f9"}`,
//                       borderRadius: 14,
//                       padding: "14px 16px",
//                       cursor: "pointer",
//                       background: sel ? "#fdf4ff" : "#fff",
//                       transition: "all 0.15s",
//                     }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "flex-start",
//                         justifyContent: "space-between",
//                         gap: 12,
//                       }}
//                     >
//                       <div style={{ flex: 1 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             gap: 7,
//                             marginBottom: 6,
//                             flexWrap: "wrap",
//                           }}
//                         >
//                           <span
//                             style={{
//                               fontSize: 11,
//                               fontWeight: 700,
//                               padding: "2px 10px",
//                               borderRadius: 20,
//                               background: st.bg,
//                               color: st.color,
//                               border: `1px solid ${st.border}`,
//                             }}
//                           >
//                             {dpia.status || "PENDING"}
//                           </span>
//                           {dpia.overallRiskLevel && (
//                             <span
//                               style={{
//                                 fontSize: 11,
//                                 fontWeight: 700,
//                                 padding: "2px 10px",
//                                 borderRadius: 20,
//                                 background: rl.bg,
//                                 color: rl.color,
//                               }}
//                             >
//                               {dpia.overallRiskLevel} Risk
//                             </span>
//                           )}
//                         </div>
//                         <p
//                           style={{
//                             margin: 0,
//                             fontSize: 14,
//                             fontWeight: 700,
//                             color: "#1e293b",
//                           }}
//                         >
//                           {dpia.projectName || dpia.id}
//                         </p>
//                         <p
//                           style={{
//                             margin: "3px 0 0",
//                             fontSize: 12,
//                             color: "#94a3b8",
//                           }}
//                         >
//                           {dpia.organizationName || ""}
//                           {dpia.departmentId ? ` · ${dpia.departmentId}` : ""}
//                         </p>
//                       </div>
//                       {/* radio circle */}
//                       <div
//                         style={{
//                           width: 22,
//                           height: 22,
//                           borderRadius: "50%",
//                           flexShrink: 0,
//                           marginTop: 2,
//                           border: `2px solid ${sel ? "#7c3aed" : "#e2e8f0"}`,
//                           background: sel ? "#7c3aed" : "transparent",
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                         }}
//                       >
//                         {sel && (
//                           <div
//                             style={{
//                               width: 8,
//                               height: 8,
//                               borderRadius: "50%",
//                               background: "#fff",
//                             }}
//                           />
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* ── Step 2: department & assignee details ── */}
//         {step === 2 && selected && (
//           <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
//             {/* Selected pill */}
//             <div
//               style={{
//                 background: "#fdf4ff",
//                 border: "1px solid #e9d5ff",
//                 borderRadius: 12,
//                 padding: "12px 16px",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 12,
//               }}
//             >
//               <ShieldCheck size={20} color="#7c3aed" />
//               <div>
//                 <p
//                   style={{
//                     margin: 0,
//                     fontSize: 13,
//                     fontWeight: 700,
//                     color: "#5b21b6",
//                   }}
//                 >
//                   {selected.projectName || selected.id}
//                 </p>
//                 <p style={{ margin: 0, fontSize: 11, color: "#a78bfa" }}>
//                   {selected.status}
//                   {selected.overallRiskLevel
//                     ? ` · ${selected.overallRiskLevel} Risk`
//                     : ""}
//                 </p>
//               </div>
//             </div>

//             {/* Department first */}
//             <div>
//               <label style={labelStyle}>Department *</label>
//               <div style={{ position: "relative" }}>
//                 <select
//                   value={form.department}
//                   onChange={(e) => setField("department", e.target.value)}
//                   style={selectStyle}
//                 >
//                   <option value="">Select department...</option>
//                   {departments.map((d) => (
//                     <option key={d._id || d.id} value={d.name}>
//                       {d.name}
//                     </option>
//                   ))}
//                 </select>
//                 <ChevronDown
//                   size={14}
//                   color="#94a3b8"
//                   style={{
//                     position: "absolute",
//                     right: 12,
//                     top: 12,
//                     pointerEvents: "none",
//                   }}
//                 />
//               </div>
//               {form.department && (
//                 <p
//                   style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}
//                 >
//                   ✓ Showing {filteredRiskOwners.length} risk owner
//                   {filteredRiskOwners.length !== 1 ? "s" : ""} from{" "}
//                   {form.department}
//                   {filteredRiskOwners.length === 1 ? " — auto-selected" : ""}
//                 </p>
//               )}
//             </div>

//             {/* Risk Owner — filtered by department, auto-selected when only one */}
//             <div>
//               <label style={labelStyle}>
//                 Assign To (Risk Owner) *
//                 {form.department && (
//                   <span style={{ color: "#94a3b8", fontWeight: 500 }}>
//                     {" "}
//                     ({filteredRiskOwners.length} available)
//                   </span>
//                 )}
//               </label>
//               <div style={{ position: "relative" }}>
//                 <select
//                   value={form.assignedTo}
//                   onChange={(e) => setField("assignedTo", e.target.value)}
//                   disabled={!form.department || filteredRiskOwners.length === 0} // ✅ FIX
//                   style={{
//                     ...selectStyle,
//                     opacity:
//                       !form.department || filteredRiskOwners.length === 0
//                         ? 0.5
//                         : 1,
//                     cursor:
//                       !form.department || filteredRiskOwners.length === 0
//                         ? "not-allowed"
//                         : "pointer",

//                     // ✅ Highlight when auto-selected
//                     background:
//                       filteredRiskOwners.length === 1 ? "#fdf4ff" : undefined,
//                     borderColor:
//                       filteredRiskOwners.length === 1 ? "#c4b5fd" : undefined,
//                   }}
//                 >
//                   <option value="">
//                     {!form.department
//                       ? "Select department first..."
//                       : filteredRiskOwners.length === 0
//                         ? "No risk owners in this department"
//                         : "Select risk owner..."}
//                   </option>

//                   {filteredRiskOwners.map((u) => {
//                     let deptDisplay = "";
//                     if (u.department) {
//                       if (typeof u.department === "object") {
//                         deptDisplay =
//                           u.department.name || u.department._id || "";
//                       } else {
//                         deptDisplay = String(u.department);
//                       }
//                     }

//                     return (
//                       <option key={u._id || u.id} value={u._id || u.id}>
//                         {u.name}
//                         {deptDisplay ? ` — ${deptDisplay}` : ""}
//                       </option>
//                     );
//                   })}
//                 </select>
//                 <ChevronDown
//                   size={14}
//                   color="#94a3b8"
//                   style={{
//                     position: "absolute",
//                     right: 12,
//                     top: 12,
//                     pointerEvents: "none",
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Priority + Due Date */}
//             <div
//               style={{
//                 gridTemplateColumns: "1fr 1fr",
//               }}
//             >
//               {/* <div>
//                 <label style={labelStyle}>Priority</label>
//                 <div style={{ position: "relative" }}>
//                   <select
//                     value={form.priority}
//                     onChange={(e) => setField("priority", e.target.value)}
//                     style={selectStyle}
//                   >
//                     {["High", "Medium", "Low"].map((p) => (
//                       <option key={p}>{p}</option>
//                     ))}
//                   </select>
//                   <ChevronDown
//                     size={14}
//                     color="#94a3b8"
//                     style={{
//                       position: "absolute",
//                       right: 12,
//                       top: 12,
//                       pointerEvents: "none",
//                     }}
//                   />
//                 </div>
//               </div> */}
//               <div>
//                 <label style={labelStyle}>Due Date *</label>
//                 <input
//                   type="date"
//                   value={form.dueDate}
//                   onChange={(e) => setField("dueDate", e.target.value)}
//                   style={inputStyle}
//                 />
//               </div>
//             </div>

//             {/* Notes */}
//             <div>
//               <label style={labelStyle}>Notes / Instructions</label>
//               <textarea
//                 rows={3}
//                 value={form.notes}
//                 onChange={(e) => setField("notes", e.target.value)}
//                 placeholder="Any context or instructions for the risk owner..."
//                 style={{ ...inputStyle, resize: "none" }}
//               />
//             </div>

//             {error && (
//               <div
//                 style={{
//                   padding: "10px 14px",
//                   background: "#fef2f2",
//                   border: "1px solid #fecaca",
//                   borderRadius: 10,
//                   fontSize: 13,
//                   color: "#991b1b",
//                 }}
//               >
//                 {error}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* footer */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           padding: "16px 28px 24px",
//           borderTop: "1px solid #f1f5f9",
//           marginTop: 12,
//         }}
//       >
//         {step > 1 ? (
//           <button
//             onClick={() => {
//               setStep(1);
//               setForm({
//                 assignedTo: "",
//                 department: "",
//                 dueDate: "",
//                 notes: "",
//                 priority: "Medium",
//               });
//             }}
//             style={{
//               background: "none",
//               border: "none",
//               cursor: "pointer",
//               fontSize: 13,
//               fontWeight: 600,
//               color: "#64748b",
//               padding: "8px 16px",
//               borderRadius: 10,
//             }}
//           >
//             ← Back
//           </button>
//         ) : (
//           <div />
//         )}

//         {step === 1 ? (
//           <button
//             disabled={!selected}
//             onClick={() => {
//               setStep(2);
//               captureActivity({
//                 action: 'DPIA_ASSIGN_NAVIGATE_STEP_2',
//                 item: `Navigated to Set Department & Assignee for DPIA Assessment ID: ${selected?.id}`,
//                 url: window.pathname,
//                 dpiaId: selected?.id
//               });
//             }}
//             style={{
//               ...btnPrimary,
//               background: selected ? "#7c3aed" : "#94a3b8",
//               cursor: selected ? "pointer" : "not-allowed",
//             }}
//           >
//             Next: Set Department & Assignee →
//           </button>
//         ) : (
//           <button
//             onClick={handleAssign}
//             disabled={saving || !canAssign}
//             style={{
//               ...btnPrimary,
//               background: saving || !canAssign ? "#94a3b8" : "#7c3aed",
//               cursor: saving || !canAssign ? "not-allowed" : "pointer",
//               display: "flex",
//               alignItems: "center",
//               gap: 7,
//             }}
//           >
//             {saving ? <RefreshCw size={14} /> : <Save size={14} />}
//             {saving ? "Assigning..." : "Assign DPIA"}
//           </button>
//         )}
//       </div>
//     </Modal>
//   );
// }

// export default AssignDpiaModal;











// C:\Users\ak192\Downloads\cf-tool-frontend-prod (6)\cf-tool-frontend-prod\src\modules\dpia\components\AssignDpiaModal.js

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X, ShieldCheck, Plus, Save, RefreshCw,
  ChevronDown, User, Calendar, FileText, Search,
} from "lucide-react";
import { getSessionUser } from "../utils/helpers";
import * as dpiaApi from "../services/dpiaApi";
import { useRouter } from "next/navigation";
import { captureActivity, ACTIONS } from "../../../services/activities";

/* ─── constants ──────────────────────────────────────────────────────────── */
const NAVBAR_HEIGHT = 72;
const MODAL_GAP = 32;

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function statusStyle(status) {
  if (!status) return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
  const s = status.toUpperCase();
  if (s === "SUBMITTED") return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
  if (s === "APPROVED") return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
  return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
}

function riskStyle(level) {
  if (!level) return { bg: "#f1f5f9", color: "#64748b" };
  const l = level.toUpperCase();
  if (l === "HIGH") return { bg: "#fee2e2", color: "#991b1b" };
  if (l === "MEDIUM") return { bg: "#fef3c7", color: "#92400e" };
  if (l === "LOW") return { bg: "#d1fae5", color: "#065f46" };
  return { bg: "#f1f5f9", color: "#64748b" };
}

/* ─── component ──────────────────────────────────────────────────────────── */
export function AssignDpiaModal({ onClose, onSaved, riskOwners = [], departments = [] }) {
  const sessionUser = getSessionUser();

  const [dpias, setDpias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    assignedTo: "", department: "", dueDate: "", notes: "", priority: "Medium",
  });

  /* ── load ── */
  useEffect(() => {
    const orgId = sessionUser.organization || sessionUser.organizationId || "";
    captureActivity({ action: "DPIA_PLAN_MODAL_OPENED", item: "Opened Plan DPIA Modal", url: window.pathname });
    dpiaApi
      .getAllAssessments(orgId)
      .then(data => { setDpias(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const setField = (k, v) => {
    setForm(p => {
      const next = { ...p, [k]: v };
      if (k === "department") next.assignedTo = "";
      return next;
    });
  };

  /* ── filtered vendors by department ── */
  const filteredRiskOwners = form.department
    ? riskOwners.filter(owner => {
      const ownerDepts = Array.isArray(owner.department)
        ? owner.department
        : owner.department ? [owner.department] : [];
      if (ownerDepts.length === 0) return false;
      const selectedDeptObj = departments.find(d => d.name === form.department);
      const selectedDeptId = selectedDeptObj?._id || selectedDeptObj?.id || "";
      const selectedDeptName = form.department;
      return ownerDepts.some(dept => {
        const deptStr = String(dept || "").trim().toLowerCase();
        return deptStr === selectedDeptId.toLowerCase() || deptStr === selectedDeptName.toLowerCase();
      });
    })
    : riskOwners;

  /* auto-select single vendor */
  useEffect(() => {
    if (filteredRiskOwners.length === 1) {
      setForm(p => ({ ...p, assignedTo: String(filteredRiskOwners[0]._id || filteredRiskOwners[0].id) }));
    } else if (filteredRiskOwners.length === 0) {
      setForm(p => ({ ...p, assignedTo: "" }));
    }
  }, [form.department]);

  /* ── filtered dpia list ── */
  const filteredDpias = dpias.filter(d => {
    const q = search.toLowerCase();
    return (
      (d.projectName || d.id || "").toLowerCase().includes(q) ||
      (d.status || "").toLowerCase().includes(q)
    );
  });

  /* ── assign ── */
  const handleAssign = async () => {
    if (!selected || !form.assignedTo || !form.department || !form.dueDate) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const owner = riskOwners.find(u => String(u._id || u.id) === form.assignedTo);
      if (form.department) await dpiaApi.updateDepartments(selected.id, [form.department]);
      await dpiaApi.assignDpia({
        dpiaId: selected.id,
        projectName: selected.projectName || selected.id,
        assignedTo: form.assignedTo,
        assignedToName: owner ? owner.name : form.assignedTo,
        department: form.department,
        dueDate: form.dueDate,
        notes: form.notes,
        priority: form.priority,
        assignedBy: sessionUser.id || sessionUser._id || "",
        assignedByName: sessionUser.name || "",
        organizationId: sessionUser.organization || sessionUser.organizationId || "",
        status: "PENDING",
      });
      captureActivity({
        action: ACTIONS.CREATE,
        item: `DPIA · Assigned Assessment ID: ${selected.id} to ${owner ? owner.name : form.assignedTo}`,
        url: window.pathname,
        payload: { ...form, dpiaId: selected.id },
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign DPIA");
      setSaving(false);
    }
  };

  const canAssign = form.assignedTo && form.dueDate && form.department;

  /* ── render ── */
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
      style={{ paddingTop: NAVBAR_HEIGHT + MODAL_GAP, paddingBottom: MODAL_GAP }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto flex flex-col"
        style={{ maxHeight: `calc(100vh - ${NAVBAR_HEIGHT + MODAL_GAP * 2}px)` }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg, #9f7aea, #7c3aed)" }}>
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Plan DPIA</h2>
              <p className="text-xs text-slate-500">
                {step === 1 ? "Step 1 — Select Assessment" : "Step 2 — Set Details"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                onClick={async () => {
                  try {
                    setCreating(true);
                    const newDpia = await dpiaApi.createAssessment(
                      "", sessionUser.organization || sessionUser.organizationId || "",
                    );
                    setDpias(prev => [newDpia, ...prev]);
                    setSelected(newDpia);
                    captureActivity({ action: ACTIONS.CREATE, item: `DPIA · Created New DPIA Assessment: ${newDpia.id}`, url: window.pathname });
                    setStep(2);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors shadow"
                style={{ background: "#7c3aed", color: "#fff" }}
              >
                {creating ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                {creating ? "Creating..." : "New DPIA"}
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => { setStep(1); setForm({ assignedTo: "", department: "", dueDate: "", notes: "", priority: "Medium" }); }}
                className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                ← Back to List
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* ── Step tabs ── */}
        <div className="flex gap-2 px-6 pt-5 pb-0 flex-shrink-0">
          {["Select Assessment", "Set Details"].map((label, i) => (
            <button
              key={i}
              onClick={() => i === 0 && setStep(1)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={step === i + 1
                ? { background: "#7c3aed", color: "#fff" }
                : { background: "#f1f5f9", color: "#64748b" }
              }
            >
              <span
                className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                style={step === i + 1
                  ? { background: "#fff", color: "#7c3aed" }
                  : { background: "#cbd5e1", color: "#fff" }
                }
              >
                {i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ────── Step 1: Select Assessment ────── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-slate-50"
                  style={{ "--tw-ring-color": "#7c3aed33" }}
                />
              </div>

              {/* list — min-h so modal doesn't collapse */}
              <div className="min-h-[320px] space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }} />
                  </div>
                ) : filteredDpias.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48">
                    <ShieldCheck size={36} className="text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No DPIA assessments found</p>
                    <p className="text-slate-400 text-sm mt-1">Complete a DPIA or click "New DPIA" to create one.</p>
                  </div>
                ) : (
                  filteredDpias.map((dpia, i) => {
                    const st = statusStyle(dpia.status);
                    const rl = riskStyle(dpia.overallRiskLevel);
                    const sel = selected?.id === dpia.id;
                    return (
                      <motion.div
                        key={dpia.id}
                        onClick={() => setSelected(dpia)}
                        className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all"
                        style={{
                          borderColor: sel ? "#7c3aed" : "#f1f5f9",
                          background: sel ? "#fdf4ff" : "#fff",
                        }}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        {/* radio */}
                        <div className="w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center"
                          style={{ borderColor: sel ? "#7c3aed" : "#e2e8f0", background: sel ? "#7c3aed" : "transparent" }}>
                          {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
                              style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                              {dpia.status || "PENDING"}
                            </span>
                            {dpia.overallRiskLevel && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: rl.bg, color: rl.color }}>
                                {dpia.overallRiskLevel} Risk
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-800 truncate">{dpia.projectName || dpia.id}</p>
                          {dpia.organizationName && (
                            <p className="text-xs text-slate-400 mt-0.5">{dpia.organizationName}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* footer action */}
              <div className="flex justify-end pt-2">
                <button
                  disabled={!selected}
                  onClick={() => {
                    setStep(2);
                    captureActivity({
                      action: "DPIA_ASSIGN_NAVIGATE_STEP_2",
                      item: `Navigated to Set Details for DPIA Assessment ID: ${selected?.id}`,
                      url: window.pathname,
                      dpiaId: selected?.id,
                    });
                  }}
                  className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl shadow transition-all"
                  style={{ background: selected ? "#7c3aed" : "#94a3b8", cursor: selected ? "pointer" : "not-allowed" }}
                >
                  Next: Set Details →
                </button>
              </div>
            </div>
          )}

          {/* ────── Step 2: Set Details ────── */}
          {step === 2 && selected && (
            <div className="space-y-4 max-w-lg">
              {/* selected pill */}
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                style={{ background: "#fdf4ff", borderColor: "#e9d5ff" }}>
                <ShieldCheck size={18} style={{ color: "#7c3aed" }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: "#5b21b6" }}>{selected.projectName || selected.id}</p>
                  <p className="text-xs" style={{ color: "#a78bfa" }}>{selected.status}{selected.overallRiskLevel ? ` · ${selected.overallRiskLevel} Risk` : ""}</p>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <FileText size={12} /> Department *
                </label>
                <div className="relative">
                  <select
                    value={form.department}
                    onChange={e => setField("department", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none appearance-none bg-white pr-9"
                    style={{ "--tw-ring-color": "#7c3aed33" }}
                  >
                    <option value="">Select department...</option>
                    {departments.map(d => (
                      <option key={d._id || d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {form.department && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Showing {filteredRiskOwners.length} risk owner{filteredRiskOwners.length !== 1 ? "s" : ""} from {form.department}
                    {filteredRiskOwners.length === 1 ? " — auto-selected" : ""}
                  </p>
                )}
              </div>

              {/* Assign to */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <User size={12} /> Assign To (Risk Owner) *
                </label>
                <div className="relative">
                  <select
                    value={form.assignedTo}
                    onChange={e => setField("assignedTo", e.target.value)}
                    disabled={!form.department || filteredRiskOwners.length === 0}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none appearance-none bg-white pr-9"
                    style={{
                      opacity: (!form.department || filteredRiskOwners.length === 0) ? 0.5 : 1,
                      background: filteredRiskOwners.length === 1 ? "#fdf4ff" : undefined,
                      borderColor: filteredRiskOwners.length === 1 ? "#c4b5fd" : undefined,
                    }}
                  >
                    <option value="">
                      {!form.department
                        ? "Select department first..."
                        : filteredRiskOwners.length === 0
                          ? "No risk owners in this department"
                          : "Select risk owner..."}
                    </option>
                    {filteredRiskOwners.map(u => (
                      <option key={u._id || u.id} value={u._id || u.id}>{u.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Due date */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={12} /> Due Date *
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setField("dueDate", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Notes / Instructions</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setField("notes", e.target.value)}
                  placeholder="Any context or instructions for the risk owner..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

              <button
                onClick={handleAssign}
                disabled={saving || !canAssign}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-white text-sm font-semibold rounded-xl shadow transition-all"
                style={{ background: saving || !canAssign ? "#94a3b8" : "#7c3aed", cursor: saving || !canAssign ? "not-allowed" : "pointer" }}
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Assigning..." : "Assign DPIA"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default AssignDpiaModal;