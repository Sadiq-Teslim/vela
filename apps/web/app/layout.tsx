import type { Metadata } from "next";
import { Syne, Outfit, DM_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-display",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Vela — Get Paid. On-Chain.",
  description:
    "AI-powered invoicing and payment tool for Nigerian freelancers. Describe your job, get an invoice, collect USDC on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${syne.variable} ${outfit.variable} ${dmMono.variable} font-body`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
