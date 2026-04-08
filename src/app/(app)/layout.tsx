import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen noise-overlay">
      <Sidebar userEmail={user.email ?? ""} />
      <main className="flex-1 p-5 lg:p-8 pt-18 lg:pt-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
