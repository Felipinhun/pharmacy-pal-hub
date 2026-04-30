import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PrescritorDashboard } from "@/components/prescritor/PrescritorDashboard";

export const Route = createFileRoute("/prescritor")({
  head: () => ({
    meta: [{ title: "Dashboard Prescritor — FarmaGestão" }],
  }),
  component: PrescritorPage,
});

function PrescritorPage() {
  return (
    <DashboardLayout>
      <PrescritorDashboard />
    </DashboardLayout>
  );
}