# Parallel Agent Execution Plan

> Derived from [GAP-ANALYSIS.md](GAP-ANALYSIS.md) and [PRD.md](PRD.md)
>
> **Strategy:** Split work into 3 sequential phases. Within each phase, agents run fully in parallel
> with **zero file overlap** — meaning no merge conflicts are possible.

---

## Architecture Overview

```text
PHASE 1 ──────────────────────────────────────────────────────────
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Agent 1  │ │ Agent 2  │ │ Agent 3  │ │ Agent 4  │ │ Agent 5  │
  │ Theme &  │ │ Reminders│ │ Budget   │ │ Expense  │ │ Maint.   │
  │ Design   │ │ Backend  │ │ Backend  │ │ History  │ │ Timeline │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
       │             │            │             │            │
       └── PR ───────┴── PR ──────┴── PR ───────┴── PR ─────┘
                              │
                     🧑 human rebase-merges
                       all 5 PRs → develop
                              │
                              ▼
PHASE 2 ──────────────────────────────────────────────────────────
           ┌──────────────────┐    ┌──────────────────┐
           │     Agent 6      │    │     Agent 7      │
           │ Core Integration │    │ Component Updates │
           │ (App.tsx + API)  │    │ (Budget + Remind) │
           └──────────────────┘    └──────────────────┘
                    │                       │
                    └──── PR ──┬──── PR ────┘
                               │
                      🧑 human rebase-merges
                        both PRs → develop
                               │
                               ▼
PHASE 3 ──────────────────────────────────────────────────────────
                    ┌──────────────────┐
                    │     Agent 8      │
                    │  UX Polish &     │
                    │  Edge Cases      │
                    └──────────────────┘
                               │
                         PR → develop
                      🧑 human rebase-merges
                               │
                               ▼
                      develop → main (final PR)
```

---

## File Ownership Matrix

Every file is owned by **exactly one agent** per phase. No two agents ever touch the same file.

### Phase 1

| Agent                    | Exclusive File Ownership                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1 — Theme & Design       | `src/main.css`, `src/styles/theme.css`, `index.html`                                                          |
| 2 — Reminders Backend    | `prisma/schema.prisma`, `server/routes/reminders.ts` (NEW), `server/validators/schemas.ts`, `server/index.ts` |
| 3 — Budget Backend       | `server/routes/expenses.ts`, `server/routes/budgets.ts`                                                       |
| 4 — Expense History UI   | `src/components/ExpenseHistory.tsx`                                                                           |
| 5 — Maintenance Timeline | `src/components/MaintenanceTimeline.tsx`                                                                      |

### Phase 2

| Agent                 | Exclusive File Ownership                                                                                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6 — Core Integration  | `src/App.tsx`, `src/lib/api.ts`, `src/hooks/use-api.ts`, `src/lib/types.ts`, `src/components/VehicleSelector.tsx` (NEW), `src/components/MaintenanceCalendar.tsx` (NEW)                                     |
| 7 — Component Updates | `src/components/BudgetOverview.tsx`, `src/components/RecurringReminderForm.tsx`, `src/components/RecurringReminderList.tsx`, `src/components/UpcomingReminders.tsx`, `src/hooks/use-recurring-reminders.ts` |

### Phase 3

| Agent         | Exclusive File Ownership                                                                                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8 — UX Polish | `src/components/UpcomingChecks.tsx`, `src/components/ChecksHistory.tsx`, `src/components/VehicleForm.tsx`, `src/components/VehicleProfile.tsx`, `src/components/ExpenseForm.tsx`, `src/components/MaintenanceEventForm.tsx` |

---

## Git Workflow

> **CRITICAL RULES:**
>
> 1. **All work targets `develop`**, never `main` directly.
> 2. **Agents NEVER merge.** They only push their feature branch.
> 3. **The human** reviews each PR on GitHub and performs **rebase-merge** via the GitHub web UI.
> 4. Between phases, `develop` must be fully up-to-date (all Phase N PRs merged) before
>    Phase N+1 branches are created.

