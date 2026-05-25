/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useDashboardData  (flicker-fixed)
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX 1 — Separate initial REST fetch from SSE subscription (no double-fire)
 * FIX 2 — Deduplicate SSE payloads before calling setRawResults
 * FIX 3 — Stabilise lastFetched (only update if >1 s has passed)
 * FIX 4 — SSE error handler returns its own cleanup so polling stops on unmount
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const BASE_URL = "https://api.calvant.com/reports-service/api/reports";

function getToken() {
  try {
    return sessionStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

function getOrgId(orgId) {
  if (orgId) return orgId;
  try {
    return (
      sessionStorage.getItem("orgId") ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organization ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organizationId ||
      ""
    );
  } catch {
    return "";
  }
}

export function useDashboardData(config, orgIdProp, filters) {
  const orgId = useMemo(() => getOrgId(orgIdProp), [orgIdProp]);

  const [rawResults, setRawResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [online, setOnline] = useState(true);

  // ── FIX 3: ref used to throttle lastFetched updates ─────────────────────
  const lastFetchedRef = useRef(null);

  const bumpLastFetched = useCallback(() => {
    const now = new Date();
    // Only trigger a re-render if more than 1 second has passed
    if (!lastFetchedRef.current || now - lastFetchedRef.current > 1_000) {
      lastFetchedRef.current = now;
      setLastFetched(now);
    }
  }, []);

  // ── Core REST fetch ──────────────────────────────────────────────────────
  const fetch_ = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(
        `${BASE_URL}/results?organization=${encodeURIComponent(orgId)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      const json = await res.json();
      const arr = Array.isArray(json.data) ? json.data : [];
      const sorted = [...arr].sort(
        (a, b) => new Date(a.generatedAt) - new Date(b.generatedAt)
      );
      setRawResults(sorted);
      bumpLastFetched();
      setOnline(true);
    } catch (e) {
      setError(e.message || "Unknown error");
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, [orgId, bumpLastFetched]);

  // ── FIX 1: Initial load via REST only (no competing SSE on mount) ────────
  useEffect(() => {
    if (!orgId) return;
    fetch_();
  }, [fetch_]);

  // ── FIX 1 + 2 + 4: SSE subscription — separate effect, deduplicated ─────
  useEffect(() => {
    if (!orgId) return;

    const url =
      `${BASE_URL}/stream` +
      `?organization=${encodeURIComponent(orgId)}`;

    const es = new EventSource(url);
    // Holds the fallback polling interval id so we can clear it on unmount
    let pollId = null;

    es.addEventListener("report-update", (e) => {
      try {
        const payload = JSON.parse(e.data);

        // FIX 2: Only update state when the payload is genuinely new
        setRawResults((prev) => {
          const alreadyExists = prev.some(
            (r) => r.generatedAt === payload.generatedAt
          );
          if (alreadyExists) return prev; // ← same reference → no re-render

          const updated = [...prev, payload].sort(
            (a, b) => new Date(a.generatedAt) - new Date(b.generatedAt)
          );
          return updated;
        });

        bumpLastFetched(); // FIX 3: throttled update
        setOnline(true);
      } catch {
        // ignore malformed events
      }
    });

    // FIX 4: capture pollId so cleanup can clear it
    es.onerror = () => {
      setOnline(false);
      es.close();
      pollId = setInterval(fetch_, 10_000); // fallback polling
    };

    // Cleanup: close SSE and stop any fallback polling
    return () => {
      es.close();
      if (pollId !== null) clearInterval(pollId);
    };
  }, [orgId, fetch_, bumpLastFetched]);

  // ── Periodic background refresh (every 60 s) ────────────────────────────
  useEffect(() => {
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, [fetch_]);

  // ── Filter by interval ───────────────────────────────────────────────────
  const filteredResults = useMemo(() => {
    if (!filters?.interval || filters.interval === "all") return rawResults;

    if (filters.interval === "custom") {
      if (!filters.customFrom) return rawResults;
      const from = new Date(filters.customFrom);
      from.setHours(0, 0, 0, 0);
      const to = filters.customTo ? new Date(filters.customTo) : new Date();
      to.setHours(23, 59, 59, 999);
      return rawResults.filter((r) => {
        const d = new Date(r.generatedAt);
        return d >= from && d <= to;
      });
    }

    const days = { "7d": 7, "14d": 14, "90d": 90 }[filters.interval];
    if (!days) return rawResults;
    const cutoff = new Date(Date.now() - days * 86_400_000);
    return rawResults.filter((r) => new Date(r.generatedAt) >= cutoff);
  }, [rawResults, filters]);

  // ── Stable results shape for consumers ──────────────────────────────────
  const results = useMemo(() => {
    if (filteredResults.length === 0) return [];
    const latest = filteredResults[filteredResults.length - 1];
    return [
      {
        reportId: "snapshot",
        generatedAt: latest.generatedAt,
        data: latest.data,
        _series: filteredResults,
      },
    ];
  }, [filteredResults]);

  return { results, loading, error, refetch: fetch_, lastFetched, online };
}