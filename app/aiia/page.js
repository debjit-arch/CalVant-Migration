// app/aiia/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import AiiaDashboard from "@/modules/aiia/pages/AiiaDashboard";

export default function AiiaRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="aiia">
        <AiiaDashboard />
      </FrameworkPage>
    </ProtectedPage>
  );
}