```text
main ─────────────────────────────────────────────────────────────
  │
  └─▶ develop ────────────────────────────────────────────────────
        │
        │  PHASE 1 (5 branches, created from develop)
        ├─▶ phase1/theme-design         → PR → develop (Agent 1)
        ├─▶ phase1/reminders-backend    → PR → develop (Agent 2)
        ├─▶ phase1/budget-backend       → PR → develop (Agent 3)
        ├─▶ phase1/expense-history-ui   → PR → develop (Agent 4)
        ├─▶ phase1/maintenance-ui       → PR → develop (Agent 5)
        │       │
        │       ▼  human rebase-merges all 5 PRs into develop
        │
        │  PHASE 2 (2 branches, created from updated develop)
        ├─▶ phase2/core-integration     → PR → develop (Agent 6)
        ├─▶ phase2/component-updates    → PR → develop (Agent 7)
        │       │
        │       ▼  human rebase-merges both PRs into develop
        │
        │  PHASE 3 (1 branch, created from updated develop)
        ├─▶ phase3/ux-polish            → PR → develop (Agent 8)
        │       │
        │       ▼  human rebase-merges PR into develop
        │
        ▼  human creates final PR: develop → main (rebase-merge)
```

### Setup (run once before Phase 1)

```bash
git checkout main
git checkout -b develop
git push -u origin develop
```

### Agent Branch Rules

Each Copilot agent:

1. **Creates** its branch from `develop`: `git checkout -b phase1/xxx develop`
2. **Commits** with conventional commit messages (e.g., `feat:`, `fix:`, `refactor:`)
3. **Pushes** the branch: `git push -u origin phase1/xxx`
4. **Opens a PR** targeting `develop` (NOT `main`)
5. **NEVER runs** `git merge`, `git rebase`, or any operation on `develop` or `main`

### Between Phases

The human:

1. Reviews and **rebase-merges** all PRs from the current phase via GitHub web UI
2. Verifies `develop` is stable (`bun run typecheck && bun run lint:check && bun run build`)
3. Gives the go-ahead for the next phase's agents to start

---

## Agent Prompts

### Shared Context (include at the top of every prompt)

## Project Context

This is a Car Maintenance Tracker built with:

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui components
- **Backend:** Hono (Bun runtime) + Prisma ORM + SQLite
- **State:** TanStack React Query for server state
- **Icons:** @phosphor-icons/react (primary), lucide-react (to be replaced)
- **Package manager:** Bun

### Code Conventions

