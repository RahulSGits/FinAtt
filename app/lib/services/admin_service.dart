import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/profile.dart';
import '../models/shift.dart';
import '../models/site.dart';
import 'supabase_service.dart';

/// A pending/approved/rejected time-off request, joined with the requesting
/// employee's name for display in the admin queue.
class LeaveRequest {
  final String id;
  final String employeeId;
  final String employeeName;
  final DateTime startDate;
  final DateTime endDate;
  final String? reason;
  final String status;

  LeaveRequest({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.startDate,
    required this.endDate,
    this.reason,
    required this.status,
  });

  factory LeaveRequest.fromMap(Map<String, dynamic> map) {
    final profile = map['profiles'];
    return LeaveRequest(
      id: map['id'] as String,
      employeeId: map['employee_id'] as String,
      employeeName: profile is Map ? (profile['full_name'] as String? ?? '') : '',
      startDate: DateTime.parse(map['start_date'] as String),
      endDate: DateTime.parse(map['end_date'] as String),
      reason: map['reason'] as String?,
      status: map['status'] as String? ?? 'pending',
    );
  }
}

/// All admin-only writes. RLS still enforces that only admins can perform
/// these; the UI simply hides them from employees.
class AdminService {
  SupabaseClient get _db => SupabaseService.client;

  // ----- Sites -----------------------------------------------------------
  Future<List<Site>> getSites() async {
    final rows = await _db.from('sites').select().order('name');
    return rows.map<Site>(Site.fromMap).toList();
  }

  Future<void> createSite({
    required String name,
    required double latitude,
    required double longitude,
    required double radiusMeters,
  }) async {
    await _db.from('sites').insert({
      'name': name,
      'latitude': latitude,
      'longitude': longitude,
      'radius_meters': radiusMeters,
    });
  }

  Future<void> updateSiteRadius(String siteId, double radiusMeters) async {
    await _db
        .from('sites')
        .update({'radius_meters': radiusMeters}).eq('id', siteId);
  }

  Future<void> deleteSite(String siteId) async {
    await _db.from('sites').delete().eq('id', siteId);
  }

  // ----- Shifts ----------------------------------------------------------
  Future<List<Shift>> getShifts() async {
    final rows = await _db.from('shifts').select().order('name');
    return rows.map<Shift>(Shift.fromMap).toList();
  }

  Future<void> createShift({
    required String name,
    required TimeOfDay startTime,
    required TimeOfDay endTime,
    required double minPresencePercent,
  }) async {
    String fmt(TimeOfDay t) =>
        '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}:00';
    await _db.from('shifts').insert({
      'name': name,
      'start_time': fmt(startTime),
      'end_time': fmt(endTime),
      'min_presence_percent': minPresencePercent,
    });
  }

  Future<void> deleteShift(String shiftId) async {
    await _db.from('shifts').delete().eq('id', shiftId);
  }

  // ----- Employees -------------------------------------------------------
  Future<List<Profile>> getEmployees() async {
    final rows =
        await _db.from('profiles').select().eq('role', 'employee').order('full_name');
    return rows.map<Profile>(Profile.fromMap).toList();
  }

  /// Assigns (or clears) an employee's site, shift, and department.
  Future<void> assignEmployee({
    required String employeeId,
    String? siteId,
    String? shiftId,
    String? department,
  }) async {
    await _db.from('profiles').update({
      'site_id': siteId,
      'shift_id': shiftId,
      'department': department,
    }).eq('id', employeeId);
  }

  // ----- Leave -----------------------------------------------------------
  Future<List<LeaveRequest>> getLeaveRequests() async {
    final rows = await _db
        .from('leave_requests')
        .select('*, profiles!leave_requests_employee_id_fkey ( full_name )')
        .order('created_at', ascending: false);
    return rows.map<LeaveRequest>(LeaveRequest.fromMap).toList();
  }

  Future<void> decideLeave({
    required String leaveId,
    required bool approve,
    required String adminId,
  }) async {
    await _db.from('leave_requests').update({
      'status': approve ? 'approved' : 'rejected',
      'decided_by': adminId,
      'decided_at': DateTime.now().toIso8601String(),
    }).eq('id', leaveId);
  }
}
