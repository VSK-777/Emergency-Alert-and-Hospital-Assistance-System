-- =============================================================================
-- V9: Update Accurate Hospital & Fleet Coordinates from OpenStreetMap
-- Region: VVIT Nambur, Guntur & Mangalagiri Emergency Corridor (AP)
-- Verified OSM amenity coordinates:
--   - NRI General Hospital: 16.415035, 80.557396 (Chinakakani, Mangalagiri Main Rd)
--   - AIIMS Mangalagiri: 16.446245, 80.580132 (AIIMS Rd, Mangalagiri)
--   - Manipal Hospital Vijayawada: 16.484436, 80.616980 (Service Rd, Tadepalli)
--   - GGH Guntur: 16.299558, 80.443772 (Station Rd, Sambasiva Pet, Guntur)
-- =============================================================================

-- 1. Update NRI General Hospital & Medical College to exact OSM building node
UPDATE hospitals
SET latitude = 16.415035,
    longitude = 80.557396,
    address = 'Mangalagiri Main Road, Chinakakani, AP 522503'
WHERE name LIKE '%NRI%';

-- 2. Update AIIMS Mangalagiri to exact OSM campus coordinates
UPDATE hospitals
SET latitude = 16.446245,
    longitude = 80.580132,
    address = 'All India Institute Of Medical Sciences (AIIMS) Road, Mangalagiri, Guntur District, AP 522503'
WHERE name LIKE '%AIIMS%';

-- 3. Update Manipal Hospital Vijayawada (Tadepalli)
UPDATE hospitals
SET latitude = 16.484436,
    longitude = 80.616980,
    address = 'Service Road, Near Varadhi, Tadepalle, Guntur District, AP 522501'
WHERE name LIKE '%Manipal%';

-- 4. Update Government General Hospital (GGH) Guntur
UPDATE hospitals
SET latitude = 16.299558,
    longitude = 80.443772,
    address = 'Station Road, Sambasiva Pet / Arundelpet, Guntur, AP 522001'
WHERE name LIKE '%GGH%' OR name LIKE '%Government General Hospital%';

-- 5. Synchronize all associated emergency ambulances to their base hospital coordinates
UPDATE ambulances a
SET latitude = h.latitude,
    longitude = h.longitude
FROM hospitals h
WHERE a.hospital_id = h.id;
