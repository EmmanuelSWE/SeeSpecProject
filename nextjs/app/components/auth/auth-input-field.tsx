type AuthInputFieldProps = {
  id: string;
  label: string;
  type: "text" | "password";
  placeholder: string;
  value: string;
  icon: string;
  disabled?: boolean;
  autoComplete?: string;
  onChange: (value: string) => void;
};

export function AuthInputField({
  id,
  label,
  type,
  placeholder,
  value,
  icon,
  disabled,
  autoComplete,
  onChange
}: AuthInputFieldProps) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span className="auth-field-label">{label}</span>
      <span className="auth-field-control">
        <input
          id={id}
          type={type}
          className="auth-field-input"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          required
        />
        <span className="auth-field-icon" aria-hidden="true">
          {icon}
        </span>
      </span>
    </label>
  );
}
