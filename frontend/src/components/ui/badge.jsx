import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge component - uses ONLY the app color palette:
 * - Pearl Aqua: #99e1d9 (primary)
 * - Tropical Teal: #70abaf (secondary)
 * - Taupe Grey: #705d56 (muted)
 * - Mint Cream: #f0f7f4 (text)
 * - Shadow Grey: #32292f (dark)
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--pearl-aqua)]/15 text-[var(--pearl-aqua)] border border-[var(--pearl-aqua)]/30",
        secondary:
          "bg-[var(--tropical-teal)]/15 text-[var(--tropical-teal)] border border-[var(--tropical-teal)]/30",
        muted:
          "bg-[var(--taupe-grey)]/15 text-[var(--taupe-grey)] border border-[var(--taupe-grey)]/30",
        outline:
          "border border-[var(--glass-border)] bg-transparent text-[var(--mint-cream)]",
        destructive:
          "bg-red-500/15 text-red-400 border border-red-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
