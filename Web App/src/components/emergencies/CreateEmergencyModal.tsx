import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useEmergencyStore } from '../../store/emergencyStore';
import { emergencyApi } from '../../api/emergencies';
import type { IncidentSource } from '../../types';
import { AlertTriangle, Watch, Smartphone, MapPin, Activity, CheckCircle2 } from 'lucide-react';

interface CreateEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEmergencyModal: React.FC<CreateEmergencyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { fetchActiveIncidents } = useEmergencyStore();
  const [source, setSource] = useState<IncidentSource>('MANUAL_SOS');
  const [detectionReason, setDetectionReason] = useState(
    'Citizen manual emergency SOS dispatch - Urgent assistance needed'
  );
  const [latitude, setLatitude] = useState(16.3533);
  const [longitude, setLongitude] = useState(80.5238);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload: any = {
        source,
        latitude,
        longitude,
        accuracyMeters: 4.2,
        detectionReason,
        detectionScore: source === 'SMARTWATCH_AUTO' ? 0.94 : 1.0,
      };

      if (source === 'SMARTWATCH_AUTO') {
        payload.detectionEvent = {
          eventType: 'FALL_IMPACT',
          accelerationMagnitude: 3.65,
          angularVelocity: 7.15,
          postImpactInactivitySec: 15,
          rawTelemetryJson: JSON.stringify({
            accel_peak_g: 3.65,
            gyro_dps: 410,
            inactivity_sec: 15,
            impact_axis: 'Z-Y',
            device_model: 'VVIT-WearOS-Round-Watch',
          }),
        };
      }

      await emergencyApi.createIncident(payload);
      await fetchActiveIncidents();

      setFeedback('Emergency alert dispatched to trauma hospital & responder network!');
      setTimeout(() => {
        setIsSubmitting(false);
        setFeedback(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create emergency:', err);
      setFeedback('Error: ' + (err.message || 'Failed to dispatch'));
      setIsSubmitting(false);
    }
  };

  const setPresetLocation = (name: string, lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Emergency SOS Alert"
      subtitle="Immediately broadcasts coordinates and distress parameters to the emergency grid"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {feedback && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Source Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
            Emergency Trigger Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSource('MANUAL_SOS');
                setDetectionReason('Citizen manual emergency SOS dispatch - Urgent medical help requested');
              }}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                source === 'MANUAL_SOS'
                  ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-300 font-bold ring-2 ring-red-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Smartphone className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <p className="text-xs font-bold">Manual SOS Alert</p>
                <p className="text-[10px] opacity-80">Immediate citizen dispatch</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSource('SMARTWATCH_AUTO');
                setDetectionReason('Smartwatch IMU Dual-Peak Impact Detection with Inactivity');
              }}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                source === 'SMARTWATCH_AUTO'
                  ? 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Watch className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <p className="text-xs font-bold">Smartwatch Sensor</p>
                <p className="text-[10px] opacity-80">50Hz IMU Impact Event</p>
              </div>
            </button>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Emergency Condition / Description
          </label>
          <input
            type="text"
            value={detectionReason}
            onChange={(e) => setDetectionReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-red-500 focus:outline-none"
            required
          />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              GPS Latitude
            </label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-red-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              GPS Longitude
            </label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-red-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Location Presets */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Quick Location Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPresetLocation('VVIT Campus', 16.3533, 80.5238)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              VVIT Campus (Nambur)
            </button>
            <button
              type="button"
              onClick={() => setPresetLocation('AIIMS Mangalagiri', 16.4357, 80.5644)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              AIIMS Mangalagiri (NH16)
            </button>
            <button
              type="button"
              onClick={() => setPresetLocation('GGH Guntur', 16.3067, 80.4428)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              GGH Guntur
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 active:scale-95 disabled:opacity-50 transition-all"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{isSubmitting ? 'Transmitting Alert...' : 'Dispatch Live Emergency'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
