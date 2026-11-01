import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/ambulance_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/hospital_provider.dart';
import '../../providers/responder_provider.dart';
import '../../models/ambulance_model.dart';
import '../../models/hospital_model.dart';
import '../../models/responder_model.dart';

class OfflineMapScreen extends ConsumerStatefulWidget {
  const OfflineMapScreen({super.key});

  @override
  ConsumerState<OfflineMapScreen> createState() => _OfflineMapScreenState();
}

class _OfflineMapScreenState extends ConsumerState<OfflineMapScreen> {
  late final MapController _mapController;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
  }

  @override
  Widget build(BuildContext context) {
    final emergencyState = ref.watch(emergencyNotifierProvider);
    final hospitalsAsync = ref.watch(hospitalsProvider);
    final ambState = ref.watch(ambulanceNotifierProvider);
    final respState = ref.watch(responderNotifierProvider);

    final userLoc = LatLng(
      emergencyState.currentLatitude,
      emergencyState.currentLongitude,
    );

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Emergency Resource Map',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              'Service: OpenStreetMap (https://www.openstreetmap.org)',
              style: TextStyle(fontSize: 10, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Re-center My Location',
            icon: const Icon(Icons.my_location),
            onPressed: () {
              _mapController.move(userLoc, 13.5);
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: userLoc,
              initialZoom: 13.0,
              minZoom: 4.0,
              maxZoom: 18.0,
            ),
            children: [
              // OpenStreetMap Standard Raster Tile Layer
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'net.vvit.csp.emergency_assistance_app',
              ),
              MarkerLayer(
                markers: [
                  // 1. User Current GPS Location
                  Marker(
                    point: userLoc,
                    width: 50,
                    height: 50,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: AppTheme.emergencyRed,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.person_pin_circle,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // 2. Hospital Markers
                  ...hospitalsAsync.maybeWhen(
                    data: (hospitals) => hospitals.map(
                      (h) => Marker(
                        point: LatLng(h.latitude, h.longitude),
                        width: 130,
                        height: 55,
                        child: GestureDetector(
                          onTap: () => _showHospitalSheet(context, h),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 5,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.trustBlue,
                                  borderRadius: BorderRadius.circular(4),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Colors.black26,
                                      blurRadius: 3,
                                    ),
                                  ],
                                ),
                                child: Text(
                                  h.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const Icon(
                                Icons.local_hospital,
                                color: AppTheme.trustBlue,
                                size: 22,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    orElse: () => [],
                  ),

                  // 3. Ambulance Fleet Markers
                  ...ambState.ambulances.map(
                    (amb) => Marker(
                      point: LatLng(amb.latitude, amb.longitude),
                      width: 120,
                      height: 55,
                      child: GestureDetector(
                        onTap: () => _showAmbulanceSheet(context, amb),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 5,
                                vertical: 1,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.deepOrange,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                amb.registrationNumber,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const Icon(
                              Icons.airport_shuttle,
                              color: Colors.deepOrange,
                              size: 22,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // 4. Community Responder Markers
                  ...respState.nearbyResponders.map(
                    (resp) => Marker(
                      point: LatLng(resp.latitude, resp.longitude),
                      width: 110,
                      height: 50,
                      child: GestureDetector(
                        onTap: () => _showResponderSheet(context, resp),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                                vertical: 1,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.green.shade800,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                resp.fullName,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                              ),
                            ),
                            const Icon(
                              Icons.volunteer_activism,
                              color: Colors.green,
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Map Legend / GPS Status Banner
          Positioned(
            top: 10,
            left: 10,
            right: 10,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.94),
                borderRadius: BorderRadius.circular(8),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 4),
                ],
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.person_pin_circle,
                        size: 14,
                        color: AppTheme.emergencyRed,
                      ),
                      SizedBox(width: 4),
                      Text(
                        'You',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Icon(
                        Icons.local_hospital,
                        size: 14,
                        color: AppTheme.trustBlue,
                      ),
                      SizedBox(width: 4),
                      Text(
                        'Hospitals',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Icon(
                        Icons.airport_shuttle,
                        size: 14,
                        color: Colors.deepOrange,
                      ),
                      SizedBox(width: 4),
                      Text(
                        'Ambulances',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Icon(
                        Icons.volunteer_activism,
                        size: 14,
                        color: Colors.green,
                      ),
                      SizedBox(width: 4),
                      Text(
                        'Responders',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Bottom OpenStreetMap Attribution Banner
          Positioned(
            bottom: 6,
            left: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.88),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text(
                    'Map: OpenStreetMap (https://www.openstreetmap.org)',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  Text(
                    '© OpenStreetMap contributors',
                    style: TextStyle(fontSize: 8, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showHospitalSheet(BuildContext context, HospitalModel h) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              h.name,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.trustBlue,
              ),
            ),
            Text(
              h.address,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Text(
                  'Trauma Beds: ${h.emergencyCapacity}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'ICU Beds: ${h.availableIcus}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
                Text(
                  'Ambulances: ${h.availableAmbulances}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.teal,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.call),
                    label: Text('Call ER Desk: ${h.phoneNumber}'),
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Dialing ${h.name} ER desk...')),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'OpenStreetMap Link: https://www.openstreetmap.org/?mlat=${h.latitude}&mlon=${h.longitude}#map=16/${h.latitude}/${h.longitude}',
              style: const TextStyle(fontSize: 9, color: Colors.blueGrey),
            ),
          ],
        ),
      ),
    );
  }

  void _showAmbulanceSheet(BuildContext context, AmbulanceModel amb) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Ambulance ${amb.registrationNumber} (${amb.type})',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.deepOrange,
              ),
            ),
            Text(
              'Status: ${amb.status} • Stationed: ${amb.hospitalName ?? 'AIIMS Mangalagiri'}',
              style: const TextStyle(fontSize: 12),
            ),
            Text(
              'Driver: ${amb.driverName} • ETA: ${amb.etaMinutes} mins',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.deepOrange,
                    ),
                    icon: const Icon(Icons.phone),
                    label: Text('Call Driver (${amb.driverPhone})'),
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Calling Driver ${amb.driverName}...'),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'OpenStreetMap Location: https://www.openstreetmap.org/?mlat=${amb.latitude}&mlon=${amb.longitude}#map=16/${amb.latitude}/${amb.longitude}',
              style: const TextStyle(fontSize: 9, color: Colors.blueGrey),
            ),
          ],
        ),
      ),
    );
  }

  void _showResponderSheet(BuildContext context, ResponderModel resp) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              resp.fullName,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
            Text(
              '${resp.organization} • ${resp.verificationStatus}',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            Text(
              'Skills: ${resp.skills.join(", ")}',
              style: const TextStyle(fontSize: 11),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade800,
                    ),
                    icon: const Icon(Icons.chat),
                    label: Text('Contact Responder (${resp.phoneNumber})'),
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Contacting responder ${resp.fullName}...',
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'OpenStreetMap Location: https://www.openstreetmap.org/?mlat=${resp.latitude}&mlon=${resp.longitude}#map=16/${resp.latitude}/${resp.longitude}',
              style: const TextStyle(fontSize: 9, color: Colors.blueGrey),
            ),
          ],
        ),
      ),
    );
  }
}
