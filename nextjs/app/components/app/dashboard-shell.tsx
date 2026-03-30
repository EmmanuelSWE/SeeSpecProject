"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/app/components/global/icons";
import { APP_PERMISSIONS, hasPermission, isTenantAdminSession } from "@/app/lib/auth/permissions";
import { languages, sidebarItems, tenantAdminSidebarItems, versionText } from "@/app/lib/data";
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
  const currentYear = new Date().getFullYear();
  const currentLanguage = languages[0];
  const isHostContext = session?.tenantId == null;
  const isTenantAdmin = isTenantAdminSession(session);
  const tenantSidebarPermissionMap: Record<string, string | null> = {
    "/app/home": APP_PERMISSIONS.dashboard,
    "/app/requirements": APP_PERMISSIONS.requirements,
    "/app/assignments": APP_PERMISSIONS.assignments,
    "/app/usecase-diagrams": APP_PERMISSIONS.usecaseDiagrams,
    "/app/domain-model": APP_PERMISSIONS.domainModel,
    "/app/activity-diagram": APP_PERMISSIONS.activityDiagram,
    "/app/tenants": APP_PERMISSIONS.tenants,
    "/app/users": APP_PERMISSIONS.users,
    "/app/settings": APP_PERMISSIONS.settings
  };
  const visibleSidebarItems = useMemo(() => {
    if (isHostContext) {
      return sidebarItems
        .filter((item) => item.href === "/app/home" || item.href === "/app/users" || item.href === "/app/tenants")
        .map((item) => (item.href === "/app/home" ? { ...item, label: "Profile" } : item));
    }

    if (isTenantAdmin) {
      return tenantAdminSidebarItems;
    }

    return tenantAdminSidebarItems.filter((item) => {
      const permission = tenantSidebarPermissionMap[item.href];
      return permission ? hasPermission(session, permission) : false;
    });
  }, [isHostContext, isTenantAdmin, session, tenantSidebarPermissionMap]);
  const activeLabel = useMemo(
    () => visibleSidebarItems.find((item) => pathname === item.href)?.label ?? (isHostContext ? "Profile" : "Workspace"),
    [isHostContext, pathname, visibleSidebarItems]
  );

  return (
    <div className={`shell ${isHostContext ? "host-shell" : "tenant-shell"} ${sidebarOpen ? "sidebar-open" : ""}`}>
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
            {isHostContext ? "Profile" : "Workspace"}
          </Link>
          {isHostContext ? (
            <>
              <Link href="/app/users" className="top-link">
                Users
              </Link>
              <Link href="/app/tenants" className="top-link">
                Tenants
              </Link>
            </>
          ) : isTenantAdmin ? (
            <>
              <Link href="/app/requirements" className="top-link">
                Requirements
              </Link>
              <Link href="/app/assignments" className="top-link">
                Assignments
              </Link>
              <Link href="/app/settings" className="top-link">
                Settings
              </Link>
            </>
          ) : visibleSidebarItems.length > 1 ? (
            <>
              {visibleSidebarItems
                .filter((item) => item.href !== "/app/home")
                .slice(0, 3)
                .map((item) => (
                  <Link key={item.href} href={item.href} className="top-link">
                    {item.label}
                  </Link>
                ))}
            </>
          ) : null}
        </div>
        <div className="topbar-right">
          {!isHostContext ? (
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
          ) : null}
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
          {visibleSidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`side-link ${isActive ? "active" : ""}`}>
                <Icon name={item.icon as IconName} />
                <span>{item.label}</span>
              </Link>
            );
          })}

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
