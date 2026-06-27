"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign } from "./types";
import {
  claimRefund,
  invest,
  withdrawAvailableFunds,
  withdrawRemainingFunds
} from "@/lib/contracts/campaignClient";
import { parseEvmError } from "@/lib/errors/parseEvmError";

export function CampaignActions({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const remainingAmount = Math.max(0, campaign.goalAmount - campaign.totalInvested);
  const usableAvailable = campaign.usableAvailable ?? 0;
  const [amount, setAmount] = useState(String(Math.min(25, remainingAmount || 25)));
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: "invest" | "refund" | "withdraw-usable" | "withdraw-remaining") {
    setLoading(action);
    setMessage("");
    setError("");
    try {
      const parsedAmount = Number(amount);
      if (action === "invest" && parsedAmount <= 0) {
        throw new Error("Investment amount must be greater than zero.");
      }
      if (action === "withdraw-usable" && (parsedAmount <= 0 || parsedAmount > usableAvailable)) {
        throw new Error(`Withdraw an amount up to ${usableAvailable} MON.`);
      }
      const result = action === "invest"
        ? await invest(campaign.id, parsedAmount)
        : action === "refund"
          ? await claimRefund(campaign.id)
          : action === "withdraw-usable"
            ? await withdrawAvailableFunds(campaign.id, parsedAmount)
            : await withdrawRemainingFunds(campaign.id);
      setMessage(`Transaction submitted: ${result.transactionHash}`);
      router.refresh();
    } catch (err) {
      setError(parseEvmError(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-8 space-y-4 border-t border-line pt-6">
      <label className="block text-sm font-medium" htmlFor="amount">Investment amount</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="amount"
          type="number"
          min="0.0000001"
          max={remainingAmount}
          step="0.0000001"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="min-h-11 flex-1 rounded-md border border-line px-3"
        />
        <button disabled={loading !== null || campaign.status !== "Active"} onClick={() => run("invest")} className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading === "invest" ? "Waiting for transaction..." : "Invest"}
        </button>
      </div>
      <p className="text-sm text-slate-600">Goal remaining: {remainingAmount} MON</p>
      <p className="text-sm text-slate-600">Usable funds available to withdraw: {usableAvailable} MON</p>
      <div className="flex flex-wrap gap-3">
        <button disabled={loading !== null || !["Rejected", "Cancelled"].includes(campaign.status)} onClick={() => run("refund")} className="rounded-md border border-line bg-white px-4 py-2 text-sm disabled:opacity-50">
          {loading === "refund" ? "Claiming refund..." : "Claim refund"}
        </button>
        <button disabled={loading !== null || usableAvailable <= 0 || !["Active", "VotingOpen"].includes(campaign.status)} onClick={() => run("withdraw-usable")} className="rounded-md border border-line bg-white px-4 py-2 text-sm disabled:opacity-50">
          {loading === "withdraw-usable" ? "Withdrawing funds..." : "Withdraw usable funds"}
        </button>
        <button disabled={loading !== null || campaign.status !== "Approved"} onClick={() => run("withdraw-remaining")} className="rounded-md border border-line bg-white px-4 py-2 text-sm disabled:opacity-50">
          {loading === "withdraw-remaining" ? "Withdrawing funds..." : "Withdraw remaining funds"}
        </button>
      </div>
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
    </div>
  );
}
