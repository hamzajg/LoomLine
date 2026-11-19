import { useLocale } from "../i18n/LocaleProvider";

/**
 * US6: a directly requested route outside the session's grants renders this
 * state instead of the section's content. The server would refuse the data
 * anyway — this keeps the shell honest about what the user may see.
 */
export function AccessDeniedPage() {
  const { t } = useLocale();
  return (
    <section className="area-placeholder" data-testid="access-denied">
      <h2>{t("accessDeniedTitle")}</h2>
      <p>{t("accessDeniedDetail")}</p>
    </section>
  );
}
