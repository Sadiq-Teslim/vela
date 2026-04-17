import { AppShell } from "@/components/layout";

export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
