"use client";
// app/dpia/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import DpiaDashboard from "@/modules/dpia/pages/DpiaDashboard";
export default function DpiaRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="dpia">
        <DpiaDashboard />
      </FrameworkPage>
    </ProtectedPage>
  );
}
