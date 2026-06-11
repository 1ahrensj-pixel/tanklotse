import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'break_even_badge.dart';

/// Prominente "Beste Entscheidung heute"-Karte.
/// USP §6 Lohnt-sich-Check.
class BestDecisionCard extends StatelessWidget {
  const BestDecisionCard({
    super.key,
    required this.stationId,
    required this.stationLabel,
    required this.fuelType,
    required this.targetPrice,
    required this.distanceKm,
    required this.tankLiters,
    required this.consumption,
    required this.grossSavingEuro,
    required this.detourCostEuro,
    required this.realSavingEuro,
    required this.breakEvenLiters,
    required this.recommendation,
    this.onNavigate,
  });

  final String stationId;
  final String stationLabel;
  final String fuelType;
  final double targetPrice;
  final double distanceKm;
  final double tankLiters;
  final double consumption;
  final double grossSavingEuro;
  final double detourCostEuro;
  final double realSavingEuro;
  final double? breakEvenLiters;
  final String recommendation;
  final VoidCallback? onNavigate;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final color = _colorFor(recommendation, cs);
    final headline = _headlineFor(recommendation);

    return Card(
      color: cs.primaryContainer.withValues(alpha: 0.4),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Beste Entscheidung heute', style: tt.labelLarge),
            const SizedBox(height: 4),
            Text(stationLabel, style: tt.titleLarge),
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: [
              Chip(label: Text('$fuelType ${_fmt(targetPrice, 3)} €')),
              Chip(label: Text('${distanceKm.toStringAsFixed(1)} km')),
              Chip(label: Text('${tankLiters.toStringAsFixed(0)} l geplant')),
              Chip(label: Text('${consumption.toStringAsFixed(1)} l/100 km')),
            ],),
            const Divider(height: 24),
            _Row(label: 'Du sparst beim Preis', value: '${_fmt(grossSavingEuro, 2)} €'),
            _Row(label: 'Der Umweg kostet', value: '${_fmt(detourCostEuro, 2)} €'),
            const SizedBox(height: 4),
            _Row(
              label: 'Echte Ersparnis',
              value: '${_fmt(realSavingEuro, 2)} €',
              accent: color,
              bold: true,
            ),
            const SizedBox(height: 12),
            BreakEvenBadge(breakEvenLiters: breakEvenLiters, tankLiters: tankLiters),
            const SizedBox(height: 12),
            Text(headline, style: tt.titleMedium?.copyWith(color: color)),
            const SizedBox(height: 12),
            Wrap(spacing: 8, children: [
              FilledButton.icon(
                icon: const Icon(Icons.info_outline),
                label: const Text('Details'),
                onPressed: () => GoRouter.of(context).push('/station/$stationId'),
              ),
              if (onNavigate != null)
                OutlinedButton.icon(
                  onPressed: onNavigate,
                  icon: const Icon(Icons.navigation),
                  label: const Text('Route starten'),
                ),
            ],),
          ],
        ),
      ),
    );
  }

  static Color _colorFor(String rec, ColorScheme cs) {
    switch (rec) {
      case 'LOHNT_SICH':
        return Colors.green.shade700;
      case 'LOHNT_SICH_KNAPP':
        return Colors.amber.shade700;
      case 'NUR_WENN_AUF_ROUTE':
      case 'ERST_AB_X_LITERN':
        return cs.tertiary;
      case 'DATEN_UNSICHER':
      case 'LOHNT_SICH_NICHT':
      default:
        return Colors.red.shade700;
    }
  }

  static String _headlineFor(String rec) {
    switch (rec) {
      case 'LOHNT_SICH':
        return 'Empfehlung: lohnt sich.';
      case 'LOHNT_SICH_KNAPP':
        return 'Empfehlung: lohnt sich knapp.';
      case 'NUR_WENN_AUF_ROUTE':
        return 'Empfehlung: nur sinnvoll, wenn du sowieso dort vorbeifährst.';
      case 'ERST_AB_X_LITERN':
        return 'Empfehlung: lohnt sich erst bei größerer Tankmenge.';
      case 'DATEN_UNSICHER':
        return 'Datenlage unsicher — lieber später prüfen.';
      case 'LOHNT_SICH_NICHT':
      default:
        return 'Empfehlung: lohnt sich nicht.';
    }
  }

  static String _fmt(double v, int digits) =>
      v.toStringAsFixed(digits).replaceAll('.', ',');
}

class _Row extends StatelessWidget {
  const _Row({
    required this.label,
    required this.value,
    this.accent,
    this.bold = false,
  });
  final String label;
  final String value;
  final Color? accent;
  final bool bold;
  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
      fontWeight: bold ? FontWeight.bold : FontWeight.normal,
      color: accent,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(children: [
        Expanded(child: Text(label, style: style)),
        Text(value, style: style),
      ],),
    );
  }
}
