import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/recommendation.dart';

/// PR #23 §3.3 — aus search_screen.dart extrahiert (war Z. 300-343).
/// Eigenstaendige Komponente: zeigt eine einzelne Empfehlung im
/// Such-Ergebnis und navigiert auf Tap zur Station-Detail-Seite.
class RecommendationCard extends StatelessWidget {
  const RecommendationCard({super.key, required this.rec, this.compact = false});

  final Recommendation rec;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final color = switch (rec.verdict) {
      Verdict.lohnt_sich => Colors.green,
      Verdict.lohnt_sich_knapp => Colors.amber,
      Verdict.nur_wenn_vorbei => Colors.blueGrey,
      Verdict.erst_ab_x_litern => Colors.blueGrey,
      Verdict.daten_unsicher => Colors.grey,
      Verdict.lohnt_sich_nicht => Colors.red,
    };
    return Card(
      child: ListTile(
        title: Text('${rec.station.brand} · ${rec.station.name}'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${rec.price.toStringAsFixed(3).replaceAll('.', ',')} € • ${rec.distanceKm.toStringAsFixed(1)} km',
            ),
            const SizedBox(height: 4),
            Wrap(
              spacing: 8,
              children: [
                Chip(label: Text(rec.verdict.german), backgroundColor: color.withValues(alpha: 0.15)),
                Chip(label: Text('Real ${rec.realSavingsEur.toStringAsFixed(2).replaceAll('.', ',')} €')),
              ],
            ),
            if (!compact) ...[
              const SizedBox(height: 4),
              Text(rec.explanation, style: const TextStyle(fontSize: 12)),
            ],
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => GoRouter.of(context).push('/station/${rec.station.id}'),
      ),
    );
  }
}
