import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  useSyncExternalStore,
} from "react";

/**
 * Minimal history-API router.
 *
 * The product has no routing dependency (see SPEC D1) and the shell only needs
 * one thing: know the current path and be able to change it. The web server
 * already rewrites unknown paths to `index.html` (nginx `try_files`, Vite
 * fallback), so plain paths work for deep links.
 */

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getPathname() {
  return window.location.pathname;
}

/** Push a new history entry and notify subscribers (same-tab pushState is silent). */
export function navigate(to: string) {
  if (to === window.location.pathname) return;
  window.history.pushState(null, "", to);
  window.dispatchEvent(new Event("popstate"));
}

export function useRoute(): { path: string } {
  return { path: useSyncExternalStore(subscribe, getPathname) };
}

type LinkProps = { to: string } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>;

/** An anchor that navigates client-side but behaves like a normal link. */
export function Link({ to, onClick, ...rest }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
  }

  return <a {...rest} href={to} onClick={handleClick} />;
}
