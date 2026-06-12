import 'package:flutter/material.dart';

import '../../core/legal/legal_identity.dart';

class ImprintScreen extends StatelessWidget {
  const ImprintScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Impressum')),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Text(
          'Anbieterkennzeichnung gemäß § 5 DDG / § 18 MStV.\n\n'
          '${LegalIdentity.addressBlock}\n\n'
          'Kontakt: ${LegalIdentity.email}\n\n'
          'Registergericht: ${LegalIdentity.registerInfo}\n\n'
          'Vertretungsberechtigte Person: ${LegalIdentity.representative} '
          '(${LegalIdentity.representativeRole}).\n'
          'Verantwortlich nach § 18 Abs. 2 MStV: ${LegalIdentity.representative}, '
          '${LegalIdentity.street}, ${LegalIdentity.zipCity}.\n\n'
          'Inhalte mit größter Sorgfalt erstellt — für die externen Spritpreisdaten siehe Datenquelle-Hinweis.',
        ),
      ),
    );
  }
}
