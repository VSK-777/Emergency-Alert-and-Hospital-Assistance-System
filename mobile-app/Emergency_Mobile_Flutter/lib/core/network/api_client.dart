import 'package:dio/dio.dart';
import '../storage/local_store.dart';

class ApiClient {
  final Dio dio;
  final LocalStore localStore;

  ApiClient({required this.localStore})
    : dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 8),
          receiveTimeout: const Duration(seconds: 8),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await localStore.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          // Pass through for fine-grained handling by repositories/providers
          return handler.next(error);
        },
      ),
    );
  }
}
