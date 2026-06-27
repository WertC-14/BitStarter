import type { CampaignStatus } from "@/features/campaigns/types";

const styles: Record<CampaignStatus, string> = {
  Active: "bg-teal-50 text-teal-700 border-teal-200",
  VotingOpen: "bg-sky-50 text-sky-700 border-sky-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  Cancelled: "bg-amber-50 text-amber-700 border-amber-200"
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
