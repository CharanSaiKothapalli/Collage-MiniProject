import React from "react";
import { cn } from "../../lib/utils.js";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  mono?: boolean;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, mono = false, rightElement, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#94A3B8]">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full h-10 px-3.5 py-2 rounded-[10px] bg-[#0B1220] border text-sm text-[#F8FAFC] placeholder:text-[#64748B] transition-all duration-150 motion-reduce:transition-none focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
              rightElement && "pr-11",
              mono ? "font-mono" : "font-sans",
              error
                ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20"
                : "border-[#263B5E] hover:border-[#38BDF8]/40 focus:border-[#FF6A00] focus:ring-[#FF6A00]/20",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <span className="text-xs text-[#EF4444] flex items-center gap-1 font-medium">
            <span>•</span> {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-[#64748B]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
