"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const BlogNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn =
    typeof window !== "undefined" && !!sessionStorage.getItem("user");

  const isActive = (path) => {
    if (path === "/blog") return pathname.startsWith("/blog");
    return pathname === path;
  };

  return (
    <header className="blog-header">
      <div className="blog-header-container">
        <div className="blog-logo" onClick={() => router.push("/")}>
          <img src="/image.png" alt="CalVant" />
        </div>
        <nav className="blog-nav">
          <button
            className="blog-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <ul className={`blog-nav-list ${mobileMenuOpen ? "active" : ""}`}>
            <li>
              <Link
                href="/"
                className={isActive("/") ? "active" : ""}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={isActive("/about") ? "active" : ""}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className={isActive("/blog") ? "active" : ""}
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
            </li>
            {!isLoggedIn && (
              <li>
                <Link
                  href="/login"
                  className="blog-login-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default BlogNavbar;
