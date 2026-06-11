import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'core/router.dart';
import 'core/services/connectivity_service.dart';
import 'core/theme.dart';

// Wenn `--dart-define=SENTRY_DSN=...` gesetzt ist, geht Crash-Reporting an
// Sentry. Ohne DSN startet die App normal weiter (Sentry no-op) — kein
// Build-Bruch in Dev-Setups.
const _sentryDsn = String.fromEnvironment('SENTRY_DSN');
const _sentryEnvironment = String.fromEnvironment(
  'SENTRY_ENVIRONMENT',
  defaultValue: 'production',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await Hive.openBox('favorites_local');
  await Hive.openBox('settings');

  final hasSentry = _sentryDsn.isNotEmpty;

  if (!hasSentry) {
    runApp(const ProviderScope(child: TankLotseApp()));
    return;
  }

  await SentryFlutter.init(
    (options) {
      options.dsn = _sentryDsn;
      options.environment = _sentryEnvironment;
      // Sample konservativ — Performance-Trace nicht von jedem Nutzer.
      options.tracesSampleRate = 0.1;
      options.attachStacktrace = true;
      options.beforeSend = (event, hint) {
        // Keine PII rausgeben — Email/Token koennten in Breadcrumbs
        // landen, die wir explizit nicht senden wollen.
        return event.copyWith(user: null);
      };
    },
    appRunner: () => runApp(const ProviderScope(child: TankLotseApp())),
  );
}

class TankLotseApp extends ConsumerWidget {
  const TankLotseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Connectivity-Watcher genau einmal anstarten — er aktualisiert
    // `offlineProvider`, sobald das Geraet Netz verliert oder gewinnt.
    ref.watch(connectivityWatcherProvider);

    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'TankLotse',
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
      locale: const Locale('de'),
      supportedLocales: const [Locale('de'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
