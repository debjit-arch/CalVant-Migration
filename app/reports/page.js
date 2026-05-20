// app/reports/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import ReportsDashboard from "@/modules/reports/pages/ReportsDashboard";

export default function ReportsRoute() {
  return (
    <ProtectedPage>
        <ReportsDashboard />
    </ProtectedPage>
  );
}