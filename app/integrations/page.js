// app/integrations/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import IntegrationDashboard from "@/modules/integrations/integrationdashboard";

export default function IntegrationsRoute() {
  return (
    <ProtectedPage>
        <IntegrationDashboard />
    </ProtectedPage>
  );
}