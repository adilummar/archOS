/**
 * Server layout wrapper for /[firmSlug]/(app)/*
 *
 * This is a server component that sits ABOVE the client layout.tsx.
 * It fetches DB data via FirmDataLoader and wraps the client layout children.
 *
 * Next.js 13+ supports nested layouts — this file is named
 * server-layout.tsx and imported inside the client layout.
 */

import FirmDataLoader from "@/components/providers/FirmDataLoader";

export default async function ServerLayout({
  firmSlug,
  children,
}: {
  firmSlug: string;
  children: React.ReactNode;
}) {
  return <FirmDataLoader firmSlug={firmSlug}>{children}</FirmDataLoader>;
}
