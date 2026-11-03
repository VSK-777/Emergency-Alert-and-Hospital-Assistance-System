-- =============================================================================
-- Migration V5: Add explicit hardware uptime and multi-stage ingest timestamps
-- Emergency Alert and Hospital Assistance System — VVIT CSP
-- =============================================================================

ALTER TABLE detection_events
    ADD COLUMN IF NOT EXISTS device_uptime_seconds BIGINT,
    ADD COLUMN IF NOT EXISTS mobile_received_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS server_received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS event_persisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_detection_events_uptime ON detection_events (device_uptime_seconds);
