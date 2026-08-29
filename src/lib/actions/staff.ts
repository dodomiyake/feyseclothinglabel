"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

export interface StaffActionState {
  error?: string;
}

const STAFF_ROLES: UserRole[] = ["admin", "production"];

export async function createStaffAction(_prev: StaffActionState, formData: FormData): Promise<StaffActionState> {
  await requireProfile("admin");

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "") as UserRole;

  if (!fullName || !email || !password) return { error: "Name, email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!STAFF_ROLES.includes(role)) return { error: "Choose a role." };

  const adminDb = createAdminClient();
  // email_confirm: true — this account is created and vouched for by an
  // admin, not self-registered, so it skips the confirmation-email step
  // customers go through and is usable to sign in immediately.
  const { error } = await adminDb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("already registered")
        ? "An account with this email already exists."
        : "Could not create this account. Please try again.",
    };
  }

  revalidatePath("/admin/settings/team");
  redirect("/admin/settings/team");
}

/**
 * Blocks or restores sign-in for a staff account via the Auth admin API, the
 * same mechanism used for deactivating customer accounts — there's no local
 * "active" flag on profiles, so the ban status on auth.users is the source
 * of truth for staff.
 */
export async function toggleStaffActiveAction(formData: FormData) {
  await requireProfile("admin");
  const userId = String(formData.get("user_id") || "");
  const currentlyBanned = formData.get("banned") === "true";
  if (!userId) return;

  const adminDb = createAdminClient();
  const { error } = await adminDb.auth.admin.updateUserById(userId, {
    ban_duration: currentlyBanned ? "none" : "876000h",
  });
  if (error) console.error("[toggleStaffActiveAction] failed to update auth ban status:", error);

  revalidatePath("/admin/settings/team");
}