- NO semicolons
- NO `function` keyword (use arrow functions: `const fn = () => {}`)
- NO `.then()` (use async/await)
- NO if-else chains (use early returns)
- NO pure white (#fff) or pure black (#000) in CSS

### File Structure

- `server/` — Hono API routes, Prisma DB layer, Zod validators
- `src/` — React frontend (components, hooks, lib utilities)
- `prisma/` — Prisma schema and migrations
- `src/styles/theme.css` — Radix UI color tokens + spacing system
- `src/main.css` — shadcn/ui design tokens (oklch) + Tailwind theme

---

### PHASE 1 — Agent 1: Theme & Design System

## Mission

Align the visual design with the PRD specification. The current theme uses blue/violet accent colors
and defaults to light mode. The PRD requires an amber/zinc dark-first design.

## Files You Own (ONLY modify these)

- `src/main.css`
- `src/styles/theme.css`
- `index.html` (only if font changes needed — Inter is already loaded via Google Fonts)

## DO NOT TOUCH

Any file outside the three listed above.

## Requirements

### 1. Default to Dark Mode

The `<body>` or `<html>` element should have the `dark` class by default. Update `index.html` to add
`class="dark"` to the `<html>` tag.

### 2. Color Scheme — Amber/Zinc per PRD

Replace the current color tokens in `src/main.css` (both `:root` and `.dark` blocks):

**PRD Color Spec:**

- Background (dark): `oklch(0.15 0.01 255)` — Deep dark zinc
- Card: `oklch(0.20 0.01 255)` — Medium dark zinc
- Primary: `oklch(0.28 0.01 255)` — Deep zinc for actions
- Secondary: `oklch(0.45 0.01 255)` — Medium zinc
- Accent: `oklch(0.75 0.15 85)` — Amber for highlights and alerts
- Muted: `oklch(0.25 0.01 255)` background, `oklch(0.60 0 0)` text
- Foreground: `oklch(0.95 0 0)` — Light text on dark
- Border: `oklch(0.65 0.01 255)` with low alpha
- Destructive: keep current red

Map these oklch values to the existing CSS custom properties (--background, --foreground, --card,
--primary, --secondary, --accent, --muted, --border, --input, --ring, etc.).

### 3. Neutral Colors in theme.css

Update `src/styles/theme.css` to use zinc-based Radix tokens instead of slate/blue:

- Change `--color-neutral-*` from `var(--slate-*)` to a zinc equivalent. Since Radix does not have a
  "zinc" scale, use `var(--gray-*)` which is the closest neutral gray without blue tint.
- Change `--color-accent-*` from `var(--blue-*)` to `var(--amber-*)`
- Change `--color-accent-secondary-*` from `var(--violet-*)` to `var(--gold-*)` or remove if
  unnecessary

### 4. Typography — Inter Font

Inter is already loaded in `index.html`. Update `src/styles/theme.css`:

- Change `--font-family` from the system fallback to:
  `'Inter', ui-sans-serif, system-ui, sans-serif`

### 5. PRD Typography Scale

Add CSS utility classes or CSS custom properties for the PRD typography hierarchy:

- H1: Inter SemiBold / 24px / -0.02em letter-spacing
- H2: Inter SemiBold / 18px / -0.01em letter-spacing
- H3: Inter Medium / 14px / normal letter-spacing
- Body: Inter Regular / 16px / 1.5 line-height
- Small: Inter Regular / 14px / 1.4 line-height

### 6. Animation Utilities

Add CSS keyframes and custom properties in `src/main.css` for:

- `--transition-micro: 150ms ease` (button presses, form submissions)
- `--transition-page: 300ms ease` (page/tab transitions)
- `@keyframes pulse-subtle` (for budget alerts, maintenance warnings)
- `@keyframes shake-gentle` (for form validation errors)

## Acceptance Criteria

- [ ] App defaults to dark mode
- [ ] Background is deep dark zinc, not pure black
- [ ] Accent color is amber (warm), not blue
- [ ] Text uses Inter font
- [ ] Typography scale matches PRD
- [ ] Animation keyframes are defined and available
- [ ] No pure white (#fff) or pure black (#000) anywhere

---

### PHASE 1 — Agent 2: Recurring Reminders Backend

## Mission

The PRD specifies a "Recurring Maintenance Reminders" feature that can create time-based and
mileage-based reminders that auto-generate maintenance events. This entire feature is missing from
the backend. Build the complete server-side implementation.

## Files You Own (ONLY modify these)

- `prisma/schema.prisma` — add RecurringReminder model
- `server/validators/schemas.ts` — add Zod schemas for reminders
- `server/routes/reminders.ts` — NEW file, create reminder CRUD routes
- `server/index.ts` — register the new reminders route

## DO NOT TOUCH

Any frontend files, any other server route files.

## Requirements

### 1. Prisma Schema — RecurringReminder Model

Add to `prisma/schema.prisma`:

```prisma
model RecurringReminder {
  id                   String   @id @default(cuid())
  vehicleId            String
  category             String
  title                String
  description          String?
  recurrenceType       String   // 'time', 'mileage', 'both'
  mileageInterval      Int?     // e.g., 5000 (km)
  timeInterval         Int?     // e.g., 3
  timeUnit             String?  // 'days', 'weeks', 'months', 'years'
  lastCompletedDate    String?
  lastCompletedMileage Int?
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
}
```

Also add `reminders RecurringReminder[]` to the existing `Vehicle` model's relations.

After modifying the schema, generate a new migration.

### 2. Zod Validators — `server/validators/schemas.ts`

Add at the end of the file:

```typescript
// Recurring Reminder schemas
export const reminderCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  category: maintenanceCategorySchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  recurrenceType: z.enum(['time', 'mileage', 'both']),
  mileageInterval: z.number().int().min(1).optional().nullable(),
  timeInterval: z.number().int().min(1).optional().nullable(),
  timeUnit: z.enum(['days', 'weeks', 'months', 'years']).optional().nullable(),
  lastCompletedDate: z.string().optional().nullable(),
  lastCompletedMileage: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().default(true)
})

export const reminderUpdateSchema = reminderCreateSchema.partial().omit({ vehicleId: true })
```

Add refinement: if recurrenceType is 'time' or 'both', require timeInterval + timeUnit. If 'mileage'
or 'both', require mileageInterval.

### 3. API Routes — `server/routes/reminders.ts` (NEW FILE)

Create a full CRUD router:

- `GET /` — list reminders, optional `?vehicleId=` filter
- `GET /:id` — get single reminder
- `POST /` — create reminder (validate with reminderCreateSchema)
- `PUT /:id` — update reminder (validate with reminderUpdateSchema)
- `PATCH /:id/toggle` — toggle isActive (convenience endpoint)
- `PATCH /:id/complete` — mark last completion (update lastCompletedDate, lastCompletedMileage)
- `DELETE /:id` — delete reminder
- `POST /:vehicleId/generate-events` — check all active reminders for a vehicle and auto-create
  MaintenanceEvent records where none exist for that category (duplicate prevention). This is the
  core auto-generation logic.

The generate-events endpoint should:

1. Get all active reminders for the vehicle
2. For each reminder, check if a non-completed MaintenanceEvent exists for that category
3. If none exists, calculate the next due date/mileage and create a scheduled event
4. Return the list of newly created events

### 4. Route Registration — `server/index.ts`

Add the import and route:

```typescript
import { remindersRouter } from './routes/reminders'
// ... in the api routes section:
api.route('/reminders', remindersRouter)
```

## Acceptance Criteria

- [ ] RecurringReminder model exists in Prisma schema
- [ ] Migration generated and applicable
- [ ] All CRUD endpoints work
- [ ] Generate-events endpoint creates events only when needed (no duplicates)
- [ ] Toggle and complete endpoints modify the correct fields
- [ ] Zod validation rejects invalid reminder configurations

---

### PHASE 1 — Agent 3: Budget Period-Scoped Backend

## Mission

The budget feature currently compares the budget amount against ALL-TIME total spending. The PRD
requires spending to be scoped to the budget's period (monthly or yearly). Fix the backend to
support period-filtered expense stats.

## Files You Own (ONLY modify these)

- `server/routes/expenses.ts`
- `server/routes/budgets.ts`

## DO NOT TOUCH

Any other files.

## Requirements

### 1. Period-Scoped Stats Endpoint

In `server/routes/expenses.ts`, modify the existing `GET /stats/:vehicleId` endpoint (or add a new
`GET /stats/:vehicleId/period` endpoint) to accept optional `period` and `startDate` query
parameters:

```text
GET /expenses/stats/:vehicleId?period=monthly&startDate=2026-02-01
GET /expenses/stats/:vehicleId?period=yearly&startDate=2026-01-01
```

Logic:

- If `period=monthly`: filter expenses where `date >= startDate` AND `date < startDate + 1 month`
- If `period=yearly`: filter expenses where `date >= startDate` AND `date < startDate + 1 year`
- If no period param: return all-time stats (backwards compatible)

The response shape stays the same:

```json
{
  "totalSpending": 450.0,
  "partsCost": 200.0,
  "laborCost": 200.0,
  "otherCost": 50.0,
  "count": 3
}
```

### 2. Budget Endpoint Enhancement

In `server/routes/budgets.ts`, modify `GET /:vehicleId` to also return the current period's spending
alongside the budget data. This means fetching the budget AND the period-scoped expense stats in one
call:

```json
{
  "id": "...",
  "vehicleId": "...",
  "amount": 2000,
  "period": "yearly",
  "startDate": "2026-01-01",
  "currentSpending": 450.0
}
```

Calculate `currentSpending` by querying expenses filtered to the current period window based on the
budget's `period` and `startDate` fields.

## Acceptance Criteria

- [ ] Stats endpoint supports period filtering via query params
- [ ] Budget endpoint returns currentSpending for the active period
- [ ] All-time stats still work when no period is specified (backwards compatible)
- [ ] Monthly period correctly scopes to single calendar month
- [ ] Yearly period correctly scopes to single calendar year

---

### PHASE 1 — Agent 4: Expense History UI Improvements

## Mission

The ExpenseHistory component is missing search, filter, edit, and delete functionality required by
the PRD. Add all four capabilities.

## Files You Own (ONLY modify these)

- `src/components/ExpenseHistory.tsx`

## DO NOT TOUCH

Any other files. Use the existing API functions already available from `@/lib/api` (expensesApi) and
hooks from `@/hooks/use-api` (useDeleteExpense).

## Requirements

### 1. Search

Add a text search input at the top of the ExpenseHistory component that filters the displayed
expenses client-side. Search should match against:

- Event title (via getEventTitle)
- Garage name
- Description
- Date (formatted)

Use a controlled input with local state. Filter the `sortedExpenses` array before rendering.

### 2. Filters

Add filter controls below the search bar:

- **Date range:** Two date inputs (from/to) to filter by expense date
- **Min/Max cost:** Two number inputs to filter by totalCost range

All filters are client-side (the data is already loaded). Combine with search.

### 3. Edit Action

Add an edit button (pencil icon) to each expense row (desktop table) and mobile card. On click, it
should call a new `onEdit` callback prop:

```typescript
interface ExpenseHistoryProps {
  expenses: Expense[]
  events: MaintenanceEvent[]
  onEdit?: (expense: Expense) => void // NEW
  onDelete?: (expenseId: string) => void // NEW
}
```

### 4. Delete Action

Add a delete button (trash icon) to each expense row and mobile card. On click, show a confirmation
(use `window.confirm()` for now) then call `onDelete`.

### 5. UI Details

- Use Phosphor icons (`MagnifyingGlass`, `PencilSimple`, `Trash`, `Funnel`) — NOT lucide
- Search input: full width, with search icon on the left
- Filter section: collapsible (default collapsed), toggle with a "Filters" button
- Maintain the existing responsive table (desktop) / card (mobile) layout
- Show "No results" message when search/filters produce empty results
- Show count of filtered results vs total: "Showing X of Y expenses"

## Acceptance Criteria

- [ ] Search input filters expenses across multiple fields
- [ ] Date range filter works correctly
- [ ] Cost range filter works correctly
- [ ] Edit button calls onEdit with the expense object
- [ ] Delete button shows confirmation then calls onDelete
- [ ] All new icons are from @phosphor-icons/react
- [ ] Mobile card layout includes edit/delete buttons
- [ ] "Showing X of Y" counter visible

---

### PHASE 1 — Agent 5: Maintenance Timeline Delete UI

## Mission

The MaintenanceTimeline component is missing a delete button for events. The PRD requires full CRUD.
Add delete functionality.

## Files You Own (ONLY modify these)

- `src/components/MaintenanceTimeline.tsx`

## DO NOT TOUCH

Any other files.

## Requirements

### 1. Delete Button

Add a delete button to each `EventCard` alongside the existing "Mark Complete" and "Add Expense"
buttons. The delete button should:

- Use the `Trash` icon from `@phosphor-icons/react` (already in the project)
- Be `variant="outline"` with destructive styling and `size="sm"`
- Show a `window.confirm()` dialog before calling the callback
- Be visible for ALL events (scheduled and completed)

### 2. New Prop

Add an `onDelete` callback prop to the component:

```typescript
interface MaintenanceTimelineProps {
  events: MaintenanceEvent[]
  onEventClick: (event: MaintenanceEvent) => void
  onAddExpense: (eventId: string) => void
  onMarkComplete: (eventId: string) => void
  onDelete: (eventId: string) => void // NEW
}
```

### 3. Button Layout

In the EventCard, the buttons column currently has "Mark Complete" and "Add Expense" stacked
vertically. Add the delete button below them:

- Mark Complete (Check icon)
- Add Expense (Plus icon)
- Delete (Trash icon, destructive appearance)

For completed events (where Mark Complete and Add Expense are hidden), show only the Delete button.

## Acceptance Criteria

- [ ] Delete button visible on all event cards
- [ ] Confirmation dialog before deletion
- [ ] onDelete callback fires with the correct eventId
- [ ] Delete button uses Phosphor Trash icon
- [ ] Visual styling indicates destructive action (red/destructive tones)
- [ ] Completed events show only the delete button

---

### PHASE 2 — Agent 6: Core Integration (App Restructure + API Layer)

> **Prerequisite:** All Phase 1 branches merged into main.

## Mission

Restructure the main App component to support multi-vehicle switching, a Reminders tab, and a
Calendar view. Also update the API layer and hooks to integrate with the new backend endpoints from
Phase 1 (reminders API + period-scoped budget stats).

## Files You Own (ONLY modify these)

- `src/App.tsx`
- `src/lib/api.ts`
- `src/hooks/use-api.ts`
- `src/lib/types.ts`
- `src/components/VehicleSelector.tsx` — NEW file
- `src/components/MaintenanceCalendar.tsx` — NEW file

## DO NOT TOUCH

Any server files, any other component files, theme files, or style files.

## Requirements

### 1. API Layer — `src/lib/api.ts`

Add a `remindersApi` object with all endpoints matching the backend:

```typescript
export const remindersApi = {
  getAll: (vehicleId?: string) =>
    fetchApi<RecurringReminder[]>(vehicleId ? `/reminders?vehicleId=${vehicleId}` : '/reminders'),
  getById: (id: string) => fetchApi<RecurringReminder>(`/reminders/${id}`),
  create: (reminder: Omit<RecurringReminder, 'id' | 'createdAt'>) =>
    fetchApi<RecurringReminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder)
    }),
  update: (id: string, reminder: Partial<RecurringReminder>) =>
    fetchApi<RecurringReminder>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reminder)
    }),
  toggleActive: (id: string) =>
    fetchApi<RecurringReminder>(`/reminders/${id}/toggle`, { method: 'PATCH' }),
  markComplete: (id: string, data: { completedDate: string; completedMileage?: number }) =>
    fetchApi<RecurringReminder>(`/reminders/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  delete: (id: string) => fetchApi<{ success: boolean }>(`/reminders/${id}`, { method: 'DELETE' }),
  generateEvents: (vehicleId: string) =>
    fetchApi<MaintenanceEvent[]>(`/reminders/${vehicleId}/generate-events`, {
      method: 'POST'
    })
}
```

Update `budgetsApi.getByVehicle` to expect the new response shape that includes `currentSpending`.

Update `expensesApi.getStats` to accept optional `period` and `startDate` params.

### 2. Hooks — `src/hooks/use-api.ts`

Add hooks:

```typescript
// Reminder hooks
export const useReminders = (vehicleId?: string) => { ... }
export const useCreateReminder = () => { ... }
export const useUpdateReminder = () => { ... }
export const useToggleReminder = () => { ... }
export const useDeleteReminder = () => { ... }
export const useGenerateReminderEvents = () => { ... }
```

Update `useExpenseStats` to pass period params when available.

### 3. Types — `src/lib/types.ts`

Ensure `RecurringReminder` interface matches the Prisma model. The type already exists in the file
but verify it has all fields matching the new schema (especially `updatedAt` if added).

### 4. Multi-Vehicle Support — `src/App.tsx`

Currently the app hardcodes `const vehicle = vehicles?.[0]`. Change this:

- Add a `selectedVehicleId` state
- Default to the first vehicle's ID
- Render a `<VehicleSelector>` in the header that lets users switch vehicles
- Show an "Add Vehicle" button in the header even when vehicles exist

### 5. VehicleSelector Component — `src/components/VehicleSelector.tsx` (NEW)

Create a dropdown/select that:

- Shows "Year Make Model" for each vehicle
- Highlights the currently selected vehicle
- Has an "Add Vehicle" option at the bottom
- Uses the `Select` component from `@/components/ui/select`
- Props: `vehicles: Vehicle[]`, `selectedId: string`, `onSelect: (id: string) => void`,
  `onAddNew: () => void`

### 6. Add Reminders Tab — `src/App.tsx`

Change the tabs from 3 to 4:

Dashboard | Maintenance | Expenses | Reminders

The Reminders tab should render:

- An "Add Reminder" button at the top
- `<RecurringReminderList>` (existing orphaned component — will be updated by Agent 7)
- Wired to reminder hooks for CRUD operations

### 7. Add Calendar View — `src/components/MaintenanceCalendar.tsx` (NEW)

Create a simple calendar view component that:

- Displays the current month in a grid
- Highlights dates that have scheduled maintenance events
- Allows clicking a date to see events for that day
- Has prev/next month navigation
- Uses the existing `calendar.tsx` shadcn primitive if suitable, or builds a simple custom grid
- Props: `events: MaintenanceEvent[]`, `onEventClick: (event: MaintenanceEvent) => void`,
  `onDateClick: (date: string) => void`

Add the calendar as a sub-section in the Maintenance tab (above or alongside the timeline).

### 8. Wire Delete Actions

The MaintenanceTimeline now accepts `onDelete` (from Agent 5) and ExpenseHistory now accepts
`onEdit`/`onDelete` (from Agent 4). Wire these callbacks in `App.tsx`:

- `onDelete` for maintenance: call `useDeleteMaintenanceEvent` (hook already exists)
- `onDelete` for expenses: call `useDeleteExpense` (hook already exists)
- `onEdit` for expenses: open the expense dialog in edit mode

## Acceptance Criteria

- [ ] Vehicle selector in header allows switching between vehicles
- [ ] "Add Vehicle" available even with existing vehicles
- [ ] 4 tabs: Dashboard, Maintenance, Expenses, Reminders
- [ ] Reminders tab renders RecurringReminderList with CRUD wiring
- [ ] Calendar component renders in Maintenance tab
- [ ] API layer has complete remindersApi
- [ ] All new hooks follow existing patterns (React Query mutations + invalidation)
- [ ] Delete callbacks wired for both maintenance events and expenses

---

### PHASE 2 — Agent 7: Component Updates (Budget + Reminders Frontend)

> **Prerequisite:** All Phase 1 branches merged into main.

## Mission

Update the orphaned reminder components and the BudgetOverview component to use the backend API and
match the PRD requirements. These components exist but are either unused (reminders) or incomplete
(budget).

## Files You Own (ONLY modify these)

- `src/components/BudgetOverview.tsx`
- `src/components/RecurringReminderForm.tsx`
- `src/components/RecurringReminderList.tsx`
- `src/components/UpcomingReminders.tsx`
- `src/hooks/use-recurring-reminders.ts`

## DO NOT TOUCH

Any other files (App.tsx, api.ts, use-api.ts are owned by Agent 6).

## Requirements

### 1. BudgetOverview — Period-Scoped Display

The backend now returns `currentSpending` alongside the budget. Update `BudgetOverview`:

- Change props to accept `currentSpending` from the budget response instead of a separate
  `actualSpending` prop:

  ```typescript
  interface BudgetOverviewProps {
    budget?: Budget & { currentSpending?: number }
    onUpdateBudget: (budget: Budget) => void
  }
  ```

- Use `budget.currentSpending` instead of the external `actualSpending` prop

### 2. BudgetOverview — Multi-Threshold Progress Bar

The `_getProgressColor` function exists but is unused. Fix this:

- Remove the underscore prefix (make it active)
- Apply the color to the Progress component. Since shadcn's `<Progress>` uses CSS variables, add a
  dynamic className or inline style:
  - `< 80%` usage → green indicator (e.g., `bg-green-500` on the indicator)
  - `80-99%` usage → amber/warning (e.g., `bg-amber-500`)
  - `>= 100%` → red/destructive (e.g., `bg-destructive`)
- Wrap the `<Progress>` in a div that applies the color via a CSS class

### 3. BudgetOverview — Monthly/Yearly Toggle

Add a toggle or tab bar at the top of the budget card to switch between viewing monthly and yearly
budget. When the period changes:

- Call `onUpdateBudget` with the new period
- The spending display updates to reflect the new period

### 4. RecurringReminderForm — API Integration

The form currently manages local state and calls `onSave` with a full `RecurringReminder` object.
This pattern is fine — the parent (App.tsx, managed by Agent 6) will handle the API call. Only make
these adjustments:

- Remove the `generateId()` call for new reminders (the backend generates IDs with cuid())
- Set `id: ''` for new reminders (or omit it from the submit payload)
- Ensure form fields match the backend schema exactly:
  - `recurrenceType`: 'time' | 'mileage' | 'both'
  - `timeUnit`: 'days' | 'weeks' | 'months' | 'years'
- Use Phosphor icons consistently (replace any lucide imports if present)

### 5. RecurringReminderList — No Changes Needed

This component already accepts the right props (`reminders`, `onEdit`, `onDelete`,
`onToggleActive`). Verify it works correctly with the API data shape. Only fix if needed.

### 6. UpcomingReminders — Dashboard Integration

This component shows upcoming reminders on the dashboard. It already accepts:

```typescript
interface UpcomingRemindersProps {
  reminders: RecurringReminder[]
  vehicle: Vehicle
  onAddReminder: () => void
}
```

This is correct. Only adjust if the `RecurringReminder` type changes.

### 7. use-recurring-reminders.ts — Refactor for Backend

The current hook operates on client-side state (calling `setMaintenanceEvents`). This is now
obsolete because the backend handles event generation via the `/generate-events` endpoint.

Refactor this hook to:

- Remove the client-side event generation logic
- Export a simpler hook that calls the `generateEvents` API endpoint on mount/interval
- When events are marked complete, update the reminder's `lastCompletedDate`/`lastCompletedMileage`
  via the API

Since this hook cannot import from `use-api.ts` (owned by Agent 6), use `remindersApi` from
`@/lib/api` directly with `useQuery`/`useMutation` from TanStack:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { remindersApi } from '@/lib/api'
```

Wait — `@/lib/api.ts` is owned by Agent 6 who adds `remindersApi`. If Agent 6 and Agent 7 run in
PARALLEL, you cannot import `remindersApi` yet.

**WORKAROUND:** Define a local `fetchReminders` function in this file using the raw `fetch` API
pattern, matching the endpoint structure. OR, simply export the hook shell with a TODO comment and
let the merge resolution connect them.

**RECOMMENDED:** Keep the existing hook as-is but mark it deprecated with a comment. The real
integration will happen when Agent 6's API layer is merged. Focus your effort on the component
files.

## Acceptance Criteria

- [ ] BudgetOverview uses period-scoped spending
- [ ] Progress bar changes color at 80% and 100% thresholds
- [ ] Monthly/yearly period toggle exists
- [ ] RecurringReminderForm submits clean data matching backend schema
- [ ] RecurringReminderList renders correctly with API data
- [ ] UpcomingReminders works with current type definitions
- [ ] No lucide icons — all Phosphor

---

### PHASE 3 — Agent 8: UX Polish & Edge Cases

> **Prerequisite:** Phase 1 and Phase 2 branches all merged.

## Mission

Apply final UX polish to match the PRD: animations, loading states, icon consistency, tap targets,
odometer validation, and mobile improvements.

## Files You Own (ONLY modify these)

- `src/components/UpcomingChecks.tsx`
- `src/components/ChecksHistory.tsx`
- `src/components/VehicleForm.tsx`
- `src/components/VehicleProfile.tsx`
- `src/components/ExpenseForm.tsx`
- `src/components/MaintenanceEventForm.tsx`

## DO NOT TOUCH

Theme files (already updated), App.tsx, api/hooks files, or components updated in Phase 1-2.

## Requirements

### 1. Icon Consistency — Replace Lucide with Phosphor

In `UpcomingChecks.tsx` and `ChecksHistory.tsx`, replace ALL lucide-react imports:

- `CheckCircle2` → `CheckCircle` from `@phosphor-icons/react`
- `Clock` → `Clock` from `@phosphor-icons/react`
- `ChevronDown` → `CaretDown` from `@phosphor-icons/react`
- `ChevronUp` → `CaretUp` from `@phosphor-icons/react`

Remove the `import { ... } from 'lucide-react'` lines entirely.

### 2. Tap Targets — Minimum 44px

In `UpcomingChecks.tsx`, the complete button uses `className="h-7 px-2"` (28px). Change to minimum
`h-11` (44px) for touch accessibility. Check all interactive elements in the owned files and ensure
they meet 44px minimum.

### 3. Odometer Backwards Prevention — `VehicleForm.tsx`

When editing an existing vehicle (not creating new), the odometer input should not allow values
lower than the current odometer. Add:

- A `min` attribute set to the existing vehicle's `currentOdometer` when in edit mode
- A validation message: "Odometer cannot go backwards"
- Visual feedback (red border) when invalid

### 4. Button Loading States

In all form components (`VehicleForm.tsx`, `ExpenseForm.tsx`, `MaintenanceEventForm.tsx`):

- Accept an optional `isSubmitting` prop
- When true: disable the submit button, show a `Spinner` icon from `@phosphor-icons/react`, change
  text to "Saving..."
- Use the `--transition-micro` (150ms) CSS variable for the transition

### 5. Form Validation Shake

When a form submission fails validation, add a brief shake animation to the form container:

- Apply the `shake-gentle` keyframe (defined by Agent 1 in Phase 1)
- Use a CSS class like `animate-shake` applied conditionally

### 6. Collapsible Vehicle Profile

In `VehicleProfile.tsx`, wrap the details grid in a `Collapsible` component (already available from
shadcn/ui). Show vehicle name and mileage in the always-visible header. Details (VIN, fuel type,
engine, etc.) collapse on mobile.

### 7. Micro-Interactions

Add `transition-all duration-150` to all buttons in the owned components for smooth hover/active
state changes.

## Acceptance Criteria

- [ ] Zero lucide-react imports in UpcomingChecks.tsx and ChecksHistory.tsx
- [ ] All tap targets >= 44px (h-11 minimum)
- [ ] Odometer cannot be set lower than current value when editing
- [ ] Submit buttons show loading state
- [ ] Form validation shake animation works
- [ ] VehicleProfile details are collapsible on mobile
- [ ] All buttons have 150ms transitions

---

## Execution Checklist

### Phase 1 (5 agents in parallel)

- [ ] Agent 1: Theme & Design System
- [ ] Agent 2: Recurring Reminders Backend
- [ ] Agent 3: Budget Period-Scoped Backend
- [ ] Agent 4: Expense History UI
- [ ] Agent 5: Maintenance Timeline Delete
- [ ] All 5 branches merged to main

### Phase 2 (2 agents in parallel)

- [ ] Agent 6: Core Integration
- [ ] Agent 7: Component Updates
- [ ] Both branches merged to main

### Phase 3 (1 agent)

- [ ] Agent 8: UX Polish & Edge Cases
- [ ] Branch merged to main

### Final Verification

- [ ] `bun run typecheck` passes
- [ ] `bun run lint:check` passes
- [ ] `bun run build` succeeds
- [ ] App starts and all 4 tabs work
- [ ] Multi-vehicle switching works
- [ ] Recurring reminders CRUD works
- [ ] Budget shows period-scoped spending
- [ ] Expense search/filter/edit/delete work
- [ ] Delete works on maintenance events
- [ ] Calendar view renders events
- [ ] Dark amber/zinc theme applied
- [ ] Inter font renders correctly
- [ ] All icons are Phosphor (no lucide)
