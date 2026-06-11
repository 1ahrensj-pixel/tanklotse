import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class DataSourceScreen extends StatelessWidget {
  const DataSourceScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Datenquelle')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Die Kraftstoffpreise stammen aus den öffentlich bereitgestellten Daten der '
            'Markttransparenzstelle für Kraftstoffe (MTS-K) beim Bundeskartellamt — '
            'derzeit über den Anbieter Tankerkönig.\n\n'
            'Die Daten stehen unter Creative Commons Namensnennung 4.0 (CC BY 4.0).',
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () => launchUrl(Uri.parse('https://creativecommons.tankerkoenig.de/')),
            child: const Text('Tankerkönig öffnen'),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () => launchUrl(Uri.parse('https://creativecommons.org/licenses/by/4.0/deed.de')),
            child: const Text('Lizenz CC BY 4.0'),
          ),
        ],
      ),
    );
  }
}
