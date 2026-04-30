import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AtendenteDashboard } from "@/components/atendente/AtendenteDashboard";

export const Route = createFileRoute("/atendente")({
  head: () => ({
    meta: [{ title: "Dashboard Atendente — FarmaGestão" }],
  }),
  component: AtendentePage,
});

function AtendentePage() {
  return (
    <DashboardLayout>
      <AtendenteDashboard />
    </DashboardLayout>
  );
}