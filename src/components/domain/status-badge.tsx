import { STATUS_META, TONE_CLASSES } from "@/lib/workflow";
import type { WorkflowStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: WorkflowStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[meta.tone],
        className
      )}
    >
      {meta.label}
    </span>
  );
}
