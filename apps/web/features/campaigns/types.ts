export type CampaignStatus = "Active" | "VotingOpen" | "Approved" | "Rejected" | "Cancelled";

export type Campaign = {
  id: string;
  title: string;
  description: string;
  developer: string;
  goalAmount: number;
  totalInvested: number;
  fundingDeadline: string;
  metadataUri: string;
  refundRatio: number;
  usableRatio: number;
  totalUsableAllocated?: number;
  totalUsableWithdrawn?: number;
  usableAvailable?: number;
  votingDuration: number;
  status: CampaignStatus;
};

export type BuyerOrder = {
  campaignId: string;
  buyer: string;
  amount: number;
  refundable: boolean;
};
