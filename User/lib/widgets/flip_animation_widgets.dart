import 'dart:math' as math;
import 'package:flutter/material.dart';

/// 3D Flip Page Route Transition for Screen Switching
class FlipPageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;

  FlipPageRoute({
    required this.page,
    Duration duration = const Duration(milliseconds: 550),
  }) : super(
          transitionDuration: duration,
          reverseTransitionDuration: const Duration(milliseconds: 450),
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final flipAnimation = Tween<double>(begin: math.pi / 2, end: 0.0).animate(
              CurvedAnimation(
                parent: animation,
                curve: Curves.easeOutCubic,
              ),
            );

            final fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
              CurvedAnimation(
                parent: animation,
                curve: const Interval(0.2, 1.0, curve: Curves.easeOut),
              ),
            );

            return AnimatedBuilder(
              animation: animation,
              builder: (context, child) {
                return Transform(
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.001) // 3D perspective
                    ..rotateY(-flipAnimation.value),
                  alignment: Alignment.center,
                  child: FadeTransition(
                    opacity: fadeAnimation,
                    child: child,
                  ),
                );
              },
              child: child,
            );
          },
        );
}

/// Interactive 3D Flip Animation Wrapper for Add Item Buttons & Cards
class FlipAddItemWrapper extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;

  const FlipAddItemWrapper({
    Key? key,
    required this.child,
    this.onTap,
  }) : super(key: key);

  @override
  State<FlipAddItemWrapper> createState() => _FlipAddItemWrapperState();
}

class _FlipAddItemWrapperState extends State<FlipAddItemWrapper>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _flipAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _flipAnimation = Tween<double>(begin: 0.0, end: 2 * math.pi).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutBack),
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween<double>(begin: 1.0, end: 1.18), weight: 45),
      TweenSequenceItem(tween: Tween<double>(begin: 1.18, end: 1.0), weight: 55),
    ]).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _triggerFlip() {
    _controller.forward(from: 0.0);
    if (widget.onTap != null) {
      widget.onTap!();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _triggerFlip,
      behavior: HitTestBehavior.opaque,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform(
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.001) // 3D perspective
              ..scale(_scaleAnimation.value)
              ..rotateY(_flipAnimation.value),
            alignment: Alignment.center,
            child: widget.child,
          );
        },
      ),
    );
  }
}
