import 'dart:io';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';

class MedicalDocumentItem {
  final int id;
  final int userId;
  final String? incidentId;
  final String fileName;
  final String originalFileName;
  final String mimeType;
  final int fileSizeBytes;
  final String fileCategory;
  final String fileUrl;
  final DateTime createdAt;

  MedicalDocumentItem({
    required this.id,
    required this.userId,
    this.incidentId,
    required this.fileName,
    required this.originalFileName,
    required this.mimeType,
    required this.fileSizeBytes,
    required this.fileCategory,
    required this.fileUrl,
    required this.createdAt,
  });

  factory MedicalDocumentItem.fromJson(Map<String, dynamic> json) {
    return MedicalDocumentItem(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num).toInt(),
      incidentId: json['incidentId'] as String?,
      fileName: json['fileName'] ?? '',
      originalFileName: json['originalFileName'] ?? json['fileName'] ?? '',
      mimeType: json['mimeType'] ?? 'application/octet-stream',
      fileSizeBytes: (json['fileSizeBytes'] as num?)?.toInt() ?? 0,
      fileCategory: json['fileCategory'] ?? 'MEDICAL_RECORD',
      fileUrl: json['fileUrl'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class FileService {
  final ApiClient apiClient;
  FileService(this.apiClient);

  Future<List<MedicalDocumentItem>> getMyDocuments() async {
    try {
      final res = await apiClient.dio.get(ApiEndpoints.filesMy);
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List)
            .map((item) => MedicalDocumentItem.fromJson(item))
            .toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<MedicalDocumentItem?> pickAndUploadDocument({
    String category = 'MEDICAL_RECORD',
    String? incidentId,
  }) async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    );

    if (result == null || result.files.isEmpty) {
      return null;
    }

    final path = result.files.single.path;
    if (path == null) return null;

    final file = File(path);
    final fileName = result.files.single.name;

    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: fileName),
      'category': category,
      if (incidentId != null) 'incidentId': incidentId,
    });

    final res = await apiClient.dio.post(
      ApiEndpoints.filesUpload,
      data: formData,
    );

    if (res.statusCode == 200 || res.statusCode == 201) {
      return MedicalDocumentItem.fromJson(res.data);
    }
    return null;
  }

  Future<bool> deleteDocument(int id) async {
    try {
      final res = await apiClient.dio.delete(ApiEndpoints.fileById(id));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
