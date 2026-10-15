import { notFound } from "next/navigation";

/**
 * Any path under a locale that isn't a page. Calling notFound() here renders
 * [lang]/not-found.tsx inside the locale's layout (header, footer, html
 * lang); without this route Next would serve its unstyled default 404.
 */
export default function UnknownPage() {
  notFound();
}
