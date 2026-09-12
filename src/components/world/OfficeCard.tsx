"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { guideStore } from "@/components/world/npc/Guides";
import { journeyStore } from "@/components/world/systems/journey";
import { teleportStore } from "@/components/world/systems/teleport";
import { voiceStore } from "@/components/world/systems/voice";
import type { WorldCopy } from "@/components/world/WorldGate";
import { arrivalYaw, DEPARTMENTS, departmentById, type Department } from "@/data/departments";
import { BUDGET_RANGES } from "@/lib/contact";
import { t, type Locale } from "@/lib/i18n";
import { hasLeadErrors, TIMELINES, validateLead, type LeadErrors, type LeadPayload, type LeadResult } from "@/lib/leads";
import { cn } from "@/lib/utils";

/**
 * Talking to the company.
 *
 * One card, four moments. At the lobby the team greets the visitor and
 * offers the departments by letter; a department with an office of its own
 * takes the visitor there, and the card closes on the way. At a department
 * its people explain what they do and offer the services, again by letter.
 * A service chosen, the brief begins: a short form the visitor fills as if
 * answering questions, with only a name, an email and a few words about the
 * project required. Sent, the team thanks them and the world is theirs again.
 *
 * On a desk the letters are keys; on glass they are buttons. On a phone the
 * card is a sheet from the bottom that scrolls inside itself, sits above the
 * home indicator, and leaves the keyboard room; the joystick is put away
 * while it is up so a thumb on the form never walks the robot.
 */

type Stage = "lobby" | "department" | "brief" | "sending" | "done";

const LETTERS = "ABCDEFGHIJKLMNOP";

