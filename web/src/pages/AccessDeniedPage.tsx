import { useLocale } from "../i18n/LocaleProvider";
import { type ResolvedRoute } from "../navigation";
import { Breadcrumbs } from "../shell/Breadcrumbs";

/**
 * US6: a directly requested route outside the session's grants renders this
 * state instead of the section's content. The server would refuse the data
 * anyway — this keeps the shell honest about what the user may see.
 */
type Props = {
  deniedRoute?: ResolvedRoute;
};

export function AccessDeniedPage({ deniedRoute }: Props) {
  const { t } = useLocale();

  // Build breadcrumbs for the denied section so the user knows where they were denied
  const breadcrumbItems = deniedRoute?.section
    ? [
        { labelKey: deniedRoute.section.labelKey },
        { labelKey: deniedRoute.item?.labelKey ?? deniedRoute.section.labelKey, current: true },
      ]
    : [{ labelKey: "home", current: true }];

  return (
    <section className="area-placeholder" data-testid="access-denied">
      <Breadcrumbs items={breadcrumbItems} />
      <h2>{t("accessDeniedTitle")}</h2>
      <p>{t("accessDeniedDetail")}</p>
    </section>
  );
}
