// app/gap-assessment/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import AuditDashboard from "@/modules/gapAssessment/pages/GapAssessment";

export default function GapAssessmentRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="gapAssessment">
        <AuditDashboard />
      </FrameworkPage>
    </ProtectedPage>
  );
}