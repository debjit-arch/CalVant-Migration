# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 16.2.5** compliance management platform ("CalVant") that was migrated from Create React App. The project is in an intermediate migration state - the root `app/` directory contains the new Next.js App Router structure, while `src/` contains legacy React code being gradually migrated.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run Next.js linting
```

## Architecture

### Directory Structure

- **`app/`** - Next.js App Router pages (new migration target)
- **`src/`** - Legacy React components and modules (being migrated)
  - `src/components/` - Shared UI components (navigations, sidebar, modals)
  - `src/modules/` - Feature modules (dashboard, departments, documentation, gapAssessment, riskAssesment, aiia, dpia, trustcentre)
  - `src/context/` - React Context providers for state management
  - `src/utils/` - Utility functions
  - `src/styles/` - Global CSS styles
- **`src/src/`** - Nested legacy React code (forms, inputs, pages) - some duplicated in modules

### Key Frameworks/Compliance Supported

The platform manages multiple compliance frameworks:
- GDPR, DPDPA, ISO 27001, ISO 27701, ISO 42001, SOC2, KSA PDPL
- DPIA (Data Protection Impact Assessment)
- Trust Centre, Policies, Procedures documentation

### State Management

React Context providers wrap the application in `app/layout.js`:
- **UIProvider** - UI state (modals, notifications)
- **SessionProvider** - Authentication/session state
- **FrameworkProvider** - Active compliance framework selection
- **LayoutProvider** - Sidebar/layout state
- **SEOProvider** - Dynamic SEO metadata

### Key Components

- `SidebarWrapper` - Main navigation sidebar with persistent state
- `ContentLayout` - Page wrapper with framework-specific styling
- `FrameworkPage` - Base component for compliance framework pages
- `ProtectedPage` - HOC for authenticated routes

### Migration Notes

- Some components exist in both `src/modules/` and `src/src/` (duplicate code being consolidated)
- Legacy pages reference old React Router patterns - new pages use Next.js App Router
- CSS modules coexist with global CSS - prefer CSS modules for new components