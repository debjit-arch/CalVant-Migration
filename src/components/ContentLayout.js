import Link from 'next/link';
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
          <div className="blog-footer-content">
            <div className="footer-links">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/security">Security</Link>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              &copy; {new Date().getFullYear()} CalVant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContentLayout;
