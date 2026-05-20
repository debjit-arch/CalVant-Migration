// app/gap-assessment/history/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import AssessmentHistory from "@/modules/gapAssessment/pages/AssessmentHistory";

export default function GapAssessmentHistoryRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="gapAssessment">
        <AssessmentHistory />
      </FrameworkPage>
    </ProtectedPage>
  );
}