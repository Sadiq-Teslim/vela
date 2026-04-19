import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Polygon,
  Line,
  Circle,
} from "@react-pdf/renderer";

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

type Theme = "light" | "dark";

interface ThemeTokens {
  bg: string;
  surface: string;
  panel: string;
  border: string;
  primary: string;
  muted: string;
  cyan: string;
  gold: string;
  mint: string;
  violet: string;
  watermark: string;
}

const THEMES: Record<Theme, ThemeTokens> = {
  light: {
    bg: "#ffffff",
    surface: "#f8f9fb",
    panel: "#f1f3f7",
    border: "#e5e8ef",
    primary: "#0d1830",
    muted: "#6b7280",
    cyan: "#0097a7",
    gold: "#b8860b",
    mint: "#059669",
    violet: "#6d28d9",
    watermark: "#eef1f6", // subtle gray-blue for light theme
  },
  dark: {
    bg: "#040812",
    surface: "#0d1830",
    panel: "#111e38",
    border: "#1e2d4d",
    primary: "#f0f4ff",
    muted: "#8899bb",
    cyan: "#00e5ff",
    gold: "#f0b429",
    mint: "#00d68f",
    violet: "#7c3aed",
    watermark: "#0c1527", // subtle lift from bg for dark theme
  },
};

/* ------------------------------------------------------------------ */
/* Logo components                                                     */
/* ------------------------------------------------------------------ */

/**
 * Small Vela mark used in the header. SVG viewBox 0 0 48 58.
 * Matches public/logos/vela-mark-bare.svg but rendered via react-pdf.
 */
function VelaMark({ size = 22, color }: { size?: number; color: string }) {
  const h = Math.round(size * (58 / 48));
  return (
    <Svg width={size} height={h} viewBox="0 0 48 58">
      <Polygon
        points="24,2 44,44 4,44"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Line
        x1={24}
        y1={2}
        x2={24}
        y2={44}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.35}
      />
      <Circle cx={24} cy={2} r={3} fill={color} />
      <Circle cx={4} cy={44} r={2} fill={color} opacity={0.5} />
      <Circle cx={44} cy={44} r={2} fill={color} opacity={0.5} />
    </Svg>
  );
}

/**
 * Large background watermark version of the mark.
 * Positioned absolutely, low opacity, theme-aware color.
 */
