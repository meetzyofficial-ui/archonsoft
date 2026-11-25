"use client";

/**
 * Archon Fleet — tarayıcı tarafı bileşenler.
 *
 * Hesap yapmazlar: sunucu her sayfayı hesaplanmış verilerle gönderir, bu
 * bileşenler yalnızca arama/filtre/sayfalama yapar ve formları
 * /api/fleet/mutate'e iletir. Kayıt başarılı olunca sayfa sunucudan yeniden
 * çizilir (router.refresh) — ekranda görünen her rakam yine sunucudan gelir.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  İskelet                                                             */
/* ------------------------------------------------------------------ */

const NAV: { href: string; label: string }[] = [
  { href: "/fleet", label: "Dashboard" },
  { href: "/fleet/araclar", label: "Araçlar" },
  { href: "/fleet/suruculer", label: "Sürücüler" },
  { href: "/fleet/kiralamalar", label: "Kiralamalar" },
  { href: "/fleet/tahsilatlar", label: "Tahsilatlar" },
  { href: "/fleet/giderler", label: "Giderler" },
  { href: "/fleet/kasa", label: "Kasa" },
  { href: "/fleet/bakim", label: "Bakım ve Km" },
  { href: "/fleet/raporlar", label: "Raporlar" },
  { href: "/fleet/ayarlar", label: "Ayarlar" },
];

export function Shell({ children, alertCount }: { children: ReactNode; alertCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/fleet" ? pathname === "/fleet" : pathname.startsWith(href));

  return (
    <div className="fl-app" data-menu={open ? "open" : "closed"}>
      <aside className="fl-side" aria-label="Fleet menüsü">
        <div className="fl-brand">
          <span className="fl-mark" aria-hidden>
            A
          </span>
          <span>
            Archon Fleet
            <small>Filo yönetimi</small>
          </span>
        </div>
        <nav className="fl-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
              {item.label}
              {item.href === "/fleet" && alertCount > 0 ? <span className="fl-badge red">{alertCount}</span> : null}
            </Link>
          ))}
        </nav>
        <div className="fl-side-foot">
          <LogoutButton />
        </div>
      </aside>
      <div>
        <div className="fl-top">
          <button type="button" className="fl-btn small" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            ☰ Menü
          </button>
          <strong>Archon Fleet</strong>
          {alertCount > 0 ? (
            <Link href="/fleet" className="fl-badge red">
              {alertCount} uyarı
            </Link>
          ) : (
            <span />
          )}
        </div>
        <main className="fl-main">{children}</main>
      </div>
    </div>
  );
}

function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="fl-btn small"
      style={{ width: "100%", background: "transparent", color: "#c9cfdb", borderColor: "#2a3142" }}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/fleet/auth", { method: "DELETE" }).catch(() => undefined);
        window.location.href = "/fleet/giris";
      }}
    >
      Çıkış yap
    </button>
  );
}

