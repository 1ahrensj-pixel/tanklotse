import 'package:flutter/material.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Datenschutz')),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Text(
          'Wir verarbeiten so wenig personenbezogene Daten wie möglich.\n\n'
          '• Standort: nur, wenn du es erlaubst, ausschließlich für die Suche.\n'
          '  Du kannst die App auch ohne GPS nutzen — gib stattdessen eine PLZ\n'
          '  oder Adresse ein.\n'
          '• Konto: optional. Du kannst die App auch ohne Konto vollständig nutzen.\n'
          '• Server-Logs: IP gekürzt (DSGVO-konform).\n'
          '• Push-Token: nur, wenn du Preisalarme nutzt.\n'
          '• Gespeicherte Wege („Heimweg", „Arbeitsweg"): wenn du sie selbst\n'
          '  anlegst. Wir nutzen Start- und Zielkoordinaten ausschließlich für\n'
          '  Tankempfehlungen entlang der Strecke. Wir erstellen keine\n'
          '  Bewegungsprofile. Du kannst Wege jederzeit löschen.\n'
          '• Echte-Ersparnis-Alarm: wenn aktiv, gleicht der Server periodisch\n'
          '  Preise in deiner Region ab. Es werden keine Standorte protokolliert.\n'
          '• Fahrzeugdaten (Verbrauch, Tankmenge, Klasse): nur lokal in deinem\n'
          '  Konto, nicht für Werbung.\n'
          '• Konto löschen entfernt alle gespeicherten Wege, Alarme,\n'
          '  Fahrzeuge und Favoriten. Datenexport ist über die App möglich.\n\n'
          'Wir verkaufen keine Daten und tracken dich nicht über\n'
          'Drittanbieter-Werbung.',
        ),
      ),
    );
  }
}
