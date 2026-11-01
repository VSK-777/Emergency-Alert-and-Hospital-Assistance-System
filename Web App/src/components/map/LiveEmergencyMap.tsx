import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { EmergencyIncident, Hospital, Ambulance, Responder } from '../../types';
import { useEmergencyStore } from '../../store/emergencyStore';
import { AlertCircle, Building2, Ambulance as AmbulanceIcon, UserCheck, Layers, Radio } from 'lucide-react';

// Custom SVG-based Leaflet markers
const createCustomIcon = (color: string, label: string, isPulsing = false) => {
  const pulseClass = isPulsing ? 'animate-radar' : '';
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer">
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg font-black text-xs border-2 border-white/80 ${pulseClass}" style="background-color: ${color};">
        ${label}
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
};

const emergencyIcon = createCustomIcon('#ef4444', '🚨', true);
const hospitalIcon = createCustomIcon('#0284c7', '🏥');
const ambulanceIcon = createCustomIcon('#f59e0b', '🚑');
const responderIcon = createCustomIcon('#10b981', '👤');

interface LiveEmergencyMapProps {
  incidents: EmergencyIncident[];
  hospitals: Hospital[];
  ambulances: Ambulance[];
  responders: Responder[];
  height?: string;
  onSelectIncident?: (incident: EmergencyIncident) => void;
}

export const LiveEmergencyMap: React.FC<LiveEmergencyMapProps> = ({
  incidents,
  hospitals,
  ambulances,
  responders,
  height = '500px',
  onSelectIncident,
}) => {
  const [showHospitals, setShowHospitals] = useState(true);
  const [showAmbulances, setShowAmbulances] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const { setSelectedIncident } = useEmergencyStore();

  const defaultCenter: [number, number] = [16.3533, 80.5238]; // VVIT Campus Nambur

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      {/* Map Filter Controls Bar */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1.5 backdrop-blur-md text-xs shadow-lg">
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all mr-1"
          title="Map service powered by OpenStreetMap (https://www.openstreetmap.org)"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          OpenStreetMap
        </a>
        <span className="px-2 text-slate-400 font-semibold flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          Layers:
        </span>
        <button
          onClick={() => setShowHospitals(!showHospitals)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
            showHospitals ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="h-3 w-3" />
          Hospitals ({hospitals.length})
        </button>
        <button
          onClick={() => setShowAmbulances(!showAmbulances)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
            showAmbulances ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <AmbulanceIcon className="h-3 w-3" />
          Ambulances ({ambulances.length})
        </button>
        <button
          onClick={() => setShowResponders(!showResponders)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
            showResponders ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="h-3 w-3" />
          Responders ({responders.length})
        </button>
      </div>

      {/* Map Container */}
      <div style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* OpenStreetMap tile layer (100% free, no API key required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Active Emergencies */}
          {incidents
            .filter((i) => i.latitude && i.longitude)
            .map((incident) => (
              <React.Fragment key={incident.id}>
                {/* 500m Response radius circle */}
                <Circle
                  center={[incident.latitude, incident.longitude]}
                  radius={500}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.15,
                    weight: 1.5,
                    dashArray: '4, 4',
                  }}
                />

                <Marker
                  position={[incident.latitude, incident.longitude]}
                  icon={emergencyIcon}
                  eventHandlers={{
                    click: () => {
                      if (onSelectIncident) onSelectIncident(incident);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-2 min-w-[220px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          EMERGENCY ALERT
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {incident.source}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white">
                        {incident.patientName || 'Emergency Victim'}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        {incident.detectionReason || 'Critical incident reported'}
                      </p>
                      <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-700/60 pt-1">
                        <div>Blood Group: <strong className="text-white">{incident.bloodGroup || 'O+'}</strong></div>
                        <div>Status: <strong className="text-amber-400">{incident.status}</strong></div>
                        <div>Coordinates: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedIncident(incident);
                          if (onSelectIncident) onSelectIncident(incident);
                        }}
                        className="w-full mt-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] py-1 transition-colors"
                      >
                        Inspect & Coordinate
                      </button>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${incident.latitude}&mlon=${incident.longitude}#map=16/${incident.latitude}/${incident.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center w-full mt-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-semibold text-[10px] py-1 transition-colors"
                      >
                        View on OpenStreetMap ↗
                      </a>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}

          {/* Hospitals */}
          {showHospitals &&
            hospitals
              .filter((h) => h.latitude && h.longitude)
              .map((h) => (
                <Marker key={h.id} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
                  <Popup>
                    <div className="p-1 space-y-1.5 min-w-[200px]">
                      <div className="font-bold text-sky-400 text-xs flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {h.name}
                      </div>
                      <p className="text-[11px] text-slate-300">{h.address}</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-800/80 p-1.5 rounded border border-slate-700">
                        <div>
                          <span className="text-slate-400">ICU Beds:</span>{' '}
                          <strong className="text-emerald-400">{h.availableIcus}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Ambulances:</span>{' '}
                          <strong className="text-amber-400">{h.availableAmbulances}</strong>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400">Tel: {h.phoneNumber}</div>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${h.latitude}&mlon=${h.longitude}#map=16/${h.latitude}/${h.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center w-full mt-2 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-semibold text-[10px] py-1 transition-colors"
                      >
                        View on OpenStreetMap ↗
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* Ambulances */}
          {showAmbulances &&
            ambulances
              .filter((a) => a.latitude !== undefined && a.longitude !== undefined)
              .map((a) => (
                <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={ambulanceIcon}>
                  <Popup>
                    <div className="p-1 space-y-1.5 min-w-[190px]">
                      <div className="font-bold text-amber-400 text-xs flex items-center gap-1">
                        <AmbulanceIcon className="h-3.5 w-3.5" />
                        {a.vehicleNumber} ({a.vehicleType})
                      </div>
                      <p className="text-[11px] text-slate-200">
                        Driver: <strong>{a.driverName}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400">Phone: {a.driverPhone}</p>
                      <div className="text-[10px]">
                        Status:{' '}
                        <strong
                          className={
                            a.status === 'AVAILABLE'
                              ? 'text-emerald-400'
                              : a.status === 'ASSIGNED'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {a.status}
                        </strong>
                      </div>
                      {a.equipment && (
                        <p className="text-[10px] text-slate-400 border-t border-slate-700 pt-1">
                          Equipment: {a.equipment}
                        </p>
                      )}
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${a.latitude}&mlon=${a.longitude}#map=16/${a.latitude}/${a.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center w-full mt-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold text-[10px] py-1 transition-colors"
                      >
                        View on OpenStreetMap ↗
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* Responders */}
          {showResponders &&
            responders
              .filter((r) => r.latitude !== undefined && r.longitude !== undefined)
              .map((r) => (
                <Marker key={r.id} position={[r.latitude!, r.longitude!]} icon={responderIcon}>
                  <Popup>
                    <div className="p-1 space-y-1.5 min-w-[190px]">
                      <div className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        {r.name}
                      </div>
                      <p className="text-[11px] text-slate-200">{r.specialization}</p>
                      <p className="text-[10px] text-slate-400">Skills: {r.skills}</p>
                      <div className="text-[10px]">
                        Availability:{' '}
                        <strong className={r.isAvailable ? 'text-emerald-400' : 'text-slate-400'}>
                          {r.isAvailable ? 'ON-CALL' : 'OFFLINE'}
                        </strong>
                      </div>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=16/${r.latitude}/${r.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center w-full mt-2 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold text-[10px] py-1 transition-colors"
                      >
                        View on OpenStreetMap ↗
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
        </MapContainer>
      </div>
    </div>
  );
};
