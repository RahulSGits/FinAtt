import 'dart:io';

import 'package:excel/excel.dart' as xlsx;
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../models/attendance_session.dart';
import '../models/profile.dart';
import 'report_service.dart';

/// Generates shareable report files: a per-employee monthly PDF and a
/// company-wide Excel workbook for admins.
class ExportService {
  String _hm(Duration d) => '${d.inHours}h ${d.inMinutes.remainder(60)}m';

  /// Builds a monthly attendance PDF for one employee and returns the file.
  Future<File> employeeMonthlyPdf({
    required Profile profile,
    required DateTime month,
    required List<AttendanceDay> days,
    required MonthlySummary summary,
  }) async {
    final doc = pw.Document();
    final monthLabel = DateFormat('MMMM yyyy').format(month);
    final dateFmt = DateFormat('EEE, d MMM');

    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (context) => [
          pw.Header(
            level: 0,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('GeoSelfie Attendance',
                    style: pw.TextStyle(
                        fontSize: 20, fontWeight: pw.FontWeight.bold)),
                pw.Text('Monthly report — $monthLabel'),
              ],
            ),
          ),
          pw.SizedBox(height: 8),
          pw.Text('Employee: ${profile.fullName}   (${profile.email})'),
          if (profile.department != null)
            pw.Text('Department: ${profile.department}'),
          pw.SizedBox(height: 12),
          pw.Container(
            padding: const pw.EdgeInsets.all(10),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey400),
              borderRadius: pw.BorderRadius.circular(6),
            ),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                _stat('Present', '${summary.presentDays}'),
                _stat('Half day', '${summary.halfDays}'),
                _stat('Absent', '${summary.absentDays}'),
                _stat('On leave', '${summary.onLeaveDays}'),
                _stat('Total hours', _hm(summary.totalHours)),
                _stat('Attendance',
                    '${summary.attendancePercent.toStringAsFixed(0)}%'),
              ],
            ),
          ),
          pw.SizedBox(height: 16),
          pw.TableHelper.fromTextArray(
            headers: ['Date', 'Status', 'Hours present'],
            headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
            headerDecoration:
                const pw.BoxDecoration(color: PdfColors.grey300),
            cellAlignment: pw.Alignment.centerLeft,
            data: [
              for (final d in days)
                [
                  dateFmt.format(d.date),
                  _statusLabel(d.status),
                  _hm(d.totalPresentDuration),
                ],
            ],
          ),
          pw.SizedBox(height: 16),
          pw.Text(
            'Generated ${DateFormat('d MMM yyyy HH:mm').format(DateTime.now())}',
            style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600),
          ),
        ],
      ),
    );

    final dir = await getTemporaryDirectory();
    final safeName = profile.fullName.replaceAll(RegExp(r'[^A-Za-z0-9]'), '_');
    final file = File(
        '${dir.path}/attendance_${safeName}_${DateFormat('yyyy_MM').format(month)}.pdf');
    await file.writeAsBytes(await doc.save());
    return file;
  }

  /// Builds a company-wide Excel workbook, one row per employee.
  Future<File> companyMonthlyExcel({
    required DateTime month,
    required List<EmployeeMonthlyRow> rows,
  }) async {
    final book = xlsx.Excel.createExcel();
    final sheet = book['Attendance'];
    book.setDefaultSheet('Attendance');

    final headers = [
      'Employee',
      'Email',
      'Department',
      'Present',
      'Half day',
      'Absent',
      'On leave',
      'Working days',
      'Attendance %',
      'Total hours',
    ];
    sheet.appendRow(headers.map((h) => xlsx.TextCellValue(h)).toList());

    for (final r in rows) {
      final s = r.summary;
      sheet.appendRow([
        xlsx.TextCellValue(r.profile.fullName),
        xlsx.TextCellValue(r.profile.email),
        xlsx.TextCellValue(r.profile.department ?? ''),
        xlsx.IntCellValue(s.presentDays),
        xlsx.IntCellValue(s.halfDays),
        xlsx.IntCellValue(s.absentDays),
        xlsx.IntCellValue(s.onLeaveDays),
        xlsx.IntCellValue(s.totalWorkingDays),
        xlsx.DoubleCellValue(
            double.parse(s.attendancePercent.toStringAsFixed(1))),
        xlsx.TextCellValue(_hm(s.totalHours)),
      ]);
    }

    final dir = await getTemporaryDirectory();
    final file = File(
        '${dir.path}/company_attendance_${DateFormat('yyyy_MM').format(month)}.xlsx');
    final bytes = book.save();
    if (bytes != null) await file.writeAsBytes(bytes);
    return file;
  }

  pw.Widget _stat(String label, String value) => pw.Column(
        children: [
          pw.Text(value,
              style: pw.TextStyle(
                  fontSize: 14, fontWeight: pw.FontWeight.bold)),
          pw.Text(label, style: const pw.TextStyle(fontSize: 9)),
        ],
      );

  String _statusLabel(AttendanceStatus s) => switch (s) {
        AttendanceStatus.present => 'Present',
        AttendanceStatus.halfDay => 'Half day',
        AttendanceStatus.absent => 'Absent',
        AttendanceStatus.onLeave => 'On leave',
        AttendanceStatus.pending => 'Pending',
      };
}
