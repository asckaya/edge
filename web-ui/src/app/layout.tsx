import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Edge Subscription Generator",
  description: "Convert your proxy endpoints & external subscriptions into Cloudflare configurations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark:bg-slate-900">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100 min-h-screen flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-blue-500/30`}>
        {children}
      </body>
    </html>
  );
}
