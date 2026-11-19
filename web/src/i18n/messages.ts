/**
 * Shell copy for the locales the product ships. English is the default and the
 * fallback; French is the factory's working language (as in the legacy system).
 * Right-to-left locales are structurally supported by the shell layout
 * (logical properties + the `dir` attribute) but not populated yet.
 */
export type Locale = "en" | "fr";

export const LOCALES: Locale[] = ["en", "fr"];

/** Language names in their own language, for the language switcher. */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

const en: Record<string, string> = {
  brand: "LoomLine",
  brandTagline: "Production operations",
  navHeading: "Sections",
  breadcrumb: "Breadcrumb",
  toggleNav: "Toggle navigation",
  openNav: "Open navigation",
  closeNav: "Close navigation",
  collapseNav: "Collapse navigation",
  expandNav: "Expand navigation",
  language: "Language",
  langName: "English",
  signedInAs: "Signed in as",
  signOut: "Sign out",
  checkingSession: "Checking your session…",
  signInTitle: "Sign in",
  signInIntro: "Sign in with your LoomLine account to continue.",
  signInAction: "Continue to sign-in",
  signInFailed: "We couldn't sign you in. Please check your details and try again.",
  home: "Home",
  notAvailable: "Not available yet",
  notAvailableDetail:
    "This area is part of the migration and has not been built yet.",

  "section.production": "Production",
  "section.stock": "Stock",
  "section.commercial": "Commercial",
  "section.quality": "Quality",
  "section.equipment": "Equipment",
  "section.hr": "Workforce",
  "section.access": "Access",

  "item.orders": "Orders",
  "item.articles": "Articles",
  "item.models": "Models",
  "item.routings": "Routings",
  "item.materials": "Materials",
  "item.movements": "Stock movements",
  "item.stockLevels": "Stock levels",
  "item.clients": "Clients",
  "item.subcontractors": "Subcontractors",
  "item.controls": "Controls",
  "item.defects": "Defects",
  "item.machines": "Machines",
  "item.repairs": "Repairs",
  "item.spareParts": "Spare parts",
  "item.staff": "Staff",
  "item.absences": "Absences",
  "item.users": "Users",
  "item.roles": "Roles",

  accessDeniedTitle: "Access denied",
  accessDeniedDetail:
    "Your role does not include this section. Ask an administrator if you need access.",
  usersTitle: "Users",
  rolesTitle: "Roles",
  username: "Username",
  email: "Email",
  password: "Password",
  role: "Role",
  createUser: "Create user",
  creating: "Creating…",
  userCreated: "User created",
  createFailed: "The user could not be created.",
  loadFailed: "The data could not be loaded.",
  loading: "Loading…",
  "role.administrator": "Administrator",
  "role.production-planner": "Production planner",
  "role.production-supervisor": "Production supervisor",
};

const fr: Record<string, string> = {
  brand: "LoomLine",
  brandTagline: "Opérations de production",
  navHeading: "Sections",
  breadcrumb: "Fil d'Ariane",
  toggleNav: "Afficher ou masquer la navigation",
  openNav: "Ouvrir la navigation",
  closeNav: "Fermer la navigation",
  collapseNav: "Réduire la navigation",
  expandNav: "Développer la navigation",
  language: "Langue",
  langName: "Français",
  signedInAs: "Connecté en tant que",
  signOut: "Se déconnecter",
  checkingSession: "Vérification de votre session…",
  signInTitle: "Connexion",
  signInIntro: "Connectez-vous avec votre compte LoomLine pour continuer.",
  signInAction: "Continuer vers la connexion",
  signInFailed: "Connexion impossible. Vérifiez vos informations et réessayez.",
  home: "Accueil",
  notAvailable: "Pas encore disponible",
  notAvailableDetail:
    "Cette zone fait partie de la migration et n'a pas encore été développée.",

  "section.production": "Production",
  "section.stock": "Stock",
  "section.commercial": "Commercial",
  "section.quality": "Qualité",
  "section.equipment": "Matériel",
  "section.hr": "Personnel",
  "section.access": "Accès",

  "item.orders": "Ordres de fabrication",
  "item.articles": "Articles",
  "item.models": "Modèles",
  "item.routings": "Gammes",
  "item.materials": "Fournitures",
  "item.movements": "Entrées / sorties",
  "item.stockLevels": "État du stock",
  "item.clients": "Clients",
  "item.subcontractors": "Sous-traitants",
  "item.controls": "Contrôles",
  "item.defects": "Défauts",
  "item.machines": "Machines",
  "item.repairs": "Réparations",
  "item.spareParts": "Pièces de rechange",
  "item.staff": "Effectif",
  "item.absences": "Absences",
  "item.users": "Utilisateurs",
  "item.roles": "Rôles",

  accessDeniedTitle: "Accès refusé",
  accessDeniedDetail:
    "Votre rôle ne comprend pas cette section. Demandez à un administrateur si vous en avez besoin.",
  usersTitle: "Utilisateurs",
  rolesTitle: "Rôles",
  username: "Nom d'utilisateur",
  email: "E-mail",
  password: "Mot de passe",
  role: "Rôle",
  createUser: "Créer un utilisateur",
  creating: "Création…",
  userCreated: "Utilisateur créé",
  createFailed: "L'utilisateur n'a pas pu être créé.",
  loadFailed: "Les données n'ont pas pu être chargées.",
  loading: "Chargement…",
  "role.administrator": "Administrateur",
  "role.production-planner": "Planificateur de production",
  "role.production-supervisor": "Superviseur de production",
};

export const messages: Record<Locale, Record<string, string>> = { en, fr };
