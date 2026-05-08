import "../src/styles/GlobalStyles.css";
import { UIProvider } from "@/context/UIContext";
import { FrameworkProvider } from "@/context/FrameworkContex";
import { LayoutProvider } from "@/context/LayoutContext";
import { SessionProvider } from "@/context/SessionContext";
import SidebarWrapper from "@/components/SidebarWrapper"; // ← new

export const metadata = {
  title: "CalVant",
  description: "Compliance Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UIProvider>
          <SessionProvider>
            {" "}
            {/* ← move SessionProvider OUTSIDE FrameworkProvider */}
            <FrameworkProvider>
              <LayoutProvider>
                <SidebarWrapper />
                {children}
              </LayoutProvider>
            </FrameworkProvider>
          </SessionProvider>
        </UIProvider>
      </body>
    </html>
  );
}
