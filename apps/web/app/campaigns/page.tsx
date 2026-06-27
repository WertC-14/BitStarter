import { CampaignCard } from "@/features/campaigns/CampaignCard";
import type { Campaign } from "@/features/campaigns/types";
import { listCampaigns } from "@/lib/contracts/campaignClient";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  let campaigns: Campaign[] = [];
  let error = "";

  try {
    campaigns = await listCampaigns();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load campaigns from Monad Testnet.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Explore Campaigns</h1>
        <p className="mt-2 text-slate-600">Browse Monad Testnet investment campaigns and funding status.</p>
      </div>
      {error ? (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-slate-600">
          No campaigns found.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
        </div>
      )}
    </div>
  );
}
