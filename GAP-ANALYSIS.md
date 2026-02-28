# PRD vs Implementation — Gap Analysis

> Generated: 2026-02-28 Compares [PRD.md](PRD.md) against the current codebase on `main`.

---

## 1. Car Profile Management — Partially Implemented

| Requirement                                                     | Status   | Details                                                                                                                          |
| --------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Store/edit vehicle info (make, model, year, VIN, mileage, etc.) | PASS     | All fields present in schema and form                                                                                            |
| Data persists between sessions                                  | PASS     | SQLite + Prisma backend                                                                                                          |
| Add Vehicle from dashboard                                      | PARTIAL  | Only shown as empty-state prompt; no "Add Vehicle" button when a vehicle already exists                                          |
| **Multi-vehicle support**                                       | **FAIL** | `App.tsx` hardcodes `vehicle = vehicles?.[0]` — only the first vehicle is ever used. No vehicle selector or switching UI exists. |

---

## 2. Maintenance Event Scheduling — Mostly Implemented

| Requirement                      | Status   | Details                                                                                                                                                    |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create/view/manage events        | PASS     | Full CRUD via `MaintenanceEventForm` + `MaintenanceTimeline`                                                                                               |
| Chronological order              | PASS     | Server sorts by `scheduledDate` asc                                                                                                                        |
| Support past and future dates    | PASS     | No date restrictions on the form                                                                                                                           |
| Mark complete                    | PASS     | PATCH endpoint + auto-creates next occurrence for recurring events                                                                                         |
| **Calendar view for scheduling** | **FAIL** | PRD specifies "views calendar" as a trigger and lists Calendar in components — no calendar view exists. `calendar.tsx` UI primitive is present but unused. |
| **Delete events from UI**        | **FAIL** | Server DELETE endpoint exists but no delete button is rendered in the frontend                                                                             |

---

## 3. Recurring Maintenance Reminders — CRITICAL GAP

This is the **largest gap** between the PRD and the implementation. The entire feature is missing
from the backend.

| Requirement                                              | Status   | Details                                                                                                                                    |
| -------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Create time-based reminders (e.g., every 3 months)       | **FAIL** | No `RecurringReminder` model in `prisma/schema.prisma`. No server routes. No DB persistence.                                               |
| Create mileage-based reminders (e.g., every 5,000 km)    | **FAIL** | Same as above                                                                                                                              |
| Reminders Tab in UI                                      | **FAIL** | `App.tsx` has 3 tabs (Dashboard, Maintenance, Expenses) — no Reminders tab                                                                 |
| Auto-generate maintenance events from reminders          | **FAIL** | `use-recurring-reminders.ts` hook exists but operates on client-side state only and is **never imported or used** in `App.tsx`             |
| Toggle reminders active/inactive                         | **FAIL** | Components (`RecurringReminderForm`, `RecurringReminderList`, `UpcomingReminders`) exist but are **orphaned — none are rendered anywhere** |
| Update last completion date/mileage when events complete | **FAIL** | No backend support for tracking reminder completion                                                                                        |
| Prevent duplicate scheduled events for same category     | **FAIL** | No generalized duplicate prevention                                                                                                        |

### What does exist

A limited "weekly checks" system is baked into the `MaintenanceEvent` model via `isRecurring`,
`recurrenceType`, and `recurrenceValue` fields. This covers one specific use case (6 hardcoded
weekly vehicle checks) but is **not** the generalized recurring reminders system the PRD describes.

---

## 4. Expense Tracking & Logging — Partially Implemented

| Requirement                                              | Status   | Details                                                                       |
| -------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| Record costs (parts, labor, total) with metadata         | PASS     | `ExpenseForm` with parts/labor/other cost breakdown, garage name, description |
| Expenses linked to events                                | PASS     | `eventId` foreign key in schema                                               |
| Totals calculate accurately                              | PASS     | Server-side `totalCost` calculation                                           |
| History is viewable                                      | PASS     | `ExpenseHistory` component with table + mobile card layout                    |
| **Searchable history**                                   | **FAIL** | No search input on `ExpenseHistory`                                           |
| **Filterable history** (by date, category, garage, etc.) | **FAIL** | No filter controls exist                                                      |
| **Edit expenses from the list**                          | **FAIL** | No edit action on expense rows in the history view                            |
| **Delete expenses from UI**                              | **FAIL** | Server DELETE endpoint exists but no delete button in the frontend            |

