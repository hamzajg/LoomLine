import { type SectionGrant } from "./access";
import { type IconName } from "./shell/Icon";

/**
 * The product's section taxonomy — the modern shape of the legacy navigation
 * (Accès, GRH, Production, Gestion Commerciale, Qualité, Stock, Gestion
 * Matériel, Planning). Each item's `labelKey` is resolved through the i18n
 * layer, so the taxonomy is language-independent.
 */
export type NavItem = {
  id: string;
  labelKey: string;
  path: string;
};

export type NavSection = {
  id: string;
  labelKey: string;
  icon: IconName;
  items: NavItem[];
};

export const DEFAULT_PATH = "/production/orders";

export const SECTIONS: NavSection[] = [
  {
    id: "production",
    labelKey: "section.production",
    icon: "production",
    items: [
      { id: "orders", labelKey: "item.orders", path: "/production/orders" },
      { id: "articles", labelKey: "item.articles", path: "/production/articles" },
      { id: "models", labelKey: "item.models", path: "/production/models" },
      { id: "routings", labelKey: "item.routings", path: "/production/routings" },
    ],
  },
  {
    id: "stock",
    labelKey: "section.stock",
    icon: "stock",
    items: [
      { id: "materials", labelKey: "item.materials", path: "/stock/materials" },
      { id: "movements", labelKey: "item.movements", path: "/stock/movements" },
      { id: "stockLevels", labelKey: "item.stockLevels", path: "/stock/levels" },
    ],
  },
  {
    id: "commercial",
    labelKey: "section.commercial",
    icon: "commercial",
    items: [
      { id: "clients", labelKey: "item.clients", path: "/commercial/clients" },
      {
        id: "subcontractors",
        labelKey: "item.subcontractors",
        path: "/commercial/subcontractors",
      },
    ],
  },
  {
    id: "quality",
    labelKey: "section.quality",
    icon: "quality",
    items: [
      { id: "controls", labelKey: "item.controls", path: "/quality/controls" },
      { id: "defects", labelKey: "item.defects", path: "/quality/defects" },
    ],
  },
  {
    id: "equipment",
    labelKey: "section.equipment",
    icon: "equipment",
    items: [
      { id: "machines", labelKey: "item.machines", path: "/equipment/machines" },
      { id: "repairs", labelKey: "item.repairs", path: "/equipment/repairs" },
      {
        id: "spareParts",
        labelKey: "item.spareParts",
        path: "/equipment/spare-parts",
      },
    ],
  },
  {
    id: "hr",
    labelKey: "section.hr",
    icon: "hr",
    items: [
      { id: "staff", labelKey: "item.staff", path: "/hr/staff" },
      { id: "absences", labelKey: "item.absences", path: "/hr/absences" },
    ],
  },
  {
    id: "access",
    labelKey: "section.access",
    icon: "access",
    items: [
      { id: "users", labelKey: "item.users", path: "/access/users" },
      { id: "roles", labelKey: "item.roles", path: "/access/roles" },
    ],
  },
];

export type ResolvedRoute = {
  path: string;
  section: NavSection | null;
  item: NavItem | null;
};

function normalise(path: string): string {
  if (!path || path === "/") return DEFAULT_PATH;
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function resolveRoute(path: string, sections: NavSection[] = SECTIONS): ResolvedRoute {
  const target = normalise(path);
  for (const section of sections) {
    for (const item of section.items) {
      if (item.path === target) return { path: target, section, item };
    }
  }
  return { path: target, section: null, item: null };
}

/**
 * The taxonomy projected through the session's grants: only sections the
 * server says the user may view appear in the shell (US5). The client never
 * decides access itself — it renders the server's projection.
 */
export function visibleSections(grants: SectionGrant[]): NavSection[] {
  const viewable = new Set(grants.filter((g) => g.view).map((g) => g.id));
  return SECTIONS.filter((section) => viewable.has(section.id));
}

/** True when the route's section is inside the granted projection. */
export function routeAllowed(route: ResolvedRoute, grants: SectionGrant[]): boolean {
  if (!route.section) return true; // unknown paths keep the not-available state
  return grants.some((g) => g.id === route.section!.id && g.view);
}

export type Breadcrumb = { labelKey: string; current?: boolean };

export function breadcrumbsFor(route: ResolvedRoute): Breadcrumb[] {
  if (route.section && route.item) {
    return [
      { labelKey: route.section.labelKey },
      { labelKey: route.item.labelKey, current: true },
    ];
  }
  return [{ labelKey: "home", current: true }];
}
