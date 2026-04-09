import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name ist Pflicht" }, { status: 400 });

  const { error } = await supabase
    .from("simulations").update({ name: name.trim() }).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Umbenennen fehlgeschlagen" }, { status: 500 });
  return NextResponse.json({ success: true });
}
