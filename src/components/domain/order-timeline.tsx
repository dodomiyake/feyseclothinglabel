import { Check } from "lucide-react";
import { CUSTOMER_TIMELINE, STATUS_META } from "@/lib/workflow";
import type { WorkflowStatus } from "@/lib/types";

export function OrderTimeline({ status }: { status: WorkflowStatus }) {
  const currentIndex = CUSTOMER_TIMELINE.indexOf(status);

  return (
    <ol className="space-y-0">
      {CUSTOMER_TIMELINE.map((step, i) => {
        const active = i === currentIndex;
        const isLast = i === CUSTOMER_TIMELINE.length - 1;
        // The final step, once reached, means the order is fully done —
        // show it as complete (green check) rather than "in progress" (gold).
        const done = (currentIndex >= 0 && i < currentIndex) || (active && isLast);
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  done ? "bg-sage-600 text-cream-50" : active ? "bg-gold-500 text-ink-950" : "bg-neutral-200 text-neutral-400"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {!isLast && <span className={`w-px flex-1 ${done ? "bg-sage-500" : "bg-neutral-200"}`} style={{ minHeight: "1.5rem" }} />}
            </div>
            <div className="pb-6">
              <p className={`text-sm font-medium ${active ? "text-ink-950" : done ? "text-ink-800" : "text-neutral-400"}`}>
                {STATUS_META[step].label}
              </p>
              {active && <p className="mt-0.5 text-xs text-neutral-600">{STATUS_META[step].description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
