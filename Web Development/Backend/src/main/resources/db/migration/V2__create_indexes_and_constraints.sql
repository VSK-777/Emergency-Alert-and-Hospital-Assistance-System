-- =============================================================================
-- Migration V2: Foreign Key Constraints and Performance Indexes
-- Emergency Alert and Hospital Assistance System
-- =============================================================================

-- Foreign Keys (Individual standard ALTER TABLE statements)
ALTER TABLE responders
    ADD CONSTRAINT fk_responders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_devices
    ADD CONSTRAINT fk_user_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE emergency_contacts
    ADD CONSTRAINT fk_emergency_contacts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE emergency_incidents
    ADD CONSTRAINT fk_emergency_incidents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE emergency_incidents
    ADD CONSTRAINT fk_emergency_incidents_hospital FOREIGN KEY (assigned_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;

ALTER TABLE emergency_incidents
    ADD CONSTRAINT fk_emergency_incidents_responder FOREIGN KEY (assigned_responder_id) REFERENCES responders(id) ON DELETE SET NULL;

ALTER TABLE ambulances
    ADD CONSTRAINT fk_ambulances_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;

ALTER TABLE detection_events
    ADD CONSTRAINT fk_detection_events_incident FOREIGN KEY (incident_id) REFERENCES emergency_incidents(id) ON DELETE CASCADE;

ALTER TABLE notification_attempts
    ADD CONSTRAINT fk_notification_attempts_incident FOREIGN KEY (incident_id) REFERENCES emergency_incidents(id) ON DELETE CASCADE;

ALTER TABLE medical_expenses
    ADD CONSTRAINT fk_medical_expenses_incident FOREIGN KEY (incident_id) REFERENCES emergency_incidents(id) ON DELETE CASCADE;

ALTER TABLE medical_expenses
    ADD CONSTRAINT fk_medical_expenses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

CREATE INDEX IF NOT EXISTS idx_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_identifier ON user_devices(device_identifier);

CREATE INDEX IF NOT EXISTS idx_contacts_user ON emergency_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_incidents_user ON emergency_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON emergency_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_source ON emergency_incidents(source);
CREATE INDEX IF NOT EXISTS idx_incidents_hospital ON emergency_incidents(assigned_hospital_id);
CREATE INDEX IF NOT EXISTS idx_incidents_responder ON emergency_incidents(assigned_responder_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON emergency_incidents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ambulances_hospital ON ambulances(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status);

CREATE INDEX IF NOT EXISTS idx_detection_incident ON detection_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_notifications_incident ON notification_attempts(incident_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user ON medical_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_incident ON medical_expenses(incident_id);

CREATE INDEX IF NOT EXISTS idx_sync_incident ON synchronization_records(incident_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_incident ON audit_logs(incident_id);
