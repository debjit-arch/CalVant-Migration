// app/documentation/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import Documentation from "@/modules/documentation/pages/Documentation";

export default function DocumentationRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="documentation">
        <Documentation />
      </FrameworkPage>
    </ProtectedPage>
  );
}