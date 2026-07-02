import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/profile.dart';
import '../../models/shift.dart';
import '../../models/site.dart';
import '../../providers.dart';

/// Admin sees every employee and assigns each one a work site, shift, and
/// department. Employees can't check in until they have a site + shift.
class EmployeesTab extends ConsumerStatefulWidget {
  const EmployeesTab({super.key});

  @override
  ConsumerState<EmployeesTab> createState() => _EmployeesTabState();
}

class _EmployeesTabState extends ConsumerState<EmployeesTab> {
  List<Profile> _employees = [];
  List<Site> _sites = [];
  List<Shift> _shifts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final admin = ref.read(adminServiceProvider);
    final employees = await admin.getEmployees();
    final sites = await admin.getSites();
    final shifts = await admin.getShifts();
    if (mounted) {
      setState(() {
        _employees = employees;
        _sites = sites;
        _shifts = shifts;
        _loading = false;
      });
    }
  }

  String _siteName(String? id) =>
      _sites.where((s) => s.id == id).map((s) => s.name).firstOrNull ??
      'No site';

  String _shiftName(String? id) =>
      _shifts.where((s) => s.id == id).map((s) => s.name).firstOrNull ??
      'No shift';

  Future<void> _assign(Profile employee) async {
    final changed = await showDialog<bool>(
      context: context,
      builder: (_) => _AssignDialog(
        employee: employee,
        sites: _sites,
        shifts: _shifts,
      ),
    );
    if (changed == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_employees.isEmpty) {
      return const Center(child: Text('No employees have signed up yet.'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _employees.length,
        itemBuilder: (context, i) {
          final e = _employees[i];
          final unassigned = e.siteId == null || e.shiftId == null;
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                child: Text(
                  e.fullName.isNotEmpty ? e.fullName[0].toUpperCase() : '?',
                ),
              ),
              title: Text(e.fullName.isEmpty ? e.email : e.fullName),
              subtitle: Text(
                '${_siteName(e.siteId)} • ${_shiftName(e.shiftId)}'
                '${e.department != null ? ' • ${e.department}' : ''}',
              ),
              trailing: unassigned
                  ? const Chip(
                      label: Text('Unassigned'),
                      backgroundColor: Color(0x22FF9800),
                    )
                  : const Icon(Icons.edit),
              onTap: () => _assign(e),
            ),
          );
        },
      ),
    );
  }
}

class _AssignDialog extends ConsumerStatefulWidget {
  final Profile employee;
  final List<Site> sites;
  final List<Shift> shifts;

  const _AssignDialog({
    required this.employee,
    required this.sites,
    required this.shifts,
  });

  @override
  ConsumerState<_AssignDialog> createState() => _AssignDialogState();
}

class _AssignDialogState extends ConsumerState<_AssignDialog> {
  String? _siteId;
  String? _shiftId;
  late final TextEditingController _department;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _siteId = widget.employee.siteId;
    _shiftId = widget.employee.shiftId;
    _department = TextEditingController(text: widget.employee.department ?? '');
  }

  @override
  void dispose() {
    _department.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(adminServiceProvider).assignEmployee(
            employeeId: widget.employee.id,
            siteId: _siteId,
            shiftId: _shiftId,
            department: _department.text.trim().isEmpty
                ? null
                : _department.text.trim(),
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

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.employee.fullName.isEmpty
          ? widget.employee.email
          : widget.employee.fullName),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<String?>(
            initialValue: _siteId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Work site'),
            items: [
              const DropdownMenuItem(value: null, child: Text('No site')),
              ...widget.sites.map(
                (s) => DropdownMenuItem(value: s.id, child: Text(s.name)),
              ),
            ],
            onChanged: (v) => setState(() => _siteId = v),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String?>(
            initialValue: _shiftId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Shift'),
            items: [
              const DropdownMenuItem(value: null, child: Text('No shift')),
              ...widget.shifts.map(
                (s) => DropdownMenuItem(value: s.id, child: Text(s.name)),
              ),
            ],
            onChanged: (v) => setState(() => _shiftId = v),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _department,
            decoration: const InputDecoration(labelText: 'Department'),
          ),
        ],
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
              : const Text('Save'),
        ),
      ],
    );
  }
}
