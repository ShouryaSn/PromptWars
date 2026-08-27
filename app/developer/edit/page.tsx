import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeveloperProfileForm from "@/components/DeveloperProfileForm";
import type { DeveloperProfileRow } from "@/lib/developer";

export default async function DeveloperEditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("developer_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Middleware already guarantees a profile exists for any /developer/* route
  // other than /developer/profile — this is just a safety net.
  if (!profile) redirect("/developer/profile");

  return <DeveloperProfileForm mode="edit" initial={profile as DeveloperProfileRow} />;
}
