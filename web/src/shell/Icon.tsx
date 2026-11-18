import { type ReactNode } from "react";

/**
 * Small inline icon set for the shell chrome. Icons are decorative
 * (`aria-hidden`): the adjacent label carries the accessible name.
 */
export type IconName =
  | "menu"
  | "production"
  | "stock"
  | "commercial"
  | "quality"
  | "equipment"
  | "hr"
  | "access";

const ICONS: Record<IconName, ReactNode> = {
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  production: <path d="M3 20V9l6 4V9l6 4V9l6 4v7H3Z" />,
  stock: (
    <>
      <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
      <path d="M3 12l9 4.5 9-4.5" />
    </>
  ),
  commercial: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  quality: (
    <>
      <path d="M12 3l7 3v6c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  equipment: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </>
  ),
  hr: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 6.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 20a6 6 0 0 0-3-5.2" />
    </>
  ),
  access: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
    </>
  ),
};

export function Icon({
  name,
  className = "app-nav__section-icon",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}
