import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateCampaignForm } from "@/features/campaigns/CreateCampaignForm";

vi.mock("@/lib/contracts/campaignClient", () => ({
  createCampaign: vi.fn().mockImplementation(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      transactionHash: "real-testnet-hash",
      campaignId: "CCAMPAIGN"
    };
  })
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

describe("CreateCampaignForm", () => {
  it("validates empty fields", async () => {
    render(<CreateCampaignForm />);

    await userEvent.click(screen.getByRole("button", { name: "Create campaign" }));

    expect(await screen.findByText("Title must be at least 3 characters.")).toBeInTheDocument();
    expect(screen.getByText("Description must be at least 10 characters.")).toBeInTheDocument();
  });

  it("shows loading state during transaction", async () => {
    render(<CreateCampaignForm />);

    await userEvent.type(screen.getByLabelText("Title"), "Launch Toolkit");
    await userEvent.type(screen.getByLabelText("Description"), "A useful investment campaign.");
    await userEvent.type(screen.getByLabelText("Goal amount, MON"), "100");
    await userEvent.type(screen.getByLabelText("Deadline"), "2027-01-01T10:00");
    await userEvent.type(screen.getByLabelText("Metadata URI"), "ipfs://launch-toolkit");
    await userEvent.click(screen.getByRole("button", { name: "Create campaign" }));

    expect(screen.getByRole("button", { name: "Creating campaign..." })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Transaction hash:/)).toBeInTheDocument());
  });
});
