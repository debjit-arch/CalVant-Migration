// app/risk-assessment/saved/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import SavedRisksPage from "@/modules/riskAssesment/pages/SavedRisksPage";

export default function RiskAssessmentSavedRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="riskAssesment">
        <SavedRisksPage />
      </FrameworkPage>
    </ProtectedPage>
  );
}