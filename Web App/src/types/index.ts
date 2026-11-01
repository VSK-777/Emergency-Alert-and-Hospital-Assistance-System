export type UserRole = 'ADMIN' | 'HOSPITAL_STAFF' | 'RESPONDER' | 'CITIZEN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  medications?: string;
  isActive?: boolean;
  hospitalId?: number;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
}

export type IncidentStatus = 
  | 'PENDING' 
  | 'HOSPITAL_NOTIFIED'
  | 'HOSPITAL_ACKNOWLEDGED'
  | 'HOSPITAL_ACCEPTED'
  | 'HOSPITAL_DECLINED'
  | 'AMBULANCE_DISPATCHED'
  | 'RESPONDER_ASSIGNED'
  | 'RESPONDER_ACCEPTED'
  | 'ACKNOWLEDGED' 
  | 'ASSIGNED' 
  | 'DISPATCHED' 
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'ASSISTANCE_STARTED'
  | 'PATIENT_ADMITTED'
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'CANCELLED';

export type IncidentSource = 
  | 'SMARTWATCH_SENSOR'
  | 'MANUAL_SOS'
  | 'SMARTWATCH_AUTO' 
  | 'MOBILE_SOS' 
  | 'MANUAL_WEB' 
  | 'FALL_DETECTION';

export interface DetectionEvent {
  id?: number;
  eventType: string;
  accelerationMagnitude?: number; // Peak G
  angularVelocity?: number; // deg/s or rad/s
  postImpactInactivitySec?: number;
  rawTelemetryJson?: string;
  createdAt?: string;
}

export interface EmergencyIncident {
  id: string;
  userId?: number;
  patientName?: string;
  patientPhone?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  source: IncidentSource;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  detectionReason?: string;
  detectionScore?: number;
  assignedHospitalId?: number;
  assignedHospitalName?: string;
  hospitalAcknowledgement?: string;
  hospitalDeclineReason?: string;
  hospitalPreparationStatus?: string;
  assignedResponderId?: number;
  assignedResponderName?: string;
  responderAcceptanceStatus?: string;
  assignedAmbulanceId?: number;
  assignedAmbulancePlate?: string;
  internalNotes?: string;
  detectionEvent?: DetectionEvent;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  emergencyCapacity: number;
  availableIcus: number;
  availableAmbulances: number;
  isActive: boolean;
  distanceKm?: number;
}

export type AmbulanceStatus = 
  | 'AVAILABLE' 
  | 'ASSIGNED' 
  | 'EN_ROUTE' 
  | 'AT_SCENE' 
  | 'COMPLETED' 
  | 'MAINTENANCE';

export interface Ambulance {
  id: number;
  vehicleNumber: string;
  hospital?: Hospital;
  vehicleType: 'ALS' | 'BLS';
  driverName: string;
  driverPhone: string;
  status: AmbulanceStatus;
  latitude?: number;
  longitude?: number;
  equipment?: string;
  assignedIncidentId?: string;
  updatedAt?: string;
}

export interface Responder {
  id: number;
  userId?: number;
  name: string;
  phoneNumber?: string;
  specialization: string;
  organization?: string;
  verificationStatus?: string;
  certificateDetails?: string;
  skills: string;
  isAvailable: boolean;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  lastActiveAt?: string;
}

export type ExpenseCategory = 
  | 'AMBULANCE' 
  | 'EMERGENCY_ICU' 
  | 'MEDICATION' 
  | 'DIAGNOSTIC' 
  | 'SURGICAL';

export type ExpenseStatus = 'PENDING' | 'VERIFIED' | 'PAID';

export interface MedicalExpense {
  id: number;
  incidentId: string;
  userId: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  status: ExpenseStatus;
  createdAt: string;
}

export interface SmartwatchDevice {
  id: number;
  deviceType: 'SMARTWATCH' | 'MOBILE';
  deviceIdentifier: string;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  batteryLevel?: number;
  imuSamplingRate?: string;
  firmwareVersion?: string;
}

export interface AiTriageRequest {
  query: string;
  emergencyType?: string;
  patientMedicalNotes?: string;
  latitude?: number;
  longitude?: number;
}

export interface AiTriageResponse {
  summary: string;
  triageLevel: 'CRITICAL' | 'URGENT' | 'STABLE';
  immediateActionSteps: string[];
  hospitalPrepRecommendations: string[];
  providerSource: string;
  isAIGenerated: boolean;
  confidenceScore?: number;
}

export interface AuditLog {
  id: number;
  action: string;
  actorEmail?: string;
  actorRole?: string;
  incidentId?: string;
  details?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'emergency' | 'dispatch' | 'system' | 'sync';
  timestamp: string;
  incidentId?: string;
  read: boolean;
}
