-- =============================================================================
-- V8: Seed Regional Partner Hospitals and Emergency Ambulances
-- Emergency Alert and Hospital Assistance System - VVIT Community Service Project
-- Region: VVIT Nambur, Guntur & Mangalagiri Emergency Corridor (AP)
-- =============================================================================

-- 1. Insert Core Regional Partner Hospitals
INSERT INTO hospitals (name, address, latitude, longitude, phone_number, emergency_capacity, available_icus, available_ambulances, is_active)
SELECT 'AIIMS Mangalagiri', 'NH 16, Mangalagiri, Guntur District, AP 522503', 16.4357, 80.5644, '+918645280000', 50, 15, 6, TRUE
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'AIIMS Mangalagiri');

INSERT INTO hospitals (name, address, latitude, longitude, phone_number, emergency_capacity, available_icus, available_ambulances, is_active)
SELECT 'Manipal Hospital Vijayawada', 'Near Kanuru, Tadepalli, Guntur Dist, AP', 16.4862, 80.6124, '+918662499999', 35, 8, 4, TRUE
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Manipal Hospital Vijayawada');

INSERT INTO hospitals (name, address, latitude, longitude, phone_number, emergency_capacity, available_icus, available_ambulances, is_active)
SELECT 'Government General Hospital (GGH) Guntur', 'Sambasiva Pet, Guntur, AP 522001', 16.3067, 80.4365, '+918632220000', 60, 20, 8, TRUE
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Government General Hospital (GGH) Guntur');

INSERT INTO hospitals (name, address, latitude, longitude, phone_number, emergency_capacity, available_icus, available_ambulances, is_active)
SELECT 'NRI General Hospital & Medical College', 'Chinakakani, Mangalagiri, AP 522503', 16.4172, 80.5512, '+918645230101', 40, 10, 5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'NRI General Hospital & Medical College');

-- 2. Insert Core Regional Emergency Ambulances
INSERT INTO ambulances (vehicle_number, hospital_id, vehicle_type, driver_name, driver_phone, status, latitude, longitude, equipment)
SELECT 'AP-07-EM-1081', (SELECT id FROM hospitals WHERE name = 'AIIMS Mangalagiri' LIMIT 1), 'ADVANCED_LIFE_SUPPORT', 'Srinivas Rao', '+919848012345', 'AVAILABLE', 16.4357, 80.5644, 'Ventilator, Defibrillator, Cardiac Monitor'
WHERE NOT EXISTS (SELECT 1 FROM ambulances WHERE vehicle_number = 'AP-07-EM-1081');

INSERT INTO ambulances (vehicle_number, hospital_id, vehicle_type, driver_name, driver_phone, status, latitude, longitude, equipment)
SELECT 'AP-07-EM-1082', (SELECT id FROM hospitals WHERE name = 'Manipal Hospital Vijayawada' LIMIT 1), 'ADVANCED_LIFE_SUPPORT', 'K. Venkat', '+919848023456', 'AVAILABLE', 16.4862, 80.6124, 'Defibrillator, Oxygen Cylinder, Suction Unit'
WHERE NOT EXISTS (SELECT 1 FROM ambulances WHERE vehicle_number = 'AP-07-EM-1082');

INSERT INTO ambulances (vehicle_number, hospital_id, vehicle_type, driver_name, driver_phone, status, latitude, longitude, equipment)
SELECT 'AP-07-EM-1083', (SELECT id FROM hospitals WHERE name = 'Government General Hospital (GGH) Guntur' LIMIT 1), 'BASIC_LIFE_SUPPORT', 'M. Anjaneyulu', '+919848034567', 'AVAILABLE', 16.3067, 80.4365, 'First Aid, Stretcher, Oxygen'
WHERE NOT EXISTS (SELECT 1 FROM ambulances WHERE vehicle_number = 'AP-07-EM-1083');

INSERT INTO ambulances (vehicle_number, hospital_id, vehicle_type, driver_name, driver_phone, status, latitude, longitude, equipment)
SELECT 'AP-07-EM-1084', (SELECT id FROM hospitals WHERE name = 'NRI General Hospital & Medical College' LIMIT 1), 'ADVANCED_LIFE_SUPPORT', 'P. Ramu', '+919848045678', 'AVAILABLE', 16.4172, 80.5512, 'Ventilator, ECG, CPR Equipment'
WHERE NOT EXISTS (SELECT 1 FROM ambulances WHERE vehicle_number = 'AP-07-EM-1084');
