// app/departments/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import DemoPage from "@/modules/departments/pages/DemoPage";

export default function DepartmentsRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="departments">
        <DemoPage />
      </FrameworkPage>
    </ProtectedPage>
  );
}