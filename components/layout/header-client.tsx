"use client";

import dynamic from "next/dynamic";

// Dynamically import Header to ensure it only renders on client where ClerkProvider is available
const Header = dynamic(() => import("./header"), {
  ssr: false,
  loading: () => (
    <header className="fixed top-0 left-0 right-0 z-[999] bg-black">
      <div className="container-fluid">
        <div className="flex items-center justify-between h-16 md:h-18 relative min-h-[64px] md:min-h-[72px]">
          <div className="flex items-center">
            <div className="md:hidden w-10 h-10" />
            <div className="hidden md:flex items-center justify-center h-12">
              <div className="relative h-10 w-auto max-w-[120px] flex items-center justify-center overflow-hidden">
                <img
                  src="/logo/logo.jpg"
                  alt="Zyron Barber Studio"
                  className="h-full w-full object-cover object-center"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 ml-auto flex-shrink-0 min-w-0">
            <div className="hidden md:flex items-center gap-3 flex-shrink-0 min-w-0">
              <div className="w-10 h-10" />
              <div className="w-20 h-9" />
              <div className="w-20 h-9" />
            </div>
            <div className="md:hidden w-10 h-10" />
          </div>
        </div>
      </div>
    </header>
  ),
});

export default function HeaderClient() {
  return <Header />;
}


