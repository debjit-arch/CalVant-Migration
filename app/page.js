"use client";
import React from "react";
import { useSession } from "@/context/SessionContext";
import Dashboard from "@/modules/dashboard/Dashboard";
import DashboardLoggedIn from "@/modules/dashboard/DashboardLoggedIn";

export default function HomePage() {
  const { isAuthenticated } = useSession();

  if (isAuthenticated === null) return null; // still checking, prevent flash

  if (!isAuthenticated) return <Dashboard />;

  return <DashboardLoggedIn />;
}