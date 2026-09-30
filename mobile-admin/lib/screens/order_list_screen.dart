import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../models/order.dart';
import '../services/auth_service.dart';
import 'order_detail_screen.dart';

class OrderListScreen extends StatefulWidget {
  final String? initialStatus;

  const OrderListScreen({super.key, this.initialStatus});

  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<OrderModel> _orders = [];
  bool _isLoading = true;
  String? _error;
  String _selectedStatus = 'ALL';

  final List<String> _statuses = [
    'ALL',
    'PENDING',
    'CONFIRMED',
    'PACKING',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialStatus != null && widget.initialStatus!.isNotEmpty) {
      _selectedStatus = widget.initialStatus!;
    }
    _loadOrders();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.fetchOrders(
      status: _selectedStatus == 'ALL' ? null : _selectedStatus,
      search: _searchController.text.trim().isNotEmpty
          ? _searchController.text.trim()
          : null,
      limit: 50,
    );

    if (!mounted) return;

    if (res.success && res.data != null) {
      setState(() {
        _orders = res.data!;
        _isLoading = false;
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

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat('#,##0', 'en_US');
    final dateFormat = DateFormat('MMM dd, hh:mm a');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Orders Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
          ),
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
              onSubmitted: (_) => _loadOrders(),
              decoration: InputDecoration(
                hintText: 'Search order #, customer, phone, city...',
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
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ),

          // 2. Filter Status Chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: _statuses.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final st = _statuses[idx];
                final isSelected = _selectedStatus == st;
                return ChoiceChip(
                  label: Text(st),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.surfaceVariant,
                  labelStyle: TextStyle(
                    color: isSelected ? AppColors.onPrimary : AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() => _selectedStatus = st);
                      _loadOrders();
                    }
                  },
                );
              },
            ),
          ),

          const SizedBox(height: 6),

          // 3. Orders List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.error_outline,
                                  size: 44, color: AppColors.error),
                              const SizedBox(height: 10),
                              Text(
                                _error!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: AppColors.textSecondary),
                              ),
                              const SizedBox(height: 14),
                              ElevatedButton(
                                onPressed: _loadOrders,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _orders.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.inbox_outlined,
                                    size: 54, color: AppColors.textMuted),
                                const SizedBox(height: 12),
                                Text(
                                  'No ${_selectedStatus == 'ALL' ? '' : _selectedStatus} orders found',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadOrders,
                            color: AppColors.primary,
                            backgroundColor: AppColors.surface,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _orders.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final order = _orders[index];
                                final statusColor = _getStatusColor(order.status);

                                return Card(
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(14),
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) =>
                                              OrderDetailScreen(orderId: order.id),
                                        ),
                                      ).then((_) => _loadOrders());
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                '#${order.orderNumber}',
                                                style: const TextStyle(
                                                  color: AppColors.textPrimary,
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 16,
                                                ),
                                              ),
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: statusColor.withValues(
                                                      alpha: 0.16),
                                                  borderRadius:
                                                      BorderRadius.circular(16),
                                                  border: Border.all(
                                                    color: statusColor.withValues(
                                                        alpha: 0.35),
                                                  ),
                                                ),
                                                child: Text(
                                                  order.status,
                                                  style: TextStyle(
                                                    color: statusColor,
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              const Icon(Icons.person,
                                                  size: 14, color: AppColors.textMuted),
                                              const SizedBox(width: 6),
                                              Text(
                                                order.customerName,
                                                style: const TextStyle(
                                                  color: AppColors.textSecondary,
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              const Icon(Icons.location_on,
                                                  size: 14, color: AppColors.textMuted),
                                              const SizedBox(width: 4),
                                              Text(
                                                order.shippingCity,
                                                style: const TextStyle(
                                                  color: AppColors.textMuted,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const Divider(
                                              color: AppColors.border, height: 20),
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                dateFormat.format(order.createdAt),
                                                style: const TextStyle(
                                                  color: AppColors.textMuted,
                                                  fontSize: 12,
                                                ),
                                              ),
                                              Text(
                                                'Rs. ${currencyFormat.format(order.totalAmount)}',
                                                style: const TextStyle(
                                                  color: AppColors.primary,
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 15,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
