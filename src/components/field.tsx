import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const controlClass =
  "h-11 rounded-xl bg-card px-3 text-base shadow-none placeholder:text-[#9c9286]! md:text-base";

export function Field({
  id,
  label,
  hint,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  counter?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {counter ? (
          <span className="font-mono text-xs text-muted-foreground">{counter}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div
        role="group"
        aria-label={label}
        className={cn(
          "grid gap-1 rounded-xl bg-muted p-1",
          options.length === 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "h-10 rounded-lg px-2 text-sm font-medium transition-colors",
                selected
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-card",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
