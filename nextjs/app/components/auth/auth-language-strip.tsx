import { languages } from "@/app/lib/data";

function Flag({ code }: { code: string }) {
  return <span className="flag">{code}</span>;
}

export function AuthLanguageStrip() {
  return (
    <div className="auth-language-strip" aria-label="Available languages">
      {languages.map((language) => (
        <span key={language.code} className="language-chip" title={language.label}>
          <Flag code={language.flag} />
        </span>
      ))}
    </div>
  );
}
