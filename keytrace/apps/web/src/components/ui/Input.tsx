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
          <label htmlFor={inputId} className="text-xs font-mono uppercase tracking-wider text-slate-300 font-medium">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-md bg-slate-950/70 border text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 backdrop-blur-sm shadow-inner",
              rightElement && "pr-11",
              mono && "font-mono",
              error
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/25"
                : "border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-500/25 hover:border-slate-500",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <span className="text-xs text-rose-400 font-mono flex items-center gap-1">
            <span>[!]</span> {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-slate-400 font-mono">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
