"use client";

import { UIProvider } from "@/context/UIContext";
import { FrameworkProvider } from "@/context/FrameworkContex";
import { LayoutProvider } from "@/context/LayoutContext";
import { SessionProvider } from "@/context/SessionContext";
import SidebarWrapper from "@/components/SidebarWrapper";

export default function ClientLayout({ children }) {
  return (
    <UIProvider>
      <SessionProvider>
        <FrameworkProvider>
          <LayoutProvider>
            <SidebarWrapper />
            {children}
          </LayoutProvider>
        </FrameworkProvider>
      </SessionProvider>
    </UIProvider>
  );
}