import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { data: sim } = await supabase
    .from("simulations")
    .select("id, sim_type, status, agent_count, sim_depth, created_at, completed_at, result_data, input_data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!sim) {
    return NextResponse.json({ error: "Simulation nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(sim);
}
