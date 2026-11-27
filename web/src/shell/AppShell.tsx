import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { breadcrumbsFor, resolveRoute, type NavSection } from "../navigation";
import { useRoute } from "../router";
import { type ShellUser } from "../session";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumbs } from "./Breadcrumbs";

const NARROW_QUERY = "(max-width: 60rem)";

function subscribeViewport(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function narrowSnapshot() {
  return window.matchMedia(NARROW_QUERY).matches;
}

/** True when the viewport is phone/tablet-sized (the sidebar becomes a drawer). */
function useIsNarrow() {
  return useSyncExternalStore(subscribeViewport, narrowSnapshot);
}

type Props = {
  user: ShellUser;
  /** The role-filtered projection of the taxonomy (US5). */
  sections: NavSection[];
  children: ReactNode;
};

/**
 * The persistent application frame: header, collapsible sidebar, breadcrumbs,
 * and the content area. On narrow viewports the sidebar is a header-toggled
 * drawer over the content.
 */
export function AppShell({ user, sections, children }: Props) {
  const { t } = useLocale();
  const { path } = useRoute();
  const narrow = useIsNarrow();
  const [navOpen, setNavOpen] = useState(!narrow);
  const navToggleRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  // Set only for an explicit dismissal (Escape, scrim, toggle), never for the
  // automatic close when the viewport widens or after following a link.
  const restoreFocusOnClose = useRef(false);

  // Wide viewports start open; narrow ones start closed. Re-apply on resize.
  useEffect(() => {
    setNavOpen(!narrow);
  }, [narrow]);

  /** Close after navigating: the new screen's heading takes focus. */
  const closeNav = useCallback(() => {
    restoreFocusOnClose.current = false;
    setNavOpen(false);
  }, []);

  /** Close the blocking drawer and hand focus back to its toggle. */
  const dismissNav = useCallback(() => {
    restoreFocusOnClose.current = true;
    setNavOpen(false);
  }, []);

  const toggleNav = useCallback(() => setNavOpen((open) => !open), []);

  // Opening the blocking drawer moves focus into it; dismissing it returns
  // focus to the control that opened it (frontend page guide, drawer rules).
  useEffect(() => {
    if (narrow && navOpen) {
      drawerRef.current
        ?.querySelector<HTMLElement>("a[href], button:not([disabled])")
        ?.focus();
      return;
    }
    if (!navOpen && restoreFocusOnClose.current) {
      restoreFocusOnClose.current = false;
      navToggleRef.current?.focus();
    }
  }, [navOpen, narrow]);

  const route = resolveRoute(path, sections);

  useEffect(() => {
    const screen = route.item ? t(route.item.labelKey) : t("home");
    document.title = `${screen} · ${t("brand")}`;
  }, [route.item, t]);

  // Each routed screen is a new surface: move focus to its heading so a
  // keyboard or screen-reader user starts at the top of the page.
  const mainRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const heading = mainRef.current?.querySelector<HTMLElement>("h1, h2");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }, [path]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!narrow || !navOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismissNav();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [narrow, navOpen, dismissNav]);

  return (
    <div className="app-shell" data-testid="app-shell">
      <AppHeader
        user={user}
        navOpen={navOpen}
        onToggleNav={toggleNav}
        toggleRef={navToggleRef}
      />

      <div className="app-shell__body">
        <AppSidebar
          sections={sections}
          currentPath={path}
          navOpen={navOpen}
          onNavigate={narrow ? closeNav : undefined}
          sidebarRef={drawerRef}
          trapFocus={narrow && navOpen}
        />

        <div className="app-main">
          <Breadcrumbs items={breadcrumbsFor(route)} />
          <main className="app-content" id="main-content" ref={mainRef}>
            {children}
          </main>
        </div>
      </div>

      {narrow && navOpen ? (
        <button
          type="button"
          className="app-overlay"
          aria-label={t("closeNav")}
          onClick={dismissNav}
        />
      ) : null}
    </div>
  );
}
