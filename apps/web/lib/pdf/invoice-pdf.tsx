import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const COLORS = {
  void: "#040812",
  surface: "#0d1830",
  panel: "#111e38",
  cyan: "#00e5ff",
  gold: "#f0b429",
  mint: "#00d68f",
  violet: "#7c3aed",
  red: "#ff4d4d",
  primary: "#f0f4ff",
  muted: "#8899bb",
  white: "#ffffff",
  border: "#1e2d4d",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.void,
    padding: 40,
    fontFamily: "Helvetica",
    color: COLORS.primary,
    fontSize: 10,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: {
    fontSize: 28,
    fontWeight: 700,
    color: COLORS.cyan,
    fontFamily: "Helvetica",
  },
  invoiceLabel: {
    fontSize: 10,
    color: COLORS.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.primary,
    fontFamily: "Courier",
    marginTop: 2,
  },
  // Info grid
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  infoBlock: {
    width: "48%",
  },
  infoLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    color: COLORS.primary,
    marginBottom: 2,
  },
  // Line items table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  colLabel: { width: "55%" },
  colQty: { width: "15%", textAlign: "center" },
  colAmount: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  // Total
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.cyan,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.muted,
    marginRight: 20,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.cyan,
    fontFamily: "Courier",
  },
  // Payment
  paymentBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.cyan,
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  paymentUrl: {
    fontSize: 9,
    color: COLORS.primary,
    fontFamily: "Courier",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.muted,
  },
  // Contract page
  contractTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 4,
  },
  contractSubtitle: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.violet,
  },
  sectionLabel: {
    fontSize: 8,
    color: COLORS.violet,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    marginBottom: 6,
    fontWeight: 700,
  },
  sectionText: {
    fontSize: 10,
    color: COLORS.primary,
    lineHeight: 1.5,
  },
  signatureArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  signatureBlock: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  signatureLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
});

interface InvoicePDFProps {
  invoice: {
    number: string;
    client_name: string;
    client_email: string;
    line_items: { label: string; amount: number; qty: number }[];
    total: number;
    currency: string;
    due_date: string;
    created_at: string;
  };
  freelancer: {
    name: string;
    business_name?: string | null;
    email: string;
  };
  contract?: {
    scope_of_work: string;
    payment_schedule: string;
    revision_policy: string;
    kill_fee: string;
    ip_ownership: string;
    governing_law: string;
    confidentiality: string;
  } | null;
  paymentUrl: string;
}

export function InvoicePDF({
  invoice,
  freelancer,
  contract,
  paymentUrl,
}: InvoicePDFProps) {
  return (
    <Document>
      {/* Page 1: Invoice */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.logo}>vela</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.invoiceLabel}>Invoice</Text>
            <Text style={s.invoiceNumber}>{invoice.number}</Text>
          </View>
        </View>

        <View style={s.infoGrid}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>From</Text>
            <Text style={s.infoValue}>
              {freelancer.business_name || freelancer.name}
            </Text>
            <Text style={{ ...s.infoValue, color: COLORS.muted, fontSize: 9 }}>
              {freelancer.email}
            </Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Bill To</Text>
            <Text style={s.infoValue}>{invoice.client_name}</Text>
            <Text style={{ ...s.infoValue, color: COLORS.muted, fontSize: 9 }}>
              {invoice.client_email}
            </Text>
          </View>
        </View>

        <View style={s.infoGrid}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Issue Date</Text>
            <Text style={s.infoValue}>
              {new Date(invoice.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Due Date</Text>
            <Text style={{ ...s.infoValue, color: COLORS.gold }}>
              {new Date(invoice.due_date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.tableHeader}>
          <Text style={{ ...s.tableHeaderText, ...s.colLabel }}>
            Description
          </Text>
          <Text style={{ ...s.tableHeaderText, ...s.colQty }}>Qty</Text>
          <Text style={{ ...s.tableHeaderText, ...s.colAmount }}>Rate</Text>
          <Text style={{ ...s.tableHeaderText, ...s.colTotal }}>Amount</Text>
        </View>

        {invoice.line_items.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.colLabel}>{item.label}</Text>
            <Text style={{ ...s.colQty, color: COLORS.muted }}>{item.qty}</Text>
            <Text style={{ ...s.colAmount, fontFamily: "Courier" }}>
              ${item.amount.toLocaleString()}
            </Text>
            <Text style={{ ...s.colTotal, fontFamily: "Courier" }}>
              ${(item.amount * item.qty).toLocaleString()}
            </Text>
          </View>
        ))}

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>
            ${invoice.total.toLocaleString()} {invoice.currency}
          </Text>
        </View>

        <View style={s.paymentBox}>
          <Text style={s.paymentTitle}>Payment</Text>
          <Text style={{ fontSize: 9, color: COLORS.muted, marginBottom: 6 }}>
            Pay with USDC on Solana via the link below:
          </Text>
          <Text style={s.paymentUrl}>{paymentUrl}</Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>
            vela — get paid. on-chain.
          </Text>
          <Text style={s.footerText}>Page 1</Text>
        </View>
      </Page>

      {/* Page 2+: Contract (if exists) */}
      {contract && (
        <Page size="A4" style={s.page}>
          <View style={s.header}>
            <Text style={s.logo}>vela</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.invoiceLabel}>Contract</Text>
              <Text style={s.invoiceNumber}>{invoice.number}</Text>
            </View>
          </View>

          <Text style={s.contractTitle}>Freelance Service Agreement</Text>
          <Text style={s.contractSubtitle}>
            Between {freelancer.business_name || freelancer.name} and{" "}
            {invoice.client_name}
          </Text>

          {[
            { key: "scope_of_work", label: "Scope of Work" },
            { key: "payment_schedule", label: "Payment Schedule" },
            { key: "revision_policy", label: "Revision Policy" },
            { key: "kill_fee", label: "Kill Fee" },
            { key: "ip_ownership", label: "IP Ownership" },
            { key: "governing_law", label: "Governing Law" },
            { key: "confidentiality", label: "Confidentiality" },
          ].map(({ key, label }) => (
            <View key={key} style={s.sectionCard}>
              <Text style={s.sectionLabel}>{label}</Text>
              <Text style={s.sectionText}>
                {contract[key as keyof typeof contract]}
              </Text>
            </View>
          ))}

          <View style={s.signatureArea}>
            <View style={s.signatureBlock}>
              <Text style={s.signatureLabel}>Freelancer</Text>
              <Text style={{ ...s.infoValue, marginTop: 4 }}>
                {freelancer.business_name || freelancer.name}
              </Text>
            </View>
            <View style={s.signatureBlock}>
              <Text style={s.signatureLabel}>Client</Text>
              <Text style={{ ...s.infoValue, marginTop: 4 }}>
                {invoice.client_name}
              </Text>
            </View>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>
              vela — get paid. on-chain.
            </Text>
            <Text style={s.footerText}>Page 2</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
