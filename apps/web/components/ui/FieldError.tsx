import type { ReactNode } from "react";

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-rose-700">{children}</p>;
}
