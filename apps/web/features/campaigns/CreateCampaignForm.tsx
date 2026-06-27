"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldError } from "@/components/ui/FieldError";
import { createCampaign } from "@/lib/contracts/campaignClient";
import { parseEvmError } from "@/lib/errors/parseEvmError";
import { createCampaignSchema, type CreateCampaignInput } from "@/lib/validation/campaignSchema";

const emptyForm: CreateCampaignInput = {
  title: "",
  description: "",
  goalAmount: 0,
  deadline: "",
  metadataUri: "",
  refundRatio: 60,
  usableRatio: 40,
  votingDurationDays: 7
};

export function CreateCampaignForm() {
  const router = useRouter();
  const [form, setForm] = useState<CreateCampaignInput>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCampaignInput, string>>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [submitError, setSubmitError] = useState("");

  function update<K extends keyof CreateCampaignInput>(key: K, value: CreateCampaignInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("");
    setSubmitError("");
    const parsed = createCampaignSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])));
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const response = await createCampaign(parsed.data);
      setResult(
        response.campaignId
          ? `Campaign created: ${response.campaignId}. Transaction hash: ${response.transactionHash}`
          : `Campaign created. Transaction hash: ${response.transactionHash}`
      );
      router.refresh();
    } catch (error) {
      setSubmitError(parseEvmError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-line bg-white p-6">
      <div>
        <label className="block text-sm font-medium" htmlFor="title">Title</label>
        <input id="title" value={form.title} onChange={(event) => update("title", event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-line px-3" />
        <FieldError>{errors.title}</FieldError>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="description">Description</label>
        <textarea id="description" value={form.description} onChange={(event) => update("description", event.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-line px-3 py-2" />
        <FieldError>{errors.description}</FieldError>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium" htmlFor="goalAmount">Goal amount, MON</label>
          <input id="goalAmount" type="number" min="1" value={form.goalAmount || ""} onChange={(event) => update("goalAmount", Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-md border border-line px-3" />
          <FieldError>{errors.goalAmount}</FieldError>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="deadline">Deadline</label>
          <input id="deadline" type="datetime-local" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-line px-3" />
          <FieldError>{errors.deadline}</FieldError>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="metadataUri">Metadata URI</label>
        <input id="metadataUri" value={form.metadataUri} onChange={(event) => update("metadataUri", event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-line px-3" />
        <FieldError>{errors.metadataUri}</FieldError>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium" htmlFor="refundRatio">Refund reserve, %</label>
          <input id="refundRatio" type="number" min="0" max="100" value={form.refundRatio} onChange={(event) => update("refundRatio", Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-md border border-line px-3" />
          <FieldError>{errors.refundRatio}</FieldError>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="usableRatio">Developer usable, %</label>
          <input id="usableRatio" type="number" min="0" max="100" value={form.usableRatio} onChange={(event) => update("usableRatio", Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-md border border-line px-3" />
          <FieldError>{errors.usableRatio}</FieldError>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="votingDurationDays">Voting duration, days</label>
          <input id="votingDurationDays" type="number" min="1" step="1" value={form.votingDurationDays} onChange={(event) => update("votingDurationDays", Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-md border border-line px-3" />
          <FieldError>{errors.votingDurationDays}</FieldError>
        </div>
      </div>
      <button disabled={loading} className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
        {loading ? "Creating campaign..." : "Create campaign"}
      </button>
      {result ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{result}</p> : null}
      {submitError ? <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{submitError}</p> : null}
    </form>
  );
}
