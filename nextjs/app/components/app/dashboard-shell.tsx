"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/app/components/global/icons";
import { languages, multiLevelLinks, sidebarItems, versionText } from "@/app/lib/data";
import { useUserActions, useUserState } from "@/app/lib/providers/userProvider";

function Flag({ code }: { code: string }) {
  return <span className="flag">{code}</span>;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useUserActions();
  const { session } = useUserState();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [multiLevelOpen, setMultiLevelOpen] = useState(true);
  const currentYear = new Date().getFullYear();
  const currentLanguage = languages[0];
  const activeLabel = useMemo(
    () => sidebarItems.find((item) => pathname === item.href)?.label ?? "About",
    [pathname]
  );

  return (
    <div className={`shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="icon-button"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((value) => !value)}
          >
            <Icon name="menu" />
          </button>
          <Link href="/app/home" className="top-link">
            Home page
          </Link>
          <Link href="/app/about" className="top-link">
            About
          </Link>
        </div>
        <div className="topbar-right">
          <div className="menu-wrapper">
            <button
              type="button"
              className="plain-button"
              onClick={() => {
                setLanguageOpen((value) => !value);
                setUserOpen(false);
              }}
            >
              <Flag code={currentLanguage.flag} />
              <span>{currentLanguage.label}</span>
            </button>
            {languageOpen ? (
              <div className="dropdown">
                {languages.slice(1).map((language) => (
                  <button key={language.code} type="button" className="dropdown-item">
                    <Flag code={language.flag} />
                    <span>{language.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="menu-wrapper">
            <button
              type="button"
              className="avatar-button"
              onClick={() => {
                setUserOpen((value) => !value);
                setLanguageOpen(false);
              }}
            >
              <Image src="/img/user.png" alt="User" width={34} height={34} className="avatar-image" />
            </button>
            {userOpen ? (
              <div className="dropdown">
                <Link href="/app/update-password" className="dropdown-item">
                  <Icon name="password" />
                  <span>Update password</span>
                </Link>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={async () => {
                    await logout();
                    window.location.href = "/account/login";
                  }}
                >
                  <Icon name="logout" />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <Link href="/app/home" className="brand">
          <Image src="/img/logo.png" alt="SeeSpec logo" width={36} height={36} className="brand-logo" />
          <span>SeeSpec</span>
        </Link>

        <div className="user-panel">
          <Image src="/img/user.png" alt="Current user" width={34} height={34} className="avatar-image" />
          <span>{session?.userName ? `.\\${session.userName}` : ".\\guest"}</span>
        </div>

        <nav className="side-nav">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`side-link ${isActive ? "active" : ""}`}>
                <Icon name={item.icon as IconName} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            className={`side-link side-toggle ${multiLevelOpen ? "active-parent" : ""}`}
            onClick={() => setMultiLevelOpen((value) => !value)}
          >
            <span className="dot-icon" />
            <span>Multi Level Menu</span>
            <Icon name="chevron" className={multiLevelOpen ? "rotated" : ""} />
          </button>

          {multiLevelOpen ? (
            <div className="submenu">
              {multiLevelLinks.map((section) => (
                <div key={section.label} className="submenu-group">
                  <div className="submenu-heading">{section.label}</div>
                  {section.links.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="submenu-link">
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </nav>
      </aside>

      <main className="content-area">
        <div className="content-wrapper">
          <div className="page-banner">{activeLabel}</div>
          {children}
        </div>
        <footer className="footer">
          <strong>
            Copyright &copy; {currentYear} <a href="#">SeeSpec</a>.
          </strong>
          <span>
            <b>Version</b> {versionText}
          </span>
        </footer>
      </main>

      <button
        type="button"
        className="sidebar-overlay"
        aria-label="Close sidebar"
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
}
