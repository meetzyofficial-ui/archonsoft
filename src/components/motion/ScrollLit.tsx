type Segment = { text: string; serif?: boolean; accent?: boolean };

/** A large statement. It used to light word by word; now it is simply legible. */
export function ScrollLit({
  text,
  as: Tag = "p",
  className,
}: {
  text: string | Segment[];
  as?: "p" | "h2" | "h3";
  className?: string;
}) {
  return <Tag className={className}>{typeof text === "string" ? text : text.map((one) => one.text).join(" ")}</Tag>;
}
