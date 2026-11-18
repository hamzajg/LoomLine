/**
 * A screen for an area that is part of the migration but not built yet — the
 * shell still navigates to it so the taxonomy mirrors the legacy system.
 */
export function AreaPlaceholder({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <section className="area-placeholder">
      <h2>{title}</h2>
      <p>{detail}</p>
    </section>
  );
}
