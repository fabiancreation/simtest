import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-text-muted mt-1">Dein Konto und Plan</p>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
        <div>
          <p className="text-sm text-text-muted">E-Mail</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Plan</p>
          <p className="font-medium capitalize">{profile?.plan ?? "free"}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Runs diesen Monat</p>
          <p className="font-medium">
            {profile?.runs_used ?? 0} / {profile?.runs_limit ?? 3}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-semibold mb-3">Plan upgraden</h3>
        <p className="text-sm text-text-muted mb-4">
          Stripe-Integration wird in Phase 2 aktiviert.
        </p>
        <button
          disabled
          className="rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent cursor-not-allowed"
        >
          Bald verfuegbar
        </button>
      </div>
    </div>
  );
}
