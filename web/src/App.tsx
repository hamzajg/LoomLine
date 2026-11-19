import { useEffect, useState } from "react";
import { fetchNavigation, type SectionGrant } from "./access";
import { LocaleProvider, useLocale } from "./i18n/LocaleProvider";
import { resolveRoute, routeAllowed, visibleSections } from "./navigation";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";
import { AreaPlaceholder } from "./pages/AreaPlaceholder";
import { OrdersPage } from "./pages/OrdersPage";
import { RolesPage } from "./pages/RolesPage";
import { SignInPage } from "./pages/SignInPage";
import { UsersPage } from "./pages/UsersPage";
import { useRoute } from "./router";
import { fetchSession, type ShellUser } from "./session";
import { AppShell } from "./shell/AppShell";

/** Resolves the current route to a screen, honouring the session's grants. */
function CurrentScreen({ grants }: { grants: SectionGrant[] }) {
  const { path } = useRoute();
  const { t } = useLocale();
  const route = resolveRoute(path);

  // US6: a directly requested route outside the grants shows access-denied,
  // never the section's content.
  if (!routeAllowed(route, grants)) return <AccessDeniedPage />;

  if (route.item?.id === "orders") return <OrdersPage />;
  if (route.item?.id === "users") return <UsersPage />;
  if (route.item?.id === "roles") return <RolesPage />;
  if (route.item) {
    return (
      <AreaPlaceholder
        title={t(route.item.labelKey)}
        detail={t("notAvailableDetail")}
      />
    );
  }
  return (
    <AreaPlaceholder title={t("notAvailable")} detail={t("notAvailableDetail")} />
  );
}

type SessionState =
  | { status: "loading" }
  | { status: "signed-out"; failed: boolean }
  | { status: "signed-in"; user: ShellUser; grants: SectionGrant[] };

/** The identity provider returns a failed sign-in to the app with an error flag. */
function signInFailed(search: string): boolean {
  return new URLSearchParams(search).has("error");
}

function SessionCheck() {
  const { t } = useLocale();
  return (
    <div className="splash" data-testid="session-check">
      <p>{t("checkingSession")}</p>
    </div>
  );
}

/**
 * The application root. Ask the API who we are and what they may see: with a
 * session the shell renders only the granted sections, and a requested route
 * outside the grants gets the access-denied state (US5/US6).
 */
export function App() {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    Promise.all([fetchSession(), fetchNavigation()])
      .then(([user, grants]) => {
        if (!active) return;
        setState(
          user
            ? { status: "signed-in", user, grants }
            : { status: "signed-out", failed: signInFailed(window.location.search) },
        );
      })
      .catch(() => {
        if (!active) return;
        setState({ status: "signed-out", failed: signInFailed(window.location.search) });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <LocaleProvider>
      {state.status === "loading" ? <SessionCheck /> : null}
      {state.status === "signed-out" ? <SignInPage failed={state.failed} /> : null}
      {state.status === "signed-in" ? (
        <AppShell user={state.user} sections={visibleSections(state.grants)}>
          <CurrentScreen grants={state.grants} />
        </AppShell>
      ) : null}
    </LocaleProvider>
  );
}
