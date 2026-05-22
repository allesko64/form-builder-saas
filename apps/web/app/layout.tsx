import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "~/lib/fonts";
import { GlobalProviders } from "~/providers/global";

export const metadata: Metadata = {
  title: "The Dossier Times",
  description: "Classified intelligence form builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      {/*
       * bg-[var(--color-paper)] sets the aged-newsprint background globally.
       * antialised + no font-sans keeps us firmly in the serif/typewriter world.
       */}
      <body className="min-h-screen antialiased bg-[var(--color-paper)]">
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
