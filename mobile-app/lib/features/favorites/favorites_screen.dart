import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

import '../../core/api/api_client.dart';
import 'package:dio/dio.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});
  @override
  ConsumerState<FavoritesScreen> createState() => _S();
}

class _S extends ConsumerState<FavoritesScreen> {
  bool _isAuthed = false;
  List<Map<String, dynamic>> _remote = const [];
  bool _busy = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _busy = true);
    try {
      final dio = ref.read(apiClientProvider);
      final res = await dio.get('/favorites');
      _remote = (res.data as List).cast<Map<String, dynamic>>();
      _isAuthed = true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        _isAuthed = false;
      }
    }
    setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_busy) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final localBox = Hive.box('favorites_local');
    final localKeys = localBox.keys.cast<String>().toList();
    final source = _isAuthed ? _remote.map((f) => (f['station'] as Map<String, dynamic>?)?['name'] ?? f['stationId']).toList() : localKeys;
    return Scaffold(
      appBar: AppBar(title: Text(_isAuthed ? 'Favoriten' : 'Favoriten (lokal)')),
      body: source.isEmpty
          ? const Center(child: Text('Noch keine Favoriten gespeichert.'))
          : ListView(
              children: [
                if (!_isAuthed)
                  const Padding(
                    padding: EdgeInsets.all(12),
                    child: Text('Login → geräteübergreifende Favoriten.', style: TextStyle(fontSize: 12)),
                  ),
                for (final s in source)
                  Card(child: ListTile(title: Text(s.toString()))),
              ],
            ),
    );
  }
}
