import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

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
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark:bg-slate-900 scroll-smooth`}>
      <body className="font-outfit bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-gray-100 min-h-screen flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
