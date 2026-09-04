"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogDetailDialog } from "@/components/admin/log-detail-dialog";
import { getLogPresentation, TONE_CLASSES, type AuditDiffItem } from "@/lib/log-presentation";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

type LogRow = {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  actorName: string;
  targetName: string;
};

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25];

export function LogsTable({
  logs,
  products,
  locations,
  auditDiffs,
}: {
  logs: LogRow[];
  products: Record<string, string>;
  locations: Record<string, string>;
  auditDiffs: Record<string, AuditDiffItem[]>;
}) {
  const [date, setDate] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(
    () =>
      logs.map((log) => ({
        log,
        presentation: getLogPresentation(log.action, log.details, {
          actorName: log.actorName,
          targetName: log.targetName,
          products,
          locations,
          auditDiffs,
        }),
      })),
    [logs, products, locations, auditDiffs]
  );

  const actionOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const { log, presentation } of rows) map.set(log.action, presentation.title);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const actorOptions = useMemo(
    () => [...new Set(logs.map((l) => l.actorName))].sort((a, b) => a.localeCompare(b)),
    [logs]
  );

  const targetOptions = useMemo(
    () => [...new Set(logs.map((l) => l.targetName).filter((t) => t !== "—"))].sort((a, b) => a.localeCompare(b)),
    [logs]
  );

  const filtered = useMemo(() => {
    return rows.filter(({ log }) => {
      const matchesDate = !date || log.created_at.slice(0, 10) === date;
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesActor = actorFilter === "all" || log.actorName === actorFilter;
      const matchesTarget = targetFilter === "all" || log.targetName === targetFilter;
      return matchesDate && matchesAction && matchesActor && matchesTarget;
    });
  }, [rows, date, actionFilter, actorFilter, targetFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const hasFilters = date || actionFilter !== "all" || actorFilter !== "all" || targetFilter !== "all";

  function updateFilter(next: { date?: string; action?: string; actor?: string; target?: string }) {
    if (next.date !== undefined) setDate(next.date);
    if (next.action !== undefined) setActionFilter(next.action);
    if (next.actor !== undefined) setActorFilter(next.actor);
    if (next.target !== undefined) setTargetFilter(next.target);
    setPage(0);
  }

  function clearFilters() {
    setDate("");
    setActionFilter("all");
    setActorFilter("all");
    setTargetFilter("all");
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => updateFilter({ date: e.target.value })}
          className="w-auto"
        />
        <Select value={actionFilter} onValueChange={(value) => updateFilter({ action: value ?? "all" })}>
          <SelectTrigger className="w-auto">
            <SelectValue>
              {(value: string) =>
                value === "all" ? "Todas as ações" : (actionOptions.find(([a]) => a === value)?.[1] ?? value)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {actionOptions.map(([action, label]) => (
              <SelectItem key={action} value={action}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actorFilter} onValueChange={(value) => updateFilter({ actor: value ?? "all" })}>
          <SelectTrigger className="w-auto">
            <SelectValue>{(value: string) => (value === "all" ? "Todos os responsáveis" : value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os responsáveis</SelectItem>
            {actorOptions.map((actor) => (
              <SelectItem key={actor} value={actor}>
                {actor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={targetFilter} onValueChange={(value) => updateFilter({ target: value ?? "all" })}>
          <SelectTrigger className="w-auto">
            <SelectValue>{(value: string) => (value === "all" ? "Todos os alvos" : value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os alvos</SelectItem>
            {targetOptions.map((target) => (
              <SelectItem key={target} value={target}>
                {target}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Alvo</TableHead>
              <TableHead className="text-right">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map(({ log, presentation }) => {
              const Icon = presentation.icon;
              const toneClasses = TONE_CLASSES[presentation.tone];

              return (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(log.created_at)}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        toneClasses.bg,
                        toneClasses.text
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {presentation.title}
                    </span>
                  </TableCell>
                  <TableCell>{log.actorName}</TableCell>
                  <TableCell>{log.targetName}</TableCell>
                  <TableCell className="text-right">
                    <LogDetailDialog
                      action={log.action}
                      details={log.details}
                      actorName={log.actorName}
                      targetName={log.targetName}
                      createdAt={log.created_at}
                      products={products}
                      locations={locations}
                      auditDiffs={auditDiffs}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {hasFilters ? "Nenhum registro encontrado." : "Nenhum registro ainda."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
              {hasFilters && ` de ${logs.length}`}
            </span>
            <span className="flex items-center gap-1.5">
              Itens por página
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value ?? 10));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-7 w-auto px-2 text-xs">
                  <SelectValue>{(value: string) => value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
