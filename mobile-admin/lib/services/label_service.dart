import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import '../config/app_theme.dart';
import 'api_service.dart';

class LabelService {
  /// Fetches the official PostEx Airway Bill PDF and opens Android's native Print dialog
  static Future<void> printLabel({
    required BuildContext context,
    required ApiService apiService,
    String? orderId,
    String? trackingNumber,
    List<String>? orderIds,
    String? filename,
  }) async {
    final messenger = ScaffoldMessenger.of(context);
    messenger.showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
            ),
            SizedBox(width: 12),
            Text('Fetching official PostEx PDF label...'),
          ],
        ),
        duration: Duration(seconds: 3),
      ),
    );

    final res = await apiService.fetchOfficialLabelBytes(
      orderId: orderId,
      trackingNumber: trackingNumber,
      orderIds: orderIds,
    );

    if (!res.success || res.data == null) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(res.error ?? 'Could not retrieve PostEx official label.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final Uint8List pdfBytes = res.data!;
    final docName = filename ?? 'PostEx-AWB-${trackingNumber ?? 'batch'}.pdf';

    try {
      await Printing.layoutPdf(
        name: docName,
        onLayout: (format) async => pdfBytes,
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('Print preview failed: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  /// Fetches the official PostEx Airway Bill PDF and opens Android's system share sheet
  static Future<void> shareLabel({
    required BuildContext context,
    required ApiService apiService,
    String? orderId,
    String? trackingNumber,
    List<String>? orderIds,
    String? filename,
  }) async {
    final messenger = ScaffoldMessenger.of(context);
    messenger.showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
            ),
            SizedBox(width: 12),
            Text('Preparing official PostEx label for sharing...'),
          ],
        ),
        duration: Duration(seconds: 3),
      ),
    );

    final res = await apiService.fetchOfficialLabelBytes(
      orderId: orderId,
      trackingNumber: trackingNumber,
      orderIds: orderIds,
    );

    if (!res.success || res.data == null) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(res.error ?? 'Could not retrieve PostEx official label.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    try {
      final tempDir = await getTemporaryDirectory();
      final docName = filename ?? 'PostEx-AWB-${trackingNumber ?? 'batch'}.pdf';
      final file = File('${tempDir.path}/$docName');
      await file.writeAsBytes(res.data!);

      // ignore: deprecated_member_use
      await Share.shareXFiles(
        [XFile(file.path, mimeType: 'application/pdf', name: docName)],
        subject: 'Official PostEx Airway Bill Label',
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('Share failed: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }
}
