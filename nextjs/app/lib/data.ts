export const versionText = "4.7.1";

export const languages = [
  { code: "en", label: "English", flag: "US" },
  { code: "fr", label: "Francais", flag: "FR" },
  { code: "it", label: "Italiano", flag: "IT" },
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "pt-br", label: "Portugues", flag: "BR" },
  { code: "tr", label: "Turkce", flag: "TR" },
  { code: "ru", label: "Russkiy", flag: "RU" },
  { code: "ar", label: "Arabic", flag: "SA" },
  { code: "zh-cn", label: "Chinese", flag: "CN" }
] as const;

export const sidebarItems = [
  { label: "About", href: "/app/about", icon: "info" },
  { label: "Home page", href: "/app/home", icon: "home" },
  { label: "Roles", href: "/app/roles", icon: "roles" },
  { label: "Tenants", href: "/app/tenants", icon: "building" },
  { label: "Users", href: "/app/users", icon: "users" }
] as const;

export const tenantAdminSidebarItems = [
  { label: "Dashboard", href: "/app/home", icon: "home" },
  { label: "Requirements", href: "/app/requirements", icon: "requirements" },
  { label: "Assignments", href: "/app/assignments", icon: "assignments" },
  { label: "Usecase Diagrams", href: "/app/usecase-diagrams", icon: "usecase" },
  { label: "Domain model", href: "/app/domain-model", icon: "domain" },
  { label: "Activity Diagram", href: "/app/activity-diagram", icon: "activity" },
  { label: "Tenants", href: "/app/tenants", icon: "building" },
  { label: "Users", href: "/app/users", icon: "users" },
  { label: "Settings", href: "/app/settings", icon: "settings" }
] as const;

export const multiLevelLinks = [
  {
    label: "ASP.NET Boilerplate",
    links: [
      { label: "Home", href: "https://aspnetboilerplate.com?ref=abptmpl" },
      { label: "Templates", href: "https://aspnetboilerplate.com/Templates?ref=abptmpl" },
      { label: "Samples", href: "https://aspnetboilerplate.com/Samples?ref=abptmpl" },
      { label: "Documents", href: "https://aspnetboilerplate.com/Pages/Documents?ref=abptmpl" }
    ]
  },
  {
    label: "ASP.NET Zero",
    links: [
      { label: "Home", href: "https://aspnetzero.com?ref=abptmpl" },
      { label: "Features", href: "https://aspnetzero.com/Features?ref=abptmpl" },
      { label: "Pricing", href: "https://aspnetzero.com/Pricing?ref=abptmpl#pricing" },
      { label: "Faq", href: "https://aspnetzero.com/Faq?ref=abptmpl" },
      { label: "Documents", href: "https://aspnetzero.com/Documents?ref=abptmpl" }
    ]
  }
] as const;

export const dashboardStats = [
  {
    title: "Stargazers",
    value: "8.2k+",
    tone: "green",
    link: "https://github.com/aspnetboilerplate/aspnetboilerplate/stargazers"
  },
  {
    title: "Contributors",
    value: "140+",
    tone: "teal",
    link: "https://github.com/aspnetboilerplate/aspnetboilerplate/graphs/contributors"
  },
  {
    title: "Used / Dependents",
    value: "1.6k+",
    tone: "gold",
    link: "https://github.com/aspnetboilerplate/aspnetboilerplate/network/dependents"
  },
  {
    title: "Forks",
    value: "3.1k+",
    tone: "blue",
    link: "https://github.com/aspnetboilerplate/aspnetboilerplate/network/members"
  }
] as const;

export const summaryStats = [
  { label: "Commits", value: "6,350+", tone: "blue" },
  { label: "Issues", value: "170+", tone: "gold" },
  { label: "Releases", value: "200+", tone: "teal" },
  { label: "Watching by", value: "810+", tone: "green" }
] as const;

export const openIssues = [
  {
    id: "5452",
    title: "Angular UI migration to AdminLTE 3",
    labels: ["module-zero-core-template", "feature"],
    date: "11 days ago",
    author: "iyilm4z",
    href: "https://github.com/aspnetboilerplate/aspnetboilerplate/issues/5452"
  },
  {
    id: "5391",
    title: "AbpCacheBase should lock the same object for sync and async",
    labels: ["bug", "pull request candidate"],
    date: "26 days ago",
    author: "acjh",
    href: "https://github.com/aspnetboilerplate/aspnetboilerplate/issues/5391"
  },
  {
    id: "5390",
    title: "AbpCache sliding/absolute expire time",
    labels: ["breaking-change", "enhancement"],
    date: "27 days ago",
    author: "ryancyq",
    href: "https://github.com/aspnetboilerplate/aspnetboilerplate/issues/5390"
  }
] as const;

export const closedPullRequests = [
  {
    id: "5430",
    title: "Added Dynamic-Parameter-System doc to documentation menu",
    milestone: "v5.6",
    date: "18 days ago",
    author: "maliming",
    href: "https://github.com/aspnetboilerplate/aspnetboilerplate/pull/5430"
  },
  {
    id: "5362",
    title: "Dynamic Parameter Module",
    milestone: "v5.4",
    date: "25 days ago",
    author: "demirmusa",
    href: "https://github.com/aspnetboilerplate/aspnetboilerplate/pull/5362"
  },
  {
    id: "4924",
    title: "ASP.NET Core 3.0 Upgrade",
    milestone: "v5.0",
    date: "Oct 15",
    author: "ismcagdas",
    href: "https://github.com/aspnetboilerplate/aspnetboilerplate/pull/4924"
  }
] as const;

export const users = [
  { id: 1, userName: "admin", fullName: "Default Admin", emailAddress: "admin@seespec.local", isActive: true },
  { id: 2, userName: "jsmith", fullName: "John Smith", emailAddress: "john.smith@seespec.local", isActive: true },
  { id: 3, userName: "mstone", fullName: "Mary Stone", emailAddress: "mary.stone@seespec.local", isActive: false },
  { id: 4, userName: "dlee", fullName: "Daniel Lee", emailAddress: "daniel.lee@seespec.local", isActive: true }
] as const;

export const roles = [
  { id: 1, name: "Admin", displayName: "Administrator" },
  { id: 2, name: "Manager", displayName: "Manager" },
  { id: 3, name: "Editor", displayName: "Editor" },
  { id: 4, name: "Viewer", displayName: "Viewer" }
] as const;

export const tenants = [
  { id: 1, tenancyName: "default", name: "Default", isActive: true },
  { id: 2, tenancyName: "acme", name: "Acme Corp", isActive: true },
  { id: 3, tenancyName: "northwind", name: "Northwind", isActive: false },
  { id: 4, tenancyName: "tailspin", name: "Tailspin Toys", isActive: true }
] as const;
