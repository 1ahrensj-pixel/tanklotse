import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              Text('Willkommen bei TankLotse',
                  style: Theme.of(context).textTheme.headlineMedium,),
              const SizedBox(height: 12),
              const Text(
                'Finde nicht nur die billigste, sondern die wirklich sinnvollste Tankstelle. '
                'Wir berechnen, ob sich der Umweg unter dem Strich lohnt.',
              ),
              const Spacer(),
              FilledButton(
                onPressed: () => context.go('/consent'),
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text('Los geht’s'),
                ),
              ),
              TextButton(
                onPressed: () => context.go('/legal/privacy'),
                child: const Text('Datenschutz'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
