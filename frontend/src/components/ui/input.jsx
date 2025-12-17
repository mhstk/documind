import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm text-[var(--mint-cream)] placeholder:text-[var(--taupe-grey)] transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[var(--pearl-aqua)]/50 focus:border-[var(--pearl-aqua)]/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
