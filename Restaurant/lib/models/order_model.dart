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
    if (json['customer'] != null && json['customer'] is Map && json['customer']['name'] != null) {
      cName = json['customer']['name'].toString();
    }

    String oName = 'Items';
    int oQty = 0;
    List<dynamic> parsedItems = [];
    if (json['items'] != null && json['items'] is List && (json['items'] as List).isNotEmpty) {
      parsedItems = json['items'] as List<dynamic>;
      if (parsedItems.isNotEmpty && parsedItems[0] is Map) {
        oName = parsedItems[0]['name'] ?? 'Item';
        oQty = parsedItems[0]['qty'] ?? parsedItems[0]['quantity'] ?? 1;
      }
      if (parsedItems.length > 1) {
        oName += ' + ${parsedItems.length - 1} more';
      }
    }

    String parsedStatus = 'Pending';
    final rawStatus = json['status']?.toString().toLowerCase();
    final rawDeliveryStatus = json['deliveryStatus']?.toString().toLowerCase();

    if (rawStatus == 'preparing') {
      parsedStatus = 'Preparing';
    } else if (rawStatus == 'ready') {
      if (rawDeliveryStatus == 'driver_not_found') {
        parsedStatus = 'Rider Not Found';
      } else {
        parsedStatus = 'Assigning Rider';
      }
    } else if (rawStatus == 'cancelled') {
      parsedStatus = 'Cancelled';
    } else if (rawStatus == 'failed') {
      parsedStatus = 'Failed';
    } else if (rawStatus == 'refunded') {
      parsedStatus = 'Refunded';
    } else if (rawStatus == 'picked_up') {
      parsedStatus = 'Picked Up';
    } else if (rawStatus == 'delivered') {
      parsedStatus = 'Delivered';
    }
    
    if (rawDeliveryStatus == 'accepted' || rawDeliveryStatus == 'assigned' || rawDeliveryStatus == 'reached_store') {
      parsedStatus = 'Rider Assigned';
    } else if (rawDeliveryStatus == 'picked_up' && parsedStatus != 'Delivered') {
      parsedStatus = 'Picked Up';
    } else if (rawDeliveryStatus == 'delivered') {
      parsedStatus = 'Delivered';
    }

    if (json['orderType']?.toString().toLowerCase() == 'pickup' && rawStatus == 'ready') {
      parsedStatus = 'Ready for Pickup';
    }

    String? parsedRiderName;
    String? parsedRiderId;
    String? parsedRiderPhone;
    if (json['assignedDriver'] != null && json['assignedDriver'] is Map) {
      parsedRiderName = json['assignedDriver']['name']?.toString();
      parsedRiderId = json['assignedDriver']['riderId']?.toString() ?? '#RID-${json['assignedDriver']['_id']?.toString().substring(0, 4)}';
      parsedRiderPhone = json['assignedDriver']['phone']?.toString();
    }

    double parsedAmount = 0.0;
    if (json['payableAmount'] != null) {
      parsedAmount = double.tryParse(json['payableAmount'].toString()) ?? 0.0;
    } else if (json['totalAmount'] != null) {
      parsedAmount = double.tryParse(json['totalAmount'].toString()) ?? 0.0;
    }

    double? parsedEarnings;
    if (json['restaurantEarnings'] != null) {
      parsedEarnings = double.tryParse(json['restaurantEarnings'].toString());
    }

    String parsedAddress = 'Indore, MP';
    if (json['deliveryAddress'] != null) {
      if (json['deliveryAddress'] is Map) {
        parsedAddress = json['deliveryAddress']['address'] ?? json['deliveryAddress']['street'] ?? json['deliveryAddress']['formattedAddress'] ?? 'Indore, MP';
      } else {
        parsedAddress = json['deliveryAddress'].toString();
      }
    } else if (json['address'] != null) {
      parsedAddress = json['address'].toString();
    }

    return Order(
      id: json['orderNumber']?.toString() ?? json['_id']?.toString() ?? 'N/A',
      backendId: json['_id']?.toString() ?? '',
      customerName: cName,
      orderName: oName,
      quantity: oQty > 0 ? oQty : 1,
      status: parsedStatus,
      totalAmount: parsedAmount,
      restaurantEarning: parsedEarnings,
      pickupOtp: json['pickupOtp']?.toString() ?? json['pickupOTP']?.toString(),
      riderName: parsedRiderName,
      riderId: parsedRiderId,
      riderPhone: parsedRiderPhone,
      items: parsedItems,
      orderType: json['orderType']?.toString() ?? 'delivery',
      pickupTime: json['pickupTime']?.toString(),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      address: parsedAddress,
    );
  }
}
