"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value?: number;
  onValueChange?: (value: number) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      onValueChange?.(newValue);
    };

    return (
      <input
        type="range"
        ref={ref}
        value={value}
        onChange={handleChange}
        className={cn(
          "w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary",
          "slider-thumb",
          className
        )}
        style={{
          background: value !== undefined
            ? `linear-gradient(to right, hsl(30 100% 50%) 0%, hsl(30 100% 50%) ${((value - (props.min as number || 0)) / ((props.max as number || 100) - (props.min as number || 0))) * 100}%, rgb(31 41 55) ${((value - (props.min as number || 0)) / ((props.max as number || 100) - (props.min as number || 0))) * 100}%, rgb(31 41 55) 100%)`
            : undefined,
        }}
        {...props}
      />
    );
  }
);
Slider.displayName = "Slider";

export { Slider };




