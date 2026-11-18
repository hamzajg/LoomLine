import { useLocale } from "../i18n/LocaleProvider";
import { type Breadcrumb } from "../navigation";

export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  const { t } = useLocale();

  return (
    <nav className="app-breadcrumbs" aria-label={t("breadcrumb")}>
      <ol className="app-breadcrumbs__list">
        {items.map((crumb) => (
          <li
            key={crumb.labelKey}
            className={
              crumb.current
                ? "app-breadcrumbs__item app-breadcrumbs__current"
                : "app-breadcrumbs__item"
            }
          >
            {crumb.current ? (
              <span aria-current="page">{t(crumb.labelKey)}</span>
            ) : (
              t(crumb.labelKey)
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
