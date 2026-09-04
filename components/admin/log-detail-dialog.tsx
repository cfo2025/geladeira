"use client";

import Link from "next/link";
import { Eye, ArrowRight } from "lucide-react";
import { getLogPresentation, TONE_CLASSES } from "@/lib/log-presentation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LogDetailDialog({
  action,
  details,
  actorName,
  targetName,
  createdAt,
  products,
  locations,
}: {
  action: string;
  details: Record<string, unknown> | null;
  actorName: string;
  targetName: string;
  createdAt: string;
  products: Record<string, string>;
  locations: Record<string, string>;
}) {
  const presentation = getLogPresentation(action, details, { actorName, targetName, products, locations });
  const { icon: Icon, tone, title, description, chips, auditId } = presentation;
  const toneClasses = TONE_CLASSES[tone];

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" title="Ver detalhes" aria-label="Ver detalhes" />}
      >
        <Eye className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className={cn("flex h-14 w-14 items-center justify-center rounded-full", toneClasses.bg)}>
            <Icon className={cn("h-7 w-7", toneClasses.text)} />
          </span>
          <div>
            <p className="text-base font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {chips.map((chip) => (
              <div key={chip.label} className="rounded-lg border bg-muted/40 px-3 py-2 text-center">
                <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {chip.label}
                </p>
                <p className="truncate text-sm font-semibold">{chip.value}</p>
              </div>
            ))}
          </div>
        )}

        {auditId && (
          <Button
            render={<Link href={`/admin/auditoria/${auditId}`} />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            Ver balanço
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">{formatDateTime(createdAt)}</p>
      </DialogContent>
    </Dialog>
  );
}
