"use client";

import { supabase } from "./supabaseClient";

export const CATEGORIES = [
  "Wi-Fi / Network", "Hostel", "Library", "Canteen", "Faculty",
  "Examination", "Infrastructure", "Fees & Accounts", "Other",
];

// Statuses simplified since there's no separate staff role anymore —
// admin moves a complaint straight from Pending to Resolved.
export const STATUSES = ["Pending", "In Progress", "Resolved"];

export function displayId(numericId) {
  return `C${100 + Number(numericId)}`;
}

export function statusPillClass(status) {
  return { Pending: "pending", "In Progress": "progress", Resolved: "resolved" }[status] || "pending";
}
export function priorityClass(p) {
  return (p || "low").toLowerCase();
}
export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
export function formatDateTime(iso) {
  const ts = new Date(iso).getTime();
  const diffH = Math.round((Date.now() - ts) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ---------- Complaints ----------
export async function fetchMyComplaints(studentId) {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchAllComplaints() {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchComplaintById(id) {
  const { data, error } = await supabase.from("complaints").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createComplaint(payload) {
  const { data, error } = await supabase.from("complaints").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateComplaintStatus(id, patch) {
  const { data, error } = await supabase.from("complaints").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteComplaint(id) {
  const { error } = await supabase.from("complaints").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadComplaintImage(file, studentId) {
  const ext = file.name.split(".").pop();
  const path = `${studentId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("complaint-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("complaint-images").getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Departments ----------
export async function fetchDepartments() {
  const { data, error } = await supabase.from("departments").select("*").order("name");
  if (error) throw error;
  return data;
}
export async function addDepartment(payload) {
  const { data, error } = await supabase.from("departments").insert(payload).select().single();
  if (error) throw error;
  return data;
}
export async function updateDepartment(id, patch) {
  const { error } = await supabase.from("departments").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteDepartment(id) {
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Notifications ----------
export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function markAllNotificationsRead(userId) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) throw error;
}
export async function unreadNotificationCount(userId) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
  return count || 0;
}

// ---------- Profiles ----------
export async function updateProfile(userId, patch) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}
export async function fetchAllProfiles() {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return data;
}
