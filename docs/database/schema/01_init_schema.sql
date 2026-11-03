-- =============================================================================
-- Emergency Alert and Hospital Assistance System
-- Database Schema: MySQL 8.x / 9.x Compatible
-- B.Tech Community Service Project (VVIT - CSE Batch 8 - VSK)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'CITIZEN',
    blood_group VARCHAR(10),
    allergies TEXT,
    medical_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_devices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    device_type VARCHAR(30) NOT NULL,
    device_identifier VARCHAR(100) NOT NULL,
    fcm_token VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_device_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hospitals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    emergency_capacity INT DEFAULT 20,
    available_icus INT DEFAULT 5,
    available_ambulances INT DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS responders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    skills TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    latitude DOUBLE,
    longitude DOUBLE,
    last_active_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_responder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS emergency_incidents (
    id VARCHAR(64) PRIMARY KEY, -- UUID or client-generated idempotent ID
    user_id BIGINT NULL,
    source VARCHAR(40) NOT NULL, -- SMARTWATCH_AUTO, SMARTWATCH_SOS, MOBILE_SOS, MANUAL
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, DISPATCHED, EN_ROUTE, ARRIVED, RESOLVED, CANCELLED
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    accuracy_meters DOUBLE,
    location_timestamp TIMESTAMP NULL,
    detection_reason VARCHAR(255),
    detection_score DOUBLE,
    assigned_hospital_id BIGINT NULL,
    assigned_responder_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    CONSTRAINT fk_incident_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_incident_hospital FOREIGN KEY (assigned_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    CONSTRAINT fk_incident_responder FOREIGN KEY (assigned_responder_id) REFERENCES responders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS detection_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    acceleration_magnitude DOUBLE,
    angular_velocity DOUBLE,
    post_impact_inactivity_sec INT,
    raw_telemetry_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_incident FOREIGN KEY (incident_id) REFERENCES emergency_incidents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notification_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL,
    recipient_type VARCHAR(30) NOT NULL, -- CONTACT, RESPONDER, HOSPITAL, AMBULANCE_DISPATCH
    recipient_id VARCHAR(100) NOT NULL,
    channel VARCHAR(30) NOT NULL, -- FCM, SMS, REST_HOOK, MOCK_DISPATCH
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, DELIVERED, ACKNOWLEDGED, FAILED
    message_payload TEXT,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_incident FOREIGN KEY (incident_id) REFERENCES emergency_incidents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS medical_expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL, -- AMBULANCE, EMERGENCY_ROOM, MEDICATION, SURGERY, ICU, MISC
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, PAID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_incident FOREIGN KEY (incident_id) REFERENCES emergency_incidents(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS synchronization_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    incident_id VARCHAR(64) NOT NULL,
    device_id VARCHAR(100),
    sync_status VARCHAR(30) NOT NULL, -- SYNCED, FAILED
    payload_hash VARCHAR(128),
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_incidents_status ON emergency_incidents(status);
CREATE INDEX idx_incidents_user ON emergency_incidents(user_id);
CREATE INDEX idx_hospitals_location ON hospitals(latitude, longitude);
