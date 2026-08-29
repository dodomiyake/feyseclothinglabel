import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** The last item is treated as the current page and never rendered as a link. */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-neutral-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-ink-700">{item.label}</Link>
          ) : (
            <span className="text-ink-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
