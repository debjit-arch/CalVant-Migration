"use client";
import { useFramework } from "@/context/FrameworkContex";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FrameworkPage({ children, moduleKey }) {
  const { showDpia, showAiia, frameworksLoading } = useFramework();
  const router = useRouter();

  const allowed = moduleKey === "dpia" ? showDpia : showAiia;

  useEffect(() => {
    // Only redirect if we have finished loading frameworks AND the module is explicitly not allowed
    if (!frameworksLoading && allowed === false) {
      router.replace("/");
    }
  }, [allowed, frameworksLoading, router]);

  // While loading frameworks, don't render children OR redirect
  if (frameworksLoading) return null;
  
  // If not allowed, don't render children (the useEffect will handle the redirect)
  if (!allowed) return null;

  return children;
}