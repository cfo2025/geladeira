import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";
import { StockAuditReport } from "@/lib/pdf/stock-audit-report";
import { formatDateTime } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();

  const { data: audit } = await supabase
    .from("stock_audits")
    .select("*, location:locations(name), admin:profiles(full_name)")
    .eq("id", id)
    .single();

  if (!audit) {
    return NextResponse.json({ error: "Balanço não encontrado" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("stock_audit_items")
    .select("*, product:products(name)")
    .eq("audit_id", id);

  const buffer = await renderToBuffer(
    <StockAuditReport
      locationName={audit.location?.name ?? ""}
      adminName={audit.admin?.full_name ?? ""}
      createdAt={formatDateTime(audit.created_at)}
      notes={audit.notes}
      items={(items ?? []).map((i) => ({
        productName: i.product?.name ?? "",
        expectedQuantity: i.expected_quantity,
        physicalQuantity: i.physical_quantity,
        difference: i.difference,
      }))}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="balanco-${id}.pdf"`,
    },
  });
}
