import Image from "next/image";
// import React from 'react'

// const Procedures = () => {
//   return (
//     <div>Procedures</div>
//   )
// }

// export default Procedures

// import React from "react";
// import { UserCircle2 } from "lucide-react";
// import "./Procedures.css";

// const ProceduresPage = () => {
//   const handleScrollTo = (id) => {
//     const el = document.getElementById(id);
//     if (el) el.scrollIntoView({ behavior: "smooth" });
//   };

//   const goTo = (path) => {
//     window.location.href = path;
//   };

//   return (
//     <div className="procedures-page-root">
//       {/* HEADER & NAVBAR - EXACT ISO STYLE */}
//       <header className="procedures-header">
//         <div className="procedures-header-content">
//           <div className="procedures-logo-section">
//             <div className="procedures-logo-icon">
//               <svg viewBox="0 0 24 24">
//                 <path d="M12 2l7 3v6c0 5-3.5 9.1-7 11-3.5-1.9-7-6-7-11V5l7-3z" />
//               </svg>
//             </div>
//             <div>
//               <p className="procedures-logo-text">CalVant</p>
//               <p className="procedures-logo-subtext">Procedures Library</p>
//             </div>
//           </div>

//           <nav className="procedures-header-nav">
//             <ul className="procedures-nav-links">

//                 <Link href="/" className="procedures-nav-link procedures-nav-link-btn">
//                   Home
//                 </Link>
//               <li>
//                 <button
//                   type="button"
//                   className="procedures-nav-link procedures-nav-link-btn"
//                   onClick={() => handleScrollTo("procedures-overview")}
//                 >
//                   Overview
//                 </button>
//               </li>
//               <li>
//                 <button
//                   type="button"
//                   className="procedures-nav-link procedures-nav-link-btn"
//                   onClick={() => handleScrollTo("procedures-categories")}
//                 >
//                   Categories
//                 </button>
//               </li>
//               <li>
//                 <button
//                   type="button"
//                   className="procedures-nav-link procedures-nav-link-btn"
//                   onClick={() => handleScrollTo("procedures-workflows")}
//                 >
//                   Workflows
//                 </button>
//               </li>
//               <li>
//                 <button
//                   type="button"
//                   className="procedures-nav-link procedures-nav-link-btn"
//                   onClick={() => handleScrollTo("procedures-benefits")}
//                 >
//                   Benefits
//                 </button>
//               </li>
//             </ul>

//             {/* 🔥 AUTO-DETECT LOGIN STATUS */}
//             {(() => {
//               const storedUser = JSON.parse(sessionStorage.getItem("user") || "null");
//               const isUserLoggedIn = !!storedUser;

//               return isUserLoggedIn && storedUser ? (
//                 <div className="procedures-user-card">
//                   <UserCircle2 size={20} className="procedures-user-icon" />
//                   <div className="procedures-user-info">
//                     <span className="procedures-user-name">{storedUser.name || "User"}</span>
//                     <span className="procedures-user-role">
//                       {storedUser.department?.name || "Compliance Officer"}
//                     </span>
//                   </div>
//                 </div>
//               ) : (
//                 <button
//                   type="button"
//                   className="procedures-btn procedures-btn-secondary"
//                   onClick={() => goTo("/login")}
//                 >
//                   Login
//                 </button>
//               );
//             })()}

//             <div className="procedures-cta-buttons">

//             </div>
//           </nav>
//         </div>
//       </header>

//       {/* HERO SECTION - 3D GAUGE */}
//       <section className="procedures-hero">
//         <div className="procedures-hero-inner">
//           <div className="procedures-hero-content">
//             <div className="procedures-hero-badge">
//               ISO 27001 & 27701 Ready
//             </div>
//             <h1 className="procedures-hero-title">
//               Operational <span>Procedures Library</span>
//             </h1>
//             <p className="procedures-hero-description">
//               45+ battle-tested procedures for risk assessment, control implementation,
//               evidence collection, and continuous compliance monitoring. Auditor-approved
//               and implementation-ready.
//             </p>

//             <div className="procedures-hero-cta">
//               <button
//                 type="button"
//                 className="procedures-hero-primary"
//                 onClick={() => goTo("/demo")}
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24">
//                   <path fill="currentColor" d="M8 5v14l11-7z" />
//                 </svg>
//                 See Procedures in Action
//               </button>
//               <button
//                 type="button"
//                 className="procedures-hero-secondary"
//                 onClick={() => handleScrollTo("procedures-overview")}
//               >
//                 Explore Library
//               </button>
//             </div>
//           </div>

//           <div className="procedures-hero-visual">
//             <div className="procedures-gauge-container">
//               <div className="gauge-wrapper">
//                 <div className="procedures-gauge">
//                   <svg viewBox="0 0 300 300" className="gauge-svg">
//                     <defs>
//                       <linearGradient id="procGaugeBg" x1="0%" y1="0%" x2="100%" y2="100%">
//                         <stop offset="0%" stopColor="rgba(15, 23, 42, 0.3)"/>
//                         <stop offset="100%" stopColor="rgba(79, 70, 229, 0.1)"/>
//                       </linearGradient>
//                       <linearGradient id="procGaugeFill" x1="0%" y1="0%" x2="0%" y2="100%">
//                         <stop offset="0%" stopColor="#10b981"/>
//                         <stop offset="50%" stopColor="#059669"/>
//                         <stop offset="100%" stopColor="#34d399"/>
//                       </linearGradient>
//                     </defs>
//                     <circle
//                       cx="150" cy="150" r="130"
//                       fill="none" stroke="url(#procGaugeBg)"
//                       strokeWidth="20" strokeLinecap="round"
//                       className="gauge-bg"
//                     />
//                     <circle
//                       cx="150" cy="150" r="130"
//                       fill="none" stroke="url(#procGaugeFill)"
//                       strokeWidth="20" strokeLinecap="round"
//                       strokeDasharray="816 816"
//                       className="gauge-progress"
//                       style={{ strokeDashoffset: 204 }} // 75% complete
//                     />
//                   </svg>
//                   <div className="gauge-center">
//                     <div className="procedures-badge">PROCEDURES</div>
//                     <div className="procedures-value">87%</div>
//                     <div className="procedures-label">Operationalized</div>
//                   </div>
//                 </div>
//                 <div className="procedures-stats">
//                   <div className="stat-item">
//                     <div className="stat-number">45+</div>
//                     <div className="stat-label">Procedures</div>
//                   </div>
//                   <div className="stat-item">
//                     <div className="stat-number">12</div>
//                     <div className="stat-label">Categories</div>
//                   </div>
//                   <div className="stat-item">
//                     <div className="stat-number">156</div>
//                     <div className="stat-label">Steps</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* OVERVIEW SECTION */}
//       <section id="procedures-overview" className="procedures-section">
//         <div className="procedures-section-header">
//           <h2>Why Procedures Matter</h2>
//           <p>
//             Procedures turn compliance frameworks into repeatable, measurable operations.
//             They bridge the gap between high-level controls and daily execution, ensuring
//             your ISO 27001/27701 program delivers real security outcomes.
//           </p>
//         </div>

