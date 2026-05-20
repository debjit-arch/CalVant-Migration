// app/risk-assessment/templates/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import TemplatesPage from "@/modules/riskAssesment/pages/TemplatesPage";

export default function RiskAssessmentTemplatesRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="riskAssesment">
        <TemplatesPage />
      </FrameworkPage>
    </ProtectedPage>
  );
}