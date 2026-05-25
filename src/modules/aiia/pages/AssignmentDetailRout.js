import React from "react";
import { useRouter, usePathname } from "next/navigation";
import AssignmentDetailPage from "../components/AssignementDetailPage";

/**
 * Route-level wrapper for AssignmentDetailPage.
 * Reads the assignment object passed via router.push({ state: { assignment } }).
 * If state is missing (e.g. direct URL access), redirects back to /aiia.
 */
export default function AssignmentDetailRoute() {
  const router = useRouter();
  const pathname = usePathname();
  const assignment = location.state?.assignment;

  if (!assignment) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          color: "#64748b",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>📋</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
          Assessment not found
        </div>
        <div style={{ fontSize: 13 }}>
          Please access this page from your assignments list.
        </div>
        <button
          onClick={() => router.push("/aiia")}
          style={{
            marginTop: 8,
            padding: "9px 20px",
            borderRadius: 8,
            border: "1.5px solid #3b82f6",
            background: "white",
            color: "#3b82f6",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <AssignmentDetailPage
      assignment={assignment}
      onBack={() => router.goBack()}
      onSaved={() => router.push("/aiia")}
    />
  );
}
