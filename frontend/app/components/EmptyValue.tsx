import React from "react";

type EmptyValueProps = {
  value?: string | null;
  placeholder?: string;
  className?: string;
  placeholderClassName?: string;
};

export default function EmptyValue({
  value,
  placeholder = "None",
  className,
  placeholderClassName,
}: EmptyValueProps) {
  const hasValue = typeof value === "string" ? value.trim().length > 0 : Boolean(value);

  if (hasValue) {
    return <span className={className}>{value}</span>;
  }

  return <span className={placeholderClassName ?? "text-gray-500"}>{placeholder}</span>;
}
