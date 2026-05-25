// app/layout.js
import "../src/styles/GlobalStyles.css";
import { UIProvider } from "@/context/UIContext";
import { FrameworkProvider } from "@/context/FrameworkContex";
import { LayoutProvider } from "@/context/LayoutContext";
import { SessionProvider } from "@/context/SessionContext";
import SidebarWrapper from "@/components/SidebarWrapper";
import MainContentWrapper from "@/components/MainContentWrapper";
import { getPageMetadata } from '@/utils/getPageMetadata';

// Global defaults only — pages override with their own generateMetadata()
export async function generateMetadata() {
  return getPageMetadata('/', {
    title: {
      default: 'CalVant | ISO Compliance & Risk Management Platform',
      template: '%s | CalVant',
    },
    description: 'Empower your organization with CalVant compliance platform.',
    verification: { google: '41e5318870c428ec' },
  });
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* SEOProvider and DynamicSEO removed */}
        <UIProvider>
          <SessionProvider>
            <FrameworkProvider>
              <LayoutProvider>
                <SidebarWrapper />
                <MainContentWrapper>{children}</MainContentWrapper>
              </LayoutProvider>
            </FrameworkProvider>
          </SessionProvider>
        </UIProvider>
      </body>
    </html>
  );
}