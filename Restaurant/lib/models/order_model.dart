class Order {
  final String id;
  final String backendId;
  final String customerName;
  final String orderName;
  final int quantity;
  final String notes;
  String status;
  final double totalAmount;
  final double? restaurantEarning;
  String? riderName;
  String? riderId;
  String? riderPhone;
  String? pickupOtp;
  final List<dynamic> items;
  final String orderType;
  final String? pickupTime;
  final DateTime? createdAt;
  final String address;
  bool customerArrived;
  DateTime? customerArrivedAt;
  int? prepTimeMinutes;
  int bufferTimeMinutes;
  String? bufferReason;
  String? pickupSlot;
  String? prepNote;
  int cancellationWindowMinutes;
  int gracePeriodMinutes;
  DateTime? readyAt;
  DateTime? cancelledAt;
  String? cancellationReason;

  Order({
    required this.id,
    required this.backendId,
    required this.customerName,
    required this.orderName,
    required this.quantity,
    this.notes = '',
    this.status = 'Pending',
    required this.totalAmount,
    this.restaurantEarning,
    this.riderName,
    this.riderId,
    this.riderPhone,
    this.pickupOtp,
    this.items = const [],
    this.orderType = 'delivery',
    this.pickupTime,
    this.createdAt,
    this.address = '13 Amsterdam st',
    this.customerArrived = false,
    this.customerArrivedAt,
    this.prepTimeMinutes = 15,
    this.bufferTimeMinutes = 0,
    this.bufferReason,
    this.pickupSlot,
    this.prepNote,
    this.cancellationWindowMinutes = 5,
    this.gracePeriodMinutes = 15,
    this.readyAt,
    this.cancelledAt,
    this.cancellationReason,
  });

  int get totalEstimatedPrepMinutes => (prepTimeMinutes ?? 15) + bufferTimeMinutes;

  bool get isSelfPickup => orderType.toLowerCase() == 'pickup';

  bool get isWithinCancellationWindow {
    if (createdAt == null) return true;
    final diff = DateTime.now().difference(createdAt!).inMinutes;
    return diff < cancellationWindowMinutes;
  }

  int get remainingCancellationSeconds {
    if (createdAt == null) return cancellationWindowMinutes * 60;
    final diff = DateTime.now().difference(createdAt!).inSeconds;
    final totalSec = cancellationWindowMinutes * 60;
    final rem = totalSec - diff;
    return rem > 0 ? rem : 0;
  }

  bool get isWithinGracePeriod {
    final start = readyAt ?? createdAt;
    if (start == null) return true;
    final diff = DateTime.now().difference(start).inMinutes;
    return diff < gracePeriodMinutes;
  }

  int get remainingGraceSeconds {
    final start = readyAt ?? createdAt;
    if (start == null) return gracePeriodMinutes * 60;
    final diff = DateTime.now().difference(start).inSeconds;
    final totalSec = gracePeriodMinutes * 60;
    final rem = totalSec - diff;
    return rem > 0 ? rem : 0;
  }

  factory Order.fromJson(Map<String, dynamic> json) {
    String cName = 'Unknown Customer';
    if (json['customer'] != null && json['customer']['name'] != null) {
      cName = json['customer']['name'];
    }

    String oName = 'Items';
    int oQty = 0;
    List<dynamic> parsedItems = [];
    if (json['items'] != null && (json['items'] as List).isNotEmpty) {
      parsedItems = json['items'] as List<dynamic>;
      oName = json['items'][0]['name'] ?? 'Item';
      oQty = json['items'][0]['qty'] ?? 1;
      if ((json['items'] as List).length > 1) {
        oName += ' + ${(json['items'] as List).length - 1} more';
      }
    }

    String parsedStatus = 'Pending';
    if (json['status'] == 'preparing') {
      parsedStatus = 'Preparing';
    } else if (json['status'] == 'ready') {
      if (json['deliveryStatus'] == 'driver_not_found') {
        parsedStatus = 'Rider Not Found';
      } else {
        parsedStatus = 'Assigning Rider';
      }
    } else if (json['status'] == 'cancelled') {
      parsedStatus = 'Cancelled';
    } else if (json['status'] == 'failed') {
      parsedStatus = 'Failed';
    } else if (json['status'] == 'refunded') {
      parsedStatus = 'Refunded';
    } else if (json['status'] == 'picked_up') {
      parsedStatus = 'Picked Up';
    } else if (json['status'] == 'delivered') {
      parsedStatus = 'Delivered';
    }
    
    if (json['deliveryStatus'] == 'accepted' || json['deliveryStatus'] == 'assigned' || json['deliveryStatus'] == 'reached_store') {
      parsedStatus = 'Rider Assigned';
    } else if (json['deliveryStatus'] == 'picked_up' && parsedStatus != 'Delivered') {
      parsedStatus = 'Picked Up';
    } else if (json['deliveryStatus'] == 'delivered') {
      parsedStatus = 'Delivered';
    }

    if (json['orderType'] == 'pickup' && json['status'] == 'ready') {
      parsedStatus = 'Ready for Pickup';
    }

    String? parsedRiderName;
    String? parsedRiderId;
    String? parsedRiderPhone;
    if (json['assignedDriver'] != null) {
      parsedRiderName = json['assignedDriver']['name'];
      parsedRiderId = json['assignedDriver']['riderId'] ?? '#RID-${json['assignedDriver']['_id']?.toString().substring(0, 4)}';
      parsedRiderPhone = json['assignedDriver']['phone'];
    }

    return Order(
      id: json['orderNumber']?.toString() ?? 'N/A',
      backendId: json['_id'],
      customerName: cName,
      orderName: oName,
      quantity: oQty,
      status: parsedStatus,
      totalAmount: (json['payableAmount'] ?? json['totalAmount'] ?? 0.0).toDouble(),
      restaurantEarning: (json['restaurantEarnings'] as num?)?.toDouble(),
      pickupOtp: json['pickupOtp']?.toString(),
      riderName: parsedRiderName,
      riderId: parsedRiderId,
      riderPhone: parsedRiderPhone,
      items: parsedItems,
      orderType: json['orderType']?.toString() ?? 'delivery',
      pickupTime: json['pickupTime']?.toString(),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}
