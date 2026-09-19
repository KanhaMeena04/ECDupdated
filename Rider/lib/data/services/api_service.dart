import 'dart:developer';
import 'package:image_picker/image_picker.dart';
import 'auth_service.dart';

class ApiService {
  // Flag to toggle mock mode (enabled by default for offline standalone running)
  static bool useMockBackend = true;

  // Mock Active Orders State
  static final List<Map<String, dynamic>> _mockActiveOrders = [
    {
      "_id": "ORD1001",
      "orderId": "ORD1001",
      "customerName": "Rahul Sharma",
      "customerPhone": "+919876543210",
      "deliveryAddress": "Flat 402, Block B, Green Heights, Tech Park Road, Sector 62",
      "restaurantName": "Veggie Delight Restaurant",
      "restaurantAddress": "Shop 12, Main Market, Sector 18",
      "restaurantPhone": "+919811223344",
      "items": [
        {"name": "Paneer Butter Masala", "quantity": 2, "price": 280},
        {"name": "Butter Naan", "quantity": 4, "price": 40},
        {"name": "Jeera Rice", "quantity": 1, "price": 150}
      ],
      "totalAmount": 770.0,
      "paymentMethod": "COD",
      "paymentStatus": "Pending",
      "status": "ASSIGNED",
      "pickupOtp": "1234",
      "deliveryOtp": "5678",
      "createdAt": DateTime.now().subtract(const Duration(minutes: 15)).toIso8601String(),
    },
    {
      "_id": "ORD1002",
      "orderId": "ORD1002",
      "customerName": "Priya Patel",
      "customerPhone": "+919123456789",
      "deliveryAddress": "House #45, Sunshine Enclave, Ring Road",
      "restaurantName": "Spicy Tadka Dhaba",
      "restaurantAddress": "Plot 88, Near Metro Pillar 120",
      "restaurantPhone": "+919899887766",
      "items": [
        {"name": "Veg Biryani Large", "quantity": 1, "price": 320},
        {"name": "Raita", "quantity": 1, "price": 60}
      ],
      "totalAmount": 380.0,
      "paymentMethod": "ONLINE",
      "paymentStatus": "PAID",
      "status": "PICKED_UP",
      "pickupOtp": "4321",
      "deliveryOtp": "8765",
      "createdAt": DateTime.now().subtract(const Duration(minutes: 25)).toIso8601String(),
    }
  ];

  // ==================== AUTH ENDPOINTS ====================

  static Future<Map<String, dynamic>> sendOtp(String phone) async {
    log("📱 [MOCK API] Send OTP to +91$phone");
    await Future.delayed(const Duration(milliseconds: 300));
    return {"success": true, "message": "OTP sent successfully to +91$phone"};
  }

  static Future<Map<String, dynamic>> verifyOtp(
    String phone,
    String otp, {
    String? pin,
  }) async {
    log("🔐 [MOCK API] Verify OTP for +91$phone");
    await Future.delayed(const Duration(milliseconds: 300));
    await AuthService.saveTokens("mock_access_token_12345", "mock_refresh_token_12345", phone, hasPin: pin != null && pin.isNotEmpty);
    return {
      "success": true,
      "data": {
        "token": "mock_access_token_12345",
        "refreshToken": "mock_refresh_token_12345",
        "user": {
          "id": "RIDER_001",
          "name": "Rider Partner",
          "phone": "+91$phone",
          "role": "driver",
          "isVerified": true,
        }
      }
    };
  }

  static Future<Map<String, dynamic>> loginWithPin(
    String phone,
    String pin,
  ) async {
    log("🔑 [MOCK API] Login with PIN for +91$phone");
    await Future.delayed(const Duration(milliseconds: 300));
    await AuthService.saveTokens("mock_access_token_12345", "mock_refresh_token_12345", phone, hasPin: true);
    return {
      "success": true,
      "data": {
        "token": "mock_access_token_12345",
        "refreshToken": "mock_refresh_token_12345",
        "user": {
          "id": "RIDER_001",
          "name": "Rider Partner",
          "phone": "+91$phone",
          "role": "driver",
          "isVerified": true,
        }
      }
    };
  }

