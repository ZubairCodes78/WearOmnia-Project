class AdminUser {
  final String id;
  final String email;
  final String? name;
  final bool twoFactorEnabled;
  final String? twoFactorEnabledAt;

  AdminUser({
    required this.id,
    required this.email,
    this.name,
    required this.twoFactorEnabled,
    this.twoFactorEnabledAt,
  });

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      name: json['name'] as String?,
      twoFactorEnabled: json['twoFactorEnabled'] as bool? ?? false,
      twoFactorEnabledAt: json['twoFactorEnabledAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'twoFactorEnabled': twoFactorEnabled,
      'twoFactorEnabledAt': twoFactorEnabledAt,
    };
  }
}
