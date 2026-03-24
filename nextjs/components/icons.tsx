export type IconName =
  | "menu"
  | "home"
  | "info"
  | "roles"
  | "building"
  | "users"
  | "logout"
  | "password"
  | "search"
  | "refresh"
  | "plus"
  | "edit"
  | "delete"
  | "lock"
  | "star"
  | "group"
  | "tools"
  | "code"
  | "commit"
  | "issue"
  | "tag"
  | "eye"
  | "chevron";

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const icons: Record<IconName, string> = {
    menu: "≡",
    home: "⌂",
    info: "i",
    roles: "◍",
    building: "▦",
    users: "◔",
    logout: "↗",
    password: "✎",
    search: "⌕",
    refresh: "↻",
    plus: "+",
    edit: "✎",
    delete: "x",
    lock: "o",
    star: "*",
    group: "oo",
    tools: "T",
    code: "</>",
    commit: "+",
    issue: "!",
    tag: "#",
    eye: "o",
    chevron: ">"
  };

  return <span className={`icon ${className}`}>{icons[name]}</span>;
}
