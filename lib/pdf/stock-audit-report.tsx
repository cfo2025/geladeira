import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#52525b", marginBottom: 16 },
  table: { display: "flex", width: "100%", borderTop: "1px solid #e4e4e7" },
  row: { flexDirection: "row", borderBottom: "1px solid #e4e4e7", paddingVertical: 6 },
  headerRow: { flexDirection: "row", paddingVertical: 6, backgroundColor: "#f4f4f5" },
  colProduct: { flex: 3, paddingHorizontal: 4 },
  colNum: { flex: 1, paddingHorizontal: 4, textAlign: "right" },
  headerText: { fontFamily: "Helvetica-Bold" },
  summary: { marginTop: 16, fontSize: 10 },
});

export type StockAuditReportProps = {
  locationName: string;
  adminName: string;
  createdAt: string;
  notes: string | null;
  items: {
    productName: string;
    expectedQuantity: number;
    physicalQuantity: number;
    difference: number;
  }[];
};

export function StockAuditReport({
  locationName,
  adminName,
  createdAt,
  notes,
  items,
}: StockAuditReportProps) {
  const totalDifference = items.reduce((sum, i) => sum + i.difference, 0);
  const divergent = items.filter((i) => i.difference !== 0).length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Balanço de estoque — {locationName}</Text>
        <Text style={styles.subtitle}>
          Data: {createdAt} · Responsável: {adminName}
          {notes ? ` · Observações: ${notes}` : ""}
        </Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.colProduct, styles.headerText]}>Produto</Text>
            <Text style={[styles.colNum, styles.headerText]}>Esperado</Text>
            <Text style={[styles.colNum, styles.headerText]}>Físico</Text>
            <Text style={[styles.colNum, styles.headerText]}>Diferença</Text>
          </View>
          {items.map((item, idx) => (
            <View style={styles.row} key={idx}>
              <Text style={styles.colProduct}>{item.productName}</Text>
              <Text style={styles.colNum}>{item.expectedQuantity}</Text>
              <Text style={styles.colNum}>{item.physicalQuantity}</Text>
              <Text style={styles.colNum}>
                {item.difference > 0 ? `+${item.difference}` : item.difference}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <Text>Itens com divergência: {divergent}</Text>
          <Text>Diferença total (unidades): {totalDifference}</Text>
        </View>
      </Page>
    </Document>
  );
}
