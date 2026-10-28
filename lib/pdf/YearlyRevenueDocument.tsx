import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// The standard 14 PDF fonts (Times/Helvetica) only cover WinAnsi glyphs, which
// does not include the Naira sign (U+20A6) -- spell it out instead of risking
// a missing-glyph box in the rendered PDF.
function formatNgn(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const WINE = "#4a1620";
const WINE_DARK = "#2e0e15";
const BLUSH = "#f7e3e0";
const BLUSH_BORDER = "#eec1ba";
const INK = "#1a1512";
const INK_SOFT = "#6b5f59";
const CREAM = "#fdf9f3";

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 56,
    paddingHorizontal: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: INK,
  },
  header: {
    backgroundColor: WINE,
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  wordmark: {
    fontFamily: "Times-Bold",
    fontSize: 22,
    color: CREAM,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    color: BLUSH,
    marginTop: 4,
  },
  reportTitle: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    color: CREAM,
    textAlign: "right",
  },
  reportMeta: {
    fontSize: 8,
    color: BLUSH,
    textAlign: "right",
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  summaryBox: {
    borderWidth: 1,
    borderColor: BLUSH_BORDER,
    borderRadius: 4,
    backgroundColor: BLUSH,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryRowDivider: {
    borderTopWidth: 1,
    borderTopColor: BLUSH_BORDER,
    marginTop: 4,
    paddingTop: 8,
  },
  summaryLabel: {
    fontSize: 9,
    color: INK_SOFT,
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  totalLabel: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    color: WINE_DARK,
  },
  totalValue: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    color: WINE_DARK,
  },
  sectionHeading: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    color: WINE_DARK,
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: BLUSH_BORDER,
    borderRadius: 3,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: WINE,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: CREAM,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: BLUSH_BORDER,
  },
  tableRowAlt: {
    backgroundColor: "#fbf3f1",
  },
  cell: {
    fontSize: 8,
    color: INK,
  },
  colDate: { width: "12%" },
  colRef: { width: "10%" },
  colClient: { width: "18%" },
  colService: { width: "20%" },
  colSubtotal: { width: "13%", textAlign: "right" },
  colDeposit: { width: "13%", textAlign: "right" },
  colStatus: { width: "14%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BLUSH_BORDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7.5,
    color: INK_SOFT,
  },
  emptyState: {
    padding: 24,
    textAlign: "center",
    fontSize: 9,
    color: INK_SOFT,
  },
});

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  deposit_paid: "Deposit paid",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export type RevenueRow = {
  bookingDate: string;
  startTime: string;
  bookingRef: string;
  clientName: string;
  serviceName: string;
  lengthLabel: string;
  subtotalNgn: number;
  depositNgn: number;
  balanceNgn: number;
  status: string;
};

export function YearlyRevenueDocument({
  year,
  rows,
  totalAppointments,
  totalRevenueNgn,
  totalDepositsNgn,
  totalOutstandingNgn,
  generatedAt,
}: {
  year: number;
  rows: RevenueRow[];
  totalAppointments: number;
  totalRevenueNgn: number;
  totalDepositsNgn: number;
  totalOutstandingNgn: number;
  generatedAt: string;
}) {
  return (
    <Document title={`THENAILHIVE Yearly Revenue Report ${year}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.wordmark}>THENAILHIVE</Text>
            <Text style={styles.tagline}>Where your nails become the statement.</Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>Yearly Revenue Report</Text>
            <Text style={styles.reportMeta}>
              1 Jan {year} &ndash; 31 Dec {year}
            </Text>
            <Text style={styles.reportMeta}>Generated {generatedAt}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total appointments</Text>
              <Text style={styles.summaryValue}>{totalAppointments}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Deposits received</Text>
              <Text style={styles.summaryValue}>{formatNgn(totalDepositsNgn)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Outstanding balance</Text>
              <Text style={styles.summaryValue}>{formatNgn(totalOutstandingNgn)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowDivider]}>
              <Text style={styles.totalLabel}>Total revenue (confirmed / completed)</Text>
              <Text style={styles.totalValue}>{formatNgn(totalRevenueNgn)}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Appointment Breakdown</Text>

          {rows.length === 0 ? (
            <View style={styles.table}>
              <Text style={styles.emptyState}>No bookings recorded for {year}.</Text>
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow} fixed>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
                <Text style={[styles.tableHeaderCell, styles.colRef]}>Ref</Text>
                <Text style={[styles.tableHeaderCell, styles.colClient]}>Client</Text>
                <Text style={[styles.tableHeaderCell, styles.colService]}>Service</Text>
                <Text style={[styles.tableHeaderCell, styles.colSubtotal]}>Subtotal</Text>
                <Text style={[styles.tableHeaderCell, styles.colDeposit]}>Deposit</Text>
                <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
              </View>
              {rows.map((r, i) => (
                <View
                  key={`${r.bookingRef}-${i}`}
                  style={[styles.tableRow, ...(i % 2 === 1 ? [styles.tableRowAlt] : [])]}
                  wrap={false}
                >
                  <Text style={[styles.cell, styles.colDate]}>{formatDate(r.bookingDate)}</Text>
                  <Text style={[styles.cell, styles.colRef]}>{r.bookingRef}</Text>
                  <Text style={[styles.cell, styles.colClient]}>{r.clientName}</Text>
                  <Text style={[styles.cell, styles.colService]}>
                    {r.serviceName}
                    {r.lengthLabel ? ` (${r.lengthLabel})` : ""}
                  </Text>
                  <Text style={[styles.cell, styles.colSubtotal]}>{formatNgn(r.subtotalNgn)}</Text>
                  <Text style={[styles.cell, styles.colDeposit]}>{formatNgn(r.depositNgn)}</Text>
                  <Text style={[styles.cell, styles.colStatus]}>{STATUS_LABELS[r.status] ?? r.status}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>THENAILHIVE &middot; Yearly Revenue Report {year}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
