"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageSlideshowProps {
  images: string[];
  autoPlayInterval?: number; // in milliseconds
  className?: string;
}

export function ImageSlideshow({
  images,
  autoPlayInterval = 5000,
  className,
}: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, images.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <div className={cn("relative w-full h-screen overflow-hidden", className)}>
      {/* Images */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Dark overlay to darken images completely */}
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - positioned to avoid text overlap */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 sm:left-4 md:left-6 top-[45%] -translate-y-1/2 z-40 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 sm:p-3 transition-all cursor-pointer"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 md:right-6 top-[45%] -translate-y-1/2 z-40 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 sm:p-3 transition-all cursor-pointer"
        aria-label="Next image"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}


