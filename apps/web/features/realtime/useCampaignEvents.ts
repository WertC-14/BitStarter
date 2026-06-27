"use client";

import { useEffect, useState } from "react";
import type { CampaignEvent } from "./eventTypes";

export function useCampaignEvents(campaignId?: string) {
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const interval = window.setInterval(() => {
      if (!active) return;
      setEvents((current) => current);
      setLoading(false);
    }, 3500);

    setLoading(false);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [campaignId]);

  return { events, loading };
}
