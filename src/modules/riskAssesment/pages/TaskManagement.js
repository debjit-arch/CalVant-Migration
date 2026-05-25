//C:\Users\ak192\Downloads\CV_Beta_v1.0.0-Calvant_migration\CV_Beta_v1.0.0-Calvant_migration\src\modules\riskAssesment\pages\TaskManagement.js

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import InputField from "../components/inputs/InputField";
import SelectField from "../components/inputs/SelectField";
import TextAreaField from "../components/inputs/TextAreaField";
import taskService from "../services/taskService";
import riskService from "../services/riskService";
import {
  getAllUsers,
  getDepartments,
} from "../../departments/services/userService";

export default function RiskTaskManagement({ riskFormData = {} }) {
  const router   = useRouter();
  const pathname = usePathname();
  const rawUser  =
    typeof window !== "undefined"
      ? sessionStorage.getItem("user")
      : null;
  const user     = rawUser ? JSON.parse(rawUser) : null;
  const today    = new Date().toISOString().split("T")[0];

  // ✅ FIX 1: always derive roles as array
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
  const hasAnyRole = (...allowedRoles) =>
    allowedRoles.some((role) => userRoles.includes(role));

  // ✅ FIX 2: stable org ID
  const orgId = user?.organization?._id || user?.organization || "";

  const [tasks,      setTasks]      = useState([]);
  const [risks,      setRisks]      = useState([]);
  const [riskOptions,setRiskOptions]= useState([]);
  const [departments,setDepartments]= useState([]);
  const [users,      setUsers]      = useState([]);
  const [isModalOpen,setIsModalOpen]= useState(false);
  const [activeTaskId,setActiveTaskId]= useState(null);
  const [editingTaskId,setEditingTaskId]= useState(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);

  // ✅ FIX 3: ref for modal scroll preservation
  const modalScrollRef = useRef(null);

  const emptyForm = useCallback(() => ({
    riskId:       riskFormData.riskId || "",
    organization: orgId,
    department:   "",
    employee:     "",
    employeeName: "",
    employeeId:   "",
    description:  "",
    startDate:    today,
    endDate:      "",
    priority:     "Medium",
  }), [riskFormData.riskId, orgId, today]);

  const [formData, setFormData] = useState(emptyForm);

  const STATUS = {
    PENDING:           "Pending",
    COMPLETED_PENDING: "Completed (Pending Approval)",
    APPROVED:          "Approved",
  };

  const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
  const PRIORITY_CONFIG  = {
    Low:      { color: "#2f9e44", bg: "#ebfbee", border: "#2f9e44" },
    Medium:   { color: "#f59f00", bg: "#fff9db", border: "#f59f00" },
    High:     { color: "#e8590c", bg: "#fff4e6", border: "#e8590c" },
    Critical: { color: "#c92a2a", bg: "#fff5f5", border: "#c92a2a" },
  };

  // ── Fetch Departments ──────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getDepartments()
      .then((d) => {
        if (!mounted) return;
        setDepartments(
          Array.isArray(d)
            ? d.filter((dept) =>
                String(dept.organization) === String(orgId)
              )
            : []
        );
      })
      .catch(console.error)
      .finally(() => mounted && setIsLoading(false));
    return () => { mounted = false; };
  }, [orgId]);

  // ── Fetch Users ────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    getAllUsers()
      .then((res) => {
        if (!mounted) return;
        setUsers(
          Array.isArray(res)
            ? res.filter((u) =>
                String(u.organization?._id || u.organization) === String(orgId)
              )
            : []
        );
      })
      .catch((err) => { console.error(err); setUsers([]); });
    return () => { mounted = false; };
  }, [orgId]);

  // ── Fetch Risks ────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetchRisks = async () => {
      try {
        const risksData = await riskService.getAllRisks();
        const allRisks  = Array.isArray(risksData)
          ? risksData.filter((r) =>
              String(r.organization?._id || r.organization) === String(orgId)
            )
          : [];
        if (!mounted) return;
        setRisks(allRisks);
        if (!user) return setRiskOptions([]);

        // ✅ FIX 4: check roles array not scalar
        if (hasAnyRole("risk_manager", "root", "super_admin" , "aio" , "ciso" , "dpo")) {
          setRiskOptions(allRisks.map((r) => ({ value: r.riskId, label: r.riskId })));
        } else {
          const deptList = await getDepartments();
          const userDept = (Array.isArray(deptList) ? deptList : []).find(
            (d) => String(d._id) === String(user.department?._id || user.department)
          );
          if (!userDept) return setRiskOptions([]);
          const deptRisks = allRisks.filter((r) => r.department === userDept.name);
          setRiskOptions(deptRisks.map((r) => ({ value: r.riskId, label: r.riskId })));
        }
      } catch (err) {
        console.error(err);
        setRisks([]);
        setRiskOptions([]);
      }
    };
    fetchRisks();
    return () => { mounted = false; };
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch Tasks ────────────────────────────────────────────────────────────
  // ✅ FIX 5: useCallback so it can be safely called anywhere
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await taskService.getAllTasks();
      const filtered = riskFormData.riskId
        ? fetchedTasks.filter(
            (t) =>
              t.riskId === riskFormData.riskId &&
              String(t.organization?._id || t.organization) === String(orgId)
          )
        : fetchedTasks.filter(
            (t) => String(t.organization?._id || t.organization) === String(orgId)
          );
      setTasks(filtered);
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [riskFormData.riskId, orgId]); // ✅ FIX 6: correct deps

  useEffect(() => {
    if (orgId) fetchTasks();
  }, [fetchTasks, orgId]);

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (!name) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ FIX 7: preserve modal scroll on dept change
  const handleDeptChange = (e) => {
    const { name, value } = e.target;
    const scrollTop = modalScrollRef.current?.scrollTop ?? 0;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      employee:     "",
      employeeName: "",
      employeeId:   "",
    }));

    requestAnimationFrame(() => {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = scrollTop;
      }
    });
  };

  const handleEmployeeChange = (e) => {
    const selectedName = e.target.value;
    const selectedUser = users.find((u) => u.name === selectedName);
    setFormData((prev) => ({
      ...prev,
      employee:     selectedName,
      employeeName: selectedName,
      employeeId:   selectedUser?._id || selectedUser?.id || "",
    }));
  };

  const empOptions = useMemo(() => {
    const selectedDeptObj = departments.find((d) => d.name === formData.department);
    const selectedDeptId  = selectedDeptObj?._id || selectedDeptObj?.id;
    if (!selectedDeptId) return [];
    return users
      .filter((u) => {
        if (!u.department) return false;
        if (Array.isArray(u.department))
          return u.department.some((dept) => String(dept) === String(selectedDeptId));
        return String(u.department) === String(selectedDeptId);
      })
      .map((u) => ({ value: u.name, label: u.name }));
  }, [users, departments, formData.department]);

  // ── Save Task ──────────────────────────────────────────────────────────────
  const saveTask = async () => {
    if (!formData.riskId || !formData.department || !formData.startDate || !formData.endDate) {
      alert("Please fill all required fields!");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert("End date cannot be before start date.");
      return;
    }

    const relatedRisk = risks.find((r) => r.riskId === formData.riskId);
    if (
      relatedRisk &&
      (formData.startDate < relatedRisk.startDate ||
        formData.endDate   > relatedRisk.endDate)
    ) {
      alert(
        `Task dates must be within the risk period (${relatedRisk.startDate} → ${relatedRisk.endDate})`
      );
      return;
    }

    let employeeName = formData.employee   || "";
    let employeeId   = formData.employeeId || "";

    // Auto-assign to dept risk_owner if no employee selected
    if (!employeeName && formData.department) {
      const deptObj = departments.find((d) => d.name === formData.department);
      const deptId  = deptObj?._id || deptObj?.id;
      const deptRiskOwner = users.find((u) => {
        const uDepts = Array.isArray(u.department) ? u.department : [u.department];
        const uRoles = Array.isArray(u.role)       ? u.role       : [u.role];
        return (
          uDepts.some((d) => String(d) === String(deptId)) &&
          uRoles.includes("risk_owner")
        );
      });
      if (deptRiskOwner) {
        employeeName = deptRiskOwner.name;
        employeeId   = deptRiskOwner._id || deptRiskOwner.id || "";
      }
    }

    // Reporter info
    const reporterUser = users.find((u) => u.name === (user?.name || ""));
    const reporterId   = reporterUser?._id || reporterUser?.id || "";

    setIsSaving(true);
    try {
      if (editingTaskId) {
        await taskService.updateTask(
          editingTaskId,
          { ...formData, employee: employeeName, employeeId: employeeId || null, taskId: editingTaskId },
          user?.name || "System"
        );
      } else {
        const assigneeUser = users.find((u) => u.name === employeeName);
        await taskService.saveTask(
          {
            ...formData,
            employee:      employeeName,
            employeeId:    employeeId    || null,
            employeeName:  employeeName,
            employeeEmail: assigneeUser?.email || "",
            organization:  orgId,
            status:        STATUS.PENDING,
            reporter:      user?.name  || "",
            reporterId:    reporterId  || null,
            reporterEmail: user?.email || "",
          },
          user?.name || "System"
        );
      }
      await fetchTasks();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${editingTaskId ? "update" : "add"} task.`);
      return;
    } finally {
      setIsSaving(false);
    }

    setFormData(emptyForm());
    setIsModalOpen(false);
    setEditingTaskId(null);
  };

  // ── Delete Task ────────────────────────────────────────────────────────────
  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskService.deleteTask(taskId);
      await fetchTasks();
      if (activeTaskId === taskId) setActiveTaskId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete task.");
    }
  };

  // ── Mark Complete / Approve ────────────────────────────────────────────────
  const markTaskComplete = async (taskId) => {
    const taskToUpdate = tasks.find((t) => t.taskId === taskId);
    if (!taskToUpdate) return;
    // ✅ FIX 8: use hasAnyRole helper (works with array roles)
    const updatedTask = {
      ...taskToUpdate,
      status: hasAnyRole("risk_manager", "risk_owner", "root", "super_admin"  ,"aio" , "ciso" , "dpo")
        ? STATUS.APPROVED
        : STATUS.COMPLETED_PENDING,
    };
    try {
      await taskService.updateTask(taskId, updatedTask);
      await fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Failed to update task status.");
    }
  };

  // ── Edit Handler ───────────────────────────────────────────────────────────
  // ✅ FIX 9: include organization in edit form
  const editTask = (task) => {
    const matchedUser = users.find((u) => u.name === task.employee);
    setFormData({
      riskId:       task.riskId       || "",
      organization: orgId,
      department:   task.department   || "",
      employee:     task.employee     || "",
      employeeName: task.employeeName || task.employee || "",
      employeeId:   task.employeeId   || matchedUser?._id || matchedUser?.id || "",
      description:  task.description  || "",
      startDate:    task.startDate    || today,
      endDate:      task.endDate      || "",
      priority:     task.priority     || "Medium",
    });
    setEditingTaskId(task.taskId);
    setIsModalOpen(true);
  };

  // ✅ FIX 10: "Mark Complete" button — compare employee ID to user ID correctly
  const canMarkComplete = (task) => {
    if (task.status !== STATUS.PENDING) return false;
    const userId = user?._id || user?.id || "";
    return (
      String(task.employeeId) === String(userId) ||
      String(task.employee)   === String(user?.name)
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}-${month}-${year}`;
  };

  const buttonStyle = {
    minWidth: "50px",
    padding: "4px 8px",
    borderRadius: "5px",
    border: "none",
    fontSize: "13px",
    color: "#fff",
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1000px", margin: "auto" }}>
      <h2 style={{ textAlign: "center", fontWeight: 500, color: "#000" }}>
        Action Plan
      </h2>
      <p style={{ textAlign: "center", color: "#7f8c8d", fontSize: "16px", marginBottom: "15px" }}>
        Tasks to treat identified Risks.
      </p>

      {/* Task list */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
        {tasks
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .map((task) => {
            const isActive = activeTaskId === task.taskId;
            return (
              <div
                key={task.taskId}
                style={{
                  border: "1px solid #ccc", borderRadius: "8px", padding: "12px",
                  cursor: "pointer",
                  background:  isActive ? "#f0f8ff" : "#fff",
                  boxShadow:   isActive ? "0 4px 10px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.1)",
                  transition:  "all 0.3s",
                }}
                onClick={() => setActiveTaskId(isActive ? null : task.taskId)}
              >
                <h4 style={{ margin: 0, fontWeight: 600, color: "#000" }}>
                  {task.description}
                </h4>
                {isActive && (
                  <div style={{ marginTop: "10px", fontSize: "14px", lineHeight: "1.4" }}>
                    <p><strong>Assignee:</strong> {task.employee || "—"}</p>
                    <p><strong>Start:</strong>    {formatDate(task.startDate)}</p>
                    <p><strong>End:</strong>      {formatDate(task.endDate)}</p>
                    <p><strong>Status:</strong>   {task.status}</p>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                      {/* ✅ FIX 10 applied */}
                      {canMarkComplete(task) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markTaskComplete(task.taskId); }}
                          style={{ ...buttonStyle, background: "#2ecc71" }}
                        >
                          ✅ Mark Complete
                        </button>
                      )}
                      {task.status === STATUS.COMPLETED_PENDING &&
                        hasAnyRole("risk_owner", "root", "super_admin" , "aio" , "ciso" , "dpo") && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markTaskComplete(task.taskId); }}
                            style={{ ...buttonStyle, background: "#f39c12" }}
                          >
                            ✅ Approve
                          </button>
                        )}
                      {task.status === STATUS.APPROVED && (
                        <span style={{ fontSize: 13, color: "#2f9e44", fontWeight: 600 }}>
                          ✅ Approved
                        </span>
                      )}

                      {hasAnyRole("risk_owner", "root", "super_admin" , "aio" , "ciso" , "dpo") && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); editTask(task); }}
                            style={{ ...buttonStyle, background: "#3498db" }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteTask(task.taskId); }}
                            style={{ ...buttonStyle, background: "#e74c3c" }}
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Add Task button */}
      {user && hasAnyRole("risk_owner", "root", "super_admin", "aio" , "ciso" , "dpo") && (
        <div style={{ marginTop: "20px" }}>
          <button
            style={{
              background: "#3498db", color: "#fff", border: "none",
              padding: "12px 20px", borderRadius: "8px", cursor: "pointer",
            }}
            onClick={() => {
              setFormData(emptyForm());
              setEditingTaskId(null);
              setIsModalOpen(true);
            }}
          >
            ➕ Add Task
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          justifyContent: "center", alignItems: "center",
          zIndex: 999, padding: "20px", boxSizing: "border-box",
        }}>
          {/* ✅ FIX 7: ref added here */}
          <div
            ref={modalScrollRef}
            style={{
              background: "#fff", padding: "25px", borderRadius: "10px",
              width: "100%", maxWidth: "450px", boxSizing: "border-box",
              maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ marginBottom: "15px", fontWeight: "700", color: "#000" }}>
              {editingTaskId ? "Edit Task" : "Add Task"}
            </h3>
            <div style={{ display: "grid", gap: "12px" }}>
              {pathname === "/risk-assessment/tasks" && (
                <SelectField
                  label="Related Risk"
                  name="riskId"
                  value={formData.riskId}
                  onChange={handleInputChange}
                  options={riskOptions}
                  placeholder="Select related risk"
                />
              )}
              <SelectField
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleDeptChange}   // ✅ uses scroll-preserving handler
                options={departments.map((d) => ({ value: d.name, label: d.name }))}
                placeholder="Select department"
              />
              <SelectField
                label="Assign To"
                name="employee"
                value={formData.employee}
                onChange={handleEmployeeChange}
                options={empOptions}
                placeholder="Select employee"
              />
              <TextAreaField
                label="Task Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the mitigation task..."
                rows={2}
              />
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8, color: "#343a40" }}>
                  Priority
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {PRIORITY_OPTIONS.map((p) => {
                    const c          = PRIORITY_CONFIG[p];
                    const isSelected = formData.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, priority: p }))}
                        style={{
                          padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                          fontSize: 12, fontWeight: 700,
                          border:      "1.5px solid " + (isSelected ? c.border : "#e9ecef"),
                          background:  isSelected ? c.bg    : "#fff",
                          color:       isSelected ? c.color : "#868e96",
                          transition:  "all 0.15s",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <InputField
                label="Start Date"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                min={today}
              />
              <InputField
                label="End Date"
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                min={formData.startDate || today}
                max={riskFormData.deadlineDate || undefined}
              />
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  style={{ padding: "8px 16px", borderRadius: "5px", cursor: "pointer", background: "#ccc", border: "none" }}
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTaskId(null);
                    setFormData(emptyForm());
                  }}
                >
                  Cancel
                </button>
                <button
                  style={{
                    padding: "8px 16px", borderRadius: "5px", cursor: "pointer",
                    background: "#3498db", color: "#fff", border: "none",
                    opacity: isSaving ? 0.6 : 1,
                  }}
                  onClick={saveTask}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : editingTaskId ? "Update Task" : "Save Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}