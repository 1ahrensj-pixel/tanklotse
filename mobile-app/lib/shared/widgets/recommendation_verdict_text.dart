import 'package:flutter/material.dart';

import 'distance_label.dart';

/// Audit 2026-05-06 §17 Phase 6 Aufgabe 13 + §13 Aufgabe 4:
///
/// Verständlicher Entscheidungssatz unter einer Tankstellen-Empfehlung,
/// nicht nur reine Zahlen. Die Footnote unterscheidet alle vier Faelle
/// (precise vs. estimated × route-context vs. point-to-station).
class RecommendationVerdictText extends StatelessWidget {
  const RecommendationVerdictText({
    super.key,
    required this.tankLiters,
    required this.realSavingEuro,
    required this.breakEvenLiters,
    this.isDistanceEstimated = true,
    this.isRouteContext = false,
  });

  final double tankLiters;
  final double realSavingEuro;

  /// Null = Zielstation ist nicht günstiger als Referenz.
  final double? breakEvenLiters;

  /// Audit §17 Phase 6: zeigt Quelle des Werts.
  final bool isDistanceEstimated;

  /// True, wenn die Empfehlung im Saved-Routes-Flow erstellt wurde
  /// (`routingMode = 'route_via_station'`). Audit §13 Aufgabe 4.
  final bool isRouteContext;

  @override
  Widget build(BuildContext context) {
    final ts = Theme.of(context).textTheme;

    final label = DistanceLabel(
      isPrecise: !isDistanceEstimated,
      isRouteContext: isRouteContext,
    );
    final precisionFootnote = label.longLabel;

    final liters = tankLiters.toStringAsFixed(0);
    final saving = realSavingEuro.toStringAsFixed(2).replaceAll('.', ',');

    String mainSentence;
    if (breakEvenLiters == null) {
      mainSentence =
          'Diese Tankstelle ist preislich nicht günstiger — der Stop lohnt sich nicht.';
    } else if (realSavingEuro >= 2.0) {
      mainSentence = 'Gute Wahl: Bei $liters Litern sparst du real $saving €.';
    } else if (realSavingEuro >= 0.5) {
      mainSentence = 'Bei $liters Litern sparst du real $saving € — lohnt sich knapp.';
    } else if (realSavingEuro > 0) {
      mainSentence =
          'Bei $liters Litern sparst du nur $saving € — lohnt sich vor allem, wenn du sowieso vorbeifährst.';
    } else if (breakEvenLiters! > 0.5) {
      final be = breakEvenLiters!.toStringAsFixed(0);
      mainSentence =
          'Bei $liters Litern würde sich der Stop nicht lohnen. Lohnt sich erst ab $be Litern.';
    } else {
      mainSentence =
          'Diese Tankstelle ist zwar günstiger, aber der Umweg frisst die Ersparnis auf.';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          mainSentence,
          style: ts.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 4),
        Text(
          precisionFootnote,
          style: ts.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.outline,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