  static Future<Map<String, dynamic>> getProfile() async {
    log("👤 [MOCK API] Get Profile");
    return {
      "success": true,
      "data": {
        "id": "RIDER_001",
        "name": "Rider Partner",
        "phone": "+919876543210",
        "email": "rider@ecd.com",
        "isOnline": true,
        "isVerified": true,
        "upi": "rider@upi",
        "vehicleType": "Bike",
        "vehicleNumber": "DL 01 AB 1234",
        "rating": 4.8,
        "totalOrders": 142,
      }
    };
  }

  // ==================== DRIVER ENDPOINTS ====================

  static Future<Map<String, dynamic>> toggleOnlineStatus(bool isOnline) async {
    log("🔄 [MOCK API] Toggle Online Status: $isOnline");
    await Future.delayed(const Duration(milliseconds: 200));
    return {"success": true, "isOnline": isOnline};
  }

  static Future<Map<String, dynamic>> markReachedStore() async {
    log("🏪 [MOCK API] Mark Reached Store");
    await Future.delayed(const Duration(milliseconds: 200));
    return {"success": true, "message": "Reached store status updated"};
  }

  static Future<Map<String, dynamic>> updateLocation({
    required double latitude,
    required double longitude,
    double? speed,
    double? heading,
  }) async {
    return {"success": true};
  }

  // ==================== ORDER ENDPOINTS ====================

  static Future<Map<String, dynamic>> getActiveOrders() async {
    log("📦 [MOCK API] Get Active Orders");
    return {
      "success": true,
      "data": _mockActiveOrders,
    };
  }

  static Future<Map<String, dynamic>> getOrderHistory() async {
    log("📜 [MOCK API] Get Order History");
    return {
      "success": true,
      "data": [
        {
          "_id": "ORD0999",
          "orderId": "ORD0999",
          "customerName": "Amit Verma",
          "restaurantName": "Veggie Delight",
          "totalAmount": 540.0,
          "status": "DELIVERED",
          "deliveredAt": DateTime.now().subtract(const Duration(hours: 3)).toIso8601String(),
        },
        {
          "_id": "ORD0998",
          "orderId": "ORD0998",
          "customerName": "Neha Gupta",
          "restaurantName": "Pizza Express",
          "totalAmount": 620.0,
          "status": "DELIVERED",
          "deliveredAt": DateTime.now().subtract(const Duration(hours: 5)).toIso8601String(),
        }
      ],
    };
  }

  static Future<Map<String, dynamic>> getOrderDetails(String orderId) async {
    log("🔍 [MOCK API] Get Order Details for $orderId");
    final match = _mockActiveOrders.firstWhere(
      (o) => o['_id'] == orderId || o['orderId'] == orderId,
      orElse: () => {
        "_id": orderId,
        "orderId": orderId,
        "customerName": "Customer",
        "customerPhone": "+919876543210",
        "deliveryAddress": "123 Sample Street, City Center",
        "restaurantName": "Sample Restaurant",
        "restaurantAddress": "456 Market Road",
        "restaurantPhone": "+919876500000",
        "items": [
          {"name": "Sample Dish", "quantity": 1, "price": 200}
        ],
        "totalAmount": 200.0,
        "paymentMethod": "COD",
        "paymentStatus": "Pending",
        "status": "ASSIGNED",
        "pickupOtp": "1234",
        "deliveryOtp": "5678",
      },
    );
    return {"success": true, "data": match};
  }

  static Future<Map<String, dynamic>> updateOrderStatus({
    required String orderId,
    required String status,
    String? otp,
  }) async {
    log("🔄 [MOCK API] Update Order Status $orderId -> $status");
    for (var order in _mockActiveOrders) {
      if (order['_id'] == orderId || order['orderId'] == orderId) {
        order['status'] = status;
      }
    }
    return {"success": true, "message": "Order status updated to $status"};
  }

