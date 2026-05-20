// app/gap-assessment/new/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import NewAssessment from "@/modules/gapAssessment/pages/NewAssessment";

export default function GapAssessmentNewRoute() {
  return (
    <ProtectedPage>
        <NewAssessment />
    </ProtectedPage>
  );
}