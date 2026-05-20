// app/risk-assessment/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import RiskAssessment from "@/modules/riskAssesment/pages/RiskAssessment";

export default function RiskAssessmentRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="riskAssesment">
        <RiskAssessment />
      </FrameworkPage>
    </ProtectedPage>
  );
}