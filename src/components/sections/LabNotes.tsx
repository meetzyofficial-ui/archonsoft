import { Reveal } from "@/components/motion/Reveal";
import type { LabNote } from "@/data/lab";
import type { Copy } from "@/i18n/dictionary";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LabNotes({
  notes,
  locale,
  copy,
  className,
}: {
  notes: LabNote[];
  locale: Locale;
  copy: Copy;
  className?: string;
}) {
  return (
    <ol className={cn("hairline-t", className)}>
      {notes.map((note, index) => (
        <li key={note.index} className="hairline-b">
          <Reveal delay={index * 60} className="grid gap-5 py-8 md:grid-cols-12 md:gap-8 md:py-10">
            <div className="flex items-baseline justify-between gap-4 md:col-span-2 md:block">
              <span className="mono-label text-[var(--accent)]">{note.index}</span>
              <span className="mono-label mt-0 block text-[var(--fg-mute)] md:mt-3">
                {t(note.field, locale)}
              </span>
            </div>

            <h3 className="text-quote md:col-span-6">{t(note.title, locale)}</h3>

            <div className="md:col-span-4">
              <p className="text-[var(--fg-dim)]">{t(note.position, locale)}</p>
              <span
                className={cn(
                  "mono-label mt-5 inline-block border px-2.5 py-1.5",
                  note.status === "IN PROGRESS"
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-[var(--line)] text-[var(--fg-mute)]",
                )}
              >
                {note.status === "IN PROGRESS" ? copy.next.inProgress : copy.next.openThread}
              </span>
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
