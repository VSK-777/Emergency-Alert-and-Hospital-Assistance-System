import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { EmergencyIncident, Hospital, Ambulance, Responder } from '../../types';
import { useEmergencyStore } from '../../store/emergencyStore';
import { AlertCircle, Building2, Ambulance as AmbulanceIcon, UserCheck, Layers } from 'lucide-react';

// High-Precision Vector Leaflet Markers (No Emojis)
const createVectorIcon = (
  color: string,
  svgInner: string,
  isPulsing = false,
  isRoundedSquare = false
) => {
  const pulseHtml = isPulsing
    ? `<span class="absolute -inset-1 rounded-full opacity-75 animate-ping" style="background-color: ${color};"></span>`
    : '';
  const shapeClass = isRoundedSquare ? 'rounded-xl' : 'rounded-full';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer">
      ${pulseHtml}
      <div class="relative w-8 h-8 ${shapeClass} flex items-center justify-center text-white shadow-lg border-2 border-white" style="background-color: ${color};">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          ${svgInner}
        </svg>
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

// Emergency Incident: Dynamic Beacon Alert with Location Ping
const emergencyIcon = createVectorIcon(
  '#DC2626',
  `<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>`,
  true
);

// Hospital Network: Clinical Cross Facility
const hospitalIcon = createVectorIcon(
  '#2563EB',
  `<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10M7 12h10" stroke-width="2.6"/>`,
  false,
  true
);

// Ambulance Fleet: High-Speed Medical Transit Cruiser
const ambulanceIcon = createVectorIcon(
  '#D97706',
  `<path d="M10 17h4V5H2v12h3"/><path d="M18 17h1a2 2 0 0 0 2-2v-3.5L18.5 7H14v10h1"/><circle cx="7.5" cy="17.5" r="2" fill="currentColor"/><circle cx="16.5" cy="17.5" r="2" fill="currentColor"/><path d="M7 10h4M9 8v4" stroke-width="2.4"/>`,
  false,
  true
);

// First Responder: Guardian Shield Pulse Beacon
const responderIcon = createVectorIcon(
  '#059669',
  `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>`,
  false
);

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
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 transition-colors">
      {/* Map Filter Controls Bar */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-1.5 backdrop-blur-md text-xs shadow-md">
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-all mr-1"
          title="Map service powered by OpenStreetMap"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          OpenStreetMap
        </a>
        <span className="px-2 text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          Layers:
        </span>
        <button
          onClick={() => setShowHospitals(!showHospitals)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-all ${
            showHospitals
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-3 w-3" />
          Hospitals ({hospitals.length})
        </button>
        <button
          onClick={() => setShowAmbulances(!showAmbulances)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-all ${
            showAmbulances
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <AmbulanceIcon className="h-3 w-3" />
          Ambulances ({ambulances.length})
        </button>
        <button
          onClick={() => setShowResponders(!showResponders)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-all ${
            showResponders
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
          {/* OpenStreetMap tile layer */}
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
                    color: '#D32F2F',
                    fillColor: '#D32F2F',
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
                      else setSelectedIncident(incident);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b pb-1.5 gap-2">
                        <span className="font-bold text-red-600 uppercase flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {incident.source}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{incident.detectionReason}</p>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        Status: <strong className="text-red-600 dark:text-red-400">{incident.status}</strong>
                      </div>
                      <button
                        onClick={() => {
                          if (onSelectIncident) onSelectIncident(incident);
                          else setSelectedIncident(incident);
                        }}
                        className="w-full mt-2 rounded bg-red-600 py-1 text-center font-bold text-white hover:bg-red-700"
                      >
                        Open Incident Dossier
                      </button>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}

          {/* Hospitals */}
          {showHospitals &&
            hospitals
              .filter((h) => h.latitude && h.longitude)
              .map((hospital) => (
                <Marker
                  key={hospital.id}
                  position={[hospital.latitude, hospital.longitude]}
                  icon={hospitalIcon}
                >
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs">
                      <h4 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {hospital.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{hospital.address}</p>
                      <div className="flex justify-between text-[11px] font-semibold pt-1 border-t">
                        <span className="text-sky-700">ICUs: {hospital.availableIcus}</span>
                        <span className="text-amber-700">Ambulances: {hospital.availableAmbulances}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* Ambulances */}
          {showAmbulances &&
            ambulances
              .filter((a) => a.latitude && a.longitude)
              .map((ambulance) => (
                <Marker
                  key={ambulance.id}
                  position={[ambulance.latitude!, ambulance.longitude!]}
                  icon={ambulanceIcon}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <h4 className="font-bold text-amber-700 flex items-center gap-1">
                        <AmbulanceIcon className="h-3.5 w-3.5" />
                        {ambulance.vehicleNumber} ({ambulance.vehicleType})
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Status: <strong className="text-amber-600">{ambulance.status}</strong>
                      </p>
                      <p className="text-[10px] text-slate-500">Driver: {ambulance.driverName}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* Responders */}
          {showResponders &&
            responders
              .filter((r) => r.latitude && r.longitude)
              .map((responder) => (
                <Marker
                  key={responder.id}
                  position={[responder.latitude!, responder.longitude!]}
                  icon={responderIcon}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <h4 className="font-bold text-emerald-700 flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        {responder.name}
                      </h4>
                      <p className="text-[11px] text-slate-600">{responder.specialization || 'Community Volunteer'}</p>
                      <div className={`text-[10px] font-semibold ${responder.isAvailable ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {responder.isAvailable ? 'Available for Dispatch' : 'Occupied'}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
        </MapContainer>
      </div>
    </div>
  );
};
