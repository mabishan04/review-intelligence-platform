"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { signOutUser } from "@/lib/authClient";

export default function Header() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/ai-search", label: "AI Search" },
    { href: "/about", label: "About" },
  ];

  return (
    <header
      style={{
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 32px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "40px",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#0f172a",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>🛍️</span>
          <span>Review Intelligence</span>
        </a>

        <nav
          style={{
            display: "flex",
            gap: "32px",
            fontSize: "14px",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                textDecoration: "none",
                color: hoveredLink === link.href ? "#0ea5e9" : "#475569",
                transition: "all 0.3s ease",
                fontWeight: hoveredLink === link.href ? 600 : 500,
                paddingBottom: 4,
                borderBottom: hoveredLink === link.href ? "2px solid #0ea5e9" : "2px solid transparent",
              }}
              onMouseEnter={() => setHoveredLink(link.href)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth Section */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          {!loading && !user && (
            <a
              href={`/auth?redirect=${encodeURIComponent(pathname)}`}
              style={{
                fontSize: 13,
                padding: "6px 14px",
                borderRadius: 9999,
                border: "1px solid rgba(148,163,184,0.7)",
                textDecoration: "none",
                color: "#0f172a",
                backgroundColor: "rgba(255,255,255,0.9)",
                transition: "all 0.3s ease",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#f1f5f9";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(148,163,184,1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.9)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(148,163,184,0.7)";
              }}
            >
              Sign in
            </a>
          )}

          {!loading && user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  fontSize: 13,
                  padding: "6px 14px",
                  borderRadius: 9999,
                  border: "1px solid rgba(14,165,233,0.5)",
                  backgroundColor: "rgba(14,165,233,0.1)",
                  color: "#0284c7",
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(14,165,233,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(14,165,233,0.1)";
                }}
              >
                {user.email?.split("@")[0]}
              </button>

              {showUserMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 8,
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    minWidth: 160,
                    zIndex: 1000,
                  }}
                >
                  <button
                    onClick={() => setShowSignOutConfirm(true)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#dc2626",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.3s ease",
                      borderRadius: "0 0 12px 12px",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(220,38,38,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign Out Confirmation Modal */}
        {showSignOutConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
            }}
            onClick={() => setShowSignOutConfirm(false)}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "400px",
                width: "90%",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0" }}>
                Sign out?
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px 0" }}>
                Are you sure you want to sign out? You'll need to sign in again to add products or write reviews.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    color: "#0f172a",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await signOutUser();
                    setShowSignOutConfirm(false);
                    setShowUserMenu(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#b91c1c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#dc2626";
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
