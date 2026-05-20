// app/trust-centre/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import TrustCentreContent from "./TrustCentreContent";

export default function TrustCentreRoute() {
  return (
    <ProtectedPage>
        <TrustCentreContent />
    </ProtectedPage>
  );
}