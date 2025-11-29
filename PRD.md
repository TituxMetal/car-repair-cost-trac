# Car Maintenance Tracker

A proactive car maintenance and cost tracking application that helps vehicle owners manage service schedules, track expenses, and avoid unexpected costly breakdowns.

**Experience Qualities**:
1. **Organized** - Every maintenance record, expense, and schedule is instantly accessible in a clean, structured format
2. **Proactive** - Visual cues and upcoming maintenance lists help users stay ahead of vehicle needs
3. **Empowering** - Clear budget tracking and cost analysis help users make informed decisions about vehicle maintenance

**Complexity Level**: Light Application (multiple features with basic state)
The app manages persistent vehicle data, maintenance schedules, and expense tracking with multiple interconnected views, but doesn't require advanced features like real-time sync or user accounts.

## Essential Features

### Car Profile Management
- **Functionality**: Store and edit comprehensive vehicle information (make, model, year, VIN, mileage, etc.)
- **Purpose**: Centralize all vehicle data for accurate tracking and maintenance planning
- **Trigger**: User clicks "Add Vehicle" or "Edit Profile" from dashboard
- **Progression**: Dashboard → Profile Form → Input Details → Save → Return to Dashboard
- **Success criteria**: Vehicle data persists between sessions and displays accurately across all views

### Maintenance Event Scheduling
- **Functionality**: Create, view, and manage scheduled maintenance events (services, part replacements, mileage/date-based checks)
- **Purpose**: Enable proactive maintenance planning to prevent breakdowns
- **Trigger**: User clicks "Schedule Maintenance" or views calendar
- **Progression**: Dashboard/Calendar → Event Form → Select Type & Category → Set Date/Mileage → Add Appointment Details → Save
- **Success criteria**: Events display in chronological order, support both past and future dates, can be marked complete

### Recurring Maintenance Reminders
- **Functionality**: Create time-based (e.g., every 3 months) or mileage-based (e.g., every 5,000 km) recurring reminders that automatically generate maintenance events
- **Purpose**: Automate regular maintenance tracking so users never miss critical service intervals
- **Trigger**: User clicks "Add Reminder" in Reminders tab
- **Progression**: Reminders Tab → Create Reminder Form → Select Category → Choose Recurrence Type (Time/Mileage/Both) → Set Interval → Save → Auto-generates events
- **Success criteria**: Reminders automatically create scheduled events when none exist, update last completion date/mileage when events are marked complete, can be toggled active/inactive

### Expense Tracking & Logging
- **Functionality**: Record detailed costs for maintenance events (parts, labor, total) with metadata (garage, description)
- **Purpose**: Maintain complete financial history for budget analysis and decision-making
- **Trigger**: User completes a maintenance event or adds historical record
- **Progression**: Event Detail → Add Expense → Input Costs → Add Garage/Description → Save → View in History
- **Success criteria**: Expenses are linked to events, totals calculate accurately, history is searchable/filterable

### Budget Management & Analysis
- **Functionality**: Define yearly/monthly budget and compare against actual spending with visual indicators
- **Purpose**: Provide immediate financial oversight to determine if vehicle is cost-effective
- **Trigger**: User views dashboard or budget settings
- **Progression**: Dashboard → View Budget Status → Edit Budget (if needed) → See Actual vs Budget Comparison
- **Success criteria**: Budget comparison updates in real-time, clearly shows over/under budget status, supports both monthly and yearly views

## Edge Case Handling
- **Empty States**: Friendly prompts guide new users to add their first vehicle and schedule maintenance
- **Missing Data**: Optional fields allow flexible data entry; calculations work with partial information
- **Past Events**: Support logging historical maintenance for complete vehicle history
- **Odometer Updates**: Manual odometer entry with validation to prevent backwards mileage
- **Budget Overflow**: Clear visual indicators when spending exceeds budget without blocking functionality
- **Duplicate Reminders**: Prevents creating duplicate scheduled events when active reminders exist for the same category
- **Inactive Reminders**: Reminders can be deactivated without deletion to pause auto-generation of events

## Design Direction
The design should feel professional and automotive-inspired - think precision dashboard instruments rather than playful consumer apps. A darkish, sophisticated interface with zinc tones creates focus on the data while reducing eye strain during quick mobile entries. The minimal interface emphasizes clarity and speed of data entry.

## Color Selection
**Analogous (dark neutrals with accent)** - Creates a cohesive, professional tool feel with subtle warmth for interactive elements.

- **Primary Color**: Deep Zinc (oklch(0.28 0.01 255)) - Represents reliability and precision, used for primary actions and navigation
- **Secondary Colors**: 
  - Medium Zinc (oklch(0.45 0.01 255)) - Supporting elements, secondary buttons
  - Light Zinc (oklch(0.65 0.01 255)) - Borders and dividers
