import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (role) {
      navigate({ to: `/${role}` as "/visitadora" });
    } else {
      // Se tiver usuário mas não tiver papel (erro no DB ou usuário novo)
      console.warn("Usuário logado mas sem papel definido.");
    }
  }, [user, role, loading, navigate]);

  if (!loading && user && !role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-xl font-bold text-foreground">Acesso Pendente</h1>
        <p className="mt-2 text-muted-foreground">
          Seu usuário está autenticado, mas ainda não possui um perfil de acesso atribuído.<br/>
          Por favor, contate o administrador.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-primary text-white rounded-lg font-medium"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
