---
name: calvant-nextjs-migration
description: >
  Use this skill whenever working on the CalVant compliance management platform — a Next.js 15+ App Router project migrating from Create React App. Trigger this skill for ANY task involving: migrating components from src/ to app/, creating new pages or routes, working with compliance framework modules (GDPR, ISO 27001, SOC2, DPDPA, etc.), touching context providers, modifying the sidebar/navigation, or any code in app/ or src/. Also use when the user asks about project architecture, migration strategy, naming conventions, or wants to add new features to CalVant. If the repo is open or a file path from this project is mentioned, use this skill.
---

# CalVant — Next.js Migration Skill

CalVant is a compliance management SaaS platform migrated from **Create React App → Next.js App Router**.

---

## Project Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.5 (App Router, Turbopack) |
| Language | JavaScript (JSX) |
| Styling | CSS Modules + Global CSS |
| State | React Context API |
| Auth | Session-based via `SessionProvider` |
| Routing | Next.js file-system routing (app/) |
| UI Library | **@mui/material v6** + **@mui/icons-material v6** (upgraded from @material-ui v4) |
| API Base | `https://api.calvant.com` |

---

## ⚠️ NO DELETION POLICY

**Never delete any file or folder** — not `src/modules/`, not `src/src/`, nothing. The user keeps all legacy files as backup. Only create and fix files in `app/`. Do not suggest or perform deletions.

---

## ⚠️ MUI Import Rule (CRITICAL)

```js
// ❌ OLD — do not use
import { Button } from '@material-ui/core'
import { Search } from '@material-ui/icons'

// ✅ NEW — always use these
import { Button } from '@mui/material'
import { Search } from '@mui/icons-material'
```

**Before touching any module**, grep it for `@material-ui` and update all imports first.

---

## ⚠️ API Endpoint Note

- `GET /compliance-brain/compliance/controls?tenantId={tenantId}` — fetches all controls (has `frameworkCode` per item)
- `GET /compliance-brain/compliance/{tenantId}/current` — current snapshot
- `GET /compliance-brain/compliance/{tenantId}/history` — historical data
- **Do NOT use** `/compliance/requirements` — does not exist

---

## Directory Structure

```
calvant/
├── app/                        # ✅ Next.js App Router
│   ├── layout.js               # Root layout with all Context Providers
│   ├── page.js                 # Root page
│   └── (all routes below)
├── src/                        # Legacy source (keep, do not delete)
│   ├── components/             # Shared UI: sidebar, modals, navigation
│   ├── modules/                # Feature modules (source of truth for components)
│   ├── context/                # React Context providers
│   ├── utils/                  # Helper functions
│   └── styles/                 # Global CSS
└── src/src/                    # Nested legacy (do NOT delete)
```

---

## Migration Status

### Phase 1 — Top-Level Routes ✅ COMPLETE

All top-level `app/*/page.js` files exist and build green.

### Phase 2 — Sub-Routes 🔄 IN PROGRESS

#### gap-assessment/ ✅ COMPLETE
| Sub-route | Status |
|---|---|
| `app/gap-assessment/new/page.js` → `NewAssessment.js` | ✅ |
| `app/gap-assessment/history/page.js` → `AssessmentHistory.js` | ✅ |

#### risk-assessment/ 🔄 CURRENT
| Sub-route | app/ path | src/ component | Status |
|---|---|---|---|
| Add risk | `app/risk-assessment/add/page.js` | `src/modules/riskAssesment/pages/AddRisk.js` | ❌ |
| Saved risks | `app/risk-assessment/saved/page.js` | `src/modules/riskAssesment/pages/SavedRisksPage.js` | ❌ |
| Templates | `app/risk-assessment/templates/page.js` | `src/modules/riskAssesment/pages/TemplatesPage.js` | ❌ |
| My tasks | `app/risk-assessment/my-tasks/page.js` | `src/modules/taskManagement/` | ❌ |
| MLD | `app/risk-assessment/mld/page.js` | TBD — scan src/modules/riskAssesment/ | ❌ |
| SOA | `app/risk-assessment/soa/page.js` | TBD — scan src/modules/riskAssesment/ | ❌ |
| Controls | `app/risk-assessment/controls/page.js` | TBD — scan src/modules/riskAssesment/ | ❌ |

#### documentation/ ❌ NOT STARTED
| Sub-route | app/ path | src/ component | Status |
|---|---|---|---|
| MLD | `app/documentation/mld/page.js` | `src/modules/documentation/` | ❌ |
| View | `app/documentation/view/page.js` | `src/modules/documentation/` | ❌ |
| Upload | `app/documentation/upload/page.js` | `src/modules/documentation/` | ❌ |
| Archived | `app/documentation/archived/page.js` | `src/modules/documentation/` | ❌ |
| Settings | `app/documentation/settings/page.js` | `src/modules/documentation/` | ❌ |

#### task-management/ ❌ NOT STARTED
| Sub-route | app/ path | src/ component | Status |
|---|---|---|---|
| Tasks | `app/task-management/tasks/page.js` | `src/modules/taskManagement/` | ❌ |
| Department tasks | `app/task-management/departmenttasks/page.js` | `src/modules/taskManagement/` | ❌ |

