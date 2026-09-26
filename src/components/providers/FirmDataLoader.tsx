/**
 * FirmDataLoader — legacy server component, no longer used directly.
 * DBProvider now fetches its own data client-side.
 * Kept here for future reference or direct server-side use.
 */

export default async function FirmDataLoader({
  children,
}: {
  firmSlug: string;
  children: React.ReactNode;
}) {
  // Data fetching is now handled by DBProvider (client component)
  return <>{children}</>;
}