//         <div className="procedures-overview-grid">
//           <div className="procedures-overview-card">
//             <div className="procedures-card-icon">🎯</div>
//             <h3>Repeatable Operations</h3>
//             <p>
//               Standardized workflows eliminate guesswork and ensure consistent execution
//               across teams, locations, and time periods.
//             </p>
//           </div>

//           <div className="procedures-overview-card">
//             <div className="procedures-card-icon">📈</div>
//             <h3>Measurable Performance</h3>
//             <p>
//               Defined steps with clear success criteria enable objective measurement of
//               control effectiveness and team performance.
//             </p>
//           </div>

//           <div className="procedures-overview-card">
//             <div className="procedures-card-icon">✅</div>
//             <h3>Audit-Ready Evidence</h3>
//             <p>
//               Documented procedures with timestamps, approvals, and outcomes provide
//               auditors with complete evidence chains.
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* CATEGORIES SECTION */}
//       <section id="procedures-categories" className="procedures-section">
//         <div className="procedures-section-header">
//           <h2>12 Procedure Categories</h2>
//           <p>
//             Comprehensive coverage across all ISO 27001 clauses and Annex A domains,
//             plus privacy-specific procedures for ISO 27701.
//           </p>
//         </div>

//         <div className="procedures-categories-grid">
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">🔐</div>
//             <h4>Access Management</h4>
//             <p>User provisioning, reviews, privileged access, MFA enforcement</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">🚨</div>
//             <h4>Incident Response</h4>
//             <p>Breach detection, containment, notification, post-mortem analysis</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">📋</div>
//             <h4>Risk Assessment</h4>
//             <p>Threat modeling, vulnerability scanning, risk treatment planning</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">🔍</div>
//             <h4>Evidence Collection</h4>
//             <p>Screenshot capture, log collection, control testing automation</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">👥</div>
//             <h4>Third Party Risk</h4>
//             <p>Vendor onboarding, assessment, continuous monitoring</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">🛡️</div>
//             <h4>Change Management</h4>
//             <p>Configuration changes, emergency changes, rollback procedures</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">📧</div>
//             <h4>Data Subject Requests</h4>
//             <p>DSAR handling, consent withdrawal, data portability</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">⚙️</div>
//             <h4>Patch Management</h4>
//             <p>Vulnerability prioritization, testing, deployment</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">📊</div>
//             <h4>Internal Audit</h4>
//             <p>Control sampling, interview guides, finding documentation</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">🏢</div>
//             <h4>Onboarding/Offboarding</h4>
//             <p>New hire security training, access cleanup, device wipe</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">🔒</div>
//             <h4>Encryption Management</h4>
//             <p>Key rotation, certificate management, crypto inventory</p>
//           </div>
//           <div className="procedures-category-card">
//             <div className="procedures-category-icon">📱</div>
//             <h4>Endpoint Security</h4>
//             <p>AV deployment, disk encryption, remote wipe procedures</p>
//           </div>
//         </div>
//       </section>

//       {/* WORKFLOWS SECTION */}
//       <section id="procedures-workflows" className="procedures-section procedures-workflows-section">
//         <div className="procedures-section-header">
//           <h2>Sample Implementation Workflows</h2>
//           <p>
//             Each procedure follows CalVant's standardized format: Purpose → Scope →
//             Roles → Steps → Evidence → Metrics → Escalation.
//           </p>
//         </div>

//         <div className="procedures-workflow-container">
//           <div className="procedures-workflow-card">
//             <h4>Quarterly Access Review Procedure</h4>
//             <div className="workflow-steps">
//               <div className="step-item">
//                 <div className="step-number">1</div>
//                 <div className="step-content">
//                   <strong>Export user accounts</strong> from IAM systems
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">2</div>
//                 <div className="step-content">
//                   <strong>Manager validation</strong> of current role requirements
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">3</div>
//                 <div className="step-content">
//                   <strong>Automated cleanup</strong> of stale accounts & permissions
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">4</div>
//                 <div className="step-content">
//                   <strong>Evidence package</strong> with audit trail
//                 </div>
//               </div>
//             </div>
//             <div className="workflow-metrics">
//               <span>Target: 95% completion rate</span>
//               <span>Evidence: 100% automated</span>
//             </div>
//           </div>

//           <div className="procedures-workflow-card">
//             <h4>Critical Vulnerability Patching</h4>
//             <div className="workflow-steps">
//               <div className="step-item">
//                 <div className="step-number">1</div>
//                 <div className="step-content">
//                   <strong>CVSS 9.0+ detection</strong> via vuln scanner
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">2</div>
//                 <div className="step-content">
//                   <strong>48hr patch window</strong> assignment
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">3</div>
//                 <div className="step-content">
//                   <strong>Regression testing</strong> & rollback plan
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">4</div>
//                 <div className="step-content">
//                   <strong>Verification scan</strong> & documentation
//                 </div>
//               </div>
//             </div>
//             <div className="workflow-metrics">
//               <span>Target: 48hr remediation</span>
//               <span>Evidence: Scan before/after</span>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* BENEFITS SECTION */}
//       <section id="procedures-benefits" className="procedures-section">
//         <div className="procedures-section-header">
//           <h2>Business Impact</h2>
//           <p>
//             Procedures don't just check compliance boxes—they drive operational excellence
//             and competitive advantage.
//           </p>
//         </div>

