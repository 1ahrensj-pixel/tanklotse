import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';

class ComplaintScreen extends ConsumerStatefulWidget {
  const ComplaintScreen({super.key, required this.stationId});
  final String stationId;

  @override
  ConsumerState<ComplaintScreen> createState() => _S();
}

class _S extends ConsumerState<ComplaintScreen> {
  String type = 'WRONG_PRICE_DIESEL';
  final _correction = TextEditingController();
  bool _busy = false;

  static const _types = {
    'WRONG_PRICE_E5': 'Preis E5 falsch',
    'WRONG_PRICE_E10': 'Preis E10 falsch',
    'WRONG_PRICE_DIESEL': 'Preis Diesel falsch',
    'WRONG_STATUS': 'Geöffnet/geschlossen falsch',
    'WRONG_NAME': 'Name falsch',
    'WRONG_ADDRESS': 'Adresse falsch',
    'WRONG_BRAND': 'Marke falsch',
    'WRONG_LOCATION': 'Standort falsch',
    'OTHER': 'Sonstiges',
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fehler melden')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<String>(
            value: type,
            items: _types.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
            onChanged: (v) => setState(() => type = v!),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _correction,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Korrektur (optional)'),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : () async {
              setState(() => _busy = true);
              final messenger = ScaffoldMessenger.of(context);
              final router = GoRouter.of(context);
              try {
                await ref.read(apiClientProvider).post(
                      '/stations/${widget.stationId}/complaint',
                      data: {'type': type, 'correction': _correction.text},
                    );
                if (!mounted) return;
                messenger.showSnackBar(
                  const SnackBar(content: Text('Danke! Meldung übermittelt.')),
                );
                router.pop();
              } catch (e) {
                if (!mounted) return;
                messenger.showSnackBar(SnackBar(content: Text('Fehler: $e')));
              } finally {
                if (mounted) setState(() => _busy = false);
              }
            },
            child: const Text('Senden'),
          ),
        ],
      ),
    );
  }
}
