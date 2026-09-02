import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { namedStops, mapCenter } from '../data/locations';
import type { MapMode, PickedLocations } from '../types/location';

interface MaheMapProps {
  mode: MapMode;
  picked: PickedLocations;
  onSelectLocation: (name: string, lat: number, lng: number, isCustom: boolean) => void;
}

function markerStyle(state: MapMode | null): L.CircleMarkerOptions {
  if (state === 'pickup') return { radius: 10, weight: 3, color: '#fff', fillColor: '#B8862E', fillOpacity: 1 };
  if (state === 'dropoff') return { radius: 10, weight: 3, color: '#B8862E', fillColor: '#fff', fillOpacity: 1 };
  return { radius: 8, weight: 2, color: '#fff', fillColor: '#0A2350', fillOpacity: 1 };
}

export default function MaheMap({ mode, picked, onSelectLocation }: MaheMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stopMarkersRef = useRef<Record<string, L.CircleMarker>>({});
  const customMarkerRef = useRef<L.CircleMarker | null>(null);

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
        onSelectLocationRef.current(stop.name, stop.lat, stop.lng, false);
      });
      stopMarkersRef.current[stop.name] = marker;
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const label = `Custom point (${lat.toFixed(3)}, ${lng.toFixed(3)})`;

      if (customMarkerRef.current) map.removeLayer(customMarkerRef.current);
      const marker = L.circleMarker([lat, lng], markerStyle(modeRef.current)).addTo(map);
      marker.bindTooltip(label, { direction: 'top', offset: [0, -8] }).openTooltip();
      customMarkerRef.current = marker;

      onSelectLocationRef.current(label, lat, lng, true);
    });

    return () => {
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
