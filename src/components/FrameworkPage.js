"use client";
import { useFramework } from "@/context/FrameworkContex";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FrameworkPage({ children, moduleKey }) {
  const { showDpia, showAiia } = useFramework();
  const router = useRouter();

  const allowed = moduleKey === "dpia" ? showDpia : showAiia;

  useEffect(() => {
    if (allowed === false) {
      router.replace("/");
    }
  }, [allowed]);

  if (!allowed) return null;

  return children;
}