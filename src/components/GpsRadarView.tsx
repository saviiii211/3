import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, Flag, Lock, MapPin, Navigation, Radio } from 'lucide-react';
import {
  FINAL_ARRIVAL_RADIUS_METERS,
  SINAIA_SIMULATED_ORIGIN,
} from '../config';
import { haversineDistanceMeters } from '../game/missionState';
import type { EncryptedDestination } from '../config';
import { SlottedScrew } from './ModuleCardShell';

interface GpsRadarViewProps {
  unlocked: boolean;
  module2Solved: boolean;
  module7Solved: boolean;
  activeDestination: EncryptedDestination | null;
  simulatedGps: boolean;
  onConfirmFinalArrival: () => void;
}

interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export const GpsRadarView: React.FC<GpsRadarViewProps> = ({
  unlocked,
  module2Solved,
  module7Solved,
  activeDestination,
  simulatedGps,
  onConfirmFinalArrival,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [userPos, setUserPos] = useState<Coords | null>(
    simulatedGps ? SINAIA_SIMULATED_ORIGIN : null
  );
  const [gpsStatus, setGpsStatus] = useState<string>(
    simulatedGps ? 'SIMULARE SINAIA' : 'SCANARE SATELIȚI...'
  );
  const [routeStats, setRouteStats] = useState<{
    distanceMeters: number;
    durationMinutes: number;
    isStreetRoute: boolean;
  } | null>(null);

  // Track real geolocation unless simulatedGps is active
  useEffect(() => {
    if (!unlocked) return;

    if (simulatedGps) {
      setUserPos(SINAIA_SIMULATED_ORIGIN);
      setGpsStatus('SIMULARE SINAIA ACTIVĂ');
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('GPS INDISPONIBIL');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsStatus(`FIX GPS (±${Math.round(pos.coords.accuracy)} m)`);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('PERMISIUNE GPS REFUZATĂ');
        } else {
          setGpsStatus('SEMNAL SLAB — AȘTEPTARE...');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 4000,
        timeout: 12000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [unlocked, simulatedGps]);

  // Initialize Leaflet Dark Mode Map once unlocked
  useEffect(() => {
    if (!unlocked || !mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = userPos
      ? [userPos.lat, userPos.lng]
      : [SINAIA_SIMULATED_ORIGIN.lat, SINAIA_SIMULATED_ORIGIN.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      playerMarkerRef.current = null;
      destMarkerRef.current = null;
      routeLayerRef.current = null;
    };
  }, [unlocked]);

  // Update live player marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;

    const icon = L.divIcon({
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: `
        <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
          <span class="animate-radar-ping" style="position:absolute;width:28px;height:28px;border-radius:9999px;background:rgba(52,211,153,0.45);"></span>
          <span style="width:12px;height:12px;border-radius:9999px;background:#34d399;border:2px solid #ffffff;box-shadow:0 0 12px #34d399;"></span>
        </div>
      `,
    });

    if (!playerMarkerRef.current) {
      playerMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon }).addTo(map);
      if (!activeDestination) {
        map.setView([userPos.lat, userPos.lng], 15);
      }
    } else {
      playerMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
    }
  }, [userPos, activeDestination]);

  // Fetch OSRM pedestrian street route whenever activeDestination or origin updates
  useEffect(() => {
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    if (!activeDestination) {
      setRouteStats(null);
      return;
    }

    const destIcon = L.divIcon({
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: `
        <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
          <span class="animate-radar-ping" style="position:absolute;width:28px;height:28px;border-radius:9999px;background:rgba(245,158,11,0.45);"></span>
          <span style="width:14px;height:14px;transform:rotate(45deg);background:#f59e0b;border:2px solid #fffbeb;box-shadow:0 0 14px #f59e0b;"></span>
        </div>
      `,
    });

    destMarkerRef.current = L.marker([activeDestination.lat, activeDestination.lng], {
      icon: destIcon,
    })
      .bindPopup(`<strong>${activeDestination.codeName}</strong>`)
      .addTo(map);

    const origin = userPos ?? SINAIA_SIMULATED_ORIGIN;
    const controller = new AbortController();

    const directMeters = Math.round(
      haversineDistanceMeters(origin.lat, origin.lng, activeDestination.lat, activeDestination.lng)
    );

    const drawFallback = () => {
      layer.clearLayers();
      L.polyline(
        [
          [origin.lat, origin.lng],
          [activeDestination.lat, activeDestination.lng],
        ],
        {
          color: '#38bdf8',
          weight: 4,
          dashArray: '8 8',
          opacity: 0.85,
        }
      ).addTo(layer);

      setRouteStats({
        distanceMeters: directMeters,
        durationMinutes: Math.max(1, Math.round(directMeters / 75)),
        isStreetRoute: false,
      });

      const bounds = L.latLngBounds(
        [origin.lat, origin.lng],
        [activeDestination.lat, activeDestination.lng]
      );
      map.fitBounds(bounds, { padding: [46, 46], maxZoom: 16 });
    };

    const url = `https://router.project-osrm.org/route/v1/foot/${origin.lng},${origin.lat};${activeDestination.lng},${activeDestination.lat}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        const route = data?.routes?.[0];
        if (!route?.geometry?.coordinates?.length) {
          drawFallback();
          return;
        }

        const latLngs: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        layer.clearLayers();
        L.polyline(latLngs, {
          color: '#0284c7',
          weight: 9,
          opacity: 0.35,
          lineCap: 'round',
        }).addTo(layer);
        L.polyline(latLngs, {
          color: '#38bdf8',
          weight: 4.5,
          opacity: 0.95,
          lineCap: 'round',
        }).addTo(layer);

        const dist = Math.round(route.distance ?? directMeters);
        const mins = Math.max(1, Math.round((route.duration ?? dist / 1.25) / 60));

        setRouteStats({
          distanceMeters: dist,
          durationMinutes: mins,
          isStreetRoute: true,
        });

        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [46, 46], maxZoom: 16 });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          drawFallback();
        }
      });

    return () => {
      controller.abort();
    };
  }, [activeDestination, userPos?.lat, userPos?.lng]);

  const directDistanceMeters = useMemo(() => {
    if (!activeDestination || !userPos) return null;
    return Math.round(
      haversineDistanceMeters(userPos.lat, userPos.lng, activeDestination.lat, activeDestination.lng)
    );
  }, [activeDestination, userPos]);

  const isNearFinal =
    module7Solved &&
    activeDestination?.id === 5 &&
    directDistanceMeters !== null &&
    directDistanceMeters <= FINAL_ARRIVAL_RADIUS_METERS;

  const recenterMap = () => {
    const map = mapRef.current;
    if (!map) return;
    if (userPos) {
      map.setView([userPos.lat, userPos.lng], 16, { animate: true });
    } else if (activeDestination) {
      map.setView([activeDestination.lat, activeDestination.lng], 15, { animate: true });
    }
  };

  if (!unlocked) {
    return (
      <div
        data-testid="gps-locked-screen"
        className="chassis-plate metal-micrograin relative p-6 min-h-[430px] flex flex-col items-center justify-center text-center"
      >
        <SlottedScrew className="absolute top-2.5 left-2.5" angle={16} />
        <SlottedScrew className="absolute top-2.5 right-2.5" angle={-28} />
        <SlottedScrew className="absolute bottom-2.5 left-2.5" angle={48} />
        <SlottedScrew className="absolute bottom-2.5 right-2.5" angle={-12} />

        <div className="crt-phosphor-glass w-28 h-28 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
          <span className="radar-sweep-beam absolute inset-0 rounded-full opacity-40" />
          <Lock className="w-8 h-8 text-amber-400 relative z-10" aria-hidden="true" />
        </div>
        <span className="brass-plaque px-2.5 py-0.5 font-tech text-[11px] font-bold text-amber-100 mb-2">
          CANAL TELEMETRIE BLOCAT
        </span>
        <p className="font-tech text-xs text-stone-300">
          REZOLVĂ MOD-01 PENTRU INIȚIALIZARE
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="gps-unlocked-view">
      {/* Instrument Telemetry & Precise Coordinates Strip */}
      <div className="chassis-plate metal-micrograin relative p-3.5">
        <SlottedScrew className="absolute top-2 left-2" angle={20} />
        <SlottedScrew className="absolute top-2 right-2" angle={-32} />

        <div className="flex items-center justify-between gap-2 px-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Radio className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-tech text-[10px] text-stone-400 truncate">
                {gpsStatus}
                {userPos &&
                  ` · ${userPos.lat.toFixed(4)}°N ${userPos.lng.toFixed(4)}°E`}
              </p>
              <p className="font-display text-sm font-bold text-amber-200 truncate">
                {activeDestination
                  ? activeDestination.codeName
                  : module2Solved
                    ? 'STANDBY · SINAIA'
                    : 'RECEPȚIE ACTIVĂ · FĂRĂ ȚINTĂ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={recenterMap}
            aria-label="Centrează harta pe poziția curentă"
            className="mech-toggle min-h-[42px] px-3 py-1.5 flex items-center gap-1.5 text-xs font-tech text-emerald-300 shrink-0 cursor-pointer"
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>Centru</span>
          </button>
        </div>

        {activeDestination && routeStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-black/70 px-1">
            <div className="crt-phosphor-glass px-3 py-1.5">
              <span className="font-tech text-[9px] text-emerald-400/75 block relative z-10">
                DISTANȚĂ
              </span>
              <span className="font-lcd text-2xl phosphor-text relative z-10">
                {routeStats.distanceMeters} m
              </span>
            </div>
            <div className="crt-amber-glass px-3 py-1.5">
              <span className="font-tech text-[9px] text-amber-400/75 block relative z-10">
                TIMP EST.
              </span>
              <span className="font-lcd text-2xl nixie-tube relative z-10">
                ~{routeStats.durationMinutes} min
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 crt-phosphor-glass px-3 py-1.5">
              <span className="font-tech text-[9px] text-emerald-400/75 block relative z-10">
                COORDONATE ȚINTĂ
              </span>
              <span className="font-tech text-xs phosphor-text relative z-10">
                {activeDestination.lat.toFixed(4)}°N, {activeDestination.lng.toFixed(4)}°E
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Oscilloscope / Polar Radar Housing around Leaflet Map */}
      <div className="chassis-plate metal-micrograin relative p-2">
        <div className="relative isolate overflow-hidden border-2 border-black h-[360px] sm:h-[420px] leaflet-dark-tiles bg-[#050806]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Polar Radar Grid + Rotating Sweep Wave (pointer-events-none) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[350] overflow-hidden flex items-center justify-center"
          >
            <div className="radar-sweep-beam w-[140%] aspect-square rounded-full opacity-45" />
            <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full opacity-35">
              <circle cx="200" cy="200" r="65" fill="none" stroke="#34d399" strokeWidth="0.7" strokeDasharray="3 4" />
              <circle cx="200" cy="200" r="130" fill="none" stroke="#34d399" strokeWidth="0.7" strokeDasharray="3 4" />
              <circle cx="200" cy="200" r="192" fill="none" stroke="#34d399" strokeWidth="0.8" />
              <line x1="200" y1="0" x2="200" y2="400" stroke="#34d399" strokeWidth="0.6" strokeDasharray="4 6" />
              <line x1="0" y1="200" x2="400" y2="200" stroke="#34d399" strokeWidth="0.6" strokeDasharray="4 6" />
            </svg>
            {/* CRT Corner Bezel Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_48px_rgba(0,0,0,0.85)]" />
          </div>

          {/* Floating Map Legend */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] bakelite-surface px-2.5 py-1.5 flex items-center gap-3 text-[10px] font-tech text-stone-200">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              Poziție live
            </span>
            {activeDestination && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" aria-hidden="true" />
                {activeDestination.codeName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Final Arrival Confirmation Switch */}
      {(module7Solved || activeDestination?.id === 5) && (
        <div className="chassis-plate metal-micrograin p-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="font-tech text-[11px] font-bold text-amber-300">
                {isNearFinal
                  ? 'PERIMETRU ATINS — CONFIRMARE DISPONIBILĂ'
                  : 'TOATE MODULELE NEUTRALIZATE (7/7)'}
              </p>
              <p className="font-tech text-[11px] text-stone-400 mt-0.5">
                Confirmă sosirea la obiectivul final din Sinaia.
              </p>
            </div>
            <button
              type="button"
              onClick={onConfirmFinalArrival}
              className="mech-key w-full sm:w-auto px-4 py-3 min-h-[48px] flex items-center justify-center gap-2 font-display text-xs font-bold tracking-wider text-amber-200 cursor-pointer"
            >
              <Flag className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>CONFIRMĂ SOSIREA LA OBIECTIVUL FINAL</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
