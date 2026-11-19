import { useEffect, useState } from "react";
import { LocaleProvider, useLocale } from "./i18n/LocaleProvider";
import { resolveRoute } from "./navigation";
import { AreaPlaceholder } from "./pages/AreaPlaceholder";
import { OrdersPage } from "./pages/OrdersPage";
import { SignInPage } from "./pages/SignInPage";
import { useRoute } from "./router";
import { fetchSession, type ShellUser } from "./session";
import { AppShell } from "./shell/AppShell";

/** Resolves the current route to a screen. Only the orders area is built yet. */
function CurrentScreen() {
  const { path } = useRoute();
  const { t } = useLocale();
  const route = resolveRoute(path);

  if (route.item?.id === "orders") return <OrdersPage />;
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
  | { status: "signed-in"; user: ShellUser };

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
 * The application root. Ask the API who we are: with a session the shell is
 * shown, without one the visitor is sent to sign-in and the requested route is
 * not rendered (US3/US4).
 */
export function App() {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetchSession()
      .then((user) => {
        if (!active) return;
        setState(
          user
            ? { status: "signed-in", user }
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
        <AppShell user={state.user}>
          <CurrentScreen />
        </AppShell>
      ) : null}
    </LocaleProvider>
  );
}
