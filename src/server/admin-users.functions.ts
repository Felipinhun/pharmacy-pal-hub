import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

const APP_ROLES = ["visitadora", "prescritor", "atendente", "admin"] as const;
const roleSchema = z.enum(APP_ROLES);

type AdminContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

async function requireAdmin(context: AdminContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });

  if (error || !data) {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as AdminContext);

    const [profilesRes, rolesRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email").order("full_name", { ascending: true }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (rolesRes.error) throw rolesRes.error;

    const roleMap = new Map<string, (typeof APP_ROLES)[number]>();
    rolesRes.data?.forEach((roleRow) => {
      roleMap.set(roleRow.user_id, roleRow.role);
    });

    return (profilesRes.data ?? []).map((profile) => ({
      ...profile,
      role: roleMap.get(profile.id) ?? null,
    }));
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        full_name: z.string().trim().min(2, "Informe o nome completo.").max(120),
        email: z.string().trim().email("Informe um email válido.").max(255).transform((email) => email.toLowerCase()),
        password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres.").max(72),
        role: roleSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as AdminContext);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });

    if (authError) throw authError;

    const userId = authData.user.id;
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: data.full_name, email: data.email }, { onConflict: "id" });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: data.role,
    });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw roleError;
    }

    return { success: true, userId };
  });

export const updateAdminUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        role: roleSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as AdminContext);

    const { error: deleteError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabaseAdmin.from("user_roles").insert({
      user_id: data.userId,
      role: data.role,
    });
    if (insertError) throw insertError;

    return { success: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as AdminContext);

    if (data.userId === (context as AdminContext).userId) {
      throw new Error("Você não pode excluir o próprio usuário administrador.");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;

    return { success: true };
  });