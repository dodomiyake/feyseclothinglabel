import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function WhatsAppButton({
  href,
  label = "Chat on WhatsApp",
  className,
  variant = "solid",
}: {
  href: string;
  label?: string;
  className?: string;
  variant?: "solid" | "outline";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
        variant === "solid"
          ? "bg-sage-600 text-cream-50 hover:bg-sage-500"
          : "border border-sage-600 text-sage-600 hover:bg-sage-600/10",
        className
      )}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}
