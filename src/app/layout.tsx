import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { getDir, getLocale, t } from "@/lib/i18n";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: { default: t("app.name"), template: `%s · ${t("app.name")}` },
  description: t("app.description"),
  applicationName: t("app.name"),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#33193a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()} dir={getDir()} className={nunito.variable}>
      <body>{children}</body>
    </html>
  );
}
