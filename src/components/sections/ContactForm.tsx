"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SERVICE_META, isServiceId, type ServiceId } from "@/data/serviceIds";
import { ActionButton } from "@/components/ui/Action";
import type { Copy } from "@/i18n/dictionary";
import {
  PROJECT_TYPES,
  hasErrors,
  type ProjectType,
  validateContact,
  type ContactPayload,
  type FieldErrors,
} from "@/lib/contact";
import type { Locale } from "@/lib/i18n";
import { CONTACT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "unconfigured" }
  | { kind: "failed"; message: string };

const EMPTY: ContactPayload = {
  name: "",
  email: "",
  company: "",
  projectType: "",
  service: "",
  message: "",
  website: "",
};

const fieldClass =
  "w-full border-0 border-b border-[var(--line-strong)] bg-transparent py-3 " +
  "text-lead outline-none transition-colors duration-300 " +
  "placeholder:text-[var(--fg-mute)] hover:border-[var(--fg-mute)] " +
  "focus:border-[var(--accent)] focus-visible:outline-none";

function Chip({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={cn(
        /* A fixed box, not a box that fits its text.
           These sit in a grid, so the tallest chip sets the row — and a label
           that goes from one line to two when the mono face swaps in moves
           every field under it. Holding the height means the swap changes the
           letterforms and nothing else. */
        "mono-label flex min-h-11 cursor-pointer items-center border px-3.5 py-2 transition-colors duration-300",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]",
        checked
          ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"
          : "border-[var(--line-strong)] text-[var(--fg-dim)] hover:border-[var(--fg-mute)] hover:text-[var(--fg)]",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {label}
    </label>
  );
}

export type ContactPreset = { service: ServiceId; projectType: ProjectType };

export function ContactForm({
  locale,
  copy,
  preset,
}: {
  locale: Locale;
  copy: Copy;
  /**
   * The service the visitor chose before arriving at the form. It selects the
   * matching project type and travels with the message as context; changing
   * it later (from the explorer) changes both, and nothing else they typed.
   */
  preset?: ContactPreset;
}) {
  const uid = useId();
  const [values, setValues] = useState<ContactPayload>(EMPTY);

  useEffect(() => {
    if (!preset) return;
    setValues((current) => ({ ...current, service: preset.service, projectType: preset.projectType }));
  }, [preset?.service, preset?.projectType]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Arriving at /contact?service=… from a link that could not open the
     explorer (no JavaScript at the time, or a shared address). An unknown
     value is simply ignored. */
  useEffect(() => {
    if (preset) return;
    try {
      const asked = new URLSearchParams(window.location.search).get("service");
      if (isServiceId(asked)) {
        setValues((current) => ({ ...current, service: asked, projectType: SERVICE_META[asked].projectType }));
      }
    } catch {
      /* No query to read. */
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chosen = isServiceId(values.service) ? { id: values.service, ...SERVICE_META[values.service] } : undefined;
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const errorRef = useRef<HTMLDivElement>(null);

  const form = copy.contact.form;

  const set = <K extends keyof ContactPayload>(key: K, value: ContactPayload[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const id = (field: string) => `${uid}-${field}`;
  const message = (field: keyof ContactPayload) => {
    const key = errors[field];
    return key ? form.errors[key] : undefined;
  };
  const describe = (field: keyof ContactPayload) =>
    errors[field] ? `${uid}-${field}-error` : undefined;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "sending") return;

    const found = validateContact(values);
    setErrors(found);
    if (hasErrors(found)) {
      const first = Object.keys(found)[0];
      document.getElementById(id(first ?? "name"))?.focus();
      return;
    }

    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });

      if (response.ok) {
        setStatus({ kind: "sent" });
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { errors?: FieldErrors; message?: string; code?: string }
        | null;

      if (response.status === 422 && data?.errors) {
        setErrors(data.errors);
        setStatus({ kind: "idle" });
        return;
      }

      if (data?.code === "NOT_CONFIGURED") {
        setStatus({ kind: "unconfigured" });
        return;
      }

      setStatus({ kind: "failed", message: data?.message ?? "—" });
    } catch {
      setStatus({ kind: "failed", message: "—" });
    } finally {
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  /**
   * Everything the visitor typed, preserved into a mail client, so a failed or
   * unconfigured send never costs them their message. Null while no public
   * address exists — every mailto on the site turns on together when it does.
   */
  const mailtoFallback = !CONTACT_EMAIL
    ? null
    : `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        `${form.message} — ${values.name || "Archon"}`,
      )}&body=${encodeURIComponent(
        [
          `${form.name}: ${values.name}`,
          `${form.email}: ${values.email}`,
          values.company ? `${form.company}: ${values.company}` : null,
          `${form.type} ${form.types[values.projectType as keyof typeof form.types] ?? ""}`,
          chosen ? `${copy.explorer.selected}: ${chosen.title[locale]}` : null,
          "",
          values.message,
        ]
          .filter((line) => line !== null)
          .join("\n"),
      )}`;

  if (status.kind === "sent") {
    return (
      <div className="hairline-t pt-10" role="status">
        <p className="mono-label text-[var(--accent)]">{form.sent}</p>
        <p className="mt-6 max-w-[26ch] text-sub">{form.sentTitle}</p>
        <p className="mt-6 max-w-[46ch] text-[var(--fg-dim)]">{form.sentBody}</p>
      </div>
    );
  }

  if (status.kind === "unconfigured") {
    return (
      <div className="hairline-t pt-10" role="status">
        <p className="mono-label text-[var(--accent)]">{form.notSent}</p>
        <p className="mt-6 max-w-[28ch] text-quote">{form.unconfiguredTitle}</p>
        <p className="mt-5 max-w-[46ch] text-[var(--fg-dim)]">
          {form.unconfiguredBody}
          {mailtoFallback ? "" : form.unconfiguredNoAddress}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {mailtoFallback ? (
            <a
              href={mailtoFallback}
              className="mono-label inline-flex h-[3.25rem] items-center border border-[var(--line-strong)] px-6 transition-colors duration-500 hover:bg-[var(--fg)] hover:text-[var(--bg)]"
            >
              {form.mailInstead}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            className="mono-label link-rule text-[var(--fg-dim)] hover:text-[var(--fg)]"
          >
            {form.back}
          </button>
        </div>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className="hairline-t pt-10">
      {/* Honeypot. Hidden from people and from assistive technology alike. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor={id("website")}>Website</label>
        <input
          id={id("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => set("website", event.target.value)}
        />
      </div>

      <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
        <div>
          <label htmlFor={id("name")} className="mono-label block text-[var(--fg-mute)]">
            {form.name} <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id={id("name")}
            name="name"
            type="text"
            autoComplete="name"
            required
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describe("name")}
            className={cn(fieldClass, "mt-3", errors.name && "border-[var(--accent)]")}
            placeholder={form.namePlaceholder}
          />
          {message("name") ? (
            <p id={`${uid}-name-error`} className="mono-label mt-2 text-[var(--accent)]">
              {message("name")}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={id("email")} className="mono-label block text-[var(--fg-mute)]">
            {form.email} <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id={id("email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describe("email")}
            className={cn(fieldClass, "mt-3", errors.email && "border-[var(--accent)]")}
            placeholder={form.emailPlaceholder}
          />
          {message("email") ? (
            <p id={`${uid}-email-error`} className="mono-label mt-2 text-[var(--accent)]">
              {message("email")}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label htmlFor={id("company")} className="mono-label block text-[var(--fg-mute)]">
            {form.company}{" "}
            <span className="normal-case tracking-normal">{form.optional}</span>
          </label>
          <input
            id={id("company")}
            name="company"
            type="text"
            autoComplete="organization"
            value={values.company}
            onChange={(event) => set("company", event.target.value)}
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={describe("company")}
            className={cn(fieldClass, "mt-3")}
            placeholder={form.companyPlaceholder}
          />
          {message("company") ? (
            <p id={`${uid}-company-error`} className="mono-label mt-2 text-[var(--accent)]">
              {message("company")}
            </p>
          ) : null}
        </div>
      </div>

      <fieldset className="mt-12">
        <legend className="mono-label text-[var(--fg-mute)]">
          {form.type} <span className="text-[var(--accent)]">*</span>
        </legend>
        {chosen ? (
          <p className="mt-4 flex flex-wrap items-center gap-3" data-chosen-service={chosen.id}>
            <span className="mono-micro text-[var(--fg-mute)]">{copy.explorer.selected}</span>
            <span className="chip mono-micro !text-[var(--fg)]">{chosen.title[locale]}</span>
          </p>
        ) : null}
        {/* A grid, not a wrapping row.
            These chips are set in the mono face and are wider in the
            fallback, so the row they wrapped to changed the moment the real
            face arrived — and a changing line count moves everything below
            it. A fixed column count has the same height whatever is loaded. */}
        <div
          className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
          aria-describedby={describe("projectType")}
        >
          {PROJECT_TYPES.map((type) => (
            <Chip
              key={type}
              name="projectType"
              value={type}
              label={form.types[type]}
              checked={values.projectType === type}
              onChange={(value) => set("projectType", value)}
            />
          ))}
        </div>
        {message("projectType") ? (
          <p id={`${uid}-projectType-error`} className="mono-label mt-2 text-[var(--accent)]">
            {message("projectType")}
          </p>
        ) : null}
      </fieldset>

      <div className="mt-12">
        <label htmlFor={id("message")} className="mono-label block text-[var(--fg-mute)]">
          {form.message} <span className="text-[var(--accent)]">*</span>
        </label>
        <textarea
          id={id("message")}
          name="message"
          rows={5}
          required
          value={values.message}
          onChange={(event) => set("message", event.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describe("message")}
          className={cn(fieldClass, "mt-3 resize-y", errors.message && "border-[var(--accent)]")}
          placeholder={form.messagePlaceholder}
        />
        {message("message") ? (
          <p id={`${uid}-message-error`} className="mono-label mt-2 text-[var(--accent)]">
            {message("message")}
          </p>
        ) : null}
      </div>

      <div ref={errorRef} tabIndex={-1} role="alert" aria-live="assertive" className="mt-10 outline-none">
        {status.kind === "failed" ? (
          <p className="mono-label mb-6 border border-[var(--accent)] px-4 py-3 text-[var(--accent)]">
            {form.unconfiguredBody}
            {mailtoFallback ? (
              <>
                {" "}
                {form.alsoEmail}{" "}
                <a href={mailtoFallback} className="link-rule">
                  {form.alsoEmailLink}
                </a>
                .
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <ActionButton
          type="submit"
          variant="solid"
          disabled={sending}
          arrow={sending ? "none" : "right"}
        >
          {sending ? form.sending : form.send}
        </ActionButton>
        {CONTACT_EMAIL ? (
          <p className="mono-label text-[var(--fg-mute)]">
            {form.orEmail} {CONTACT_EMAIL} {form.directly}
          </p>
        ) : null}
      </div>
    </form>
  );
}
