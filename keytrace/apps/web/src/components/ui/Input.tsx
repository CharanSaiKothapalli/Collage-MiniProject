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
          <label htmlFor={inputId} className="text-xs font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/60 border text-sm text-zinc-100 placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 backdrop-blur-sm shadow-inner",
              rightElement && "pr-11",
              mono ? "font-mono" : "font-sans",
              error
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-white/10 focus:border-indigo-500/80 focus:ring-indigo-500/20 hover:border-white/20",
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
          <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
            <span>•</span> {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-zinc-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
