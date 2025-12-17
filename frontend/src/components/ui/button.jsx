import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[var(--pearl-aqua)] to-[var(--tropical-teal)] text-[var(--shadow-grey)] shadow-lg hover:shadow-[0_0_20px_rgba(153,225,217,0.5)] active:scale-95",
        destructive:
          "bg-red-500/90 text-white shadow-lg hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95",
        outline:
          "border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md text-[var(--mint-cream)] hover:bg-white/10 hover:border-[var(--pearl-aqua)]/50",
        secondary:
          "bg-[var(--tropical-teal)]/20 text-[var(--tropical-teal)] hover:bg-[var(--tropical-teal)]/30 active:scale-95",
        ghost:
          "text-[var(--mint-cream)]/70 hover:text-[var(--mint-cream)] hover:bg-white/5",
        link:
          "text-[var(--pearl-aqua)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
