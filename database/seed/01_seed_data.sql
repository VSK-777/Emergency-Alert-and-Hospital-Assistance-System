-- =============================================================================
-- Seed Data: Emergency Alert and Hospital Assistance System
-- VVIT Region (Guntur / Nambur / Vijayawada, Andhra Pradesh)
-- =============================================================================

-- Seed Users (Passwords hashed with BCrypt for 'Password@123': $2a$10$w8T9QW3uGvK9xH5W5E6y8e0K4nI1X1l4/zW9XvV4J4q3B3C3D3E3F)
-- Standard test hash: $2a$10$7Z8/kFqP4hZ.r68y.jH82edQ/aWbU.K0Y0p1/j.H1.lQ6.Y7Z0kCe (which resolves to 'Password@123')
INSERT INTO users (id, email, password_hash, full_name, phone_number, role, blood_group, allergies, medical_conditions)
VALUES
(1, 'patient.vsk@vvit.net', '$2a$10$7Z8/kFqP4hZ.r68y.jH82edQ/aWbU.K0Y0p1/j.H1.lQ6.Y7Z0kCe', 'Sai Krishna VSK', '+919876543210', 'CITIZEN', 'O+', 'Penicillin', 'Asthma (Mild)'),
(2, 'responder@vvit.net', '$2a$10$7Z8/kFqP4hZ.r68y.jH82edQ/aWbU.K0Y0p1/j.H1.lQ6.Y7Z0kCe', 'Ramesh Kumar T', '+919876543211', 'RESPONDER', 'B+', 'None', 'Trained Paramedic'),
(3, 'hospital.admin@aiims.edu.in', '$2a$10$7Z8/kFqP4hZ.r68y.jH82edQ/aWbU.K0Y0p1/j.H1.lQ6.Y7Z0kCe', 'AIIMS Mangalagiri Emergency Admin', '+918645280000', 'HOSPITAL_STAFF', 'A+', 'None', 'Emergency Dept Chief'),
(4, 'admin@vvit.net', '$2a$10$7Z8/kFqP4hZ.r68y.jH82edQ/aWbU.K0Y0p1/j.H1.lQ6.Y7Z0kCe', 'CSP System Administrator', '+919876543212', 'ADMIN', 'AB+', 'None', 'System Admin');

-- Seed Emergency Contacts for User 1
INSERT INTO emergency_contacts (id, user_id, name, relationship, phone_number, is_primary)
VALUES
(1, 1, 'Bhargav T (Guardian)', 'Brother', '+919876543220', TRUE),
(2, 1, 'Teja Y (Emergency Contact)', 'Friend', '+919876543221', FALSE);

-- Seed Hospitals near VVIT Nambur / Guntur / Mangalagiri
INSERT INTO hospitals (id, name, address, latitude, longitude, phone_number, emergency_capacity, available_icus, available_ambulances, is_active)
VALUES
(1, 'AIIMS Mangalagiri', 'NH 16, Mangalagiri, Guntur District, AP 522503', 16.4357, 80.5644, '+918645280000', 50, 15, 6, TRUE),
(2, 'Manipal Hospital Vijayawada', 'Near Kanuru, Tadepalli, Guntur Dist, AP', 16.4862, 80.6124, '+918662499999', 35, 8, 4, TRUE),
(3, 'Government General Hospital (GGH) Guntur', 'Sambasiva Pet, Guntur, AP 522001', 16.3067, 80.4365, '+918632220000', 60, 20, 8, TRUE),
(4, 'NRI General Hospital & Medical College', 'Chinakakani, Mangalagiri, AP 522503', 16.4172, 80.5512, '+918645230101', 40, 10, 5, TRUE);

-- Seed Responders
INSERT INTO responders (id, user_id, specialization, skills, is_available, latitude, longitude, last_active_at)
VALUES
(1, 2, 'Certified Emergency First Responder', 'CPR, Bleeding Control, Defibrillator, Immobilization', TRUE, 16.3520, 80.5240, NOW());

-- Seed Initial Incident Example
INSERT INTO emergency_incidents (id, user_id, source, status, latitude, longitude, accuracy_meters, location_timestamp, detection_reason, detection_score, assigned_hospital_id, assigned_responder_id, created_at)
VALUES
('inc-seed-001', 1, 'SMARTWATCH_AUTO', 'DISPATCHED', 16.3533, 80.5238, 4.5, NOW(), 'High Impact Fall with Post-Impact Inactivity', 0.92, 1, 1, NOW());

INSERT INTO detection_events (id, incident_id, event_type, acceleration_magnitude, angular_velocity, post_impact_inactivity_sec, raw_telemetry_json, created_at)
VALUES
(1, 'inc-seed-001', 'FALL_IMPACT', 3.42, 6.15, 12, '{"accel_peak_g": 3.42, "gyro_dps": 352, "stillness_duration_s": 12}', NOW());

INSERT INTO notification_attempts (id, incident_id, recipient_type, recipient_id, channel, status, message_payload, attempted_at)
VALUES
(1, 'inc-seed-001', 'HOSPITAL', '1', 'REST_HOOK', 'ACKNOWLEDGED', '{"alert": "Critical Fall Incident at VVIT Nambur", "patient_id": 1}', NOW()),
(2, 'inc-seed-001', 'CONTACT', '+919876543220', 'SMS', 'DELIVERED', 'Emergency Alert: High-impact accident detected for Sai Krishna VSK near VVIT.', NOW());

INSERT INTO medical_expenses (id, incident_id, user_id, category, description, amount, status, created_at)
VALUES
(1, 'inc-seed-001', 1, 'AMBULANCE', 'Emergency Rapid Response Ambulance Transit to AIIMS', 1200.00, 'VERIFIED', NOW()),
(2, 'inc-seed-001', 1, 'EMERGENCY_ROOM', 'Emergency Trauma Room Assessment and Stabilization', 2500.00, 'PENDING', NOW());
