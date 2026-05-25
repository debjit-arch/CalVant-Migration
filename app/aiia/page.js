"use client";

import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import AiiaDashboard from "@/modules/aiia/pages/AiiaDashboard";
export default function Page() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="aiia">
        <AiiaDashboard />
      </FrameworkPage>
    </ProtectedPage>
  );
}
