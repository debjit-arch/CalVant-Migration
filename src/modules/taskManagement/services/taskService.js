const API_URL = `${process.env.NEXT_PUBLIC_SP}/task-service/api/tasks`;


class TaskService {
  constructor() {
    this.username = "username";
    this.password = "password";
  }


  getAuthHeader() {
    const token = btoa(`${this.username}:${this.password}`);
    return { Authorization: `Basic ${token}` };
  }


  // ── Tasks ──────────────────────────────────────────────────


  async getAllTasks() {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
  }


  async getAllTaskIds() {
    const tasks = await this.getAllTasks();
    return tasks.map((t) => t.taskId);
  }


  async saveTask(taskData, changedBy = "System") {
    const res = await fetch(`${API_URL}?changedBy=${encodeURIComponent(changedBy)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
      credentials: "include",
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error("Failed to save task");
    return res.json();
  }


  async updateTask(taskId, updatedData, changedBy = "System") {
    const res = await fetch(`${API_URL}/${taskId}?changedBy=${encodeURIComponent(changedBy)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
      credentials: "include",
      body: JSON.stringify(updatedData),
    });
    if (!res.ok) throw new Error("Failed to update task");
    return res.json();
  }


  async deleteTask(taskId, changedBy = "System") {
    const res = await fetch(`${API_URL}/${taskId}?changedBy=${encodeURIComponent(changedBy)}`, {
      method: "DELETE",
      headers: { ...this.getAuthHeader() },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete task");
    return res.text();
  }


  async getTaskById(taskId) {
    const res = await fetch(`${API_URL}/${taskId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Task not found");
    return res.json();
  }


  // ── Logs ───────────────────────────────────────────────────


  async getTaskLogs(taskId, changeType = null) {
    const url = changeType
      ? `${API_URL}/${taskId}/logs?changeType=${changeType}`
      : `${API_URL}/${taskId}/logs`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch task logs");
    return res.json();
  }


  // ── SubTasks ───────────────────────────────────────────────


  async getSubTasks(parentTaskId) {
    const res = await fetch(`${API_URL}/${parentTaskId}/subtasks`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch subtasks");
    return res.json();
  }


  async createSubTask(parentTaskId, subTaskData, changedBy = "System") {
    const res = await fetch(
      `${API_URL}/${parentTaskId}/subtasks?changedBy=${encodeURIComponent(changedBy)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
        credentials: "include",
        body: JSON.stringify(subTaskData),
      }
    );
    if (!res.ok) throw new Error("Failed to create subtask");
    return res.json();
  }


  async updateSubTask(parentTaskId, subTaskId, updatedData, changedBy = "System") {
    const res = await fetch(
      `${API_URL}/${parentTaskId}/subtasks/${subTaskId}?changedBy=${encodeURIComponent(changedBy)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
        credentials: "include",
        body: JSON.stringify(updatedData),
      }
    );
    if (!res.ok) throw new Error("Failed to update subtask");
    return res.json();
  }


  async deleteSubTask(parentTaskId, subTaskId, changedBy = "System") {
    const res = await fetch(
      `${API_URL}/${parentTaskId}/subtasks/${subTaskId}?changedBy=${encodeURIComponent(changedBy)}`,
      {
        method: "DELETE",
        headers: { ...this.getAuthHeader() },
        credentials: "include",
      }
    );
    if (!res.ok) throw new Error("Failed to delete subtask");
    return res.text();
  }
}


export default new TaskService();
