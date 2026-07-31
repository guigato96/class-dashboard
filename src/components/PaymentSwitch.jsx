import React from "react";

export default function PaymentSwitch({ checked, onChange, disabled, title }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      disabled={disabled}
      title={title}
      className="relative inline-flex items-center shrink-0 rounded-full transition-colors duration-300 ease-in-out disabled:opacity-50 active:scale-95"
      style={{ width: 34, height: 20, backgroundColor: checked ? "#22C55E" : "#3A3A3F", transitionProperty: "background-color, transform" }}
    >
      <span
        className="inline-block rounded-full bg-white transition-transform duration-300 ease-in-out"
        style={{ width: 16, height: 16, transform: checked ? "translateX(16px)" : "translateX(2px)", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
      />
    </button>
  );
}
