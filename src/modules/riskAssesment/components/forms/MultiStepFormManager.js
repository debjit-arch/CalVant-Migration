import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import RiskDetailsForm from "./RiskDetailsForm";
import TreatmentPlanForm from "./TreatmentPlanForm";
import ResidualRiskForm from "./ResidualRiskForm";
import riskService from "../../services/riskService";
import TaskManagement from "../../pages/TaskManagement";
import Modal from "../../../../components/navigations/Modal";
import { captureActivity, ACTIONS } from "../../../../services/activities";

import { useFramework } from "../../../../context/FrameworkContex";

const multiStepStyles = `
  .msf-wrapper {
    max-width: 1120px;
    margin: 0 auto;
    padding: 16px 16px 80px 16px;
    min-height: 70vh;
    box-sizing: border-box;
  }

  .msf-layout {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 16px;
    align-items: flex-start;
  }

  .msf-stepper {
    position: sticky;
    top: 90px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    z-index: 1;
  }

  .msf-step {
    display: flex;
    align-items: center;
  }

  .msf-step-circle {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .msf-step-label {
    margin-left: 8px;
    font-size: 13px;
    font-weight: 500;
  }

  .msf-main {
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
    border: 1px solid #e9ecef;
  }

  .msf-nav {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 100;
    background: transparent;
  }

  .msf-btn {
    padding: 10px 20px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 600;
    min-width: 110px;
    border: none;
    cursor: pointer;
  }

  .msf-btn--prev {
    background-color: #ffffff;
    color: #7f8c8d;
    border: 1px solid #ecf0f1;
  }

  .msf-btn--save {
    background: linear-gradient(45deg,#6c5ce7,#0984e3);
    color: #ffffff;
  }

  .msf-btn--save:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }

  .msf-btn--next {
    background-color: #3498db;
    color: #ffffff;
  }

  .msf-btn--next:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }

  .msf-btn--submit {
    background: linear-gradient(45deg,#27ae60,#2ecc71);
    color: #ffffff;
  }

  .msf-btn--submit-edit {
    background: linear-gradient(45deg,#e67e22,#f39c12);
    color: #ffffff;
  }

  @media (max-width: 768px) {
    .msf-wrapper { padding: 12px 10px 90px 10px; }
    .msf-layout { grid-template-columns: 1fr; }
    .msf-stepper {
      position: static;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .msf-step-label { display: none; }
    .msf-main { margin: 0; padding: 16px 12px; }
    .msf-nav {
      bottom: 8px; left: 0; right: 0;
      transform: none; justify-content: center;
      padding: 8px 10px; background: rgba(255,255,255,0.9);
      backdrop-filter: blur(6px); box-sizing: border-box;
    }
    .msf-btn { flex: 1; min-width: 0; font-size: 13px; padding: 8px 10px; }
  }

  @media (min-width: 1200px) { .msf-wrapper { max-width: 1280px; } }
`;

