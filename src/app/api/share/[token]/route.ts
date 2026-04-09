import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Service client für öffentlichen Zugriff (kein Auth nötig)
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: sim, error } = await supabase
    .from("simulations")
    .select("id, sim_type, status, agent_count, sim_depth, created_at, completed_at, total_rounds, input_data, result_data, name")
    .eq("share_token", token)
    .eq("share_enabled", true)
    .single();

  if (error || !sim) {
    return NextResponse.json({ error: "Report nicht gefunden oder abgelaufen" }, { status: 404 });
  }

  // Ablaufdatum prüfen
  const { data: fullSim } = await supabase
    .from("simulations").select("share_expires_at").eq("share_token", token).single();
  if (fullSim?.share_expires_at && new Date(fullSim.share_expires_at) < new Date()) {
    return NextResponse.json({ error: "Share-Link ist abgelaufen" }, { status: 410 });
  }

  return NextResponse.json(sim);
}