//         <div className="procedures-benefits-grid">
//           <div className="procedures-benefit-card">
//             <div className="procedures-benefit-icon">⚡</div>
//             <h3>60% Faster Audits</h3>
//             <p>
//               Pre-defined evidence collection eliminates 80% of auditor back-and-forth.
//             </p>
//           </div>
//           <div className="procedures-benefit-card">
//             <div className="procedures-benefit-icon">📉</div>
//             <h3>45% Risk Reduction</h3>
//             <p>
//               Standardized execution catches gaps that ad-hoc processes miss.
//             </p>
//           </div>
//           <div className="procedures-benefit-card">
//             <div className="procedures-benefit-icon">👥</div>
//             <h3>Team Alignment</h3>
//             <p>
//               Clear roles and escalation paths eliminate finger-pointing during incidents.
//             </p>
//           </div>
//           <div className="procedures-benefit-card">
//             <div className="procedures-benefit-icon">🚀</div>
//             <h3>Scale Confidently</h3>
//             <p>
//               Documented procedures enable rapid team growth without quality degradation.
//             </p>
//           </div>
//           <div className="procedures-benefit-card">
//             <div className="procedures-benefit-icon">💰</div>
//             <h3>ROI Multiplier</h3>
//             <p>
//               Each procedure serves multiple frameworks (ISO, SOC2, GDPR) simultaneously.
//             </p>
//           </div>
//           <div className="procedures-benefit-card">
//             <div className="procedures-benefit-icon">🏆</div>
//             <h3>Certification Success</h3>
//             <p>
//               98% first-time pass rate for customers using our procedures library.
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* CTA SECTION */}
//       <section className="procedures-section">
//         <div className="procedures-cta-section">
//           <h2>Ready to Operationalize Compliance?</h2>
//           <p>
//             Import these procedures into CalVant and start collecting evidence
//             automatically. From implementation to audit-ready in weeks, not months.
//           </p>
//           <div className="procedures-cta-buttons">
//             <button
//               type="button"
//               className="procedures-cta-btn procedures-cta-btn-primary"
//               onClick={() => goTo("/demo")}
//             >
//               Start with Procedures
//             </button>
//             <button
//               type="button"
//               className="procedures-cta-btn procedures-cta-btn-secondary"
//               onClick={() => goTo("/contact")}
//             >
//               Talk to Expert
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* FOOTER */}
//       <footer className="procedures-footer">
//         <div className="procedures-footer-content">
//           <div className="procedures-footer-section">
//             <h4>CalVant</h4>
//             <p>
//               Enterprise platform for operationalizing ISO 27001, ISO 27701,
//               and other compliance frameworks with automated evidence collection.
//             </p>
//           </div>
//           <div className="procedures-footer-section">
//             <h4>Frameworks</h4>
//             <ul>
//               <li><Link href="/iso-27001">ISO 27001</Link></li>
//               <li><Link href="/iso-27701">ISO 27701</Link></li>
//               <li><Link href="/policies">Policy Templates</Link></li>
//               <li><Link href="/procedures">Procedures</Link></li>
//             </ul>
//           </div>
//           <div className="procedures-footer-section">
//             <h4>Product</h4>
//             <ul>
//               <li><Link href="/features">Features</Link></li>
//               <li><Link href="/risk-assessment">Risk Assessment</Link></li>
//               <li><Link href="/documentation">Documentation</Link></li>
//             </ul>
//           </div>
//           <div className="procedures-footer-section">
//             <h4>Company</h4>
//             <ul>
//               <li><Link href="/about">About</Link></li>
//               <li><Link href="/careers">Careers</Link></li>
//               <li><Link href="/support">Support</Link></li>
//             </ul>
//           </div>
//         </div>
//         <div className="procedures-footer-bottom">
//           © {new Date().getFullYear()} CalVant · Procedures Library · Made in India
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default ProceduresPage;

// // C:\cf-tool-frontend-test-main\src\modules\dashboard\Template\Procedures.js
// import React from "react";
// import { UserCircle2 } from "lucide-react";
// import "./Procedures.css";

// const ProceduresPage = () => {
//   const handleScrollTo = (id) => {
//     const el = document.getElementById(id);
//     if (el) el.scrollIntoView({ behavior: "smooth" });
//   };

//   const goTo = (path) => {
//     window.location.href = path;
//   };

//   return (
//     <div className="procedures-page-root policies-theme">
//       {/* HEADER & NAVBAR - EXACT ISO STYLE */}
//       <header className="procedures-header">
//         <div className="procedures-header-content">
//           <div className="procedures-logo-section">
//             <div className="procedures-logo-icon">
//              <Image
//       src="/CalVant Logo.svg
//       alt="CalVant Logo"
//       style={{
//         width: '70%',  // Matches Dashboard's "Adjust this to control how much space the logo takes"
//         height: '70%',
//         objectFit: 'contain'
//       }}
//     />
//             </div>
//             <div>
//               <p className="procedures-logo-text">CalVant</p>
//               <p className="procedures-logo-subtext">Procedures Library</p>
//             </div>
//           </div>

//           <nav className="procedures-header-nav">
//             <ul className="procedures-nav-links">
//               <Link href="/" className="procedures-nav-link procedures-nav-link-btn">
//                 Home
//               </Link>
//               <li>
//                 <button
//                   type="button"
//                   className="procedures-nav-link procedures-nav-link-btn"
//                   onClick={() => handleScrollTo("procedures-overview")}
//                 >
//                   Overview
//                 </button>
//               </li>
//               <li>
//                 <button
//                   type="button"
//                   className="procedures-nav-link procedures-nav-link-btn"
//                   onClick={() => handleScrollTo("procedures-categories")}
//                 >
//                   Categories
//                 </button>
//               </li>
//               <li>
//                 <button
//                   type="button"
//                   className="procedures-nav-link procedures-nav-link-btn"
//                   onClick={() => handleScrollTo("procedures-workflows")}
//                 >
//                   Workflows
//                 </button>
//               </li>
//               <li>
//                 <button
//                   type="button"
//                   className="procedures-nav-link procedures-nav-link-btn"
//                   onClick={() => handleScrollTo("procedures-benefits")}
//                 >
//                   Benefits
//                 </button>
//               </li>
//             </ul>

//             {/* 🔥 AUTO-DETECT LOGIN STATUS */}
//             {(() => {
//               const storedUser = JSON.parse(
//                 sessionStorage.getItem("user") || "null"
//               );
//               const isUserLoggedIn = !!storedUser;

//               return isUserLoggedIn && storedUser ? (
//                 <div className="procedures-user-card">
//                   <UserCircle2 size={20} className="procedures-user-icon" />
//                   <div className="procedures-user-info">
//                     <span className="procedures-user-name">
//                       {storedUser.name || "User"}
//                     </span>
//                     <span className="procedures-user-role">
//                       {storedUser.department?.name || "Compliance Officer"}
//                     </span>
//                   </div>
//                 </div>
//               ) : (
//                 <button
//                   type="button"
//                   className="procedures-btn procedures-btn-secondary"
//                   onClick={() => goTo("/login")}
//                 >
//                   Login
//                 </button>
//               );
//             })()}
//           </nav>
//         </div>
//       </header>

//       {/* HERO SECTION - MATCHES POLICY LAYOUT */}
//       <section className="hero-section procedures-hero">
//         <div className="hero-content procedures-hero-inner">
//           <div className="procedures-hero-content">
//             <div className="hero-badge procedures-hero-badge">
//               ISO 27001 & 27701 Ready
//             </div>
//             <h1 className="hero-title procedures-hero-title">
//               Operational <span>Procedures Library</span>
//             </h1>
//             <p className="hero-subtitle procedures-hero-description">
//               45+ battle-tested procedures for risk assessment, control
//               implementation, evidence collection, and continuous compliance
//               monitoring. Auditor-approved and implementation-ready.
//             </p>

//             {/* <div className="hero-cta procedures-hero-cta">
//               <button
//                 type="button"
//                 className="cta-primary procedures-hero-primary"
//                 onClick={() => goTo("/demo")}
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24">
//                   <path fill="currentColor" d="M8 5v14l11-7z" />
//                 </svg>
//                 See Procedures in Action
//               </button>
//               <button
//                 type="button"
//                 className="cta-secondary procedures-hero-secondary"
//                 onClick={() => handleScrollTo("procedures-overview")}
//               >
//                 Explore Library
//               </button>
//             </div> */}

//             <div className="hero-cta procedures-hero-cta">
//   {(() => {
//     const storedUser = JSON.parse(sessionStorage.getItem("user") || "null");
//     const isUserLoggedIn = !!storedUser;
//     return !isUserLoggedIn ? (
//       <button
//         type="button"
//         className="cta-primary procedures-hero-primary"
//         onClick={() => goTo("/demo")}
//       >
//         <svg width="18" height="18" viewBox="0 0 24 24">
//           <path fill="currentColor" d="M8 5v14l11-7z" />
//         </svg>
//         See Procedures in Action
//       </button>
//     ) : null;
//   })()}
//   <button
//     type="button"
//     className="cta-secondary procedures-hero-secondary"
//     onClick={() => handleScrollTo("procedures-overview")}
//   >
//     Explore Library
//   </button>
// </div>

