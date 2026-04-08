import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service Role Client — umgeht RLS für Insert + schützt vor Anon-Reads
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };

  if (!email || !email.includes("@") || email.length > 320) {
    return NextResponse.json(
      { error: "Gültige E-Mail-Adresse erforderlich" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { error } = await supabase
    .from("waitlist")
    .upsert({ email: email.toLowerCase().trim() }, { onConflict: "email" });

  if (error) {
    console.error("Waitlist insert error:", error);
    return NextResponse.json(
      { error: "Konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