---

## 5. Budget Management & Analysis — Partially Implemented

| Requirement                                        | Status   | Details                                                                                                                                            |
| -------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Define yearly/monthly budget                       | PASS     | Period selector exists in `BudgetOverview`                                                                                                         |
| Visual progress indicator                          | PASS     | `<Progress>` bar + over-budget warning                                                                                                             |
| Over/under budget clearly shown                    | PASS     | Destructive color + Warning icon when over budget                                                                                                  |
| **Spending scoped to budget period**               | **FAIL** | Spending is calculated as **all-time total** (`expenseStats.totalSpending`), not filtered to the current month or year matching the budget period  |
| **Monthly AND yearly comparison views**            | **FAIL** | PRD says "supports both monthly and yearly views" — only one view is shown, no side-by-side or switchable comparison                               |
| **Multi-threshold progress bar** (green/amber/red) | **FAIL** | `_getProgressColor()` in `BudgetOverview.tsx` is prefixed with underscore (unused). The color logic is never applied to the `<Progress>` component |

---

## 6. Edge Case Handling

| Requirement                        | Status   | Details                                                                                                    |
| ---------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| Empty states with friendly prompts | PASS     | All major views have empty state UI                                                                        |
| Optional fields / partial data     | PASS     | Schemas allow optional fields; calculations work with partial data                                         |
| Past events / historical records   | PARTIAL  | Can create past-dated events, but no dedicated "log historical maintenance" flow                           |
| **Odometer backwards prevention**  | **FAIL** | Only validates `min="0"` on the input — no check against current odometer to prevent setting a lower value |
| Budget overflow visual indicators  | PASS     | Warning icon and destructive color                                                                         |
| **Duplicate reminders prevention** | **FAIL** | No reminders system exists to prevent duplicates against                                                   |
| **Inactive reminders toggle**      | **FAIL** | Components exist but are never rendered                                                                    |

---

## 7. Design Direction — Significant Deviation

| PRD Specification                        | Actual Implementation                                                       | Gap                                     |
| ---------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------- |
| **Darkish, sophisticated interface**     | Light mode default (`--color-bg: #ffffff`)                                  | Default theme should be dark            |
| **Zinc tones** for neutrals              | Slate-based neutrals (`--color-neutral-*: var(--slate-*)`)                  | Wrong color family — PRD specifies zinc |
| **Amber accent** (`oklch(0.75 0.15 85)`) | **Blue accent** (`--color-accent-*: var(--blue-*)`)                         | Completely wrong accent color           |
| **Medium Zinc** secondary                | **Violet** secondary accent (`--color-accent-secondary-*: var(--violet-*)`) | Wrong secondary color                   |
| **Inter font** for all text              | System sans-serif fallback (`ui-sans-serif, system-ui...`)                  | Inter is not loaded or referenced       |
| oklch color definitions per PRD spec     | Radix UI color tokens                                                       | Different color system entirely         |
| Specific contrast ratios documented      | Not verified against Radix tokens                                           | Accessibility ratios may differ         |

---

## 8. Animations & Transitions — Not Implemented

| PRD Specification                                                | Status                                           |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| 150ms micro-interactions for button presses and form submissions | **FAIL** — No custom transition durations        |
| 300ms smooth page transitions maintaining spatial context        | **FAIL** — No page transitions                   |
| Pulse animations for budget status and maintenance alerts        | **FAIL** — No pulse animations                   |
| Slide transitions for primary navigation/tabs                    | **FAIL** — Default instant tab switch            |
| Gentle shake feedback for form validation errors                 | **FAIL** — No shake animation                    |
| Button loading states during mutations                           | **FAIL** — No loading spinners on action buttons |

---

## 9. Component & UX Gaps

