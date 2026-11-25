import Image from "next/image";
import mark from "@/assets/brand/archon-mark.png";
import { cn } from "@/lib/utils";

/** The Archon Soft mark: the supplied logo file itself, cut from its ground. */
export function ArchonIcon({ className }: { className?: string }) {
  return (
    <Image src={mark} alt="" aria-hidden="true" unoptimized className={cn("h-[1em] w-auto", className)} style={{ aspectRatio: "429 / 273" }} />
  );
}

export function Wordmark({
  className,
}: {
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ArchonIcon className="h-[1.12em]" />
      <span className="sr-only">Archon Soft</span>
      <span
        aria-hidden="true"
        className="text-[0.82em] leading-none font-extrabold tracking-[-0.01em] uppercase [font-stretch:115%]"
      >
        Archon
        <span className="font-normal text-[var(--color-steel)] max-[359px]:hidden">soft</span>
      </span>
    </span>
  );
}