const MultiStepFormManager = ({ onSubmit, focusArea = "risk" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedFrameworks, isAllSelected } = useFramework();

  const searchParams = useSearchParams();
  const existingRiskId = searchParams.get("editRiskId");
  const isEditing = !!existingRiskId;

  const [modal, setModal] = useState({ isOpen: false, title: "", message: "" });

  const showModal = (title, message) =>
    setModal({ isOpen: true, title, message });
  const closeModal = () => setModal((m) => ({ ...m, isOpen: false }));

  const [departments, setDepartments] = useState([]);

  // 1. Normalize User Data
  const [user] = useState(() => JSON.parse(sessionStorage.getItem("user")));
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
  const isRoot = user?.role?.some((r) => {
    const s = (typeof r === "string" ? r : r?.name || r?.roleName || "")
      .toLowerCase()
      .replace(/[\s_-]/g, "");

    return ["root", "ciso", "aio", "dpo"].some((role) => s.includes(role));
  });
  const isRiskIdentifier = userRoles.includes("risk_manager") && !isRoot;

  const [tasks, setTasks] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    riskId: "",
    department: "",
    date: "",
    riskType: [],
    assetType: "",
    asset: "",
    riskDescription: "",
    confidentiality: "",
    threat: [],
    vulnerability: [],
    integrity: "",
    availability: "",
    impact: "",
    probability: "",
    existingControls: "",
    additionalNotes: "",
    controlReference: [],
    additionalControls: "",
    numberOfDays: "",
    deadlineDate: "",
    status: "Open",
    organization: user?.organization?._id || user?.organization,
  });

  // Load Departments
  useEffect(() => {
    async function loadDepartments() {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SP}/user-service/api/departments`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        const userOrgId = user?.organization?._id || user?.organization;

        const filtered = Array.isArray(data)
          ? data.filter((dept) => {
              const deptOrgId = dept.organization?._id || dept.organization;
              return String(deptOrgId) === String(userOrgId);
            })
          : [];
        setDepartments(filtered);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    }
    if (user) loadDepartments();
  }, [user]);

  const [existingRiskIds, setExistingRiskIds] = useState([]);

  // Load Risks and Initial Data
  useEffect(() => {
    async function loadRisks() {
      const allRisks = await riskService.getAllRisks();
      const userOrgId = user?.organization?._id || user?.organization;

      const orgRiskIds = allRisks
        .filter((risk) => {
          const riskOrgId = risk.organization?._id || risk.organization;
          return String(riskOrgId) === String(userOrgId);
        })
        .map((risk) => risk.riskId);

      setExistingRiskIds(orgRiskIds);

      if (isEditing && existingRiskId) {
        const existingRisk = await riskService.getRiskById(
          existingRiskId,
          user.organization,
        );
        if (existingRisk) setFormData(existingRisk);
      } else if (!formData.riskId) {
        generateRiskId(orgRiskIds);
      }
    }
    if (user) loadRisks();
  }, [isEditing, existingRiskId, user]);

  const generateRiskId = (excludeIds = []) => {
    const currentYear = new Date().getFullYear();
    let nextNumber = 1;
    let newRiskId = "";
    const riskIdsToCheck = excludeIds.length > 0 ? excludeIds : existingRiskIds;

    do {
      const paddedNumber = nextNumber.toString().padStart(3, "0");
      newRiskId = `RR-${currentYear}-${paddedNumber}`;
      nextNumber++;
    } while (riskIdsToCheck.includes(newRiskId));

    setFormData((prev) => ({ ...prev, riskId: newRiskId }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isStep1Valid = () => {
    const duplicateCheck = isEditing
      ? existingRiskIds
          .filter((id) => id !== existingRiskId)
          .includes(formData.riskId)
      : existingRiskIds.includes(formData.riskId);

    return (
      formData.riskId &&
      formData.department &&
      formData.date &&
      formData.riskType &&
      formData.assetType &&
      formData.riskDescription &&
      formData.confidentiality &&
      formData.integrity &&
      formData.availability &&
      formData.probability &&
      !duplicateCheck
    );
  };

  const isStep2Valid = () => {
    const treatmentValid =
      formData.controlReference?.length > 0 && formData.additionalControls;
    const residualValid =
      formData.numberOfDays && parseInt(formData.numberOfDays) > 0;
    return treatmentValid && residualValid;
  };

  const isStep3Valid = () => {
    const tasksForThisRisk = tasks.filter((t) => t.riskId === formData.riskId);
    return tasksForThisRisk.length > 0;
  };

  const handleNext = () => {
    // Check if user has "risk_identifier" role and prevent progression if logic requires it
    if (isRiskIdentifier && currentStep >= 1) {
      showModal(
        "⛔ Access Restricted",
        "Risk Identifiers can save drafts but cannot proceed to Treatment/Tasks.",
      );
      return;
    }
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      const stepNames = [
        "Risk Assessment",
        "Treatment Planning",
        "Task Management",
      ];
      captureActivity({
        action: ACTIONS.SELECT,
        url: window.location.pathname,
        item: [
          {
            step: nextStep,
            stepName: stepNames[nextStep - 1],
            riskId: formData.riskId,
            from: stepNames[currentStep - 1],
          },
        ],
      });
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSave = async () => {
    try {
      const savedRisk = await riskService.saveRisk(formData);
      const modalData = getModalMessageByStep(currentStep, isEditing);
      showModal(modalData.title, modalData.message);
      // Log step-save activity
      const stepNames = [
        "Risk Assessment Details",
        "Treatment Plan",
        "Task Management",
      ];
      captureActivity({
        action: isEditing ? ACTIONS.UPDATE : ACTIONS.CREATE,
        url: window.location.pathname,
        item: [
          {
            riskId: formData.riskId,
            stepSaved: stepNames[currentStep - 1],
            department: formData.department,
            status: formData.status,
          },
        ],
      });
      if (onSubmit) onSubmit(savedRisk);
    } catch (error) {
      console.error("Error saving draft:", error);
      showModal("❌ Error", "Error saving draft. Please try again.");
    }
  };

  const getModalMessageByStep = (step, isEdit = false) => {
    const status = isEdit ? "Updated" : "Saved";
    switch (step) {
      case 1:
        return {
          title: `Step 1 ${status}!`,
          message: "Risk details saved. Click next for Treatment.",
        };
      case 2:
        return {
          title: `Treatment ${status}!`,
          message: "Risk treatment plan saved. Click next for Task Management.",
        };
      case 3:
        return {
          title: `Tasks ${status}!`,
          message: "Tasks for this risk have been saved.",
        };
      default:
        return { title: "Saved!", message: "Your progress has been saved." };
    }
  };

  const handleSubmit = async () => {
    try {
      const savedRisk = await riskService.saveRisk(formData);
      showModal(
        isEditing
          ? "🎉 Risk Assessment Updated!"
          : "🎉 Risk Assessment Created!",
        "You will be redirected shortly.",
      );
      // Log final submission
      captureActivity({
        action: isEditing ? ACTIONS.UPDATE : ACTIONS.CREATE,
        url: window.location.pathname,
        item: [
          {
            riskId: formData.riskId,
            department: formData.department,
            riskType: (formData.riskType || []).join(", "),
            status: formData.status,
            action: isEditing ? "Full Risk Updated" : "New Risk Submitted",
          },
        ],
      });
      if (onSubmit) onSubmit(savedRisk);
      setTimeout(() => router.push("/risk-assessment/saved"), 1500);
    } catch (error) {
      console.error("Error saving risk:", error);
      showModal("❌ Error", "Error saving risk assessment. Please try again.");
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RiskDetailsForm
            formData={formData}
            handleInputChange={handleInputChange}
            generateRiskId={() => generateRiskId()}
            existingRiskIds={existingRiskIds}
            isEditing={isEditing}
            originalRiskId={existingRiskId}
            departments={departments}
          />
        );
      case 2:
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <div
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <TreatmentPlanForm
                formData={formData}
                handleInputChange={handleInputChange}
                selectedFrameworks={selectedFrameworks}
                isAllSelected={isAllSelected}
              />
              <ResidualRiskForm
                formData={formData}
                handleInputChange={handleInputChange}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <>
            <h4 style={{ marginBottom: "10px", color: "#2c3e50" }}>
              📋 Task Management
            </h4>
            <TaskManagement
              riskFormData={formData}
              tasks={tasks}
              setTasks={setTasks}
            />
          </>
        );
      default:
        return null;
    }
  };

  const getStepLabel = (step) =>
    ["Risk Assessment", "Treatment Planning", "Task Management"][step - 1];

  const getNextButtonDisabled = () => {
    if (currentStep === 1) return !isStep1Valid();
    if (currentStep === 2) return !isStep2Valid();
    if (currentStep === 3) return !isStep3Valid();
    return false;
  };

  return (
    <div className="msf-wrapper">
      <style>{multiStepStyles}</style>
      <div className="msf-layout">
        <div className="msf-stepper">
          {[1, 2, 3].map((step) => (
            <div key={step} className="msf-step">
              <div
                className="msf-step-circle"
                style={{
                  backgroundColor:
                    currentStep === step
                      ? "#2980b9"
                      : currentStep > step
                        ? "#3498db"
                        : "#ecf0f1",
                  color: currentStep >= step ? "#ffffff" : "#7f8c8d",
                  transform: currentStep === step ? "scale(1.15)" : "scale(1)",
                  boxShadow:
                    currentStep >= step
                      ? "0 2px 8px rgba(52,152,219,0.3)"
                      : "none",
                }}
              >
                {step}
              </div>
              <span
                className="msf-step-label"
                style={{
                  fontWeight: currentStep === step ? 600 : 500,
                  color: currentStep >= step ? "#3498db" : "#7f8c8d",
                }}
              >
                {getStepLabel(step)}
              </span>
            </div>
          ))}
        </div>
        <div className="msf-main">{renderCurrentStep()}</div>
      </div>

      <div className="msf-nav">
        {currentStep > 1 && (
          <button onClick={handlePrevious} className="msf-btn msf-btn--prev">
            ← Previous
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={getNextButtonDisabled()}
          className="msf-btn msf-btn--save"
        >
          Save
        </button>
        {currentStep < 3 && (
          <button
            onClick={handleNext}
            disabled={getNextButtonDisabled()}
            className="msf-btn msf-btn--next"
          >
            Next →
          </button>
        )}
        {currentStep === 3 && (
          <button
            onClick={handleSubmit}
            className={`msf-btn ${isEditing ? "msf-btn--submit-edit" : "msf-btn--submit"}`}
          >
            {isEditing ? "Save & Finish" : "Submit"}
          </button>
        )}
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </div>
  );
};

export default MultiStepFormManager;
