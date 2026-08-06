"use client";

import React, { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, value, onChange, disabled = false }: OTPInputProps) {
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFocus = (index: number) => {
    setActiveInput(index);
    // Select text on focus for easier typing replacement
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.select();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return; // Only allow numbers

    const valArray = value.split("");
    valArray[index] = val.substring(val.length - 1); // Get last typed char
    const newValue = valArray.join("").padEnd(length, " ").substring(0, length);
    
    onChange(newValue.trim());

    // Auto focus next
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const valArray = value.split("");
      valArray[index] = "";
      onChange(valArray.join("").trim());

      // Focus previous if current is empty
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/[^0-9]/g, "").slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // Convert value to array of characters, padding with empty strings
  const otpArray = Array.from({ length }, (_, i) => value[i] || "");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
      {otpArray.map((char, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={char}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onFocus={() => handleFocus(i)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: 44,
            height: 52,
            fontSize: "var(--text-lg)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            textAlign: "center",
            background: "var(--color-bg-input)",
            border: `1px solid ${activeInput === i ? "var(--color-accent)" : "var(--color-border)"}`,
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-primary)",
            outline: "none",
            boxShadow: activeInput === i ? "0 0 0 2px var(--color-accent-muted)" : "none",
            transition: "all var(--duration-fast)",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
      ))}
    </div>
  );
}
