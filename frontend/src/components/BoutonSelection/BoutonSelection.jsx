

import styles from "./BoutonSelection.module.css";

export default function BoutonSelection({
  className,
  groupTitle,
  name,
  value,
  options,
  onChange,
}) {
  const handleKey = (optValue) => (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(optValue);
    }
  };

  return (
    <div className={className}>
      {groupTitle && (
        <span className={styles.groupTitle} style={{ textAlign: "center" }}>
          {groupTitle}
        </span>
      )}

      {options.map((opt) => (
        <label key={opt.value}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            className={styles.hiddenCheckbox}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span
            role="button"
            tabIndex={0}
            onKeyDown={handleKey(opt.value)}
            onClick={() => onChange(opt.value)}
            className={styles.pill}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}