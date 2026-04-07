# Foundry Management System - Design Guidelines

## Design Approach: Carbon Design System (Enterprise Data Application)

**Rationale**: This is a utility-focused, information-dense enterprise application requiring clarity, efficiency, and consistent data presentation. Carbon Design System excels at complex data tables, dashboard layouts, and workflow management interfaces.

**Core Principles**:
- Clarity over decoration - every element serves a functional purpose
- Scannable information architecture for rapid data comprehension
- Consistent patterns across all modules for reduced cognitive load
- Accessibility-first color coding with proper contrast ratios

---

## Color Palette

### Status Color System (Both Modes)
The color-coded workflow system is critical for at-a-glance job status recognition:

- **Blue** (213 94% 60%): New Jobs - Fresh, actionable items
- **Yellow** (45 95% 55%): In Progress - Active work indicator
- **Purple** (270 70% 65%): Solidification/Casting - Specialized process
- **Indigo** (238 75% 65%): CAD Work - Technical design phase
- **Orange** (25 95% 60%): Waiting on CAM - External dependency
- **Pink** (330 75% 65%): Waiting on Sample - Review stage
- **Green** (142 70% 55%): Completed - Success state

### UI Color Scheme

**Dark Mode** (Primary):
- Background: 220 15% 12%
- Surface: 220 12% 16%
- Elevated Surface: 220 10% 20%
- Border: 220 10% 28%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%
- Interactive Primary: 213 94% 60%

**Light Mode**:
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Border: 220 10% 88%
- Text Primary: 220 15% 20%
- Text Secondary: 220 10% 45%

---

## Typography

**Font Stack**: System fonts for performance and consistency
- Primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

**Type Scale**:
- Page Headers: 28px/32px, font-weight 600
- Section Headers: 20px/24px, font-weight 600
- Card Headers: 16px/20px, font-weight 600
- Body Text: 14px/20px, font-weight 400
- Table Data: 13px/18px, font-weight 400
- Labels/Captions: 12px/16px, font-weight 500

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 or p-6
- Section spacing: py-8 or py-12
- Card spacing: p-6
- Form field gaps: gap-4
- Table cell padding: px-4 py-3

**Grid Structure**:
- Sidebar: Fixed 256px width (collapsed: 64px icon-only)
- Main content: Fluid with max-width: 1920px
- Dashboard metric boxes: 7-column grid on desktop, 2-column on tablet, 1-column on mobile
- Detail cards: 4-column grid (stackable on smaller screens)

---

## Component Library

### Navigation & Layout

**Sidebar Navigation**:
- Dark surface with subtle elevation
- Icon + label for expanded state (16px icons)
- Icon-only for collapsed state
- Active state: Highlighted background with left border accent
- Hover state: Subtle background lightening
- Group separators with thin horizontal rules

**Header Bar**:
- Sticky positioning, elevated shadow
- Application title (left), user profile + theme toggle (right)
- Height: 64px, subtle bottom border

### Dashboard Components

**Metric Boxes** (Analytics Overview):
- Square aspect ratio cards with gradient backgrounds matching status colors
- Large numeric value (36px, font-weight 700)
- Label below (14px, uppercase, letter-spacing)
- Hover: Darken gradient 10%, scale to 105%, smooth transition
- Clickable with cursor pointer
- Subtle shadow on elevation

**Status Section Tables**:
- Zebra striping for row alternation (subtle)
- Hover state: Background highlight
- Compact row height (40px) for data density
- Column headers: Bold, slightly darker background, sticky on scroll
- Badges for status indicators: Rounded, small padding, status-colored background

### Data Tables (Job Information, etc.)

**Table Structure**:
- Full-width with horizontal scroll for 20+ columns
- Fixed first column (Job #) for context while scrolling
- Minimum column width: 120px, flexible growth
- Row height: 48px for comfortable scanning
- Cell padding: px-4 py-3

**Row Interactions**:
- Single-click: Highlight row with blue background tint, show details panel below
- Double-click/Edit button: Open modal form
- Hover: Subtle background change for affordance

**Status Badges**:
- Small, rounded pills with status color background
- White text for contrast
- Positioned left in status column

### Details Panel (Below Selected Row)

**Layout**: 4 cards in horizontal grid, equal width
- Card headers: Status-colored background (purple, indigo, pink, orange)
- White text on colored headers
- Content area: Dark/light surface background
- Field labels: Text-secondary color, 12px
- Field values: Text-primary color, 14px, font-weight 500
- Vertical spacing between fields: gap-3
- "No data available" state: Centered, muted text

### Modal Forms

**Overlay**: Semi-transparent black (bg-black/60), backdrop blur effect

**Modal Container**:
- White (light mode) / Dark surface (dark mode)
- Max-width: 1024px, max-height: 90vh
- Rounded corners (8px)
- Elevated shadow for depth
- Centered on viewport

**Form Layout**:
- Two-column grid for most fields
- Labels: 160px width, right-aligned, text-secondary
- Inputs: Flex-grow, standard input styling
- Vertical spacing: gap-y-2 for compact density
- Form sections separated by subtle dividers

**Form Controls**:
- Text inputs: Border, rounded, padding, focus ring in primary color
- Textareas: 3 rows minimum, resizable
- Checkboxes: Styled with primary color when checked
- File upload: Dashed border drop zone, drag-and-drop feedback

**Modal Header**: 
- Sticky, slightly elevated background
- Title (left, 20px bold), Close button (right, 24px icon)

**Modal Footer**:
- Sticky, elevated background
- Buttons right-aligned: Cancel (outline), Save (primary filled)
- Button spacing: gap-3

### File Upload Section

**Upload Zone**:
- Dashed border, rounded
- Drag-and-drop area with hover state (border color change)
- Upload icon centered with instructional text
- File list below with preview thumbnails
- Each file: Name, size, delete button, download link

### User Management

**User Table**:
- Columns: Name, Email, Role, Permissions, Actions
- Role badges: Colored (Admin=red, Manager=blue, Designer=purple, Operator=gray)
- Permissions: Multi-select checkboxes for each menu item
- Inline editing or modal form for permission changes

---

## Interaction Patterns

**Loading States**: Skeleton screens for tables, spinner for forms
**Empty States**: Icon + message for empty sections
**Error States**: Red border on inputs, error message below
**Success Feedback**: Green toast notification, auto-dismiss
**Delete Confirmations**: Modal dialog with warning icon

---

## Accessibility

- All status colors meet WCAG AA contrast requirements against backgrounds
- Keyboard navigation throughout (Tab, Enter, Escape)
- Focus indicators visible on all interactive elements
- Screen reader labels for icon-only buttons
- Dark mode designed for reduced eye strain during extended use
- Color is never the only indicator (icons/text accompany status colors)

---

## Responsive Behavior

- Desktop (1280px+): Full multi-column layouts, expanded sidebar
- Tablet (768-1279px): Sidebar collapsible, 2-column grids reduce to 1-column for detail cards
- Mobile (<768px): Hamburger menu, single column stacking, horizontal scrolling for wide tables with fixed first column

---

## Animation & Motion

**Minimal, purposeful animations**:
- Sidebar collapse/expand: 200ms ease
- Modal open/close: 150ms ease with fade + scale
- Hover states: 100ms ease
- Row selection: Instant highlight, no transition
- No decorative animations - focus on data clarity