//             {/* STATS ROW (TEXT) */}
//             <div className="hero-stats">
//               <div className="stat-item stat-item-main">
//                 <span className="stat-main-label">PROCEDURES</span>
//                 <span className="stat-main-value">87%</span>
//                 <span className="stat-main-sub">OPERATIONALIZED</span>
//               </div>
//               <div className="stat-item">
//                 <span className="stat-number">45+</span>
//                 <span className="stat-label">PROCEDURES</span>
//               </div>
//               <div className="stat-item">
//                 <span className="stat-number">12</span>
//                 <span className="stat-label">CATEGORIES</span>
//               </div>
//               <div className="stat-item">
//                 <span className="stat-number">156</span>
//                 <span className="stat-label">STEPS</span>
//               </div>
//             </div>
//           </div>

//           {/* SMALL CIRCLE GAUGE ON RIGHT */}
//       <div className="hero-gauge">
//   <div className="procedures-gauge">
//     <svg viewBox="0 0 300 300" className="gauge-svg">
//       <defs>
//         <linearGradient id="procGaugeBg" x1="0%" y1="0%" x2="100%" y2="100%">
//           <stop offset="0%" stopColor="rgba(15, 23, 42, 0.3)" />
//           <stop offset="100%" stopColor="rgba(79, 70, 229, 0.1)" />
//         </linearGradient>
//         <linearGradient id="procGaugeFill" x1="0%" y1="0%" x2="0%" y2="100%">
//           <stop offset="0%" stopColor="#10b981" />
//           <stop offset="50%" stopColor="#059669" />
//           <stop offset="100%" stopColor="#34d399" />
//         </linearGradient>
//       </defs>
//       <circle
//         cx="150"
//         cy="150"
//         r="130"
//         fill="none"
//         stroke="url(#procGaugeBg)"
//         strokeWidth="20"
//         strokeLinecap="round"
//         className="gauge-bg"
//       />
//       <circle
//         cx="150"
//         cy="150"
//         r="130"
//         fill="none"
//         stroke="url(#procGaugeFill)"
//         strokeWidth="20"
//         strokeLinecap="round"
//         strokeDasharray="816 816"
//         className="gauge-progress"
//         style={{ strokeDashoffset: 204 }} // 75% complete
//       />
//     </svg>

//     {/* CENTER CONTENT INSIDE CIRCLE */}
//     <div className="gauge-center">
//       <div className="gauge-center-badge">PROCEDURES</div>
//       <div className="gauge-center-value">87%</div>
//       <div className="gauge-center-label">Operationalized</div>
//     </div>
//   </div>
// </div>
//         </div>
//       </section>

//       {/* OVERVIEW SECTION */}
//       <section id="procedures-overview" className="procedures-section procedures-grid">
//         <div className="procedures-section-header">
//           <h2>Why Procedures Matter</h2>
//           <p>
//             Procedures turn compliance frameworks into repeatable, measurable
//             operations. They bridge the gap between high-level controls and
//             daily execution, ensuring your ISO 27001/27701 program delivers real
//             security outcomes.
//           </p>
//         </div>

//         <div className="procedures-overview-grid grid-container">
//           <div className="procedures-overview-card policy-card" data-category="overview">
//             <div className="procedures-card-icon policy-icon">🎯</div>
//             <h3 className="policy-title">Repeatable Operations</h3>
//             <p className="policy-desc">
//               Standardized workflows eliminate guesswork and ensure consistent
//               execution across teams, locations, and time periods.
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge overview">REPEATABLE</span>
//             </div>
//           </div>

//           <div className="procedures-overview-card policy-card" data-category="overview">
//             <div className="procedures-card-icon policy-icon">📈</div>
//             <h3 className="policy-title">Measurable Performance</h3>
//             <p className="policy-desc">
//               Defined steps with clear success criteria enable objective
//               measurement of control effectiveness and team performance.
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge overview">MEASURABLE</span>
//             </div>
//           </div>

//           <div className="procedures-overview-card policy-card" data-category="overview">
//             <div className="procedures-card-icon policy-icon">✅</div>
//             <h3 className="policy-title">Audit-Ready Evidence</h3>
//             <p className="policy-desc">
//               Documented procedures with timestamps, approvals, and outcomes
//               provide auditors with complete evidence chains.
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge overview">AUDIT-READY</span>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CATEGORIES SECTION */}
//       <section
//         id="procedures-categories"
//         className="procedures-section procedures-grid"
//       >
//         <div className="procedures-section-header">
//           <h2>12 Procedure Categories</h2>
//           <p>
//             Comprehensive coverage across all ISO 27001 clauses and Annex A
//             domains, plus privacy-specific procedures for ISO 27701.
//           </p>
//         </div>

//         <div className="procedures-categories-grid grid-container">
//           <div className="procedures-category-card policy-card" data-category="access">
//             <div className="procedures-category-icon policy-icon">🔐</div>
//             <h4 className="policy-title">Access Management</h4>
//             <p className="policy-desc">
//               User provisioning, reviews, privileged access, MFA enforcement
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge access">ACCESS</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="incident">
//             <div className="procedures-category-icon policy-icon">🚨</div>
//             <h4 className="policy-title">Incident Response</h4>
//             <p className="policy-desc">
//               Breach detection, containment, notification, post-mortem analysis
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge incident">INCIDENT</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="risk">
//             <div className="procedures-category-icon policy-icon">📋</div>
//             <h4 className="policy-title">Risk Assessment</h4>
//             <p className="policy-desc">
//               Threat modeling, vulnerability scanning, risk treatment planning
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge risk">RISK</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="evidence">
//             <div className="procedures-category-icon policy-icon">🔍</div>
//             <h4 className="policy-title">Evidence Collection</h4>
//             <p className="policy-desc">
//               Screenshot capture, log collection, control testing automation
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge evidence">EVIDENCE</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="vendor">
//             <div className="procedures-category-icon policy-icon">👥</div>
//             <h4 className="policy-title">Third Party Risk</h4>
//             <p className="policy-desc">
//               Vendor onboarding, assessment, continuous monitoring
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge vendor">VENDOR</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="change">
//             <div className="procedures-category-icon policy-icon">🛡️</div>
//             <h4 className="policy-title">Change Management</h4>
//             <p className="policy-desc">
//               Configuration changes, emergency changes, rollback procedures
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge change">CHANGE</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="privacy">
//             <div className="procedures-category-icon policy-icon">📧</div>
//             <h4 className="policy-title">Data Subject Requests</h4>
//             <p className="policy-desc">
//               DSAR handling, consent withdrawal, data portability
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge privacy">PRIVACY</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="patch">
//             <div className="procedures-category-icon policy-icon">⚙️</div>
//             <h4 className="policy-title">Patch Management</h4>
//             <p className="policy-desc">
//               Vulnerability prioritization, testing, deployment
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge patch">PATCH</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="audit">
//             <div className="procedures-category-icon policy-icon">📊</div>
//             <h4 className="policy-title">Internal Audit</h4>
//             <p className="policy-desc">
//               Control sampling, interview guides, finding documentation
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge audit">AUDIT</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="hr">
//             <div className="procedures-category-icon policy-icon">🏢</div>
//             <h4 className="policy-title">Onboarding/Offboarding</h4>
//             <p className="policy-desc">
//               New hire security training, access cleanup, device wipe
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge hr">HR</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="crypto">
//             <div className="procedures-category-icon policy-icon">🔒</div>
//             <h4 className="policy-title">Encryption Management</h4>
//             <p className="policy-desc">
//               Key rotation, certificate management, crypto inventory
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge crypto">CRYPTO</span>
//             </div>
//           </div>
//           <div className="procedures-category-card policy-card" data-category="endpoint">
//             <div className="procedures-category-icon policy-icon">📱</div>
//             <h4 className="policy-title">Endpoint Security</h4>
//             <p className="policy-desc">
//               AV deployment, disk encryption, remote wipe procedures
//             </p>
//             <div className="policy-footer">
//               <span className="category-badge endpoint">ENDPOINT</span>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* WORKFLOWS SECTION */}
//       <section
//         id="procedures-workflows"
//         className="procedures-section procedures-workflows-section procedures-grid"
//       >
//         <div className="procedures-section-header">
//           <h2>Sample Implementation Workflows</h2>
//           <p>
//             Each procedure follows CalVant's standardized format:
//             Purpose → Scope → Roles → Steps → Evidence → Metrics → Escalation.
//           </p>
//         </div>