function VelaWatermark({ color }: { color: string }) {
  // Viewport is A4 (~595 x 842 at 72dpi in react-pdf). We use viewBox
  // so the shape scales to container.
  return (
    <Svg width={520} height={630} viewBox="0 0 48 58">
      <Polygon
        points="24,2 44,44 4,44"
        fill="none"
        stroke={color}
        strokeWidth={0.6}
        strokeLinejoin="round"
      />
      <Line
        x1={24}
        y1={2}
        x2={24}
        y2={44}
        stroke={color}
        strokeWidth={0.3}
        strokeDasharray="1.5 1.5"
      />
      <Circle cx={24} cy={2} r={1.2} fill={color} />
      <Circle cx={4} cy={44} r={0.9} fill={color} />
      <Circle cx={44} cy={44} r={0.9} fill={color} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Styles (theme-aware)                                                */
/* ------------------------------------------------------------------ */

const buildStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    page: {
      backgroundColor: t.bg,
      padding: 48,
      fontFamily: "Helvetica",
      color: t.primary,
      fontSize: 10,
    },
    // Watermark wrapper (large Vela mark bg)
    watermarkWrap: {
      position: "absolute",
      top: 100,
      left: 40,
      right: 0,
      alignItems: "center",
      justifyContent: "center",
      opacity: 1,
    },

    /* Header */
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 28,
      paddingBottom: 18,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    brand: { flexDirection: "row", alignItems: "center", gap: 8 },
    logoText: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      color: t.primary,
      letterSpacing: -1,
    },
    invoiceLabel: {
      fontSize: 8,
      color: t.muted,
      textTransform: "uppercase" as const,
      letterSpacing: 2,
      marginBottom: 3,
    },
    invoiceNumber: {
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      color: t.primary,
      letterSpacing: -0.5,
    },

    /* Info blocks */
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 26,
      gap: 16,
    },
    infoBlock: { flex: 1 },
    infoLabel: {
      fontSize: 7.5,
      color: t.muted,
      textTransform: "uppercase" as const,
      letterSpacing: 1.3,
      marginBottom: 6,
      fontFamily: "Helvetica-Bold",
    },
    infoValue: {
      fontSize: 11,
      color: t.primary,
      marginBottom: 2,
    },
    infoValueMuted: {
      fontSize: 9,
      color: t.muted,
    },

    /* Table */
    tableHeader: {
      flexDirection: "row",
      backgroundColor: t.surface,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginBottom: 2,
    },
    tableHeaderText: {
      fontSize: 7.5,
      color: t.muted,
      textTransform: "uppercase" as const,
      letterSpacing: 1.2,
      fontFamily: "Helvetica-Bold",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    colLabel: { width: "55%", fontSize: 10.5, color: t.primary },
    colQty: {
      width: "15%",
      textAlign: "center",
      fontSize: 10,
      color: t.muted,
    },
    colAmount: {
      width: "15%",
      textAlign: "right",
      fontSize: 10,
      fontFamily: "Courier",
      color: t.primary,
    },
    colTotal: {
      width: "15%",
      textAlign: "right",
      fontSize: 10,
      fontFamily: "Courier-Bold",
      color: t.primary,
    },

    /* Total summary */
    totalBlock: {
      marginTop: 18,
      alignSelf: "flex-end",
      width: "45%",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
    },
    totalLabel: { fontSize: 10, color: t.muted },
    totalValue: {
      fontSize: 10,
      fontFamily: "Courier",
      color: t.primary,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
      paddingTop: 12,
      borderTopWidth: 2,
      borderTopColor: t.cyan,
    },
    grandTotalLabel: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: t.primary,
    },
    grandTotalValue: {
      fontSize: 18,
      fontFamily: "Courier-Bold",
      color: t.cyan,
    },

    /* Payment section */
    paymentBox: {
      backgroundColor: t.surface,
      borderRadius: 8,
      padding: 16,
      marginTop: 26,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    paymentQR: {
      width: 92,
      height: 92,
      padding: 6,
      backgroundColor: "#ffffff",
      borderRadius: 4,
    },
    paymentInfo: { flex: 1 },
    paymentTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: t.cyan,
      textTransform: "uppercase" as const,
      letterSpacing: 1.3,
      marginBottom: 6,
    },
    paymentHeading: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: t.primary,
      marginBottom: 4,
    },
    paymentDesc: {
      fontSize: 9,
      color: t.muted,
      marginBottom: 6,
      lineHeight: 1.4,
    },
    paymentUrl: {
      fontSize: 7.5,
      color: t.cyan,
      fontFamily: "Courier",
    },

    /* Notes */
    thankYou: {
      marginTop: 26,
      fontSize: 10,
      color: t.muted,
      fontStyle: "italic",
    },

    /* Footer */
    footer: {
      position: "absolute",
      bottom: 32,
      left: 48,
      right: 48,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: t.border,
      paddingTop: 10,
    },
    footerBrand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    footerLogo: {
      width: 8,
      height: 8,
      borderRadius: 1,
      backgroundColor: t.cyan,
    },
    footerText: { fontSize: 8, color: t.muted, fontFamily: "Helvetica-Bold" },
    footerTag: { fontSize: 8, color: t.muted },
    footerPage: { fontSize: 8, color: t.muted, fontFamily: "Courier" },

    /* Contract page */
    contractIntro: {
      fontSize: 10,
      color: t.muted,
      lineHeight: 1.5,
      marginBottom: 22,
    },
    contractTitle: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      color: t.primary,
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    contractSubtitle: {
      fontSize: 10,
      color: t.muted,
      marginBottom: 20,
    },
    sectionCard: {
      backgroundColor: t.surface,
      borderRadius: 6,
      padding: 14,
      marginBottom: 10,
      borderLeftWidth: 3,
      borderLeftColor: t.violet,
    },
    sectionLabel: {
      fontSize: 7.5,
      color: t.violet,
      textTransform: "uppercase" as const,
      letterSpacing: 1.3,
      marginBottom: 5,
      fontFamily: "Helvetica-Bold",
    },
    sectionText: {
      fontSize: 10,
      color: t.primary,
      lineHeight: 1.5,
    },
    signatureArea: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 36,
      gap: 30,
    },
    signatureBlock: {
      flex: 1,
      paddingTop: 32,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    signatureLabel: {
      fontSize: 7.5,
      color: t.muted,
      textTransform: "uppercase" as const,
      letterSpacing: 1.3,
      marginBottom: 4,
      fontFamily: "Helvetica-Bold",
    },
    signatureName: {
      fontSize: 11,
      color: t.primary,
      fontFamily: "Helvetica-Bold",
    },
  });

/* ------------------------------------------------------------------ */
/* Props + component                                                   */
/* ------------------------------------------------------------------ */

