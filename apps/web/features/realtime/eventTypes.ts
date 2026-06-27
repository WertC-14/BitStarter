export type CampaignEventType =
  | "campaign_created"
  | "investment_placed"
  | "usable_funds_withdrawn"
  | "voting_opened"
  | "vote_cast"
  | "campaign_finalized"
  | "refund_claimed"
  | "remaining_funds_withdrawn"
  | "campaign_cancelled";

export type CampaignEvent = {
  id: string;
  type: CampaignEventType;
  message: string;
  createdAt: string;
};
