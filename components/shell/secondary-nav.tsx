"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { userNavItems, adminNavItems } from "@/components/shell/nav-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function SecondaryNav({ role }: { role: "user" | "admin" }) {
  const pathname = usePathname();
  const inAdminArea = pathname.startsWith("/admin");

  return (
    <div className="sticky top-16 z-20 border-b bg-background/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 md:px-8">
        {userNavItems.map((item) => {
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

        {role === "admin" && (
          <>
            <span className="mx-1.5 h-4 w-px shrink-0 bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                      inAdminArea
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  />
                }
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Administração
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {adminNavItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                      <Icon className={cn("h-4 w-4", active && "text-gold")} />
                      <span className={cn(active && "font-semibold")}>{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </nav>
    </div>
  );
}
