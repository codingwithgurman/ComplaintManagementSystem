"use client";

export default function Field({ id, label, error, children, hint }) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <span className="error" style={{ display: "block" }}>{error}</span>}
    </div>
  );
}
