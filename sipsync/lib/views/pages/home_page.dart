import 'package:flutter/material.dart';
import 'package:sipsync/views/widgets/container_widget.dart';
import 'package:sipsync/views/widgets/hero_widget.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: SingleChildScrollView(
        child: Column(
          children: [
            HeroWidget(title: 'Home'),
            ContainerWidget(
              title: 'Welcome to SipSync!',
              description: 'Description typeee',
            ),
            ContainerWidget(
              title: 'Welcome to SipSync!',
              description: 'Description typeee',
            ),
            ContainerWidget(
              title: 'Welcome to SipSync!',
              description: 'Description typeee',
            ),
            ContainerWidget(
              title: 'Welcome to SipSync!',
              description: 'Description typeee',
            ),
            ContainerWidget(
              title: 'Welcome to SipSync!',
              description: 'Description typeee',
            ),
          ],
        ),
      ),
    );
  }
}
