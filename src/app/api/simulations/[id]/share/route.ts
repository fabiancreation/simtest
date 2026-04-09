import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  // Prüfe ob Simulation dem User gehört
  const { data: sim } = await supabase
    .from("simulations").select("id, share_token, share_enabled")
    .eq("id", id).eq("user_id", user.id).single();
  if (!sim) return NextResponse.json({ error: "Simulation nicht gefunden" }, { status: 404 });

  // Token existiert bereits? Reaktivieren
  if (sim.share_token && sim.share_enabled) {
    return NextResponse.json({ token: sim.share_token, shareUrl: `/share/${sim.share_token}` });
  }

  const token = sim.share_token || crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 Tage

  await supabase.from("simulations").update({
    share_token: token,
    share_enabled: true,
    share_expires_at: expiresAt,
  }).eq("id", id);

  return NextResponse.json({ token, shareUrl: `/share/${token}`, expiresAt });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  await supabase.from("simulations").update({
    share_enabled: false,
  }).eq("id", id).eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
