---
name: Fix Calendar View Issues
overview: Remove cashing up counter, fix week view functionality, and adjust calendar width to not take full space with proper right margin.
todos: []
---

# Fix Calendar View Issues

## Issues to Fix

1. **Remove cashing up counter** - Completely remove the cashing up summary bar
2. **Fix week view** - Week view should display appointments for the entire week, not just one day
3. **Adjust calendar width** - Calendar should not take full width, should have proper margins/spacing to the right

## Implementation Tasks

### 1. Remove Cashing Up Counter (`components/admin/admin-calendar-client.tsx`)

- Remove the cashing up summary div completely
- Remove the `calculateDailyTotal` import if no longer needed
- Clean up any related code

### 2. Fix Week View (`components/admin/admin-calendar-client.tsx`)

- Fix the week view filtering logic to properly show appointments for all 7 days of the week
- Update the calendar grid to handle week view properly
- Ensure appointments from Monday to Sunday are displayed correctly

### 3. Adjust Calendar Width (`components/admin/admin-calendar-grid.tsx`, `components/admin/admin-calendar-client.tsx`)

- Add max-width constraint to calendar container
- Add proper right margin/padding
- Ensure calendar doesn't stretch to full viewport width
- Make it more compact and centered or left-aligned with space on the right

## Files to Modify

- `components/admin/admin-calendar-client.tsx` - Remove cashing up, fix week view, adjust width
- `components/admin/admin-calendar-grid.tsx` - Adjust width constraints