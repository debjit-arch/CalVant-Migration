// app/tprm/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import TPRMSection from "@/modules/tprm/pages/TPRMSection";

export default function TPRMRoute() {
  return (
    <ProtectedPage>
        <TPRMSection />
    </ProtectedPage>
  );
}