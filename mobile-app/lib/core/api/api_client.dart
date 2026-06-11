import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../services/connectivity_service.dart';
import 'app_exceptions.dart';
import 'error_mapper.dart';

const _apiBase = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3000');

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final apiClientProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: '$_apiBase/api',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'User-Agent': 'TankLotse-Mobile/1.0'},
  ),);
  final storage = ref.read(secureStorageProvider);

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onResponse: (response, handler) {
        // Erfolgreicher Response heisst: Online wieder da. Setzt evtl.
        // gesetzten Offline-Status zurueck. Captive-Portal-Faelle wuerden
        // hier nicht eintreffen, weil dann die Response fehlschlaegt.
        if (ref.read(offlineProvider)) {
          ref.read(offlineProvider.notifier).state = false;
        }
        handler.next(response);
      },
      onError: (e, handler) async {
        // Bei 401: einmal Refresh versuchen, dann durchreichen.
        if (e.response?.statusCode == 401) {
          final refresh = await storage.read(key: 'refresh_token');
          if (refresh != null) {
            try {
              final r = await Dio(BaseOptions(baseUrl: dio.options.baseUrl)).post(
                '/auth/refresh',
                data: {'refreshToken': refresh},
              );
              await storage.write(key: 'access_token', value: r.data['accessToken']);
              await storage.write(key: 'refresh_token', value: r.data['refreshToken']);
              final retry = await dio.fetch(e.requestOptions);
              return handler.resolve(retry);
            } catch (_) {
              await storage.delete(key: 'access_token');
              await storage.delete(key: 'refresh_token');
            }
          }
        }
        // DioException in eine strukturierte AppException umwandeln.
        final mapped = mapDioToAppException(e);
        // Netzwerk-/Timeout-Fehler setzt globalen Offline-Status, damit
        // der Banner sichtbar wird, ohne dass die UI selbst pollen muss.
        if (mapped is NetworkException || mapped is ApiTimeoutException) {
          ref.read(offlineProvider.notifier).state = true;
        }
        // Wrap die mapped AppException als DioException.error, damit
        // Aufrufer per `e.error is AppException` reagieren koennen.
        handler.next(
          DioException(
            requestOptions: e.requestOptions,
            response: e.response,
            type: e.type,
            error: mapped,
            stackTrace: e.stackTrace,
            message: mapped.userMessage,
          ),
        );
      },
    ),
  );
  return dio;
});
