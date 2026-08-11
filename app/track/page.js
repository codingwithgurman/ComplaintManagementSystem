"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { StatusPill, Tracker } from "@/components/UI";
import { fetchComplaintById, formatDate, displayId } from "@/lib/data";

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="page-loading">Loading…</div>}>
      <TrackPageInner />
    </Suspense>
  );
}

function TrackPageInner() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null); // null = nothing searched, "not-found", or complaint object
  const [loading, setLoading] = useState(false);

  async function search(raw) {
    const cleaned = String(raw).trim().toUpperCase().replace(/^C/, "");
    const numericId = parseInt(cleaned, 10) - 100;
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setResult("not-found");
      return;
    }
    setLoading(true);
    try {
      const c = await fetchComplaintById(numericId);
      setResult(c);
    } catch {
      setResult("not-found");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const preId = searchParams.get("id");
    if (preId) { setInput(preId); search(preId); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    search(input);
  }

  return (
    <AppShell title="Track Complaint" requiredRole="student">
      <div className="content" style={{ maxWidth: 640, padding: 0 }}>
        <div className="panel">
          <div className="panel-head"><h2>Find your complaint</h2></div>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12 }}>
            <input type="text" placeholder="Enter complaint ID, e.g. C101" value={input} onChange={(e) => setInput(e.target.value)} style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Searching…" : "Search"}</button>
          </form>
        </div>

        {result === "not-found" && (
          <div className="ticket-stub">
            <div className="empty-state">
              <div className="glyph">&#10060;</div>
              <p>No complaint found with that ID. Double-check the ticket number and try again.</p>
            </div>
          </div>
        )}

        {result && result !== "not-found" && (
          <div className="ticket-stub">
            <div className="ticket-row">
              <span className="ticket-id mono">{displayId(result.id)}</span>
              <StatusPill status={result.status} />
            </div>
            <h3 style={{ marginTop: 14 }}>{result.title}</h3>
            <p style={{ fontSize: ".9rem" }}>{result.description}</p>
            <div className="ticket-divider"></div>
            <Tracker status={result.status} createdAt={result.created_at} updatedAt={result.updated_at} />
            <div className="ticket-meta" style={{ marginTop: 16 }}>
              <span>Dept: {result.department}</span>
              <span>Filed {formatDate(result.created_at)}</span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
