import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/auth_service.dart';

class PaymentProofViewerScreen extends StatefulWidget {
  final String orderId;
  final String orderNumber;
  final String customerName;
  final String? paymentStatus;
  final double? advanceAmount;
  final VoidCallback? onStatusChanged;

  const PaymentProofViewerScreen({
    super.key,
    required this.orderId,
    required this.orderNumber,
    required this.customerName,
    this.paymentStatus,
    this.advanceAmount,
    this.onStatusChanged,
  });

  @override
  State<PaymentProofViewerScreen> createState() => _PaymentProofViewerScreenState();
}

class _PaymentProofViewerScreenState extends State<PaymentProofViewerScreen> {
  final TransformationController _transformController = TransformationController();
  TapDownDetails? _doubleTapDetails;

  Uint8List? _imageBytes;
  bool _isLoading = true;
  String? _error;
  bool _isActionProcessing = false;

  @override
  void initState() {
    super.initState();
    _loadImage();
  }

  @override
  void dispose() {
    _transformController.dispose();
    super.dispose();
  }

  Future<void> _loadImage() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.fetchPaymentProofBytes(widget.orderId);

    if (!mounted) return;

    if (res.success && res.data != null) {
      setState(() {
        _imageBytes = res.data;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = res.error ?? 'Failed to load payment proof screenshot.';
        _isLoading = false;
      });
    }
  }

  void _handleDoubleTap() {
    if (_transformController.value != Matrix4.identity()) {
      _transformController.value = Matrix4.identity();
    } else {
      final position = _doubleTapDetails?.localPosition ?? Offset.zero;
      _transformController.value = Matrix4.identity()
        ..storage[12] = -position.dx * 1.5
        ..storage[13] = -position.dy * 1.5
        ..storage[0] = 2.5
        ..storage[5] = 2.5;
    }
  }

  Future<void> _handleApprove() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Approve Payment', style: TextStyle(color: AppColors.textPrimary)),
        content: Text(
          'Confirm advance payment receipt for Order #${widget.orderNumber}? Order will automatically transition to CONFIRMED.',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Confirm Approval'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isActionProcessing = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.approvePayment(widget.orderId);

    if (!mounted) return;
    setState(() => _isActionProcessing = false);

    if (res.success) {
      widget.onStatusChanged?.call();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment approved! Order confirmed.'), backgroundColor: AppColors.success),
      );
      Navigator.of(context).pop(true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error ?? 'Failed to approve payment'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _handleReject() async {
    final reasonController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Reject Payment Proof', style: TextStyle(color: AppColors.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter a clear reason for rejection (this will be logged and communicated):',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              autofocus: true,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                hintText: 'e.g. Unreadable screenshot, transaction ID mismatch',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () {
              if (reasonController.text.trim().isEmpty) return;
              Navigator.of(ctx).pop(true);
            },
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final reason = reasonController.text.trim();
    if (reason.isEmpty) return;

    setState(() => _isActionProcessing = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.rejectPayment(widget.orderId, reason);

    if (!mounted) return;
    setState(() => _isActionProcessing = false);

    if (res.success) {
      widget.onStatusChanged?.call();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment proof rejected.'), backgroundColor: AppColors.warning),
      );
      Navigator.of(context).pop(true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error ?? 'Failed to reject payment'), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool canTakeAction = widget.paymentStatus == 'PAYMENT_REVIEW_PENDING' ||
        widget.paymentStatus == 'UNDER_REVIEW' ||
        widget.paymentStatus == null;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black.withValues(alpha: 0.85),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment Proof • #${widget.orderNumber}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            Text(
              widget.customerName,
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadImage,
            tooltip: 'Reload Proof',
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Image / Loader / Error area
          if (_isLoading)
            const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: AppColors.primary),
                  SizedBox(height: 16),
                  Text(
                    'Retrieving secure payment proof...',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            )
          else if (_error != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.broken_image_outlined, size: 54, color: AppColors.error),
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _loadImage,
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          else if (_imageBytes != null)
            GestureDetector(
              onDoubleTapDown: (details) => _doubleTapDetails = details,
              onDoubleTap: _handleDoubleTap,
              child: InteractiveViewer(
                transformationController: _transformController,
                minScale: 0.5,
                maxScale: 5.0,
                panEnabled: true,
                scaleEnabled: true,
                child: Center(
                  child: Image.memory(
                    _imageBytes!,
                    fit: BoxFit.contain,
                    filterQuality: FilterQuality.medium,
                  ),
                ),
              ),
            ),

          // Bottom Action Bar (if review pending)
          if (!_isLoading && _error == null && canTakeAction)
            Positioned(
              left: 16,
              right: 16,
              bottom: 24,
              child: SafeArea(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.surface.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.5),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: _isActionProcessing
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(8.0),
                            child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
                          ),
                        )
                      : Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.error,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: _handleReject,
                                icon: const Icon(Icons.close, size: 18),
                                label: const Text('Reject', style: TextStyle(fontWeight: FontWeight.w700)),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.success,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: _handleApprove,
                                icon: const Icon(Icons.check, size: 18),
                                label: const Text('Approve', style: TextStyle(fontWeight: FontWeight.w700)),
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
