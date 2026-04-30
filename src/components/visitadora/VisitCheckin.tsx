import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Loader2, Clock, CheckCircle2 } from "lucide-react";

interface Prescriber {
  id: string;
  full_name: string;
  clinic_name: string | null;
}

interface Visit {
  id: string;
  visit_date: string;
  checkin_at: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  status: string;
  prescriber_id: string;
  prescriber_name?: string;
}

export function VisitCheckin() {
  const { user } = useAuth();
  const [prescribers, setPrescribers] = useState<Prescriber[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [selectedPrescriber, setSelectedPrescriber] = useState("");
  const [notes, setNotes] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [prescRes, visitsRes] = await Promise.all([
      supabase
        .from("prescribers")
        .select("id, full_name, clinic_name")
        .eq("visitadora_id", user.id)
        .order("full_name"),
      supabase
        .from("visits")
        .select("id, visit_date, checkin_at, latitude, longitude, notes, status, prescriber_id")
        .eq("visitadora_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (prescRes.data) setPrescribers(prescRes.data);
    if (visitsRes.data && prescRes.data) {
      const nameMap = new Map(prescRes.data.map((p) => [p.id, p.full_name]));
      setRecentVisits(
        visitsRes.data.map((v) => ({
          ...v,
          prescriber_name: nameMap.get(v.prescriber_id) ?? "—",
        }))
      );
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo seu navegador.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        alert("Não foi possível obter sua localização. Verifique as permissões.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPrescriber) return;
    if (!location) {
      alert("Você precisa capturar sua localização antes do check-in.");
      return;
    }
    setSubmitting(true);
    setSuccess(false);

    const now = new Date().toISOString();

    const { error } = await supabase.from("visits").insert({
      visitadora_id: user.id,
      prescriber_id: selectedPrescriber,
      notes: notes || null,
      status: "concluida",
      latitude: location.lat,
      longitude: location.lng,
      checkin_at: now,
    });

    if (!error) {
      setSuccess(true);
      setSelectedPrescriber("");
      setNotes("");
      setLocation(null);
      loadData();
      setTimeout(() => setSuccess(false), 4000);
    }
    setSubmitting(false);
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

  return (
    <div className="space-y-6">
      {/* Check-in form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Check-in de Visita</h3>

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Check-in registrado com sucesso!
          </div>
        )}

        <form onSubmit={handleCheckin} className="space-y-4">
          <div>
            <label className={labelClass}>Prescritor Visitado *</label>
            <select
              className={inputClass}
              value={selectedPrescriber}
              onChange={(e) => setSelectedPrescriber(e.target.value)}
              required
            >
              <option value="">Selecione um prescritor...</option>
              {prescribers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} {p.clinic_name ? `— ${p.clinic_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Localização (GPS) *</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={captureLocation}
                disabled={geoLoading}
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {geoLoading ? "Obtendo localização..." : "Capturar Localização"}
              </button>
              {location && (
                <span className="text-sm text-success font-medium">
                  ✓ ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Você deve estar no local da visita. O GPS, data e hora serão registrados automaticamente.
            </p>
          </div>

          <div>
            <label className={labelClass}>Observações da Visita</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva como foi a visita..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !location || !selectedPrescriber}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Registrando..." : "Fazer Check-in"}
          </button>
        </form>
      </div>

      {/* Recent visits */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Últimos Check-ins</h3>
        {recentVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum check-in registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {recentVisits.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{v.prescriber_name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {v.checkin_at
                        ? new Date(v.checkin_at).toLocaleString("pt-BR")
                        : v.visit_date}
                    </span>
                    {v.latitude && v.longitude && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                      </span>
                    )}
                  </div>
                  {v.notes && <p className="mt-1 text-xs text-muted-foreground truncate">{v.notes}</p>}
                </div>
                <span
                  className={`ml-2 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    v.status === "concluida"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {v.status === "concluida" ? "Concluída" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}