interface InvoicePDFProps {
  theme?: Theme;
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
  /** Pre-generated QR code data URL for the Solana Pay link. */
  qrDataUrl?: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function InvoicePDF({
  theme = "light",
  invoice,
  freelancer,
  contract,
  paymentUrl,
  qrDataUrl,
}: InvoicePDFProps) {
  const t = THEMES[theme];
  const s = buildStyles(t);

  const subtotal = invoice.line_items.reduce(
    (sum, item) => sum + item.amount * item.qty,
    0
  );

  return (
    <Document
      title={`Invoice ${invoice.number}`}
      author={freelancer.business_name || freelancer.name}
    >
      {/* ============================================================ */}
      {/* Page 1 — Invoice                                              */}
      {/* ============================================================ */}
      <Page size="A4" style={s.page}>
        <View style={s.watermarkWrap} fixed>
          <VelaWatermark color={t.watermark} />
        </View>

        {/* Header */}
        <View style={s.header}>
          <View style={s.brand}>
            <VelaMark size={22} color={t.cyan} />
            <Text style={s.logoText}>vela</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.invoiceLabel}>Invoice</Text>
            <Text style={s.invoiceNumber}>{invoice.number}</Text>
          </View>
        </View>

        {/* From / Bill to */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>From</Text>
            <Text style={s.infoValue}>
              {freelancer.business_name || freelancer.name}
            </Text>
            {freelancer.business_name && (
              <Text style={s.infoValueMuted}>{freelancer.name}</Text>
            )}
            <Text style={s.infoValueMuted}>{freelancer.email}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Bill To</Text>
            <Text style={s.infoValue}>{invoice.client_name}</Text>
            <Text style={s.infoValueMuted}>{invoice.client_email}</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Issue Date</Text>
            <Text style={s.infoValue}>{fmtDate(invoice.created_at)}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Due Date</Text>
            <Text style={{ ...s.infoValue, color: t.gold }}>
              {fmtDate(invoice.due_date)}
            </Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Currency</Text>
            <Text style={{ ...s.infoValue, color: t.cyan }}>
              {invoice.currency}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.tableHeader}>
          <Text style={{ ...s.tableHeaderText, width: "55%" }}>
            Description
          </Text>
          <Text
            style={{ ...s.tableHeaderText, width: "15%", textAlign: "center" }}
          >
            Qty
          </Text>
          <Text
            style={{ ...s.tableHeaderText, width: "15%", textAlign: "right" }}
          >
            Rate
          </Text>
          <Text
            style={{ ...s.tableHeaderText, width: "15%", textAlign: "right" }}
          >
            Amount
          </Text>
        </View>

        {invoice.line_items.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.colLabel}>{item.label}</Text>
            <Text style={s.colQty}>{item.qty}</Text>
            <Text style={s.colAmount}>${fmtMoney(item.amount)}</Text>
            <Text style={s.colTotal}>${fmtMoney(item.amount * item.qty)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totalBlock}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>${fmtMoney(subtotal)}</Text>
          </View>
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>Total Due</Text>
            <Text style={s.grandTotalValue}>
              ${fmtMoney(invoice.total)} {invoice.currency}
            </Text>
          </View>
        </View>

        {/* Payment box with QR */}
        <View style={s.paymentBox}>
          {qrDataUrl && (
            <Image src={qrDataUrl} style={s.paymentQR} />
          )}
          <View style={s.paymentInfo}>
            <Text style={s.paymentTitle}>Pay with {invoice.currency}</Text>
            <Text style={s.paymentHeading}>Solana Pay</Text>
            <Text style={s.paymentDesc}>
              Scan the QR code with Phantom, Backpack, or any Solana wallet.
              Or visit the link below to pay on any device.
            </Text>
            <Text style={s.paymentUrl}>{paymentUrl}</Text>
          </View>
        </View>

        <Text style={s.thankYou}>
          Thank you for your business — it&apos;s a pleasure working with you.
        </Text>

        {/* Footer */}
        <View style={s.footer} fixed>
          <View style={s.footerBrand}>
            <VelaMark size={10} color={t.cyan} />
            <Text style={s.footerText}>vela</Text>
            <Text style={s.footerTag}>— get paid. on-chain.</Text>
          </View>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* Page 2 — Contract (optional)                                  */}
      {/* ============================================================ */}
      {contract && (
        <Page size="A4" style={s.page}>
          <View style={s.watermarkWrap} fixed>
            <VelaWatermark color={t.watermark} />
          </View>

          <View style={s.header}>
            <View style={s.brand}>
              <VelaMark size={22} color={t.cyan} />
              <Text style={s.logoText}>vela</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.invoiceLabel}>Agreement for</Text>
              <Text style={s.invoiceNumber}>{invoice.number}</Text>
            </View>
          </View>

          <Text style={s.contractTitle}>Freelance Service Agreement</Text>
          <Text style={s.contractSubtitle}>
            Between{" "}
            <Text style={{ color: t.primary, fontFamily: "Helvetica-Bold" }}>
              {freelancer.business_name || freelancer.name}
            </Text>{" "}
            (the Freelancer) and{" "}
            <Text style={{ color: t.primary, fontFamily: "Helvetica-Bold" }}>
              {invoice.client_name}
            </Text>{" "}
            (the Client), executed on {fmtDate(invoice.created_at)}.
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
              <Text style={s.signatureName}>
                {freelancer.business_name || freelancer.name}
              </Text>
            </View>
            <View style={s.signatureBlock}>
              <Text style={s.signatureLabel}>Client</Text>
              <Text style={s.signatureName}>{invoice.client_name}</Text>
            </View>
          </View>

          <View style={s.footer} fixed>
            <View style={s.footerBrand}>
              <VelaMark size={10} color={t.cyan} />
              <Text style={s.footerText}>vela</Text>
              <Text style={s.footerTag}>— get paid. on-chain.</Text>
            </View>
            <Text
              style={s.footerPage}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </Page>
      )}
    </Document>
  );
}
