import type { CampaignEvent } from "./eventTypes";

export function parseContractEvent(raw: { id?: string; topic?: string; message?: string }): CampaignEvent {
  return {
    id: raw.id ?? crypto.randomUUID(),
    type: (raw.topic ?? "investment_placed") as CampaignEvent["type"],
    message: raw.message ?? "Campaign activity detected on Monad Testnet.",
    createdAt: new Date().toISOString()
  };
}
