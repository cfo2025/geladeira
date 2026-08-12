"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavSections } from "@/components/shell/nav-config";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function SecondaryNav({
  role,
  variant,
}: {
  role: "user" | "admin";
  variant: "app" | "admin";
}) {
  const pathname = usePathname();
  const sections = getNavSections(role, variant);

  return (
    <div className="sticky top-16 z-20 border-b bg-background/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 md:px-8">
        {sections.map((section, sIdx) => (
          <div key={section.title ?? sIdx} className="flex shrink-0 items-center gap-1">
            {sIdx > 0 && <span className="mx-1.5 h-4 w-px shrink-0 bg-border" />}
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