//         <div className="procedures-workflow-container grid-container">
//           <div className="procedures-workflow-card policy-card" data-category="access">
//             <h4 className="policy-title">Quarterly Access Review Procedure</h4>
//             <div className="workflow-steps policy-desc">
//               <div className="step-item">
//                 <div className="step-number">1</div>
//                 <div className="step-content">
//                   <strong>Export user accounts</strong> from IAM systems
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">2</div>
//                 <div className="step-content">
//                   <strong>Manager validation</strong> of current role requirements
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">3</div>
//                 <div className="step-content">
//                   <strong>Automated cleanup</strong> of stale accounts &amp; permissions
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">4</div>
//                 <div className="step-content">
//                   <strong>Evidence package</strong> with audit trail
//                 </div>
//               </div>
//             </div>
//             <div className="workflow-metrics policy-footer">
//               <span className="category-badge access">
//                 Target: 95% completion rate
//               </span>
//               <span className="category-badge access">
//                 Evidence: 100% automated
//               </span>
//             </div>
//           </div>

//           <div className="procedures-workflow-card policy-card" data-category="patch">
//             <h4 className="policy-title">Critical Vulnerability Patching</h4>
//             <div className="workflow-steps policy-desc">
//               <div className="step-item">
//                 <div className="step-number">1</div>
//                 <div className="step-content">
//                   <strong>CVSS 9.0+ detection</strong> via vuln scanner
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">2</div>
//                 <div className="step-content">
//                   <strong>48hr patch window</strong> assignment
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">3</div>
//                 <div className="step-content">
//                   <strong>Regression testing</strong> &amp; rollback plan
//                 </div>
//               </div>
//               <div className="step-item">
//                 <div className="step-number">4</div>
//                 <div className="step-content">
//                   <strong>Verification scan</strong> &amp; documentation
//                 </div>
//               </div>
//             </div>
//             <div className="workflow-metrics policy-footer">
//               <span className="category-badge patch">
//                 Target: 48hr remediation
//               </span>
//               <span className="category-badge patch">
//                 Evidence: Scan before/after
//               </span>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* BENEFITS SECTION */}
//       <section
//         id="procedures-benefits"
//         className="procedures-section procedures-grid"
//       >
//         <div className="procedures-section-header">
//           <h2>Business Impact</h2>
//           <p>
//             Procedures don&apos;t just check compliance boxes—they drive
//             operational excellence and competitive advantage.
//           </p>
//         </div>

//         <div className="procedures-benefits-grid grid-container">
//           <div className="procedures-benefit-card policy-card" data-category="audit">
//             <div className="procedures-benefit-icon policy-icon">⚡</div>
//             <h3 className="policy-title">60% Faster Audits</h3>
//             <p className="policy-desc">
//               Pre-defined evidence collection eliminates 80% of auditor
//               back-and-forth.
//             </p>
//           </div>
//           <div className="procedures-benefit-card policy-card" data-category="risk">
//             <div className="procedures-benefit-icon policy-icon">📉</div>
//             <h3 className="policy-title">45% Risk Reduction</h3>
//             <p className="policy-desc">
//               Standardized execution catches gaps that ad-hoc processes miss.
//             </p>
//           </div>
//           <div className="procedures-benefit-card policy-card" data-category="team">
//             <div className="procedures-benefit-icon policy-icon">👥</div>
//             <h3 className="policy-title">Team Alignment</h3>
//             <p className="policy-desc">
//               Clear roles and escalation paths eliminate finger-pointing during
//               incidents.
//             </p>
//           </div>
//           <div className="procedures-benefit-card policy-card" data-category="scale">
//             <div className="procedures-benefit-icon policy-icon">🚀</div>
//             <h3 className="policy-title">Scale Confidently</h3>
//             <p className="policy-desc">
//               Documented procedures enable rapid team growth without quality
//               degradation.
//             </p>
//           </div>
//           <div className="procedures-benefit-card policy-card" data-category="roi">
//             <div className="procedures-benefit-icon policy-icon">💰</div>
//             <h3 className="policy-title">ROI Multiplier</h3>
//             <p className="policy-desc">
//               Each procedure serves multiple frameworks (ISO, SOC2, GDPR)
//               simultaneously.
//             </p>
//           </div>
//           <div className="procedures-benefit-card policy-card" data-category="cert">
//             <div className="procedures-benefit-icon policy-icon">🏆</div>
//             <h3 className="policy-title">Certification Success</h3>
//             <p className="policy-desc">
//               98% first-time pass rate for customers using our procedures
//               library.
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* CTA SECTION */}
//       <section className="procedures-section cta-section">
//         <div className="procedures-cta-section cta-content">
//           <h2>Ready to Operationalize Compliance?</h2>
//           <p>
//             Import these procedures into CalVant and start collecting
//             evidence automatically. From implementation to audit-ready in weeks,
//             not months.
//           </p>
//           {/* <div className="procedures-cta-buttons cta-buttons">
//             <button
//               type="button"
//               className="procedures-cta-btn procedures-cta-btn-primary cta-primary"
//               onClick={() => goTo("/demo")}
//             >
//               Start with Procedures
//             </button>
//             <button
//               type="button"
//               className="procedures-cta-btn procedures-cta-btn-secondary cta-secondary"
//               onClick={() => goTo("/contact")}
//             >
//               Talk to Expert
//             </button>
//           </div> */}

