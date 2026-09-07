"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  BarChart,
  Breakdown,
  Column,
  DataTable,
  Field,
  GhostButton,
  Icon,
  Initials,
  LabHeader,
  LabShell,
  LabWindow,
  PhoneShell,
  Pill,
  Segmented,
  SidePanel,
  Stat,
  StatRow,
  Timeline,
} from "@/components/labs/kit";
import type { Cell, Lab, ViewBody } from "@/data/labs";
import type { Copy } from "@/i18n/dictionary";
import { t, tl, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A concept product, running.
 *
 * The sidebar is the interaction. Clicking through it moves between real
 * screens of the same application rather than between slides, and each screen
 * has its own behaviour underneath — rows open, ranges redraw the series,
 * conversations switch, a basket counts. None of it needs a server, and all of
 * it is labelled a prototype, which is the arrangement that makes the whole
 * section honest.
 */

const cellText = (cell: Cell | undefined): string =>
  typeof cell === "string" ? cell : (cell?.text ?? "");

function renderCell(cell: Cell | undefined) {
  if (cell === undefined) return null;
  if (typeof cell === "string") return cell;
  return cell.tone ? <Pill tone={cell.tone}>{cell.text}</Pill> : cell.text;
}

export function LabSurface({
  lab,
  locale,
  copy,
  className,
  initialView,
}: {
  lab: Lab;
  locale: Locale;
  copy: Copy;
  className?: string;
  /** Open on a particular screen. Used where a surface is standing in for a
   *  capability rather than introducing the product. */
  initialView?: string;
}) {
  const [viewId, setViewId] = useState(
    lab.views.some((view) => view.id === initialView) ? initialView! : lab.views[0]!.id,
  );
  const view = lab.views.find((candidate) => candidate.id === viewId) ?? lab.views[0]!;

  return (
    <div className={className}>
      <LabWindow
        accent={lab.accent}
        product={lab.name}
        sector={t(lab.sector, locale)}
        chip={copy.labs.chip}
      >
        <LabShell
          navLabel={`${lab.name} — ${copy.labs.nav}`}
          nav={lab.views.map((candidate) => ({
            id: candidate.id,
            label: t(candidate.label, locale),
            icon: candidate.icon,
            ...(candidate.badge ? { badge: candidate.badge } : {}),
          }))}
          active={view.id}
          onSelect={setViewId}
        >
          <LabHeader
            title={t(view.title, locale)}
            {...(view.meta ? { meta: t(view.meta, locale) } : {})}
          >
            <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--lab-mute)] @[46rem]/lab:inline">
              {copy.labs.sample}
            </span>
          </LabHeader>

          {/* Keyed on the view so every screen mounts with its own clean
              state — an open record from one screen must not survive into
              the next, exactly as it would not in the real thing. */}
          <ViewSurface key={view.id} body={view.body} locale={locale} copy={copy} />
        </LabShell>
      </LabWindow>
    </div>
  );
}

function ViewSurface({
  body,
  locale,
  copy,
}: {
  body: ViewBody;
  locale: Locale;
  copy: Copy;
}) {
  switch (body.kind) {
    case "dashboard":
      return <DashboardView body={body} locale={locale} />;
    case "records":
      return <RecordsView body={body} locale={locale} copy={copy} />;
    case "board":
      return <BoardView body={body} locale={locale} />;
    case "thread":
      return <ThreadView body={body} locale={locale} copy={copy} />;
    case "catalog":
      return <CatalogView body={body} locale={locale} />;
    case "search":
      return <SearchView body={body} locale={locale} copy={copy} />;
    case "mobile":
      return <MobileView body={body} locale={locale} />;
    case "command":
      return <CommandView body={body} locale={locale} />;
    case "states":
      return <StatesView body={body} locale={locale} />;
    case "settings":
      return <SettingsView body={body} locale={locale} />;
  }
}

/* --------------------------------------------------------------- dashboard */

