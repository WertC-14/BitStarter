import { CreateCampaignForm } from "@/features/campaigns/CreateCampaignForm";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Create Campaign</h1>
        <p className="mt-2 text-slate-600">Launch a Monad Testnet investment campaign with refund-protected settlement.</p>
      </div>
      <CreateCampaignForm />
    </div>
  );
}
