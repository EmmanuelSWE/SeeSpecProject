"use client";

export function StateIllustration({
  kind,
  title,
  message,
  actions
}: {
  kind: "empty" | "not-found";
  title: string;
  message: string;
  actions?: React.ReactNode;
}) {
  const accent = kind === "empty" ? "#f97316" : "#60a5fa";

  return (
    <div className="state-illustration">
      <svg
        className="state-illustration-svg"
        viewBox="0 0 240 180"
        role="img"
        aria-hidden="true"
      >
        <rect x="40" y="34" width="160" height="112" rx="20" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
        {kind === "empty" ? (
          <>
            <rect x="74" y="66" width="92" height="58" rx="12" fill="none" stroke={accent} strokeWidth="6" strokeDasharray="10 8" />
            <path d="M120 58v18M120 114v18M88 92h18M134 92h18" stroke={accent} strokeWidth="6" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="120" cy="90" r="30" fill="none" stroke={accent} strokeWidth="6" />
            <path d="M108 78l24 24M132 78l-24 24" stroke={accent} strokeWidth="6" strokeLinecap="round" />
          </>
        )}
      </svg>
      <div className="state-illustration-copy">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {actions ? <div className="state-illustration-actions">{actions}</div> : null}
    </div>
  );
}
