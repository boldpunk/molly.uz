"use client";

import { PhoneInput as IntlPhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

const phoneInputStyle = {
  "--react-international-phone-height": "40px",
  "--react-international-phone-border-color": "rgba(24, 43, 76, 0.15)",
  "--react-international-phone-border-radius": "6px",
  "--react-international-phone-font-size": "14px",
  "--react-international-phone-text-color": "#182b4c",
  "--react-international-phone-background-color": "#fff",
  "--react-international-phone-flag-width": "22px",
  "--react-international-phone-flag-height": "16px",
} as React.CSSProperties;

export function PhoneInput({
  name,
  required,
  value,
  onChange,
  className = "",
  autoFocus,
}: {
  name?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const controlledProps =
    value !== undefined
      ? { value, onChange: (phone: string) => onChange?.(phone) }
      : {};

  return (
    <IntlPhoneInput
      defaultCountry="uz"
      hideDropdown
      forceDialCode
      name={name}
      required={required}
      autoFocus={autoFocus}
      placeholder="90 123 45 67"
      style={phoneInputStyle}
      className={`w-full ${className}`}
      inputClassName="w-full"
      {...controlledProps}
    />
  );
}
