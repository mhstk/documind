import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--shadow-grey)] group-[.toaster]:text-[var(--mint-cream)] group-[.toaster]:border-[var(--glass-border)] group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-[var(--taupe-grey)]",
          actionButton:
            "group-[.toast]:bg-[var(--pearl-aqua)] group-[.toast]:text-[var(--shadow-grey)]",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-[var(--mint-cream)]",
          success: "group-[.toaster]:!bg-[var(--pearl-aqua)]/20 group-[.toaster]:!border-[var(--pearl-aqua)]/30",
          error: "group-[.toaster]:!bg-red-500/20 group-[.toaster]:!border-red-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