#### compliances/ ❌ NOT STARTED
| Sub-route | app/ path | src/ component | Status |
|---|---|---|---|
| Detailed | `app/compliances/detailed/page.js` | `src/modules/integrations/` | ❌ |
| Reports | `app/compliances/reports/page.js` | `src/modules/reports/` | ❌ |

#### dpia/ ❌ NOT STARTED
| Sub-route | app/ path | src/ component | Status |
|---|---|---|---|
| Assessments | `app/dpia/assessments/page.js` | `src/modules/dpia/` | ❌ |
| New | `app/dpia/new/page.js` | `src/modules/dpia/` | ❌ |
| Compliance [id] | `app/dpia/compliance/[id]/page.js` | `src/modules/dpia/` | ❌ |
| Detail [id] | `app/dpia/[id]/page.js` | `src/modules/dpia/` | ❌ |

#### aiia/ ❌ NOT STARTED
| Sub-route | app/ path | src/ component | Status |
|---|---|---|---|
| Stage 1 | `app/aiia/stage1/page.js` | `src/modules/aiia/` | ❌ |
| Stage 1 new | `app/aiia/stage1/new/page.js` | `src/modules/aiia/` | ❌ |
| Stage 1 edit [id] | `app/aiia/stage1/edit/[id]/page.js` | `src/modules/aiia/` | ❌ |
| Stage 2 | `app/aiia/stage2/page.js` | `src/modules/aiia/` | ❌ |
| Stage 2 new | `app/aiia/stage2/new/page.js` | `src/modules/aiia/` | ❌ |
| Stage 2 edit [id] | `app/aiia/stage2/edit/[id]/page.js` | `src/modules/aiia/` | ❌ |
| Risks | `app/aiia/risks/page.js` | `src/modules/aiia/` | ❌ |
| Risks new | `app/aiia/risks/new/page.js` | `src/modules/aiia/` | ❌ |
| Risks edit [id] | `app/aiia/risks/edit/[id]/page.js` | `src/modules/aiia/` | ❌ |
| My assignments | `app/aiia/my-assignments/page.js` | `src/modules/aiia/pages/MyAssignments.js` | ❌ |
| Assignment [id] | `app/aiia/my-assignments/[id]/page.js` | `src/modules/aiia/` | ❌ |
| Audit logs | `app/aiia/audit-logs/page.js` | `src/modules/aiia/` | ❌ |

---

## Sub-Route Migration Pattern

Components already have `"use client"` and MUI imports fixed from Phase 1. Sub-routes are simpler:

1. **Read** the existing `app/<route>/page.js` — check if empty or already wired
2. **Find** the matching component in `src/modules/`
3. **Wire it** following this pattern:

```jsx
// app/gap-assessment/new/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import NewAssessment from "@/modules/gapAssessment/pages/NewAssessment";

export default function GapAssessmentNewRoute() {
  return (
    <ProtectedPage>
      <FrameworkPage moduleKey="gapAssessment">
        <NewAssessment />
      </FrameworkPage>
    </ProtectedPage>
  );
}
```

4. **Run `npm run build`** — fix errors
5. **Never delete anything**

### Dynamic Routes ([id] pages)

```jsx
// app/aiia/my-assignments/[id]/page.js
'use client'
import { useParams } from 'next/navigation';
// pass params.id to the component
```

---

## Lessons Learned

1. **Empty page.js files** — verify `wc -l` before assuming a route works
2. **Missing `"use client"`** — hooks/event handlers need it at line 1
3. **`history` / `useHistory`** — replace with `useRouter` from `next/navigation`
4. **Duplicate export names** — suffix page exports with `Route` or `Page`
5. **Pre-existing errors surface during migration** — fix all before moving on
6. **MUI v4 + React 19 = `findDOMNode` crash** — always update imports first
7. **Never reject Claude Code edits mid-batch** — always accept, revert manually if needed
8. **Wrong API endpoints** — verify against backend controllers before assuming URL is correct

---

## Context Providers (app/layout.js)

```jsx
<UIProvider>
  <SessionProvider>
    <FrameworkProvider>
      <LayoutProvider>
        <SEOProvider>
          {children}
        </SEOProvider>
      </LayoutProvider>
    </FrameworkProvider>
  </SessionProvider>
</UIProvider>
```

---

## Compliance Frameworks

- GDPR, DPDPA, ISO 27001, ISO 27701, ISO 42001, SOC 2, KSA PDPL, DPIA, Trust Centre

---

## Key Components

| Component | Location | Purpose |
|---|---|---|
| `SidebarWrapper` | `src/components/` | Main nav sidebar |
| `ContentLayout` | `src/components/` | Page wrapper |
| `FrameworkPage` | `src/components/` | Compliance page base |
| `ProtectedPage` | `src/components/` | Auth HOC |

---

## Dev Commands

```bash
npm run dev      # http://localhost:3000
npm run build    # Run after every change
npm run start    # Production server
npm run lint     # ESLint
```