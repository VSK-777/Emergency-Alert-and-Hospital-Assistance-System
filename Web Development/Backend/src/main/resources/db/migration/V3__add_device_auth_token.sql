-- =============================================================================
-- Migration V3: Add per-device enrollment authentication token hash
-- Emergency Alert and Hospital Assistance System — VVIT CSP
-- =============================================================================

ALTER TABLE user_devices ADD COLUMN auth_token_hash VARCHAR(255);
