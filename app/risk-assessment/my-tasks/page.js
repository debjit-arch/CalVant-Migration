// app/risk-assessment/my-tasks/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import MyTasks from "@/modules/riskAssesment/pages/MyTasks";

export default function RiskAssessmentMyTasksRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="riskAssesment">
        <MyTasks />
      </FrameworkPage>
    </ProtectedPage>
  );
}