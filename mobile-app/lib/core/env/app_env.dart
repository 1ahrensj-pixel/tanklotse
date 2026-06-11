/// PR #15.1 §5.3+5.4 — App-Environment-Konstanten.
///
/// Diese Konstanten werden zur Build-Zeit per `--dart-define` gesetzt:
///
///   flutter run -d chrome \
///     --dart-define=APP_ENV=staging-preview \
///     --dart-define=PROVIDER_SIMULATION_ACTIVE=true \
///     --dart-define=API_BASE_URL=https://api-staging.example \
///     --dart-define=MAPBOX_PUBLIC_TOKEN=pk.real-public-token
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
}