export function OfficeCard({
  officeId,
  world,
  locale,
  touch,
  onClose,
}: {
  /** "lobby", or a department id. */
  officeId: string;
  world: WorldCopy;
  locale: Locale;
  touch: boolean;
  onClose: () => void;
}) {
  const copy = world.office;
  const initial = departmentById(officeId) ?? null;
  const [stage, setStage] = useState<Stage>(initial ? "department" : "lobby");
  const [department, setDepartment] = useState<Department | null>(initial);
  const [service, setService] = useState<string | null>(null);
  const [going, setGoing] = useState<Department | null>(null);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [result, setResult] = useState<LeadResult | null>(null);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    whatsapp: "",
    description: "",
    budget: "",
    timeline: "",
    notes: "",
    consent: false,
    website: "",
  });
  const speakerId = `office:${officeId}`;

  /* What the people are saying, for the transcript and the voice. */
  const lines = useMemo(() => {
    if (stage === "lobby") return [...copy.greeting, copy.question];
    if (stage === "department" && department) return [...department.intro.map((line) => t(line, locale)), t(department.ask, locale)];
    if (stage === "brief") return [copy.briefIntro];
    if (stage === "done") return [...copy.done, copy.thanks];
    return [];
  }, [copy, department, locale, stage]);

  useEffect(() => {
    guideStore.talking = speakerId;
    journeyStore.step(officeId === "lobby" ? "lobby" : `office:${officeId}`);
    return () => {
      voiceStore.stop();
      if (guideStore.talking === speakerId) guideStore.talking = null;
    };
  }, [officeId, speakerId]);

  useEffect(() => {
    if (!lines.length) return;
    if (voiceStore.get().enabled) voiceStore.speak(speakerId, lines.join(" "), locale);
  }, [lines, locale, speakerId]);

  /* Choosing a department: go there, or — for the ones the lobby handles —
     hear about it here. */
  const pickDepartment = useCallback(
    (dept: Department) => {
      journeyStore.set({ department: dept.id, service: null });
      journeyStore.step(`department:${dept.id}`);
      if (dept.office) {
        teleportStore.requestTo({
          id: `office:${dept.id}`,
          number: 0,
          key: "",
          name: dept.name,
          subtitle: dept.tagline,
          description: dept.tagline,
          zone: dept.zone,
          at: dept.office.arrival,
          yaw: arrivalYaw(dept.office),
        });
        journeyStore.set({ awaiting: dept.id });
        setGoing(dept);
        window.setTimeout(onClose, 1100);
      } else {
        setDepartment(dept);
        setStage("department");
      }
    },
    [onClose],
  );

  const pickService = useCallback(
    (id: string) => {
      setService(id);
      journeyStore.set({ service: id });
      journeyStore.step(`service:${id}`);
      setStage("brief");
    },
    [],
  );

  /* Letters on the keyboard, when no field has the focus. */
  useEffect(() => {
    if (touch || (stage !== "lobby" && stage !== "department")) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const index = LETTERS.indexOf(event.key.toUpperCase());
      if (index < 0) return;
      if (stage === "lobby") {
        const dept = DEPARTMENTS[index];
        if (dept) {
          event.preventDefault();
          pickDepartment(dept);
        }
      } else if (department) {
        const one = department.services[index];
        if (one) {
          event.preventDefault();
          pickService(one.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [department, pickDepartment, pickService, stage, touch]);

  const firstField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (stage === "brief" && !touch) firstField.current?.focus();
  }, [stage, touch]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!department || !service) return;
    const payload: LeadPayload = {
      name: form.name,
      company: form.company || undefined,
      email: form.email,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      department: department.id,
      service,
      description: form.description,
      budget: form.budget as LeadPayload["budget"],
      timeline: form.timeline as LeadPayload["timeline"],
      notes: form.notes || undefined,
      consent: form.consent,
      locale,
      device: touch ? "mobile" : "desktop",
      journey: journeyStore.get().steps,
      website: form.website,
    };
    const found = validateLead(payload);
    setErrors(found);
    if (hasLeadErrors(found)) return;
    setFailure(null);
    setStage("sending");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as LeadResult;
      if (response.ok && data.ok) {
        setResult(data);
        journeyStore.step("sent");
        setStage("done");
        return;
      }
      if (response.status === 422 && data.errors) setErrors(data.errors);
      setFailure(response.status === 429 ? copy.errors.rateLimited : copy.errors.failed);
      setStage("brief");
    } catch {
      setFailure(copy.errors.failed);
      setStage("brief");
    }
  };

  const field = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const accent = department?.office?.accent ?? "#f2a889";
  const title = department ? t(department.name, locale) : copy.label;
  const inputClass =
    "w-full border border-[rgba(255,244,232,0.18)] bg-[rgba(6,12,26,0.6)] px-3 py-3 text-[1rem] text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--fg-mute)] focus:border-[var(--accent)]";
  const errorText = (key: keyof LeadErrors) => (errors[key] ? copy.errors[errors[key]!] : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-office-card
      data-office={officeId}
      data-stage={stage}
      className={cn("pointer-events-none absolute inset-0 z-[137] flex", touch ? "items-end justify-center" : "items-end justify-end")}
    >
      <div className={cn("flex w-full", touch ? "justify-center" : "frame justify-end pb-14")}>
        <div
          className={cn(
            "pointer-events-auto w-full overflow-y-auto border border-[rgba(255,244,232,0.18)] [animation:route-enter_420ms_var(--ease-out-expo)_both]",
            touch ? "max-h-[86dvh] rounded-t-[18px] border-b-0 px-5 pt-5" : "max-h-[82vh] max-w-[30rem] p-6",
          )}
          style={{
            ["--accent" as string]: accent,
            background: "linear-gradient(180deg, rgba(20,34,66,0.8), rgba(8,14,30,0.92))",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderRadius: touch ? undefined : "var(--radius-hair)",
            boxShadow: `0 0 0 1px ${accent}22, 0 24px 60px rgba(0,0,0,0.45)`,
            paddingBottom: touch ? "calc(env(safe-area-inset-bottom) + 1.25rem)" : undefined,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span aria-hidden="true" className="block h-px w-12 bg-[var(--accent)]" />
              <p className="mono-micro mt-3 text-[var(--accent)]">{title}</p>
            </div>
            <button
              type="button"
              data-office-close
              onClick={onClose}
              className="mono-micro -mr-2 -mt-1 px-2 py-1 text-[var(--fg-dim)] transition-colors hover:text-[var(--fg)]"
            >
              {copy.close}
            </button>
          </div>

          {/* What they say. */}
          {going ? (
            <div className="mt-4" data-office-going>
              <p className="text-quote">{copy.goingTo}</p>
              <p className="mt-2 text-[1.0625rem] text-[var(--fg)]">{t(going.name, locale)}</p>
              <p className="mt-1 text-[0.9375rem] text-[var(--fg-dim)]">{t(going.tagline, locale)}</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5" data-transcript>
              {lines.map((line, i) => (
                <p key={line} className={cn(i === 0 ? "text-quote" : "text-[0.9375rem] leading-relaxed", i === lines.length - 1 && lines.length > 1 ? "text-[var(--fg)]" : "text-[var(--fg-dim)]")}>
                  {line}
                </p>
              ))}
            </div>
          )}

          {/* The departments, by letter. */}
          {stage === "lobby" && !going ? (
            <>
              <ul className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2" data-office-options="departments">
                {DEPARTMENTS.map((dept) => (
                  <li key={dept.id}>
                    <button
                      type="button"
                      data-department={dept.id}
                      onClick={() => pickDepartment(dept)}
                      className="flex w-full items-center gap-3 border border-[rgba(255,244,232,0.16)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent)] active:border-[var(--accent)]"
                    >
                      <span className="mono-micro inline-flex size-6 shrink-0 items-center justify-center border border-[rgba(255,244,232,0.25)] text-[var(--accent)]">{dept.key}</span>
                      <span className="text-[0.9375rem] leading-tight text-[var(--fg)]">{t(dept.name, locale)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {!touch ? <p className="mono-micro mt-3 text-[var(--fg-mute)]">{copy.letters}</p> : null}
            </>
          ) : null}

          {/* The services. */}
          {stage === "department" && department ? (
            <>
              <ul className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2" data-office-options="services">
                {department.services.map((one, i) => (
                  <li key={one.id}>
                    <button
                      type="button"
                      data-service={one.id}
                      onClick={() => pickService(one.id)}
                      className="flex w-full items-center gap-3 border border-[rgba(255,244,232,0.16)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent)] active:border-[var(--accent)]"
                    >
                      <span className="mono-micro inline-flex size-6 shrink-0 items-center justify-center border border-[rgba(255,244,232,0.25)] text-[var(--accent)]">{LETTERS[i]}</span>
                      <span className="text-[0.9375rem] leading-tight text-[var(--fg)]">{t(one.name, locale)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between">
                {!touch ? <p className="mono-micro text-[var(--fg-mute)]">{copy.letters}</p> : <span />}
                {officeId === "lobby" ? (
                  <button type="button" onClick={() => setStage("lobby")} className="mono-micro text-[var(--fg-dim)] hover:text-[var(--fg)]">
                    ← {copy.back}
                  </button>
                ) : null}
              </div>
            </>
          ) : null}

          {/* The brief. */}
          {(stage === "brief" || stage === "sending") && department ? (
            <form className="mt-4 flex flex-col gap-3" onSubmit={submit} noValidate data-office-form>
              <p className="mono-micro text-[var(--fg-mute)]">
                {t(department.name, locale)} · {t(department.services.find((one) => one.id === service)?.name ?? department.services[0]!.name, locale)}
              </p>
              <p className="text-[0.8125rem] text-[var(--fg-dim)]">{copy.briefNote}</p>
              {/* Hidden from people; a bot fills it. */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={field("website")} className="hidden" aria-hidden="true" />
              <label className="flex flex-col gap-1">
                <span className="mono-micro text-[var(--fg-dim)]">{copy.fields.name}</span>
                <input ref={firstField} name="name" autoComplete="name" value={form.name} onChange={field("name")} className={inputClass} />
                {errorText("name") ? <span className="text-[0.8125rem] text-[#ffb4a2]">{errorText("name")}</span> : null}
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="mono-micro text-[var(--fg-dim)]">
                    {copy.fields.company} <em className="not-italic opacity-60">· {copy.optional}</em>
                  </span>
                  <input name="company" autoComplete="organization" value={form.company} onChange={field("company")} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="mono-micro text-[var(--fg-dim)]">{copy.fields.email}</span>
                  <input name="email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={field("email")} className={inputClass} />
                  {errorText("email") ? <span className="text-[0.8125rem] text-[#ffb4a2]">{errorText("email")}</span> : null}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="mono-micro text-[var(--fg-dim)]">
                    {copy.fields.phone} <em className="not-italic opacity-60">· {copy.optional}</em>
                  </span>
                  <input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={field("phone")} className={inputClass} />
                  {errorText("phone") ? <span className="text-[0.8125rem] text-[#ffb4a2]">{errorText("phone")}</span> : null}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="mono-micro text-[var(--fg-dim)]">
                    {copy.fields.whatsapp} <em className="not-italic opacity-60">· {copy.optional}</em>
                  </span>
                  <input name="whatsapp" type="tel" inputMode="tel" value={form.whatsapp} onChange={field("whatsapp")} className={inputClass} />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="mono-micro text-[var(--fg-dim)]">{copy.fields.description}</span>
                <textarea name="description" rows={touch ? 3 : 4} value={form.description} onChange={field("description")} className={cn(inputClass, "resize-y")} />
                {errorText("description") ? <span className="text-[0.8125rem] text-[#ffb4a2]">{errorText("description")}</span> : null}
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="mono-micro text-[var(--fg-dim)]">
                    {copy.fields.budget} <em className="not-italic opacity-60">· {copy.optional}</em>
                  </span>
                  <select name="budget" value={form.budget} onChange={field("budget")} className={inputClass}>
                    <option value="">—</option>
                    {BUDGET_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {copy.budgets[range]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="mono-micro text-[var(--fg-dim)]">
                    {copy.fields.timeline} <em className="not-italic opacity-60">· {copy.optional}</em>
                  </span>
                  <select name="timeline" value={form.timeline} onChange={field("timeline")} className={inputClass}>
                    <option value="">—</option>
                    {TIMELINES.map((one) => (
                      <option key={one} value={one}>
                        {copy.timelines[one]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="mono-micro text-[var(--fg-dim)]">
                  {copy.fields.notes} <em className="not-italic opacity-60">· {copy.optional}</em>
                </span>
                <textarea name="notes" rows={2} value={form.notes} onChange={field("notes")} className={cn(inputClass, "resize-y")} />
              </label>
              <label className="flex items-start gap-3 text-[0.8125rem] leading-snug text-[var(--fg-dim)]">
                <input type="checkbox" name="consent" checked={form.consent} onChange={field("consent")} className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" />
                <span>
                  {copy.consent}{" "}
                  <Link href={`/${locale}/contact`} className="underline decoration-[rgba(255,244,232,0.3)] underline-offset-2 hover:text-[var(--fg)]" target="_blank">
                    {copy.consentLink}
                  </Link>
                </span>
              </label>
              {errorText("consent") ? <span className="text-[0.8125rem] text-[#ffb4a2]">{errorText("consent")}</span> : null}
              {failure ? (
                <p className="text-[0.875rem] text-[#ffb4a2]" role="alert">
                  {failure}
                </p>
              ) : null}
              <div className="mt-1 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setStage("department")} className="mono-micro text-[var(--fg-dim)] hover:text-[var(--fg)]">
                  ← {copy.back}
                </button>
                <button
                  type="submit"
                  data-office-submit
                  disabled={stage === "sending"}
                  className="mono-label border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-5 py-3 text-[var(--fg)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_32%,transparent)] disabled:opacity-60"
                >
                  {stage === "sending" ? copy.sending : copy.submit}
                </button>
              </div>
            </form>
          ) : null}

          {/* Sent. */}
          {stage === "done" ? (
            <div className="mt-5 flex flex-col gap-3" data-office-done>
              {result?.id ? (
                <p className="mono-micro text-[var(--fg-mute)]">
                  {copy.reference} · {result.id}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" data-office-explore onClick={onClose} className="mono-micro border border-[var(--accent)] px-4 py-2.5 text-[var(--fg)]">
                  {copy.explore}
                </button>
                <button
                  type="button"
                  data-office-lobby
                  onClick={() => {
                    teleportStore.request("hub");
                    onClose();
                  }}
                  className="mono-micro border border-[rgba(255,244,232,0.18)] px-4 py-2.5 text-[var(--fg-dim)] hover:text-[var(--fg)]"
                >
                  {copy.lobby}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
