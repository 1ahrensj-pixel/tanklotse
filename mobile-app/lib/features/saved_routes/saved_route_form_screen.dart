import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/repositories/stations_repository.dart';
import '../../core/state/search_state.dart';

class SavedRouteFormScreen extends ConsumerStatefulWidget {
  const SavedRouteFormScreen({super.key});
  @override
  ConsumerState<SavedRouteFormScreen> createState() => _S();
}

class _S extends ConsumerState<SavedRouteFormScreen> {
  final _name = TextEditingController(text: 'Zuhause ↔ Büro');
  final _startCtrl = TextEditingController();
  final _endCtrl = TextEditingController();
  GeoSearchResult? _start;
  GeoSearchResult? _end;
  Timer? _startDebounce;
  Timer? _endDebounce;
  List<GeoSearchResult> _startSugs = const [];
  List<GeoSearchResult> _endSugs = const [];
  late String _fuelType = ref.read(searchPrefsProvider).fuelType;
  double _maxDetour = 3;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _startCtrl.dispose();
    _endCtrl.dispose();
    _startDebounce?.cancel();
    _endDebounce?.cancel();
    super.dispose();
  }

  Future<void> _searchPlace(String q, bool isStart) async {
    if (q.trim().length < 2) {
      setState(() => isStart ? _startSugs = const [] : _endSugs = const []);
      return;
    }
    try {
      final r = await ref.read(geoRepositoryProvider).search(q);
      if (!mounted) return;
      setState(() => isStart ? _startSugs = r : _endSugs = r);
    } catch (_) {
      // still
    }
  }

  Future<void> _save() async {
    if (_start == null || _end == null) {
      setState(() => _error = 'Bitte Start und Ziel auswählen.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(savedRoutesRepositoryProvider).create(
            name: _name.text.trim(),
            startLabel: _start!.label,
            startLat: _start!.lat,
            startLng: _start!.lng,
            endLabel: _end!.label,
            endLat: _end!.lat,
            endLng: _end!.lng,
            fuelType: _fuelType,
            maxDetourKm: _maxDetour,
          );
      if (!mounted) return;
      context.pop();
    } catch (e) {
      setState(() {
        _busy = false;
        _error = 'Fehler: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Neue Route')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Datenschutz-Aufklaerung — Pflicht aus externem Pruefbericht §4.10/§7.7.
          Card(
            color: Theme.of(context).colorScheme.tertiaryContainer,
            child: const Padding(
              padding: EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Icon(Icons.info_outline, size: 18),
                    SizedBox(width: 6),
                    Text(
                      'Datenschutz-Hinweis',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],),
                  SizedBox(height: 6),
                  Text(
                    'Du speicherst hier persönliche Wege wie Heimweg oder Arbeitsweg. '
                    'Wir nutzen Start und Ziel ausschließlich für Tankempfehlungen entlang der Strecke. '
                    'Wir erstellen keine Bewegungsprofile. Du kannst die Route jederzeit löschen — '
                    'beim Konto-Löschen werden alle Routen automatisch entfernt.',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name (z. B. Heimweg)')),
          const SizedBox(height: 12),
          TextField(
            controller: _startCtrl,
            decoration: const InputDecoration(labelText: 'Start (Stadt, PLZ, Adresse)'),
            onChanged: (v) {
              _startDebounce?.cancel();
              _startDebounce = Timer(const Duration(milliseconds: 350), () => _searchPlace(v, true));
            },
          ),
          if (_startSugs.isNotEmpty)
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 150),
              child: Card(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    for (final r in _startSugs)
                      ListTile(
                        dense: true,
                        title: Text(r.label, maxLines: 2, overflow: TextOverflow.ellipsis),
                        onTap: () => setState(() {
                          _start = r;
                          _startCtrl.text = r.label;
                          _startSugs = const [];
                        }),
                      ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _endCtrl,
            decoration: const InputDecoration(labelText: 'Ziel (Stadt, PLZ, Adresse)'),
            onChanged: (v) {
              _endDebounce?.cancel();
              _endDebounce = Timer(const Duration(milliseconds: 350), () => _searchPlace(v, false));
            },
          ),
          if (_endSugs.isNotEmpty)
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 150),
              child: Card(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    for (final r in _endSugs)
                      ListTile(
                        dense: true,
                        title: Text(r.label, maxLines: 2, overflow: TextOverflow.ellipsis),
                        onTap: () => setState(() {
                          _end = r;
                          _endCtrl.text = r.label;
                          _endSugs = const [];
                        }),
                      ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _fuelType,
            items: const [
              DropdownMenuItem(value: 'E5', child: Text('E5')),
              DropdownMenuItem(value: 'E10', child: Text('E10')),
              DropdownMenuItem(value: 'DIESEL', child: Text('Diesel')),
            ],
            onChanged: (v) => setState(() => _fuelType = v!),
            decoration: const InputDecoration(labelText: 'Sorte'),
          ),
          const SizedBox(height: 12),
          Text('Max. Umweg von der Strecke: ${_maxDetour.toStringAsFixed(0)} km'),
          Slider(
            value: _maxDetour,
            min: 1,
            max: 10,
            divisions: 9,
            onChanged: (v) => setState(() => _maxDetour = v),
          ),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(color: Colors.red))),
          const SizedBox(height: 16),
          FilledButton(onPressed: _busy ? null : _save, child: const Text('Speichern')),
        ],
      ),
    );
  }
}
