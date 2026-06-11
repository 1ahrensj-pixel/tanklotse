import 'package:dio/dio.dart';

import 'app_exceptions.dart';

/// Bildet eine `DioException` in die konkrete `AppException`-Subklasse ab.
/// Wird vom API-Client-Interceptor benutzt; kann von Tests direkt
/// aufgerufen werden ohne Dio-HTTP-Setup.
AppException mapDioToAppException(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return ApiTimeoutException(e.message);
    case DioExceptionType.connectionError:
      return NetworkException(e.message);
    case DioExceptionType.badResponse:
      final status = e.response?.statusCode ?? 0;
      if (status == 401) return AuthException(e.message);
      if (status == 404) return NotFoundException(e.message);
      if (status >= 500 && status < 600) return ServerException(status, e.message);
      if (status >= 400 && status < 500) {
        final serverMessage = _extractServerMessage(e.response?.data) ??
            'Eingabe ungueltig. Bitte pruefe deine Daten.';
        return ClientException(status, serverMessage, e.message);
      }
      return UnknownException(e.message);
    case DioExceptionType.cancel:
      return UnknownException('cancelled');
    case DioExceptionType.badCertificate:
      return NetworkException('TLS-Zertifikat-Fehler');
    case DioExceptionType.unknown:
      return UnknownException(e.message);
  }
}

String? _extractServerMessage(Object? data) {
  if (data is Map) {
    final message = data['message'];
    if (message is String && message.isNotEmpty) return message;
    if (message is List && message.isNotEmpty && message.first is String) {
      return message.first as String;
    }
  }
  return null;
}
