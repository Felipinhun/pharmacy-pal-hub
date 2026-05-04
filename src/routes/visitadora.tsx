import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { VisitadoraDashboard } from "@/components/visitadora/VisitadoraDashboard";

export const Route = createFileRoute("/visitadora")({
  head: () => ({
    meta: [{ title: "Intelligence Hub — Bio Aurea" }],
  }),
  component: VisitadoraPage,
});

function VisitadoraPage() {
  return (
    <DashboardLayout>
      <VisitadoraDashboard />
    </DashboardLayout>
  );
}