import 'package:flutter/material.dart';
import 'package:ecdkart_app/pages/auth/otp_page.dart';
import 'package:ecdkart_app/pages/auth/verify_google_phone_page.dart';
import 'package:ecdkart_app/pages/auth/register_page.dart';
import 'package:ecdkart_app/pages/category_product/category_products.dart';
import 'package:go_router/go_router.dart';
import '../pages/food_delivery/restraunt_detail_screen.dart';
import '../pages/splash_screen/splash_page.dart';
import '../pages/onboarding/onboarding_page.dart';
import '../pages/auth/login_page.dart';
import '../pages/food_delivery/home_page.dart';
import '../pages/category_selection/categories_page.dart';
import '../pages/cart/cart_page.dart';
import '../pages/order/checkout_page.dart';
import '../pages/order/orders_page.dart';
import '../pages/order/order_details_page.dart';
import '../pages/search/search_page.dart';
import '../pages/profile/location_setup_page.dart';
import '../pages/profile/location_page.dart';
import '../pages/profile/unserviceable_location_page.dart';

class AppRoutes {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String locationSetup = '/location-setup';
  static const String unserviceable = '/unserviceable';
  static const String login = '/login';
  static const String otpPage = '/otp_page';
  static const String verifyGooglePhone = '/verify-google-phone';
  static const String home = '/home';
  static const String restaurantDetail = '/restaurant_detail';
  static const String categoryProduct = '/category_products';
  static const String categories = '/categories';
  static const String productDetail = '/product-detail';
  static const String cart = '/cart';
  static const String checkout = '/checkout';
  static const String orders = '/orders';
  static const String orderDetails = '/order-details';
  static const String profile = '/profile';
  static const String wishlist = '/wishlist';
  static const String search = '/search';
  static const String location = '/location';

  static final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

  static final router = GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: splash,
    routes: [
      GoRoute(
        path: splash,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: onboarding,
        builder: (context, state) => const OnboardingPage(),
      ),
      GoRoute(
        path: locationSetup,
        builder: (context, state) => const LocationSetupPage(),
      ),
      GoRoute(
        path: unserviceable,
        builder: (context, state) => const UnserviceableLocationPage(),
      ),
      GoRoute(
        path: login,
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: otpPage,
        builder: (context, state) => const OtpPage(),
      ),
      GoRoute(
        path: verifyGooglePhone,
        builder: (context, state) {
          final googleUser = state.extra as Map<String, dynamic>? ?? {};
          return VerifyGooglePhonePage(googleUser: googleUser);
        },
      ),
      GoRoute(
        path: '$restaurantDetail/:slug',
        builder: (context, state) {
          final slug = state.pathParameters['slug'] ?? '';
          return RestaurantScreen(slug: slug);
        },
      ),
      GoRoute(
        path: categoryProduct,
        builder: (context, state) => const CategoryProducts(cat: ''),
      ),
      GoRoute(
        path: home,
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: categories,
        builder: (context, state) => const CategoriesPage(),
      ),
      // GoRoute(
      //   path: '$productDetail/:id',
      //   builder: (context, state) {
      //     final id = state.pathParameters['id'] ?? '';
      //     return ProductDetailPage(productId: id);
      //   },
      // ),
      GoRoute(
        path: cart,
        builder: (context, state) => const CartPage(),
      ),
      GoRoute(
        path: checkout,
        builder: (context, state) => const CheckoutPage(),
      ),
      GoRoute(
        path: orders,
        builder: (context, state) => const OrdersPage(),
      ),
      GoRoute(
        path: '$orderDetails/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return OrderDetailsPage(orderId: id);
        },
      ),
      GoRoute(
        path: search,
        builder: (context, state) => const SearchPage(),
      ),
      GoRoute(
        path: location,
        builder: (context, state) => const LocationPage(),
      ),
    ],
  );
}
