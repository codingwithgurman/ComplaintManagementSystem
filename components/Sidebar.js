"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const STUDENT_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "\u25C9" },
  { href: "/complaints/new", label: "New Complaint", icon: "+" },
  { href: "/complaints", label: "My Complaints", icon: "\u2630" },
  { href: "/track", label: "Track Complaint", icon: "\u21A9" },
  { href: "/chatbot", label: "AI Help Desk", icon: "\u2728" },
  { href: "/notifications", label: "Notifications", icon: "\u{1F514}" },
  { href: "/profile", label: "Profile", icon: "\u{1F464}" },
];

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "\u25C9" },
  { href: "/admin/complaints", label: "Complaints", icon: "\u2630" },
  { href: "/admin/departments", label: "Departments", icon: "\u{1F3E2}" },
  { href: "/chatbot", label: "AI Help Desk", icon: "\u2728" },
];

export default function Sidebar({ role = "student", open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const links = role === "admin" ? ADMIN_LINKS : STUDENT_LINKS;

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <Link href="/" className="brand">
        <span className="brand-mark">CD</span> CampusDesk
      </Link>
      <nav className="side-menu">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "active" : ""}
            onClick={onClose}
          >
            <span className="ic">{link.icon}</span> {link.label}
          </Link>
        ))}
      </nav>
      <div className="side-foot">
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
          <span className="ic">&#10148;</span> Logout
        </a>
      </div>
    </aside>
  );
}
