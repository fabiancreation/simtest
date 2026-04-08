import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { data: run } = await supabase
    .from("runs")
    .select("id, status, stimulus_type, agent_count, created_at, completed_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!run) {
    return NextResponse.json({ error: "Run nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(run);
}
