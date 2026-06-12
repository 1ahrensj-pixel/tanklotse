/// PR #15.1 §5.3+5.4 — App-Environment-Konstanten.
///
/// Diese Konstanten werden zur Build-Zeit per `--dart-define` gesetzt:
///
///   flutter run -d chrome \
///     --dart-define=APP_ENV=staging-preview \
///     --dart-define=PROVIDER_SIMULATION_ACTIVE=true \
///     --dart-define=API_BASE_URL=https://api-staging.example \
///     --dart-define=GOOGLE_MAPS_API_KEY=AIza...real-key
///
/// Wahrheits-Garantie: wenn `providerSimulationActive=true` ist, MUSS die UI
/// einen `SimulationBanner` anzeigen — sonst koennte ein Tester die Demo
/// mit echten Tankpreisen verwechseln.
class AppEnv {
  /// `development` (default), `staging`, `staging-preview`, `production`.
  static const String appEnv = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'development',
  );

  /// `true`, wenn das Backend im Mock-/Contract-Modus laeuft.
  /// Der Operator setzt das per `--dart-define=PROVIDER_SIMULATION_ACTIVE=true`
  /// genauso wie im Backend `*_PROVIDER_MODE=mock`.
  static bool get providerSimulationActive {
    const raw = String.fromEnvironment('PROVIDER_SIMULATION_ACTIVE', defaultValue: '');
    final v = raw.trim().toLowerCase();
    return v == 'true' || v == '1' || v == 'yes' || appEnv == 'staging-preview';
  }

  static bool get isStaging =>
      appEnv == 'staging' || appEnv == 'staging-preview';

  static bool get isProduction => appEnv == 'production';

  /// Google-Maps-API-Key fuer die Kartenanzeige (Web + Dart-Layer).
  ///
  /// Wird zur Build-Zeit per `--dart-define=GOOGLE_MAPS_API_KEY=AIza...`
  /// gesetzt. NIEMALS hardcoden — das Repo ist oeffentlich. Auf Android/iOS
  /// wird der Key zusaetzlich nativ ueber Manifest-/Plist-Platzhalter injiziert
  /// (siehe MAPS_SETUP.md).
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );
}
