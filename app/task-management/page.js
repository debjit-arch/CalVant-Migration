// app/task-management/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import TaskManagementDashboard from "@/modules/taskManagement/pages/TaskManagementDashboard";

export default function TaskManagementRoute() {
  return (
    <ProtectedPage>
        <TaskManagementDashboard />
    </ProtectedPage>
  );
}