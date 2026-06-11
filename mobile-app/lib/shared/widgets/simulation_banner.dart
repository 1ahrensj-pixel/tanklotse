import 'package:flutter/material.dart';

import '../../core/env/app_env.dart';

/// PR #15.1 §5.3 — Demo-Modus-Banner.
///
/// Wird automatisch ueber jeder Screen-Liste angezeigt, wenn
/// `AppEnv.providerSimulationActive` true ist (also wenn die App gegen ein
/// Mock-/Contract-Backend laeuft). Stellt sicher, dass kein Tester die
/// Demo-Daten mit echten Tankstellenpreisen verwechselt.
///
/// Wahrheits-Garantie: solange dieses Widget angezeigt wird, sind die in
/// der App sichtbaren Preise NICHT live — entweder kommt das Backend aus
/// dem `MockProvider` (4 Koeln-Stationen), aus Fixture-Daten, oder es ist
/// nichts Live-Verifiziertes konfiguriert.
class SimulationBanner extends StatelessWidget {
  const SimulationBanner({super.key});

  @override
  Widget build(BuildContext context) {
    if (!AppEnv.providerSimulationActive) return const SizedBox.shrink();

    return Material(
      color: const Color(0xFFFFF7ED),
      child: SafeArea(
        bottom: false,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: Color(0xFFF97316), width: 2),
            ),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(Icons.warning_amber_rounded, color: Color(0xFF7C2D12), size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Demo-Modus: Es werden keine echten Tankstellenpreise angezeigt.',
                  style: TextStyle(
                    color: Color(0xFF7C2D12),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
