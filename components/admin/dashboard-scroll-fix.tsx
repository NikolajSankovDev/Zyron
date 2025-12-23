"use client";

import { useEffect } from "react";

export function DashboardScrollFix() {
  useEffect(() => {
    console.log('[DashboardScrollFix] Component mounted, window width:', window.innerWidth);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard-scroll-fix.tsx:9',message:'DashboardScrollFix useEffect started',data:{windowWidth:window.innerWidth,isMobile:window.innerWidth<=640},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A'})}).catch((e)=>{console.error('[DashboardScrollFix] Log fetch failed:',e);});
    // #endregion

    const main = document.querySelector('main[data-admin-main]');
    const contentWrapper = document.querySelector('[data-main-content-wrapper]');
    const dashboardContent = document.querySelector('[data-dashboard-page]');
    const adminPage = document.querySelector('[data-admin-page]');
    const rootContainer = document.querySelector('.min-h-screen');
    
    if (main) {
      main.classList.add('dashboard-page');
      
      // #region agent log
      const mainRect = main.getBoundingClientRect();
      const mainStyles = window.getComputedStyle(main);
      fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard-scroll-fix.tsx:18',message:'Main element measurements BEFORE fix',data:{mainHeight:mainRect.height,mainScrollHeight:main.scrollHeight,mainOverflow:mainStyles.overflow,mainHeightStyle:mainStyles.height,mainMinHeight:mainStyles.minHeight,mainMaxHeight:mainStyles.maxHeight,viewportHeight:window.innerHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Force styles for mobile
      if (window.innerWidth <= 640) {
        (main as HTMLElement).style.height = 'auto';
        (main as HTMLElement).style.overflow = 'visible';
        (main as HTMLElement).style.minHeight = 'auto';
        (main as HTMLElement).style.maxHeight = 'none';
        
        // #region agent log
        const afterMainRect = main.getBoundingClientRect();
        const afterMainStyles = window.getComputedStyle(main);
        fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard-scroll-fix.tsx:28',message:'Main element measurements AFTER fix',data:{mainHeight:afterMainRect.height,mainScrollHeight:main.scrollHeight,mainOverflow:afterMainStyles.overflow,mainHeightStyle:afterMainStyles.height,mainMinHeight:afterMainStyles.minHeight,mainMaxHeight:afterMainStyles.maxHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
    }

    // Measure parent containers
    if (contentWrapper) {
      // #region agent log
      const wrapperRect = (contentWrapper as HTMLElement).getBoundingClientRect();
      const wrapperStyles = window.getComputedStyle(contentWrapper as HTMLElement);
      fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard-scroll-fix.tsx:38',message:'Content wrapper measurements',data:{wrapperHeight:wrapperRect.height,wrapperScrollHeight:(contentWrapper as HTMLElement).scrollHeight,wrapperOverflow:wrapperStyles.overflow,wrapperHeightStyle:wrapperStyles.height,wrapperMinHeight:wrapperStyles.minHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }

    if (dashboardContent) {
      // #region agent log
      const contentRect = (dashboardContent as HTMLElement).getBoundingClientRect();
      const contentStyles = window.getComputedStyle(dashboardContent as HTMLElement);
      const lastChild = dashboardContent.lastElementChild;
      const lastChildRect = lastChild ? lastChild.getBoundingClientRect() : null;
      const bodyScrollHeight = document.body.scrollHeight;
      const bodyClientHeight = document.documentElement.clientHeight;
      const windowInnerHeight = window.innerHeight;
      const windowOuterHeight = window.outerHeight;
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0;
      fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard-scroll-fix.tsx:49',message:'Dashboard content measurements BEFORE fix',data:{contentHeight:contentRect.height,contentBottom:contentRect.bottom,contentPaddingBottom:contentStyles.paddingBottom,contentMarginBottom:contentStyles.marginBottom,viewportHeight:windowInnerHeight,windowOuterHeight,lastChildBottom:lastChildRect?.bottom,lastChildHeight:lastChildRect?.height,lastChildVisible:lastChildRect ? lastChildRect.bottom <= windowInnerHeight : null,lastChildCutoff:lastChildRect ? lastChildRect.bottom > windowInnerHeight : null,bodyScrollHeight,bodyClientHeight,scrollDifference:bodyScrollHeight-bodyClientHeight,safeAreaBottom},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Add extra bottom padding on mobile to prevent cutoff
      if (window.innerWidth <= 640) {
        console.log('[DashboardScrollFix] Mobile detected, applying padding fix');
        // Calculate required padding: viewport height + safe area + extra margin
        const requiredPadding = Math.max(150, safeAreaBottom + 120);
        console.log('[DashboardScrollFix] Setting padding-bottom to:', requiredPadding);
        (dashboardContent as HTMLElement).style.setProperty('padding-bottom', `${requiredPadding}px`, 'important');
        (dashboardContent as HTMLElement).style.setProperty('margin-bottom', '30px', 'important');
      }
    }
    
    // Also handle other admin pages (barbers, services)
    if (adminPage && adminPage !== dashboardContent) {
      // #region agent log
      const pageRect = (adminPage as HTMLElement).getBoundingClientRect();
      const pageStyles = window.getComputedStyle(adminPage as HTMLElement);
      fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard-scroll-fix.tsx:75',message:'Admin page measurements',data:{pageType:(adminPage as HTMLElement).getAttribute('data-admin-page'),pageHeight:pageRect.height,pageOverflow:pageStyles.overflow,pageHeightStyle:pageStyles.height,viewportHeight:window.innerHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A'})}).catch((e)=>{console.error('[DashboardScrollFix] Log fetch failed:',e);});
      // #endregion
      
      if (window.innerWidth <= 640) {
        console.log('[DashboardScrollFix] Fixing admin page:', (adminPage as HTMLElement).getAttribute('data-admin-page'));
        (adminPage as HTMLElement).style.setProperty('height', 'auto', 'important');
        (adminPage as HTMLElement).style.setProperty('overflow', 'visible', 'important');
        (adminPage as HTMLElement).style.setProperty('min-height', 'auto', 'important');
        (adminPage as HTMLElement).style.setProperty('max-height', 'none', 'important');
        
        // Force the main element to allow content to extend
        if (main) {
          (main as HTMLElement).style.setProperty('padding-bottom', '0', 'important');
          (main as HTMLElement).style.setProperty('margin-bottom', '0', 'important');
          (main as HTMLElement).style.setProperty('min-height', 'auto', 'important');
        }
        
        // Also ensure body can scroll
        document.body.style.setProperty('overflow-y', 'auto', 'important');
        document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
        
        // #region agent log
        setTimeout(() => {
          const afterRect = (dashboardContent as HTMLElement).getBoundingClientRect();
          const afterStyles = window.getComputedStyle(dashboardContent as HTMLElement);
          const afterBodyScrollHeight = document.body.scrollHeight;
          const afterLastChildRect = lastChild ? lastChild.getBoundingClientRect() : null;
          console.log('[DashboardScrollFix] After fix - padding:', afterStyles.paddingBottom, 'lastChild bottom:', afterLastChildRect?.bottom, 'viewport:', window.innerHeight);
          fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard-scroll-fix.tsx:70',message:'Dashboard content measurements AFTER padding fix',data:{contentHeight:afterRect.height,contentBottom:afterRect.bottom,contentPaddingBottom:afterStyles.paddingBottom,contentMarginBottom:afterStyles.marginBottom,viewportHeight:window.innerHeight,lastChildBottom:afterLastChildRect?.bottom,lastChildVisible:afterLastChildRect ? afterLastChildRect.bottom <= window.innerHeight : null,bodyScrollHeight:afterBodyScrollHeight,scrollDifference:afterBodyScrollHeight-document.documentElement.clientHeight,canScrollToBottom:afterBodyScrollHeight > document.documentElement.clientHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A'})}).catch((e)=>{console.error('[DashboardScrollFix] Log fetch failed:',e);});
        }, 200);
        // #endregion
      } else {
        console.log('[DashboardScrollFix] Not mobile, skipping fix');
      }
    }

    if (rootContainer) {
      // #region agent log
      const rootRect = (rootContainer as HTMLElement).getBoundingClientRect();
      const rootStyles = window.getComputedStyle(rootContainer as HTMLElement);
      fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard-scroll-fix.tsx:54',message:'Root container measurements',data:{rootHeight:rootRect.height,rootMinHeight:rootStyles.minHeight,rootHeightStyle:rootStyles.height,rootOverflow:rootStyles.overflow,viewportHeight:window.innerHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }

    // Check if content is scrollable
    // #region agent log
    const bodyScrollHeight = document.body.scrollHeight;
    const bodyClientHeight = document.documentElement.clientHeight;
    const canScroll = bodyScrollHeight > bodyClientHeight;
    fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard-scroll-fix.tsx:62',message:'Page scrollability check',data:{bodyScrollHeight,bodyClientHeight,canScroll,scrollDifference:bodyScrollHeight-bodyClientHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
  }, []);

  return null;
}

