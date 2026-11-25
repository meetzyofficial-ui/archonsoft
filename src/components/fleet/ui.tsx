/**
 * Archon Fleet — sunucuda çizilen küçük parçalar (hook yok).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { formatDateTR, formatTRY, type Alert, type RentalPaymentState } from "@/lib/fleet/calc";
import { LABELS, type RentalStatus, type VehicleStatus } from "@/lib/fleet/types";

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="fl-head">
      <div>
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      {actions ? <div className="fl-actions">{actions}</div> : null}
    </div>
  );
}

export function Kpi({ label, value, sub, primary, tone }: { label: string; value: ReactNode; sub?: ReactNode; primary?: boolean; tone?: "neg" | "pos" }) {
  return (
    <div className={`fl-card fl-kpi${primary ? " primary" : ""}`}>
      <div className="label">{label}</div>
      <div className={`value${tone ? ` ${tone}` : ""}`}>{value}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  );
}

export const Money = ({ v, signed }: { v: number; signed?: boolean }) => (
  <span className={`num${signed && v < 0 ? " neg" : ""}`}>{formatTRY(v)}</span>
);

export const D = ({ v }: { v: string | null | undefined }) => <span className="num">{formatDateTR(v)}</span>;

export function Badge({ tone, children }: { tone?: "green" | "amber" | "red" | "blue"; children: ReactNode }) {
  return <span className={`fl-badge${tone ? ` ${tone}` : ""}`}>{children}</span>;
}

export function VehicleBadge({ status }: { status: VehicleStatus }) {
  const tone = status === "rented" ? "green" : status === "maintenance" ? "amber" : status === "available" ? "blue" : undefined;
  return <Badge tone={tone}>{LABELS.vehicleStatus[status]}</Badge>;
}

export const PAYMENT_STATE_LABEL: Record<RentalPaymentState, string> = {
  cancelled: "İptal",
  overdue: "Gecikmiş",
  "due-soon": "Ödeme yaklaşıyor",
  ok: "Güncel",
  "paid-up": "Ödendi",
  closed: "Kapandı",
  "open-balance": "Açık bakiye",
};

export function PaymentStateBadge({ state }: { state: RentalPaymentState }) {
  const tone = state === "overdue" || state === "open-balance" ? "red" : state === "due-soon" ? "amber" : state === "ok" || state === "paid-up" ? "green" : undefined;
  return <Badge tone={tone}>{PAYMENT_STATE_LABEL[state]}</Badge>;
}

export function RentalStatusBadge({ status }: { status: RentalStatus }) {
  return <Badge tone={status === "active" ? "green" : undefined}>{LABELS.rentalStatus[status]}</Badge>;
}

export function AlertList({ alerts, limit }: { alerts: Alert[]; limit?: number }) {
  if (!alerts.length) return <div className="fl-empty">Uyarı yok. Her şey yolunda.</div>;
  const shown = limit ? alerts.slice(0, limit) : alerts;
  return (
    <ul className="fl-alerts">
      {shown.map((a, i) => (
        <li key={i} className={a.severity}>
          <Link href={a.href}>
            <span className="dot" aria-hidden />
            <span>
              <b>{a.title}</b>
              <span>{a.detail}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Basit tablo (sunucuda; arama gerekmeyen küçük listeler için). */
export function MiniTable({ head, rows, empty = "Kayıt yok.", right = [] }: { head: string[]; rows: ReactNode[][]; empty?: string; right?: number[] }) {
  return (
    <div className="fl-tablewrap">
      <table className="fl-table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className={right.includes(i) ? "r" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="fl-empty">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className={right.includes(j) ? "r num" : undefined}>
                    {c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Grafikler (SVG, kütüphanesiz)                                       */
/* ------------------------------------------------------------------ */

const compact = (kurus: number) => {
  const tl = kurus / 100;
  const abs = Math.abs(tl);
  const s = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}M` : abs >= 1000 ? `${Math.round(abs / 1000)}B` : `${Math.round(abs)}`;
  return `${tl < 0 ? "−" : ""}${s}`;
};

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function GroupedBars({
  labels,
  series,
  height = 220,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
}) {
  const W = 640;
  const H = height;
  const pad = { l: 44, r: 8, t: 10, b: 26 };
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const group = plotW / Math.max(1, labels.length);
  const barW = Math.max(3, Math.min(22, (group * 0.7) / series.length));
  const y = (v: number) => pad.t + plotH - (Math.max(0, v) / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const summary = labels.map((l, i) => `${l}: ${series.map((s) => `${s.name} ${formatTRY(s.values[i] ?? 0)}`).join(", ")}`).join("; ");

  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="fl-chart" role="img" aria-label={summary}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#eef0f5" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end">
              {compact(t)}
            </text>
          </g>
        ))}
        {labels.map((label, i) => {
          const gx = pad.l + i * group + (group - barW * series.length) / 2;
          return (
            <g key={label + i}>
              {series.map((s, j) => {
                const v = s.values[i] ?? 0;
                return (
                  <rect key={s.name} x={gx + j * barW} y={y(v)} width={barW - 2} height={pad.t + plotH - y(v)} rx={2} fill={s.color}>
                    <title>{`${label} · ${s.name}: ${formatTRY(v)}`}</title>
                  </rect>
                );
              })}
              <text x={pad.l + i * group + group / 2} y={H - 8} textAnchor="middle">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="fl-legend">
        {series.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function HBars({ items }: { items: { label: string; value: number }[] }) {
  if (!items.length) return <div className="fl-empty">Veri yok.</div>;
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  const hasNeg = items.some((i) => i.value < 0);
  const W = 640;
  const row = 28;
  const labelW = 110;
  const valueW = 100;
  const plot = W - labelW - valueW;
  const zero = labelW + (hasNeg ? plot / 2 : 0);
  const scale = (hasNeg ? plot / 2 : plot) / max;
  const H = items.length * row + 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fl-chart" role="img" aria-label={items.map((i) => `${i.label}: ${formatTRY(i.value)}`).join("; ")}>
      {hasNeg ? <line x1={zero} x2={zero} y1={0} y2={H} stroke="#d5d9e3" /> : null}
      {items.map((it, i) => {
        const w = Math.abs(it.value) * scale;
        const x = it.value >= 0 ? zero : zero - w;
        const yy = i * row + 4;
        return (
          <g key={it.label + i}>
            <text x={0} y={yy + 15}>
              {it.label}
            </text>
            <rect x={x} y={yy + 3} width={Math.max(1, w)} height={16} rx={3} fill={it.value >= 0 ? "#0b0f1a" : "#b42318"} />
            <text x={W} y={yy + 15} textAnchor="end" style={{ fill: it.value < 0 ? "#b42318" : "#0b0f1a" }}>
              {formatTRY(it.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StoreNotice({ message }: { message: string }) {
  return (
    <div className="fl-notice red" role="alert">
      <b>Veriler yüklenemedi.</b> {message}
    </div>
  );
}
