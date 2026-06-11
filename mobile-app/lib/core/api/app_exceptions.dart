/// App-spezifische Exception-Hierarchie fuer den API-Client.
///
/// Statt rohe `DioException`-Objekte durch die App zu reichen, mappt der
/// Interceptor in `api_client.dart` jede Dio-Fehler-Variante in eine
/// konkrete `AppException`-Subklasse. UI zeigt direkt `e.userMessage` in
/// einer SnackBar oder einem Dialog, Sentry erhaelt zusaetzlich
/// `technicalDetail` als Breadcrumb-Tag.
///
/// Wichtige Konvention:
///   * `userMessage` ist immer deutsch + ohne technische Begriffe.
///   * Die Timeout-Klasse heisst bewusst `ApiTimeoutException`, weil
///     `dart:async` ein eigenes `TimeoutException` exportiert. Ein
///     gleichnamiger Typ wuerde in Tests mit `flutter_test` (das `dart:async`
///     transitiv re-exportiert) eine Symbol-Kollision verursachen.
abstract class AppException implements Exception {
  AppException(this.userMessage, [this.technicalDetail]);

  final String userMessage;
  final String? technicalDetail;

  @override
  String toString() =>
      'AppException($userMessage)${technicalDetail != null ? ' [$technicalDetail]' : ''}';
}

/// Kein Internet / DNS-Fehler / Verbindung abgewiesen / TLS-Bruch.
class NetworkException extends AppException {
  NetworkException([String? technicalDetail])
      : super(
          'Keine Internetverbindung. Bitte pruefe dein Netzwerk.',
          technicalDetail,
        );
}

/// Verbindung steht, aber Server antwortet nicht im Timeout-Fenster.
class ApiTimeoutException extends AppException {
  ApiTimeoutException([String? technicalDetail])
      : super(
          'Der Server antwortet gerade nicht. Bitte versuche es spaeter erneut.',
          technicalDetail,
        );
}

/// HTTP 5xx. Server-Fehler, der Client kann nichts tun ausser warten.
class ServerException extends AppException {
  ServerException(this.statusCode, [String? technicalDetail])
      : super(
          'Serverfehler ($statusCode). Bitte versuche es spaeter erneut.',
          technicalDetail,
        );

  final int statusCode;
}

/// HTTP 401, nach erfolglosem Refresh. Nutzer muss sich neu einloggen.
class AuthException extends AppException {
  AuthException([String? technicalDetail])
      : super(
          'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
          technicalDetail,
        );
}

/// HTTP 404 — Resource existiert nicht.
class NotFoundException extends AppException {
  NotFoundException([String? technicalDetail])
      : super(
          'Diese Ressource wurde nicht gefunden.',
          technicalDetail,
        );
}

/// HTTP 4xx ausser 401/404. Uebernimmt — wenn vorhanden — das `message`-
/// Feld aus der Server-Antwort, sonst eine generische Meldung.
class ClientException extends AppException {
  ClientException(this.statusCode, String message, [String? technicalDetail])
      : super(message, technicalDetail);

  final int statusCode;
}

/// Alles, was nicht in die anderen Klassen fiel.
class UnknownException extends AppException {
  UnknownException([String? technicalDetail])
      : super(
          'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
          technicalDetail,
        );
}
