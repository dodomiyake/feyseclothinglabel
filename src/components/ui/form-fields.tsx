import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink-800">
        <span>
          {label}
          {required && <span className="text-terracotta-600"> *</span>}
        </span>
        {hint && <span className="text-xs font-normal text-neutral-500">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-terracotta-600">{error}</span>}
    </label>
  );
}

const fieldClasses =
  "w-full rounded-lg border border-neutral-300 bg-cream-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-neutral-400 focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-400/40";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClasses, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldClasses, "min-h-24 resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClasses, "appearance-none bg-no-repeat", props.className)} />;
}

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("flex items-start gap-2.5 text-sm text-ink-800", className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-neutral-400 text-gold-600 focus:ring-gold-400"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
