"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import AppShell from "@/components/AppShell";
import { StatusPill, PriorityTag, Tracker } from "@/components/UI";
import { fetchComplaintById, formatDate, displayId } from "@/lib/data";

export default function ComplaintDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    if (!user || !id) return;
    fetchComplaintById(id)
      .then((c) => setComplaint(c.student_id === user.id ? c : null))
      .catch(() => setComplaint(null));
  }, [user, id]);

  return (
    <AppShell title="Complaint Details" requiredRole="student">
      {complaint === undefined ? (
        <p style={{ color: "var(--ink-faint)", fontSize: ".9rem" }}>Loading…</p>
      ) : complaint === null ? (
        <div className="empty-state">
          <div className="glyph">&#128269;</div>
          <p>Complaint not found.</p>
          <Link href="/complaints" className="btn btn-primary btn-sm">Back to my complaints</Link>
        </div>
      ) : (
        <>
          <div className="panel">
            <div className="panel-head">
              <div>
                <span className="mono" style={{ color: "var(--primary)", fontWeight: 700 }}>{displayId(complaint.id)}</span>
                <h2 style={{ marginTop: 6 }}>{complaint.title}</h2>
              </div>
              <StatusPill status={complaint.status} />
            </div>

            <div className="detail-grid">
              <div>
                <div className="kv"><b>Category</b><span>{complaint.category}</span></div>
                <div className="kv"><b>Department</b><span>{complaint.department}</span></div>
                <div className="kv"><b>Priority</b><span><PriorityTag priority={complaint.priority} /></span></div>
                <div className="kv"><b>Date filed</b><span>{formatDate(complaint.created_at)}</span></div>

                <h3 style={{ marginTop: 24, fontSize: "1rem" }}>Description</h3>
                <p>{complaint.description}</p>

                <h3 style={{ fontSize: "1rem" }}>Admin remarks</h3>
                <p>{complaint.remarks || "No remarks from admin yet."}</p>

                <h3 style={{ fontSize: "1rem" }}>Attached image</h3>
                {complaint.image_url ? (
                  <img src={complaint.image_url} alt="Complaint attachment" style={{ borderRadius: 10, border: "1px solid var(--line)", maxHeight: 220 }} />
                ) : (
                  <p style={{ fontSize: ".85rem", color: "var(--ink-faint)" }}>No image attached.</p>
                )}
              </div>
              <div>
                <div className="panel" style={{ margin: 0 }}>
                  <h3 style={{ fontSize: "1rem", marginBottom: 14 }}>Status timeline</h3>
                  <Tracker status={complaint.status} createdAt={complaint.created_at} updatedAt={complaint.updated_at} />
                </div>
              </div>
            </div>
          </div>
          <Link href="/complaints" className="btn btn-outline">&larr; Back to my complaints</Link>
        </>
      )}
    </AppShell>
  );
}
