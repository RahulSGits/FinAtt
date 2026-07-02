enum UserRole { employee, admin }

UserRole roleFromString(String value) {
  return UserRole.values.firstWhere(
    (r) => r.name == value,
    orElse: () => UserRole.employee,
  );
}

class Profile {
  final String id;
  final String fullName;
  final String email;
  final UserRole role;
  final String? siteId;
  final String? shiftId;
  final String? photoUrl;
  final String? department;
  final bool faceEnrolled;
  final List<double>? faceSignature;
  final DateTime createdAt;

  Profile({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.siteId,
    this.shiftId,
    this.photoUrl,
    this.department,
    this.faceEnrolled = false,
    this.faceSignature,
    required this.createdAt,
  });

  factory Profile.fromMap(Map<String, dynamic> map) {
    final rawSig = map['face_signature'];
    return Profile(
      id: map['id'] as String,
      fullName: map['full_name'] as String? ?? '',
      email: map['email'] as String? ?? '',
      role: roleFromString(map['role'] as String? ?? 'employee'),
      siteId: map['site_id'] as String?,
      shiftId: map['shift_id'] as String?,
      photoUrl: map['photo_url'] as String?,
      department: map['department'] as String?,
      faceEnrolled: map['face_enrolled'] as bool? ?? false,
      faceSignature: rawSig is List
          ? rawSig.map((e) => (e as num).toDouble()).toList()
          : null,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'full_name': fullName,
      'email': email,
      'role': role.name,
      'site_id': siteId,
      'shift_id': shiftId,
      'photo_url': photoUrl,
      'department': department,
      'face_enrolled': faceEnrolled,
      'face_signature': faceSignature,
    };
  }
}
