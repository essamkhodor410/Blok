import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function Collapsible({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ui-group">
      <button className="ui-group-head" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && <div className="ui-group-body">{children}</div>}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="ui-field">
      {label && <span className="ui-label">{label}</span>}
      {children}
    </label>
  );
}

export function Num({ label, value, onChange, placeholder, step = 1, min }) {
  return (
    <Field label={label}>
      <input
        className="ui-input" type="number" step={step} min={min}
        value={value ?? ""} placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </Field>
  );
}

export function Txt({ label, value, onChange, placeholder }) {
  return (
    <Field label={label}>
      <input className="ui-input" value={value ?? ""} placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Area({ label, value, onChange, placeholder }) {
  return (
    <Field label={label}>
      <textarea className="ui-input ui-area" value={value ?? ""} placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Sel({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select className="ui-input ui-select" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) =>
          Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>
        )}
      </select>
    </Field>
  );
}

export function Color({ label, value, onChange }) {
  const hex = /^#([0-9a-f]{6})$/i.test(value || "") ? value : "#ffffff";
  return (
    <Field label={label}>
      <div className="ui-colorrow">
        <span className="ui-swatch" style={{ background: value || "transparent" }}>
          <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} />
        </span>
        <input className="ui-input" value={value ?? ""} placeholder="transparent"
          onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

// segmented control: options = [[value, node|label], ...]
export function Seg({ label, value, onChange, options, cols }) {
  return (
    <Field label={label}>
      <div className="ui-seg" style={cols ? { gridTemplateColumns: `repeat(${cols},1fr)`, display: "grid" } : undefined}>
        {options.map(([val, content]) => (
          <button key={val} type="button" className={value === val ? "on" : ""} title={String(val)}
            onClick={() => onChange(val)}>{content}</button>
        ))}
      </div>
    </Field>
  );
}
