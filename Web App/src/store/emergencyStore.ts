import { create } from 'zustand';
import type { EmergencyIncident, IncidentStatus } from '../types';
import { emergencyApi } from '../api/emergencies';
import { useNotificationStore } from './notificationStore';

interface EmergencyState {
  activeIncidents: EmergencyIncident[];
  allIncidents: EmergencyIncident[];
  selectedIncident: EmergencyIncident | null;
  isLoading: boolean;
  sseStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  soundEnabled: boolean;
  eventSource: EventSource | null;

  fetchActiveIncidents: () => Promise<void>;
  fetchAllIncidents: () => Promise<void>;
  setSelectedIncident: (incident: EmergencyIncident | null) => void;
  selectIncidentById: (id: string) => Promise<void>;
  initSseStream: () => Promise<void>;
  closeSseStream: () => void;
  toggleSound: () => void;
  updateStatus: (id: string, status: IncidentStatus, hospitalId?: number, responderId?: number) => Promise<void>;
  cancelIncident: (id: string) => Promise<void>;
}

// Audio synthesizer for emergency alerts
const playEmergencyTone = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.7);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.75);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  activeIncidents: [],
  allIncidents: [],
  selectedIncident: null,
  isLoading: false,
  sseStatus: 'DISCONNECTED',
  soundEnabled: true,
  eventSource: null,

  fetchActiveIncidents: async () => {
    try {
      const active = await emergencyApi.getActiveIncidents();
      set({ activeIncidents: active });
    } catch (err) {
      console.error('Failed to load active emergencies:', err);
    }
  },

  fetchAllIncidents: async () => {
    set({ isLoading: true });
    try {
      const all = await emergencyApi.getAllIncidents();
      set({ allIncidents: all, isLoading: false });
    } catch (err) {
      console.error('Failed to load all emergencies:', err);
      set({ isLoading: false });
    }
  },

  setSelectedIncident: (incident: EmergencyIncident | null) => {
    set({ selectedIncident: incident });
  },

  selectIncidentById: async (id: string) => {
    try {
      const incident = await emergencyApi.getIncidentById(id);
      set({ selectedIncident: incident });
    } catch (err) {
      console.error('Failed to get incident details:', err);
    }
  },

  initSseStream: async () => {
    const current = get().eventSource;
    if (current) {
      current.close();
    }

    set({ sseStatus: 'CONNECTING' });

    try {
      const es = await emergencyApi.createSseSource();

      es.onopen = () => {
        set({ sseStatus: 'CONNECTED' });
      };

      es.addEventListener('EMERGENCY_ALERT', (event: MessageEvent) => {
        try {
          const incident: EmergencyIncident = JSON.parse(event.data);
          
          set((state) => {
            const exists = state.activeIncidents.some((i) => i.id === incident.id);
            const updatedActive = exists
              ? state.activeIncidents.map((i) => (i.id === incident.id ? incident : i))
              : [incident, ...state.activeIncidents];

            const updatedAll = state.allIncidents.some((i) => i.id === incident.id)
              ? state.allIncidents.map((i) => (i.id === incident.id ? incident : i))
              : [incident, ...state.allIncidents];

            return {
              activeIncidents: updatedActive,
              allIncidents: updatedAll,
              selectedIncident: state.selectedIncident?.id === incident.id ? incident : state.selectedIncident,
            };
          });

          // Play alarm if enabled
          if (get().soundEnabled) {
            playEmergencyTone();
          }

          // Push to notification center
          useNotificationStore.getState().addNotification({
            title: `CRITICAL ALERT: ${incident.source}`,
            message: `${incident.patientName || 'Patient'} triggered emergency: ${incident.detectionReason || 'Impact detected'}`,
            type: 'emergency',
            incidentId: incident.id,
          });
        } catch (e) {
          console.error('Error parsing SSE incident message:', e);
        }
      });

      es.onerror = () => {
        set({ sseStatus: 'DISCONNECTED' });
      };

      set({ eventSource: es });
    } catch (err) {
      console.error('Failed to initialize SSE:', err);
      set({ sseStatus: 'DISCONNECTED' });
    }
  },

  closeSseStream: () => {
    const current = get().eventSource;
    if (current) {
      current.close();
      set({ eventSource: null, sseStatus: 'DISCONNECTED' });
    }
  },

  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
  },

  updateStatus: async (id: string, status: IncidentStatus, hospitalId?: number, responderId?: number) => {
    try {
      const updated = await emergencyApi.updateStatus(id, { status, hospitalId, responderId });
      set((state) => ({
        activeIncidents: status === 'RESOLVED' || status === 'CANCELLED'
          ? state.activeIncidents.filter((i) => i.id !== id)
          : state.activeIncidents.map((i) => (i.id === id ? updated : i)),
        allIncidents: state.allIncidents.map((i) => (i.id === id ? updated : i)),
        selectedIncident: state.selectedIncident?.id === id ? updated : state.selectedIncident,
      }));

      useNotificationStore.getState().addNotification({
        title: `Status Updated to ${status}`,
        message: `Incident ${id} updated successfully.`,
        type: 'dispatch',
        incidentId: id,
      });
    } catch (err) {
      console.error('Failed to update incident status:', err);
      throw err;
    }
  },

  cancelIncident: async (id: string) => {
    try {
      const cancelled = await emergencyApi.cancelIncident(id);
      set((state) => ({
        activeIncidents: state.activeIncidents.filter((i) => i.id !== id),
        allIncidents: state.allIncidents.map((i) => (i.id === id ? cancelled : i)),
        selectedIncident: state.selectedIncident?.id === id ? cancelled : state.selectedIncident,
      }));

      useNotificationStore.getState().addNotification({
        title: 'Emergency Incident Cancelled',
        message: `Incident ${id} was marked as false alarm / cancelled.`,
        type: 'system',
        incidentId: id,
      });
    } catch (err) {
      console.error('Failed to cancel incident:', err);
      throw err;
    }
  },
}));
