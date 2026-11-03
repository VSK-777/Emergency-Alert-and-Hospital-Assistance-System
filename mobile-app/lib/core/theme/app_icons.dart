import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Centralized Iconography & Brand System for Emergency Alert & Hospital Assistance System.
/// Strictly follows: Minimal + Futuristic + Professional + Premium + Clean.
///
/// Features:
/// 1. [BrandLogoWidget] - Canvas-rendered vector mark combining:
///    - Protective Shield (Defense & Patient Safety)
///    - Clinical Medical Cross (Emergency Healthcare)
///    - Vitallink Cardiac ECG Waveform (Real-time life telemetry)
///    - Radiating Location Radar Beacon (GPS dispatch signal)
/// 2. [AppIcons] - Coherent semantic icon mappings with zero misrepresentations.
class AppIcons {
  // Brand & Master Symbols
  static Widget brandLogo({
    double size = 48.0,
    bool withGlow = false,
    bool isGlyphOnly = false,
  }) {
    return BrandLogoWidget(
      size: size,
      withGlow: withGlow,
      isGlyphOnly: isGlyphOnly,
    );
  }

  // --- Emergency & SOS ---
  static const IconData sos = Icons.crisis_alert_rounded;
  static const IconData emergencyBeacon = Icons.fmd_bad_outlined;
  static const IconData accidentDetection = Icons.car_crash_outlined;
  static const IconData fallImpact = Icons.personal_injury_outlined;
  static const IconData warning = Icons.warning_amber_rounded;
  static const IconData alertCritical = Icons.report_problem_rounded;
  static const IconData cancelEmergency = Icons.cancel_outlined;

  // --- Healthcare & Medical Services ---
  static const IconData hospital = Icons.local_hospital_outlined;
  static const IconData ambulance = Icons.airport_shuttle_outlined; // Proper medical transit vehicle
  static const IconData firstAid = Icons.medical_services_outlined;  // Proper first aid kit
  static const IconData medicalInfo = Icons.health_and_safety_outlined;
  static const IconData medicalRecord = Icons.description_outlined;
  static const IconData medication = Icons.medication_outlined;
  static const IconData expenses = Icons.receipt_long_outlined;
  static const IconData bloodType = Icons.bloodtype_outlined;
  static const IconData heartPulse = Icons.monitor_heart_outlined;
  static const IconData bed = Icons.bed_outlined;
  static const IconData triageAi = Icons.psychology_outlined;

  // --- Telemetry, Smartwatch & Sensors ---
  static const IconData watch = Icons.watch_outlined;
  static const IconData sensors = Icons.sensors_outlined;
  static const IconData liveLocation = Icons.my_location_outlined;
  static const IconData map = Icons.map_outlined;
  static const IconData navigation = Icons.navigation_outlined;
  static const IconData offlineSync = Icons.sync_outlined;
  static const IconData offlineMesh = Icons.cloud_sync_outlined;
  static const IconData battery = Icons.battery_charging_full_outlined;
  static const IconData signal = Icons.signal_cellular_alt_outlined;

  // --- Responders & Field Coordination ---
  static const IconData responder = Icons.shield_outlined;
  static const IconData responderActive = Icons.verified_user_outlined;
  static const IconData emergencyContact = Icons.contact_phone_outlined;
  static const IconData phone = Icons.phone_outlined;
  static const IconData callEmergency = Icons.phone_in_talk_outlined;

  // --- Interface & Controls ---
  static const IconData userProfile = Icons.account_circle_outlined;
  static const IconData settings = Icons.tune_outlined;
  static const IconData notifications = Icons.notifications_active_outlined;
  static const IconData notificationNone = Icons.notifications_none_outlined;
  static const IconData search = Icons.search_rounded;
  static const IconData refresh = Icons.refresh_rounded;
  static const IconData success = Icons.check_circle_outline_rounded;
  static const IconData verified = Icons.verified_outlined;
  static const IconData lock = Icons.lock_outline_rounded;
  static const IconData email = Icons.email_outlined;
  static const IconData edit = Icons.edit_outlined;
  static const IconData arrowForward = Icons.arrow_forward_rounded;
  static const IconData arrowBack = Icons.arrow_back_rounded;
  static const IconData close = Icons.close_rounded;
}

/// Canvas-rendered vector mark for the Unified Brand Symbol.
/// Scales sharply at all device densities without raster artifacts.
class BrandLogoWidget extends StatelessWidget {
  final double size;
  final bool withGlow;
  final bool isGlyphOnly;

