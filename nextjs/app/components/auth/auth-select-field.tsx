type AuthSelectOption = {
  value: string;
  label: string;
};

type AuthSelectFieldProps = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  options: AuthSelectOption[];
  onChange: (value: string) => void;
};

export function AuthSelectField({ id, label, value, disabled, options, onChange }: AuthSelectFieldProps) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span className="auth-field-label">{label}</span>
      <span className="auth-field-control">
        <select
          id={id}
          className="auth-field-input auth-field-select"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          required
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