| PRD Specification                                            | Status      | Details                                                                                                                                                                                  |
| ------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar component for maintenance scheduling                | **FAIL**    | `calendar.tsx` UI primitive exists but is never used for a scheduling view                                                                                                               |
| Custom odometer input with numeric keyboard optimization     | **FAIL**    | Basic `<Input type="number">` — no custom numeric keyboard behavior                                                                                                                      |
| Custom budget progress bar with multi-threshold color coding | **FAIL**    | Standard `<Progress>` component, no green/amber/red thresholds                                                                                                                           |
| Custom event timeline component                              | PASS        | `MaintenanceTimeline` exists with past/future separation                                                                                                                                 |
| Bottom-anchored action buttons on mobile                     | **FAIL**    | All buttons are inline, not fixed to bottom                                                                                                                                              |
| Minimum 44px tap targets for all interactive elements        | **PARTIAL** | Some buttons are too small (e.g., `h-7` = 28px in `UpcomingChecks`)                                                                                                                      |
| Tables convert to card-based lists on mobile                 | PASS        | `ExpenseHistory` has responsive table/card layout                                                                                                                                        |
| Collapsible sections for vehicle details                     | PARTIAL     | `UpcomingChecks` is collapsible; `VehicleProfile` is not                                                                                                                                 |
| **Icon library consistency**                                 | **PARTIAL** | Mix of Phosphor Icons and Lucide icons — `UpcomingChecks.tsx` and `ChecksHistory.tsx` use lucide (`CheckCircle2`, `Clock`, `ChevronDown`) while rest of app uses `@phosphor-icons/react` |

---

## 10. Typography Gaps

| PRD Specification                             | Actual                                       | Gap             |
| --------------------------------------------- | -------------------------------------------- | --------------- |
| H1: Inter SemiBold / 24px / -0.02em           | System font, no letter-spacing customization | Not implemented |
| H2: Inter SemiBold / 18px / -0.01em           | System font, no letter-spacing customization | Not implemented |
| H3: Inter Medium / 14px / normal              | System font                                  | Not implemented |
| Body: Inter Regular / 16px / 1.5 line height  | System font                                  | Not implemented |
| Small: Inter Regular / 14px / 1.4 line height | System font                                  | Not implemented |

---

## Priority Summary

| Priority        | Gap                                                                                   | Impact                                          |
| --------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **P0 CRITICAL** | Recurring Reminders system entirely missing (no DB model, no API, no UI integration)  | Core feature from PRD completely absent         |
| **P0 CRITICAL** | Multi-vehicle support missing                                                         | Single-vehicle hardcoded, breaks core use case  |
| **P1 HIGH**     | Wrong color scheme (Blue/Violet instead of Amber/Zinc, light instead of dark default) | Visual identity contradicts PRD                 |
| **P1 HIGH**     | Budget spending not period-scoped (all-time vs monthly/yearly)                        | Budget analysis produces inaccurate comparisons |
| **P1 HIGH**     | Expense search and filter missing                                                     | Key usability requirement from PRD              |
| **P2 MEDIUM**   | No calendar view for maintenance scheduling                                           | Missing navigation path described in PRD        |
| **P2 MEDIUM**   | Delete actions missing from frontend (events, expenses)                               | CRUD operations incomplete                      |
| **P2 MEDIUM**   | Inter font not loaded                                                                 | Typography doesn't match spec                   |
| **P2 MEDIUM**   | No animations or transitions                                                          | Polish and UX feel gap                          |
| **P2 MEDIUM**   | Budget multi-threshold progress bar unused                                            | Visual indicator logic written but not wired    |
| **P3 LOW**      | Odometer backwards validation                                                         | Edge case from PRD                              |
| **P3 LOW**      | Icon library inconsistency (Phosphor + Lucide mixed)                                  | Code hygiene                                    |
| **P3 LOW**      | Button loading states during mutations                                                | UX polish                                       |
| **P3 LOW**      | Bottom-anchored mobile action buttons                                                 | Mobile UX enhancement                           |
| **P3 LOW**      | 44px minimum tap targets not enforced everywhere                                      | Accessibility                                   |
