import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { listRoles } from "../adminApi";

/** The assignable realm roles, read from the API (US7). */
export function RolesPage() {
  const { t } = useLocale();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listRoles()
      .then((list) => setRoles(list.map((r) => r.id)))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="orders-page">
      <div className="orders-page__header">
        <h2>{t("rolesTitle")}</h2>
      </div>
      {failed ? <p className="empty-state">{t("loadFailed")}</p> : null}
      {roles === null && !failed ? <p className="loading">{t("loading")}</p> : null}
      {roles !== null ? (
        <ul className="roles-list" data-testid="roles-list">
          {roles.map((role) => (
            <li key={role} className="roles-list__item">
              {t(`role.${role}`)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
