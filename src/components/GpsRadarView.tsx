import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, Flag, Lock, MapPin, Navigation, Radio } from 'lucide-react';
import {
  FINAL_ARRIVAL_RADIUS_METERS,
  SINAIA_SIMULATED_ORIGIN,
} from '../config';
import { haversineDistanceMeters } from '../game/missionState';
import type { EncryptedDestination } from '../config';

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
    simulatedGps ? 'Poziție simulată (Sinaia)' : 'Căutare sateliți GPS...'
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
      setGpsStatus('Mod simulare Sinaia activ');
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('GPS indisponibil pe acest dispozitiv');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsStatus(`Semnal GPS activ (±${Math.round(pos.coords.accuracy)} m)`);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('Permisiunea GPS a fost refuzată. Activează localizarea.');
        } else {
          setGpsStatus('Semnal GPS slab — în așteptare coordonate...');
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
          <span class="animate-radar-ping" style="position:absolute;width:28px;height:28px;border-radius:9999px;background:rgba(56,189,248,0.45);"></span>
          <span style="width:12px;height:12px;border-radius:9999px;background:#38bdf8;border:2px solid #ffffff;box-shadow:0 0 12px #38bdf8;"></span>
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
          <span class="animate-radar-ping" style="position:absolute;width:28px;height:28px;border-radius:9999px;background:rgba(245,158,11,0.4);"></span>
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
        // Outer neon glow
        L.polyline(latLngs, {
          color: '#0284c7',
          weight: 9,
          opacity: 0.35,
          lineCap: 'round',
        }).addTo(layer);
        // Core continuous neon blue street route
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
        className="hw-chassis rounded-xl p-6 min-h-[420px] flex flex-col items-center justify-center text-center relative overflow-hidden"
      >
        <div className="hw-phosphor-screen w-24 h-24 rounded-full flex items-center justify-center mb-4 relative">
          <span className="absolute inset-2 rounded-full border border-emerald-500/30 animate-ping" />
          <Lock className="w-9 h-9 text-amber-400" aria-hidden="true" />
        </div>
        <h2 className="font-display text-lg font-bold tracking-wide text-amber-300">
          SEMNAL GPS BLOCAT
        </h2>
        <p className="font-tech text-xs text-slate-300 max-w-xs mt-2 leading-relaxed">
          REZOLVĂ MODULUL 1 PENTRU INIȚIALIZARE
        </p>
        <p className="text-xs text-slate-500 mt-3 max-w-xs">
          Harta tactică și localizarea în timp real devin active imediat după dezamorsarea primului modul.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="gps-unlocked-view">
      {/* Top Map HUD */}
      <div className="hw-chassis rounded-xl p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-tech text-[11px] text-slate-300 truncate">{gpsStatus}</p>
              <p className="font-display text-sm font-bold text-slate-100 truncate">
                {activeDestination
                  ? activeDestination.codeName
                  : module2Solved
                    ? 'Pregătit pentru misiunea din Sinaia'
                    : 'Localizare activă · Nicio rută criptată'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={recenterMap}
            aria-label="Centrează harta pe poziția curentă"
            className="hw-btn-compact px-2.5 py-2 flex items-center gap-1.5 text-xs font-tech text-sky-300 shrink-0"
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>Centru</span>
          </button>
        </div>

        {/* Distance & ETA Metrics when Route is Active */}
        {activeDestination && routeStats && (
          <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-800">
            <div className="hw-lcd-screen rounded-lg px-3 py-2">
              <span className="font-tech text-[10px] text-slate-400 block">DISTANȚĂ RĂMASĂ</span>
              <span className="font-lcd text-2xl text-sky-300">
                {routeStats.distanceMeters} m
              </span>
            </div>
            <div className="hw-lcd-screen rounded-lg px-3 py-2">
              <span className="font-tech text-[10px] text-slate-400 block">MERS PE JOS (EST.)</span>
              <span className="font-lcd text-2xl text-amber-300">
                ~{routeStats.durationMinutes} min
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dark Leaflet Map Canvas */}
      <div className="hw-chassis rounded-xl p-1.5 overflow-hidden">
        <div className="relative isolate rounded-lg overflow-hidden border border-slate-800 h-[360px] sm:h-[420px] leaflet-dark-tiles">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Map Legend */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-md bg-slate-950/90 border border-slate-700/80 px-2.5 py-1.5 flex items-center gap-3 text-[10px] font-tech text-slate-300">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-sky-400" aria-hidden="true" />
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

      {/* Final Arrival Confirmation */}
      {(module7Solved || activeDestination?.id === 5) && (
        <div className="hw-chassis rounded-xl p-4 border-amber-500/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="font-tech text-[11px] text-amber-400">
                {isNearFinal
                  ? 'EȘTI ÎN PERIMETRUL OBIECTIVULUI FINAL!'
                  : 'TOATE CELE 7 MODULE AU FOST DEZAMORSATE'}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Când ajungi la destinația finală din Sinaia, confirmă sosirea mai jos.
              </p>
            </div>
            <button
              type="button"
              onClick={onConfirmFinalArrival}
              className="hw-tactile-btn w-full sm:w-auto px-4 py-3 min-h-[48px] flex items-center justify-center gap-2 font-display text-xs font-bold tracking-wider text-amber-300 border-amber-500/60"
            >
              <Flag className="w-4 h-4" aria-hidden="true" />
              <span>CONFIRMĂ SOSIREA LA OBIECTIVUL FINAL</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
