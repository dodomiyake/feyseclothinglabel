import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrencyForPdf, formatDate } from "@/lib/currency";
import type { BankAccount, BusinessSettings, Enquiry } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#241710" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#241710" },
  tagline: { fontSize: 9, color: "#665c4c", marginTop: 2, maxWidth: 240 },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#9a7538" },
  docMeta: { fontSize: 9, color: "#4d4436", textAlign: "right", marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, color: "#857a67", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  col: { width: "48%" },
  bold: { fontFamily: "Helvetica-Bold" },
  table: { borderTopWidth: 1, borderTopColor: "#e6e1d6", marginTop: 8 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e6e1d6", paddingVertical: 6 },
  tableHeadRow: { flexDirection: "row", paddingVertical: 6, backgroundColor: "#f2efe8" },
  cellSpec: { width: "46%", paddingHorizontal: 4 },
  cellQty: { width: "12%", paddingHorizontal: 4, textAlign: "right" },
  cellPrice: { width: "20%", paddingHorizontal: 4, textAlign: "right" },
  cellTotal: { width: "22%", paddingHorizontal: 4, textAlign: "right" },
  totalsBox: { marginTop: 10, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", width: 220, justifyContent: "space-between", paddingVertical: 3 },
  grandTotalRow: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#241710",
  },
  bankBox: { marginTop: 20, padding: 12, backgroundColor: "#f3ecdb", borderRadius: 4 },
  footer: { marginTop: 28, fontSize: 8, color: "#857a67", lineHeight: 1.5 },
});

export interface DocumentLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function LabelDocumentPdf({
  kind,
  documentNumber,
  issueDate,
  dueOrValidDate,
  dueOrValidLabel,
  business,
  customerName,
  customerAddress,
  enquiry,
  lineItem,
  deliveryFee,
  discount,
  total,
  currency,
  terms,
  bankAccount,
  statusLabel,
}: {
  kind: "Quotation" | "Invoice";
  documentNumber: string;
  issueDate: string;
  dueOrValidDate: string;
  dueOrValidLabel: string;
  business: BusinessSettings;
  customerName: string;
  customerAddress: string;
  enquiry: Enquiry;
  lineItem: DocumentLineItem;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: string;
  terms: string;
  bankAccount: BankAccount | null;
  statusLabel: string;
}) {
  const subtotal = lineItem.total;
  return (
    <Document title={`${kind} ${documentNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>{business.business_name}</Text>
            <Text style={styles.tagline}>{business.tagline}</Text>
            <Text style={styles.tagline}>{business.registered_address}</Text>
            <Text style={styles.tagline}>{business.support_email}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{kind.toUpperCase()}</Text>
            <Text style={styles.docMeta}>{documentNumber}</Text>
            <Text style={styles.docMeta}>Status: {statusLabel}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Billed to</Text>
            <Text style={styles.bold}>{customerName}</Text>
            <Text>{customerAddress}</Text>
          </View>
          <View style={[styles.col, { alignItems: "flex-end" }]}>
            <Text style={styles.sectionTitle}>Dates</Text>
            <Text>Issue date: {formatDate(issueDate)}</Text>
            <Text>{dueOrValidLabel}: {formatDate(dueOrValidDate)}</Text>
            <Text>Enquiry ref: {enquiry.enquiry_number}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Label specification</Text>
          <View style={styles.table}>
            <View style={styles.tableHeadRow}>
              <Text style={[styles.cellSpec, styles.bold]}>Description</Text>
              <Text style={[styles.cellQty, styles.bold]}>Qty</Text>
              <Text style={[styles.cellPrice, styles.bold]}>Unit price</Text>
              <Text style={[styles.cellTotal, styles.bold]}>Total</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.cellSpec}>{lineItem.description}</Text>
              <Text style={styles.cellQty}>{lineItem.quantity}</Text>
              <Text style={styles.cellPrice}>{formatCurrencyForPdf(lineItem.unitPrice, currency)}</Text>
              <Text style={styles.cellTotal}>{formatCurrencyForPdf(lineItem.total, currency)}</Text>
            </View>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>{formatCurrencyForPdf(subtotal, currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Delivery fee</Text>
              <Text>{formatCurrencyForPdf(deliveryFee, currency)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalsRow}>
                <Text>Discount</Text>
                <Text>-{formatCurrencyForPdf(discount, currency)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.bold}>Total ({currency})</Text>
              <Text style={styles.bold}>{formatCurrencyForPdf(total, currency)}</Text>
            </View>
          </View>
        </View>

        {kind === "Invoice" && bankAccount && (
          <View style={styles.bankBox}>
            <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Nigerian bank transfer details</Text>
            <Text>Bank: {bankAccount.bank_name}</Text>
            <Text>Account name: {bankAccount.account_name}</Text>
            <Text>Account number: {bankAccount.account_number}</Text>
            <Text style={{ marginTop: 4 }}>Please use {documentNumber} as your transfer narration, then upload proof of payment in your customer portal.</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.bold}>Terms &amp; conditions</Text>
          <Text>{terms}</Text>
        </View>
      </Page>
    </Document>
  );
}
