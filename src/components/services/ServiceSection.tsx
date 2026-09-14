import { ServiceExplorer, type ProjectName } from "@/components/services/ServiceExplorer";
import { SHOWCASE } from "@/data/showcase";
import type { Copy } from "@/i18n/dictionary";
import { t, type Locale } from "@/lib/i18n";

/**
 * The explorer, with the names of the shipped work it points to resolved on
 * the server — so the client bundle carries three strings per project rather
 * than every picture the showcase holds.
 */
export function ServiceSection({ locale, copy }: { locale: Locale; copy: Copy }) {
  const projects: ProjectName[] = SHOWCASE.map((project) => ({
    slug: project.slug,
    title: project.title,
    category: t(project.category, locale),
  }));
  return <ServiceExplorer locale={locale} copy={copy} projects={projects} />;
}
