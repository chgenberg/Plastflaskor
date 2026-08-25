import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "aqua visibility",
  description: "Kolsyrat vatten med egen etikett från aqua visibility",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${inter.variable} ${fraunces.variable} ${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
