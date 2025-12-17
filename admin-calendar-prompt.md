Project Path: Zyron

Source Tree:

```txt
Zyron
├── app
│   └── globals.css
└── components
    └── admin
        ├── AdminCalendar.tsx
        └── admin-calendar-client.tsx

```

`app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@font-face {
  font-family: 'Circe';
  src: url('/fonts/Circe-Regular.woff2') format('woff2'),
       url('/fonts/Circe-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Circe';
  src: url('/fonts/Circe-Bold.woff2') format('woff2'),
       url('/fonts/Circe-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Circe';
  src: url('/fonts/Circe-Light.woff2') format('woff2'),
       url('/fonts/Circe-Light.woff') format('woff');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@layer base {
  :root {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 7%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 7%;
    --popover-foreground: 0 0% 98%;
    --primary: 30 100% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 30 100% 50%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 30 100% 50%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  html {
    overflow-y: scroll;
    scrollbar-gutter: stable;
    background-color: black;
  }
  /* Force prevent any layout shifts from Radix UI */
  html, body {
    padding-right: 0 !important;
    margin-right: 0 !important;
    overflow-x: hidden !important;
  }
  /* Re-enable scrolling on body even when modal is open, to prevent jump */
  body[data-scroll-locked] {
    overflow: auto !important;
    padding-right: 0 !important;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Circe', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  }
  /* Prevent layout shift when dropdown opens */
  header [role="combobox"] {
    contain: layout style;
  }
}

body[data-radix-scroll-lock] {
  overflow: initial !important;
  padding-right: 0 !important;
}

body:has([data-radix-scroll-area-viewport]) {
  padding-right: 0 !important;
}

/* ==========================================================================
   FLUID TYPOGRAPHY SYSTEM (Refactoring UI Principles)
   
   Target Breakpoints:
   - Mobile: 375px
   - Tablet: 768px  
   - Laptop (MacBook 14"): 1440px
   - Ultra-Wide: 1920px+
   
   Type Scale Ratio: ~1.25 (Major Third)
   Base at 1440px: 16px
   ========================================================================== */

@layer utilities {
  /* 
   * HERO TITLE (H1)
   * Mobile: 28px | Laptop 1440px: 36px | Ultra-Wide: 48px
   * Used for: Main page hero headings only
   */
  .text-hero {
    font-size: clamp(1.75rem, 1.5vw + 1rem, 3rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  
  /* 
   * SECTION TITLE (H2)
   * Mobile: 22px | Laptop 1440px: 28px | Ultra-Wide: 36px
   * Used for: Section headings (Services, Barbers, Contact)
   */
  .text-section-title {
    font-size: clamp(1.375rem, 1vw + 0.875rem, 2.25rem);
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  
  /* 
   * CARD/FEATURE TITLE (H3)
   * Mobile: 16px | Laptop 1440px: 18px | Ultra-Wide: 22px
   * Used for: Card headings, feature titles
   */
  .text-card-title {
    font-size: clamp(1rem, 0.5vw + 0.75rem, 1.375rem);
    line-height: 1.3;
  }
  
  /* 
   * BODY LARGE (Lead Text)
   * Mobile: 15px | Laptop 1440px: 16px | Ultra-Wide: 18px
   * Used for: Subtitles, lead paragraphs
   */
  .text-body-large {
    font-size: clamp(0.9375rem, 0.25vw + 0.75rem, 1.125rem);
    line-height: 1.6;
  }
  
  /* 
   * BODY (Standard Text)
   * Mobile: 14px | Laptop 1440px: 15px | Ultra-Wide: 16px
   * Used for: Standard paragraph text
   */
  .text-body {
    font-size: clamp(0.875rem, 0.15vw + 0.75rem, 1rem);
    line-height: 1.6;
  }
  
  /* 
   * SMALL (Supporting Text)
   * Mobile: 12px | Laptop 1440px: 13px | Ultra-Wide: 14px
   * Used for: Captions, labels, meta info
   */
  .text-small {
    font-size: clamp(0.75rem, 0.1vw + 0.625rem, 0.875rem);
    line-height: 1.5;
  }

  /* ==========================================================================
     FLUID SPACING SYSTEM
     ========================================================================== */
  
  /* Section padding - vertical */
  .py-section {
    padding-top: clamp(2rem, 3vw + 1rem, 5rem);
    padding-bottom: clamp(2rem, 3vw + 1rem, 5rem);
  }
  
  /* Section padding bottom only */
  .pb-section {
    padding-bottom: clamp(2rem, 3vw + 1rem, 5rem);
  }
  
  /* Section padding top only */
  .pt-section {
    padding-top: clamp(2rem, 3vw + 1rem, 5rem);
  }
  
  /* Section padding - smaller */
  .py-section-sm {
    padding-top: clamp(1.5rem, 2vw + 0.5rem, 3rem);
    padding-bottom: clamp(1.5rem, 2vw + 0.5rem, 3rem);
  }
  
  /* Gap between grid items */
  .gap-fluid {
    gap: clamp(0.75rem, 1vw + 0.25rem, 1.5rem);
  }
  
  /* Gap larger - for section spacing */
  .gap-fluid-lg {
    gap: clamp(1rem, 1.5vw + 0.5rem, 2.5rem);
  }
  
  /* Margin bottom for titles */
  .mb-title {
    margin-bottom: clamp(0.75rem, 1vw + 0.25rem, 1.5rem);
  }
  
  /* Margin bottom for sections */
  .mb-section {
    margin-bottom: clamp(1rem, 2vw + 0.5rem, 2.5rem);
  }

  /* ==========================================================================
     CONTAINER SYSTEM - Optimized for 14" MacBook Pro (1512×982)
     
     Baseline viewport: 1512px
     Target content width: ~1280px (leaves ~116px padding each side)
     ========================================================================== */
  
  /* Main container - primary layout wrapper */
  .container-fluid {
    width: 100%;
    max-width: 1320px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  /* Responsive padding adjustments */
  @media (min-width: 640px) {
    .container-fluid {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
  }
  
  @media (min-width: 1024px) {
    .container-fluid {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  }
  
  /* 14" MacBook Pro baseline (1280-1536px) */
  @media (min-width: 1280px) {
    .container-fluid {
      max-width: 1280px;
      padding-left: 2.5rem;
      padding-right: 2.5rem;
    }
  }
  
  /* Large screens (1536px+) */
  @media (min-width: 1536px) {
    .container-fluid {
      max-width: 1400px;
      padding-left: 3rem;
      padding-right: 3rem;
    }
  }
  
  /* Narrow container for text-heavy sections */
  .container-narrow {
    width: 100%;
    max-width: 720px;
    margin-left: auto;
    margin-right: auto;
  }
  
  @media (min-width: 1280px) {
    .container-narrow {
      max-width: 800px;
    }
  }

  /* Service description: Remove line-clamp on desktop */
  @media (min-width: 640px) {
    .service-description.line-clamp-2 {
      -webkit-line-clamp: unset !important;
      display: block !important;
      overflow: visible !important;
      text-overflow: clip !important;
    }
  }
}

/* ==========================================================================
   REACT-BIG-CALENDAR DARK THEME - Nearcut-Inspired Modern Barbershop
   ========================================================================== */

/* Calendar wrapper with white card on dark background */
.rbc-calendar-wrapper {
  --rbc-slot-height: 40px;
  --rbc-bg-primary: #ffffff;
  --rbc-bg-secondary: #f9fafb;
  --rbc-bg-working: #ffffff;
  --rbc-bg-off-hours: #f3f4f6;
  --rbc-border: #e5e7eb;
  --rbc-border-strong: #d1d5db;
  --rbc-text-primary: #111827;
  --rbc-text-secondary: #6b7280;
  --rbc-text-muted: #9ca3af;
  --rbc-accent: #22c55e;
  --rbc-accent-light: rgba(34, 197, 94, 0.15);
  --rbc-barber-count: 1;
  
  background: var(--rbc-bg-primary);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--rbc-border);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  /* Ensure scrolling works */
  position: relative;
}

/* Ensure custom header doesn't prevent scrolling */
.rbc-custom-barber-header {
  flex-shrink: 0;
  overflow: visible;
}

/* Ensure calendar component allows scrolling */
.rbc-calendar-wrapper .rbc-calendar {
  overflow: visible !important;
  height: 100% !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}

/* ===== CUSTOM BARBER HEADER ===== */
.rbc-custom-barber-header {
  background: var(--rbc-bg-secondary);
  border-bottom: 1px solid var(--rbc-border);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.rbc-calendar-wrapper:has(.rbc-custom-barber-header) .rbc-calendar {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.rbc-custom-barber-header-row {
  display: flex;
  min-height: 88px;
  width: 100%;
  padding-right: 8px;
}

.rbc-custom-header-time-cell {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: none !important;
  background: var(--rbc-bg-secondary);
  width: 70px;
  min-width: 70px;
  max-width: 70px;
  flex-shrink: 0;
}

.rbc-custom-header-barber-cell {
  background: var(--rbc-bg-secondary);
}

.rbc-custom-header-barber-cell {
  padding: 16px 12px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  min-width: 180px;
  flex-shrink: 0;
  position: relative;
}

/* Header separators - align with body column separators using border-left */
.rbc-custom-header-barber-cell + .rbc-custom-header-barber-cell {
  border-left: 1px solid #e5e7eb !important;
  border-right: none !important;
}

.rbc-custom-header-barber-cell:first-child {
  border-left: none !important;
  border-right: none !important;
}

.rbc-custom-header-barber-cell:last-child {
  border-right: none !important;
}

/* Add subtle hover effect on barber columns */
.rbc-day-slot:hover {
  background-color: rgba(34, 197, 94, 0.02) !important;
}

/* Ensure proper scrolling behavior for many barbers */
.rbc-calendar-wrapper .overflow-x-auto {
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

.rbc-calendar-wrapper .overflow-x-auto .rbc-time-content {
  overflow-x: auto !important;
}

.rbc-resource-header-empty {
  display: none;
}

/* ===== MAIN CALENDAR CONTAINER ===== */
.rbc-calendar {
  background: transparent !important;
  font-family: 'Circe', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  min-height: 0 !important;
  height: 100% !important;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ===== TOOLBAR (Hidden - we use custom) ===== */
.rbc-toolbar {
  display: none !important;
}

/* ===== HEADERS ===== */
/* Hide headers only in day view when custom barber header exists */
.rbc-calendar-wrapper:has(.rbc-custom-barber-header) .rbc-time-header .rbc-header:not(.rbc-resource-header),
.rbc-calendar-wrapper:has(.rbc-custom-barber-header) .rbc-time-header-content .rbc-header:not(.rbc-resource-header) {
  display: none !important;
  height: 0 !important;
  min-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
  visibility: hidden !important;
}

.rbc-header + .rbc-header {
  border-left: 1px solid var(--rbc-border) !important;
}

.rbc-resource-header {
  background: var(--rbc-bg-secondary) !important;
  border-color: var(--rbc-border) !important;
  padding: 0 !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  color: var(--rbc-text-primary) !important;
  display: none !important;
}

.rbc-resource-header:first-child {
  border-left: none !important;
}

/* Hide time header when custom barber header exists (day view only) */
.rbc-calendar-wrapper:has(.rbc-custom-barber-header) .rbc-time-header,
.rbc-calendar-wrapper:has(.rbc-custom-barber-header) .rbc-time-header-content,
.rbc-calendar-wrapper:has(.rbc-custom-barber-header) .rbc-time-header-content > .rbc-row {
  display: none !important;
  height: 0 !important;
  min-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  overflow: hidden !important;
  visibility: hidden !important;
}

/* ===== TIME GUTTER (Left time column) ===== */
.rbc-time-gutter {
  background: #f9fafb !important;
  /* No border between time gutter and the first barber column */
  border-right: none !important;
  overflow-y: hidden !important;
  position: sticky !important;
  left: 0 !important;
  z-index: 1 !important;
  width: 70px !important;
  min-width: 70px !important;
  max-width: 70px !important;
  box-sizing: border-box !important;
}

.rbc-time-gutter .rbc-timeslot-group {
  border-bottom: 1px solid #e5e7eb !important;
  /* DO NOT force height - let react-big-calendar control it */
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

/* Stronger border at full hours in time gutter */
.rbc-time-gutter .rbc-timeslot-group:nth-child(4n+1) {
  border-bottom: 1px solid #d1d5db !important;
}

/* Remove border from last timeslot group to prevent extra space */
.rbc-time-gutter .rbc-timeslot-group:last-child {
  border-bottom: none !important;
}

.rbc-time-header-gutter {
  background: #f9fafb !important;
  border-right: none !important;
  border-bottom: 1px solid var(--rbc-border) !important;
  height: 0 !important;
  min-height: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  width: 70px !important;
  min-width: 70px !important;
  max-width: 70px !important;
}

.rbc-label {
  color: #6b7280 !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  padding: 4px 10px !important;
  text-align: right !important;
  font-family: 'Circe', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

/* Full hour labels - larger and bolder for better hierarchy */
.rbc-time-gutter .rbc-timeslot-group:nth-child(4n+1) .rbc-label {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #374151 !important;
}

.rbc-time-header-content {
  border-left: none !important;
}

/* Note: Border between time gutter and first barber column is handled by .rbc-time-gutter border-right */
/* Barber column separators are handled by .rbc-time-column:not(.rbc-time-gutter) + .rbc-time-column:not(.rbc-time-gutter) */

/* ===== TIME VIEW ===== */
.rbc-time-view {
  border: none !important;
  border-radius: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  min-height: 0 !important;
  max-height: 100% !important;
  /* Ensure no extra space at bottom */
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
  /* Ensure proper flex behavior for scrolling */
  flex: 1 1 auto;
  overflow: hidden;
  position: relative;
}

.rbc-time-header {
  border-bottom: 1px solid var(--rbc-border) !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 2 !important;
  background: var(--rbc-bg-secondary) !important;
}

.rbc-time-content {
  border-top: none !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  flex: 1 1 auto !important;
  max-height: 100% !important;
  background: var(--rbc-bg-primary) !important;
  min-height: 0 !important;
  /* Remove any extra padding that causes empty space */
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
  /* Ensure scrolling works */
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Content should be natural height - slots will determine it exactly */

/* Remove any extra space from last timeslot group */
.rbc-time-content .rbc-timeslot-group:last-child {
  border-bottom: none !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

/* Ensure no extra padding/margin on time-content children */
.rbc-time-content > * {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

/* Time-gutter slots - let library control height */

/* Remove extra space after last timeslot - handled below */

/* ===== BARBER COLUMN SEPARATORS - THIN 1px LINES ===== */
/* No vertical border between time gutter and the first barber column */
.rbc-time-content > .rbc-time-gutter {
  border-right: none !important;
}

/* Thin separator line BETWEEN barber columns in Day view */
.rbc-time-content > .rbc-day-slot.rbc-time-column + .rbc-day-slot.rbc-time-column {
  box-shadow: inset 1px 0 0 #e5e7eb !important;
}

/* Horizontal scrolling for day view with many barbers */
.rbc-calendar-wrapper .rbc-time-content {
  min-width: fit-content;
}

.rbc-calendar-wrapper .rbc-day-slot {
  min-width: 180px;
  flex-shrink: 0;
  /* Ensure each barber column is isolated */
  position: relative !important;
  overflow: visible !important;
  /* Ensure borders are not clipped */
  box-sizing: border-box !important;
}

/* Events container - DO NOT override positioning, let react-big-calendar handle it */
.rbc-day-slot .rbc-events-container {
  /* Library handles positioning - only set visual properties */
  overflow: visible !important;
  z-index: 5 !important;
}

/* Events - DO NOT override positioning, let react-big-calendar handle it */
.rbc-day-slot .rbc-event {
  /* Library handles positioning - only set visual properties */
  box-sizing: border-box !important;
}

.rbc-timeslot-group {
  border-bottom: 1px solid #e5e7eb !important;
  /* DO NOT force height - let react-big-calendar control it for correct event positioning */
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

/* Stronger border at full hours for better visual hierarchy */
.rbc-time-content .rbc-timeslot-group:nth-child(4n+1) {
  border-bottom: 1px solid #d1d5db !important;
}

/* Remove border from last timeslot group to prevent extra space */
.rbc-time-content .rbc-timeslot-group:last-child {
  border-bottom: none !important;
}

.rbc-time-slot {
  border-top: none !important;
  /* DO NOT force height - let react-big-calendar control it for correct event positioning */
  transition: background-color 0.15s ease;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

.rbc-day-slot {
  background: var(--rbc-bg-working) !important;
  position: relative !important;
  overflow: visible !important;
  box-sizing: border-box !important;
}

/* Day-slots styling - don't force heights */
.rbc-timeslot-group .rbc-day-slot {
  overflow: visible !important;
  position: relative !important;
  box-sizing: border-box !important;
}

.rbc-day-slot .rbc-time-slot {
  background: inherit !important;
}

/* Ensure each time slot row has proper separation */
.rbc-day-slot .rbc-time-slot + .rbc-time-slot {
  border-top: none !important;
}

/* ===== WORKING HOURS SLOT STYLING ===== */
/* Working hours styling is handled via inline styles in slotPropGetter */

/* ===== DAY COLUMNS ===== */
.rbc-day-bg {
  background: transparent !important;
}

.rbc-day-bg + .rbc-day-bg {
  border-left: 1px solid var(--rbc-border) !important;
}

.rbc-today {
  background: transparent !important;
}

.rbc-off-range-bg {
  background: rgba(0, 0, 0, 0.5) !important;
}

.rbc-off-range {
  color: var(--rbc-text-muted) !important;
}

/* ===== EVENTS (Appointments) - Nearcut Style ===== */
.rbc-event {
  background: transparent !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 0 !important;
  font-size: 11px !important;
  cursor: pointer !important;
  transition: box-shadow 0.2s ease !important;
  overflow: visible !important;
  /* CRITICAL: Don't override positioning properties - let react-big-calendar handle it */
  /* The library uses absolute positioning with top, left, width, height */
  /* DO NOT set: position, top, left, right, bottom, width, height, display - let library control these */
  box-sizing: border-box !important;
  /* Ensure events are visible */
  visibility: visible !important;
  /* DO NOT set display - react-big-calendar controls this for proper resource column positioning */
  opacity: 1 !important;
  z-index: 5 !important;
  /* Ensure top edge aligns with time slot - no margin offset */
  margin: 0 !important;
}

.rbc-event:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  z-index: 10 !important;
}

.rbc-event:focus {
  outline: 2px solid var(--rbc-accent) !important;
  outline-offset: 1px !important;
}

.rbc-event-label {
  display: none !important;
}

.rbc-event-content {
  height: 100%;
  /* Ensure event content is visible */
  visibility: visible !important;
  display: block !important;
}

/* Event card styling */
.rbc-event-card {
  display: flex !important;
  flex-direction: column;
  gap: 4px;
  min-height: 100%;
  padding: 0 8px 6px 8px;
  border-radius: 6px;
  position: relative;
  background: rgba(34, 197, 94, 0.12);
  border-left: 4px solid #22c55e;
  overflow: visible;
  word-wrap: break-word;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  /* Ensure card is visible */
  visibility: visible !important;
  opacity: 1 !important;
  z-index: 5 !important;
  /* Align top edge with time slot - no top padding */
  margin: 0 !important;
}

.rbc-event-card .rbc-event-time {
  font-weight: 500;
  font-size: 11px;
  color: #374151;
  line-height: 1.3;
}

.rbc-event-card .rbc-event-customer {
  font-weight: 600;
  font-size: 12px;
  color: #111827;
  line-height: 1.4;
  /* Allow text to wrap instead of truncating */
  white-space: normal;
  overflow: visible;
  word-break: break-word;
}

.rbc-event-card .rbc-event-service-name {
  font-size: 10px;
  color: #6b7280;
  line-height: 1.4;
  /* Allow text to wrap instead of truncating */
  white-space: normal;
  overflow: visible;
  word-break: break-word;
}

.rbc-event-card .rbc-event-status-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #22c55e;
}

/* Status-based event styling */
.rbc-event-card.status-booked {
  background: rgba(34, 197, 94, 0.1);
  border-left-color: #22c55e;
}

.rbc-event-card.status-completed {
  background: rgba(34, 197, 94, 0.15);
  border-left-color: #22c55e;
}

.rbc-event-card.status-completed .rbc-event-status-icon {
  color: #22c55e;
}

.rbc-event-card.status-missed {
  background: rgba(239, 68, 68, 0.15);
  border-left-color: #ef4444;
}

.rbc-event-card.status-missed .rbc-event-customer,
.rbc-event-card.status-missed .rbc-event-time {
  color: #dc2626;
}

.rbc-event-card.status-canceled {
  background: rgba(107, 114, 128, 0.15);
  border-left-color: #6b7280;
  opacity: 0.7;
}

.rbc-event-card.status-canceled .rbc-event-customer,
.rbc-event-card.status-canceled .rbc-event-time {
  color: #6b7280;
  text-decoration: line-through;
}

/* Selected event */
.rbc-selected .rbc-event-card {
  background: var(--rbc-accent) !important;
  border-left-color: #16a34a !important;
}

.rbc-selected .rbc-event-card .rbc-event-time,
.rbc-selected .rbc-event-card .rbc-event-customer,
.rbc-selected .rbc-event-card .rbc-event-service-name {
  color: white !important;
}

/* ===== CURRENT TIME INDICATOR ===== */
.rbc-current-time-indicator {
  background: #ef4444 !important;
  height: 2px !important;
  z-index: 3 !important;
}

.rbc-current-time-indicator::before {
  content: '';
  position: absolute;
  left: -5px;
  top: -4px;
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
}

/* ===== DRAG AND DROP STYLING ===== */
.rbc-addons-dnd .rbc-addons-dnd-row-body,
.rbc-addons-dnd .rbc-addons-dnd-row-body .rbc-row {
  z-index: auto !important;
}

/* Dragging event style */
.rbc-addons-dnd-dragging .rbc-event {
  opacity: 0.5 !important;
}

/* Drag preview */
.rbc-addons-dnd-drag-preview {
  z-index: 100 !important;
  opacity: 0.8 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
  transform: scale(1.02) !important;
}

/* Drop target highlight */
.rbc-addons-dnd-over {
  background-color: rgba(34, 197, 94, 0.15) !important;
}

/* Resizing handles (disabled but styled just in case) */
.rbc-addons-dnd-resize-ns-anchor,
.rbc-addons-dnd-resize-ew-anchor {
  display: none !important;
}

/* ===== SCROLLBAR STYLING (Dark) ===== */
.rbc-calendar-wrapper ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.rbc-calendar-wrapper ::-webkit-scrollbar-track {
  background: var(--rbc-bg-secondary);
  border-radius: 4px;
}

.rbc-calendar-wrapper ::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.rbc-calendar-wrapper ::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.rbc-calendar-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db var(--rbc-bg-secondary);
}

/* ===== SELECTION ===== */
.rbc-slot-selection {
  background: rgba(34, 197, 94, 0.2) !important;
  border: 2px solid var(--rbc-accent) !important;
  border-radius: 4px !important;
}

/* ===== POPUP OVERLAY ===== */
.rbc-overlay {
  background: var(--rbc-bg-primary) !important;
  border: 1px solid var(--rbc-border) !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
  padding: 8px !important;
  z-index: 100 !important;
}

.rbc-overlay-header {
  border-bottom: 1px solid var(--rbc-border) !important;
  padding: 8px 12px !important;
  margin: -8px -8px 8px -8px !important;
  background: var(--rbc-bg-secondary) !important;
  border-radius: 12px 12px 0 0 !important;
  color: var(--rbc-text-primary) !important;
  font-weight: 600 !important;
  font-size: 13px !important;
}

/* ===== WEEK VIEW ===== */
.rbc-allday-cell {
  background: var(--rbc-bg-secondary) !important;
  border-bottom: 1px solid var(--rbc-border) !important;
}

.rbc-row-bg {
  background: var(--rbc-bg-primary) !important;
}

.rbc-time-header-content .rbc-header {
  background: var(--rbc-bg-secondary) !important;
  border-bottom: 1px solid var(--rbc-border) !important;
  color: var(--rbc-text-primary) !important;
  font-weight: 600 !important;
  padding: 8px 12px !important;
}

/* ===== MONTH VIEW ===== */
.rbc-month-view {
  border: none !important;
  border-radius: 0 !important;
  background: var(--rbc-bg-primary) !important;
}

.rbc-month-header {
  background: var(--rbc-bg-secondary) !important;
  color: var(--rbc-text-primary) !important;
}

.rbc-month-row {
  border-bottom: 1px solid var(--rbc-border) !important;
  min-height: 100px;
}

.rbc-date-cell {
  padding: 8px !important;
  text-align: right !important;
}

.rbc-date-cell > a {
  color: var(--rbc-text-primary) !important;
  font-weight: 500 !important;
  font-size: 13px !important;
  text-decoration: none !important;
}

.rbc-month-row {
  border-color: var(--rbc-border) !important;
}

.rbc-date-cell.rbc-now > a {
  background: var(--rbc-accent) !important;
  color: white !important;
  border-radius: 50% !important;
  width: 28px !important;
  height: 28px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.rbc-show-more {
  color: var(--rbc-accent) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  background: transparent !important;
  cursor: pointer !important;
}

/* ===== RESPONSIVE ADJUSTMENTS ===== */
@media (max-width: 768px) {
  .rbc-calendar-wrapper {
    --rbc-slot-height: 50px;
  }
  
  .rbc-time-gutter,
  .rbc-time-header-gutter,
  .rbc-custom-header-time-cell {
    width: 55px !important;
    min-width: 55px !important;
    max-width: 55px !important;
  }
  
  .rbc-label {
    font-size: 10px !important;
    padding: 2px 4px !important;
  }
  
  .rbc-custom-header-barber-cell {
    min-width: 140px;
    padding: 12px 8px 8px;
  }
  
  .rbc-event-card {
    padding: 4px 6px;
  }
  
  .rbc-event-card .rbc-event-time {
    font-size: 10px;
  }
  
  .rbc-event-card .rbc-event-customer {
    font-size: 11px;
  }
  
  .rbc-event-card .rbc-event-service-name {
    font-size: 9px;
  }
}

/* ===== AGENDA VIEW ===== */
.rbc-agenda-view {
  background: var(--rbc-bg-primary) !important;
}

.rbc-agenda-view table.rbc-agenda-table {
  border: none !important;
}

.rbc-agenda-view table.rbc-agenda-table thead > tr > th {
  background: var(--rbc-bg-secondary) !important;
  border-bottom: 1px solid var(--rbc-border) !important;
  color: var(--rbc-text-primary) !important;
  padding: 12px !important;
  font-weight: 600 !important;
}

.rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
  border-bottom: 1px solid var(--rbc-border) !important;
  padding: 12px !important;
  color: var(--rbc-text-primary) !important;
}

.rbc-agenda-date-cell,
.rbc-agenda-time-cell {
  color: var(--rbc-text-secondary) !important;
}

/* Week view day headers - show weekday names and dates */
.rbc-time-header .rbc-header {
  background: var(--rbc-bg-secondary) !important;
  border-bottom: 1px solid var(--rbc-border) !important;
  color: var(--rbc-text-primary) !important;
  font-weight: 600 !important;
  padding: 10px 12px !important;
  text-align: center !important;
}

```

