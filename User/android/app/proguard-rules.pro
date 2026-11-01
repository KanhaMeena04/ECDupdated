# Flutter ProGuard Rules
-keep class io.flutter.** { *; }
-dontwarn io.flutter.**

# Google Play Core & Play Services (Referenced by Flutter Deferred Components)
-dontwarn com.google.android.play.core.**
-dontwarn com.google.android.gms.**
-dontwarn androidx.**

# Facebook / Meta App Events ProGuard Rules
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

-keep class com.facebook.** { *; }
-keepclassmembers class com.facebook.** { *; }
-dontwarn com.facebook.**

# Firebase ProGuard Rules
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
