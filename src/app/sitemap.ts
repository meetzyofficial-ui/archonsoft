import type { MetadataRoute } from "next";
import { LABS } from "@/data/labs";
import { PROJECTS } from "@/data/projects";
import { LOCALES } from "@/lib/i18n";
import { SITE } from "@/lib/site";

/**
 * Every page exists in both languages, so each entry carries the alternates
 * that tell a crawler the two are the same document, not duplicates.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const paths: { path: string; priority: number; changeFrequency: "monthly" | "yearly" }[] = [
    { path: "", priority: 1, changeFrequency: "monthly" },
    { path: "/work", priority: 0.9, changeFrequency: "monthly" },
    { path: "/labs", priority: 0.9, changeFrequency: "monthly" },
    { path: "/capabilities", priority: 0.8, changeFrequency: "yearly" },
    { path: "/process", priority: 0.7, changeFrequency: "yearly" },
    { path: "/about", priority: 0.7, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
    ...PROJECTS.map((project) => ({
      path: `/work/${project.slug}`,
      priority: 0.85,
      changeFrequency: "yearly" as const,
    })),
    ...LABS.map((lab) => ({
      path: `/labs/${lab.slug}`,
      priority: 0.7,
      changeFrequency: "yearly" as const,
    })),
  ];

  return LOCALES.flatMap((locale) =>
    paths.map((entry) => ({
      url: `${SITE.url}/${locale}${entry.path}`,
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((other) => [other, `${SITE.url}/${other}${entry.path}`]),
        ),
      },
    })),
  );
}
