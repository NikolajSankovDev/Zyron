"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import { createAppointmentAction } from "@/lib/actions/appointment";
import { format, isBefore, startOfDay, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { de, enUS, ru } from "date-fns/locale";
import { Loader2, Scissors, Users, Sparkles, Clock, ChevronDown, ChevronUp, User, Calendar, Euro, CheckCircle2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface Barber {
  id: string;
  displayName: string;
  bio: string | null;
  languages: string[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Service {
  id: number;
  slug: string;
  durationMinutes: number;
  basePrice: number;
  translations: Array<{
    name: string;
    description: string | null;
  }>;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface BarberSlots {
  barberId: string;
  slots: TimeSlot[];
}

type ServiceCategory = "services" | "beardServices" | "headWashMassageStyling";

// Categorize services based on slug/name
function categorizeService(service: Service, locale: string): ServiceCategory {
  const slug = service.slug.toLowerCase();
  const name = service.translations[0]?.name?.toLowerCase() || "";
  const searchText = `${slug} ${name}`;

  // Specific beard services that should be in beardServices category
  const beardServiceSlugs = [
    "beard-trim-hot-towel",
    "beard-shaping",
    "buzzcut-beard-shaping",
    "buzzcut-beard-trim-razor"
  ];

  if (beardServiceSlugs.includes(slug)) {
    return "beardServices";
  }

  if (
    searchText.includes("wash") ||
    searchText.includes("massage") ||
    searchText.includes("styling") ||
    searchText.includes("wäsche") ||
    searchText.includes("стилизация")
  ) {
    return "headWashMassageStyling";
  }
  
  // All other services go to "services" category
  return "services";
}

// Component to handle service description with overflow detection
function ServiceDescription({ 
  serviceId, 
  description, 
  isExpanded,
  onToggle,
  t,
  className = "leading-relaxed"
}: { 
  serviceId: number; 
  description: string; 
  isExpanded: boolean;
  onToggle: () => void;
  t: any;
  className?: string;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  
  useEffect(() => {
    // Only check on mobile (when screen width is small)
    const checkOverflow = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        setNeedsTruncation(false);
        return;
      }
      
      if (textRef.current && !isExpanded) {
        // Temporarily remove line-clamp to measure full height
        const hasLineClamp = textRef.current.classList.contains('line-clamp-2');
        if (hasLineClamp) {
          textRef.current.classList.remove('line-clamp-2');
        }
        const fullHeight = textRef.current.scrollHeight;
        if (hasLineClamp) {
          textRef.current.classList.add('line-clamp-2');
        }
        
        // Measure height with line-clamp-2
        const clampedHeight = textRef.current.offsetHeight;
        
        // If full height is greater than clamped height, text overflows
        const actuallyOverflows = fullHeight > clampedHeight;
        setNeedsTruncation(actuallyOverflows);
      } else if (textRef.current && isExpanded) {
        // When expanded, check if it would overflow when collapsed
        const fullHeight = textRef.current.scrollHeight;
        // Estimate 2-line height (approximate)
        const lineHeight = parseFloat(window.getComputedStyle(textRef.current).lineHeight);
        const clampedHeight = lineHeight * 2;
        setNeedsTruncation(fullHeight > clampedHeight);
      }
    };
    
    // Small delay to ensure DOM is ready and styles are applied
    const timeoutId = setTimeout(checkOverflow, 50);
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [serviceId, description, isExpanded]);
  
  return (
    <div>
      {/* Desktop: Full text, Mobile: Conditional truncation */}
      <p 
        ref={textRef}
        className={`text-small text-gray-400 ${className} ${!isExpanded && needsTruncation ? 'line-clamp-2' : ''}`}
      >
        {description}
      </p>
      {/* Only show "Mehr anzeigen" on mobile when text actually overflows */}
      {needsTruncation && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="sm:hidden text-primary hover:text-primary/80 text-small font-medium mt-1.5 transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
        >
          {isExpanded ? t("showLess") : t("showMore")}
        </button>
      )}
    </div>
  );
}

export default function BookPage() {
  const t = useTranslations("booking");
  const locale = useLocale();
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  
  const getBarberBio = (displayName: string, defaultBio: string | null) => {
    // Always return defaultBio to avoid translation errors
    // Translation keys may not exist for all barbers
    return defaultBio || "";
  };

  // Format date for Step 3 header - language-specific formatting
  const formatSelectedDate = (date: Date, isToday: boolean) => {
    const dateLocale = locale === "de" ? de : locale === "ru" ? ru : enUS;
    
    if (locale === "ru") {
      // Russian: "Сегодня, 6 декабря 2025" or "Суббота, 7 декабря 2025" (Genitiv, no point after day)
      if (isToday) {
        return `${t("today")}, ${format(date, "d MMMM yyyy", { locale: dateLocale })}`;
      }
      return format(date, "EEEE, d MMMM yyyy", { locale: dateLocale });
    } else if (locale === "de") {
      // German: "Heute, 6. Dezember 2025" or "Montag, 7. Dezember 2025" (with point after day)
      if (isToday) {
        return `${t("today")}, ${format(date, "d. MMMM yyyy", { locale: dateLocale })}`;
      }
      return format(date, "EEEE, d. MMMM yyyy", { locale: dateLocale });
    } else {
      // English: "Today, December 6, 2025" or "Saturday, December 7, 2025"
      if (isToday) {
        return `${t("today")}, ${format(date, "MMMM d, yyyy", { locale: dateLocale })}`;
      }
      return format(date, "EEEE, MMMM d, yyyy", { locale: dateLocale });
    }
  };
  
  // Initialize step - always start at 1, will be updated on mount if URL params exist
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Data
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barberSlots, setBarberSlots] = useState<BarberSlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [calendarAvailability, setCalendarAvailability] = useState<
    Record<string, "available" | "booked" | "sunday">
  >({});
  
  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    services: true,
    beardServices: false,
    headWashMassageStyling: false,
  });
  
  // Expanded descriptions state (only for mobile)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
  
  // Expanded barber slots state (only for mobile)
  const [expandedBarberSlots, setExpandedBarberSlots] = useState<Record<string, boolean>>({});
  
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const toggleDescription = (serviceId: number) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };
  
  const toggleBarberSlots = (barberId: string) => {
    setExpandedBarberSlots(prev => ({
      ...prev,
      [barberId]: !prev[barberId]
    }));
  };

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  
  // Track if we've already restored state from URL params
  const hasRestoredState = useRef(false);

  // Mark component as mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for URL params and set initial step if needed (client-side only)
  useEffect(() => {
    if (!isMounted) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const serviceIdParam = searchParams.get("serviceId");
    const dateParam = searchParams.get("date");
    if (serviceIdParam && dateParam) {
      // If we have URL params, we're returning from login - start at step 3
      setStep(3);
    }
  }, [isMounted]);

  // Restore state from URL parameters after login
  useEffect(() => {
    if (typeof window === "undefined" || services.length === 0 || !isSignedIn || !authLoaded || hasRestoredState.current) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const serviceIdParam = searchParams.get("serviceId");
    const dateParam = searchParams.get("date");
    
    // Only restore if we have both parameters
    if (serviceIdParam && dateParam) {
      const serviceId = parseInt(serviceIdParam, 10);
      // Parse date string (YYYY-MM-DD) in local timezone to avoid timezone issues
      const [year, month, day] = dateParam.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      
      // Validate date
      if (isNaN(date.getTime())) return;
      
      // Find the service
      const service = services.find(s => s.id === serviceId);
      if (!service) return;
      
      // Mark as restored to prevent multiple restorations
      hasRestoredState.current = true;
      
      // Set the service and date immediately
      setSelectedService(service);
      setSelectedDate(date);
      
      // Ensure we're on step 3 (should already be set from initial state, but just in case)
      setStep(3);
      
      // Clean up URL parameters immediately
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [services, isSignedIn, authLoaded]);

  // Fetch barbers on mount
  useEffect(() => {
    fetch("/api/barbers")
      .then((res) => res.json())
      .then((data) => {
        setBarbers(data.barbers || []);
      })
      .catch((err) => {
        console.error("Error fetching barbers:", err);
      });
  }, []);

  // Fetch services on mount
  useEffect(() => {
    fetch(`/api/services?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched services:", data.services?.length || 0);
        setServices(data.services || []);
      })
      .catch((err) => {
        console.error("Error fetching services:", err);
        setServices([]);
      });
  }, [locale]);

  // Handle hash navigation on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [services]);

  // Scroll to top when step changes to 2 (date selection)
  useEffect(() => {
    if (step === 2 && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  // Scroll to top when step changes to 4 (confirmation)
  useEffect(() => {
    if (step === 4 && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  // Fetch calendar availability when service is selected
  useEffect(() => {
    if (selectedService && step >= 2) {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      
      fetch(
        `/api/availability?serviceId=${selectedService.id}&date=${monthStart.toISOString()}&duration=${selectedService.durationMinutes}`
      )
        .then((res) => res.json())
        .then((data) => {
          setCalendarAvailability(data.availability || {});
        })
        .catch((err) => {
          console.error("Error fetching availability:", err);
          setCalendarAvailability({});
        });
    }
  }, [selectedService, step]);

  // Fetch time slots when date and service are selected
  useEffect(() => {
    if (selectedDate && selectedService && step === 3) {
      // Wait for auth to load before checking
      if (!authLoaded) return;
      
      // Check authentication using Clerk
      if (!isSignedIn) {
        // User is not authenticated, redirect to login
        const dateISO = selectedDate.toISOString().split("T")[0];
        const returnUrl = `/${locale}/book?serviceId=${selectedService.id}&date=${dateISO}`;
        router.push(`/${locale}/auth/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
        return;
      }
      
      // User is authenticated, proceed with fetching slots
      const fetchSlots = async () => {
        setLoadingSlots(true);
        setError(null);
        try {
          const dateStr = selectedDate.toISOString().split("T")[0];
          const slotsRes = await fetch(
            `/api/slots?serviceId=${selectedService.id}&date=${dateStr}&duration=${selectedService.durationMinutes}`
          );
          
          if (!slotsRes.ok) {
            throw new Error(`Failed to fetch slots: ${slotsRes.statusText}`);
          }
          
          const data = await slotsRes.json();
          if (data.error) {
            setError(data.error);
            setBarberSlots([]);
          } else {
            setBarberSlots(data.slotsByBarber || []);
            if (!data.slotsByBarber || data.slotsByBarber.length === 0) {
              setError("No available time slots for this date. Please select another date.");
            }
          }
        } catch (err: any) {
          console.error("Error fetching slots:", err);
          setError(err.message || "Something went wrong. Please try again.");
          setBarberSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };
      
      fetchSlots();
    }
  }, [selectedDate, selectedService, step, locale, router, isSignedIn, authLoaded]);

  // Define exact order for each category based on screenshots
  const serviceOrderMap: Record<ServiceCategory, string[]> = {
    services: [
      "haircut-beard-hot-towel",
      "haircut-beard-shaping",
      "haircut",
      "long-haircut",
      "buzzcut",
      "father-son",
      "children-haircut",
    ],
    beardServices: [
      "beard-trim-hot-towel",
      "beard-shaping",
      "buzzcut-beard-shaping",
      "buzzcut-beard-trim-razor",
    ],
    headWashMassageStyling: [
      "head-wash-massage-styling",
    ],
  };

  // Group services by category
  const servicesByCategory = services.reduce(
    (acc, service) => {
      const category = categorizeService(service, locale);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    },
    {} as Record<ServiceCategory, Service[]>
  );
  
  // Sort services within each category according to the exact order defined above
  Object.keys(servicesByCategory).forEach((category) => {
    const categoryKey = category as ServiceCategory;
    const orderArray = serviceOrderMap[categoryKey] || [];
    
    servicesByCategory[categoryKey].sort((a, b) => {
      const indexA = orderArray.indexOf(a.slug);
      const indexB = orderArray.indexOf(b.slug);
      
      // If both services are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one is in the array, it comes first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither is in the array, maintain original order (by id)
      return a.id - b.id;
    });
  });

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(undefined);
    setSelectedBarber(null);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (date) {
      // Wait for auth to load before checking
      if (!authLoaded) {
        setError("Please wait while we verify your authentication...");
        return;
      }
      
      // Check authentication using Clerk
      if (!isSignedIn) {
        // Create returnUrl with service and date for state restoration
        const dateISO = date.toISOString().split("T")[0];
        const returnUrl = `/${locale}/book?serviceId=${selectedService?.id}&date=${dateISO}`;
        router.push(`/${locale}/auth/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
        return;
      }
      
      setSelectedDate(date);
      setSelectedBarber(null);
      setSelectedSlot(null);
      setStep(3);
    }
  };

  const handleSlotSelect = (barberId: string, slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedBarber(barberId);
    setSelectedSlot(slot);
    // Automatically proceed to confirmation step
    setStep(4);
  };

  const handleBack = () => {
    setError(null);
    if (step === 2) {
      setSelectedService(null);
      setSelectedDate(undefined);
      setStep(1);
    } else if (step === 3) {
      setSelectedDate(undefined);
      setSelectedBarber(null);
      setSelectedSlot(null);
      setStep(2);
    } else if (step === 4) {
      setSelectedBarber(null);
      setSelectedSlot(null);
      setStep(3);
    }
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedBarber || !selectedSlot) {
      setError("Please complete all steps");
      return;
    }

    // Wait for auth to load before checking
    if (!authLoaded) {
      setError("Please wait while we verify your authentication...");
      return;
    }

    // Check authentication using Clerk
    if (!isSignedIn) {
      const returnUrl = `/${locale}/book`;
      router.push(`/${locale}/auth/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("barberId", selectedBarber);
      formData.append("startTime", new Date(selectedSlot.start).toISOString());
      formData.append("serviceIds", JSON.stringify([selectedService.id]));

      const result = await createAppointmentAction(formData);
      if (result?.error) {
        setError(result.error);
        setSubmitting(false);
      } else {
        router.push("/account/appointments");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create appointment");
      setSubmitting(false);
    }
  };

  const selectedBarberData = barbers.find((b) => b.id === selectedBarber);

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section - Only show when no service selected */}
      {step === 1 && (
        <section className="bg-black pt-20 sm:pt-28 lg:pt-32">
          <div className="container-fluid">
            <div className="text-center">
              <h1 className="text-3xl sm:text-hero font-bold mb-4 sm:mb-title text-white">
                {t("selectServices")}
              </h1>
              <p className="text-body sm:text-body-large text-gray-300">
                {t("findNextAvailable")}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Selected Service Header - Show when service is selected (but not on confirmation step) */}
      {step >= 2 && step < 4 && selectedService && (
        <section className="bg-black pt-16 sm:pt-20 lg:pt-24 pb-6 sm:pb-2">
          <div className="container-fluid">
            <div className="max-w-5xl mx-auto">
              <div className="space-y-4 sm:space-y-5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                  {selectedService.translations[0]?.name || selectedService.slug}
                </h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 rounded-lg border border-gray-800/50">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm sm:text-base text-gray-300 font-medium">
                      {selectedService.durationMinutes} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-sm sm:text-base text-primary font-bold">
                      €{Number(selectedService.basePrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={step === 1 ? "py-6 sm:py-10 lg:py-12" : step === 2 ? "pt-0 pb-4 sm:pb-6 lg:pb-8 lg:-mt-1" : step === 4 ? "pt-16 sm:pt-20 lg:pt-24 pb-4 sm:pb-6 lg:pb-8" : "py-4 sm:py-6 lg:py-8"}>
        <div className="container-fluid">
          <div className="max-w-5xl mx-auto">
            {error && (
              <div className="mb-4 p-3.5 sm:p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-small">
                {error}
              </div>
            )}

            {/* Loading state when restoring from URL params - only show on client after mount */}
            {isMounted && step === 3 && (!selectedService || !selectedDate) && (
              <div className="flex items-center justify-center py-12 sm:py-16">
                <Loader2 className="h-10 w-10 sm:h-8 sm:w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Step 1: Select Service */}
            {step === 1 && (
              <div className="space-y-5 sm:space-y-7 lg:space-y-8">

                {/* Services Section */}
                {servicesByCategory.services && servicesByCategory.services.length > 0 && (
                  <div id="services" className="space-y-4 sm:space-y-5 scroll-mt-24">
                    <button
                      onClick={() => toggleSection("services")}
                      className="w-full flex items-center justify-between text-left py-2 sm:py-0"
                    >
                      <h2 className="text-section-title font-bold text-white">
                        {t("services")}
                      </h2>
                      {openSections.services ? (
                        <ChevronUp className="h-6 w-6 sm:h-5 sm:w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-6 w-6 sm:h-5 sm:w-5 text-gray-400" />
                      )}
                    </button>
                    {openSections.services && (
                      <div className="space-y-2.5 sm:space-y-3">
                        {servicesByCategory.services.map((service) => {
                          const translation = service.translations[0];
                          return (
                            <div
                              key={service.id}
                              className="bg-gray-900 rounded-lg p-3.5 sm:p-5 hover:border-primary border-2 border-transparent transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 lg:gap-5"
                            >
                              {/* Icon */}
                              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-primary/20 rounded-lg flex-shrink-0">
                                <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-grow min-w-0 flex flex-col justify-center">
                                <h3 className="text-card-title font-bold text-white mb-1 sm:mb-1.5">
                                  {translation?.name || service.slug}
                                </h3>
                                {translation?.description && (
                                  <ServiceDescription
                                    serviceId={service.id}
                                    description={translation.description}
                                    isExpanded={expandedDescriptions[service.id]}
                                    onToggle={() => toggleDescription(service.id)}
                                    t={t}
                                    className="leading-relaxed"
                                  />
                                )}
                              </div>
                              
                              {/* Price, Duration & Button */}
                              <div className="flex flex-row sm:flex-col lg:flex-row items-center sm:items-end lg:items-center gap-3 sm:gap-2 lg:gap-4 flex-shrink-0 w-full sm:w-auto">
                                <div className="text-left sm:text-right flex-1 sm:flex-none">
                                  <div className="font-bold text-primary text-body mb-0.5">
                                    €{Number(service.basePrice).toFixed(2)}
                                  </div>
                                  <div className="text-gray-400 text-small flex items-center sm:justify-end gap-1">
                                    <Clock className="h-3 w-3" />
                                    {service.durationMinutes} min
                                  </div>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleServiceSelect(service);
                                  }}
                                  className="w-auto bg-primary hover:bg-primary/90 text-white font-semibold px-5 sm:px-6 py-2.5 text-small rounded-lg min-h-[44px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                                >
                                  {t("book")}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Beard Services Section */}
                {servicesByCategory.beardServices &&
                  servicesByCategory.beardServices.length > 0 && (
                    <div id="beard-services" className="space-y-4 sm:space-y-5 scroll-mt-24">
                      <button
                        onClick={() => toggleSection("beardServices")}
                        className="w-full flex items-center justify-between text-left py-2 sm:py-0"
                      >
                        <h2 className="text-section-title font-bold text-white">
                          {t("beardServices")}
                        </h2>
                        {openSections.beardServices ? (
                          <ChevronUp className="h-6 w-6 sm:h-5 sm:w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-6 w-6 sm:h-5 sm:w-5 text-gray-400" />
                        )}
                      </button>
                      {openSections.beardServices && (
                        <div className="space-y-2.5 sm:space-y-3">
                          {servicesByCategory.beardServices.map((service) => {
                            const translation = service.translations[0];
                            return (
                              <div
                                key={service.id}
                                className="bg-gray-900 rounded-lg p-3.5 sm:p-5 hover:border-primary border-2 border-transparent transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 lg:gap-5 cursor-pointer"
                                onClick={() => handleServiceSelect(service)}
                              >
                                {/* Icon */}
                                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-primary/20 rounded-lg flex-shrink-0">
                                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                  <h3 className="text-card-title font-bold text-white mb-1 sm:mb-1.5">
                                    {translation?.name || service.slug}
                                  </h3>
                                  {translation?.description && (
                                    <ServiceDescription
                                      serviceId={service.id}
                                      description={translation.description}
                                      isExpanded={expandedDescriptions[service.id]}
                                      onToggle={() => toggleDescription(service.id)}
                                      t={t}
                                      className="leading-snug sm:leading-relaxed"
                                    />
                                  )}
                                </div>
                                
                                {/* Price, Duration & Button */}
                                <div className="flex flex-row sm:flex-col lg:flex-row items-center sm:items-end lg:items-center gap-3 sm:gap-2 lg:gap-4 flex-shrink-0 w-full sm:w-auto">
                                  <div className="text-left sm:text-right flex-1 sm:flex-none">
                                    <div className="font-bold text-primary text-body mb-0.5">
                                      €{Number(service.basePrice).toFixed(2)}
                                    </div>
                                    <div className="text-gray-400 text-small flex items-center sm:justify-end gap-1">
                                      <Clock className="h-3 w-3" />
                                      {service.durationMinutes} min
                                    </div>
                                  </div>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleServiceSelect(service);
                                    }}
                                    className="w-auto bg-primary hover:bg-primary/90 text-white font-semibold px-5 sm:px-6 py-2.5 text-small rounded-lg min-h-[44px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                                  >
                                    {t("book")}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                {/* Head Wash + Massage + Styling Section */}
                {servicesByCategory.headWashMassageStyling &&
                  servicesByCategory.headWashMassageStyling.length > 0 && (
                    <div id="head-wash-massage-styling" className="space-y-4 sm:space-y-5 scroll-mt-24">
                      <button
                        onClick={() => toggleSection("headWashMassageStyling")}
                        className="w-full flex items-center justify-between text-left py-2 sm:py-0"
                      >
                        <h2 className="text-section-title font-bold text-white">
                          {t("headWashMassageStyling")}
                        </h2>
                        {openSections.headWashMassageStyling ? (
                          <ChevronUp className="h-6 w-6 sm:h-5 sm:w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-6 w-6 sm:h-5 sm:w-5 text-gray-400" />
                        )}
                      </button>
                      {openSections.headWashMassageStyling && (
                        <div className="space-y-2.5 sm:space-y-3">
                          {servicesByCategory.headWashMassageStyling.map((service) => {
                            const translation = service.translations[0];
                            return (
                              <div
                                key={service.id}
                                className="bg-gray-900 rounded-lg p-3.5 sm:p-5 hover:border-primary border-2 border-transparent transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 lg:gap-5 cursor-pointer"
                                onClick={() => handleServiceSelect(service)}
                              >
                                {/* Icon */}
                                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-primary/20 rounded-lg flex-shrink-0">
                                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                  <h3 className="text-card-title font-bold text-white mb-1 sm:mb-1.5">
                                    {translation?.name || service.slug}
                                  </h3>
                                  {translation?.description && (
                                    <ServiceDescription
                                      serviceId={service.id}
                                      description={translation.description}
                                      isExpanded={expandedDescriptions[service.id]}
                                      onToggle={() => toggleDescription(service.id)}
                                      t={t}
                                      className="leading-snug sm:leading-relaxed"
                                    />
                                  )}
                                </div>
                                
                                {/* Price, Duration & Button */}
                                <div className="flex flex-row sm:flex-col lg:flex-row items-center sm:items-end lg:items-center gap-3 sm:gap-2 lg:gap-4 flex-shrink-0 w-full sm:w-auto">
                                  <div className="text-left sm:text-right flex-1 sm:flex-none">
                                    <div className="font-bold text-primary text-body mb-0.5">
                                      €{Number(service.basePrice).toFixed(2)}
                                    </div>
                                    <div className="text-gray-400 text-small flex items-center sm:justify-end gap-1">
                                      <Clock className="h-3 w-3" />
                                      {service.durationMinutes} min
                                    </div>
                                  </div>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleServiceSelect(service);
                                    }}
                                    className="w-auto bg-primary hover:bg-primary/90 text-white font-semibold px-5 sm:px-6 py-2.5 text-small rounded-lg min-h-[44px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                                  >
                                    {t("book")}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                {services.length === 0 && (
                  <p className="text-muted-foreground">
                    No services available. Please contact us.
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Select Date */}
            {step === 2 && selectedService && (
              <div className="space-y-5 sm:space-y-7 lg:space-y-4">
                <div className="max-w-3xl mx-auto">
                  <CalendarGrid
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    availability={calendarAvailability}
                    locale={locale}
                    disabled={(date) => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      const availability = calendarAvailability[dateStr];
                      const today = startOfDay(new Date());
                      const dateOnly = startOfDay(date);
                      const isPast = isBefore(dateOnly, today);
                      return isPast || availability === "booked" || availability === "sunday";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Select Time Slot */}
            {step === 3 && selectedDate && selectedService && (
              <div className="space-y-5 sm:space-y-7 lg:space-y-8 lg:-mt-4">
                <div className="text-center">
                  <h2 className="text-lg sm:text-card-title font-bold mb-3 text-white">
                    {formatSelectedDate(selectedDate, isSameDay(selectedDate, new Date()))}
                  </h2>
                  {barberSlots.length > 0 && (
                    <p className="text-small sm:text-body text-gray-300">
                      {t("barbersAvailable", {
                        count: barberSlots.length,
                      })}
                    </p>
                  )}
                </div>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-12 sm:py-16">
                    <Loader2 className="h-10 w-10 sm:h-8 sm:w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="p-3.5 sm:p-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-center">
                    {error}
                  </div>
                ) : barberSlots.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <p className="text-gray-300 text-lg">{t("noSlotsAvailable")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {barberSlots.map((barberSlot) => {
                      const barber = barbers.find((b) => b.id === barberSlot.barberId);
                      if (!barber) return null;

                      // Get all slots for this barber and sort them chronologically
                      const allSlots = [...barberSlot.slots].sort((a, b) => {
                        return new Date(a.start).getTime() - new Date(b.start).getTime();
                      });

                      const isExpanded = expandedBarberSlots[barberSlot.barberId] || false;

                      return (
                        <div key={barberSlot.barberId} className="bg-gray-900 rounded-xl p-3.5 sm:p-5 border-2 border-transparent hover:border-primary transition-all">
                          <div className="mb-4 text-center">
                            <h3 className="text-card-title font-bold mb-1 sm:mb-1.5 text-white">{barber.displayName}</h3>
                            {getBarberBio(barber.displayName, barber.bio) && (
                              <p className="text-xs sm:text-small text-gray-300">{getBarberBio(barber.displayName, barber.bio)}</p>
                            )}
                          </div>
                          {/* Mobile: Toggle button */}
                          <div className="md:hidden mb-4">
                            <Button
                              type="button"
                              onClick={() => toggleBarberSlots(barberSlot.barberId)}
                              variant="outline"
                              className="w-full border-gray-700 text-white hover:bg-gray-800 py-2.5 text-small"
                            >
                              {isExpanded ? t("hideAppointments") : t("showAppointments")}
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {/* Desktop: Always show slots, Mobile: Show only if expanded */}
                            {allSlots.length > 0 && (
                              <div className={isExpanded ? "block" : "hidden md:block"}>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2">
                                  {allSlots.flatMap((slot, index) => {
                                    const slotDate = new Date(slot.start);
                                    const now = new Date();
                                    // Only check if slot is past if the selected date is TODAY
                                    // If selected date is tomorrow or later, all times should be available
                                    const isSelectedDateToday = isSameDay(selectedDate, now);
                                    const isPast = isSelectedDateToday && isBefore(slotDate, now);
                                    const isSelected =
                                      selectedBarber === barberSlot.barberId &&
                                      selectedSlot?.start === slot.start;
                                    const isAvailable = slot.available && !isPast;
                                    
                                    // Check if this slot is after lunch break (15:00) and previous was before (14:15)
                                    // This helps with visual separation - add a line break
                                    const prevSlot = index > 0 ? allSlots[index - 1] : null;
                                    const prevSlotDate = prevSlot ? new Date(prevSlot.start) : null;
                                    const showLunchBreak = prevSlotDate && 
                                      prevSlotDate.getHours() === 14 && prevSlotDate.getMinutes() === 15 &&
                                      slotDate.getHours() === 15 && slotDate.getMinutes() === 0;
                                    
                                    const slotKey = `${barberSlot.barberId}-${slot.start}`;
                                    const elements = [];
                                    
                                    if (showLunchBreak) {
                                      elements.push(
                                        <div key={`break-${slotKey}`} className="col-span-full w-full h-px bg-gray-700 my-2" />
                                      );
                                    }
                                    
                                    elements.push(
                                      <div key={slotKey} className={showLunchBreak ? "col-start-1" : ""}>
                                        {isAvailable ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleSlotSelect(barberSlot.barberId, slot);
                                            }}
                                            className={`w-full p-2.5 sm:p-2 lg:p-1.5 border-2 rounded-lg text-small lg:text-xs font-medium transition-all min-h-[44px] lg:min-h-[36px] ${
                                              isSelected
                                                ? "bg-primary text-white border-primary"
                                                : "bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30 hover:border-green-500"
                                            }`}
                                          >
                                            {format(slotDate, "HH:mm")}
                                          </button>
                                        ) : (
                                          <div
                                            className={`w-full p-2.5 sm:p-2 lg:p-1.5 border-2 rounded-lg text-small lg:text-xs text-center min-h-[44px] lg:min-h-[36px] ${
                                              isPast
                                                ? "bg-gray-800/50 text-gray-600 border-gray-700/50"
                                                : "bg-gray-800/30 text-gray-500 border-gray-700/30"
                                            }`}
                                          >
                                            {format(slotDate, "HH:mm")}
                                          </div>
                                        )}
                                      </div>
                                    );
                                    
                                    return elements;
                                  })}
                                </div>
                              </div>
                            )}
                            {allSlots.length === 0 && (
                              <p className="text-sm text-gray-400 text-center py-4">
                                {t("noSlotsForBarber")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 &&
              selectedService &&
              selectedDate &&
              selectedBarber &&
              selectedSlot && (
                <div className="space-y-4 lg:space-y-5">
                  {/* Confirmation Title */}
                  <div className="text-center space-y-1.5 pt-2">
                    <h1 className="text-hero font-bold text-white mb-4 sm:mb-title">
                      {t("confirmAppointment")}
                    </h1>
                    <p className="text-small sm:text-body text-gray-400">
                      {t("reviewDetails")}
                    </p>
                  </div>
                  
                  {/* Confirmation Details Card - Kompakt und übersichtlich */}
                  <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl p-4 sm:p-5 lg:p-6 border border-gray-800/50">
                    <div className="space-y-4 sm:space-y-5">
                      {/* Service */}
                      <div className="flex items-start gap-3 pb-4 border-b border-gray-800/50">
                        <Scissors className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                            {t("service")}
                          </p>
                          <p className="text-base sm:text-lg font-bold text-white leading-snug">
                            {selectedService.translations[0]?.name || selectedService.slug}
                          </p>
                          <p className="text-small text-gray-400 mt-1">
                            {t("duration", { minutes: selectedService.durationMinutes })}
                          </p>
                        </div>
                      </div>

                      {/* Datum & Zeit */}
                      <div className="flex items-start gap-3 pb-4 border-b border-gray-800/50">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                            {t("dateTime")}
                          </p>
                          <p className="text-base sm:text-lg font-bold text-white leading-snug">
                            {format(selectedDate, "PPP", { locale: locale === "de" ? de : locale === "ru" ? ru : enUS })}
                          </p>
                          <p className="text-body text-primary font-semibold mt-1">
                            {format(new Date(selectedSlot.start), "HH:mm")}{locale === "de" ? " Uhr" : ""}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid: Barber, Preis */}
                      <div className="grid grid-cols-2 gap-4 sm:gap-6">
                        {/* Barber */}
                        <div className="flex items-start gap-3">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                              {t("barber")}
                            </p>
                            <p className="text-base sm:text-lg font-semibold text-white">
                              {selectedBarberData?.displayName || "Unknown"}
                            </p>
                          </div>
                        </div>

                        {/* Preis */}
                        <div className="flex items-start gap-3">
                          <Euro className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                              {t("total")}
                            </p>
                            <p className="text-base sm:text-lg font-bold text-primary">
                              €{Number(selectedService.basePrice).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="w-full sm:flex-1 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600 py-2.5 sm:py-3 text-body font-medium transition-all"
                    >
                      {t("back")}
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={submitting}
                      className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 sm:py-3 text-body font-semibold transition-all shadow-lg shadow-primary/20"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("creatingAppointment")}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {t("confirmBooking")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

            {/* Navigation */}
            {step > 1 && step < 4 && (
              <div className="flex gap-2.5 sm:gap-3 pt-6">
                <div className="max-w-3xl mx-auto w-full">
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    className="w-full border-gray-700 text-white hover:bg-gray-800 py-3.5 sm:py-3 text-body"
                  >
                    {t("back")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative bg-black py-6 sm:py-10 lg:py-12 overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        
        <div className="container-fluid relative z-10">
          <div className="container-narrow">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-card-title font-bold text-white">
                {t("connectWithUs")}
              </h2>
            </div>
            
            {/* Icons */}
            <div className="flex justify-center items-center gap-3 sm:gap-5 mb-5 sm:mb-6">
              {/* Phone */}
              <a
                href="tel:+491621614426"
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-primary/20 hover:bg-primary/30 border-2 border-primary/50 rounded-full text-primary transition-all hover:scale-110"
                aria-label="Telefon"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </a>
              
              {/* Instagram */}
              <a
                href="http://instagram.com/Zyron.barberstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-primary/20 hover:bg-primary/30 border-2 border-primary/50 rounded-full text-primary transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              
              {/* WhatsApp */}
              <a
                href="https://wa.me/+491621614426"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-primary/20 hover:bg-primary/30 border-2 border-primary/50 rounded-full text-primary transition-all hover:scale-110"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
            
            {/* Address */}
            <div className="text-center">
              <p className="text-xs sm:text-small text-gray-400">
                Konstanzer Str. 58, 10707 Berlin
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
