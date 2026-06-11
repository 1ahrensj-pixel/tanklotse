import 'package:flutter/material.dart';

/// Tankmengen-Assistent (USP §9): Schnellwerte 20/30/45/55/70 + eigener Wert.
class TankAmountSelector extends StatelessWidget {
  const TankAmountSelector({
    super.key,
    required this.value,
    required this.onChanged,
    this.options = const [20, 30, 45, 55, 70],
  });

  final double value;
  final ValueChanged<double> onChanged;
  final List<int> options;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Wie viel willst du ungefähr tanken?',
          style: TextStyle(fontSize: 13),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            for (final l in options)
              ChoiceChip(
                label: Text('$l l'),
                selected: value.round() == l,
                onSelected: (_) => onChanged(l.toDouble()),
              ),
            ActionChip(
              label: const Text('Eigener Wert'),
              onPressed: () async {
                final result = await showDialog<double>(
                  context: context,
                  builder: (ctx) => const _CustomTankAmountDialog(),
                );
                if (result != null) onChanged(result);
              },
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Aktuell: ${value.toStringAsFixed(0)} l',
          style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.outline),
        ),
      ],
    );
  }
}

class _CustomTankAmountDialog extends StatefulWidget {
  const _CustomTankAmountDialog();
  @override
  State<_CustomTankAmountDialog> createState() => _CustomTankAmountDialogState();
}

class _CustomTankAmountDialogState extends State<_CustomTankAmountDialog> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Eigene Tankmenge'),
      content: TextField(
        controller: _ctrl,
        keyboardType: TextInputType.number,
        decoration: const InputDecoration(suffixText: 'Liter'),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Abbrechen')),
        FilledButton(
          onPressed: () {
            final v = double.tryParse(_ctrl.text.replaceAll(',', '.'));
            if (v != null && v > 0 && v <= 500) Navigator.pop(context, v);
          },
          child: const Text('OK'),
        ),
      ],
    );
  }
}
