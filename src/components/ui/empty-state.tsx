import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center", className)}>
      {Icon && <Icon className="mb-1 h-8 w-8 text-neutral-400" strokeWidth={1.5} />}
      <p className="font-serif text-lg text-ink-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
