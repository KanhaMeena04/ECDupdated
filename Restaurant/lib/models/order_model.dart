class Order {
  final String id;
  final String backendId;
  final String customerName;
  final String orderName;
  final int quantity;
  final String notes;
  String status;
  final double totalAmount;
  final double itemTotal;
  final double packagingFee;
  final double deliveryFee;
  final double platformFee;
  final double tax;
  final double discount;
  final double? restaurantEarning;
  final String? customerId;
  String? riderName;
  String? riderId;
  String? riderPhone;
  String? pickupOtp;
  final List<dynamic> items;
  final String orderType;
  final String? pickupTime;
  DateTime? createdAt;
  final String address;
  bool customerArrived;
  DateTime? customerArrivedAt;
  int? prepTimeMinutes;
  int bufferTimeMinutes;
  String? bufferReason;
  String? pickupSlot;
  String? prepNote;
  int cancellationWindowMinutes;
  DateTime? cancellationWindowExpiresAt;
  int gracePeriodMinutes;
  DateTime? riderAssignedAt;
  DateTime? riderGracePeriodExpiresAt;
  DateTime? readyAt;
  DateTime? cancelledAt;
  String? cancellationReason;
  final String paymentMethod;

  Order({
    required this.id,
    required this.backendId,
    required this.customerName,
    required this.orderName,
    required this.quantity,
    this.notes = '',
    this.status = 'Pending',
    required this.totalAmount,
    this.itemTotal = 0.0,
    this.packagingFee = 0.0,
    this.deliveryFee = 0.0,
    this.platformFee = 0.0,
    this.tax = 0.0,
    this.discount = 0.0,
    this.restaurantEarning,
    this.customerId,
    this.riderName,
    this.riderId,
    this.riderPhone,
    this.pickupOtp,
    this.items = const [],
    this.orderType = 'delivery',
    this.paymentMethod = 'Online Payment',
    this.pickupTime,
    this.createdAt,
    this.address = '',
    this.customerArrived = false,
    this.customerArrivedAt,
    this.prepTimeMinutes = 15,
    this.bufferTimeMinutes = 0,
    this.bufferReason,
    this.pickupSlot,
    this.prepNote,
    this.cancellationWindowMinutes = 5,
    this.cancellationWindowExpiresAt,
    this.gracePeriodMinutes = 15,
    this.riderAssignedAt,
    this.riderGracePeriodExpiresAt,
    this.readyAt,
    this.cancelledAt,
    this.cancellationReason,
  });

  int get totalEstimatedPrepMinutes => (prepTimeMinutes ?? 15) + bufferTimeMinutes;

  bool get isSelfPickup => orderType.toLowerCase() == 'pickup' || orderType.toLowerCase() == 'self_pickup';

  bool get isWithinCancellationWindow => remainingCancellationSeconds > 0;

  int get remainingCancellationSeconds {
    final now = DateTime.now();
    if (cancellationWindowExpiresAt != null) {
      final rem = cancellationWindowExpiresAt!.difference(now).inSeconds;
      return rem > 0 ? rem : 0;
    }
    if (createdAt != null) {
      final totalSec = cancellationWindowMinutes * 60;
      final elapsed = now.difference(createdAt!).inSeconds;
      final rem = totalSec - elapsed;
      return rem > 0 ? rem : 0;
    }
    return cancellationWindowMinutes * 60;
  }

  bool get isWithinGracePeriod => remainingGraceSeconds > 0;

  int get remainingGraceSeconds {
    final now = DateTime.now();
    if (riderGracePeriodExpiresAt != null) {
      final rem = riderGracePeriodExpiresAt!.difference(now).inSeconds;
      return rem > 0 ? rem : 0;
    }
    final start = riderAssignedAt ?? readyAt ?? createdAt;
    if (start != null) {
      final totalSec = gracePeriodMinutes * 60;
      final elapsed = now.difference(start).inSeconds;
      final rem = totalSec - elapsed;
      return rem > 0 ? rem : 0;
    }
    return gracePeriodMinutes * 60;
  }

  factory Order.fromJson(Map<String, dynamic> json) {
    String cName = 'Customer';
    if (json['customer'] != null && json['customer'] is Map && json['customer']['name'] != null) {
      cName = json['customer']['name'].toString();
    }

    String oName = 'Items';
    int oQty = 0;
    List<dynamic> parsedItems = [];
    if (json['items'] != null && json['items'] is List && (json['items'] as List).isNotEmpty) {
      final rawList = json['items'] as List<dynamic>;
      parsedItems = rawList.map((item) {
        if (item is Map<String, dynamic>) {
          final prod = item['product'] is Map ? item['product'] as Map<String, dynamic> : {};
          return {
            'name': item['name']?.toString() ?? prod['name']?.toString() ?? 'Food Item',
            'image': item['image']?.toString() ?? prod['image']?.toString() ?? '',
            'price': (item['price'] as num?)?.toDouble() ?? (prod['price'] as num?)?.toDouble() ?? 0.0,
            'quantity': (item['quantity'] as num? ?? item['qty'] as num? ?? 1).toInt(),
            'variant': item['variant']?.toString() ?? item['variation']?['name']?.toString() ?? 'Standard',
          };
        }
        return item;
      }).toList();

      if (parsedItems.isNotEmpty && parsedItems[0] is Map) {
        oName = parsedItems[0]['name']?.toString() ?? 'Food Item';
        oQty = (parsedItems[0]['quantity'] as num? ?? 1).toInt();
      }
      if (parsedItems.length > 1) {
        oName += ' + ${parsedItems.length - 1} more';
      }
    }

    String? parsedRiderName;
    String? parsedRiderId;
    String? parsedRiderPhone;
    if (json['assignedDriver'] != null && json['assignedDriver'] is Map) {
      parsedRiderName = json['assignedDriver']['name']?.toString();
      parsedRiderId = json['assignedDriver']['riderId']?.toString() ?? json['assignedDriver']['_id']?.toString();
      parsedRiderPhone = json['assignedDriver']['phone']?.toString() ?? json['assignedDriver']['mobile']?.toString();
    } else if (json['rider'] != null) {
      if (json['rider'] is Map) {
        final rMap = json['rider'] as Map;
        final uMap = rMap['user'] is Map ? rMap['user'] as Map : {};
        parsedRiderName = uMap['name']?.toString() ?? rMap['name']?.toString() ?? rMap['riderName']?.toString();
        parsedRiderPhone = uMap['mobile']?.toString() ?? uMap['phone']?.toString() ?? rMap['phone']?.toString() ?? rMap['mobile']?.toString();
        parsedRiderId = rMap['_id']?.toString() ?? rMap['id']?.toString();
      } else {
        parsedRiderId = json['rider'].toString();
      }
    }

    if (json['riderName'] != null && (parsedRiderName == null || parsedRiderName.isEmpty)) {
      parsedRiderName = json['riderName'].toString();
    }
    if (json['riderPhone'] != null && (parsedRiderPhone == null || parsedRiderPhone.isEmpty)) {
      parsedRiderPhone = json['riderPhone'].toString();
    }
    if (json['riderId'] != null && (parsedRiderId == null || parsedRiderId.isEmpty)) {
      parsedRiderId = json['riderId'].toString();
    }

    String parsedStatus = 'Placed';
    final rawStatus = json['status']?.toString().toLowerCase();
    final rawDeliveryStatus = json['deliveryStatus']?.toString().toLowerCase();

    if (rawStatus == 'assigned' || rawStatus == 'rider_assigned' || rawStatus == 'rider_accepted' || rawStatus == 'reached_restaurant' || rawStatus == 'reached_store' || rawDeliveryStatus == 'accepted' || rawDeliveryStatus == 'assigned' || rawDeliveryStatus == 'reached_store') {
      parsedStatus = 'Rider Assigned';
    } else if (rawStatus == 'placed' || rawStatus == 'pending' || rawStatus == 'confirmed') {
      parsedStatus = 'Placed';
    } else if (rawStatus == 'preparing') {
      parsedStatus = 'Preparing';
    } else if (rawStatus == 'ready') {
      if (rawDeliveryStatus == 'driver_not_found') {
        parsedStatus = 'Rider Not Found';
      } else if (parsedRiderId != null || parsedRiderName != null) {
        parsedStatus = 'Rider Assigned';
      } else {
        parsedStatus = 'Ready';
      }
    } else if (rawStatus == 'cancelled') {
      parsedStatus = 'Cancelled';
    } else if (rawStatus == 'failed') {
      parsedStatus = 'Failed';
    } else if (rawStatus == 'refunded') {
      parsedStatus = 'Refunded';
    } else if (rawStatus == 'picked_up' || rawStatus == 'picked up' || rawStatus == 'out_for_delivery' || rawStatus == 'out for delivery' || rawStatus == 'on_the_way' || rawStatus == 'on the way' || rawStatus == 'handed_over' || rawStatus == 'handed over' || rawStatus == 'handovered') {
      parsedStatus = 'Picked Up';
    } else if (rawStatus == 'delivered' || rawStatus == 'completed') {
      parsedStatus = 'Delivered';
    }
    
    if ((parsedRiderId != null || parsedRiderName != null) && parsedStatus != 'Picked Up' && parsedStatus != 'Delivered' && parsedStatus != 'Cancelled') {
      parsedStatus = 'Rider Assigned';
      if (parsedRiderName == null || parsedRiderName.isEmpty) {
        parsedRiderName = 'Delivery Partner';
      }
    }

    if ((json['orderType']?.toString().toLowerCase() == 'pickup' || json['orderType']?.toString().toLowerCase() == 'self_pickup') && (rawStatus == 'ready' || rawStatus == 'preparing')) {
      parsedStatus = rawStatus == 'ready' ? 'Ready for Pickup' : 'Preparing';
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

    final rawOrderType = json['orderType']?.toString().toLowerCase() ?? '';
    final rawDeliveryType = json['deliveryType']?.toString().toLowerCase() ?? '';
    final isPickup = rawOrderType == 'pickup' || rawOrderType == 'self_pickup' || rawDeliveryType == 'pickup' || rawDeliveryType == 'self_pickup' || json['isSelfPickup'] == true;

    String parsedAddress = isPickup ? 'Self Pickup Counter' : 'Customer Delivery Location';

    if (json['deliveryAddress'] != null) {
      if (json['deliveryAddress'] is Map) {
        parsedAddress = json['deliveryAddress']['address'] ?? json['deliveryAddress']['addressLine'] ?? json['deliveryAddress']['street'] ?? json['deliveryAddress']['formattedAddress'] ?? parsedAddress;
      } else {
        parsedAddress = json['deliveryAddress'].toString();
      }
    } else if (json['address'] != null) {
      if (json['address'] is Map) {
        parsedAddress = json['address']['fullAddress'] ?? json['address']['addressLine'] ?? parsedAddress;
      } else {
        parsedAddress = json['address'].toString();
      }
    }

    String parsedPaymentMethod = 'Via Online Payment';
    final rawPay = (json['paymentMethod'] ?? json['paymentMode'] ?? json['paymentType'] ?? '').toString().toLowerCase();
    if (rawPay == 'cod' || rawPay == 'cash_on_delivery' || rawPay == 'cash') {
      parsedPaymentMethod = 'Cash on Delivery';
    } else if (rawPay == 'wallet') {
      parsedPaymentMethod = 'Via Wallet Payment';
    } else if (rawPay.contains('online') || rawPay.contains('upi') || rawPay.contains('razorpay') || rawPay.contains('card') || rawPay == 'paid') {
      parsedPaymentMethod = 'Via Online Payment';
    } else if (json['paymentMethod'] != null && json['paymentMethod'].toString().isNotEmpty) {
      parsedPaymentMethod = json['paymentMethod'].toString();
    }

    double parsedItemTotal = double.tryParse(json['itemTotal']?.toString() ?? '') ?? 0.0;
    double parsedPackagingFee = double.tryParse(json['packagingFee']?.toString() ?? json['packaging']?.toString() ?? '') ?? 0.0;
    double parsedDeliveryFee = double.tryParse(json['deliveryFee']?.toString() ?? json['deliveryCharge']?.toString() ?? '') ?? 0.0;
    double parsedPlatformFee = double.tryParse(json['platformFee']?.toString() ?? '') ?? 0.0;
    double parsedTax = double.tryParse(json['tax']?.toString() ?? json['gst']?.toString() ?? '') ?? 0.0;
    double parsedDiscount = double.tryParse(json['discount']?.toString() ?? json['totalDiscount']?.toString() ?? '') ?? 0.0;

    return Order(
      id: json['orderNumber']?.toString() ??
          json['orderId']?.toString() ??
          (json['_id'] != null && json['_id'].toString().length > 8
              ? 'ORD${json['_id'].toString().substring(json['_id'].toString().length - 4).toUpperCase()}'
              : json['_id']?.toString() ?? 'N/A'),
      backendId: json['_id']?.toString() ?? '',
      customerId: json['customerId']?.toString() ??
          (json['customer'] is Map ? json['customer']['customerId']?.toString() : null),
      customerName: cName,
      orderName: oName,
      quantity: oQty > 0 ? oQty : 1,
      status: parsedStatus,
      totalAmount: parsedAmount,
      itemTotal: parsedItemTotal,
      packagingFee: parsedPackagingFee,
      deliveryFee: parsedDeliveryFee,
      platformFee: parsedPlatformFee,
      tax: parsedTax,
      discount: parsedDiscount,
      restaurantEarning: parsedEarnings,
      pickupOtp: json['pickupOtp']?.toString() ?? json['pickupOTP']?.toString() ?? json['selfPickupCode']?.toString(),
      riderName: parsedRiderName,
      riderId: parsedRiderId,
      riderPhone: parsedRiderPhone,
      items: parsedItems,
      orderType: isPickup ? 'pickup' : (json['orderType']?.toString() ?? 'delivery'),
      paymentMethod: parsedPaymentMethod,
      pickupTime: json['pickupTime']?.toString() ?? json['scheduledAt']?.toString() ?? json['scheduledTime']?.toString(),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      cancellationWindowMinutes: int.tryParse(json['cancellationWindowMinutes']?.toString() ?? '') ?? 5,
      cancellationWindowExpiresAt: json['cancellationWindowExpiresAt'] != null ? DateTime.tryParse(json['cancellationWindowExpiresAt'].toString()) : null,
      gracePeriodMinutes: int.tryParse(json['gracePeriodMinutes']?.toString() ?? '') ?? 15,
      riderAssignedAt: json['riderAssignedAt'] != null ? DateTime.tryParse(json['riderAssignedAt'].toString()) : null,
      riderGracePeriodExpiresAt: json['riderGracePeriodExpiresAt'] != null ? DateTime.tryParse(json['riderGracePeriodExpiresAt'].toString()) : null,
      readyAt: json['readyAt'] != null ? DateTime.tryParse(json['readyAt'].toString()) : null,
      prepTimeMinutes: int.tryParse(json['prepTimeMinutes']?.toString() ?? '') ?? 15,
      bufferTimeMinutes: int.tryParse(json['bufferTimeMinutes']?.toString() ?? '') ?? 0,
      customerArrived: json['customerArrived'] == true,
      customerArrivedAt: json['customerArrivedAt'] != null ? DateTime.tryParse(json['customerArrivedAt'].toString()) : null,
      cancellationReason: json['cancellationReason']?.toString() ?? json['reason']?.toString(),
      address: parsedAddress,
    );
  }
}
