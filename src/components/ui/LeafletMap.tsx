import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CurrencyCode, Property } from '../../types';
import { formatMoney } from '../../i18n/translations';

interface LeafletMapProps {
  properties: Property[];
  currency: CurrencyCode;
  height?: string;
  onSelectProperty?: (propertyId: string) => void;
  zoom?: number;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  properties,
  currency,
  height = '420px',
  onSelectProperty,
  zoom = 11,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] =
      properties.length === 1
        ? [properties[0].lat, properties[0].lng]
        : [25.138, 55.205];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: properties.length === 1 ? 14 : zoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const bounds: [number, number][] = [];

    properties.forEach((prop) => {
      bounds.push([prop.lat, prop.lng]);
      const displayPrice =
        prop.transactionType === 'rent'
          ? `${formatMoney(prop.rentAmount, currency, true)}/mo`
          : formatMoney(prop.price, currency, true);

      const icon = L.divIcon({
        className: 'custom-dubai-pin',
        html: `<div style="background:#0f766e;color:#ffffff;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;border:1.5px solid #ffffff;box-shadow:0 2px 6px rgba(15,23,42,0.28);font-family:JetBrains Mono,monospace;">${displayPrice}</div>`,
        iconSize: [96, 26],
        iconAnchor: [48, 13],
      });

      const marker = L.marker([prop.lat, prop.lng], { icon }).addTo(group);

      const popupEl = document.createElement('div');
      popupEl.style.minWidth = '200px';
      popupEl.innerHTML = `
        <div style="font-weight:600;font-size:13px;margin-bottom:2px;">${prop.title}</div>
        <div style="font-size:11px;opacity:0.75;margin-bottom:6px;">${prop.community} · ${prop.bedrooms} bd · ${prop.surface} m²</div>
        <div style="font-weight:600;font-size:12px;color:#0f766e;margin-bottom:8px;">${displayPrice}</div>
      `;

      if (onSelectProperty) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'View Property';
        btn.style.cssText =
          'background:#0f766e;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;width:100%;';
        btn.onclick = () => onSelectProperty(prop.id);
        popupEl.appendChild(btn);
      }

      marker.bindPopup(popupEl);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }
  }, [properties, currency, onSelectProperty]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
    />
  );
};