export function LoginForm({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/fleet/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        window.location.href = "/fleet";
        return;
      }
      setError(json.error ?? "Giriş yapılamadı.");
    } catch {
      setError("Sunucuya ulaşılamadı.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 18 }}>
      {!configured ? (
        <div className="fl-notice red">Giriş yapılandırılmamış. FLEET_PASSWORD_HASH ve FLEET_SESSION_SECRET ayarlanmalı.</div>
      ) : null}
      <div className="fl-field">
        <label htmlFor="pw">Şifre</label>
        <input
          id="pw"
          className="fl-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
      </div>
      {error ? <div className="fl-formerr">{error}</div> : null}
      <button className="fl-btn primary" disabled={busy || !configured}>
        {busy ? "Kontrol ediliyor…" : "Giriş"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Tablo                                                               */
/* ------------------------------------------------------------------ */

export type Option = { value: string; label: string };

export interface TableRow {
  key: string;
  cells: ReactNode[];
  /** Arama kutusunun bakacağı düz metin. */
  search: string;
  /** Filtre anahtarı → değer. */
  tags?: Record<string, string>;
  className?: string;
}

export interface TableColumn {
  label: string;
  align?: "right";
}

export function DataTable({
  columns,
  rows,
  filters = [],
  pageSize = 25,
  empty = "Kayıt yok.",
  footer,
  initialQuery = "",
  searchPlaceholder = "Ara…",
}: {
  columns: TableColumn[];
  rows: TableRow[];
  filters?: { key: string; label: string; options: Option[] }[];
  pageSize?: number;
  empty?: string;
  footer?: ReactNode[];
  initialQuery?: string;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return rows.filter(
      (row) =>
        (!q || row.search.toLocaleLowerCase("tr-TR").includes(q)) &&
        Object.entries(active).every(([k, v]) => !v || row.tags?.[k] === v),
    );
  }, [rows, query, active]);

  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = visible.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div>
      <div className="fl-toolbar">
        <input
          className="fl-input grow"
          type="search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          aria-label="Ara"
        />
        {filters.map((f) => (
          <select
            key={f.key}
            className="fl-select"
            style={{ width: "auto" }}
            value={active[f.key] ?? ""}
            aria-label={f.label}
            onChange={(e) => {
              setActive((a) => ({ ...a, [f.key]: e.target.value }));
              setPage(0);
            }}
          >
            <option value="">{f.label}: tümü</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
      </div>
      <div className="fl-tablewrap">
        <table className="fl-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} className={c.align === "right" ? "r" : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="fl-empty">
                  {rows.length === 0 ? empty : "Aramayla eşleşen kayıt yok."}
                </td>
              </tr>
            ) : (
              slice.map((row) => (
                <tr key={row.key} className={row.className}>
                  {row.cells.map((cell, i) => (
                    <td key={i} className={columns[i]?.align === "right" ? "r num" : undefined}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footer ? (
            <tfoot>
              <tr>
                {footer.map((cell, i) => (
                  <td key={i} className={columns[i]?.align === "right" ? "r num" : undefined}>
                    {cell}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      <div className="fl-pager">
        <span>
          {visible.length} kayıt{visible.length !== rows.length ? ` (toplam ${rows.length})` : ""}
        </span>
        {pages > 1 ? (
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button type="button" className="fl-btn small" disabled={current === 0} onClick={() => setPage(current - 1)}>
              ‹ Önceki
            </button>
            {current + 1} / {pages}
            <button type="button" className="fl-btn small" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              Sonraki ›
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Form                                                                */
/* ------------------------------------------------------------------ */

export interface Field {
  name: string;
  label: string;
  type: "text" | "money" | "int" | "date" | "select" | "textarea" | "checkbox" | "tel";
  options?: Option[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
  full?: boolean;
  /** Select'te boş seçenek metni (verilirse boş seçilebilir). */
  emptyLabel?: string;
}

type Values = Record<string, string>;
type ApiResponse = { ok?: boolean; error?: string; errors?: Record<string, string>; warning?: boolean };

export function RecordForm({
  op,
  fields,
  initial = {},
  hidden = {},
  submitLabel = "Kaydet",
  description,
  onDone,
  onCancel,
}: {
  op: string;
  fields: Field[];
  initial?: Values;
  hidden?: Record<string, string>;
  submitLabel?: string;
  description?: ReactNode;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(force: boolean) {
    setBusy(true);
    setError("");
    setErrors({});
    try {
      const res = await fetch("/api/fleet/mutate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op, input: { ...hidden, ...values, ...(force ? { force: true } : {}) } }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiResponse;
      if (res.status === 401) {
        window.location.href = "/fleet/giris";
        return;
      }
      if (res.ok && json.ok) {
        setWarning("");
        onDone?.();
        router.refresh();
      } else if (json.warning) {
        setWarning(json.error ?? "Onay gerekiyor.");
        setErrors(json.errors ?? {});
      } else {
        setError(json.error ?? "Kaydedilemedi.");
        setErrors(json.errors ?? {});
      }
    } catch {
      setError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
    }
    setBusy(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send(false);
      }}
    >
      <div className="body">
        {description ? <div style={{ marginBottom: 14 }}>{description}</div> : null}
        <div className="fl-form">
          {fields.map((f) => (
            <FieldInput
              key={f.name}
              field={f}
              value={values[f.name] ?? ""}
              error={errors[f.name]}
              onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
            />
          ))}
          {error ? <div className="fl-formerr" role="alert">{error}</div> : null}
          {warning ? (
            <div className="fl-formwarn" role="alert">
              {warning}{" "}
              <button type="button" className="fl-btn small" onClick={() => void send(true)} disabled={busy}>
                Yine de kaydet
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <footer>
        {onCancel ? (
          <button type="button" className="fl-btn" onClick={onCancel}>
            Vazgeç
          </button>
        ) : null}
        <button className="fl-btn primary" disabled={busy}>
          {busy ? "Kaydediliyor…" : submitLabel}
        </button>
      </footer>
    </form>
  );
}

function FieldInput({ field, value, error, onChange }: { field: Field; value: string; error?: string; onChange: (v: string) => void }) {
  const id = `f-${field.name}`;
  const common = { id, name: field.name, required: field.required, "aria-invalid": error ? true : undefined } as const;
  let control: ReactNode;
  switch (field.type) {
    case "select":
      control = (
        <select {...common} className="fl-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {!field.required || !value ? <option value="">{field.emptyLabel ?? "— Seçin —"}</option> : null}
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "textarea":
      control = <textarea {...common} className="fl-textarea" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
      break;
    case "checkbox":
      return (
        <div className={`fl-field${field.full ? " full" : ""}`}>
          <label className="fl-check">
            <input type="checkbox" checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "")} /> {field.label}
          </label>
        </div>
      );
    default:
      control = (
        <input
          {...common}
          className="fl-input"
          type={field.type === "date" ? "date" : field.type === "tel" ? "tel" : "text"}
          inputMode={field.type === "money" ? "decimal" : field.type === "int" ? "numeric" : undefined}
          value={value}
          placeholder={field.placeholder ?? (field.type === "money" ? "0,00" : undefined)}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      );
  }
  return (
    <div className={`fl-field${field.full ? " full" : ""}${error ? " has-err" : ""}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required ? " *" : ""}
      </label>
      {control}
      {error ? <span className="err">{error}</span> : field.hint ? <span className="hint">{field.hint}</span> : null}
    </div>
  );
}

/** Bir düğme + açılır pencerede form. Tüm "Yeni …", "Düzenle", "İptal et" işlemleri bununla. */
export function FormDialog({
  title,
  buttonLabel,
  buttonClass = "fl-btn primary",
  ...form
}: {
  title: string;
  buttonLabel: ReactNode;
  buttonClass?: string;
  op: string;
  fields: Field[];
  initial?: Values;
  hidden?: Record<string, string>;
  submitLabel?: string;
  description?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [key, setKey] = useState(0);
  const close = () => ref.current?.close();
  return (
    <>
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          setKey((k) => k + 1);
          ref.current?.showModal();
        }}
      >
        {buttonLabel}
      </button>
      <dialog ref={ref} className="fl-dialog" aria-label={title}>
        <header>
          <h3>{title}</h3>
          <button type="button" className="fl-btn small" onClick={close} aria-label="Kapat">
            ✕
          </button>
        </header>
        <RecordForm key={key} {...form} onDone={close} onCancel={close} />
      </dialog>
    </>
  );
}

/** Rapor tarih aralığı seçici (özel aralık). */
export function RangePicker({ from, to, base }: { from: string; to: string; base: string }) {
  const router = useRouter();
  const [a, setA] = useState(from);
  const [b, setB] = useState(to);
  return (
    <form
      className="fl-toolbar"
      style={{ margin: 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`${base}?aralik=custom&bas=${a}&bit=${b}`);
      }}
    >
      <input className="fl-input" style={{ width: "auto" }} type="date" value={a} onChange={(e) => setA(e.target.value)} aria-label="Başlangıç" />
      <input className="fl-input" style={{ width: "auto" }} type="date" value={b} onChange={(e) => setB(e.target.value)} aria-label="Bitiş" />
      <button className="fl-btn">Uygula</button>
    </form>
  );
}