  static Future<Map<String, dynamic>> sendPickupOtp(String orderId) async {
    log("📲 [MOCK API] Send Pickup OTP for $orderId");
    return {"success": true, "otp": "1234", "message": "Pickup OTP sent"};
  }

  static Future<Map<String, dynamic>> sendDeliveryOtp(String orderId) async {
    log("📲 [MOCK API] Send Delivery OTP for $orderId");
    return {"success": true, "otp": "5678", "message": "Delivery OTP sent"};
  }

  static Future<Map<String, dynamic>> completeDeliveryWithOTP({
    required String orderId,
    required String otp,
  }) async {
    log("✅ [MOCK API] Complete Delivery for $orderId");
    _mockActiveOrders.removeWhere((o) => o['_id'] == orderId || o['orderId'] == orderId);
    return {"success": true, "message": "Delivery completed successfully!"};
  }

  static Future<Map<String, dynamic>> acceptOrder(String orderId) async {
    log("👍 [MOCK API] Accept Order $orderId");
    return {"success": true, "message": "Order accepted"};
  }

  static Future<Map<String, dynamic>> declineOrder(String orderId, {String? reason}) async {
    log("👎 [MOCK API] Decline Order $orderId");
    _mockActiveOrders.removeWhere((o) => o['_id'] == orderId || o['orderId'] == orderId);
    return {"success": true, "message": "Order declined"};
  }

  static Future<Map<String, dynamic>> getDriverSummary() async {
    log("📊 [MOCK API] Get Driver Summary");
    return {
      "success": true,
      "data": {
        "todayEarnings": 1250.0,
        "completedOrders": 12,
        "activeHours": 6.5,
        "rating": 4.8,
      }
    };
  }

  static Future<Map<String, dynamic>> uploadDriverDocuments({
    required String name,
    required String upi,
    String? email,
    XFile? profileImage,
    XFile? aadharFront,
    XFile? aadharBack,
    XFile? license,
  }) async {
    log("📄 [MOCK API] Upload Driver Documents for $name");
    await Future.delayed(const Duration(milliseconds: 300));
    return {"success": true, "message": "Documents uploaded successfully"};
  }

  static Future<Map<String, dynamic>> getWalletSummary() async {
    log("💼 [MOCK API] Get Wallet Summary");
    return {
      "success": true,
      "data": {
        "balance": 1850.0,
        "billable_hours": "6.5",
        "today_orders": 12,
        "recent_requests": [
          {
            "id": "WREQ01",
            "amount": 500.0,
            "status": "APPROVED",
            "date": DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
          }
        ]
      },
      "wallet": {
        "availableBalance": 1850.0,
        "cashInHand": 450.0,
        "cashLimit": 2000.0,
        "isFrozen": false,
        "totalEarnings": 4500.0,
        "transactions": [
          {
            "id": "TXN101",
            "title": "Delivery Commission #ORD1001",
            "amount": 75.0,
            "type": "CREDIT",
            "date": "Today, 02:30 PM",
          }
        ]
      }
    };
  }

  static Future<Map<String, dynamic>> getCodBalance() async {
    log("💰 [MOCK API] Get COD Balance");
    return {
      "success": true,
      "data": {
        "codBalance": 450.0,
        "codEarnings": 4500.0,
        "amountToPay": 450.0,
      }
    };
  }

  static Future<Map<String, dynamic>> requestWithdrawal(double amount) async {
    log("💸 [MOCK API] Request Withdrawal ₹$amount");
    await Future.delayed(const Duration(milliseconds: 300));
    return {"success": true, "message": "Withdrawal request submitted successfully"};
  }

  static Future<Map<String, dynamic>> confirmCodCollection({
    required String orderId,
    required double amountCollected,
  }) async {
    log("💵 [MOCK API] Confirm COD Collection for $orderId: ₹$amountCollected");
    return {"success": true, "message": "COD payment recorded successfully"};
  }

  static Future<Map<String, dynamic>> deleteAccount() async {
    log("🗑️ [MOCK API] Delete Account");
    return {"success": true, "message": "Account deleted successfully"};
  }
}
