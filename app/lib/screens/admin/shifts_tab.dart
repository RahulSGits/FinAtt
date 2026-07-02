import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/shift.dart';
import '../../providers.dart';

/// Admin defines shifts: working-hours window plus the minimum share of that
/// window an employee must be on-site for the day to count as Present.
class ShiftsTab extends ConsumerStatefulWidget {
  const ShiftsTab({super.key});

  @override
  ConsumerState<ShiftsTab> createState() => _ShiftsTabState();
}

class _ShiftsTabState extends ConsumerState<ShiftsTab> {
  List<Shift> _shifts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final shifts = await ref.read(adminServiceProvider).getShifts();
    if (mounted) {
      setState(() {
        _shifts = shifts;
        _loading = false;
      });
    }
  }

  Future<void> _openShiftDialog() async {
    final created = await showDialog<bool>(
      context: context,
      builder: (_) => const _ShiftFormDialog(),
    );
    if (created == true) _load();
  }

  Future<void> _delete(Shift shift) async {
    await ref.read(adminServiceProvider).deleteShift(shift.id);
    _load();
  }

  String _fmt(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _shifts.isEmpty
              ? const Center(child: Text('No shifts yet. Tap + to add one.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _shifts.length,
                    itemBuilder: (context, i) {
                      final shift = _shifts[i];
                      return Card(
                        child: ListTile(
                          leading: const Icon(Icons.schedule),
                          title: Text(shift.name),
                          subtitle: Text(
                            '${_fmt(shift.startTime)} – ${_fmt(shift.endTime)}  '
                            '(${shift.scheduledDuration.inHours}h)\n'
                            'Min presence: ${(shift.minPresencePercent * 100).toStringAsFixed(0)}%',
                          ),
                          isThreeLine: true,
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () => _delete(shift),
                          ),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openShiftDialog,
        icon: const Icon(Icons.add),
        label: const Text('Add shift'),
      ),
    );
  }
}

class _ShiftFormDialog extends ConsumerStatefulWidget {
  const _ShiftFormDialog();

  @override
  ConsumerState<_ShiftFormDialog> createState() => _ShiftFormDialogState();
}

class _ShiftFormDialogState extends ConsumerState<_ShiftFormDialog> {
  final _name = TextEditingController();
  TimeOfDay _start = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _end = const TimeOfDay(hour: 17, minute: 0);
  double _minPresence = 0.5;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _pickTime(bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _start : _end,
    );
    if (picked != null) {
      setState(() => isStart ? _start = picked : _end = picked);
    }
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Enter a shift name')));
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(adminServiceProvider).createShift(
            name: _name.text.trim(),
            startTime: _start,
            endTime: _end,
            minPresencePercent: _minPresence,
          );
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  String _fmt(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('New shift'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _name,
              decoration: const InputDecoration(
                labelText: 'Shift name (e.g. Morning)',
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _pickTime(true),
                    child: Text('Start: ${_fmt(_start)}'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _pickTime(false),
                    child: Text('End: ${_fmt(_end)}'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Minimum presence to count Present: '
              '${(_minPresence * 100).toStringAsFixed(0)}%',
            ),
            Slider(
              value: _minPresence,
              min: 0.1,
              max: 1.0,
              divisions: 9,
              label: '${(_minPresence * 100).toStringAsFixed(0)}%',
              onChanged: (v) => setState(() => _minPresence = v),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Create'),
        ),
      ],
    );
  }
}
