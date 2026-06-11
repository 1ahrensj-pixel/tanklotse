import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hive/hive.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool privacy = false;
  bool location = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Einwilligung')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'TankLotse braucht ein paar Einwilligungen, um sinnvoll zu funktionieren. Du kannst sie jederzeit ändern.',
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                value: privacy,
                onChanged: (v) => setState(() => privacy = v ?? false),
                title: const Text('Ich habe die Datenschutzerklärung gelesen.'),
              ),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  // push statt go, damit der Nutzer per Zurueck-Button
                  // wieder hier landet (Information muss im Moment der
                  // Einwilligung zugaenglich sein).
                  onPressed: () => context.push('/legal/privacy'),
                  icon: const Icon(Icons.open_in_new, size: 18),
                  label: const Text('Datenschutzerklärung lesen'),
                ),
              ),
              CheckboxListTile(
                value: location,
                onChanged: (v) => setState(() => location = v ?? false),
                title: const Text('Ich erlaube die Nutzung meines Standorts zur Suche.'),
                subtitle: const Text('Optional. Du kannst auch ohne Standort suchen.'),
              ),
              const Spacer(),
              FilledButton(
                onPressed: privacy
                    ? () {
                        Hive.box('settings').put('consent_privacy', true);
                        Hive.box('settings').put('consent_location', location);
                        context.go(location ? '/location' : '/fuel-select');
                      }
                    : null,
                child: const Text('Weiter'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
