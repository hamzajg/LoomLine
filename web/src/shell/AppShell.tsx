import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { breadcrumbsFor, resolveRoute, SECTIONS } from "../navigation";
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
  children: ReactNode;
};

/**
 * The persistent application frame: header, collapsible sidebar, breadcrumbs,
 * and the content area. On narrow viewports the sidebar is a header-toggled
 * drawer over the content.
 */
export function AppShell({ user, children }: Props) {
  const { t } = useLocale();
  const { path } = useRoute();
  const narrow = useIsNarrow();
  const [navOpen, setNavOpen] = useState(!narrow);

  // Wide viewports start open; narrow ones start closed. Re-apply on resize.
  useEffect(() => {
    setNavOpen(!narrow);
  }, [narrow]);

  const closeNav = useCallback(() => setNavOpen(false), []);
  const toggleNav = useCallback(() => setNavOpen((open) => !open), []);

  const route = resolveRoute(path);

  useEffect(() => {
    const screen = route.item ? t(route.item.labelKey) : t("home");
    document.title = `${screen} · ${t("brand")}`;
  }, [route.item, t]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!narrow || !navOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [narrow, navOpen]);

  return (
    <div className="app-shell" data-testid="app-shell">
      <AppHeader user={user} navOpen={navOpen} onToggleNav={toggleNav} />

      <div className="app-shell__body">
        <AppSidebar
          sections={SECTIONS}
          currentPath={path}
          navOpen={navOpen}
          onNavigate={narrow ? closeNav : undefined}
        />

        <div className="app-main">
          <Breadcrumbs items={breadcrumbsFor(route)} />
          <main className="app-content" id="main-content">
            {children}
          </main>
        </div>
      </div>

      {narrow && navOpen ? (
        <button
          type="button"
          className="app-overlay"
          aria-label={t("closeNav")}
          onClick={closeNav}
        />
      ) : null}
    </div>
  );
}
