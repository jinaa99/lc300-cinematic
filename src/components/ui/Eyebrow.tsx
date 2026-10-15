import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: ReactNode;
  /** Draws the short signal-red rule before the label. */
  rule?: boolean;
  className?: string;
};

/** Small tracked uppercase label that introduces a heading. */
export function Eyebrow({ children, rule = false, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-4 text-eyebrow font-medium uppercase text-silver-400",
        className,
      )}
    >
      {rule && <span aria-hidden className="h-px w-10 bg-signal" />}
      {children}
    </p>
  );
}