`components/admin/AdminCalendar.tsx`:

```tsx
"use client";

import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer, SlotInfo, View, Views } from "react-big-calendar";
import withDragAndDrop, { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek as dateFnsStartOfWeek, getDay, setHours, setMinutes, startOfDay, isSameDay } from "date-fns";
import { de, enUS, ru } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { AppointmentDisplayData, BarberDisplayData } from "@/lib/types/admin-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

// Create drag and drop enabled calendar
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Types for drag and drop
interface RescheduleData {
  appointment: AppointmentDisplayData;
  newStart: Date;
  newEnd: Date;
  newBarberId?: string;
}

// Map locale strings to date-fns locales
const locales = { de, en: enUS, ru };

// Create localizer with date-fns
const startOfWeek = (date: Date, options?: { locale?: any }) => {
  return dateFnsStartOfWeek(date, { weekStartsOn: 1, ...options });
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    de,
    en: enUS,
    ru,
  },
});

interface AdminCalendarProps {
  date: Date;
  barbers: BarberDisplayData[];
  appointments: AppointmentDisplayData[];
  onAppointmentClick?: (appointment: AppointmentDisplayData) => void;
  onCellClick?: (date: Date, barberId: string) => void;
  onAppointmentReschedule?: (data: RescheduleData) => void;
  selectedBarberIds?: string[];
  timeRange?: {
    start: string; // "HH:mm"
    end: string; // "HH:mm"
  };
  viewMode?: "day" | "week" | "month";
  timeInterval?: 15 | 30 | 60;
  intervalHeight?: "small" | "medium" | "large";
  onViewChange?: (view: "day" | "week" | "month") => void;
  onDateChange?: (date: Date) => void;
}

// Export RescheduleData type for use in parent components
export type { RescheduleData };

// Transform appointment to react-big-calendar event format
function transformAppointmentToEvent(appointment: AppointmentDisplayData) {
  // Ensure dates are proper Date objects in local timezone
  let start: Date;
  let end: Date;
  
  if (appointment.startTime instanceof Date) {
    // Create new Date object to ensure we have a proper instance
    start = new Date(appointment.startTime.getTime());
  } else if (typeof appointment.startTime === 'string') {
    // Parse ISO string and create local date
    const startDate = new Date(appointment.startTime);
    // If date is invalid, log error
    if (isNaN(startDate.getTime())) {
      console.error('❌ Invalid startTime string:', appointment.startTime);
      start = new Date(); // Fallback to now
    } else {
      start = startDate;
    }
  } else {
    start = new Date(appointment.startTime);
  }
  
  if (appointment.endTime instanceof Date) {
    end = new Date(appointment.endTime.getTime());
  } else if (typeof appointment.endTime === 'string') {
    const endDate = new Date(appointment.endTime);
    if (isNaN(endDate.getTime())) {
      console.error('❌ Invalid endTime string:', appointment.endTime);
      end = new Date(start.getTime() + 60 * 60 * 1000); // Fallback to 1 hour after start
    } else {
      end = endDate;
    }
  } else {
    end = new Date(appointment.endTime);
  }
  
  // Validate dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error('❌ Invalid date in appointment:', appointment.id, { 
      start: appointment.startTime, 
      end: appointment.endTime,
      startParsed: start,
      endParsed: end
    });
    // Return null to filter out invalid events
    return null;
  }
  
  // Ensure resourceId is always a string to match resource IDs
  // This MUST match the resource.id format used in the resources array
  // Use String() without trim to ensure exact matching with resource.id
  const resourceId = String(appointment.barberId);
  
  const event = {
    id: appointment.id,
    title: "",
    start,
    end,
    resourceId, // Must match resource.id exactly (both as strings, no modifications)
    appointment,
  };
  
  return event;
}

// Custom event component for styling
function createEventComponent(t: (key: string) => string) {
  return function EventComponent({ event }: { event: any }) {
    const appointment = event.appointment as AppointmentDisplayData;
    const serviceName = appointment.services[0]?.serviceName || t("service");
    const isCompleted = appointment.status === "ARRIVED" || appointment.status === "COMPLETED";
    const isMissed = appointment.status === "MISSED";
    const isCanceled = appointment.status === "CANCELED";
    
    const displayStartTime = event.start instanceof Date 
      ? format(event.start, "HH:mm")
      : format(new Date(appointment.startTime), "HH:mm");
    
    const displayEndTime = event.end instanceof Date 
      ? format(event.end, "HH:mm")
      : format(new Date(appointment.endTime), "HH:mm");

    // Determine status class
    let statusClass = "status-booked";
    if (isCompleted) statusClass = "status-completed";
    else if (isMissed) statusClass = "status-missed";
    else if (isCanceled) statusClass = "status-canceled";

    return (
      <div className={`rbc-event-card ${statusClass}`}>
        <div className="rbc-event-time">
          {displayStartTime} - {displayEndTime}
        </div>
        <div className="rbc-event-customer">
          {appointment.customerName}
        </div>
        <div className="rbc-event-service-name">
          {serviceName}
        </div>
        {isCompleted && (
          <div className="rbc-event-status-icon">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  };
}

// Get event style based on appointment status - for overall event container
function getEventStyle(event: any) {
  const appointment = event.appointment as AppointmentDisplayData;
  
  let borderColor = "#22c55e"; // Default green for booked
  let backgroundColor = "transparent";
  let opacity = 1;

  if (appointment.status === "ARRIVED" || appointment.status === "COMPLETED") {
    borderColor = "#22c55e";
    backgroundColor = "rgba(34, 197, 94, 0.1)";
  } else if (appointment.status === "MISSED") {
    borderColor = "#ef4444";
    backgroundColor = "rgba(239, 68, 68, 0.1)";
  } else if (appointment.status === "CANCELED") {
    borderColor = "#6b7280";
    backgroundColor = "rgba(107, 114, 128, 0.1)";
    opacity = 0.7;
  } else {
    // BOOKED - use green accent like Nearcut
    borderColor = "#22c55e";
    backgroundColor = "rgba(34, 197, 94, 0.08)";
  }

  return {
    style: {
      background: backgroundColor,
      borderRadius: "4px",
      border: "none",
      borderLeft: `4px solid ${borderColor}`,
      padding: "0",
      margin: "0 2px",
      cursor: "pointer",
      opacity,
    }
  };
}

// Map view modes
const viewMap: Record<string, View> = {
  day: Views.DAY,
  week: Views.WEEK,
  month: Views.MONTH,
};

export function AdminCalendar({
  date,
  barbers,
  appointments,
  onAppointmentClick,
  onCellClick,
  onAppointmentReschedule,
  selectedBarberIds,
  timeRange = { start: "09:00", end: "20:00" },
  viewMode = "day",
  timeInterval = 15,
  intervalHeight = "medium",
  onViewChange,
  onDateChange,
}: AdminCalendarProps) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const calendarRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(800); // Default for SSR
  const [isMounted, setIsMounted] = useState(false);
  
  // Set viewport height after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setViewportHeight(window.innerHeight);
    }
  }, []);
  
  // Update viewport height on resize
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);
  
  // Filter barbers based on selection
  const visibleBarbers = useMemo(() => {
    if (!selectedBarberIds || selectedBarberIds.length === 0) {
      return barbers;
    }
    return barbers.filter((barber) => selectedBarberIds.includes(barber.id));
  }, [barbers, selectedBarberIds]);

  // Transform barbers to resources (only for day view with resources)
  const resources = useMemo(() => {
    if (viewMode !== "day") return undefined;
    const res = visibleBarbers.map((barber) => ({
      id: String(barber.id), // Ensure string ID
      title: barber.displayName,
      barber,
    }));
    
    if (typeof window !== 'undefined') {
      console.log('📋 Resources:', res);
    }
    
    return res;
  }, [visibleBarbers, viewMode]);

  // Create a map of barber working hours for quick lookup
  const barberWorkingHoursMap = useMemo(() => {
    const weekday = date.getDay();
    const map = new Map<string, { start: Date; end: Date } | null>();
    
    visibleBarbers.forEach(barber => {
      if (barber.workingHours && barber.workingHours.weekday === weekday) {
        const dayStart = startOfDay(date);
        const [startHour, startMin] = barber.workingHours.startTime.split(":").map(Number);
        const [endHour, endMin] = barber.workingHours.endTime.split(":").map(Number);
        
        map.set(barber.id, {
          start: setMinutes(setHours(dayStart, startHour), startMin),
          end: setMinutes(setHours(dayStart, endHour), endMin),
        });
      } else {
        map.set(barber.id, null);
      }
    });
    
    return map;
  }, [visibleBarbers, date]);

  // Custom Resource header component
  const ResourceHeader = useCallback(() => {
    return <div className="rbc-resource-header-empty" />;
  }, []);

  // Transform appointments to events
  const events = useMemo(() => {
    // Create a Set of valid resource IDs for fast lookup
    // In "All Barbers" view, this includes all visible barbers
    // Only when a specific barber is selected, this will be filtered
    const validResourceIds = new Set<string>();
    if (resources) {
      resources.forEach((resource) => {
        validResourceIds.add(String(resource.id));
      });
    }
    
    // Transform all appointments for visible barbers into events
    // In "All Barbers" view, include ALL appointments for ALL visible barbers
    const transformed = appointments
      .filter((apt) => {
        // Only include appointments for barbers that are in the resources list
        // This ensures we show all appointments for all visible barbers in "All Barbers" view
        const aptBarberIdStr = String(apt.barberId);
        return validResourceIds.has(aptBarberIdStr);
      })
      .map(transformAppointmentToEvent)
      .filter((event): event is NonNullable<typeof event> => {
        // Filter out null events (invalid dates) and events without matching resources
        if (!event) return false;
        const eventResourceId = String(event.resourceId);
        // Ensure event has a matching resource ID
        return validResourceIds.has(eventResourceId);
      });
    
    // Comprehensive debug logging to verify resourceId matching
    if (typeof window !== 'undefined') {
      const resourceIds = resources ? resources.map(r => String(r.id)) : [];
      const eventResourceIds = transformed.map(e => String(e.resourceId));
      const mismatched = transformed.filter(e => !resourceIds.includes(String(e.resourceId)));
      
      // Check for exact matches
      const matchingMap = new Map<string, number>();
      eventResourceIds.forEach(id => {
        matchingMap.set(id, (matchingMap.get(id) || 0) + 1);
      });
      
      console.log('[Calendar Debug] Resource and Event Mapping:', {
        resources: resources?.map(r => ({ 
          id: r.id, 
          idType: typeof r.id,
          idString: String(r.id),
          title: r.title 
        })),
        resourceIds: resourceIds,
        events: transformed.map(e => ({ 
          id: e.id, 
          resourceId: e.resourceId, 
          resourceIdType: typeof e.resourceId,
          resourceIdString: String(e.resourceId),
          matchesResource: resourceIds.includes(String(e.resourceId)),
          start: e.start.toISOString(),
          end: e.end.toISOString()
        })),
        eventResourceIds: eventResourceIds,
        matchingCount: transformed.length - mismatched.length,
        mismatchedCount: mismatched.length,
        mismatchedEvents: mismatched.map(e => ({
          id: e.id,
          resourceId: e.resourceId,
          resourceIdString: String(e.resourceId),
          availableResourceIds: resourceIds
        }))
      });
      
      if (mismatched.length > 0) {
        console.error('❌ Events with mismatched resourceIds:', mismatched);
      } else if (transformed.length > 0) {
        console.log('✅ All events have matching resourceIds');
      }
    }
    
    return transformed;
  }, [appointments, visibleBarbers, resources]);

  // Calculate time range from visible barbers' working hours
  const weekday = date.getDay();
  const effectiveTimeRange = useMemo(() => {
    const barbersWithWorkingHours = visibleBarbers.filter(b => 
      b.workingHours && b.workingHours.weekday === weekday
    );
    
    if (barbersWithWorkingHours.length === 0) {
      return timeRange;
    }
    
    let earliestStart = "23:59";
    let latestEnd = "00:00";
    
    barbersWithWorkingHours.forEach(barber => {
      if (barber.workingHours) {
        if (barber.workingHours.startTime < earliestStart) {
          earliestStart = barber.workingHours.startTime;
        }
        if (barber.workingHours.endTime > latestEnd) {
          latestEnd = barber.workingHours.endTime;
        }
      }
    });
    
    return {
      start: earliestStart,
      end: latestEnd,
    };
  }, [visibleBarbers, weekday, timeRange]);
  
  const [startHour, startMinute] = effectiveTimeRange.start.split(":").map(Number);
  const [endHour, endMinute] = effectiveTimeRange.end.split(":").map(Number);
  
  // Global working hours for calendar display range
  const workingHoursStart = useMemo(() => {
    const dayStart = startOfDay(date);
    return setMinutes(setHours(dayStart, startHour), startMinute);
  }, [date, startHour, startMinute]);
  
  const workingHoursEnd = useMemo(() => {
    const dayStart = startOfDay(date);
    return setMinutes(setHours(dayStart, endHour), endMinute);
  }, [date, endHour, endMinute]);
  
  // Calendar min/max time - ensure all appointments are visible
  const minTime = useMemo(() => {
    const dayStart = startOfDay(date);
    const beforeWorkingHours = setMinutes(setHours(dayStart, Math.max(0, startHour - 1)), 0);
    
    // Check all appointments (not just events) to ensure we include them
    const dayAppointments = appointments
      .filter(apt => {
        const aptDate = apt.startTime instanceof Date ? apt.startTime : new Date(apt.startTime);
        return isSameDay(startOfDay(aptDate), date);
      })
      .map(apt => {
        const start = apt.startTime instanceof Date ? apt.startTime : new Date(apt.startTime);
        return { start };
      });
    
    if (dayAppointments.length > 0) {
      const earliestAppointment = dayAppointments.reduce((earliest, apt) => {
        return apt.start < earliest.start ? apt : earliest;
      });
      const earliestTime = earliestAppointment.start < beforeWorkingHours 
        ? earliestAppointment.start 
        : beforeWorkingHours;
      // Round down to nearest 15 minutes to ensure slot alignment
      const roundedMinutes = Math.floor(earliestTime.getMinutes() / 15) * 15;
      return setMinutes(earliestTime, roundedMinutes);
    }
    
    return beforeWorkingHours;
  }, [date, startHour, appointments]);
  
  const maxTime = useMemo(() => {
    const dayStart = startOfDay(date);
    // Check all appointments to ensure we include the latest one
    const dayAppointments = appointments
      .filter(apt => {
        const aptDate = apt.startTime instanceof Date ? apt.startTime : new Date(apt.startTime);
        return isSameDay(startOfDay(aptDate), date);
      })
      .map(apt => {
        const end = apt.endTime instanceof Date ? apt.endTime : new Date(apt.endTime);
        return { end };
      });
    
    let latestEnd = setMinutes(setHours(dayStart, endHour), endMinute || 0);
    
    if (dayAppointments.length > 0) {
      const latestAppointment = dayAppointments.reduce((latest, apt) => {
        return apt.end > latest.end ? apt : latest;
      });
      if (latestAppointment.end > latestEnd) {
        latestEnd = latestAppointment.end;
        // Round up to nearest 15 minutes
        const roundedMinutes = Math.ceil(latestEnd.getMinutes() / 15) * 15;
        latestEnd = setMinutes(latestEnd, roundedMinutes);
      }
    }
    
    return latestEnd;
  }, [date, endHour, endMinute, appointments]);

  // Handle event click
  const handleSelectEvent = useCallback((event: any) => {
    if (onAppointmentClick && event.appointment) {
      onAppointmentClick(event.appointment);
    }
  }, [onAppointmentClick]);

  // Handle slot click - block clicks outside working hours for each barber
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    const slotStart = slotInfo.start;
    const barberId = slotInfo.resourceId as string || visibleBarbers[0]?.id;
    
    if (!barberId) return;
    
    // Get working hours for this specific barber
    const barberHours = barberWorkingHoursMap.get(barberId);
    
    if (!barberHours) {
      // Barber not working today
      return;
    }
    
    const isWithinWorkingHours = slotStart >= barberHours.start && slotStart < barberHours.end;
    
    if (!isWithinWorkingHours) {
      return;
    }
    
    if (onCellClick) {
      onCellClick(slotInfo.start, barberId);
    }
  }, [onCellClick, visibleBarbers, barberWorkingHoursMap]);

  // Handle view change
  const handleViewChange = useCallback((view: View) => {
    if (onViewChange) {
      const viewString = view === Views.DAY ? "day" : view === Views.WEEK ? "week" : "month";
      onViewChange(viewString as "day" | "week" | "month");
    }
  }, [onViewChange]);

  // Handle navigation
  const handleNavigate = useCallback((newDate: Date) => {
    if (onDateChange) {
      onDateChange(newDate);
    }
  }, [onDateChange]);

  // Handle event drag and drop
  const handleEventDrop = useCallback(({ event, start, end, resourceId }: any) => {
    if (!onAppointmentReschedule || !event.appointment) return;
    
    const appointment = event.appointment as AppointmentDisplayData;
    const newBarberId = resourceId as string | undefined;
    
    // Check if the new slot is within the barber's working hours
    const targetBarberId = newBarberId || appointment.barberId;
    const barberHours = barberWorkingHoursMap.get(targetBarberId);
    
    if (!barberHours) {
      // Barber not working on this day
      return;
    }
    
    const isWithinWorkingHours = start >= barberHours.start && end <= barberHours.end;
    
    if (!isWithinWorkingHours) {
      return;
    }
    
    onAppointmentReschedule({
      appointment,
      newStart: start,
      newEnd: end,
      newBarberId: newBarberId !== appointment.barberId ? newBarberId : undefined,
    });
  }, [onAppointmentReschedule, barberWorkingHoursMap]);

  // Slot prop getter for per-barber working hours shading
  // Uses inline styles for reliable rendering
  const slotPropGetter = useCallback((slotDate: Date, resourceId?: string | number) => {
    let isWithinWorkingHours = true;
    
    if (resourceId && typeof resourceId === "string") {
      const barberHours = barberWorkingHoursMap.get(resourceId);
      
      if (!barberHours) {
        // Barber not working today - all slots are off-hours
        isWithinWorkingHours = false;
      } else {
        isWithinWorkingHours = slotDate >= barberHours.start && slotDate < barberHours.end;
      }
    } else {
      // Week view or no resource - use global working hours
      isWithinWorkingHours = slotDate >= workingHoursStart && slotDate < workingHoursEnd;
    }
    
    // Use inline styles for reliable working hours indication
    if (isWithinWorkingHours) {
      return {
        style: {
          backgroundColor: '#ffffff',
          cursor: 'pointer',
        },
      };
    } else {
      return {
        style: {
          backgroundColor: '#f3f4f6',
          cursor: 'not-allowed',
          opacity: 0.7,
        },
      };
    }
  }, [barberWorkingHoursMap, workingHoursStart, workingHoursEnd]);

  // Scroll to first working hour on mount/date change
  useEffect(() => {
    const scrollToWorkingHours = () => {
      if (!calendarRef.current) return;
      
      const timeContent = calendarRef.current.querySelector('.rbc-time-content');
      if (!timeContent) return;
      
      // Calculate position to scroll to (working hours start)
      const slotHeights = { small: 28, medium: 40, large: 55 };
      const slotHeight = slotHeights[intervalHeight];
      const minutesFromDayStart = startHour * 60 + startMinute;
      const slotsFromStart = minutesFromDayStart / timeInterval;
      const scrollPosition = Math.max(0, (slotsFromStart * slotHeight) - 50); // 50px padding
      
      timeContent.scrollTop = scrollPosition;
    };
    
    // Small delay to ensure calendar is rendered
    const timer = setTimeout(scrollToWorkingHours, 100);
    return () => clearTimeout(timer);
  }, [date, startHour, startMinute, intervalHeight, timeInterval]);

  if (visibleBarbers.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center p-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg font-medium">{t("noBarbersSelected")}</p>
          <p className="text-gray-500 text-sm mt-2">Select barbers in settings to view their schedule</p>
        </div>
      </div>
    );
  }

  const dateFnsLocale = locales[locale as keyof typeof locales] || locales.de;
  const step = timeInterval;
  const timeslots = 1;
  const currentWeekday = date.getDay();
  
  // Calculate number of slots needed based on time range and interval
  const numberOfSlots = useMemo(() => {
    const [startHour, startMinute] = effectiveTimeRange.start.split(":").map(Number);
    const [endHour, endMinute] = effectiveTimeRange.end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const totalMinutes = endMinutes - startMinutes;
    return Math.ceil(totalMinutes / timeInterval);
  }, [effectiveTimeRange, timeInterval]);

  // Calculate responsive slot heights - PERFECT MATCH approach
  // Calculate based on available space, but ensure exact fit
  const calculateResponsiveSlotHeight = useMemo(() => {
    // Calculate available viewport height (accounting for header ~88px, padding, etc.)
    const headerHeight = viewMode === "day" && visibleBarbers.length > 0 ? 88 : 0;
    const availableHeight = viewportHeight - 350 - headerHeight; // Account for all overhead
    
    // Calculate optimal slot height based on available space and number of slots
    const baseHeight = availableHeight / numberOfSlots;
    
    // Define min/max constraints - use large as base, others slightly smaller
    // All heights should be similar, with only subtle differences
    const constraints = {
      small: { min: 40, max: 65 },
      medium: { min: 42, max: 68 },
      large: { min: 45, max: 70 },
    };
    
    const constraint = constraints[intervalHeight];
    const calculatedHeight = Math.max(Math.min(baseHeight, constraint.max), constraint.min);
    
    return calculatedHeight;
  }, [effectiveTimeRange, timeInterval, intervalHeight, viewportHeight, numberOfSlots, viewMode, visibleBarbers.length]);
  
  // Calculate exact slot heights - subtle differences only
  // Large is base, medium and small are only slightly smaller
  const slotHeights = {
    small: calculateResponsiveSlotHeight * 0.90,   // 10% smaller than large
    medium: calculateResponsiveSlotHeight * 0.95,  // 5% smaller than large
    large: calculateResponsiveSlotHeight,          // Base (100%)
  };
  
  // Calculate exact total content height needed
  const totalContentHeight = useMemo(() => {
    const slotHeight = slotHeights[intervalHeight];
    return numberOfSlots * slotHeight;
  }, [numberOfSlots, slotHeights, intervalHeight]);

  // Custom barber header row
  const renderBarberHeader = () => {
    if (viewMode !== "day" || visibleBarbers.length === 0) return null;

    return (
      <div className="rbc-custom-barber-header">
        <div className="rbc-custom-barber-header-row">
          {/* Time label column */}
          <div className="rbc-custom-header-time-cell">
            <span className="text-xs font-medium text-gray-500"></span>
          </div>
          {/* Barber columns */}
          {visibleBarbers.map((barber) => {
            const workingHours = barber.workingHours && barber.workingHours.weekday === currentWeekday
              ? barber.workingHours
              : null;

            return (
              <div key={barber.id} className="rbc-custom-header-barber-cell">
                <div className="flex items-center gap-3 justify-center">
                  {barber.avatar ? (
                    <img
                      src={barber.avatar}
                      alt={barber.displayName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center border-2 border-gray-300 shadow-md flex-shrink-0">
                      <span className="text-base font-bold text-white">
                        {barber.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-900 leading-tight">
                      {barber.displayName}
                    </span>
                    {workingHours && (
                      <span className="text-xs text-gray-600 mt-0.5">
                        {workingHours.startTime} - {workingHours.endTime}
                      </span>
                    )}
                  </div>
                </div>
                {/* Working hours indicator bar */}
                {workingHours && (
                  <div className="w-full h-1 mt-3 bg-emerald-500/80 rounded-full" />
                )}
                {!workingHours && (
                  <div className="w-full h-1 mt-3 bg-gray-300 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Determine if we need horizontal scrolling for day view with many barbers
  const needsHorizontalScroll = viewMode === "day" && visibleBarbers.length > 3;

  // Use default heights for SSR, responsive heights after mount
  const finalSlotHeights = isMounted ? slotHeights : {
    small: 40,
    medium: 42,
    large: 45,
  };
  
  const finalTotalContentHeight = isMounted ? totalContentHeight : (numberOfSlots * finalSlotHeights[intervalHeight]);

  // Final debug log before rendering calendar - verify resourceId matching
  if (typeof window !== 'undefined' && viewMode === "day" && resources) {
    const resourceIds = resources.map(r => String(r.id));
    const eventResourceIds = events.map(e => String(e.resourceId));
    console.log('[Calendar Debug] Resource ID matching:', {
      resourceIds,
      eventResourceIds,
      allMatch: eventResourceIds.every(id => resourceIds.includes(id)),
      visibleBarbersCount: visibleBarbers.length,
      eventsCount: events.length
    });
  }

  return (
    <div 
      ref={calendarRef}
      className="rbc-calendar-wrapper"
      style={{
        ["--rbc-slot-height" as any]: `${finalSlotHeights[intervalHeight]}px`,
        ["--rbc-total-content-height" as any]: `${finalTotalContentHeight}px`,
        ["--rbc-barber-count" as any]: String(viewMode === "day" ? visibleBarbers.length : 1),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      } as React.CSSProperties}
    >
      {renderBarberHeader()}
      <div className={needsHorizontalScroll ? "overflow-x-auto" : ""} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <DragAndDropCalendar
        localizer={localizer}
        events={events}
        resources={resources}
        resourceAccessor={(event: any) => String(event.resourceId)}
        resourceIdAccessor={(resource: any) => String(resource.id)}
        resourceTitleAccessor={(resource: any) => resource.title}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        defaultView={viewMode === "day" ? Views.DAY : viewMap[viewMode]}
        view={viewMode === "day" ? Views.DAY : viewMap[viewMode]}
        views={[Views.DAY, Views.WEEK]}
        defaultDate={date}
        date={date}
        min={minTime}
        max={maxTime}
        step={step}
        timeslots={timeslots}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        onView={handleViewChange}
        onNavigate={handleNavigate}
        selectable
        draggableAccessor={() => true}
        resizable={false}
        popup
        showMultiDayTimes={false}
        components={{
          event: createEventComponent(t),
          resourceHeader: ResourceHeader,
        }}
        tooltipAccessor={() => ""}
        eventPropGetter={getEventStyle}
        slotPropGetter={slotPropGetter}
        dayPropGetter={() => ({
          style: {
            backgroundColor: 'transparent',
          },
        })}
        culture={locale}
        toolbar={false}
        formats={{
          dayFormat: (date: Date) => format(date, "EEE d", { locale: dateFnsLocale }),
          dayHeaderFormat: (date: Date) => {
            // For week view, show "Mon 8 Dec" format
            if (viewMode === "week") {
              return format(date, "EEE d MMM", { locale: dateFnsLocale });
            }
            // For day view, show full format
            return format(date, "EEEE, MMMM d", { locale: dateFnsLocale });
          },
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => 
            `${format(start, "MMM d", { locale: dateFnsLocale })} - ${format(end, "MMM d, yyyy", { locale: dateFnsLocale })}`,
          weekdayFormat: (date: Date) => format(date, "EEE", { locale: dateFnsLocale }),
          timeGutterFormat: (date: Date) => format(date, "HH:mm"),
          eventTimeRangeFormat: () => null,
          eventTimeRangeStartFormat: () => null,
          eventTimeRangeEndFormat: () => null,
        }}
        />
      </div>
    </div>
  );
}

```

