-- =============================================================================
-- Migration V6: Synchronize and Ensure Active Demo Passwords
-- Emergency Alert and Hospital Assistance System
-- BCrypt cost 10 hash for 'Password@123': $2a$10$KalzWtS6g3ojOXPSCUbY4ONfzYJVYd5H4x9cLV8CAJDJAREnk9Pae
-- =============================================================================

UPDATE users
SET password_hash = '$2a$10$KalzWtS6g3ojOXPSCUbY4ONfzYJVYd5H4x9cLV8CAJDJAREnk9Pae'
WHERE email IN (
    'vajjhasaikrishna@gmail.com',
    'patient.vsk@vvit.net',
    'admin@vvit.net',
    'hospital.admin@aiims.edu.in',
    'responder@vvit.net',
    'triage.test.citizen@vvit.net'
);

INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active)
SELECT 'admin@vvit.net', '$2a$10$KalzWtS6g3ojOXPSCUbY4ONfzYJVYd5H4x9cLV8CAJDJAREnk9Pae', 'CSP System Administrator', '+919876543212', 'ADMIN', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@vvit.net');
