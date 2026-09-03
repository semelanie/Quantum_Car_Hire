import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { namedStops, mapCenter } from '../data/locations';
import type { MapMode, PickedLocations } from '../types/location';

interface MaheMapProps {
  mode: MapMode;
  picked: PickedLocations;
  onSelectLocation: (name: string, lat: number, lng: number) => void;
}

function markerStyle(state: MapMode | null): L.CircleMarkerOptions {
  if (state === 'pickup') return { radius: 10, weight: 3, color: '#fff', fillColor: '#B8862E', fillOpacity: 1 };
  if (state === 'dropoff') return { radius: 10, weight: 3, color: '#B8862E', fillColor: '#fff', fillOpacity: 1 };
  return { radius: 8, weight: 2, color: '#fff', fillColor: '#0A2350', fillOpacity: 1 };
}

/** Great-circle distance between two lat/lng points, in kilometres. */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * A human-readable stand-in for a tapped point that never shows raw
 * lat/lng — "near <closest named stop>", with distance only included once
 * it stops rounding to "0.0 km" (i.e. the pin isn't right on top of it).
 */
function nearestStopLabel(lat: number, lng: number): string {
  let closest = namedStops[0];
  let closestDist = Infinity;
  for (const stop of namedStops) {
    const d = distanceKm(lat, lng, stop.lat, stop.lng);
    if (d < closestDist) {
      closestDist = d;
      closest = stop;
    }
  }
  if (!closest) return 'Pinned location';
  if (closestDist < 0.05) return `Near ${closest.name}`;
  return `Pinned spot (~${closestDist.toFixed(1)} km from ${closest.name})`;
}

/**
 * Turn a tapped map point into a short, human-readable address (e.g. "Anse
 * Royale road, Anse Royale") via OpenStreetMap's free Nominatim reverse
 * geocoder — no API key needed. This is a client-side demo integration:
 * Nominatim's usage policy caps this at ~1 request/second and asks that
 * production traffic either self-host Nominatim or use a paid geocoder
 * instead (see https://operations.osmfoundation.org/policies/nominatim/).
 * Returns null (never coordinates) if the lookup fails or comes back empty —
 * the caller already has a coordinate-free fallback ready either way.
 */
async function reverseGeocode(lat: number, lng: number, signal: AbortSignal): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data: { address?: Record<string, string>; display_name?: string; error?: string } = await res.json();
  if (data.error) return null;
  const a = data.address ?? {};
  const primary =
    a.road || a.pedestrian || a.footway || a.neighbourhood || a.suburb || a.hamlet || a.village || a.town;
  const area = a.suburb || a.village || a.town || a.city_district || a.city || a.county;
  const parts = [primary, area && area !== primary ? area : null].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  if (!data.display_name) return null;
  // display_name's last couple of segments are usually just "Seychelles" /
  // the district — keep the first two, which are the most specific.
  const short = data.display_name.split(',').slice(0, 2).join(',').trim();
  return short || null;
}

export default function MaheMap({ mode, picked, onSelectLocation }: MaheMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stopMarkersRef = useRef<Record<string, L.CircleMarker>>({});
  const customMarkerRef = useRef<L.CircleMarker | null>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);

  // Keep the latest mode/callback available inside Leaflet's event handlers
  // (which are only attached once) without rebuilding the map every render.
  const modeRef = useRef(mode);
  const onSelectLocationRef = useRef(onSelectLocation);
  useEffect(() => {
    modeRef.current = mode;
    onSelectLocationRef.current = onSelectLocation;
  }, [mode, onSelectLocation]);

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView(mapCenter, 12);
    mapRef.current = map;

    // Bottom-right, not the default top-left, so the zoom buttons never sit
    // on top of a named-stop pin (a pin near the top-left corner used to be
    // unclickable because the zoom control was drawn over it).
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Fit the view to every named stop (with padding) instead of a fixed
    // center/zoom, so every pin is guaranteed to be reachable on-screen —
    // including after stops are added, removed or moved.
    if (namedStops.length > 0) {
      const bounds = L.latLngBounds(namedStops.map((s): [number, number] => [s.lat, s.lng]));
      map.fitBounds(bounds.pad(0.35), { maxZoom: 14 });
    }

    namedStops.forEach((stop) => {
      const marker = L.circleMarker([stop.lat, stop.lng], markerStyle(null)).addTo(map);
      marker.bindTooltip(stop.name, { direction: 'top', offset: [0, -8] });
      marker.on('click', (e: L.LeafletMouseEvent) => {
        // Marker clicks bubble up to the map's own click handler by default
        // (Leaflet's Path layers have bubblingMouseEvents on), which would
        // otherwise immediately overwrite this pick with a "custom point" at
        // the same spot. Stop it here so picking a named pin sticks.
        L.DomEvent.stopPropagation(e);
        // Also cancel any reverse-geocode lookup still in flight from an
        // earlier custom tap — otherwise it can resolve after this named
        // pick and silently overwrite it back to "Other address".
        geocodeAbortRef.current?.abort();
        onSelectLocationRef.current(stop.name, stop.lat, stop.lng);
      });
      stopMarkersRef.current[stop.name] = marker;
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const fallbackLabel = nearestStopLabel(lat, lng);

      if (customMarkerRef.current) map.removeLayer(customMarkerRef.current);
      const marker = L.circleMarker([lat, lng], markerStyle(modeRef.current)).addTo(map);
      marker.bindTooltip(fallbackLabel, { direction: 'top', offset: [0, -8] }).openTooltip();
      customMarkerRef.current = marker;

      // Show a plain-language stand-in immediately (never raw lat/lng), then
      // swap in a real street/area name once the reverse-geocode lookup
      // resolves — or just leave the stand-in if that lookup fails.
      onSelectLocationRef.current(fallbackLabel, lat, lng);

      geocodeAbortRef.current?.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;
      reverseGeocode(lat, lng, controller.signal)
        .then((address) => {
          if (controller.signal.aborted || !address) return;
          marker.setTooltipContent(address);
          onSelectLocationRef.current(address, lat, lng);
        })
        .catch(() => {
          // Aborted (superseded by a newer tap) or the lookup failed — the
          // coordinate fallback set above already covers this case.
        });
    });

    return () => {
      geocodeAbortRef.current?.abort();
      map.remove();
      mapRef.current = null;
      stopMarkersRef.current = {};
      customMarkerRef.current = null;
    };
  }, []);

  // Refresh named-stop marker styles whenever the picked pickup/drop-off changes.
  useEffect(() => {
    namedStops.forEach((stop) => {
      let state: MapMode | null = null;
      if (picked.pickup === stop.name) state = 'pickup';
      else if (picked.dropoff === stop.name) state = 'dropoff';
      stopMarkersRef.current[stop.name]?.setStyle(markerStyle(state));
    });
  }, [picked]);

  return <div id="mahe-map" ref={containerRef} />;
}
