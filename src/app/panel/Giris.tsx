"use client";

import { useState, type FormEvent } from "react";

export function Giris({ configured }: { configured: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const password = new FormData(event.currentTarget).get("password");
    const res = await fetch("/api/fleet/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) }).catch(() => null);
    if (res?.ok) window.location.reload();
    else {
      setError(((await res?.json().catch(() => null)) as { error?: string } | null)?.error ?? "Giriş yapılamadı.");
      setBusy(false);
    }
  };
  return (
    <div className="fl-login">
      <div className="fl-card">
        <h1>Archon Panel</h1>
        {configured ? (
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label>
              Şifre (Fleet paneliyle aynı)
              <input name="password" type="password" autoComplete="current-password" required autoFocus style={{ width: "100%", padding: 10 }} />
            </label>
            {error ? <p role="alert">{error}</p> : null}
            <button className="fl-btn primary" disabled={busy}>
              Giriş yap
            </button>
          </form>
        ) : (
          <p>Giriş yapılandırılmamış: FLEET_PASSWORD_HASH ve FLEET_SESSION_SECRET gerekli.</p>
        )}
      </div>
    </div>
  );
}
