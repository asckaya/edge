import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100 min-h-screen flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
