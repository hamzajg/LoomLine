import { useLocale } from "../i18n/LocaleProvider";
import { LANGUAGE_NAMES, LOCALES, type Locale } from "../i18n/messages";
import { type ShellUser } from "../session";
import { Icon } from "./Icon";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  user: ShellUser;
  navOpen: boolean;
  onToggleNav: () => void;
};

export function AppHeader({ user, navOpen, onToggleNav }: Props) {
  const { t, locale, setLocale } = useLocale();

  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__control"
        aria-label={t("toggleNav")}
        aria-expanded={navOpen}
        aria-controls="app-sidebar"
        onClick={onToggleNav}
      >
        <Icon name="menu" className="app-header__control-icon" />
      </button>

      <div className="app-header__brand">
        {t("brand")}
        <span className="app-header__brand-tagline">{t("brandTagline")}</span>
      </div>

      <span className="app-header__spacer" />

      <select
        className="app-header__select"
        aria-label={t("language")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LANGUAGE_NAMES[code]}
          </option>
        ))}
      </select>

      <div className="app-header__user">
        <span className="app-header__avatar" aria-hidden="true">
          {initials(user.displayName)}
        </span>
        <span className="app-header__user-id">
          <span className="app-header__user-name">{user.displayName}</span>
          <span className="app-header__user-role">{user.role}</span>
        </span>
      </div>
    </header>
  );
}
