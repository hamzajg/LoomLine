import { LocaleProvider, useLocale } from "./i18n/LocaleProvider";
import { resolveRoute } from "./navigation";
import { AreaPlaceholder } from "./pages/AreaPlaceholder";
import { OrdersPage } from "./pages/OrdersPage";
import { useRoute } from "./router";
import { shellUser } from "./session";
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

export function App() {
  return (
    <LocaleProvider>
      <AppShell user={shellUser}>
        <CurrentScreen />
      </AppShell>
    </LocaleProvider>
  );
}
