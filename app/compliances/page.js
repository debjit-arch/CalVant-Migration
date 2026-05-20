// app/compliances/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import Compliances from "@/modules/integrations/Compliances";

export default function CompliancesRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="compliances">
        <Compliances />
      </FrameworkPage>
    </ProtectedPage>
  );
}