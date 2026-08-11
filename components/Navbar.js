"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link href="/" className="brand">
          <span className="brand-mark">CD</span> CampusDesk
        </Link>

        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li><Link href="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link href="/#about" onClick={() => setMenuOpen(false)}>About</Link></li>
          <li><Link href="/#contact" onClick={() => setMenuOpen(false)}>Contact</Link></li>
          <li className={`nav-dropdown ${dropdownOpen ? "open" : ""}`} ref={dropdownRef}>
            <button
              className="nav-dropdown-toggle"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              onClick={(e) => { e.stopPropagation(); setDropdownOpen((o) => !o); }}
            >
              Login <span className="caret">&#9662;</span>
            </button>
            <ul className="nav-dropdown-menu">
              <li><Link href="/login" onClick={() => setDropdownOpen(false)}>Student</Link></li>
              <li><Link href="/admin/login" onClick={() => setDropdownOpen(false)}>Admin</Link></li>
            </ul>
          </li>
        </ul>

        <div className="nav-cta">
          <Link href="/register" className="btn btn-primary">Register</Link>
        </div>

        <button className="nav-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen((o) => !o)}>
          <span></span><span></span><span></span>
        </button>
      </nav>
    </header>
  );
}
