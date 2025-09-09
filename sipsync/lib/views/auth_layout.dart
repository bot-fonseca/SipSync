import 'package:flutter/material.dart';
import 'package:sipsync/views/auth_services.dart';
import 'package:sipsync/views/pages/welcome_page.dart';
import 'package:sipsync/views/pages/appLoading_page.dart';
import 'package:sipsync/views/widget_tree.dart';

class AuthLayout extends StatelessWidget {
  const AuthLayout({super.key, this.pageIfNotConnected});

  final Widget? pageIfNotConnected;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: authServicesNotifier,
      builder: (context, authServicesNotifier, child) {
        return StreamBuilder(
          stream: authServicesNotifier.authStateChanges,
          builder: (context, snapshot) {
            Widget widget;
            if (snapshot.connectionState == ConnectionState.waiting) {
              widget = const AppLoadingPage();
            } else if (snapshot.hasData) {
              widget = const WidgetTree();
            } else {
              widget = pageIfNotConnected ?? const WelcomePage();
            }
            return widget;
          },
        );
      },
    );
  }
}
