import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "visitadora" | "prescritor" | "atendente" | "admin";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  const fetchRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar papel:", error.message);
        return null;
      }

      return (data?.role as AppRole) ?? null;
    } catch (err) {
      console.error("Falha na consulta de papel:", err);
      return null;
    }
  }, []);

  const loadUserWithRole = useCallback(async (session: Session | null) => {
    if (!session) {
      setState({ user: null, session: null, role: null, loading: false });
      return;
    }

    try {
      // 🔥 garante que o user está sincronizado com o token
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({ user: null, session: null, role: null, loading: false });
        return;
      }

      // 🔥 pequeno delay pra evitar race condition do Supabase
      await new Promise((r) => setTimeout(r, 100));

      const role = await fetchRole(user.id);

      setState({
        user,
        session,
        role,
        loading: false,
      });
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      setState({ user: null, session: null, role: null, loading: false });
    }
  }, [fetchRole]);

  useEffect(() => {
    // 🔥 escuta mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserWithRole(session);
    });

    // 🔥 carrega sessão inicial corretamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserWithRole(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserWithRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, signIn, signUp, signOut };
}