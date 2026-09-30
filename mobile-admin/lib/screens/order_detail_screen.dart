import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../models/order.dart';
import '../services/auth_service.dart';
import '../services/label_service.dart';
import 'payment_proof_viewer.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  static final DateFormat _dateFormat = DateFormat('MMM dd, yyyy • hh:mm a');
  static final NumberFormat _currencyFormat = NumberFormat('#,##0', 'en_US');

  OrderModel? _order;
  bool _isLoading = true;
  String? _error;
  bool _isActionProcessing = false;

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  Future<void> _fetchDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.fetchOrderDetail(widget.orderId);

    if (!mounted) return;

    if (res.success && res.data != null) {
      setState(() {
        _order = res.data;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = res.error ?? 'Failed to load order details';
        _isLoading = false;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return AppColors.warning;
      case 'CONFIRMED':
        return AppColors.info;
      case 'PACKING':
        return const Color(0xFF8B5CF6);
      case 'DISPATCHED':
      case 'OUT_FOR_DELIVERY':
        return AppColors.accent;
      case 'DELIVERED':
        return AppColors.success;
      case 'CANCELLED':
      case 'RETURNED':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  Color _getPaymentStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'PAYMENT_APPROVED':
        return AppColors.success;
      case 'PAYMENT_REJECTED':
        return AppColors.error;
      case 'PAYMENT_REVIEW_PENDING':
      case 'UNDER_REVIEW':
        return AppColors.warning;
      default:
        return AppColors.textMuted;
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // 1. Confirm Order Action
  Future<void> _handleConfirmOrder() async {
    if (_order == null) return;

    if (_order!.isPreOrder && _order!.preOrderPaymentStatus != 'PAYMENT_APPROVED') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cannot confirm pre-order: Payment proof must be approved first.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Confirm Order', style: TextStyle(color: AppColors.textPrimary)),
        content: Text(
          'Confirm Order #${_order!.orderNumber}? This will mark it as CONFIRMED and eligible for PostEx shipment dispatch.',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Confirm Order'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isActionProcessing = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.confirmOrder(_order!.id);

    if (!mounted) return;
    setState(() => _isActionProcessing = false);

    if (res.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Order confirmed successfully!'), backgroundColor: AppColors.success),
      );
      _fetchDetail();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error ?? 'Failed to confirm order'), backgroundColor: AppColors.error),
      );
    }
  }

  // 2. Approve Payment Action
  Future<void> _handleApprovePayment() async {
    if (_order == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Approve Payment', style: TextStyle(color: AppColors.textPrimary)),
        content: Text(
          'Confirm advance payment receipt for Order #${_order!.orderNumber}? Pre-order will transition to CONFIRMED.',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Approve'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isActionProcessing = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.approvePayment(_order!.id);

    if (!mounted) return;
    setState(() => _isActionProcessing = false);

    if (res.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment approved & order confirmed!'), backgroundColor: AppColors.success),
      );
      _fetchDetail();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error ?? 'Failed to approve payment'), backgroundColor: AppColors.error),
      );
    }
  }

  // 3. Reject Payment Action
  Future<void> _handleRejectPayment() async {
    if (_order == null) return;
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
              'Enter a reason for rejecting this screenshot (communicated to customer):',
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
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () {
              if (reasonController.text.trim().isEmpty) return;
              Navigator.of(ctx).pop(true);
            },
            child: const Text('Reject Payment'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final reason = reasonController.text.trim();
    if (reason.isEmpty) return;

    setState(() => _isActionProcessing = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.rejectPayment(_order!.id, reason);

    if (!mounted) return;
    setState(() => _isActionProcessing = false);

    if (res.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment proof rejected.'), backgroundColor: AppColors.warning),
      );
      _fetchDetail();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error ?? 'Failed to reject payment'), backgroundColor: AppColors.error),
      );
    }
  }

  // 4. Open Payment Proof Full-screen Viewer
  void _openPaymentProofViewer() {
    if (_order == null) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PaymentProofViewerScreen(
          orderId: _order!.id,
          orderNumber: _order!.orderNumber,
          customerName: _order!.customerName,
          paymentStatus: _order!.preOrderPaymentStatus,
          advanceAmount: _order!.preOrderAdvanceAmount,
          onStatusChanged: _fetchDetail,
        ),
      ),
    ).then((_) => _fetchDetail());
  }

  // 5. Create PostEx Shipment Action
  Future<void> _handleCreatePostExShipment() async {
    if (_order == null) return;

    // Check if tracking already exists
    if (_order!.trackingNumber != null && _order!.trackingNumber!.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Shipment already created with Tracking ID: ${_order!.trackingNumber}'),
          backgroundColor: AppColors.info,
        ),
      );
      return;
    }

    if (_order!.status != 'CONFIRMED' && _order!.status != 'PACKING') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Order must be CONFIRMED before booking PostEx shipment. Current: ${_order!.status}'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Create PostEx Shipment', style: TextStyle(color: AppColors.textPrimary)),
        content: Text(
          'Book official PostEx courier dispatch for Order #${_order!.orderNumber} to ${_order!.shippingCity}?',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Book Shipment'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isActionProcessing = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.createPostExShipment(_order!.id);

    if (!mounted) return;
    setState(() => _isActionProcessing = false);

    if (res.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('PostEx Shipment Booked! Tracking ID: ${res.data?['trackingNumber'] ?? 'Assigned'}'),
          backgroundColor: AppColors.success,
        ),
      );
      _fetchDetail();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error ?? 'Failed to book PostEx shipment'), backgroundColor: AppColors.error),
      );
    }
  }

  // 6. Track PostEx Shipment Live Action
  Future<void> _handleTrackPostExShipment() async {
    if (_order == null) return;
    final tracking = _order!.trackingNumber;
    if (tracking == null || tracking.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No tracking number exists for this order.'), backgroundColor: AppColors.warning),
      );
      return;
    }

    setState(() => _isActionProcessing = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.trackPostExShipment(orderId: _order!.id, trackingNumber: tracking);

    if (!mounted) return;
    setState(() => _isActionProcessing = false);

    if (res.success && res.data != null) {
      final t = res.data!;
      showModalBottomSheet(
        context: context,
        backgroundColor: AppColors.surface,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        builder: (ctx) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'PostEx Live Tracking',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.of(ctx).pop()),
                ],
              ),
              const Divider(color: AppColors.border),
              const SizedBox(height: 8),
              _buildDetailRow('Tracking Number', tracking),
              _buildDetailRow('Current Status', t['rawStatus'] ?? t['status'] ?? 'Unknown'),
              if (t['statusDetails'] != null) _buildDetailRow('Status Details', t['statusDetails']),
              if (t['pickupDate'] != null) _buildDetailRow('Pickup Date', t['pickupDate']),
              if (t['deliveryDate'] != null) _buildDetailRow('Delivery Date', t['deliveryDate']),
              if (t['returnReason'] != null) _buildDetailRow('Return Reason', t['returnReason']),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  _fetchDetail();
                },
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Refresh Details'),
              ),
            ],
          ),
        ),
      );
      _fetchDetail();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error ?? 'Failed to track shipment'), backgroundColor: AppColors.error),
      );
    }
  }

  // 7. Send Lifecycle WhatsApp Message
  Future<void> _handleSendWhatsApp(String action) async {
    if (_order == null) return;

    final actionTitles = {
      'CONFIRMATION': 'Order Confirmation',
      'TRACKING': 'Tracking Information',
      'DELIVERED': 'Delivery Update',
    };

    final title = actionTitles[action] ?? action;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text('Send WhatsApp $title', style: const TextStyle(color: AppColors.textPrimary)),
        content: Text(
          'Send server-side $title WhatsApp message to ${_order!.customerPhone} for Order #${_order!.orderNumber}?',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Send Message'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isActionProcessing = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.sendLifecycleWhatsApp(
      orderIds: [_order!.id],
      expectedAction: action,
    );

    if (!mounted) return;
    setState(() => _isActionProcessing = false);

    if (res.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$title WhatsApp dispatched successfully!'), backgroundColor: AppColors.success),
      );
      _fetchDetail();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error ?? 'Failed to dispatch WhatsApp message'), backgroundColor: AppColors.error),
      );
    }
  }

  // 8. Update Order Status Modal
  void _showStatusUpdateDialog() {
    if (_order == null) return;

    const availableStatuses = [
      'PENDING',
      'CONFIRMED',
      'PACKING',
      'DISPATCHED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ];

    String selectedStatus = _order!.status;
    final noteController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Update Order Status',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: selectedStatus,
                    dropdownColor: AppColors.surfaceVariant,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'New Status'),
                    items: availableStatuses.map((s) {
                      return DropdownMenuItem(
                        value: s,
                        child: Text(s),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setModalState(() => selectedStatus = val);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: noteController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Admin Note (Optional)',
                      hintText: 'e.g. Customer requested late delivery',
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () async {
                      final messenger = ScaffoldMessenger.of(context);
                      Navigator.of(ctx).pop();
                      setState(() => _isActionProcessing = true);
                      final auth = Provider.of<AuthService>(context, listen: false);
                      final res = await auth.apiService.updateOrderStatus(
                        orderId: _order!.id,
                        status: selectedStatus,
                        internalAdminNote: noteController.text.trim().isNotEmpty
                            ? noteController.text.trim()
                            : null,
                      );
                      if (!mounted) return;
                      setState(() => _isActionProcessing = false);

                      if (res.success) {
                        messenger.showSnackBar(
                          const SnackBar(
                            content: Text('Status updated successfully!'),
                            backgroundColor: AppColors.success,
                          ),
                        );
                        _fetchDetail();
                      } else {
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text(res.error ?? 'Failed to update status'),
                            backgroundColor: AppColors.error,
                          ),
                        );
                      }
                    },
                    child: const Text('Save Status Update'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context, listen: false);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_order != null ? '#${_order!.orderNumber}' : 'Order Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchDetail,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                        const SizedBox(height: 12),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _fetchDetail, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : _order == null
                  ? const Center(child: Text('Order not found'))
                  : RefreshIndicator(
                      onRefresh: _fetchDetail,
                      color: AppColors.primary,
                      backgroundColor: AppColors.surface,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // 1. ORDER STATUS HEADER CARD
                            _buildStatusHeaderCard(),
                            const SizedBox(height: 14),

                            // 2. PRE-ORDER PAYMENT PROOF SECTION (CRITICAL)
                            if (_order!.isPreOrder) ...[
                              _buildPaymentProofCard(),
                              const SizedBox(height: 14),
                            ],

                            // 3. POSTEX SHIPPING & TRACKING CARD
                            _buildPostExShippingCard(auth),
                            const SizedBox(height: 14),

                            // 4. WHATSAPP LIFECYCLE COMMUNICATION CARD
                            _buildWhatsAppCard(),
                            const SizedBox(height: 14),

                            // 5. CUSTOMER INFORMATION & STATS CARD
                            _buildCustomerCard(),
                            const SizedBox(height: 14),

                            // 6. ORDER ITEMS CARD
                            _buildItemsCard(),
                            const SizedBox(height: 14),

                            // 7. FINANCIAL & PAYMENT SUMMARY CARD
                            _buildFinancialSummaryCard(),
                            const SizedBox(height: 14),

                            // 8. ACTIVITY TIMELINE
                            if (_order!.timeline.isNotEmpty) ...[
                              _buildTimelineCard(),
                              const SizedBox(height: 14),
                            ],
                          ],
                        ),
                      ),
                    ),
      // STICKY BOTTOM ACTION BAR (One-thumb fast operations)
      bottomNavigationBar: _order != null && !_isLoading ? _buildStickyBottomActionBar(auth) : null,
    );
  }

  // 1. Status Header Card
  Widget _buildStatusHeaderCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    '#${_order!.orderNumber}',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (_order!.isPreOrder)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
                      ),
                      child: const Text(
                        'PRE-ORDER',
                        style: TextStyle(color: AppColors.accent, fontSize: 10, fontWeight: FontWeight.w800),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.textMuted.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'COD',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w700),
                      ),
                    ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _getStatusColor(_order!.status).withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _getStatusColor(_order!.status).withValues(alpha: 0.4),
                  ),
                ),
                child: Text(
                  _order!.status,
                  style: TextStyle(
                    color: _getStatusColor(_order!.status),
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            _dateFormat.format(_order!.createdAt),
            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _showStatusUpdateDialog,
                  icon: const Icon(Icons.edit_note, size: 18),
                  label: const Text('Update Status'),
                ),
              ),
              if (_order!.status == 'PENDING') ...[
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                    onPressed: _handleConfirmOrder,
                    icon: const Icon(Icons.check_circle, size: 18),
                    label: const Text('Confirm Order'),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  // 2. Pre-Order Payment Proof Section
  Widget _buildPaymentProofCard() {
    final status = _order!.preOrderPaymentStatus ?? 'PAYMENT_REVIEW_PENDING';
    final hasProof = _order!.preOrderPaymentScreenshotUrl != null &&
        _order!.preOrderPaymentScreenshotUrl!.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: status == 'PAYMENT_REVIEW_PENDING' || status == 'UNDER_REVIEW'
              ? AppColors.warning.withValues(alpha: 0.5)
              : AppColors.border,
          width: status == 'PAYMENT_REVIEW_PENDING' ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.shield_outlined, color: AppColors.primary, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Pre-Order Payment Proof',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _getPaymentStatusColor(status).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _getPaymentStatusColor(status).withValues(alpha: 0.4)),
                ),
                child: Text(
                  status.replaceAll('_', ' '),
                  style: TextStyle(
                    color: _getPaymentStatusColor(status),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const Divider(color: AppColors.border, height: 22),
          if (_order!.preOrderAdvanceAmount != null)
            _buildDetailRow('Advance Required', 'Rs. ${_currencyFormat.format(_order!.preOrderAdvanceAmount)}'),
          if (_order!.preOrderRemainingAmount != null)
            _buildDetailRow('Remaining at Delivery', 'Rs. ${_currencyFormat.format(_order!.preOrderRemainingAmount)}'),
          if (_order!.preOrderPaymentMethodName != null)
            _buildDetailRow('Payment Mode', _order!.preOrderPaymentMethodName!),
          if (_order!.preOrderPaymentVerifiedBy != null)
            _buildDetailRow('Verified By', _order!.preOrderPaymentVerifiedBy!),
          if (_order!.preOrderPaymentRejectionReason != null)
            _buildDetailRow('Rejection Reason', _order!.preOrderPaymentRejectionReason!),
          const SizedBox(height: 12),
          // Action Buttons: View Screenshot, Approve, Reject
          Row(
            children: [
              if (hasProof) ...[
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.surfaceVariant,
                      foregroundColor: AppColors.textPrimary,
                    ),
                    onPressed: _openPaymentProofViewer,
                    icon: const Icon(Icons.image_search, size: 18, color: AppColors.primary),
                    label: const Text('View Proof'),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (status == 'PAYMENT_REVIEW_PENDING' || status == 'UNDER_REVIEW') ...[
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                    onPressed: _handleApprovePayment,
                    icon: const Icon(Icons.check, size: 18),
                    label: const Text('Approve'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                    onPressed: _handleRejectPayment,
                    icon: const Icon(Icons.close, size: 18),
                    label: const Text('Reject'),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  // 3. PostEx Shipping & Tracking Card
  Widget _buildPostExShippingCard(AuthService auth) {
    final hasTracking = _order!.trackingNumber != null && _order!.trackingNumber!.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.local_shipping_outlined, color: AppColors.primary, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'PostEx Courier & Shipping',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              if (hasTracking)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
                  ),
                  child: const Text(
                    'DISPATCHED',
                    style: TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.w700),
                  ),
                ),
            ],
          ),
          const Divider(color: AppColors.border, height: 22),
          if (hasTracking) ...[
            InkWell(
              onTap: () => _copyToClipboard(_order!.trackingNumber!, 'Tracking Number'),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Tracking Number', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  Row(
                    children: [
                      Text(
                        _order!.trackingNumber!,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.copy, size: 14, color: AppColors.textMuted),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            _buildDetailRow('Courier Partner', _order!.courier ?? 'PostEx'),
            const SizedBox(height: 12),
            // Actions: Print Label, Share Label, Track Live
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () => LabelService.printLabel(
                      context: context,
                      apiService: auth.apiService,
                      orderId: _order!.id,
                      trackingNumber: _order!.trackingNumber,
                    ),
                    icon: const Icon(Icons.print, size: 18),
                    label: const Text('Print Label'),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  onPressed: () => LabelService.shareLabel(
                    context: context,
                    apiService: auth.apiService,
                    orderId: _order!.id,
                    trackingNumber: _order!.trackingNumber,
                  ),
                  icon: const Icon(Icons.share, size: 18),
                  tooltip: 'Share Official PDF',
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  onPressed: _handleTrackPostExShipment,
                  icon: const Icon(Icons.my_location, size: 18),
                  tooltip: 'Track PostEx Live',
                ),
              ],
            ),
          ] else ...[
            const Text(
              'No PostEx shipment booked yet.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: _handleCreatePostExShipment,
              icon: const Icon(Icons.local_shipping, size: 18),
              label: const Text('Book PostEx Shipment'),
            ),
          ],
        ],
      ),
    );
  }

  // 4. WhatsApp Lifecycle Communication Card
  Widget _buildWhatsAppCard() {
    final confSent = _order!.confirmationWhatsAppSentAt != null;
    final trackSent = _order!.trackingWhatsAppSentAt != null;
    final delSent = _order!.deliveredWhatsAppSentAt != null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.chat_bubble_outline, color: Color(0xFF25D366), size: 20),
              SizedBox(width: 8),
              Text(
                'Customer WhatsApp Updates',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const Divider(color: AppColors.border, height: 22),
          // Order Confirmation WhatsApp Row
          _buildWhatsAppActionRow(
            title: 'Order Confirmation',
            isSent: confSent,
            sentAt: _order!.confirmationWhatsAppSentAt,
            onSend: () => _handleSendWhatsApp('CONFIRMATION'),
            canSend: _order!.status == 'CONFIRMED',
          ),
          const SizedBox(height: 8),
          // Tracking WhatsApp Row
          _buildWhatsAppActionRow(
            title: 'Tracking Info',
            isSent: trackSent,
            sentAt: _order!.trackingWhatsAppSentAt,
            onSend: () => _handleSendWhatsApp('TRACKING'),
            canSend: _order!.trackingNumber != null && _order!.trackingNumber!.isNotEmpty,
          ),
          const SizedBox(height: 8),
          // Delivery WhatsApp Row
          _buildWhatsAppActionRow(
            title: 'Delivery Confirmation',
            isSent: delSent,
            sentAt: _order!.deliveredWhatsAppSentAt,
            onSend: () => _handleSendWhatsApp('DELIVERED'),
            canSend: _order!.status == 'DELIVERED',
          ),
        ],
      ),
    );
  }

  Widget _buildWhatsAppActionRow({
    required String title,
    required bool isSent,
    DateTime? sentAt,
    required VoidCallback onSend,
    required bool canSend,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
            Text(
              isSent && sentAt != null
                  ? 'Sent ${_dateFormat.format(sentAt)}'
                  : canSend
                      ? 'Ready to send'
                      : 'Unavailable for current state',
              style: TextStyle(
                color: isSent ? AppColors.success : AppColors.textMuted,
                fontSize: 11,
              ),
            ),
          ],
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: isSent ? AppColors.surfaceVariant : const Color(0xFF25D366),
            foregroundColor: isSent ? AppColors.textSecondary : Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            minimumSize: Size.zero,
          ),
          onPressed: canSend ? onSend : null,
          child: Text(isSent ? 'Resend' : 'Send', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
        ),
      ],
    );
  }

  // 5. Customer Information & Stats Card
  Widget _buildCustomerCard() {
    final cust = _order!.customer;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.person_outline, color: AppColors.primary, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Customer Details',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              if (cust?.isVIP == true)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFD700).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.5)),
                  ),
                  child: const Text(
                    '⭐ VIP CUSTOMER',
                    style: TextStyle(color: Color(0xFFFFD700), fontSize: 10, fontWeight: FontWeight.w800),
                  ),
                ),
            ],
          ),
          const Divider(color: AppColors.border, height: 22),
          Text(
            _order!.customerName,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          InkWell(
            onTap: () => _copyToClipboard(_order!.customerPhone, 'Phone number'),
            child: Row(
              children: [
                const Icon(Icons.phone, size: 15, color: AppColors.accent),
                const SizedBox(width: 6),
                Text(
                  _order!.customerPhone,
                  style: const TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.copy, size: 13, color: AppColors.textMuted),
              ],
            ),
          ),
          if (_order!.customerEmail != null && _order!.customerEmail!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(_order!.customerEmail!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ],
          const SizedBox(height: 12),
          const Text(
            'Shipping Address',
            style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            '${_order!.shippingAddress}, ${_order!.shippingCity}, ${_order!.shippingProvince}',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
          ),
          if (cust != null) ...[
            const Divider(color: AppColors.border, height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    const Text('Total Orders', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    const SizedBox(height: 2),
                    Text(
                      '${cust.ordersCount}',
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                Column(
                  children: [
                    const Text('Lifetime Spent', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    const SizedBox(height: 2),
                    Text(
                      'Rs. ${_currencyFormat.format(cust.totalSpent)}',
                      style: const TextStyle(color: AppColors.primary, fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  // 6. Order Items Card
  Widget _buildItemsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.inventory_2_outlined, color: AppColors.primary, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Ordered Items',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              Text(
                '${_order!.items.length} item${_order!.items.length > 1 ? 's' : ''}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            ],
          ),
          const Divider(color: AppColors.border, height: 22),
          ..._order!.items.map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.checkroom, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.productTitle,
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                        if (item.variantInfo != null) ...[
                          const SizedBox(height: 2),
                          Text(item.variantInfo!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        ],
                        const SizedBox(height: 4),
                        Text(
                          'Qty: ${item.quantity} × Rs. ${_currencyFormat.format(item.unitPrice)}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    'Rs. ${_currencyFormat.format(item.subtotal)}',
                    style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // 7. Financial & Payment Summary Card
  Widget _buildFinancialSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.receipt_long_outlined, color: AppColors.primary, size: 20),
              SizedBox(width: 8),
              Text(
                'Financial & Payment Summary',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const Divider(color: AppColors.border, height: 22),
          _buildPriceRow('Subtotal', _order!.subtotal),
          if (_order!.discountAmount > 0)
            _buildPriceRow('Discount', -_order!.discountAmount, color: AppColors.success),
          if (_order!.couponCode != null && _order!.couponCode!.isNotEmpty)
            _buildDetailRow('Coupon Applied', _order!.couponCode!),
          _buildPriceRow('Shipping Fee', _order!.shippingFee),
          if (_order!.codCharges > 0) _buildPriceRow('COD Charges', _order!.codCharges),
          const Divider(color: AppColors.border, height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Amount', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800)),
              Text(
                'Rs. ${_currencyFormat.format(_order!.totalAmount)}',
                style: const TextStyle(color: AppColors.primary, fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ],
          ),
          if (_order!.isPreOrder) ...[
            const SizedBox(height: 6),
            _buildPriceRow('Advance Paid', _order!.amountPaid, color: AppColors.success),
            if (_order!.preOrderRemainingAmount != null)
              _buildPriceRow('Remaining Balance at Delivery', _order!.preOrderRemainingAmount!, color: AppColors.warning),
          ],
          const SizedBox(height: 10),
          _buildDetailRow('Payment Method', _order!.paymentMethod.replaceAll('_', ' ')),
        ],
      ),
    );
  }

  // 8. Activity Timeline Card
  Widget _buildTimelineCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.history, color: AppColors.primary, size: 20),
              SizedBox(width: 8),
              Text(
                'Activity & Audit Timeline',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const Divider(color: AppColors.border, height: 22),
          ..._order!.timeline.map((t) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.only(top: 6, right: 12),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _getStatusColor(t.status),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              t.status,
                              style: TextStyle(color: _getStatusColor(t.status), fontWeight: FontWeight.w700, fontSize: 13),
                            ),
                            Text(
                              _dateFormat.format(t.createdAt),
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                        if (t.note != null && t.note!.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(t.note!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // STICKY BOTTOM ACTION BAR (Ultra-fast one-thumb operations)
  Widget _buildStickyBottomActionBar(AuthService auth) {
    final hasTracking = _order!.trackingNumber != null && _order!.trackingNumber!.isNotEmpty;
    final isPreOrderPending = _order!.isPreOrder &&
        (_order!.preOrderPaymentStatus == 'PAYMENT_REVIEW_PENDING' || _order!.preOrderPaymentStatus == 'UNDER_REVIEW');

    return SafeArea(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(top: BorderSide(color: AppColors.border)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: _isActionProcessing
            ? const SizedBox(
                height: 48,
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
                ),
              )
            : Row(
                children: [
                  if (isPreOrderPending) ...[
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _openPaymentProofViewer,
                        icon: const Icon(Icons.shield_outlined, size: 20),
                        label: const Text('Review Payment Proof', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ] else if (_order!.status == 'PENDING') ...[
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _handleConfirmOrder,
                        icon: const Icon(Icons.check_circle, size: 20),
                        label: const Text('Confirm Order', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ] else if (!hasTracking && (_order!.status == 'CONFIRMED' || _order!.status == 'PACKING')) ...[
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _handleCreatePostExShipment,
                        icon: const Icon(Icons.local_shipping, size: 20),
                        label: const Text('Book PostEx Shipment', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ] else if (hasTracking) ...[
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => LabelService.printLabel(
                          context: context,
                          apiService: auth.apiService,
                          orderId: _order!.id,
                          trackingNumber: _order!.trackingNumber,
                        ),
                        icon: const Icon(Icons.print, size: 20),
                        label: const Text('Print PostEx Label', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ] else ...[
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _showStatusUpdateDialog,
                        icon: const Icon(Icons.edit_note, size: 20),
                        label: const Text('Update Status', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }

  Widget _buildPriceRow(String title, double amount, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          Text(
            'Rs. ${_currencyFormat.format(amount)}',
            style: TextStyle(color: color ?? AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
