import { useEffect, useRef } from "react";

interface Prescriber {
  id: string;
  full_name: string;
  specialty: string | null;
  partnership_potential: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface PrescriberMapProps {
  prescribers: Prescriber[];
}

export function PrescriberMap({ prescribers }: PrescriberMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const validPrescribers = prescribers.filter((p) => p.latitude && p.longitude);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    let cancelled = false;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current).setView([-23.55, -46.63], 12);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const potentialColors: Record<string, string> = {
        alto: "#22c55e",
        medio: "#eab308",
        baixo: "#ef4444",
      };

      validPrescribers.forEach((p) => {
        if (!p.latitude || !p.longitude) return;
        const color = potentialColors[p.partnership_potential ?? "medio"] ?? "#eab308";

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([p.latitude, p.longitude], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:system-ui;padding:4px">
              <strong>${p.full_name}</strong><br/>
              <span style="color:#666">${p.specialty ?? "—"}</span><br/>
              <span style="font-size:12px">Potencial: <strong>${p.partnership_potential ?? "—"}</strong></span>
            </div>`
          );
      });

      if (validPrescribers.length > 0) {
        const bounds = L.latLngBounds(
          validPrescribers.map((p) => [p.latitude!, p.longitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [validPrescribers]);

  if (validPrescribers.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
        <p className="text-muted-foreground">
          Nenhum prescritor com coordenadas cadastradas. Adicione latitude e longitude ao cadastrar prescritores para visualizá-los no mapa.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Mapa de Prescritores</h3>
      <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-green-500" /> Alto</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-yellow-500" /> Médio</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-red-500" /> Baixo</span>
      </div>
      <div ref={mapRef} className="h-[500px] w-full rounded-lg" />
    </div>
  );
}