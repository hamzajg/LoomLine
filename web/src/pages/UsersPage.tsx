import { useEffect, useState, type FormEvent } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import {
  createUser,
  listRoles,
  listUsers,
  type ManagedUser,
} from "../adminApi";

/**
 * US7: the administrator creates a user and assigns a realm role. The API
 * delegates the actual provisioning to Keycloak; this page only collects the
 * form and shows the result.
 */
export function UsersPage() {
  const { t } = useLocale();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    listUsers()
      .then(setUsers)
      .catch(() => setFailed(true));
  }

  useEffect(() => {
    reload();
    listRoles()
      .then((list) => {
        const ids = list.map((r) => r.id);
        setRoles(ids);
        setRole((current) => current || ids[0] || "");
      })
      .catch(() => setFailed(true));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createUser({
        username: username.trim(),
        email: email.trim() || undefined,
        password,
        role,
      });
      setNotice(`${t("userCreated")} (${username.trim()})`);
      setUsername("");
      setEmail("");
      setPassword("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("createFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="orders-page">
      <div className="orders-page__header">
        <h2>{t("usersTitle")}</h2>
      </div>

      <form className="user-form" onSubmit={onSubmit} data-testid="user-form">
        <div className="filter-group">
          <label htmlFor="new-username">{t("username")}</label>
          <input
            id="new-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="filter-group">
          <label htmlFor="new-email">{t("email")}</label>
          <input
            id="new-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="new-password">{t("password")}</label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="filter-group">
          <label htmlFor="new-role">{t("role")}</label>
          <select
            id="new-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {t(`role.${r}`)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? t("creating") : t("createUser")}
        </button>
      </form>

      {notice ? <p className="notice" data-testid="user-created">{notice}</p> : null}
      {error ? <p className="error" data-testid="user-error">{error}</p> : null}

      {failed ? <p className="empty-state">{t("loadFailed")}</p> : null}
      {users === null && !failed ? (
        <p className="loading">{t("loading")}</p>
      ) : null}
      {users !== null ? (
        <table className="orders-table" data-testid="users-table">
          <thead>
            <tr>
              <th>{t("username")}</th>
              <th>{t("email")}</th>
              <th>{t("role")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-mono font-bold">{user.username}</td>
                <td>{user.email ?? "—"}</td>
                <td>{user.roles.map((r) => t(`role.${r}`)).join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
