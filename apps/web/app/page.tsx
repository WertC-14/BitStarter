import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ShieldCheck, TimerReset, WalletCards } from "lucide-react";
import { ActivityFeed } from "@/features/realtime/ActivityFeed";

const steps: { title: string; text: string; Icon: LucideIcon }[] = [
  {
    title: "Create",
    text: "Developers launch an investment campaign with funding, reserve, and voting settings.",
    Icon: ShieldCheck
  },
  {
    title: "Escrow",
    text: "Investors fund campaigns while the contract splits usable funds and protected reserves.",
    Icon: WalletCards
  },
  {
    title: "Settle",
    text: "Capital-weighted voting approves final withdrawal or unlocks protected refunds.",
    Icon: TimerReset
  }
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 py-6 md:grid-cols-[1.35fr_0.65fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase text-accent">Monad Testnet · Commitment Launch</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Refund-protected funding for software launches.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            BitStarter uses EVM smart contracts on Monad to split each investment into developer-usable funds and a protected refund reserve — with optional commitment cohorts and defection mechanics.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/campaigns/new" className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-medium text-white">
              Create Campaign <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/campaigns" className="rounded-md border border-line bg-white px-5 py-3 text-sm font-medium">
              Explore Campaigns
            </Link>
          </div>
        </div>
        <ActivityFeed />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {steps.map(({ title, text, Icon }) => (
          <div key={title} className="rounded-lg border border-line bg-white p-5">
            <Icon size={22} className="text-accent" aria-hidden="true" />
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
