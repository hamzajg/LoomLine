/**
 * The caller's projected section access, as served by `/api/navigation`.
 * The server derives it from the approved access matrix; the shell renders
 * exactly what it is granted and guards routes with the same payload (D4).
 */

export type SectionGrant = {
  id: string;
  view: boolean;
  manage: boolean;
};

export async function fetchNavigation(): Promise<SectionGrant[]> {
  const response = await fetch("/api/navigation", {
    headers: { "X-Requested-With": "JavaScript" },
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error(`The navigation endpoint answered ${response.status}.`);
  }
  const body = (await response.json()) as { sections?: SectionGrant[] };
  return body.sections ?? [];
}
