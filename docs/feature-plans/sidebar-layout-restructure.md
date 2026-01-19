# Sidebar Layout Restructure

## Overview
Restructure the application layout to include a collapsible left sidebar for page-specific configuration and tools, separating concerns from the main content view.

## Requirements
- Left sidebar (300px expanded) with two sections: Configuration (top) and Tools (bottom)
- Collapsible to thin rail (~48px) on desktop with expand button
- Responsive: drawer on mobile devices
- Page-specific content: each page defines its own config/tools
- Sidebar hidden entirely when page has no config/tools content
- Persist collapsed/expanded state to localStorage

## Architecture

### Layout Structure
```
┌─────────────────────────────────────────────┐
│                  AppBar                      │
├────────┬────────────────────────────────────┤
│        │                                    │
│ Config │                                    │
│        │         Main View                  │
├────────┤         (Page Content)             │
│        │                                    │
│ Tools  │                                    │
│        │                                    │
└────────┴────────────────────────────────────┘
```

### New Components

1. **SidebarContext** (`contexts/SidebarContext.tsx`)
   - Manages sidebar state (collapsed, content)
   - Provides methods for pages to register content
   - Persists collapsed preference

2. **Sidebar** (`components/layout/Sidebar.tsx`)
   - Main sidebar component
   - Handles collapse/expand animation
   - Renders Config and Tools sections
   - Shows thin rail when collapsed

3. **SidebarSection** (`components/layout/SidebarSection.tsx`)
   - Reusable section component with title
   - Used for both Config and Tools sections

4. **useSidebar hook** (`hooks/useSidebar.ts`)
   - Hook for pages to provide their sidebar content
   - Cleans up content on unmount

### Component API

```tsx
// In a page component
const TransactionsPage = () => {
  useSidebar({
    config: <TransactionFilters />,
    tools: <TransactionTools />
  });

  return <TransactionList />;
};
```

### Dimensions
- Expanded width: 300px
- Collapsed width: 48px (thin rail)
- Transition duration: 200ms

## Implementation Plan

### Phase 1: Core Infrastructure
- [ ] Create SidebarContext with state management
- [ ] Create useSidebar hook
- [ ] Create Sidebar component with collapse/expand
- [ ] Create SidebarSection component
- [ ] Update Layout to include Sidebar

### Phase 2: Page Migration (Proof of Concept)
- [ ] Migrate Transactions page
  - Extract filters to TransactionFilters component
  - Add any tools (export, bulk actions)

### Phase 3: Remaining Pages
- [ ] Migrate Calendar page (month/year navigation tools)
- [ ] Migrate Accounts page
- [ ] Migrate Analytics pages (date range, account filters)
- [ ] Migrate Categories page
- [ ] Migrate Rules page
- [ ] Migrate Budgets page
- [ ] Review Dashboard, Bank Sync, Development pages

## Technical Notes

### State Management
- Collapsed state stored in localStorage (`budget-tracker-sidebar-collapsed`)
- Content state managed via React context (not persisted)

### Responsive Behavior
- Desktop (md+): Collapsible sidebar
- Mobile (<md): Hidden by default, opens as drawer

### Animation
- Use MUI's Drawer component with variant switching
- CSS transitions for width changes

## Progress Log

### [Date] - Initial Setup
- Created feature plan
- Created feature branch

