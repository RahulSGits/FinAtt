import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../providers.dart';
import '../../services/admin_service.dart';

/// Admin queue for approving or rejecting leave requests. Approved leave that
/// covers a date makes the close-day job mark that day "on_leave" (not absent).
class LeaveTab extends ConsumerStatefulWidget {
  const LeaveTab({super.key});

  @override
  ConsumerState<LeaveTab> createState() => _LeaveTabState();
}

class _LeaveTabState extends ConsumerState<LeaveTab> {
  List<LeaveRequest> _requests = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final requests = await ref.read(adminServiceProvider).getLeaveRequests();
    if (mounted) {
      setState(() {
        _requests = requests;
        _loading = false;
      });
    }
  }

  Future<void> _decide(LeaveRequest req, bool approve) async {
    final adminId = ref.read(authServiceProvider).currentUser?.id;
    if (adminId == null) return;
    await ref.read(adminServiceProvider).decideLeave(
          leaveId: req.id,
          approve: approve,
          adminId: adminId,
        );
    _load();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_requests.isEmpty) {
      return const Center(child: Text('No leave requests.'));
    }
    final dateFmt = DateFormat('d MMM yyyy');
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _requests.length,
        itemBuilder: (context, i) {
          final req = _requests[i];
          final pending = req.status == 'pending';
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        req.employeeName.isEmpty
                            ? 'Employee'
                            : req.employeeName,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Chip(
                        label: Text(
                          req.status,
                          style: TextStyle(color: _statusColor(req.status)),
                        ),
                        backgroundColor:
                            _statusColor(req.status).withValues(alpha: 0.12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${dateFmt.format(req.startDate)} → ${dateFmt.format(req.endDate)}',
                  ),
                  if (req.reason != null && req.reason!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(req.reason!,
                        style: const TextStyle(color: Colors.grey)),
                  ],
                  if (pending) ...[
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => _decide(req, false),
                          child: const Text('Reject'),
                        ),
                        const SizedBox(width: 8),
                        FilledButton(
                          onPressed: () => _decide(req, true),
                          child: const Text('Approve'),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