- **Accent Color**: Amber (oklch(0.75 0.15 85)) - Highlights upcoming maintenance and important financial alerts
- **Foreground/Background Pairings**:
  - Background (Dark Zinc oklch(0.15 0.01 255)): Light text (oklch(0.95 0 0)) - Ratio 11.2:1 ✓
  - Card (Medium Dark Zinc oklch(0.20 0.01 255)): Light text (oklch(0.95 0 0)) - Ratio 9.4:1 ✓
  - Primary (Deep Zinc oklch(0.28 0.01 255)): White text (oklch(1 0 0)) - Ratio 7.8:1 ✓
  - Secondary (Medium Zinc oklch(0.45 0.01 255)): White text (oklch(1 0 0)) - Ratio 4.7:1 ✓
  - Accent (Amber oklch(0.75 0.15 85)): Dark text (oklch(0.15 0 0)) - Ratio 8.9:1 ✓
  - Muted (Darker Zinc oklch(0.25 0.01 255)): Muted text (oklch(0.60 0 0)) - Ratio 4.6:1 ✓

## Font Selection
Clean, modern sans-serif typefaces that evoke technical precision and automotive instrumentation - Inter for its excellent readability at small sizes on mobile devices.

- **Typographic Hierarchy**:
  - H1 (Section Titles): Inter SemiBold / 24px / -0.02em letter spacing
  - H2 (Card Headers): Inter SemiBold / 18px / -0.01em letter spacing
  - H3 (Labels): Inter Medium / 14px / normal letter spacing
  - Body (Data/Forms): Inter Regular / 16px / normal letter spacing / 1.5 line height
  - Small (Metadata): Inter Regular / 14px / normal letter spacing / 1.4 line height

## Animations
Subtle, purposeful animations reinforce the app's reliability - smooth transitions between views and gentle feedback on interactions create confidence without distraction.

- **Purposeful Meaning**: Quick micro-interactions (150ms) for button presses and form submissions reinforce successful data entry; smooth page transitions (300ms) maintain spatial context
- **Hierarchy of Movement**: Budget status indicators and upcoming maintenance alerts use subtle pulse animations to draw attention; primary navigation uses slide transitions; form validations use gentle shake feedback

## Component Selection
- **Components**: 
  - Card (vehicle profile, maintenance events, budget overview) - with subtle shadows for depth
  - Dialog (add/edit forms for vehicle, events, expenses) - modal focus for data entry
  - Tabs (switch between upcoming/past maintenance, monthly/yearly budget)
  - Table (expense history, maintenance log) - with responsive mobile layout
  - Input/Label/Textarea (all form fields) - with focus states and validation
  - Button (primary actions, secondary navigation) - with loading states
  - Badge (event categories, status indicators) - color-coded by type
  - Progress (budget usage visualization) - with warning thresholds
  - Calendar (maintenance scheduling) - date picker integration
  - Select (dropdowns for categories, vehicle details)
  
- **Customizations**: 
  - Custom odometer input with numeric keyboard optimization
  - Custom budget progress bar with multi-threshold color coding (green/amber/red)
  - Custom event timeline component showing past and future maintenance
  
- **States**: 
  - Buttons: Default (zinc-700), Hover (zinc-600), Active (zinc-800), Disabled (zinc-900 with muted text)
  - Inputs: Default (zinc-800 border), Focus (amber-500 ring), Error (red-500 ring), Success (green-500 subtle ring)
  - Cards: Default (zinc-900), Hover (slight zinc-800 for interactive cards), Selected (zinc-700 with amber accent)
  
- **Icon Selection**: 
  - Wrench (maintenance/service)
  - GasPump (fuel-related)
  - Gauge (odometer/mileage)
  - Clock (time-based reminders)
  - ArrowsClockwise (recurring reminders)
  - Calendar (scheduling)
  - CurrencyDollar (expenses/budget)
  - Plus (add new)
  - PencilSimple (edit)
  - Check (complete task)
  - Warning (overdue/over budget)
  - Trash (delete)
  
- **Spacing**: 
  - Container padding: p-4 (mobile), p-6 (desktop)
  - Card internal spacing: p-4
  - Form field spacing: space-y-4 for vertical stacks
  - Section gaps: gap-4 (mobile), gap-6 (desktop)
  - Grid gaps: gap-3 for data grids
  
- **Mobile**: 
  - Stack all form fields vertically on mobile with full-width inputs
  - Convert tables to card-based lists on narrow screens
  - Bottom-anchored action buttons for thumb accessibility
  - Collapsible sections for vehicle details to save screen space
  - Touch-optimized minimum 44px tap targets for all interactive elements