`components/admin/admin-calendar-client.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, isSameDay, startOfDay, startOfMonth, endOfMonth, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Settings, Plus, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminCalendar, type RescheduleData } from "./AdminCalendar";
import { CalendarSettingsModal } from "./calendar-settings";
import { AppointmentDetailPanel } from "./appointment-detail-panel";
import { CreateAppointmentDialog } from "./create-appointment-dialog";
import { RescheduleAppointmentDialog } from "./reschedule-appointment-dialog";
import {
  loadCalendarSettings,
  saveCalendarSettings,
  getDefaultCalendarSettings,
} from "@/lib/utils/calendar";
import { deleteAppointmentAction, updateAppointmentStatusAction, rescheduleAppointmentAction } from "@/lib/actions/admin";
import type {
  AppointmentDisplayData,
  BarberDisplayData,
  CalendarSettings,
} from "@/lib/types/admin-calendar";

interface AdminCalendarClientProps {
  initialDate: Date;
  barbers: BarberDisplayData[];
  appointments: AppointmentDisplayData[];
}

type ViewMode = "day" | "week" | "month";

export function AdminCalendarClient({
  initialDate,
  barbers,
  appointments,
}: AdminCalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [isDeleting, setIsDeleting] = useState(false);

  // Listen for date changes from mini calendar
  useEffect(() => {
    const handleMiniCalendarDateSelect = (event: CustomEvent) => {
      setCurrentDate(new Date(event.detail));
    };

    window.addEventListener("mini-calendar-date-select" as any, handleMiniCalendarDateSelect);
    return () => {
      window.removeEventListener("mini-calendar-date-select" as any, handleMiniCalendarDateSelect);
    };
  }, []);

  // Notify mini calendar of date changes
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("calendar-date-change", { detail: currentDate })
    );
  }, [currentDate]);
  // Initialize settings with defaults (same on server and client)
  const getInitialSettings = (): CalendarSettings => {
    const barbersForSettings = barbers.map(b => ({ workingHours: b.workingHours }));
    const defaults = getDefaultCalendarSettings(barbersForSettings);
    // Initialize with all barbers selected
    if (barbers.length > 0) {
      defaults.selectedBarberIds = barbers.map((b) => b.id);
    }
    return defaults;
  };

  const [settings, setSettings] = useState<CalendarSettings>(getInitialSettings);
  const [isMounted, setIsMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDisplayData | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogInitialDate, setCreateDialogInitialDate] = useState<Date | undefined>();
  const [createDialogInitialTime, setCreateDialogInitialTime] = useState<string | undefined>();
  const [createDialogInitialBarberId, setCreateDialogInitialBarberId] = useState<string | undefined>();
  
  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<RescheduleData | null>(null);
  
  // Barber selector state for 4+ barbers (only in day view)
  const [barberSelectorValue, setBarberSelectorValue] = useState<string>("all");
  const showBarberSelector = barbers.length > 3 && viewMode === "day";
  
  // Compute filtered barber IDs based on selector
  const effectiveSelectedBarberIds = useMemo(() => {
    if (!showBarberSelector) {
      return settings.selectedBarberIds;
    }
    
    if (barberSelectorValue === "all") {
      // Show all barbers (allow horizontal scroll)
      return settings.selectedBarberIds;
    } else {
      // Show only selected barber
      return [barberSelectorValue];
    }
  }, [showBarberSelector, barberSelectorValue, settings.selectedBarberIds]);
  
  // Load from localStorage after mount (client-side only) to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    const barbersForSettings = barbers.map(b => ({ workingHours: b.workingHours }));
    const loaded = loadCalendarSettings(barbersForSettings);
    // Merge with defaults to ensure all fields are present
    const merged = { ...getInitialSettings(), ...loaded };
    // Ensure barbers are selected if none selected
    if (merged.selectedBarberIds.length === 0 && barbers.length > 0) {
      merged.selectedBarberIds = barbers.map((b) => b.id);
    }
    setSettings(merged);
  }, []); // Only run once on mount

  // Save settings when they change (only after mount)
  useEffect(() => {
    if (isMounted) {
      saveCalendarSettings(settings);
    }
  }, [settings, isMounted]);

  // Filter appointments for current date/week/month
  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = startOfDay(new Date(apt.startTime));
    const currentDateStart = startOfDay(currentDate);
    
    if (viewMode === "day") {
      return isSameDay(aptDate, currentDateStart);
    } else if (viewMode === "week") {
      // Week view - show appointments from Monday to Sunday of the selected week
      const weekStart = startOfWeek(currentDateStart, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDateStart, { weekStartsOn: 1 });
      return aptDate >= weekStart && aptDate <= weekEnd;
    } else {
      // Month view
      const monthStart = startOfMonth(currentDateStart);
      const monthEnd = endOfMonth(currentDateStart);
      return aptDate >= monthStart && aptDate <= monthEnd;
    }
  });

  const handlePrevious = useCallback(() => {
    if (viewMode === "day") {
      setCurrentDate(prev => subDays(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  }, [viewMode]);

  const handleNext = useCallback(() => {
    if (viewMode === "day") {
      setCurrentDate(prev => addDays(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleSettingsChange = useCallback((newSettings: CalendarSettings) => {
    setSettings(newSettings);
  }, []);

  const handleViewChange = useCallback((view: ViewMode) => {
    setViewMode(view);
    // Reset barber selector when switching away from day view
    if (view !== "day") {
      setBarberSelectorValue("all");
    }
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    if (isDeleting) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this appointment? This action cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteAppointmentAction(appointmentId);
      if (result.error) {
        alert(`Failed to delete appointment: ${result.error}`);
      } else {
        setSelectedAppointment(null);
        // Refresh the page to show updated appointments
        window.location.reload();
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the appointment.");
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting]);

  const handleUpdateStatus = useCallback(async (appointmentId: string, status: "BOOKED" | "ARRIVED" | "MISSED" | "CANCELED" | "COMPLETED") => {
    try {
      const result = await updateAppointmentStatusAction(appointmentId, status);
      if (result.error) {
        alert(`Failed to update status: ${result.error}`);
      } else {
        setSelectedAppointment(null);
        // Refresh the page to show updated status
        window.location.reload();
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("An error occurred while updating the status.");
    }
  }, []);

  // Handle appointment drag and drop reschedule
  const handleAppointmentReschedule = useCallback((data: RescheduleData) => {
    setRescheduleData(data);
    setRescheduleDialogOpen(true);
  }, []);

  // Confirm reschedule action
  const handleConfirmReschedule = useCallback(async (data: RescheduleData) => {
    const result = await rescheduleAppointmentAction(
      data.appointment.id,
      data.newStart.toISOString(),
      data.newEnd.toISOString(),
      data.newBarberId
    );

    if (result.error) {
      alert(`Failed to reschedule: ${result.error}`);
      throw new Error(result.error);
    }

    // Refresh the page to show updated appointment
    window.location.reload();
  }, []);

  const formatDateDisplay = (date: Date) => {
    if (viewMode === "day") {
      return format(date, "EEEE, d MMMM yyyy");
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy")}`;
    } else {
      return format(date, "MMMM yyyy");
    }
  };

  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="space-y-4">
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-1.5 border border-gray-700/50">
            <button
              onClick={() => setViewMode("day")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewMode === "day"
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Day</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewMode === "week"
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">Week</span>
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="h-10 w-10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <button
              onClick={handleToday}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border ${
                isToday
                  ? "bg-primary/20 text-primary border-primary/50"
                  : "text-gray-300 border-gray-700/50 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              Today
            </button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-10 w-10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Current Date Display */}
          <div className="text-white text-lg font-semibold tracking-tight">
            {formatDateDisplay(currentDate)}
          </div>
        </div>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          className="h-10 w-10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/50"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Barber Selector for 4+ barbers (Day view only) */}
      {showBarberSelector && (
        <div className="flex items-center gap-3 p-3 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800">
          <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
            View:
          </label>
          <Select value={barberSelectorValue} onValueChange={setBarberSelectorValue}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="all" className="text-white focus:bg-gray-800 cursor-pointer">
                All Barbers ({barbers.length})
              </SelectItem>
              {barbers.map((barber) => (
                <SelectItem
                  key={barber.id}
                  value={barber.id}
                  className="text-white focus:bg-gray-800 cursor-pointer"
                >
                  {barber.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {barberSelectorValue === "all" && (
            <span className="text-xs text-gray-400 ml-auto">
              Scroll horizontally to see all barbers
            </span>
          )}
        </div>
      )}

      {/* Calendar - White card on dark background */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
        <AdminCalendar
          date={currentDate}
          barbers={barbers}
          appointments={filteredAppointments}
          onAppointmentClick={setSelectedAppointment}
          onCellClick={(date, barberId) => {
            setCreateDialogInitialDate(date);
            setCreateDialogInitialTime(format(date, "HH:mm"));
            setCreateDialogInitialBarberId(barberId);
            setCreateDialogOpen(true);
          }}
          onAppointmentReschedule={handleAppointmentReschedule}
          selectedBarberIds={effectiveSelectedBarberIds}
          timeRange={settings.timeRange}
          viewMode={viewMode}
          timeInterval={settings.timeInterval}
          intervalHeight={settings.intervalHeight}
          onViewChange={handleViewChange}
          onDateChange={handleDateChange}
        />
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => {
          setCreateDialogInitialDate(currentDate);
          setCreateDialogInitialTime(undefined);
          setCreateDialogInitialBarberId(undefined);
          setCreateDialogOpen(true);
        }}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 z-50 transition-all duration-200 hover:scale-105"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Settings Modal */}
      <CalendarSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        barbers={barbers}
      />

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        barbers={barbers}
        initialDate={createDialogInitialDate}
        initialTime={createDialogInitialTime}
        initialBarberId={createDialogInitialBarberId}
        onSuccess={() => {
          // Refresh the page to show new appointment
          window.location.reload();
        }}
      />

      {/* Appointment Detail Panel - Overlay */}
      {selectedAppointment && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedAppointment(null)}
          />
          <AppointmentDetailPanel
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
            onDelete={handleDeleteAppointment}
            onCheckout={(id) => {
              handleUpdateStatus(id, "COMPLETED");
            }}
            onMarkArrived={(id) => {
              handleUpdateStatus(id, "ARRIVED");
            }}
            onMarkMissed={(id) => {
              handleUpdateStatus(id, "MISSED");
            }}
            onReschedule={(id) => {
              // TODO: Open reschedule dialog
              console.log("Reschedule:", id);
            }}
            onBookAgain={(id) => {
              // TODO: Open booking dialog with same customer/service
              console.log("Book again:", id);
            }}
            onAddService={(id) => {
              // TODO: Open add service dialog
              console.log("Add service:", id);
            }}
            onAddNote={(id) => {
              // TODO: Open add note dialog
              console.log("Add note:", id);
            }}
          />
        </>
      )}

      {/* Reschedule Appointment Dialog */}
      <RescheduleAppointmentDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        rescheduleData={rescheduleData}
        barbers={barbers}
        onConfirm={handleConfirmReschedule}
      />
    </div>
  );
}

```