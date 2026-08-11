"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/shell/brand-mark";
import { getNavSections } from "@/components/shell/nav-config";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNavContent({
  role,
  variant,
  onNavigate,
}: {
  role: "user" | "admin";
  variant: "app" | "admin";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = getNavSections(role, variant);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <BrandMark tone="dark" />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section, idx) => (
          <div key={section.title ?? idx} className="space-y-1">
            {section.title && (
              <p className="px-3 pb-1 text-[11px] font-medium tracking-wider text-sidebar-foreground/50 uppercase">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-gold"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active && "text-gold")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] leading-relaxed text-sidebar-foreground/45">
          Turma XVII &middot; Curso de Formação de Oficiais
        </p>
      </div>
    </div>
  );
}
