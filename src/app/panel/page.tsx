import Link from "next/link";
import type { ReactNode } from "react";
import { authConfig } from "@/lib/fleet/auth";
import { isAuthed } from "@/lib/fleet/server";
import { listLeads } from "@/lib/leadStore";
import { dayOf, readVisits, statsRepo, type Visit } from "@/lib/stats/store";
import { Giris } from "./Giris";

export const dynamic = "force-dynamic";

const RANGES = [1, 7, 30, 90];

function top(list: string[], limit = 15): [string, number][] {
  const count = new Map<string, number>();
  for (const one of list) if (one) count.set(one, (count.get(one) ?? 0) + 1);
  return [...count].sort((a, b) => b[1] - a[1]).slice(0, limit);
}
const minutes = (sec: number) => (sec >= 60 ? `${Math.floor(sec / 60)} dk ${sec % 60} sn` : `${sec} sn`);

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  if (!(await isAuthed())) return <Giris configured={authConfig() !== null} />;
  const asked = Number((await searchParams).gun);
  const days = RANGES.includes(asked) ? asked : 7;
  const store = statsRepo();
  const visits = (await readVisits(days)).sort((a, b) => b.at.localeCompare(a.at));
  const leads = await listLeads().catch(() => []);

  const people = new Map<string, Visit[]>();
  for (const visit of visits) people.set(visit.s, [...(people.get(visit.s) ?? []), visit]);
  const events = visits.flatMap((visit) => visit.events.map((event) => ({ ...event, path: visit.path })));
  const of = (k: string) => events.filter((event) => event.k === k);
  const sections = new Map<string, { n: number; people: number }>();
  for (const event of of("section")) {
    const had = sections.get(event.l) ?? { n: 0, people: 0 };
    sections.set(event.l, { n: had.n + (event.n ?? 0), people: had.people + 1 });
  }
  const average = visits.length ? Math.round(visits.reduce((sum, one) => sum + one.sec, 0) / visits.length) : 0;
  const scroll = visits.length ? Math.round(visits.reduce((sum, one) => sum + one.scroll, 0) / visits.length) : 0;
  const perDay = Array.from({ length: Math.min(days, 30) }, (_, i) => dayOf(new Date(Date.now() - i * 86_400_000))).reverse();
  const daily = perDay.map((day) => ({ day, n: new Set(visits.filter((v) => v.at.startsWith(day)).map((v) => v.s)).size }));
  const peak = Math.max(1, ...daily.map((one) => one.n));

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 20 }}>
      <div className="fl-head">
        <div>
          <h1>Site paneli</h1>
          <p>Kim geldi, nereye baktı, neye bastı. Çerez ve kişisel bilgi yok.</p>
        </div>
        <div className="fl-actions">
          {RANGES.map((one) => (
            <Link key={one} href={`/panel?gun=${one}`} className={`fl-btn small${one === days ? " primary" : ""}`}>
              {one === 1 ? "Bugün" : `${one} gün`}
            </Link>
          ))}
        </div>
      </div>

      {!store ? (
        <div className="fl-card" role="alert">
          <b>Veri kaydedilmiyor.</b> FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL ve FIREBASE_PRIVATE_KEY değişkenleri Vercel&apos;de tanımlı değil.
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", margin: "16px 0" }}>
        {[
          ["Ziyaretçi", people.size],
          ["Sayfa görüntüleme", visits.length],
          ["Sayfada ortalama", minutes(average)],
          ["Ortalama kaydırma", `%${scroll}`],
          ["WhatsApp tıklaması", of("wa").length],
          ["Form gönderimi", of("form").filter((one) => one.l.startsWith("gönder")).length],
          ["Dünyaya giren", new Set(visits.filter((v) => v.events.some((e) => e.k === "world")).map((v) => v.s)).size],
          ["Gelen talep", leads.length],
        ].map(([label, value]) => (
          <div key={label} className="fl-card fl-kpi">
            <div className="label">{label}</div>
            <div className="value">{value}</div>
          </div>
        ))}
      </div>

      {days > 1 ? (
        <Card title="Günlük ziyaretçi">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
            {daily.map((one) => (
              <div key={one.day} title={`${one.day}: ${one.n}`} style={{ flex: 1, height: `${Math.max(2, (one.n / peak) * 100)}%`, background: "#ff7300" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7, marginTop: 6 }}>
            <span>{perDay[0]}</span>
            <span>en çok {peak}</span>
            <span>{perDay.at(-1)}</span>
          </div>
        </Card>
      ) : null}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <Table title="Sayfalar" rows={top(visits.map((v) => v.path))} />
        <Table title="En çok tıklananlar" rows={top(of("click").map((one) => one.l), 25)} />
        <Table
          title="En uzun bakılan bölümler"
          rows={[...sections].sort((a, b) => b[1].n - a[1].n).slice(0, 20).map(([name, one]) => [`${name} (${one.people} kez)`, minutes(one.n)])}
        />
        <Table title="WhatsApp nereden" rows={top(of("wa").map((one) => one.l))} />
        <Table title="Form" rows={top(of("form").map((one) => one.l))} />
        <Table title="Dünyada gidilen yerler" rows={top(of("world").map((one) => one.l))} />
        <Table title="Nereden geldiler" rows={top([...people.values()].map((list) => list.at(-1)!).map((v) => v.src || v.ref || "doğrudan"))} />
        <Table title="Şehir" rows={top([...people.values()].map((list) => [list[0]!.city, list[0]!.country].filter(Boolean).join(", ") || "bilinmiyor"))} />
        <Table title="Cihaz" rows={top([...people.values()].map((list) => list[0]!.device))} />
      </div>

      <Card title="Gelen talepler">
        {leads.length === 0 ? <p className="muted">Henüz kayıtlı talep yok.</p> : null}
        {leads.slice(0, 50).map((lead, i) => (
          <details key={i} style={{ borderTop: "1px solid #8884", padding: "8px 0" }}>
            <summary>
              {String(lead.createdAt ?? "").slice(0, 16).replace("T", " ")} · <b>{String(lead.name ?? "")}</b> · {String(lead.email ?? "")} {lead.phone ? `· ${String(lead.phone)}` : ""}
            </summary>
            <p style={{ whiteSpace: "pre-wrap" }}>{String(lead.message ?? lead.description ?? "")}</p>
          </details>
        ))}
      </Card>

      <Card title="Son ziyaretler">
        {[...people.values()].slice(0, 40).map((list) => {
          const path = [...list].reverse();
          const first = path[0]!;
          return (
            <details key={first.s + first.id} style={{ borderTop: "1px solid #8884", padding: "8px 0" }}>
              <summary>
                {first.at.slice(5, 16).replace("T", " ")} · {first.city || "?"} · {first.device} · {first.src || first.ref || "doğrudan"} · {list.length} sayfa, {minutes(list.reduce((sum, v) => sum + v.sec, 0))}
              </summary>
              <ol>
                {path.map((v) => (
                  <li key={v.id}>
                    <b>{v.path}</b> · {minutes(v.sec)} · %{v.scroll}
                    {v.events.length ? <div style={{ opacity: 0.8 }}>{v.events.map((e) => (e.k === "section" ? `${e.l} ${e.n}sn` : `[${e.l}]`)).join(" · ")}</div> : null}
                  </li>
                ))}
              </ol>
            </details>
          );
        })}
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="fl-card" style={{ margin: "12px 0" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

function Table({ title, rows }: { title: string; rows: [string, number | string][] }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? <p className="muted">Veri yok.</p> : null}
      <table style={{ width: "100%" }}>
        <tbody>
          {rows.map(([name, value]) => (
            <tr key={name}>
              <td style={{ wordBreak: "break-word" }}>{name}</td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
