import { Contract, formatEther, parseEther } from "ethers";
import type { Campaign, CampaignStatus } from "@/features/campaigns/types";
import type { CreateCampaignInput } from "@/lib/validation/campaignSchema";
import { getReadProvider, getSigner } from "@/lib/evm/provider";
import { FACTORY_ABI, CAMPAIGN_ABI, ERC20_ABI } from "@/lib/evm/abis";

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID ?? "";
const TOKEN_ADDRESS   = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID ?? "";

const STATUS_MAP: CampaignStatus[] = ["Active", "VotingOpen", "Approved", "Rejected", "Cancelled"];

function toStatus(n: number | bigint): CampaignStatus {
  return STATUS_MAP[Number(n)] ?? "Active";
}

type SummaryTuple = {
  id: string;
  developer: string;
  title: string;
  fundingGoal: bigint;
  fundingDeadline: bigint;
  metadataUri: string;
  launchMode: number;
};

// ── Read ─────────────────────────────────────────────────────────────────────

export async function listCampaigns(): Promise<Campaign[]> {
  if (!FACTORY_ADDRESS) throw new Error("Factory adresi ayarlanmamış (.env).");
  const provider  = getReadProvider();
  const factory   = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  const summaries = (await factory.getAllCampaigns()) as SummaryTuple[];

  return Promise.all(
    summaries.map(async (s) => {
      const campaign = new Contract(s.id, CAMPAIGN_ABI, provider);
      const [status, totalInvested, totalUsableAllocated, totalUsableWithdrawn] = await Promise.all([
        campaign.status(),
        campaign.totalInvested(),
        campaign.totalUsableAllocated(),
        campaign.totalUsableWithdrawn(),
      ]);

      const total   = Number(formatEther(totalInvested));
      const alloc   = Number(formatEther(totalUsableAllocated));
      const withdr  = Number(formatEther(totalUsableWithdrawn));

      return {
        id:                  s.id,
        title:               s.title,
        description:         "",
        developer:           s.developer,
        goalAmount:          Number(formatEther(s.fundingGoal)),
        totalInvested:       total,
        fundingDeadline:     new Date(Number(s.fundingDeadline) * 1000).toISOString(),
        metadataUri:         s.metadataUri,
        refundRatio:         0,
        usableRatio:         0,
        totalUsableAllocated: alloc,
        totalUsableWithdrawn: withdr,
        usableAvailable:     Math.max(0, alloc - withdr),
        votingDuration:      0,
        status:              toStatus(status),
      } satisfies Campaign;
    })
  );
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  try {
    const provider  = getReadProvider();
    const campaign  = new Contract(id, CAMPAIGN_ABI, provider);
    const [
      title, description, developer, fundingGoal, fundingDeadline,
      refundRatio, usableRatio, votingDuration, status,
      totalInvested, totalUsableAllocated, totalUsableWithdrawn,
    ] = await Promise.all([
      campaign.title(),
      campaign.description(),
      campaign.developer(),
      campaign.fundingGoal(),
      campaign.fundingDeadline(),
      campaign.refundRatio(),
      campaign.usableRatio(),
      campaign.votingDuration(),
      campaign.status(),
      campaign.totalInvested(),
      campaign.totalUsableAllocated(),
      campaign.totalUsableWithdrawn(),
    ]);

    const alloc  = Number(formatEther(totalUsableAllocated));
    const withdr = Number(formatEther(totalUsableWithdrawn));

    return {
      id,
      title,
      description,
      developer,
      goalAmount:           Number(formatEther(fundingGoal)),
      totalInvested:        Number(formatEther(totalInvested)),
      fundingDeadline:      new Date(Number(fundingDeadline) * 1000).toISOString(),
      metadataUri:          "",
      refundRatio:          Number(refundRatio),
      usableRatio:          Number(usableRatio),
      totalUsableAllocated: alloc,
      totalUsableWithdrawn: withdr,
      usableAvailable:      Math.max(0, alloc - withdr),
      votingDuration:       Number(votingDuration),
      status:               toStatus(status),
    };
  } catch {
    return null;
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createCampaign(
  input: CreateCampaignInput
): Promise<{ transactionHash: string; campaignId: string }> {
  if (!FACTORY_ADDRESS) throw new Error("Factory adresi ayarlanmamış (.env).");
  const signer  = await getSigner();
  const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

  const deadlineSeconds   = Math.floor(new Date(input.deadline).getTime() / 1000);
  const votingDurationSec = Math.round(input.votingDurationDays * 24 * 60 * 60);

  const tx = await factory.createCampaign(
    input.title,
    input.description,
    input.metadataUri,
    parseEther(String(input.goalAmount)),
    deadlineSeconds,
    input.refundRatio,
    input.usableRatio,
    votingDurationSec
  );
  const receipt = await tx.wait();
  const campaignId = receipt?.logs?.[0]?.address ?? "";
  return { transactionHash: tx.hash, campaignId };
}

export async function invest(
  campaignId: string,
  amount: number
): Promise<{ transactionHash: string }> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Geçersiz yatırım miktarı.");
  const signer   = await getSigner();
  const amountWei = parseEther(String(amount));

  // Önce escrow için approve
  if (TOKEN_ADDRESS) {
    const token  = new Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
    const escrow = await (new Contract(campaignId, CAMPAIGN_ABI, signer) as unknown as { escrow(): Promise<string> }).escrow?.() ?? "";
    if (escrow) {
      const approveTx = await token.approve(escrow, amountWei);
      await approveTx.wait();
    }
  }

  const campaign = new Contract(campaignId, CAMPAIGN_ABI, signer);
  const tx = await campaign.invest(amountWei);
  await tx.wait();
  return { transactionHash: tx.hash };
}

export async function vote(
  campaignId: string,
  choice: 1 | 2
): Promise<{ transactionHash: string }> {
  const signer   = await getSigner();
  const campaign = new Contract(campaignId, CAMPAIGN_ABI, signer);
  const tx = await campaign.vote(choice);
  await tx.wait();
  return { transactionHash: tx.hash };
}

export async function claimRefund(campaignId: string): Promise<{ transactionHash: string }> {
  const signer   = await getSigner();
  const campaign = new Contract(campaignId, CAMPAIGN_ABI, signer);
  const tx = await campaign.claimRefund();
  await tx.wait();
  return { transactionHash: tx.hash };
}

export async function withdrawAvailableFunds(
  campaignId: string,
  amount: number
): Promise<{ transactionHash: string }> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Geçersiz miktar.");
  const signer   = await getSigner();
  const campaign = new Contract(campaignId, CAMPAIGN_ABI, signer);
  const tx = await campaign.withdrawAvailableFunds(parseEther(String(amount)));
  await tx.wait();
  return { transactionHash: tx.hash };
}

export async function withdrawRemainingFunds(
  campaignId: string
): Promise<{ transactionHash: string }> {
  const signer   = await getSigner();
  const campaign = new Contract(campaignId, CAMPAIGN_ABI, signer);
  const tx = await campaign.withdrawRemainingFunds();
  await tx.wait();
  return { transactionHash: tx.hash };
}
