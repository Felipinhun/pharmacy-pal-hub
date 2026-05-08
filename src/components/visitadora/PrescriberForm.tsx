import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Loader2 } from "lucide-react";

interface PrescriberData {
  id?: string;
  full_name: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  zip_code: string;
  specialty: string;
  crm_crf: string;
  clinic_name: string;
  specialization: string;
  partnership_potential: "baixo" | "medio" | "alto";
  best_visit_day: string;
  best_visit_time: string;
  latitude: number | null;
  longitude: number | null;
}

interface PrescriberFormProps {
  onSuccess?: () => void;
  initialData?: PrescriberData | null;
  onCancel?: () => void;
}

export function PrescriberForm({ onSuccess, initialData, onCancel }: PrescriberFormProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude || null);
  const [form, setForm] = useState({
    full_name: initialData?.full_name || "",
    street: initialData?.street || "",
    number: initialData?.number || "",
    neighborhood: initialData?.neighborhood || "",
    city: initialData?.city || "",
    zip_code: initialData?.zip_code || "",
    specialty: initialData?.specialty || "",
    crm_crf: initialData?.crm_crf || "",
    clinic_name: initialData?.clinic_name || "",
    specialization: initialData?.specialization || "",
    partnership_potential:
      (initialData?.partnership_potential as "baixo" | "medio" | "alto") || "medio",
    best_visit_day: initialData?.best_visit_day || "",
    best_visit_time: initialData?.best_visit_time || "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        full_name: initialData.full_name || "",
        street: initialData.street || "",
        number: initialData.number || "",
        neighborhood: initialData.neighborhood || "",
        city: initialData.city || "",
        zip_code: initialData.zip_code || "",
        specialty: initialData.specialty || "",
        crm_crf: initialData.crm_crf || "",
        clinic_name: initialData.clinic_name || "",
        specialization: initialData.specialization || "",
        partnership_potential: initialData.partnership_potential || "medio",
        best_visit_day: initialData.best_visit_day || "",
        best_visit_time: initialData.best_visit_time || "",
      });
      setLatitude(initialData.latitude || null);
      setLongitude(initialData.longitude || null);
    } else {
      setForm({
        full_name: "",
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        zip_code: "",
        specialty: "",
        crm_crf: "",
        clinic_name: "",
        specialization: "",
        partnership_potential: "medio",
        best_visit_day: "",
        best_visit_time: "",
      });
      setLatitude(null);
      setLongitude(null);
    }
  }, [initialData]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo seu navegador.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGeoLoading(false);
      },
      (err) => {
        alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSuccess(false);

    const payload = {
      visitadora_id: user.id,
      full_name: form.full_name,
      street: form.street,
      number: form.number,
      neighborhood: form.neighborhood,
      city: form.city,
      zip_code: form.zip_code,
      specialty: form.specialty,
      crm_crf: form.crm_crf,
      clinic_name: form.clinic_name,
      specialization: form.specialization,
      partnership_potential: form.partnership_potential,
      best_visit_day: form.best_visit_day,
      best_visit_time: form.best_visit_time,
      latitude,
      longitude,
    };

    let error;
    if (initialData?.id) {
      const { error: updateError } = await supabase
        .from("prescribers")
        .update(payload)
        .eq("id", initialData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("prescribers").insert(payload);
      error = insertError;
    }

    if (!error) {
      setSuccess(true);
      if (!initialData) {
        setForm({
          full_name: "",
          street: "",
          number: "",
          neighborhood: "",
          city: "",
          zip_code: "",
          specialty: "",
          crm_crf: "",
          clinic_name: "",
          specialization: "",
          partnership_potential: "medio",
          best_visit_day: "",
          best_visit_time: "",
        });
        setLatitude(null);
        setLongitude(null);
      }
      onSuccess?.();
    }

    setSubmitting(false);
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {initialData ? "Editar Prescritor" : "Cadastrar Novo Prescritor"}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-success/10 p-3 text-sm text-success">
          {initialData
            ? "Prescritor atualizado com sucesso!"
            : "Prescritor cadastrado com sucesso!"}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados pessoais */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Dados Pessoais
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nome Completo *</label>
              <input
                className={inputClass}
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>CRM / CRF</label>
              <input
                className={inputClass}
                value={form.crm_crf}
                onChange={(e) => updateField("crm_crf", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Especialidade</label>
              <input
                className={inputClass}
                value={form.specialty}
                onChange={(e) => updateField("specialty", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Especialização</label>
              <input
                className={inputClass}
                value={form.specialization}
                onChange={(e) => updateField("specialization", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Nome da Clínica</label>
              <input
                className={inputClass}
                value={form.clinic_name}
                onChange={(e) => updateField("clinic_name", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Endereço
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className={labelClass}>Rua</label>
              <input
                className={inputClass}
                value={form.street}
                onChange={(e) => updateField("street", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Número</label>
              <input
                className={inputClass}
                value={form.number}
                onChange={(e) => updateField("number", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Bairro</label>
              <input
                className={inputClass}
                value={form.neighborhood}
                onChange={(e) => updateField("neighborhood", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Cidade</label>
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>CEP</label>
              <input
                className={inputClass}
                value={form.zip_code}
                onChange={(e) => updateField("zip_code", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Visita */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Informações de Visita
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Potencial da Parceria</label>
              <select
                className={inputClass}
                value={form.partnership_potential}
                onChange={(e) =>
                  updateField("partnership_potential", e.target.value as "baixo" | "medio" | "alto")
                }
              >
                <option value="baixo">Baixo</option>
                <option value="medio">Médio</option>
                <option value="alto">Alto</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Melhor Dia para Visita</label>
              <input
                className={inputClass}
                value={form.best_visit_day}
                onChange={(e) => updateField("best_visit_day", e.target.value)}
                placeholder="Ex: Segunda-feira"
              />
            </div>
            <div>
              <label className={labelClass}>Melhor Horário</label>
              <input
                className={inputClass}
                value={form.best_visit_time}
                onChange={(e) => updateField("best_visit_time", e.target.value)}
                placeholder="Ex: 14:00"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Localização (GPS)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={captureLocation}
                disabled={geoLoading}
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                {geoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {geoLoading ? "Obtendo localização..." : "Capturar Minha Localização"}
              </button>
              {latitude !== null && longitude !== null && (
                <span className="text-sm text-success font-medium">
                  ✓ Localização capturada ({latitude.toFixed(5)}, {longitude.toFixed(5)})
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Esteja no local do prescritor para capturar a localização correta.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Salvando..." : initialData ? "Salvar Alterações" : "Cadastrar Prescritor"}
        </button>
      </form>
    </div>
  );
}
