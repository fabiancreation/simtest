import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  // Service client umgeht RLS — wir filtern manuell nach user_id
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await service
    .from("projects")
    .select("*, simulations(count), persona_profiles(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Laden fehlgeschlagen" }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Projektname ist Pflicht" }, { status: 400 });
  }

  // Service client umgeht RLS — User-ID wird manuell gesetzt
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await service
    .from("projects")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      description: body.description?.trim() ?? "",
      color: body.color ?? "#6ee7b7",
    })
    .select()
    .single();

  if (error) {
    console.error("Project create error:", error);
    return NextResponse.json({ error: "Erstellen fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
