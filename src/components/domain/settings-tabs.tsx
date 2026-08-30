import Link from "next/link";

const TABS = [
  { key: "business", href: "/admin/settings/business", label: "Business & bank" },
  { key: "products", href: "/admin/settings/products", label: "Products & pricing" },
  { key: "team", href: "/admin/settings/team", label: "Team" },
] as const;

export function SettingsTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav className="flex gap-1 border-b border-ink-900/8">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            tab.key === active ? "border-ink-900 text-ink-900" : "border-transparent text-neutral-600 hover:text-ink-700"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
