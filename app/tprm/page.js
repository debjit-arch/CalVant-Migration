"use client";

import ProtectedPage from "@/components/ProtectedPage";
import TPRMSection from "@/modules/tprm/pages/TPRMSection";
export default function Page() {
  return (
    <ProtectedPage>
      <TPRMSection />
    </ProtectedPage>
  );
}