//           <div className="procedures-cta-buttons cta-buttons">
//   {(() => {
//     const storedUser = JSON.parse(sessionStorage.getItem("user") || "null");
//     const isUserLoggedIn = !!storedUser;
//     return !isUserLoggedIn ? (
//       <button
//         type="button"
//         className="procedures-cta-btn procedures-cta-btn-primary cta-primary"
//         onClick={() => goTo("/demo")}
//       >
//         Start with Procedures
//       </button>
//     ) : null;
//   })()}
//   <button
//     type="button"
//     className="procedures-cta-btn procedures-cta-btn-secondary cta-secondary"
//     onClick={() => goTo("/contact")}
//   >
//     Talk to Expert
//   </button>
// </div>

//         </div>
//       </section>

//       {/* FOOTER */}
//       <footer className="procedures-footer dashboard-footer">
//         <div className="procedures-footer-content dashboard-footer-content">
//           <div className="procedures-footer-section dashboard-footer-section">
//             <h4>CalVant</h4>
//             <p>
//               Enterprise platform for operationalizing ISO 27001, ISO 27701,
//               and other compliance frameworks with automated evidence
//               collection.
//             </p>
//           </div>
//           <div className="procedures-footer-section dashboard-footer-section">
//             <h4>Frameworks</h4>
//             <ul>
//               <li>
//                 <Link href="/iso-27001">ISO 27001</Link>
//               </li>
//               <li>
//                 <Link href="/iso-27701">ISO 27701</Link>
//               </li>
//               <li>
//                 <Link href="/policies">Policy Templates</Link>
//               </li>
//               <li>
//                 <Link href="/procedures">Procedures</Link>
//               </li>
//             </ul>
//           </div>
//           <div className="procedures-footer-section dashboard-footer-section">
//             <h4>Product</h4>
//             <ul>
//               <li>
//                 <Link href="/features">Features</Link>
//               </li>
//               <li>
//                 <Link href="/risk-assessment">Risk Assessment</Link>
//               </li>
//               <li>
//                 <Link href="/documentation">Documentation</Link>
//               </li>
//             </ul>
//           </div>
//           <div className="procedures-footer-section dashboard-footer-section">
//             <h4>Company</h4>
//             <ul>
//               <li>
//                 <Link href="/about">About</Link>
//               </li>
//               <li>
//                 <Link href="/careers">Careers</Link>
//               </li>
//               <li>
//                 <Link href="/support">Support</Link>
//               </li>
//             </ul>
//           </div>
//         </div>
//         <div className="procedures-footer-bottom dashboard-footer-bottom">
//           © {new Date().getFullYear()} CalVant · Procedures Library · Made in
//           India
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default ProceduresPage;

// C:\cf-tool-frontend-test-main\src\modules\dashboard\Template\Procedures.js
import React, { useEffect } from "react";
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Shield,
  AlertCircle,
  FileText,
  Search,
  Users,
  Settings,
  Mail,
  Wrench,
  BarChart3,
  Building2,
  Lock,
  Smartphone,
  Zap,
  Users2,
  Rocket,
  DollarSign,
  Award,
  UserCircle2,
} from "lucide-react";
import "./Procedures.css";

