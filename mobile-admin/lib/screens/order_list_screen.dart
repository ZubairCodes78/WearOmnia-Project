import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../models/order.dart';
import '../services/auth_service.dart';
import '../services/label_service.dart';
import 'order_detail_screen.dart';

class OrderListScreen extends StatefulWidget {
  final String? initialStatus;
  final String? initialPaymentStatus;
  final bool? initialPreOrder;
  final String? initialShipmentStatus;

  const OrderListScreen({
    super.key,
    this.initialStatus,
    this.initialPaymentStatus,
    this.initialPreOrder,
    this.initialShipmentStatus,
  });

  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> {
  static final NumberFormat _currencyFormat = NumberFormat('#,##0', 'en_US');
  static final DateFormat _dateFormat = DateFormat('MMM dd • hh:mm a');

  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  int _activeRequestId = 0;

  List<OrderModel> _orders = [];
  bool _isLoading = true;
  String? _error;

  // Filters
  String _selectedStatus = 'ALL';
  String _selectedPaymentStatus = 'ALL';
  String _selectedPreOrder = 'ALL'; // 'ALL', 'PREORDER', 'COD'
  String _selectedShipment = 'ALL'; // 'ALL', 'SHIPPED', 'UNSHIPPED'
  String _sortBy = 'createdAt';
  String _sortOrder = 'desc';

  // Selection / Bulk Operations
  bool _isSelectionMode = false;
  final Set<String> _selectedOrderIds = {};
  bool _isBulkProcessing = false;

  final List<String> _statuses = [
    'ALL',
    'PENDING',
    'CONFIRMED',
    'PACKING',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialStatus != null && widget.initialStatus!.isNotEmpty) {
      _selectedStatus = widget.initialStatus!;
    }
    if (widget.initialPaymentStatus != null && widget.initialPaymentStatus!.isNotEmpty) {
      _selectedPaymentStatus = widget.initialPaymentStatus!;
    }
    if (widget.initialPreOrder != null) {
      _selectedPreOrder = widget.initialPreOrder! ? 'PREORDER' : 'COD';
    }
    if (widget.initialShipmentStatus != null && widget.initialShipmentStatus!.isNotEmpty) {
      _selectedShipment = widget.initialShipmentStatus!;
    }
    _loadOrders();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () {
      _loadOrders();
    });
  }

  Future<void> _loadOrders() async {
    final requestId = ++_activeRequestId;

    setState(() {
      if (_orders.isEmpty) {
        _isLoading = true;
      }
      _error = null;
    });

    final auth = Provider.of<AuthService>(context, listen: false);

    bool? isPreOrderParam;
    if (_selectedPreOrder == 'PREORDER') isPreOrderParam = true;
    if (_selectedPreOrder == 'COD') isPreOrderParam = false;

    final res = await auth.apiService.fetchOrders(
      status: _selectedStatus == 'ALL' ? null : _selectedStatus,
      search: _searchController.text.trim().isNotEmpty
          ? _searchController.text.trim()
          : null,
      paymentStatus: _selectedPaymentStatus == 'ALL' ? null : _selectedPaymentStatus,
      isPreOrder: isPreOrderParam,
      shipmentStatus: _selectedShipment == 'ALL' ? null : _selectedShipment,
      sortBy: _sortBy,
      sortOrder: _sortOrder,
      limit: 60,
    );

    if (!mounted || requestId != _activeRequestId) return;

    if (res.success && res.data != null) {
      setState(() {
        _orders = res.data!;
        _isLoading = false;
        // Clean up selected IDs not in new result
        _selectedOrderIds.removeWhere((id) => !_orders.any((o) => o.id == id));
      });
    } else {
      setState(() {
        _error = res.error ?? 'Failed to load orders';
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

  void _toggleSelection(String orderId) {
    setState(() {
      if (_selectedOrderIds.contains(orderId)) {
        _selectedOrderIds.remove(orderId);
        if (_selectedOrderIds.isEmpty) {
          _isSelectionMode = false;
        }
      } else {
        _selectedOrderIds.add(orderId);
        _isSelectionMode = true;
      }
    });
  }

  void _selectAll() {
    setState(() {
      if (_selectedOrderIds.length == _orders.length) {
        _selectedOrderIds.clear();
        _isSelectionMode = false;
      } else {
        _selectedOrderIds.addAll(_orders.map((o) => o.id));
        _isSelectionMode = true;
      }
    });
  }

  // Bulk Print PostEx Labels
  Future<void> _handleBulkPrintLabels() async {
    final eligibleOrders = _orders.where(
      (o) => _selectedOrderIds.contains(o.id) && o.trackingNumber != null && o.trackingNumber!.isNotEmpty,
    ).toList();

    if (eligibleOrders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('None of the selected orders have PostEx tracking numbers booked.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    final skippedCount = _selectedOrderIds.length - eligibleOrders.length;
    if (skippedCount > 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Printing ${eligibleOrders.length} labels. ($skippedCount skipped: no tracking number).'),
          duration: const Duration(seconds: 3),
        ),
      );
    }

    final auth = Provider.of<AuthService>(context, listen: false);
    await LabelService.printLabel(
      context: context,
      apiService: auth.apiService,
      orderIds: eligibleOrders.map((o) => o.id).toList(),
      filename: 'PostEx-Batch-${eligibleOrders.length}-Orders.pdf',
    );
  }

  // Bulk Confirm Orders
  Future<void> _handleBulkConfirm() async {
    final eligibleOrders = _orders.where(
      (o) => _selectedOrderIds.contains(o.id) && o.status == 'PENDING' &&
             (!o.isPreOrder || o.preOrderPaymentStatus == 'PAYMENT_APPROVED'),
    ).toList();

    if (eligibleOrders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No selected orders are eligible for confirmation.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Bulk Confirm Orders', style: TextStyle(color: AppColors.textPrimary)),
        content: Text(
          'Confirm ${eligibleOrders.length} selected orders? They will transition to CONFIRMED.',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('Confirm ${eligibleOrders.length} Orders'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isBulkProcessing = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    int successCount = 0;

    for (final order in eligibleOrders) {
      final res = await auth.apiService.confirmOrder(order.id);
      if (res.success) successCount++;
    }

    if (!mounted) return;
    setState(() {
      _isBulkProcessing = false;
      _selectedOrderIds.clear();
      _isSelectionMode = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$successCount of ${eligibleOrders.length} orders confirmed!'),
        backgroundColor: AppColors.success,
      ),
    );
    _loadOrders();
  }

  // Filter Bottom Sheet
  void _openFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Filter Orders',
                        style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                      TextButton(
                        onPressed: () {
                          setSheetState(() {
                            _selectedStatus = 'ALL';
                            _selectedPaymentStatus = 'ALL';
                            _selectedPreOrder = 'ALL';
                            _selectedShipment = 'ALL';
                            _sortBy = 'createdAt';
                            _sortOrder = 'desc';
                          });
                        },
                        child: const Text('Reset All'),
                      ),
                    ],
                  ),
                  const Divider(color: AppColors.border),
                  const SizedBox(height: 8),

                  // Order Type Filter
                  const Text('Order Type', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'ALL', label: Text('All')),
                      ButtonSegment(value: 'PREORDER', label: Text('Pre-Order')),
                      ButtonSegment(value: 'COD', label: Text('Standard COD')),
                    ],
                    selected: {_selectedPreOrder},
                    onSelectionChanged: (val) => setSheetState(() => _selectedPreOrder = val.first),
                  ),
                  const SizedBox(height: 14),

                  // Payment Status Filter
                  const Text('Payment Verification', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedPaymentStatus,
                    dropdownColor: AppColors.surfaceVariant,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Pre-order Payment Status'),
                    items: const [
                      DropdownMenuItem(value: 'ALL', child: Text('All Payment States')),
                      DropdownMenuItem(value: 'PAYMENT_REVIEW_PENDING', child: Text('Review Pending')),
                      DropdownMenuItem(value: 'PAYMENT_APPROVED', child: Text('Payment Approved')),
                      DropdownMenuItem(value: 'PAYMENT_REJECTED', child: Text('Payment Rejected')),
                    ],
                    onChanged: (val) => setSheetState(() => _selectedPaymentStatus = val ?? 'ALL'),
                  ),
                  const SizedBox(height: 14),

                  // Shipment Filter
                  const Text('Shipment / Tracking', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'ALL', label: Text('All')),
                      ButtonSegment(value: 'SHIPPED', label: Text('Shipped')),
                      ButtonSegment(value: 'UNSHIPPED', label: Text('Unshipped')),
                    ],
                    selected: {_selectedShipment},
                    onSelectionChanged: (val) => setSheetState(() => _selectedShipment = val.first),
                  ),
                  const SizedBox(height: 14),

                  // Sort Options
                  const Text('Sort By', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: '$_sortBy:$_sortOrder',
                    dropdownColor: AppColors.surfaceVariant,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Order Sequence'),
                    items: const [
                      DropdownMenuItem(value: 'createdAt:desc', child: Text('Date: Newest First')),
                      DropdownMenuItem(value: 'createdAt:asc', child: Text('Date: Oldest First')),
                      DropdownMenuItem(value: 'totalAmount:desc', child: Text('Amount: High to Low')),
                      DropdownMenuItem(value: 'totalAmount:asc', child: Text('Amount: Low to High')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        final parts = val.split(':');
                        setSheetState(() {
                          _sortBy = parts[0];
                          _sortOrder = parts[1];
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      _loadOrders();
                    },
                    child: const Text('Apply Filters'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasActiveFilter = _selectedPaymentStatus != 'ALL' ||
        _selectedPreOrder != 'ALL' ||
        _selectedShipment != 'ALL' ||
        _sortBy != 'createdAt';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_isSelectionMode ? '${_selectedOrderIds.length} Selected' : 'Orders Management'),
        leading: _isSelectionMode
            ? IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => setState(() {
                  _isSelectionMode = false;
                  _selectedOrderIds.clear();
                }),
              )
            : null,
        actions: [
          if (_isSelectionMode) ...[
            IconButton(
              icon: Icon(
                _selectedOrderIds.length == _orders.length ? Icons.select_all : Icons.checklist,
              ),
              onPressed: _selectAll,
              tooltip: 'Select All',
            ),
          ] else ...[
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.tune),
                  onPressed: _openFilterSheet,
                  tooltip: 'Filters',
                ),
                if (hasActiveFilter)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                    ),
                  ),
              ],
            ),
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadOrders,
              tooltip: 'Refresh',
            ),
          ],
        ],
      ),
      body: Column(
        children: [
          // 1. Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: AppColors.textPrimary),
              onChanged: _onSearchChanged,
              onSubmitted: (_) => _loadOrders(),
              decoration: InputDecoration(
                hintText: 'Search order #, customer, phone, city, tracking...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppColors.textMuted),
                        onPressed: () {
                          _searchController.clear();
                          _loadOrders();
                        },
                      )
                    : null,
              ),
            ),
          ),

          // 2. Status Chips Bar
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _statuses.length,
              itemBuilder: (context, index) {
                final status = _statuses[index];
                final isSelected = _selectedStatus == status;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(
                      status == 'ALL' ? 'All Orders' : status,
                      style: TextStyle(
                        color: isSelected ? Colors.white : AppColors.textSecondary,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        fontSize: 12,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    backgroundColor: AppColors.surface,
                    side: BorderSide(
                      color: isSelected ? AppColors.primary : AppColors.border,
                    ),
                    onSelected: (selected) {
                      setState(() {
                        _selectedStatus = status;
                      });
                      _loadOrders();
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // 3. Orders List View
          Expanded(
            child: _isLoading
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
                              ElevatedButton(onPressed: _loadOrders, child: const Text('Retry')),
                            ],
                          ),
                        ),
                      )
                    : _orders.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.inventory_2_outlined, size: 54, color: AppColors.textMuted),
                                const SizedBox(height: 12),
                                const Text(
                                  'No orders found matching criteria',
                                  style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() {
                                      _selectedStatus = 'ALL';
                                      _selectedPaymentStatus = 'ALL';
                                      _selectedPreOrder = 'ALL';
                                      _selectedShipment = 'ALL';
                                    });
                                    _loadOrders();
                                  },
                                  child: const Text('Reset Filters'),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadOrders,
                            color: AppColors.primary,
                            backgroundColor: AppColors.surface,
                            child: ListView.builder(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.fromLTRB(16, 4, 16, 90),
                              itemCount: _orders.length,
                              itemBuilder: (context, index) {
                                final order = _orders[index];
                                final isSelected = _selectedOrderIds.contains(order.id);

                                return _buildOrderCard(order, isSelected);
                              },
                            ),
                          ),
          ),
        ],
      ),
      // Sticky Bulk Operations Bottom Bar
      bottomNavigationBar: _isSelectionMode ? _buildBulkActionBar() : null,
    );
  }

  Widget _buildOrderCard(OrderModel order, bool isSelected) {
    final statusColor = _getStatusColor(order.status);
    final isPreOrderReviewPending = order.isPreOrder &&
        (order.preOrderPaymentStatus == 'PAYMENT_REVIEW_PENDING' || order.preOrderPaymentStatus == 'UNDER_REVIEW');

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: isSelected ? AppColors.surfaceVariant : AppColors.card,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            if (_isSelectionMode) {
              _toggleSelection(order.id);
            } else {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => OrderDetailScreen(orderId: order.id, initialOrder: order),
                ),
              ).then((_) => _loadOrders());
            }
          },
          onLongPress: () => _toggleSelection(order.id),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected
                    ? AppColors.primary
                    : isPreOrderReviewPending
                        ? AppColors.warning.withValues(alpha: 0.6)
                        : AppColors.border,
                width: isSelected || isPreOrderReviewPending ? 1.5 : 1.0,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Checkbox / Order #, Badges, Amount
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        if (_isSelectionMode) ...[
                          Checkbox(
                            value: isSelected,
                            activeColor: AppColors.primary,
                            onChanged: (_) => _toggleSelection(order.id),
                          ),
                        ],
                        Text(
                          '#${order.orderNumber}',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (order.isPreOrder)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.accent.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'PRE-ORDER',
                              style: TextStyle(color: AppColors.accent, fontSize: 9, fontWeight: FontWeight.w800),
                            ),
                          ),
                      ],
                    ),
                    Text(
                      'Rs. ${_currencyFormat.format(order.totalAmount)}',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Customer info & City
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      order.customerName,
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      order.shippingCity,
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 4),

                // Tracking / Action / Date Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            order.status,
                            style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ),
                        if (order.trackingNumber != null && order.trackingNumber!.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.success.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.local_shipping, size: 10, color: AppColors.success),
                                const SizedBox(width: 3),
                                Text(
                                  order.trackingNumber!,
                                  style: const TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          ),
                        ],
                        if (isPreOrderReviewPending) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.warning.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'Proof Pending',
                              style: TextStyle(color: AppColors.warning, fontSize: 10, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      _dateFormat.format(order.createdAt),
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Bulk Operations Bottom Action Bar
  Widget _buildBulkActionBar() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(top: BorderSide(color: AppColors.border)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.4),
              blurRadius: 12,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: _isBulkProcessing
            ? const SizedBox(
                height: 48,
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
                ),
              )
            : Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: _selectedOrderIds.isNotEmpty ? _handleBulkPrintLabels : null,
                      icon: const Icon(Icons.print, size: 18),
                      label: const Text('Print Labels'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: _selectedOrderIds.isNotEmpty ? _handleBulkConfirm : null,
                      icon: const Icon(Icons.check_circle, size: 18),
                      label: const Text('Bulk Confirm'),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
