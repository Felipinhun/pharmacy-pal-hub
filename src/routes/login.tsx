import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — FarmaGestão" },
      { name: "description", content: "Sistema de gestão para farmácia de manipulação" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, loading, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already logged in and has role, redirect
  if (!loading && role) {
    navigate({ to: `/${role}` as "/visitadora" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-pulse rounded-full bg-primary/20 backdrop-blur-xl" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-primary transition-transform hover:scale-105 duration-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              <path d="M5 3v4" />
              <path d="M19 17v4" />
              <path d="M3 5h4" />
              <path d="M17 19h4" />
            </svg>
          </div>
          <h1 className="mt-6 text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Bio <span className="font-semibold italic text-primary">Aurea</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground/80 tracking-wide uppercase font-medium">
            Pharmacy Intelligent Hub
          </p>
        </div>

        <div className="group relative rounded-3xl border border-white/20 bg-white/40 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl transition-all hover:shadow-primary/10">
          <div className="mb-8">
            <h2 className="text-xl font-medium text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your professional workspace</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-destructive/5 border border-destructive/10 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-white/50 px-4 py-3 text-foreground transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                placeholder="name@company.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-white/50 px-4 py-3 text-foreground transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="relative mt-8 w-full overflow-hidden rounded-xl bg-secondary py-3.5 text-sm font-semibold text-secondary-foreground shadow-lg transition-all hover:bg-secondary/90 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              <span className={submitting ? "opacity-0" : "opacity-100"}>
                {submitting ? "Authenticating..." : "Access Hub"}
              </span>
              {submitting && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                </div>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 tracking-wider uppercase">
          &copy; 2026 Farmácia Bio Aurea
        </p>
      </div>
    </div>
  );
}