function DashboardView({
  body,
  locale,
}: {
  body: Extract<ViewBody, { kind: "dashboard" }>;
  locale: Locale;
}) {
  // Hoisted through useMemo so the fallback array is not a fresh identity on
  // every render, which would make the series recompute for no reason.
  const ranges = useMemo(() => body.ranges ?? [], [body.ranges]);
  const [range, setRange] = useState(ranges[ranges.length - 1]?.id ?? "");
  const values = useMemo(() => {
    const found = ranges.find((candidate) => candidate.id === range);
    return found ? found.values : body.chart.values;
  }, [range, ranges, body.chart.values]);

  return (
    <div className="flex-1">
      <StatRow>
        {body.stats.map((stat) => (
          <Stat
            key={stat.label.en}
            label={t(stat.label, locale)}
            value={stat.value}
            {...(stat.delta ? { delta: stat.delta } : {})}
            {...(stat.tone ? { tone: stat.tone } : {})}
          />
        ))}
      </StatRow>

      {ranges.length > 0 ? (
        <div className="flex justify-end border-b border-[var(--lab-line)] px-3 py-2 @[46rem]/lab:px-5">
          <Segmented
            label="Range"
            value={range}
            onChange={setRange}
            options={ranges.map((candidate) => ({ id: candidate.id, label: candidate.label }))}
          />
        </div>
      ) : null}

      <div className="@[52rem]/lab:flex">
        <div className="min-w-0 flex-1 border-b border-[var(--lab-line)] @[52rem]/lab:border-b-0">
          {body.chart.type === "area" ? (
            <AreaChart
              values={values}
              labels={body.chart.labels}
              {...(body.chart.peak ? { peak: body.chart.peak } : {})}
            />
          ) : (
            <BarChart
              values={values}
              labels={body.chart.labels}
              {...(body.chart.caption ? { caption: t(body.chart.caption, locale) } : {})}
            />
          )}
          {body.timeline ? (
            <div className="border-t border-[var(--lab-line)]">
              <Timeline
                items={body.timeline.map((item) => ({
                  at: item.at,
                  text: t(item.text, locale),
                  ...(item.actor ? { actor: item.actor } : {}),
                }))}
              />
            </div>
          ) : null}
        </div>

        {body.breakdown ? (
          <div className="border-[var(--lab-line)] @[52rem]/lab:w-72 @[52rem]/lab:shrink-0 @[52rem]/lab:border-l">
            <Breakdown
              rows={body.breakdown.map((row) => ({
                label: t(row.label, locale),
                value: row.value,
                ...(row.note ? { note: row.note } : {}),
              }))}
              {...(body.breakdownUnit ? { unit: body.breakdownUnit } : {})}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- records */

function RecordsView({
  body,
  locale,
  copy,
}: {
  body: Extract<ViewBody, { kind: "records" }>;
  locale: Locale;
  copy: Copy;
}) {
  const [activeId, setActiveId] = useState(body.rows[0]!.id);
  const [filter, setFilter] = useState(body.filters?.[0]?.id ?? "");
  const active = body.rows.find((row) => row.id === activeId) ?? body.rows[0]!;

  const columns: Column[] = body.columns.map((column) => ({
    key: column.key,
    label: t(column.label, locale),
    ...(column.align ? { align: column.align } : {}),
    ...(column.hideNarrow ? { hideNarrow: column.hideNarrow } : {}),
  }));

  return (
    <div className="flex-1 @[52rem]/lab:flex">
      <div className="min-w-0 flex-1">
        {body.filters ? (
          <div className="flex items-center gap-2 border-b border-[var(--lab-line)] px-3 py-2 @[46rem]/lab:px-5">
            <Icon name="filter" size={13} className="text-[var(--lab-mute)]" />
            <Segmented
              label={copy.labs.filters}
              value={filter}
              onChange={setFilter}
              options={body.filters.map((candidate) => ({
                id: candidate.id,
                label: t(candidate.label, locale),
              }))}
            />
          </div>
        ) : null}

        <DataTable
          caption={copy.labs.tableCaption}
          columns={columns}
          activeId={active.id}
          onSelect={setActiveId}
          rows={body.rows.map((row) => ({
            id: row.id,
            cells: Object.fromEntries(
              body.columns.map((column) => [column.key, renderCell(row.cells[column.key])]),
            ),
          }))}
        />

        <p className="px-3 py-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--lab-mute)] @[46rem]/lab:px-5">
          {copy.labs.selectHint}
        </p>
      </div>

      <SidePanel eyebrow={t(active.detail.eyebrow, locale)} title={active.detail.title}>
        {active.detail.fields.map((field) => (
          <Field key={field.label.en} label={t(field.label, locale)} value={field.value} />
        ))}
        {active.detail.note ? (
          <p className="mt-4 border-t border-[var(--lab-line)] pt-3 text-[11.5px] leading-relaxed text-[var(--lab-mute)]">
            {t(active.detail.note, locale)}
          </p>
        ) : null}
      </SidePanel>
    </div>
  );
}

/* ------------------------------------------------------------------- board */

function BoardView({
  body,
  locale,
}: {
  body: Extract<ViewBody, { kind: "board" }>;
  locale: Locale;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-1 overflow-x-auto">
      <div className="flex min-w-max flex-1 gap-px bg-[var(--lab-line)] @[46rem]/lab:min-w-full">
        {body.columns.map((column) => (
          <section
            key={column.title.en}
            className="w-52 shrink-0 bg-[var(--lab-bg)] p-2.5 @[46rem]/lab:w-auto @[46rem]/lab:flex-1 @[46rem]/lab:p-3"
          >
            <h5 className="flex items-baseline justify-between font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--lab-mute)]">
              {t(column.title, locale)}
              <span className="tabular-nums">{column.cards.length}</span>
            </h5>
            <ul className="mt-3 flex flex-col gap-2">
              {column.cards.map((card) => {
                const open = card.id === openId;
                return (
                  <li key={card.id}>
                    <button
                      type="button"
                      aria-pressed={open}
                      onClick={() => setOpenId(open ? null : card.id)}
                      className={cn(
                        "w-full cursor-pointer rounded-lg border p-2.5 text-left transition-colors duration-200",
                        open
                          ? "border-[color-mix(in_oklab,var(--lab-accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--lab-accent)_10%,transparent)]"
                          : "border-[var(--lab-line)] bg-[var(--lab-panel)] hover:border-[var(--lab-line-strong)]",
                      )}
                    >
                      <p className="text-[12px] leading-snug font-medium text-[var(--lab-fg)]">
                        {card.title}
                      </p>
                      <p className="mt-1 text-[10.5px] text-[var(--lab-mute)]">{card.meta}</p>
                      {card.tag ? (
                        <span className="mt-2 inline-flex">
                          <Pill tone={card.tone ?? "idle"}>{t(card.tag, locale)}</Pill>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ thread */

function ThreadView({
  body,
  locale,
  copy,
}: {
  body: Extract<ViewBody, { kind: "thread" }>;
  locale: Locale;
  copy: Copy;
}) {
  const [activeId, setActiveId] = useState(body.conversations[0]!.id);
  const active = body.conversations.find((one) => one.id === activeId) ?? body.conversations[0]!;

  return (
    <div className="flex-1 @[46rem]/lab:flex">
      <ul className="border-b border-[var(--lab-line)] @[46rem]/lab:w-56 @[46rem]/lab:shrink-0 @[46rem]/lab:border-b-0 @[46rem]/lab:border-r">
        {body.conversations.map((one, i) => {
          const selected = one.id === active.id;
          return (
            <li key={one.id}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => setActiveId(one.id)}
                className={cn(
                  "flex w-full cursor-pointer gap-2.5 border-b border-[var(--lab-line)] px-3 py-2.5 text-left transition-colors duration-200",
                  selected ? "bg-[var(--lab-raise)]" : "hover:bg-[var(--lab-panel)]",
                )}
              >
                <Initials name={one.who} tone={i} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-medium text-[var(--lab-fg)]">
                    {one.subject}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-[var(--lab-mute)]">
                    {one.who}
                  </span>
                  <span className="mt-1.5 inline-flex">
                    <Pill tone={one.tone ?? "idle"}>{t(one.meta, locale)}</Pill>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 px-3 py-3 @[46rem]/lab:px-5 @[46rem]/lab:py-4">
          {active.messages.map((message, i) => {
            const mine = message.from !== "customer";
            return (
              <div
                key={i}
                className={cn("flex flex-col py-2", mine ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-xl px-3 py-2 text-[11.5px] leading-relaxed @[46rem]/lab:max-w-[80%] @[46rem]/lab:text-[12.5px]",
                    message.from === "customer" &&
                      "rounded-bl-sm bg-[var(--lab-raise)] text-[var(--lab-dim)]",
                    message.from === "agent" &&
                      "rounded-br-sm bg-[var(--lab-panel)] text-[var(--lab-dim)] ring-1 ring-[var(--lab-line-strong)]",
                    message.from === "assistant" &&
                      "rounded-br-sm bg-[color-mix(in_oklab,var(--lab-accent)_16%,transparent)] text-[var(--lab-fg)] ring-1 ring-[color-mix(in_oklab,var(--lab-accent)_38%,transparent)]",
                  )}
                >
                  {message.from === "assistant" ? (
                    <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--lab-accent)]">
                      <Icon name="spark" size={11} />
                      {copy.labs.assistant}
                    </span>
                  ) : null}
                  {t(message.text, locale)}
                  {message.sources ? (
                    <span className="mt-2 flex flex-wrap gap-1.5 border-t border-[var(--lab-line-strong)] pt-2">
                      {message.sources.map((source) => (
                        <span
                          key={source}
                          className="inline-flex items-center gap-1 rounded border border-[var(--lab-line-strong)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--lab-mute)]"
                        >
                          <Icon name="file" size={10} />
                          {source}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </div>
                <span className="mt-1 font-mono text-[9px] tracking-[0.1em] text-[var(--lab-mute)]">
                  {message.at}
                </span>
              </div>
            );
          })}
        </div>

        {body.composer ? (
          <div className="flex items-center gap-2 border-t border-[var(--lab-line)] px-3 py-2.5 @[46rem]/lab:px-5">
            <span className="flex-1 truncate rounded-md border border-[var(--lab-line)] px-2.5 py-1.5 text-[11px] text-[var(--lab-mute)]">
              {t(body.composer, locale)}
            </span>
            <GhostButton tone="accent" icon="arrow">
              {copy.labs.send}
            </GhostButton>
          </div>
        ) : null}
      </div>

      <SidePanel eyebrow={copy.labs.context} title={active.subject}>
        {active.context.map((field) => (
          <Field key={field.label.en} label={t(field.label, locale)} value={field.value} />
        ))}
      </SidePanel>
    </div>
  );
}

/* ----------------------------------------------------------------- catalog */

function CatalogView({
  body,
  locale,
}: {
  body: Extract<ViewBody, { kind: "catalog" }>;
  locale: Locale;
}) {
  const [cart, setCart] = useState<string[]>([]);
  const [openId, setOpenId] = useState(body.items[0]!.id);
  const open = body.items.find((item) => item.id === openId) ?? body.items[0]!;

  const total = cart.reduce((sum, id) => {
    const item = body.items.find((candidate) => candidate.id === id);
    const amount = Number((item?.price ?? "0").replace(/[^\d]/g, ""));
    return sum + amount;
  }, 0);

  return (
    <div className="flex-1 @[52rem]/lab:flex">
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-2 gap-px bg-[var(--lab-line)] @[46rem]/lab:grid-cols-3">
          {body.items.map((item) => (
            <article key={item.id} className="flex flex-col bg-[var(--lab-bg)] p-3">
              {/* No stock photography anywhere on this site. The plate is a
                  drawn placeholder and reads as one on purpose. */}
              <button
                type="button"
                onClick={() => setOpenId(item.id)}
                aria-label={item.title}
                className={cn(
                  "mb-2.5 aspect-[4/3] w-full cursor-pointer rounded-md border transition-colors duration-200",
                  item.id === open.id
                    ? "border-[color-mix(in_oklab,var(--lab-accent)_45%,transparent)]"
                    : "border-[var(--lab-line)] hover:border-[var(--lab-line-strong)]",
                )}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, color-mix(in oklab, var(--lab-accent) 9%, transparent) 0 6px, transparent 6px 12px)",
                }}
              >
                <span className="pointer-events-none block p-2 text-left font-mono text-[8.5px] tracking-[0.14em] text-[var(--lab-mute)] uppercase">
                  {item.id}
                </span>
              </button>
              <p className="text-[11.5px] leading-snug font-medium text-[var(--lab-fg)]">
                {item.title}
              </p>
              <p className="mt-0.5 text-[10.5px] text-[var(--lab-mute)]">{item.meta}</p>
              {item.tag ? (
                <span className="mt-1.5 inline-flex">
                  <Pill tone={item.tone ?? "idle"}>{t(item.tag, locale)}</Pill>
                </span>
              ) : null}
              <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                <span className="font-mono text-[11px] tabular-nums text-[var(--lab-fg)]">
                  {item.price}
                </span>
                <GhostButton icon="plus" onClick={() => setCart((list) => [...list, item.id])}>
                  {t(body.addLabel, locale)}
                </GhostButton>
              </div>
            </article>
          ))}
        </div>
      </div>

      <SidePanel eyebrow={t(body.cartLabel, locale)} title={`${cart.length}`}>
        {cart.length === 0 ? (
          <p className="py-3 text-[11.5px] text-[var(--lab-mute)]">{t(body.emptyLabel, locale)}</p>
        ) : (
          <>
            {cart.map((id, i) => {
              const item = body.items.find((candidate) => candidate.id === id);
              return (
                <Field key={`${id}-${i}`} label={`${i + 1}`} value={item?.title ?? ""} />
              );
            })}
            <div className="mt-3 flex items-baseline justify-between border-t border-[var(--lab-line-strong)] pt-3">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--lab-mute)]">
                ₺
              </span>
              <span className="font-mono text-[13px] tabular-nums text-[var(--lab-fg)]">
                {total.toLocaleString("en-US")}
              </span>
            </div>
          </>
        )}
      </SidePanel>
    </div>
  );
}

/* ------------------------------------------------------------------ search */

function SearchView({
  body,
  locale,
  copy,
}: {
  body: Extract<ViewBody, { kind: "search" }>;
  locale: Locale;
  copy: Copy;
}) {
  const [activeId, setActiveId] = useState(body.queries[0]!.id);
  const active = body.queries.find((one) => one.id === activeId) ?? body.queries[0]!;

  return (
    <div className="flex-1 px-3 py-4 @[46rem]/lab:px-5 @[46rem]/lab:py-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--lab-line-strong)] bg-[var(--lab-panel)] px-3 py-2.5">
          <Icon name="search" size={15} className="shrink-0 text-[var(--lab-accent)]" />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--lab-fg)]">
            {t(active.query, locale)}
          </span>
        </div>

        <ul className="mt-2 flex flex-wrap gap-1.5">
          {body.queries.map((one) => (
            <li key={one.id}>
              <button
                type="button"
                aria-pressed={one.id === active.id}
                onClick={() => setActiveId(one.id)}
                className={cn(
                  "max-w-full cursor-pointer truncate rounded-full border px-2.5 py-1 text-[10.5px] transition-colors duration-200",
                  one.id === active.id
                    ? "border-[color-mix(in_oklab,var(--lab-accent)_45%,transparent)] text-[var(--lab-fg)]"
                    : "border-[var(--lab-line)] text-[var(--lab-mute)] hover:text-[var(--lab-dim)]",
                )}
              >
                {t(one.query, locale)}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-lg border border-[color-mix(in_oklab,var(--lab-accent)_30%,transparent)] bg-[color-mix(in_oklab,var(--lab-accent)_9%,transparent)] p-3.5">
          <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--lab-accent)]">
            <Icon name="spark" size={11} />
            {copy.labs.answer}
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--lab-fg)]">
            {t(active.answer, locale)}
          </p>
        </div>

        <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--lab-mute)]">
          {copy.labs.sources}
        </p>
        <ul className="mt-2">
          {active.sources.map((source) => (
            <li
              key={source.title}
              className="flex items-baseline gap-2.5 border-t border-[var(--lab-line)] py-2.5"
            >
              <Icon name="file" size={13} className="translate-y-0.5 shrink-0 text-[var(--lab-mute)]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] text-[var(--lab-dim)]">
                  {source.title}
                </span>
                <span className="block truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--lab-mute)]">
                  {t(source.meta, locale)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ mobile */

function MobileView({
  body,
  locale,
}: {
  body: Extract<ViewBody, { kind: "mobile" }>;
  locale: Locale;
}) {
  return (
    <div className="flex flex-1 flex-wrap items-start gap-6 px-3 py-4 @[46rem]/lab:px-5 @[46rem]/lab:py-6">
      <PhoneShell label={t(body.deviceLabel, locale)}>
        <div className="px-3 pt-1 pb-3">
          <p className="px-1 py-2 text-[14px] font-medium text-[var(--lab-fg)]">
            {t(body.screenTitle, locale)}
          </p>
          <ul className="flex flex-col gap-1.5">
            {body.rows.map((row) => (
              <li
                key={row.title}
                className="rounded-lg border border-[var(--lab-line)] bg-[var(--lab-bg)] p-2.5"
              >
                <p className="text-[11px] leading-snug font-medium text-[var(--lab-fg)]">
                  {row.title}
                </p>
                <p className="mt-0.5 font-mono text-[9.5px] text-[var(--lab-mute)]">{row.meta}</p>
                {row.tag ? (
                  <span className="mt-1.5 inline-flex">
                    <Pill tone={row.tone ?? "idle"}>{t(row.tag, locale)}</Pill>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </PhoneShell>

      <div className="w-full min-w-[220px] max-w-[24rem] flex-1">
        <p className="text-[13px] font-medium text-[var(--lab-fg)]">{t(body.aside.title, locale)}</p>
        <div className="mt-2">
          {body.aside.fields.map((field) => (
            <Field key={field.label.en} label={t(field.label, locale)} value={field.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- command */

function CommandView({
  body,
  locale,
}: {
  body: Extract<ViewBody, { kind: "command" }>;
  locale: Locale;
}) {
  const flat = body.groups.flatMap((group) => group.items);
  const [activeLabel, setActiveLabel] = useState(flat[0]?.label.en ?? "");

  return (
    <div className="flex flex-1 items-start justify-center px-3 py-6 @[46rem]/lab:px-5 @[46rem]/lab:py-10">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--lab-line-strong)] bg-[var(--lab-panel)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--lab-line)] px-3.5 py-3">
          <Icon name="search" size={15} className="shrink-0 text-[var(--lab-accent)]" />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--lab-mute)]">
            {t(body.placeholder, locale)}
          </span>
          <span className="shrink-0 rounded border border-[var(--lab-line-strong)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--lab-mute)]">
            ESC
          </span>
        </div>

        <div className="max-h-[19rem] overflow-y-auto py-1.5">
          {body.groups.map((group) => (
            <div key={group.label.en} className="py-1">
              <p className="px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--lab-mute)]">
                {t(group.label, locale)}
              </p>
              {group.items.map((item) => {
                const selected = item.label.en === activeLabel;
                return (
                  <button
                    key={item.label.en}
                    type="button"
                    aria-pressed={selected}
                    onMouseEnter={() => setActiveLabel(item.label.en)}
                    onFocus={() => setActiveLabel(item.label.en)}
                    onClick={() => setActiveLabel(item.label.en)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left transition-colors duration-150",
                      selected ? "bg-[var(--lab-raise)]" : "hover:bg-[var(--lab-raise)]",
                    )}
                  >
                    <Icon
                      name={item.icon}
                      size={14}
                      className={cn("shrink-0", selected ? "text-[var(--lab-accent)]" : "text-[var(--lab-mute)]")}
                    />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--lab-fg)]">
                      {t(item.label, locale)}
                    </span>
                    {item.meta ? (
                      <span className="hidden shrink-0 font-mono text-[9.5px] text-[var(--lab-mute)] @[30rem]/lab:inline">
                        {item.meta}
                      </span>
                    ) : null}
                    {item.shortcut ? (
                      <span className="shrink-0 rounded border border-[var(--lab-line-strong)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--lab-mute)]">
                        {item.shortcut}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <p className="border-t border-[var(--lab-line)] px-3.5 py-2.5 text-[11px] leading-relaxed text-[var(--lab-mute)]">
          {t(body.hint, locale)}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ states */

function StatesView({
  body,
  locale,
}: {
  body: Extract<ViewBody, { kind: "states" }>;
  locale: Locale;
}) {
  const [activeId, setActiveId] = useState(body.cases[0]!.id);
  const active = body.cases.find((one) => one.id === activeId) ?? body.cases[0]!;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex gap-1.5 border-b border-[var(--lab-line)] px-3 py-2 @[46rem]/lab:px-5">
        {body.cases.map((one) => (
          <button
            key={one.id}
            type="button"
            aria-pressed={one.id === active.id}
            onClick={() => setActiveId(one.id)}
            className={cn(
              "cursor-pointer rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-200",
              one.id === active.id
                ? "border-[color-mix(in_oklab,var(--lab-accent)_45%,transparent)] text-[var(--lab-fg)]"
                : "border-[var(--lab-line)] text-[var(--lab-mute)] hover:text-[var(--lab-dim)]",
            )}
          >
            {t(one.label, locale)}
          </button>
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center px-3 py-8 @[46rem]/lab:px-5">
        <div className="w-full max-w-md text-center">
          {/* The state is drawn, not described. A skeleton looks like a
              skeleton; a failure looks like a failure. */}
          {active.kind === "loading" ? (
            <div className="mx-auto mb-6 w-full max-w-xs" aria-hidden="true">
              {[100, 78, 90, 62].map((width, i) => (
                <span
                  key={i}
                  style={{ width: `${width}%`, animationDelay: `${i * 140}ms` }}
                  className="lab-skeleton mb-2.5 block h-2.5 rounded-full bg-[var(--lab-raise)]"
                />
              ))}
            </div>
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                "mx-auto mb-6 flex size-12 items-center justify-center rounded-full border",
                active.kind === "error"
                  ? "border-[#fb7185]/40 text-[#fb7185]"
                  : "border-[var(--lab-line-strong)] text-[var(--lab-mute)]",
              )}
            >
              <Icon name={active.kind === "error" ? "shield" : "box"} size={20} />
            </span>
          )}

          <p className="text-[15px] font-medium text-[var(--lab-fg)]">{t(active.title, locale)}</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[12px] leading-relaxed text-[var(--lab-dim)]">
            {t(active.body, locale)}
          </p>
          {active.action ? (
            <span className="mt-5 inline-flex">
              <GhostButton tone={active.kind === "error" ? "quiet" : "accent"} icon="arrow">
                {t(active.action, locale)}
              </GhostButton>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- settings */

function SettingsView({
  body,
  locale,
}: {
  body: Extract<ViewBody, { kind: "settings" }>;
  locale: Locale;
}) {
  const initial: Record<string, boolean> = {};
  for (const group of body.groups) {
    for (const row of group.rows) {
      if (row.control === "toggle") initial[row.label.en] = row.on ?? false;
    }
  }
  const [toggles, setToggles] = useState(initial);

  return (
    <div className="flex-1 px-3 py-4 @[46rem]/lab:px-5 @[46rem]/lab:py-6">
      <div className="mx-auto max-w-2xl">
        {body.groups.map((group) => (
          <section key={group.label.en} className="mb-7 last:mb-0">
            <h5 className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--lab-accent)]">
              {t(group.label, locale)}
            </h5>
            <div className="mt-2.5 overflow-hidden rounded-lg border border-[var(--lab-line)]">
              {group.rows.map((row) => {
                const on = toggles[row.label.en] ?? false;
                return (
                  <div
                    key={row.label.en}
                    className="flex items-center gap-4 border-b border-[var(--lab-line)] px-3.5 py-3 last:border-b-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium text-[var(--lab-fg)]">
                        {t(row.label, locale)}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[var(--lab-mute)]">
                        {t(row.detail, locale)}
                      </span>
                    </span>

                    {row.control === "toggle" ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={t(row.label, locale)}
                        onClick={() =>
                          setToggles((state) => ({ ...state, [row.label.en]: !on }))
                        }
                        className={cn(
                          "relative h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors duration-300",
                          on
                            ? "border-transparent bg-[var(--lab-accent)]"
                            : "border-[var(--lab-line-strong)] bg-[var(--lab-raise)]",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute top-1/2 block size-3.5 -translate-y-1/2 rounded-full transition-[left] duration-300 ease-[var(--ease-out-expo)]",
                            on ? "left-[1.15rem] bg-[var(--lab-on-accent)]" : "left-[0.15rem] bg-[var(--lab-mute)]",
                          )}
                        />
                      </button>
                    ) : (
                      <span className="shrink-0 rounded-md border border-[var(--lab-line-strong)] px-2.5 py-1 font-mono text-[10px] text-[var(--lab-dim)]">
                        {row.value}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export { cellText, tl };
