"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales } from "@/lib/i18n/config-constants";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

const localeNames: Record<string, string> = {
  de: "DE",
  en: "EN",
  ru: "RU",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
    setIsOpen(false);
  };

  // Update coordinates when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 70; // Match button width exactly
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX, // Align left edge with button
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return;
      }
      // Check if click is inside dropdown (which is in portal)
      const dropdown = document.getElementById("language-dropdown-portal");
      if (dropdown && dropdown.contains(target)) {
        return;
      }
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Update coords on scroll/resize
      window.addEventListener("scroll", () => setIsOpen(false));
      window.addEventListener("resize", () => setIsOpen(false));
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", () => setIsOpen(false));
      window.removeEventListener("resize", () => setIsOpen(false));
    };
  }, [isOpen]);

  return (
    <div className="relative w-[70px] flex-shrink-0 z-[1000]" style={{ width: '70px' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-[70px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        type="button"
      >
        <span>{localeNames[locale]}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          id="language-dropdown-portal"
          className="absolute mt-1 w-[70px] overflow-hidden rounded-md border border-gray-800 bg-black text-white shadow-lg z-[9999]"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
        >
          <div className="p-1">
            {locales.map((loc) => {
              const isActive = locale === loc;
              return (
                <div
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className={`relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm py-2 pl-3 text-sm font-semibold outline-none transition-colors ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {localeNames[loc]}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

