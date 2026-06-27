import Link from "next/link";
import type { Campaign } from "./types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = Math.min(100, Math.round((campaign.totalInvested / campaign.goalAmount) * 100));

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{campaign.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{campaign.description}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>
      <div className="mt-5 h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-accent" style={{ width: `${progress}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Raised</dt>
          <dd className="font-medium">{campaign.totalInvested} / {campaign.goalAmount} MON</dd>
        </div>
        <div>
          <dt className="text-slate-500">Deadline</dt>
          <dd className="font-medium">{new Date(campaign.fundingDeadline).toLocaleDateString()}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500">Developer</dt>
          <dd className="truncate font-mono text-xs">{campaign.developer}</dd>
        </div>
      </dl>
      <Link href={`/campaigns/${encodeURIComponent(campaign.id)}`} className="mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white">
        View campaign
      </Link>
    </article>
  );
}