const ProceduresPage = () => {
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const goTo = (path) => {
    window.location.href = path;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" }); // or "smooth"
  }, []);

  return (
    <div className="procedures-page-root policies-theme">
      {/* HEADER & NAVBAR - EXACT ISO STYLE */}
      <header className="procedures-header">
        <div className="procedures-header-content">
          <div className="procedures-logo-section">
            {" "}
            <Image
              src="/CalVant Logo.svg"
              alt="CalVant"
              style={{ height: "210px", width: "auto", cursor: "pointer" }}
              onClick={() => (window.location.href = "/")}
            />{" "}
          </div>

          <nav className="procedures-header-nav">
            <ul className="procedures-nav-links">
              <Link
                href="/"
                className="procedures-nav-link procedures-nav-link-btn"
              >
                Home
              </Link>
              <li>
                <button
                  type="button"
                  className="procedures-nav-link procedures-nav-link-btn"
                  onClick={() => handleScrollTo("procedures-overview")}
                >
                  Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="procedures-nav-link procedures-nav-link-btn"
                  onClick={() => handleScrollTo("procedures-categories")}
                >
                  Categories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="procedures-nav-link procedures-nav-link-btn"
                  onClick={() => handleScrollTo("procedures-workflows")}
                >
                  Workflows
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="procedures-nav-link procedures-nav-link-btn"
                  onClick={() => handleScrollTo("procedures-benefits")}
                >
                  Benefits
                </button>
              </li>
            </ul>

            {/* 🔥 AUTO-DETECT LOGIN STATUS */}
            {(() => {
              const storedUser = JSON.parse(
                sessionStorage.getItem("user") || "null",
              );
              const isUserLoggedIn = !!storedUser;

              return isUserLoggedIn && storedUser ? (
                <div className="procedures-user-card">
                  <UserCircle2 size={20} className="procedures-user-icon" />
                  <div className="procedures-user-info">
                    <span className="procedures-user-name">
                      {storedUser.name || "User"}
                    </span>
                    <span className="procedures-user-role">
                      {storedUser.department?.name || "Compliance Officer"}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="procedures-btn procedures-btn-secondary"
                  onClick={() => goTo("/login")}
                >
                  Login
                </button>
              );
            })()}
          </nav>
        </div>
      </header>

      {/* HERO SECTION - MATCHES POLICY LAYOUT */}
      <section className="hero-section procedures-hero">
        <div className="hero-content procedures-hero-inner">
          <div className="procedures-hero-content">
            <div className="hero-badge procedures-hero-badge">
              ISO 27001 & 27701 Ready
            </div>
            <h1 className="hero-title procedures-hero-title">
              Operational <span>Procedures Library</span>
            </h1>
            <p className="hero-subtitle procedures-hero-description">
              45+ battle-tested procedures for risk assessment, control
              implementation, evidence collection, and continuous compliance
              monitoring. Auditor-approved and implementation-ready.
            </p>

            <div className="hero-cta procedures-hero-cta">
              {(() => {
                const storedUser = JSON.parse(
                  sessionStorage.getItem("user") || "null",
                );
                const isUserLoggedIn = !!storedUser;
                return !isUserLoggedIn ? (
                  <button
                    type="button"
                    className="cta-primary procedures-hero-primary"
                    onClick={() => goTo("/demo")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M8 5v14l11-7z" />
                    </svg>
                    See Procedures in Action
                  </button>
                ) : null;
              })()}
              <button
                type="button"
                className="cta-secondary procedures-hero-secondary"
                onClick={() => handleScrollTo("procedures-overview")}
              >
                Explore Library
              </button>
            </div>

            {/* STATS ROW (TEXT) */}
            <div className="hero-stats">
              <div className="stat-item stat-item-main">
                <span className="stat-main-label">PROCEDURES</span>
                <span className="stat-main-value">87%</span>
                <span className="stat-main-sub">OPERATIONALIZED</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">45+</span>
                <span className="stat-label">PROCEDURES</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">12</span>
                <span className="stat-label">CATEGORIES</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">156</span>
                <span className="stat-label">STEPS</span>
              </div>
            </div>
          </div>

          {/* SMALL CIRCLE GAUGE ON RIGHT */}
          <div className="hero-gauge">
            <div className="procedures-gauge">
              <svg viewBox="0 0 300 300" className="gauge-svg">
                <defs>
                  <linearGradient
                    id="procGaugeBg"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(15, 23, 42, 0.3)" />
                    <stop offset="100%" stopColor="rgba(79, 70, 229, 0.1)" />
                  </linearGradient>
                  <linearGradient
                    id="procGaugeFill"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <circle
                  cx="150"
                  cy="150"
                  r="130"
                  fill="none"
                  stroke="url(#procGaugeBg)"
                  strokeWidth="20"
                  strokeLinecap="round"
                  className="gauge-bg"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="130"
                  fill="none"
                  stroke="url(#procGaugeFill)"
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray="816 816"
                  className="gauge-progress"
                  style={{ strokeDashoffset: 204 }} // 75% complete
                />
              </svg>

              {/* CENTER CONTENT INSIDE CIRCLE */}
              <div className="gauge-center">
                <div className="gauge-center-badge">PROCEDURES</div>
                <div className="gauge-center-value">87%</div>
                <div className="gauge-center-label">Operationalized</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW SECTION */}
      <section
        id="procedures-overview"
        className="procedures-section procedures-grid"
      >
        <div className="procedures-section-header">
          <h2>Why Procedures Matter</h2>
          <p>
            Procedures turn compliance frameworks into repeatable, measurable
            operations. They bridge the gap between high-level controls and
            daily execution, ensuring your ISO 27001/27701 program delivers real
            security outcomes.
          </p>
        </div>

        <div className="procedures-overview-grid grid-container">
          <div
            className="procedures-overview-card policy-card"
            data-category="overview"
          >
            <div className="procedures-card-icon policy-icon">
              <Target size={24} />
            </div>
            <h3 className="policy-title">Repeatable Operations</h3>
            <p className="policy-desc">
              Standardized workflows eliminate guesswork and ensure consistent
              execution across teams, locations, and time periods.
            </p>
            <div className="policy-footer">
              <span className="category-badge overview">REPEATABLE</span>
            </div>
          </div>

          <div
            className="procedures-overview-card policy-card"
            data-category="overview"
          >
            <div className="procedures-card-icon policy-icon">
              <TrendingUp size={24} />
            </div>
            <h3 className="policy-title">Measurable Performance</h3>
            <p className="policy-desc">
              Defined steps with clear success criteria enable objective
              measurement of control effectiveness and team performance.
            </p>
            <div className="policy-footer">
              <span className="category-badge overview">MEASURABLE</span>
            </div>
          </div>

          <div
            className="procedures-overview-card policy-card"
            data-category="overview"
          >
            <div className="procedures-card-icon policy-icon">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="policy-title">Audit-Ready Evidence</h3>
            <p className="policy-desc">
              Documented procedures with timestamps, approvals, and outcomes
              provide auditors with complete evidence chains.
            </p>
            <div className="policy-footer">
              <span className="category-badge overview">AUDIT-READY</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section
        id="procedures-categories"
        className="procedures-section procedures-grid"
      >
        <div className="procedures-section-header">
          <h2>12 Procedure Categories</h2>
          <p>
            Comprehensive coverage across all ISO 27001 clauses and Annex A
            domains, plus privacy-specific procedures for ISO 27701.
          </p>
        </div>

        <div className="procedures-categories-grid grid-container">
          <div
            className="procedures-category-card policy-card"
            data-category="access"
          >
            <div className="procedures-category-icon policy-icon">
              <Shield size={24} />
            </div>
            <h4 className="policy-title">Access Management</h4>
            <p className="policy-desc">
              User provisioning, reviews, privileged access, MFA enforcement
            </p>
            <div className="policy-footer">
              <span className="category-badge access">ACCESS</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="incident"
          >
            <div className="procedures-category-icon policy-icon">
              <AlertCircle size={24} />
            </div>
            <h4 className="policy-title">Incident Response</h4>
            <p className="policy-desc">
              Breach detection, containment, notification, post-mortem analysis
            </p>
            <div className="policy-footer">
              <span className="category-badge incident">INCIDENT</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="risk"
          >
            <div className="procedures-category-icon policy-icon">
              <FileText size={24} />
            </div>
            <h4 className="policy-title">Risk Assessment</h4>
            <p className="policy-desc">
              Threat modeling, vulnerability scanning, risk treatment planning
            </p>
            <div className="policy-footer">
              <span className="category-badge risk">RISK</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="evidence"
          >
            <div className="procedures-category-icon policy-icon">
              <Search size={24} />
            </div>
            <h4 className="policy-title">Evidence Collection</h4>
            <p className="policy-desc">
              Screenshot capture, log collection, control testing automation
            </p>
            <div className="policy-footer">
              <span className="category-badge evidence">EVIDENCE</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="vendor"
          >
            <div className="procedures-category-icon policy-icon">
              <Users size={24} />
            </div>
            <h4 className="policy-title">Third Party Risk</h4>
            <p className="policy-desc">
              Vendor onboarding, assessment, continuous monitoring
            </p>
            <div className="policy-footer">
              <span className="category-badge vendor">VENDOR</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="change"
          >
            <div className="procedures-category-icon policy-icon">
              <Settings size={24} />
            </div>
            <h4 className="policy-title">Change Management</h4>
            <p className="policy-desc">
              Configuration changes, emergency changes, rollback procedures
            </p>
            <div className="policy-footer">
              <span className="category-badge change">CHANGE</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="privacy"
          >
            <div className="procedures-category-icon policy-icon">
              <Mail size={24} />
            </div>
            <h4 className="policy-title">Data Subject Requests</h4>
            <p className="policy-desc">
              DSAR handling, consent withdrawal, data portability
            </p>
            <div className="policy-footer">
              <span className="category-badge privacy">PRIVACY</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="patch"
          >
            <div className="procedures-category-icon policy-icon">
              <Wrench size={24} />
            </div>
            <h4 className="policy-title">Patch Management</h4>
            <p className="policy-desc">
              Vulnerability prioritization, testing, deployment
            </p>
            <div className="policy-footer">
              <span className="category-badge patch">PATCH</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="audit"
          >
            <div className="procedures-category-icon policy-icon">
              <BarChart3 size={24} />
            </div>
            <h4 className="policy-title">Internal Audit</h4>
            <p className="policy-desc">
              Control sampling, interview guides, finding documentation
            </p>
            <div className="policy-footer">
              <span className="category-badge audit">AUDIT</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="hr"
          >
            <div className="procedures-category-icon policy-icon">
              <Building2 size={24} />
            </div>
            <h4 className="policy-title">Onboarding/Offboarding</h4>
            <p className="policy-desc">
              New hire security training, access cleanup, device wipe
            </p>
            <div className="policy-footer">
              <span className="category-badge hr">HR</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="crypto"
          >
            <div className="procedures-category-icon policy-icon">
              <Lock size={24} />
            </div>
            <h4 className="policy-title">Encryption Management</h4>
            <p className="policy-desc">
              Key rotation, certificate management, crypto inventory
            </p>
            <div className="policy-footer">
              <span className="category-badge crypto">CRYPTO</span>
            </div>
          </div>
          <div
            className="procedures-category-card policy-card"
            data-category="endpoint"
          >
            <div className="procedures-category-icon policy-icon">
              <Smartphone size={24} />
            </div>
            <h4 className="policy-title">Endpoint Security</h4>
            <p className="policy-desc">
              AV deployment, disk encryption, remote wipe procedures
            </p>
            <div className="policy-footer">
              <span className="category-badge endpoint">ENDPOINT</span>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOWS SECTION */}
      <section
        id="procedures-workflows"
        className="procedures-section procedures-workflows-section procedures-grid"
      >
        <div className="procedures-section-header">
          <h2>Sample Implementation Workflows</h2>
          <p>
            Each procedure follows CalVant's standardized format: Purpose →
            Scope → Roles → Steps → Evidence → Metrics → Escalation.
          </p>
        </div>

        <div className="procedures-workflow-container grid-container">
          <div
            className="procedures-workflow-card policy-card"
            data-category="access"
          >
            <h4 className="policy-title">Quarterly Access Review Procedure</h4>
            <div className="workflow-steps policy-desc">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>Export user accounts</strong> from IAM systems
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>Manager validation</strong> of current role
                  requirements
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>Automated cleanup</strong> of stale accounts &
                  permissions
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <strong>Evidence package</strong> with audit trail
                </div>
              </div>
            </div>
            <div className="workflow-metrics policy-footer">
              <span className="category-badge access">
                Target: 95% completion rate
              </span>
              <span className="category-badge access">
                Evidence: 100% automated
              </span>
            </div>
          </div>

          <div
            className="procedures-workflow-card policy-card"
            data-category="patch"
          >
            <h4 className="policy-title">Critical Vulnerability Patching</h4>
            <div className="workflow-steps policy-desc">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>CVSS 9.0+ detection</strong> via vuln scanner
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>48hr patch window</strong> assignment
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>Regression testing</strong> & rollback plan
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <strong>Verification scan</strong> & documentation
                </div>
              </div>
            </div>
            <div className="workflow-metrics policy-footer">
              <span className="category-badge patch">
                Target: 48hr remediation
              </span>
              <span className="category-badge patch">
                Evidence: Scan before/after
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section
        id="procedures-benefits"
        className="procedures-section procedures-grid"
      >
        <div className="procedures-section-header">
          <h2>Business Impact</h2>
          <p>
            Procedures don't just check compliance boxes—they drive operational
            excellence and competitive advantage.
          </p>
        </div>

        <div className="procedures-benefits-grid grid-container">
          <div
            className="procedures-benefit-card policy-card"
            data-category="audit"
          >
            <div className="procedures-benefit-icon policy-icon">
              <Zap size={24} />
            </div>
            <h3 className="policy-title">60% Faster Audits</h3>
            <p className="policy-desc">
              Pre-defined evidence collection eliminates 80% of auditor
              back-and-forth.
            </p>
          </div>
          <div
            className="procedures-benefit-card policy-card"
            data-category="risk"
          >
            <div className="procedures-benefit-icon policy-icon">
              <TrendingUp size={24} />
            </div>
            <h3 className="policy-title">45% Risk Reduction</h3>
            <p className="policy-desc">
              Standardized execution catches gaps that ad-hoc processes miss.
            </p>
          </div>
          <div
            className="procedures-benefit-card policy-card"
            data-category="team"
          >
            <div className="procedures-benefit-icon policy-icon">
              <Users2 size={24} />
            </div>
            <h3 className="policy-title">Team Alignment</h3>
            <p className="policy-desc">
              Clear roles and escalation paths eliminate finger-pointing during
              incidents.
            </p>
          </div>
          <div
            className="procedures-benefit-card policy-card"
            data-category="scale"
          >
            <div className="procedures-benefit-icon policy-icon">
              <Rocket size={24} />
            </div>
            <h3 className="policy-title">Scale Confidently</h3>
            <p className="policy-desc">
              Documented procedures enable rapid team growth without quality
              degradation.
            </p>
          </div>
          <div
            className="procedures-benefit-card policy-card"
            data-category="roi"
          >
            <div className="procedures-benefit-icon policy-icon">
              <DollarSign size={24} />
            </div>
            <h3 className="policy-title">ROI Multiplier</h3>
            <p className="policy-desc">
              Each procedure serves multiple frameworks (ISO, GDPR)
              simultaneously.
            </p>
          </div>
          <div
            className="procedures-benefit-card policy-card"
            data-category="cert"
          >
            <div className="procedures-benefit-icon policy-icon">
              <Award size={24} />
            </div>
            <h3 className="policy-title">Certification Success</h3>
            <p className="policy-desc">
              98% first-time pass rate for customers using our procedures
              library.
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="procedures-section cta-section">
        <div className="procedures-cta-section cta-content">
          <h2>Ready to Operationalize Compliance?</h2>
          <p>
            Import these procedures into CalVant and start collecting evidence
            automatically. From implementation to audit-ready in weeks, not
            months.
          </p>
          <div className="procedures-cta-buttons cta-buttons">
            {(() => {
              const storedUser = JSON.parse(
                sessionStorage.getItem("user") || "null",
              );
              const isUserLoggedIn = !!storedUser;
              return !isUserLoggedIn ? (
                <button
                  type="button"
                  className="procedures-cta-btn procedures-cta-btn-primary cta-primary"
                  onClick={() => goTo("/demo")}
                >
                  Start with Procedures
                </button>
              ) : null;
            })()}
            <button
              type="button"
              className="procedures-cta-btn procedures-cta-btn-secondary cta-secondary"
              onClick={() => goTo("/contact")}
            >
              Talk to Expert
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="procedures-footer dashboard-footer">
        <div className="procedures-footer-content dashboard-footer-content">
          <div className="procedures-footer-section dashboard-footer-section">
            <h4>CalVant</h4>
            <p>
              Enterprise platform for operationalizing ISO 27001, ISO 27701, and
              other compliance frameworks with automated evidence collection.
            </p>
          </div>
          <div className="procedures-footer-section dashboard-footer-section">
            <h4>Frameworks</h4>
            <ul>
              <li>
                <Link href="/iso-27001">ISO 27001</Link>
              </li>
              <li>
                <Link href="/iso-27701">ISO 27701</Link>
              </li>
              <li>
                <Link href="/policies">Policy Templates</Link>
              </li>
              <li>
                <Link href="/procedures">Procedures</Link>
              </li>
            </ul>
          </div>
          <div className="procedures-footer-section dashboard-footer-section">
            <h4>Product</h4>
            <ul>
              <li>
                <Link href="/features">Features</Link>
              </li>
              <li>
                <Link href="/risk-assessment">Risk Assessment</Link>
              </li>
              <li>
                <Link href="/documentation">Documentation</Link>
              </li>
            </ul>
          </div>
          <div className="procedures-footer-section dashboard-footer-section">
            <h4>Company</h4>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/careers">Careers</Link>
              </li>
              <li>
                <Link href="/support">Support</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="procedures-footer-bottom dashboard-footer-bottom">
          © {new Date().getFullYear()} CalVant · Procedures Library · Made in
          India
        </div>
      </footer>
    </div>
  );
};

export default ProceduresPage;

