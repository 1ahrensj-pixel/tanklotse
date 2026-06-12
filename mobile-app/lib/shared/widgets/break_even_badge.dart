import 'package:flutter/material.dart';

import 'distance_label.dart';

/// Zeigt "Lohnt sich ab X Litern" / "Lohnt sich sofort" / "Lohnt sich nicht".
/// USP §7 Break-even-Liter.
///
/// Audit 2026-05-06 §14 Aufgabe 6 + §17 Phase 6 + §13 Aufgabe 4:
/// Distanz-Suffix ist wahrheits-getreu — unterscheidet vier Faelle:
///   precise + route_via_station   → "(exakter Zusatzumweg)"
///   precise + point_to_station    → "(exakte Strecke)"
///   estimated + route_via_station → "(geschätzter Zusatzumweg)"
///   estimated + point_to_station  → "(geschätzte Fahrstrecke)"
class BreakEvenBadge extends StatelessWidget {
  const BreakEvenBadge({
    super.key,
    required this.breakEvenLiters,
    required this.tankLiters,
    this.isDistanceEstimated = true,
    this.isRouteContext = false,
  });

  /// Vom Backend geliefert. Null = preislich nicht günstiger.
  final double? breakEvenLiters;

  /// Eingestellte Tankmenge des Nutzers.
  final double tankLiters;

  /// True, wenn `distanceEstimateMode` einer Schaetzung entspricht
  /// (`haversine_approximation` / `route_sampling`). False bei
  /// `precise_routing`.
  final bool isDistanceEstimated;

  /// True, wenn die Empfehlung im Saved-Routes-Flow erstellt wurde
  /// (`routingMode = 'route_via_station'`). False bei lokaler Suche
  /// (`point_to_station`).
  final bool isRouteContext;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (breakEvenLiters == null) {
      return _Pill(
        color: cs.surfaceContainerHigh,
        text: 'Lohnt sich nicht — diese Tankstelle ist nicht günstiger.',
        icon: Icons.do_not_disturb_alt,
      );
    }
    if (breakEvenLiters! <= 0.5) {
      return _Pill(
        color: cs.primaryContainer,
        text: 'Lohnt sich sofort — kein zusätzlicher Umweg.',
        icon: Icons.check_circle,
      );
    }
    final lohnt = tankLiters >= breakEvenLiters!;
    final label = DistanceLabel(
      isPrecise: !isDistanceEstimated,
      isRouteContext: isRouteContext,
    );
    final suffix = label.shortSuffix;
    return _Pill(
      color: lohnt ? cs.primaryContainer : cs.tertiaryContainer,
      text: lohnt
          ? 'Lohnt sich (ab ${breakEvenLiters!.toStringAsFixed(0)} Litern)$suffix'
          : 'Lohnt sich erst ab ${breakEvenLiters!.toStringAsFixed(0)} Litern$suffix',
      icon: lohnt ? Icons.check_circle : Icons.info_outline,
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.color, required this.text, required this.icon});
  final Color color;
  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
