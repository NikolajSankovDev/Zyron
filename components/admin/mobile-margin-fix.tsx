"use client";

import { useEffect } from "react";

export function MobileMarginFix() {
  useEffect(() => {
    // Inject critical CSS directly
    const styleId = 'mobile-margin-fix-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media (max-width: 1023px) {
          [data-main-content-wrapper] {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
        @media (min-width: 1024px) {
          [data-main-content-wrapper] {
            margin-left: 20rem !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const fixMargin = () => {
      const mainWrapper = document.querySelector('[data-main-content-wrapper]') as HTMLElement;
      
      if (mainWrapper) {
        const isMobile = window.innerWidth < 1024;
        
        if (isMobile) {
          mainWrapper.style.setProperty('margin-left', '0', 'important');
          mainWrapper.style.setProperty('width', '100%', 'important');
          mainWrapper.style.setProperty('max-width', '100%', 'important');
        } else {
          mainWrapper.style.setProperty('margin-left', '20rem', 'important');
          mainWrapper.style.removeProperty('width');
          mainWrapper.style.removeProperty('max-width');
        }
        
        // Force reflow
        void mainWrapper.offsetHeight;
      }
    };

    // Try immediately
    fixMargin();

    // Retry after a short delay in case element isn't ready
    const timeout1 = setTimeout(fixMargin, 100);
    const timeout2 = setTimeout(fixMargin, 500);
    const timeout3 = setTimeout(fixMargin, 1000);

    // Also use MutationObserver to catch when element is added
    const observer = new MutationObserver(() => {
      fixMargin();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Apply on resize
    window.addEventListener('resize', fixMargin);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      window.removeEventListener('resize', fixMargin);
      observer.disconnect();
    };
  }, []);

  return null;
}

