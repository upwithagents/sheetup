import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";
import { ThemeScript } from "@upwithagents/ui";
import PortalChrome from "@/components/PortalChrome";
import "./globals.css";

const archivo = Archivo({
  variable: "--app-font-display",
  subsets: ["latin"],
  weight: ["600"],
});

const inter = Inter({
  variable: "--app-font-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--app-font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sheetup",
  description: "Unify your messy sheets and notes — built for musicians",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${plexMono.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body>
        <PortalChrome />
        <header className="app-header">
          <Link href="/" className="app-logo">
            Sheetup
          </Link>
          <nav>
            <Link href="/import" className="app-nav-link">
              Import
            </Link>
          </nav>
        </header>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
