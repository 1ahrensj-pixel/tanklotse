import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive/hive.dart';

import '../../core/state/search_state.dart';
import '../../shared/widgets/tank_amount_selector.dart';
import '../../shared/widgets/vehicle_consumption_assistant.dart';

class VehicleSetupScreen extends ConsumerStatefulWidget {
  const VehicleSetupScreen({super.key});

  @override
  ConsumerState<VehicleSetupScreen> createState() => _VehicleSetupScreenState();
}

class _VehicleSetupScreenState extends ConsumerState<VehicleSetupScreen> {
  late double consumption = ref.read(searchPrefsProvider).consumption;
  late double tankLiters = ref.read(searchPrefsProvider).tankLiters;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fahrzeug-Eckdaten')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Ohne diese Werte können wir den Lohnt-sich-Check nicht berechnen. '
              'Wenn du deinen Verbrauch nicht kennst, hilft dir der Assistent.',
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Verbrauch', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text('${consumption.toStringAsFixed(1)} l / 100 km'),
                    const SizedBox(height: 8),
                    Slider(
                      value: consumption,
                      min: 3,
                      max: 18,
                      divisions: 30,
                      onChanged: (v) => setState(() => consumption = v),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        icon: const Icon(Icons.help_outline),
                        label: const Text('Ich brauche Hilfe'),
                        onPressed: () {
                          VehicleConsumptionAssistant.show(
                            context,
                            initialConsumption: consumption,
                            onResult: (c, _, __) => setState(() => consumption = c),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: TankAmountSelector(
                  value: tankLiters,
                  onChanged: (v) => setState(() => tankLiters = v),
                ),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () {
                ref.read(searchPrefsProvider.notifier).update(
                      (s) => s.copyWith(consumption: consumption, tankLiters: tankLiters),
                    );
                Hive.box('settings').put('onboarded', true);
                context.go('/home');
              },
              child: const Text('Fertig'),
            ),
            TextButton(
              onPressed: () {
                Hive.box('settings').put('onboarded', true);
                context.go('/home');
              },
              child: const Text('Später'),
            ),
          ],
        ),
      ),
    );
  }
}
