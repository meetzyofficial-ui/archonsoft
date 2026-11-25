import { redirect } from "next/navigation";
import { LoginForm } from "@/components/fleet/client";
import { authConfig } from "@/lib/fleet/auth";
import { isAuthed } from "@/lib/fleet/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Giriş" };

export default async function LoginPage() {
  if (await isAuthed()) redirect("/fleet");
  return (
    <div className="fl-login">
      <div className="fl-card">
        <span className="fl-mark" aria-hidden>
          A
        </span>
        <h1>Archon Fleet</h1>
        <p className="muted" style={{ margin: 0 }}>
          Filo yönetim paneli
        </p>
        <LoginForm configured={authConfig() !== null} />
      </div>
    </div>
  );
}
