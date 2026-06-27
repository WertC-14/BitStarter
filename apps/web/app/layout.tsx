import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { WalletStatus } from "@/features/wallet/WalletStatus";

export const metadata: Metadata = {
  title: "BitStarter",
  description: "Refund-protected investment crowdfunding on Monad Testnet"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-line bg-white">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="text-xl font-semibold tracking-normal">BitStarter</Link>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link href="/campaigns">Explore</Link>
              <Link href="/campaigns/new">Create</Link>
              <Link href="/dashboard">Dashboard</Link>
              <WalletStatus />
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
