"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNavContent } from "@/components/shell/sidebar-nav-content";

export function MobileSidebar({ role, variant }: { role: "user" | "admin"; variant: "app" | "admin" }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="left" className="w-64 bg-sidebar p-0 [&_[data-slot=sheet-close]]:text-sidebar-foreground">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SidebarNavContent role={role} variant={variant} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