  const BrandLogoWidget({
    super.key,
    this.size = 48.0,
    this.withGlow = false,
    this.isGlyphOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: withGlow
          ? BoxDecoration(
              shape: isGlyphOnly ? BoxShape.circle : BoxShape.rectangle,
              borderRadius: isGlyphOnly ? null : BorderRadius.circular(size * 0.25),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.4),
                  blurRadius: size * 0.35,
                  spreadRadius: 2,
                ),
              ],
            )
          : null,
      child: CustomPaint(
        size: Size(size, size),
        painter: BrandLogoPainter(isGlyphOnly: isGlyphOnly),
      ),
    );
  }
}

class BrandLogoPainter extends CustomPainter {
  final bool isGlyphOnly;

  BrandLogoPainter({this.isGlyphOnly = false});

  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double h = size.height;
    final double scale = w / 100.0;

    // 1. Squircle Container Background (if not glyph-only)
    if (!isGlyphOnly) {
      final RRect squircle = RRect.fromRectAndRadius(
        Rect.fromLTWH(2 * scale, 2 * scale, 96 * scale, 96 * scale),
        Radius.circular(22 * scale),
      );
      final Paint bgPaint = Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF020617)],
        ).createShader(Rect.fromLTWH(0, 0, w, h));
      canvas.drawRRect(squircle, bgPaint);

      final Paint bgStroke = Paint()
        ..color = const Color(0xFF334155).withValues(alpha: 0.6)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0 * scale;
      canvas.drawRRect(squircle, bgStroke);
    }

    final double fgScale = isGlyphOnly ? 0.95 : 0.78;
    final double offsetX = (w - w * fgScale) / 2;
    final double offsetY = (h - h * fgScale) / 2;

    canvas.save();
    canvas.translate(offsetX, offsetY);
    canvas.scale(fgScale * scale, fgScale * scale);

    // 2. Dispatch Radar Signal Arcs at Apex
    final Paint radarPaint1 = Paint()
      ..color = const Color(0xFF38BDF8).withValues(alpha: 0.65)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2.0;
    canvas.drawArc(
      const Rect.fromLTWH(42, 8, 16, 16),
      math.pi,
      math.pi,
      false,
      radarPaint1,
    );

    final Paint radarPaint2 = Paint()
      ..color = const Color(0xFF38BDF8).withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 1.6;
    canvas.drawArc(
      const Rect.fromLTWH(37, 3, 26, 26),
      math.pi,
      math.pi,
      false,
      radarPaint2,
    );

    // 3. Protective Shield Silhouette
    final Path shieldPath = Path();
    shieldPath.moveTo(50, 18);
    shieldPath.cubicTo(68, 18, 84, 23, 84, 39);
    shieldPath.cubicTo(84, 65, 66, 82, 50, 90);
    shieldPath.cubicTo(34, 82, 16, 65, 16, 39);
    shieldPath.cubicTo(16, 23, 32, 18, 50, 18);
    shieldPath.close();

    final Paint shieldFill = Paint()
      ..color = const Color(0xFF0F172A)
      ..style = PaintingStyle.fill;
    canvas.drawPath(shieldPath, shieldFill);

    final Paint shieldRim = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF38BDF8), Color(0xFF818CF8), Color(0xFFEF4444)],
      ).createShader(const Rect.fromLTWH(16, 18, 68, 72))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.6
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(shieldPath, shieldRim);

    // 4. Medical Cross Arm Geometries
    final Paint crossPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFFFF4D4D), Color(0xFFDC2626)],
      ).createShader(const Rect.fromLTWH(24, 26, 52, 52))
      ..style = PaintingStyle.fill;

    // Vertical Beam
    final RRect verticalArm = RRect.fromRectAndRadius(
      const Rect.fromLTWH(43.5, 27, 13, 50),
      const Radius.circular(4.5),
    );
    canvas.drawRRect(verticalArm, crossPaint);

    // Horizontal Beam
    final RRect horizontalArm = RRect.fromRectAndRadius(
      const Rect.fromLTWH(25, 45.5, 50, 13),
      const Radius.circular(4.5),
    );
    canvas.drawRRect(horizontalArm, crossPaint);

    // 5. Vitallink Cardiac ECG Waveform
    final Path ecgPath = Path();
    ecgPath.moveTo(22, 52);
    ecgPath.lineTo(37, 52);
    ecgPath.lineTo(41, 44);
    ecgPath.lineTo(45, 63);
    ecgPath.lineTo(50, 33);
    ecgPath.lineTo(55, 68);
    ecgPath.lineTo(59, 48);
    ecgPath.lineTo(63, 52);
    ecgPath.lineTo(78, 52);

    final Paint ecgPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(ecgPath, ecgPaint);

    // 6. Apex Emergency Beacon Node
    final Paint beaconPaint = Paint()
      ..color = const Color(0xFF38BDF8)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(const Offset(50, 18), 2.8, beaconPaint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
