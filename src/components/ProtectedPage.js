"use client";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage({ children }) {
  const { isAuthenticated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) return null; // still checking
  if (isAuthenticated === false) return null; // redirecting

  return children;
}