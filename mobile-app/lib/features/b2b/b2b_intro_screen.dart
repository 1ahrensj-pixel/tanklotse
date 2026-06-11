import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class B2bIntroScreen extends StatelessWidget {
  const B2bIntroScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('TankLotse für Firmen')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Für Flotten ab 2 Fahrzeugen.', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          const Text(
            'Mehrere Fahrer & Fahrzeuge, Rollen (Admin/Fahrer/Buchhaltung), '
            'Tankempfehlungen für Fahrer, Reports & CSV-Export.',
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () => launchUrl(Uri.parse('mailto:b2b@tanklotse.de?subject=B2B%20Pilotanfrage')),
            child: const Text('Pilot anfragen'),
          ),
        ],
      ),
    );
  }
}
