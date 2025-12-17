"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface GalleryImageProps {
  src: string;
  alt: string;
  index: number;
}

export function GalleryImage({ src, alt, index }: GalleryImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  const handleImageError = () => {
    if (!useFallback) {
      // First error: try fallback img tag
      setUseFallback(true);
    } else {
      // Second error: show placeholder
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    window.open(src, "_blank", "noopener,noreferrer");
  };

  if (hasError) {
    return (
      <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-gray-600" />
      </div>
    );
  }

  if (useFallback) {
    return (
      <>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={handleImageError}
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}
        <div
          className="absolute inset-0 cursor-pointer z-10"
          onClick={handleClick}
          aria-label="Open image in new tab"
        />
      </>
    );
  }

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        unoptimized
        onError={handleImageError}
        onLoad={() => setIsLoading(false)}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      <div
        className="absolute inset-0 cursor-pointer z-10"
        onClick={handleClick}
        aria-label="Open image in new tab"
      />
    </>
  );
}

