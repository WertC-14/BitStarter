import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CampaignCard } from "@/features/campaigns/CampaignCard";

describe("CampaignCard", () => {
  it("renders title, goal, and status", () => {
    render(<CampaignCard campaign={{
      id: "CCAMPAIGN",
      title: "Open Source AI Course",
      description: "A real Testnet campaign.",
      developer: "GDEVELOPER",
      goalAmount: 1200,
      totalInvested: 875,
      fundingDeadline: "2027-01-01T00:00:00.000Z",
      metadataUri: "ipfs://course",
      refundRatio: 60,
      usableRatio: 40,
      votingDuration: 604800,
      status: "Active"
    }} />);

    expect(screen.getByText("Open Source AI Course")).toBeInTheDocument();
    expect(screen.getByText(/875 \/ 1200 MON/)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
