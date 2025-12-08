"use client";

import { getPasswordStrength, getStrengthLabel, getStrengthColor } from "../utils/passwordStrength";

export default function PasswordStrengthBar({ password }: { password: string }) {
  const score = getPasswordStrength(password);
  const label = getStrengthLabel(score);
  const color = getStrengthColor(score);

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div
        style={{
          height: "8px",
          borderRadius: "4px",
          background: "#ddd",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(score / 5) * 100}%`,
            height: "100%",
            transition: "0.3s",
            background: color,
          }}
        ></div>
      </div>

      {password.length > 0 && (
        <small style={{ color, fontWeight: 600 }}>{label}</small>
      )}
    </div>
  );
}
