import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Clock, User, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  contact_name: string;
  notes: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  prescriber_id: string | null;
}

interface Prescriber {
  id: string;
  full_name: string;
}

interface Visit {
  id: string;
  visit_date: string;
  status: string;
  prescribers: { full_name: string } | null;
}

export function AgendaPanel() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescribers, setPrescribers] = useState<Prescriber[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [contactName, setContactName] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [selectedPrescriber, setSelectedPrescriber] = useState<string>("none");

  useEffect(() => {
    if (!user) return;
    loadAppointments();
    loadVisits();
    loadPrescribers();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("visitadora_id", user.id)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });
    if (data) setAppointments(data);
  };

  const loadVisits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("visits")
      .select("id, visit_date, status, prescribers(full_name)")
      .eq("visitadora_id", user.id);
    if (data) setVisits(data as any);
  };

  const loadPrescribers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("prescribers")
      .select("id, full_name")
      .eq("visitadora_id", user.id);
    if (data) setPrescribers(data);
  };

  const handlePrescriberChange = (value: string) => {
    setSelectedPrescriber(value);
    if (value !== "none") {
      const p = prescribers.find((pr) => pr.id === value);
      if (p) setContactName(p.full_name);
    }
  };

  const handleSubmit = async () => {
    if (!user || !contactName.trim()) {
      toast.error("Preencha o nome do contato");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("appointments").insert({
      visitadora_id: user.id,
      contact_name: contactName.trim(),
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      appointment_time: appointmentTime,
      notes: notes.trim() || null,
      prescriber_id: selectedPrescriber !== "none" ? selectedPrescriber : null,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao agendar");
      return;
    }
    toast.success("Agendamento criado!");
    setContactName("");
    setNotes("");
    setSelectedPrescriber("none");
    setAppointmentTime("09:00");
    setDialogOpen(false);
    loadAppointments();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }
    toast.success(status === "concluido" ? "Marcado como concluído" : "Status atualizado");
    loadAppointments();
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Agendamento excluído");
    loadAppointments();
  };

  // Dates that have activity
  const datesWithActivity = useMemo(() => {
    const dates = new Set<string>();
    appointments.forEach((a) => dates.add(a.appointment_date));
    visits.forEach((v) => dates.add(v.visit_date));
    return Array.from(dates);
  }, [appointments, visits]);

  const dayAppointments = useMemo(() => {
    const selectedStr = format(selectedDate, "yyyy-MM-dd");
    return appointments
      .filter((a) => a.appointment_date === selectedStr)
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  }, [appointments, selectedDate]);

  const dayVisits = useMemo(() => {
    const selectedStr = format(selectedDate, "yyyy-MM-dd");
    return visits.filter((v) => v.visit_date === selectedStr);
  }, [visits, selectedDate]);

  const pendingAppointments = useMemo(() => {
    return dayAppointments.filter((a) => a.status === "agendado");
  }, [dayAppointments]);

  const completedActivities = useMemo(() => {
    const completedApts = dayAppointments
      .filter((a) => a.status === "concluido")
      .map((a) => ({ 
        id: a.id, 
        name: a.contact_name, 
        type: "appointment" as const,
        time: a.appointment_time.slice(0, 5)
      }));
    
    const completedVisits = dayVisits.map((v) => ({
      id: v.id,
      name: (v.prescribers as any)?.full_name ?? "—",
      type: "visit" as const,
      time: "--:--"
    }));

    return [...completedApts, ...completedVisits];
  }, [dayAppointments, dayVisits]);

  const cancelledAppointments = useMemo(() => {
    return dayAppointments.filter((a) => a.status === "cancelado");
  }, [dayAppointments]);

  const statusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-success/10 text-success";
      case "cancelado":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "concluido":
        return "Concluído";
      case "cancelado":
        return "Cancelado";
      default:
        return "Agendado";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Agenda</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {prescribers.length > 0 && (
                <div className="space-y-2">
                  <Label>Prescritor cadastrado (opcional)</Label>
                  <Select value={selectedPrescriber} onValueChange={handlePrescriberChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar prescritor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (digitar nome)</SelectItem>
                      {prescribers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Nome do contato *</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ex: Dr. João Silva"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Selecione a data no calendário antes de abrir este formulário, ou feche e
                  selecione.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Horário *</Label>
                <Input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes da visita..."
                  maxLength={500}
                />
              </div>
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? "Salvando..." : "Salvar Agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Calendar */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm h-fit">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            locale={ptBR}
            className={cn("p-3 pointer-events-auto")}
            modifiers={{
              hasAppointment: (date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                return datesWithActivity.includes(dateStr);
              },
            }}
            classNames={{
              hasAppointment: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary after:content-['']",
            }}
          />
        </div>

        {/* Day appointments */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </h3>
            {dayAppointments.length + dayVisits.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-success">{completedActivities.length} concluídas</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-primary">{dayAppointments.length + dayVisits.length} total</span>
              </div>
            )}
          </div>

          {dayAppointments.length === 0 && dayVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento para este dia.</p>
          ) : (
            <div className="space-y-6">
              {/* Pending Section */}
              {pendingAppointments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Próximas Visitas ({pendingAppointments.length})
                  </h4>
                  {pendingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/10 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center text-sm font-medium text-primary">
                          <Clock className="h-4 w-4" />
                          <span>{apt.appointment_time.slice(0, 5)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <p className="font-medium text-foreground">{apt.contact_name}</p>
                          </div>
                          {apt.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(apt.id, "concluido")}
                          title="Marcar como concluído"
                          className="rounded p-1 text-success hover:bg-success/10 transition-colors"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, "cancelado")}
                          title="Cancelar"
                          className="rounded p-1 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteAppointment(apt.id)}
                          title="Excluir"
                          className="rounded p-1 text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Section */}
              {completedActivities.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-success/70">
                    Concluídas / Check-ins ({completedActivities.length})
                  </h4>
                  {completedActivities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between rounded-lg bg-success/5 border border-success/10 px-4 py-3 opacity-80"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center text-sm font-medium text-success opacity-70">
                          <CheckCircle className="h-4 w-4" />
                          <span>{act.time}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <p className="font-medium text-foreground line-through opacity-70">
                              {act.name}
                            </p>
                          </div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                            {act.type === "appointment" ? "Agendamento" : "Check-in Direto"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full font-bold uppercase">
                          OK
                        </span>
                        {act.type === "appointment" && (
                          <button
                            onClick={() => deleteAppointment(act.id)}
                            title="Excluir"
                            className="rounded p-1 text-muted-foreground hover:bg-muted/80 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cancelled Section */}
              {cancelledAppointments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Canceladas ({cancelledAppointments.length})
                  </h4>
                  {cancelledAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center text-sm font-medium text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          <span>{apt.appointment_time.slice(0, 5)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground line-through">
                            {apt.contact_name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAppointment(apt.id)}
                        title="Excluir"
                        className="rounded p-1 text-muted-foreground hover:bg-muted/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
