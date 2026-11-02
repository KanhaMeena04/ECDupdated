# Flutter ProGuard Rules
-keep class io.flutter.** { *; }
-dontwarn io.flutter.**

# Google Play Core & Play Services
-dontwarn com.google.android.play.core.**
-dontwarn com.google.android.gms.**
-dontwarn androidx.**

# Razorpay ProGuard Rules
-keep class com.razorpay.** { *; }
-dontwarn com.razorpay.**

# Firebase ProGuard Rules
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

