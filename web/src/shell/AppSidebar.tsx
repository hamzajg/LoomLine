import { useEffect, useState, type Ref } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { type NavSection, resolveRoute } from "../navigation";
import { Link } from "../router";
import { Icon } from "./Icon";

type Props = {
  sections: NavSection[];
  currentPath: string;
  navOpen: boolean;
  onNavigate?: () => void;
  /** Ref to the aside, so the shell can move focus into the drawer. */
  sidebarRef?: Ref<HTMLElement>;
  /**
   * True when the drawer blocks the page (narrow viewport): Tab stays inside
   * until the drawer is dismissed. A static sidebar does not trap focus.
   */
  trapFocus?: boolean;
};

export function AppSidebar({
  sections,
  currentPath,
  navOpen,
  onNavigate,
  sidebarRef,
  trapFocus = false,
}: Props) {
  const { t } = useLocale();
  const active = resolveRoute(currentPath, sections);
  // Routes without a sidebar entry keep their closest list section current.
  const activeId = active.item?.id === "order-new" ? "orders" : active.item?.id;
  const [expanded, setExpanded] = useState<string[]>(() =>
    active.section ? [active.section.id] : [],
  );

  // Keep the section that holds the current screen open.
  useEffect(() => {
    const id = active.section?.id;
    if (!id) return;
    setExpanded((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }, [active.section]);

  function toggleSection(id: string) {
    setExpanded((current) =>
      current.includes(id)
        ? current.filter((sectionId) => sectionId !== id)
        : [...current, id],
    );
  }

  return (
    <aside
      ref={sidebarRef}
      id="app-sidebar"
      className="app-sidebar"
      data-testid="app-sidebar"
      hidden={!navOpen}
      onKeyDown={(event) => {
        if (!trapFocus || event.key !== "Tab") return;
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled])',
          ),
        );
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        const active = document.activeElement;
        if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <nav className="app-nav" aria-label={t("navHeading")}>
        <h2 className="app-nav__heading">{t("navHeading")}</h2>
        <ul className="app-nav__sections">
          {sections.map((section) => {
            const isOpen = expanded.includes(section.id);
            const itemsId = `nav-section-${section.id}`;
            return (
              <li key={section.id} className="app-nav__section">
                <button
                  type="button"
                  className="app-nav__section-toggle"
                  aria-expanded={isOpen}
                  aria-controls={itemsId}
                  onClick={() => toggleSection(section.id)}
                >
                  <Icon name={section.icon} />
                  <span className="app-nav__section-label">
                    {t(section.labelKey)}
                  </span>
                  <svg
                    className="app-nav__chevron"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <ul className="app-nav__items" id={itemsId} hidden={!isOpen}>
                  {section.items.filter((item) => !item.hidden).map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <li key={item.id}>
                        <Link
                          to={item.path}
                          className={
                            isActive
                              ? "app-nav__item app-nav__item--active"
                              : "app-nav__item"
                          }
                          aria-current={isActive ? "page" : undefined}
                          onClick={onNavigate}
                        >
                          {t(item.labelKey)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
