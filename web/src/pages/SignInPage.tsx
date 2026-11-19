import { useLocale } from "../i18n/LocaleProvider";
import { SIGN_IN_PATH } from "../session";

type Props = {
  /** True when the identity provider bounced the visitor back after a failure. */
  failed?: boolean;
};

/**
 * The sign-in screen (US3).
 *
 * Credentials are entered on the identity provider's own page, so this screen
 * hands the browser off to the API's sign-in entry point. A failed attempt
 * returns the visitor here with a single generic message that never names a
 * field (ADR-0002, SPEC D3).
 */
export function SignInPage({ failed = false }: Props) {
  const { t } = useLocale();

  return (
    <div className="sign-in" data-testid="sign-in">
      <div className="sign-in__panel">
        <h1 className="sign-in__title">{t("signInTitle")}</h1>
        <p className="sign-in__intro">{t("signInIntro")}</p>

        {failed ? (
          <p className="sign-in__error" role="alert" data-testid="sign-in-error">
            {t("signInFailed")}
          </p>
        ) : null}

        <a className="sign-in__action" href={SIGN_IN_PATH}>
          {t("signInAction")}
        </a>
      </div>
    </div>
  );
}
