// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMDOX ERP // Enterprise Cloud Suite",
  description: "AI-Powered autonomous backend corporate operations infrastructure.",
  keywords: "ERP, Enterprise Cloud, AI Inventory Forecasting, Financial General Ledger, SaaS Monorepo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-primary/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
