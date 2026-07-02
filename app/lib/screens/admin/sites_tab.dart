import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/site.dart';
import '../../providers.dart';
import '../../services/location_service.dart';

/// Admin manages work sites: name, GPS center, and the geofence radius that
/// an employee must be within to check in.
class SitesTab extends ConsumerStatefulWidget {
  const SitesTab({super.key});

  @override
  ConsumerState<SitesTab> createState() => _SitesTabState();
}

class _SitesTabState extends ConsumerState<SitesTab> {
  List<Site> _sites = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final sites = await ref.read(adminServiceProvider).getSites();
    if (mounted) {
      setState(() {
        _sites = sites;
        _loading = false;
      });
    }
  }

  Future<void> _openSiteDialog() async {
    final created = await showDialog<bool>(
      context: context,
      builder: (_) => const _SiteFormDialog(),
    );
    if (created == true) _load();
  }

  Future<void> _editRadius(Site site) async {
    final controller = TextEditingController(text: site.radiusMeters.toStringAsFixed(0));
    final newRadius = await showDialog<double>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Radius for ${site.name}'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Geofence radius (meters)',
            suffixText: 'm',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.pop(ctx, double.tryParse(controller.text)),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (newRadius != null && newRadius > 0) {
      await ref.read(adminServiceProvider).updateSiteRadius(site.id, newRadius);
      _load();
    }
  }

  Future<void> _delete(Site site) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete ${site.name}?'),
        content: const Text(
          'Employees assigned to this site will be unassigned.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(adminServiceProvider).deleteSite(site.id);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _sites.isEmpty
              ? const Center(child: Text('No sites yet. Tap + to add one.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _sites.length,
                    itemBuilder: (context, i) {
                      final site = _sites[i];
                      return Card(
                        child: ListTile(
                          leading: const Icon(Icons.location_on),
                          title: Text(site.name),
                          subtitle: Text(
                            'lat ${site.latitude.toStringAsFixed(5)}, '
                            'lng ${site.longitude.toStringAsFixed(5)}\n'
                            'radius ${site.radiusMeters.toStringAsFixed(0)} m',
                          ),
                          isThreeLine: true,
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.tune),
                                tooltip: 'Edit radius',
                                onPressed: () => _editRadius(site),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline),
                                tooltip: 'Delete',
                                onPressed: () => _delete(site),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openSiteDialog,
        icon: const Icon(Icons.add_location_alt),
        label: const Text('Add site'),
      ),
    );
  }
}

class _SiteFormDialog extends ConsumerStatefulWidget {
  const _SiteFormDialog();

  @override
  ConsumerState<_SiteFormDialog> createState() => _SiteFormDialogState();
}

class _SiteFormDialogState extends ConsumerState<_SiteFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _lat = TextEditingController();
  final _lng = TextEditingController();
  final _radius = TextEditingController(text: '150');
  bool _fetching = false;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _lat.dispose();
    _lng.dispose();
    _radius.dispose();
    super.dispose();
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _fetching = true);
    try {
      final pos = await LocationService().getCurrentPosition();
      _lat.text = pos.latitude.toStringAsFixed(6);
      _lng.text = pos.longitude.toStringAsFixed(6);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _fetching = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref.read(adminServiceProvider).createSite(
            name: _name.text.trim(),
            latitude: double.parse(_lat.text),
            longitude: double.parse(_lng.text),
            radiusMeters: double.parse(_radius.text),
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

  String? _numValidator(String? v) {
    if (v == null || v.isEmpty) return 'Required';
    if (double.tryParse(v) == null) return 'Must be a number';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('New site'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Site name'),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _lat,
                      keyboardType: const TextInputType.numberWithOptions(
                          decimal: true, signed: true),
                      decoration: const InputDecoration(labelText: 'Latitude'),
                      validator: _numValidator,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _lng,
                      keyboardType: const TextInputType.numberWithOptions(
                          decimal: true, signed: true),
                      decoration: const InputDecoration(labelText: 'Longitude'),
                      validator: _numValidator,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: _fetching ? null : _useCurrentLocation,
                  icon: _fetching
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.my_location),
                  label: const Text('Use my current location'),
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _radius,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Geofence radius',
                  suffixText: 'm',
                ),
                validator: _numValidator,
              ),
            ],
          ),
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
