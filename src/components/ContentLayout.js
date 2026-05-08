import React from "react";
import BlogNavbar from "./BlogNavbar";
import "../styles/ProfessionalLayout.css";

const ContentLayout = ({ children, narrow = false, heroSection = null }) => {
  return (
    <div className="professional-layout">
      <BlogNavbar />
      
      {heroSection && (
        <section className="professional-hero">
          <div className={`professional-container ${narrow ? 'narrow' : ''}`}>
            {heroSection}
          </div>
        </section>
      )}

      <main className="professional-section">
        <div className={`professional-container ${narrow ? 'narrow' : ''}`}>
          <div className="professional-content">
            {children}
          </div>
        </div>
      </main>

      <footer className="blog-footer">
        <div className="professional-container">
          <div className="blog-footer-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="footer-links" style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
              <Link href="/privacy" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms of Service</Link>
              <Link href="/security" style={{ color: '#9ca3af', textDecoration: 'none' }}>Security</Link>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              &copy; {new Date().getFullYear()} CalVant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContentLayout;
