// app/risk-assessment/add/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import AddRisk from "@/modules/riskAssesment/pages/AddRisk";

export default function RiskAssessmentAddRoute() {
  return (
    <ProtectedPage>
        <AddRisk />
    </ProtectedPage>
  );
}