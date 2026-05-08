import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const APP_ROLES = ["visitadora", "prescritor", "atendente", "admin"] as const;
const roleSchema = z.enum(APP_ROLES);

type AdminUser = {
  id: string;
  full_name: string;
  email: string | null;
  role: (typeof APP_ROLES)[number] | null;
};

export async function listAdminUsers() {
  console.log("Iniciando listagem de usuários admin...");
  const [profilesRes, rolesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name", { ascending: true }),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  if (profilesRes.error) {
    console.error("Erro ao buscar perfis:", profilesRes.error);
    throw profilesRes.error;
  }
  if (rolesRes.error) {
    console.error("Erro ao buscar papéis:", rolesRes.error);
    throw rolesRes.error;
  }

  console.log(`Perfis encontrados: ${profilesRes.data?.length}`);
  console.log(`Papéis encontrados: ${rolesRes.data?.length}`);

  const roleMap = new Map<string, (typeof APP_ROLES)[number]>();
  rolesRes.data?.forEach((roleRow) => {
    if (roleRow.user_id && roleRow.role) {
      roleMap.set(roleRow.user_id, roleRow.role as any);
    }
  });

  return (profilesRes.data ?? []).map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: roleMap.get(profile.id) ?? null,
  })) as AdminUser[];
}

export async function createAdminUser({
  data,
}: {
  data: { full_name: string; email: string; password: string; role: (typeof APP_ROLES)[number] };
}) {
  const parsed = z
    .object({
      full_name: z.string().trim().min(2, "Informe o nome completo.").max(120),
      email: z
        .string()
        .trim()
        .email("Informe um email válido.")
        .max(255)
        .transform((email) => email.toLowerCase()),
      password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres.").max(72),
      role: roleSchema,
    })
    .parse(data);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      data: {
        full_name: parsed.full_name,
      },
    },
  });

  if (signUpError) throw signUpError;

  const userId = signUpData.user?.id ?? signUpData.session?.user.id;
  if (!userId) {
    throw new Error("Não foi possível criar o usuário.");
  }

  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: userId,
    role: parsed.role,
  });
  if (roleError) throw roleError;

  return { success: true, userId };
}

export async function updateAdminUserRole({
  data,
}: {
  data: { userId: string; role: (typeof APP_ROLES)[number] };
}) {
  const parsed = z
    .object({
      userId: z.string().uuid(),
      role: roleSchema,
    })
    .parse(data);

  console.log(`Atualizando cargo do usuário ${parsed.userId} para ${parsed.role}...`);

  // Deletar papéis existentes para garantir que ele tenha apenas um
  const { error: deleteError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", parsed.userId);

  if (deleteError) {
    console.error("Erro ao deletar papéis antigos:", deleteError);
    throw deleteError;
  }

  // Inserir novo papel
  const { error: insertError } = await supabase.from("user_roles").insert({
    user_id: parsed.userId,
    role: parsed.role,
  });

  if (insertError) {
    console.error("Erro ao inserir novo papel:", insertError);
    throw insertError;
  }

  console.log("Cargo atualizado com sucesso.");
  return { success: true };
}

export async function deleteAdminUser({ data }: { data: { userId: string } }) {
  const parsed = z.object({ userId: z.string().uuid() }).parse(data);

  const { error: deleteRoleError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", parsed.userId);
  if (deleteRoleError) throw deleteRoleError;

  return { success: true };
}
