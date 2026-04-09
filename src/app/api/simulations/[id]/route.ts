import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  // agents + reactions werden durch CASCADE automatisch gelöscht
  const { error } = await supabase
    .from("simulations").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  return NextResponse.json({ success: true });
}
