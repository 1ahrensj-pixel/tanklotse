import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/splash/splash_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/onboarding/consent_screen.dart';
import '../features/onboarding/location_permission_screen.dart';
import '../features/onboarding/fuel_select_screen.dart';
import '../features/onboarding/vehicle_setup_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/auth/forgot_password_screen.dart';
import '../features/search/search_screen.dart';
import '../features/search/map_screen.dart';
import '../features/search/list_screen.dart';
import '../features/station_detail/station_detail_screen.dart';
import '../features/favorites/favorites_screen.dart';
import '../features/alerts/alerts_screen.dart';
import '../features/alerts/alert_create_screen.dart';
import '../features/vehicles/vehicles_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/premium/premium_screen.dart';
import '../features/settings/delete_account_screen.dart';
import '../features/legal/imprint_screen.dart';
import '../features/legal/privacy_screen.dart';
import '../features/legal/data_source_screen.dart';
import '../features/complaints/complaint_screen.dart';
import '../features/b2b/b2b_intro_screen.dart';
import '../features/error/error_screen.dart';
import '../features/highway/highway_check_screen.dart';
import '../features/saved_routes/saved_routes_screen.dart';
import '../features/saved_routes/saved_route_form_screen.dart';
import '../features/saved_routes/saved_route_recommendations_screen.dart';
import '../shared/main_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/consent', builder: (_, __) => const ConsentScreen()),
      GoRoute(path: '/location', builder: (_, __) => const LocationPermissionScreen()),
      GoRoute(path: '/fuel-select', builder: (_, __) => const FuelSelectScreen()),
      GoRoute(path: '/vehicle-setup', builder: (_, __) => const VehicleSetupScreen()),

      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot', builder: (_, __) => const ForgotPasswordScreen()),

      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const SearchScreen()),
          GoRoute(path: '/map', builder: (_, __) => const MapScreen()),
          GoRoute(path: '/list', builder: (_, __) => const ListScreen()),
          GoRoute(path: '/favorites', builder: (_, __) => const FavoritesScreen()),
          GoRoute(path: '/alerts', builder: (_, __) => const AlertsScreen()),
          GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
        ],
      ),

      GoRoute(
        path: '/station/:id',
        builder: (_, state) => StationDetailScreen(stationId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/alerts/new',
        // Optionaler Stationskontext (?stationId=...): dann gilt der Alarm
        // fuer genau diese Tankstelle statt fuer einen Umkreis.
        builder: (_, state) =>
            AlertCreateScreen(stationId: state.uri.queryParameters['stationId']),
      ),
      GoRoute(path: '/vehicles', builder: (_, __) => const VehiclesScreen()),
      GoRoute(path: '/premium', builder: (_, __) => const PremiumScreen()),
      GoRoute(path: '/account/delete', builder: (_, __) => const DeleteAccountScreen()),
      GoRoute(path: '/legal/imprint', builder: (_, __) => const ImprintScreen()),
      GoRoute(path: '/legal/privacy', builder: (_, __) => const PrivacyScreen()),
      GoRoute(path: '/legal/data-source', builder: (_, __) => const DataSourceScreen()),
      GoRoute(
        path: '/station/:id/complaint',
        builder: (_, state) => ComplaintScreen(stationId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/b2b', builder: (_, __) => const B2bIntroScreen()),
      GoRoute(path: '/error', builder: (_, __) => const ErrorScreen()),
      GoRoute(path: '/highway', builder: (_, __) => const HighwayCheckScreen()),
      GoRoute(path: '/saved-routes', builder: (_, __) => const SavedRoutesScreen()),
      GoRoute(path: '/saved-routes/new', builder: (_, __) => const SavedRouteFormScreen()),
      GoRoute(
        path: '/saved-routes/:id/recommendations',
        // Optionaler Routen-Name (?name=...) nur fuer den AppBar-Titel.
        builder: (_, state) => SavedRouteRecommendationsScreen(
          routeId: state.pathParameters['id']!,
          routeName: state.uri.queryParameters['name'],
        ),
      ),
    ],
  );
});
