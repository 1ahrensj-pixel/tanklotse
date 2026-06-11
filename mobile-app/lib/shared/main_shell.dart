import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'widgets/simulation_banner.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    final idx = _idxForPath(loc);
    return Scaffold(
      // PR #15.1 §5.3: Demo-Modus-Banner ueber jedem Screen, wenn die App
      // gegen ein Mock-/Contract-Backend laeuft.
      body: Column(
        children: [
          const SimulationBanner(),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        onDestinationSelected: (i) {
          switch (i) {
            case 0: context.go('/home'); break;
            case 1: context.go('/map'); break;
            case 2: context.go('/favorites'); break;
            case 3: context.go('/alerts'); break;
            case 4: context.go('/settings'); break;
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.search), label: 'Suche'),
          NavigationDestination(icon: Icon(Icons.map_outlined), label: 'Karte'),
          NavigationDestination(icon: Icon(Icons.favorite_outline), label: 'Favoriten'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), label: 'Alarme'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), label: 'Einstellungen'),
        ],
      ),
    );
  }

  int _idxForPath(String path) {
    if (path.startsWith('/map')) return 1;
    if (path.startsWith('/favorites')) return 2;
    if (path.startsWith('/alerts')) return 3;
    if (path.startsWith('/settings')) return 4;
    return 0;
  }
}
