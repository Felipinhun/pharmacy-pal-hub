import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PrescriberFormProps {
  onSuccess?: () => void;
}

export function PrescriberForm({ onSuccess }: PrescriberFormProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
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
    partnership_potential: "medio" as "baixo" | "medio" | "alto",
    best_visit_day: "",
    best_visit_time: "",
    notes: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSuccess(false);

    const { error } = await supabase.from("prescribers").insert({
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
    });

    if (!error) {
      // Also create a visit entry if notes exist
      if (form.notes) {
        // Get the just-created prescriber
        const { data: newPrescriber } = await supabase
          .from("prescribers")
          .select("id")
          .eq("visitadora_id", user.id)
          .eq("full_name", form.full_name)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (newPrescriber) {
          await supabase.from("visits").insert({
            visitadora_id: user.id,
            prescriber_id: newPrescriber.id,
            notes: form.notes,
          });
        }
      }

      setSuccess(true);
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
        notes: "",
      });
      onSuccess?.();
    }

    setSubmitting(false);
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Cadastrar Novo Prescritor</h3>

      {success && (
        <div className="mb-4 rounded-lg bg-success/10 p-3 text-sm text-success">
          Prescritor cadastrado com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados pessoais */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nome Completo *</label>
              <input className={inputClass} value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>CRM / CRF</label>
              <input className={inputClass} value={form.crm_crf} onChange={(e) => updateField("crm_crf", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Especialidade</label>
              <input className={inputClass} value={form.specialty} onChange={(e) => updateField("specialty", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Especialização</label>
              <input className={inputClass} value={form.specialization} onChange={(e) => updateField("specialization", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Nome da Clínica</label>
              <input className={inputClass} value={form.clinic_name} onChange={(e) => updateField("clinic_name", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Endereço</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className={labelClass}>Rua</label>
              <input className={inputClass} value={form.street} onChange={(e) => updateField("street", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Número</label>
              <input className={inputClass} value={form.number} onChange={(e) => updateField("number", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Bairro</label>
              <input className={inputClass} value={form.neighborhood} onChange={(e) => updateField("neighborhood", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Cidade</label>
              <input className={inputClass} value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>CEP</label>
              <input className={inputClass} value={form.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Visita */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informações de Visita</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Potencial da Parceria</label>
              <select
                className={inputClass}
                value={form.partnership_potential}
                onChange={(e) => updateField("partnership_potential", e.target.value)}
              >
                <option value="baixo">Baixo</option>
                <option value="medio">Médio</option>
                <option value="alto">Alto</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Melhor Dia para Visita</label>
              <input className={inputClass} value={form.best_visit_day} onChange={(e) => updateField("best_visit_day", e.target.value)} placeholder="Ex: Segunda-feira" />
            </div>
            <div>
              <label className={labelClass}>Melhor Horário</label>
              <input className={inputClass} value={form.best_visit_time} onChange={(e) => updateField("best_visit_time", e.target.value)} placeholder="Ex: 14:00" />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Como foi a visita</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Descreva como foi a visita..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Salvando..." : "Cadastrar Prescritor"}
        </button>
      </form>
    </div>
  );
}