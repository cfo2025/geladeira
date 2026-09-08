"use client";

import { useState } from "react";
import { Users, ClipboardCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebtorsTab, type DebtorRow } from "@/components/admin/debtors-tab";
import { PendingPaymentsCard } from "@/components/admin/pending-payments-card";
import { PaymentsHistoryTable } from "@/components/admin/payments-history-table";
import type { PaymentStatus } from "@/lib/database.types";

type ReviewedPayment = {
  id: string;
  created_at: string;
  expected_amount: number;
  admin_typed_amount: number | null;
  status: PaymentStatus;
  profile: { full_name: string } | null;
  reviewer: { full_name: string } | null;
};

type PendingPayment = {
  id: string;
  created_at: string;
  expected_amount: number;
  user_declared_amount: number;
  is_partial: boolean | null;
  profile: { full_name: string } | null;
};

export function PagamentosTabs({
  debtors,
  pendingTotal,
  paidLastMonth,
  paidThisMonth,
  paidAllTime,
  pending,
  reviewed,
}: {
  debtors: DebtorRow[];
  pendingTotal: number;
  paidLastMonth: number;
  paidThisMonth: number;
  paidAllTime: number;
  pending: PendingPayment[];
  reviewed: ReviewedPayment[];
}) {
  const [tab, setTab] = useState("devedores");

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
      <TabsList>
        <TabsTrigger value="devedores">
          <Users className="h-4 w-4" />
          Devedores
        </TabsTrigger>
        <TabsTrigger value="aprovacao">
          <ClipboardCheck className="h-4 w-4" />
          Aprovação
          {pending.length > 0 && (
            <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {pending.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="devedores" className="pt-4">
        <DebtorsTab
          debtors={debtors}
          pendingTotal={pendingTotal}
          paidLastMonth={paidLastMonth}
          paidThisMonth={paidThisMonth}
          paidAllTime={paidAllTime}
          onGoToApproval={() => setTab("aprovacao")}
        />
      </TabsContent>

      <TabsContent value="aprovacao" className="pt-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="min-w-0 flex-1 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Histórico
            </h2>
            <PaymentsHistoryTable payments={reviewed} />
          </div>

          <div className="w-full shrink-0 md:w-80 lg:w-96">
            <PendingPaymentsCard payments={pending} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
