import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../models/order.dart';
import '../models/admin_notification.dart';
import '../models/notification_payload.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';
import 'login_screen.dart';
import 'order_detail_screen.dart';
import 'order_list_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  static final NumberFormat _currencyFormat = NumberFormat('#,##0', 'en_US');
  static final DateFormat _dateFormat = DateFormat('MMM dd • hh:mm a');

  bool _isFetching = false;
  StreamSubscription<OrderNotificationPayload>? _notifSubscription;

  bool _isLoading = true;
  bool _isTestingPush = false;

  // Operational metrics
  int _todayOrders = 0;
  double _todayRevenue = 0.0;
  double _totalRevenue = 0.0;
  double _codPendingAmount = 0.0;

  int _pendingOrders = 0;
  int _awaitingConfirmation = 0;
  int _paymentProofsAwaitingReview = 0;
  int _confirmedOrders = 0;
  int _readyForShipment = 0;
  int _shipmentsCreated = 0;
  int _dispatchedOrders = 0;
  int _deliveredOrders = 0;
  int _cancelledOrders = 0;
  int _rtoOrders = 0;

  List<OrderModel> _recentOrders = [];
  List<AdminNotificationModel> _recentNotifications = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
    _listenToForegroundNotifications();
  }

  @override
  void dispose() {
    _notifSubscription?.cancel();
    super.dispose();
  }

  void _listenToForegroundNotifications() {
    final notifService = NotificationService();
    _notifSubscription = notifService.onForegroundNotification.listen((payload) {
      if (!mounted) return;

      // Show in-app banner for new order
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          duration: const Duration(seconds: 5),
          backgroundColor: AppColors.surface,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
          content: Row(
            children: [
              const Icon(Icons.notifications_active, color: AppColors.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      payload.title ?? '🛍️ New Order Received!',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    if (payload.body != null)
                      Text(
                        payload.body!,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
            ],
          ),
          action: SnackBarAction(
            label: 'OPEN',
            textColor: AppColors.primary,
            onPressed: () {
              if (payload.orderId != null) {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => OrderDetailScreen(orderId: payload.orderId!),
                  ),
                );
              }
            },
          ),
        ),
      );

      // Refresh dashboard orders
      _loadDashboardData();
    });
  }

  Future<void> _loadDashboardData() async {
    if (_isFetching) return;
    _isFetching = true;
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.fetchDashboardData();

    if (!mounted) return;

    if (res.isRevoked) {
      await auth.handleSessionRevocation();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Security Alert: This device has been revoked by an administrator.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (res.success && res.data != null) {
      final data = res.data!;
      final s = data.stats;
      setState(() {
        _todayOrders = s.todayOrders;
        _todayRevenue = s.todayRevenue;
        _totalRevenue = s.totalRevenue;
        _codPendingAmount = s.codPendingAmount;

        _pendingOrders = s.pendingOrders;
        _awaitingConfirmation = s.awaitingConfirmation;
        _paymentProofsAwaitingReview = s.paymentProofsAwaitingReview;
        _confirmedOrders = s.confirmedOrders;
        _readyForShipment = s.readyForShipment;
        _shipmentsCreated = s.shipmentsCreated;
        _dispatchedOrders = s.dispatchedOrders;
        _deliveredOrders = s.deliveredOrders;
        _cancelledOrders = s.cancelledOrders;
        _rtoOrders = s.rtoOrders;

        _recentOrders = data.recentOrders;
        _recentNotifications = data.recentNotifications;
        _isLoading = false;
        _isFetching = false;
      });
    } else {
      setState(() {
        _isLoading = false;
        _isFetching = false;
      });
      if (res.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.error!),
            backgroundColor: AppColors.error,
          ),
        );
      }
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

  Future<void> _handleTestPush() async {
    setState(() => _isTestingPush = true);
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.apiService.sendTestPushNotification();

    if (!mounted) return;
    setState(() => _isTestingPush = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          res.success
              ? 'Push notification dispatched! Check device status bar.'
              : res.error ?? 'Push dispatch failed',
        ),
        backgroundColor: res.success ? AppColors.success : AppColors.error,
      ),
    );
  }

  void _navigateToOrderList({
    String? status,
    String? paymentStatus,
    bool? isPreOrder,
    String? shipmentStatus,
  }) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => OrderListScreen(
          initialStatus: status,
          initialPaymentStatus: paymentStatus,
          initialPreOrder: isPreOrder,
          initialShipmentStatus: shipmentStatus,
        ),
      ),
    ).then((_) => _loadDashboardData());
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Row(
          children: [
            Text(
              'WearOMNIA',
              style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.5),
            ),
            SizedBox(width: 6),
            Text(
              'Ops',
              style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
            tooltip: 'Refresh Dashboard',
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            color: AppColors.surface,
            onSelected: (val) {
              if (val == 'test_push') {
                _handleTestPush();
              } else if (val == 'logout') {
                auth.logout();
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'test_push',
                child: Row(
                  children: [
                    const Icon(Icons.notifications_active, size: 18, color: AppColors.primary),
                    const SizedBox(width: 10),
                    Text(
                      _isTestingPush ? 'Sending...' : 'Test Push Notification',
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, size: 18, color: AppColors.error),
                    SizedBox(width: 10),
                    Text('Logout', style: TextStyle(color: AppColors.error, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              color: AppColors.primary,
              backgroundColor: AppColors.surface,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 1. TOP FINANCIAL & VOLUME BANNER
                    _buildKpiBanner(),
                    const SizedBox(height: 18),

                    // 2. OPERATIONS CENTER GRID (Section 1 of requirements)
                    const Text(
                      'Operational Pipeline',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildOperationalGrid(),
                    const SizedBox(height: 20),

                    // 3. RECENT NOTIFICATIONS SECTION
                    if (_recentNotifications.isNotEmpty) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Recent Notifications',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            '${_recentNotifications.length} alerts',
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _buildNotificationsList(),
                      const SizedBox(height: 20),
                    ],

                    // 4. RECENT ORDERS PREVIEW
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Recent Orders',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        TextButton(
                          onPressed: () => _navigateToOrderList(status: 'ALL'),
                          child: const Row(
                            children: [
                              Text('View All', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                              SizedBox(width: 4),
                              Icon(Icons.arrow_forward, size: 14, color: AppColors.primary),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    _buildRecentOrdersList(),
                  ],
                ),
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: () => _navigateToOrderList(status: 'ALL'),
        icon: const Icon(Icons.inventory_2_outlined),
        label: const Text('Manage Orders', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
    );
  }

  // 1. KPI Banner (Today's orders, revenue, total revenue, COD pending)
  Widget _buildKpiBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildKpiItem(
                  label: "Today's Orders",
                  value: '$_todayOrders',
                  icon: Icons.today,
                  iconColor: AppColors.primary,
                  onTap: () => _navigateToOrderList(status: 'ALL'),
                ),
              ),
              Container(width: 1, height: 44, color: AppColors.border),
              Expanded(
                child: _buildKpiItem(
                  label: "Today's Revenue",
                  value: 'Rs. ${_currencyFormat.format(_todayRevenue)}',
                  icon: Icons.payments_outlined,
                  iconColor: AppColors.success,
                ),
              ),
            ],
          ),
          const Divider(color: AppColors.border, height: 24),
          Row(
            children: [
              Expanded(
                child: _buildKpiItem(
                  label: 'Total Revenue',
                  value: 'Rs. ${_currencyFormat.format(_totalRevenue)}',
                  icon: Icons.account_balance_wallet_outlined,
                  iconColor: AppColors.accent,
                ),
              ),
              Container(width: 1, height: 44, color: AppColors.border),
              Expanded(
                child: _buildKpiItem(
                  label: 'COD Pending',
                  value: 'Rs. ${_currencyFormat.format(_codPendingAmount)}',
                  icon: Icons.local_atm_outlined,
                  iconColor: AppColors.warning,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKpiItem({
    required String label,
    required String value,
    required IconData icon,
    required Color iconColor,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 14, color: iconColor),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ),
    );
  }

  // 2. Operational Pipeline Grid
  Widget _buildOperationalGrid() {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.6,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _buildOperationCard(
          title: 'Pending Orders',
          count: _pendingOrders,
          color: AppColors.warning,
          icon: Icons.hourglass_top,
          onTap: () => _navigateToOrderList(status: 'PENDING'),
        ),
        _buildOperationCard(
          title: 'Payment Proofs',
          count: _paymentProofsAwaitingReview,
          color: _paymentProofsAwaitingReview > 0 ? AppColors.error : AppColors.info,
          icon: Icons.shield_outlined,
          highlight: _paymentProofsAwaitingReview > 0,
          onTap: () => _navigateToOrderList(paymentStatus: 'PAYMENT_REVIEW_PENDING', isPreOrder: true),
        ),
        _buildOperationCard(
          title: 'Awaiting Confirm',
          count: _awaitingConfirmation,
          color: AppColors.warning,
          icon: Icons.pending_actions,
          onTap: () => _navigateToOrderList(status: 'PENDING'),
        ),
        _buildOperationCard(
          title: 'Confirmed Orders',
          count: _confirmedOrders,
          color: AppColors.info,
          icon: Icons.check_circle_outline,
          onTap: () => _navigateToOrderList(status: 'CONFIRMED'),
        ),
        _buildOperationCard(
          title: 'Ready for PostEx',
          count: _readyForShipment,
          color: const Color(0xFF8B5CF6),
          icon: Icons.markunread_mailbox_outlined,
          onTap: () => _navigateToOrderList(status: 'CONFIRMED', shipmentStatus: 'UNSHIPPED'),
        ),
        _buildOperationCard(
          title: 'Shipments Created',
          count: _shipmentsCreated,
          color: AppColors.accent,
          icon: Icons.local_shipping_outlined,
          onTap: () => _navigateToOrderList(shipmentStatus: 'SHIPPED'),
        ),
        _buildOperationCard(
          title: 'Dispatched',
          count: _dispatchedOrders,
          color: AppColors.accent,
          icon: Icons.flight_takeoff,
          onTap: () => _navigateToOrderList(status: 'DISPATCHED'),
        ),
        _buildOperationCard(
          title: 'Delivered',
          count: _deliveredOrders,
          color: AppColors.success,
          icon: Icons.verified_outlined,
          onTap: () => _navigateToOrderList(status: 'DELIVERED'),
        ),
        _buildOperationCard(
          title: 'Cancelled',
          count: _cancelledOrders,
          color: AppColors.error,
          icon: Icons.cancel_outlined,
          onTap: () => _navigateToOrderList(status: 'CANCELLED'),
        ),
        _buildOperationCard(
          title: 'Returns / RTO',
          count: _rtoOrders,
          color: Colors.deepOrange,
          icon: Icons.assignment_return_outlined,
          onTap: () => _navigateToOrderList(status: 'RETURNED'),
        ),
      ],
    );
  }

  Widget _buildOperationCard({
    required String title,
    required int count,
    required Color color,
    required IconData icon,
    required VoidCallback onTap,
    bool highlight = false,
  }) {
    return Material(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: highlight ? color.withValues(alpha: 0.8) : AppColors.border,
              width: highlight ? 1.5 : 1.0,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, size: 16, color: color),
                  ),
                  if (highlight)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                    ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    title,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '$count',
                    style: TextStyle(
                      color: count > 0 ? AppColors.textPrimary : AppColors.textMuted,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 3. Recent Notifications List
  Widget _buildNotificationsList() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: _recentNotifications.map((n) {
          return InkWell(
            onTap: () {
              if (n.orderId != null) {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: n.orderId!)),
                ).then((_) => _loadDashboardData());
              }
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 2),
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.notifications_outlined, size: 14, color: AppColors.primary),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          n.title,
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
                        ),
                        if (n.message.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            n.message,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _dateFormat.format(n.createdAt),
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // 4. Recent Orders List
  Widget _buildRecentOrdersList() {
    if (_recentOrders.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: const Center(
          child: Text('No orders yet', style: TextStyle(color: AppColors.textMuted)),
        ),
      );
    }

    return Column(
      children: _recentOrders.map((order) {
        final statusColor = _getStatusColor(order.status);

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Material(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id, initialOrder: order)),
                ).then((_) => _loadDashboardData());
              },
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        order.isPreOrder ? Icons.access_time : Icons.local_shipping_outlined,
                        size: 20,
                        color: statusColor,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                '#${order.orderNumber}',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                              if (order.isPreOrder) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                  decoration: BoxDecoration(
                                    color: AppColors.accent.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    'PRE-ORDER',
                                    style: TextStyle(color: AppColors.accent, fontSize: 8, fontWeight: FontWeight.w800),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            order.customerName,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'Rs. ${_currencyFormat.format(order.totalAmount)}',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            order.status,
                            style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
