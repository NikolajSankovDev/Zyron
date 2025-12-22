"use client";

import { useEffect, useRef } from "react";

// Global counter to track how many components are using the scrollbar fix
let scrollbarFixCount = 0;
let scrollbarWidth: number | null = null;
let originalPaddingRight: string | null = null;
let originalOverflow: string | null = null;
let originalPosition: string | null = null;
let originalTop: string | null = null;
let originalLeft: string | null = null;
let originalRight: string | null = null;

/**
 * Hook to prevent layout shift when modals/dropdowns open
 * by maintaining scrollbar space with padding
 * 
 * Handles multiple simultaneous dialogs/dropdowns correctly
 */
export function useScrollbarFix(isOpen: boolean) {
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      // Only cleanup if we were the ones who activated it
      if (isActiveRef.current) {
        scrollbarFixCount--;
        isActiveRef.current = false;

        // If no more components need the fix, restore original styles
        if (scrollbarFixCount === 0) {
          // Restore scroll position first
          const scrollY = document.body.style.top ? parseInt(document.body.style.top) * -1 : 0;
          
          // Remove all the styles we added
          document.body.style.removeProperty('position');
          document.body.style.removeProperty('top');
          document.body.style.removeProperty('left');
          document.body.style.removeProperty('right');
          document.body.style.removeProperty('width');
          document.documentElement.style.removeProperty('overflow-y');
          
          // Restore original styles
          if (originalPaddingRight !== null) {
            document.body.style.paddingRight = originalPaddingRight;
          }
          if (originalOverflow !== null) {
            document.body.style.overflow = originalOverflow;
          }
          if (originalPosition !== null) {
            document.body.style.position = originalPosition;
          }
          if (originalTop !== null) {
            document.body.style.top = originalTop;
          }
          if (originalLeft !== null) {
            document.body.style.left = originalLeft;
          }
          if (originalRight !== null) {
            document.body.style.right = originalRight;
          }
          
          // Restore scroll position
          if (scrollY) {
            window.scrollTo(0, scrollY);
          }
        }
      }
      return;
    }

    // Calculate scrollbar width only once
    if (scrollbarWidth === null) {
      scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    }

    // Only apply fix if scrollbar exists (width > 0)
    if (scrollbarWidth > 0) {
      // Store original values only on first activation
      if (scrollbarFixCount === 0) {
        originalPaddingRight = document.body.style.paddingRight || null;
        originalOverflow = document.body.style.overflow || null;
        originalPosition = document.body.style.position || null;
        originalTop = document.body.style.top || null;
        originalLeft = document.body.style.left || null;
        originalRight = document.body.style.right || null;
      }

      // Increment counter and mark as active
      scrollbarFixCount++;
      isActiveRef.current = true;

      // Use position: fixed to prevent scrolling while keeping scrollbar visible
      // This preserves the scrollbar space without affecting layout width
      const scrollY = window.scrollY;
      document.body.style.setProperty('position', 'fixed', 'important');
      document.body.style.setProperty('top', `-${scrollY}px`, 'important');
      document.body.style.setProperty('left', '0', 'important');
      document.body.style.setProperty('right', '0', 'important');
      document.body.style.setProperty('width', '100%', 'important');
      // Keep overflow-y: scroll to show scrollbar (scrollbar-gutter: stable handles the space)
      document.documentElement.style.setProperty('overflow-y', 'scroll', 'important');

      // Cleanup: decrement counter and restore if needed
      return () => {
        if (isActiveRef.current) {
          scrollbarFixCount--;
          isActiveRef.current = false;

          // If no more components need the fix, restore original styles
          if (scrollbarFixCount === 0) {
            if (originalPaddingRight !== null) {
              document.body.style.paddingRight = originalPaddingRight;
            } else {
              document.body.style.paddingRight = "";
            }
            if (originalOverflow !== null) {
              document.body.style.overflow = originalOverflow;
            } else {
              document.body.style.overflow = "";
            }
          }
        }
      };
    }
  }, [isOpen]);
}

