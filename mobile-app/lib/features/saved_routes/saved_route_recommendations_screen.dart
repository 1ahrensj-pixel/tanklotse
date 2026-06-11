import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/recommendation.dart';
import '../../core/repositories/stations_repository.dart';
import '../../core/state/search_state.dart';
import '../search/recommendation_card.dart';

/// Tankstellen entlang einer gespeicherten Route mit Lohnt-sich-Check
/// (POST /saved-routes/:id/recommendations). Verbrauch + Tankmenge kommen
/// aus den Such-Einstellungen (`searchPrefsProvider`), Sorte + max. Umweg
/// stecken serverseitig in der Route selbst.
class SavedRouteRecommendationsScreen extends ConsumerStatefulWidget {
  const SavedRouteRecommendationsScreen({super.key, required this.routeId, this.routeName});

  final String routeId;

  /// Optionaler Routen-Name fuer den AppBar-Titel (Query-Parameter `name`).
  final String? routeName;

  @override
  ConsumerState<SavedRouteRecommendationsScreen> createState() => _S();
}

/// Geparstes Ergebnis des Backend-`BestStationResult` fuer diesen Screen.
class _RouteRecommendations {
  final List<Recommendation> recommendations;
  final String attribution;
  final String? disclaimer;
  _RouteRecommendations({
    required this.recommendations,
    required this.attribution,
    this.disclaimer,
  });
}

class _S extends ConsumerState<SavedRouteRecommendationsScreen> {
  late Future<_RouteRecommendations> _f = _load();

  Future<_RouteRecommendations> _load() async {
    final prefs = ref.read(searchPrefsProvider);
    final data = await ref.read(savedRoutesRepositoryProvider).recommendations(
          id: widget.routeId,
          consumptionLPer100Km: prefs.consumption,
          tankLiters: prefs.tankLiters,
        );
    final list = (data['recommendations'] as List? ?? const []).cast<Map<String, dynamic>>();
    return _RouteRecommendations(
      recommendations: list.map(Recommendation.fromJson).toList(),
      attribution: (data['attribution'] ?? '') as String,
      disclaimer: data['disclaimer'] as String?,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.routeName ?? 'Tankstellen entlang der Route')),
      body: FutureBuilder<_RouteRecommendations>(
        future: _f,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) return Center(child: Text('Fehler: ${snap.error}'));
          final result = snap.data!;
          final recs = result.recommendations;
          if (recs.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Keine geöffneten Tankstellen mit Preisen entlang der Route gefunden.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => setState(() {
              _f = _load();
            }),
            child: ListView.builder(
              itemCount: recs.length + 1,
              itemBuilder: (context, i) {
                if (i == 0) {
                  return Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (result.disclaimer != null) ...[
                          Text(result.disclaimer!, style: const TextStyle(fontSize: 11)),
                          const SizedBox(height: 4),
                        ],
                        Text(
                          'Datenquelle: ${result.attribution}',
                          style: const TextStyle(fontSize: 11),
                        ),
                      ],
                    ),
                  );
                }
                return RecommendationCard(rec: recs[i - 1]);
              },
            ),
          );
        },
      ),
    );
  }
}
