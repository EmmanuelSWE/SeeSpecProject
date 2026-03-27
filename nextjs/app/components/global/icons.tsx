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
    menu: "=",
    home: "H",
    info: "i",
    roles: "R",
    building: "B",
    users: "U",
    logout: ">",
    password: "P",
    search: "?",
    refresh: "o",
    plus: "+",
    edit: "E",
    delete: "x",
    lock: "L",
    star: "*",
    group: "G",
    tools: "T",
    code: "</>",
    commit: "C",
    issue: "!",
    tag: "#",
    eye: "O",
    chevron: ">"
  };

  return <span className={`icon ${className}`}>{icons[name]}</span>;
}
