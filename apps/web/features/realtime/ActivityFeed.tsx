"use client";

import { Radio } from "lucide-react";
import { useCampaignEvents } from "./useCampaignEvents";

export function ActivityFeed({ campaignId }: { campaignId?: string }) {
  const { events, loading } = useCampaignEvents(campaignId);

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <Radio size={18} className="text-accent" aria-hidden="true" />
        <h2 className="font-semibold">Live Activity</h2>
      </div>
      {loading ? <p className="mt-4 text-sm text-slate-600">Loading live activity...</p> : null}
      {!loading && events.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No recent contract events found.</p>
      ) : null}
      <ul className="mt-4 space-y-3 text-sm">
        {events.map((event) => (
          <li key={event.id} className="border-l-2 border-accent pl-3 text-slate-700">
            {event.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
