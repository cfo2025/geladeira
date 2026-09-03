import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CancellationReviewButtons } from "@/components/admin/cancellation-review-buttons";
import { formatDateTime } from "@/lib/format";
import { Undo2, Inbox } from "lucide-react";

type PendingCancellation = {
  id: string;
  reason: string | null;
  created_at: string;
  profile: { full_name: string } | null;
  withdrawal: { product: { name: string } | null } | null;
};

export function PendingCancellationsCard({ requests }: { requests: PendingCancellation[] }) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Undo2 className="h-4 w-4 text-gold" />
          Cancelamentos solicitados
          {requests.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {requests.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">Nenhuma solicitação de cancelamento.</p>
          </div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="rounded-xl border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</p>
              </div>
              <p className="mt-1.5 text-sm">{r.withdrawal?.product?.name}</p>
              {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
              <div className="mt-3">
                <CancellationReviewButtons requestId={r.id} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
